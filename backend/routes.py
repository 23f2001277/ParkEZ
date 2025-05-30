from flask import Blueprint, request, jsonify, session, render_template, g, current_app, send_file, make_response
from flask_login import login_user
from sqlalchemy import func, desc, and_, or_
from flask_security import roles_required, hash_password, verify_password, auth_required, current_user
from .models import db, User, Role, ParkingLot, ParkingSpot, Reservation
from flask import Flask, redirect, url_for, flash
from flask import current_app as app
from werkzeug.security import generate_password_hash, check_password_hash 
from functools import wraps
from datetime import datetime, timedelta 
from .extensions import cache
import calendar
from backend.celery.tasks import create_user_csv
from celery.result import AsyncResult

routes_app = Blueprint('routes_app', __name__)
# cache = app.cache

def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'message': 'Token is missing'}), 401
        
        token = auth_header.split(' ')[1]
        user = User.query.filter_by(fs_uniquifier=token).first()
        if not user:
            return jsonify({'message': 'Token is invalid'}), 401
        g.current_user = user
        return f(*args, **kwargs)
    return decorated_function

@routes_app.route('/', methods=['GET'])
def home():
    return render_template('index.html')

@routes_app.route('/celery')
def celery():
    task = add.delay(10,20)
    return {'task_id': task.id}

@routes_app.route('/api/user-csv-export', methods=['POST'])
@token_required
def trigger_user_csv_export():
    user_id = g.current_user.id
    task = create_user_csv.delay(user_id)
    return jsonify({'task_id': task.id}), 202

@routes_app.route('/api/user-csv-export/<task_id>', methods=['GET'])
@token_required
def get_user_csv_export(task_id):
    result = AsyncResult(task_id)
    if result.ready() and result.successful():
        filename = result.result
        filepath = f'./backend/celery/user-downloads/{filename}'
        return send_file(filepath, as_attachment=True)
    else:
        return jsonify({'status': 'pending'}), 202

@routes_app.route('/cache')
@cache.cached(timeout=5)
def cache_time():
    return {'time' : str(datetime.now())}
    
from flask import Blueprint, jsonify
from backend.celery.tasks import send_monthly_activity_reports

test_bp = Blueprint('test', __name__)

@test_bp.route('/test-monthly-report')
def test_monthly_report():
    send_monthly_activity_reports.delay()
    return jsonify({"status": "Monthly report task triggered!"})



@routes_app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "Invalid email"}), 401
    if check_password_hash(user.password, password):
        token = user.fs_uniquifier
        return jsonify({"token": token, "email": user.email, "roles": user.roles[0].name, "id": user.id})
    return jsonify({"message": "Invalid password"}), 401

@routes_app.route('/logout', methods=['POST'])
def logout():
    try:
        session.pop('user_id', None)
        session.pop('user_role', None)
        return jsonify({"message": "Logged out successfully"}), 200
    except Exception as e:
        print("Error during logout:", str(e))
        return jsonify({"error": "An error occurred during logout"}), 500

@routes_app.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    address = data.get('address')
    phone_number = data.get('phone_number')
    vehicle_number = data.get('vehicle_number')  # Optional field
    age = data.get('age')

    if not email or not password or not full_name or not address or not phone_number or not age:
        return jsonify({"message": "All fields are required"}), 400

    try:
        age = int(age)
    except ValueError:
        return jsonify({"message": "Age must be a number"}), 400

    if age < 18:
        return jsonify({"message": "You must be at least 18 years old to register"}), 400

    customer = User.query.filter_by(email=email).first()
    if customer:
        return jsonify({"message": "User already exists"}), 409

    role_obj = Role.query.filter_by(name='user').first()
    if not role_obj:
        return jsonify({"message": "User role not found"}), 500

    try:
        new_customer = User(
            email=email,
            password=generate_password_hash(password),
            full_name=full_name,
            address=address,
            phone_number=phone_number,
            vehicle_number=vehicle_number, 
            age=age,
            active=True,
            roles=[role_obj]
        )
        db.session.add(new_customer)
        db.session.commit()
        return jsonify({"message": "User registered successfully"}), 200

    except Exception as e:
        db.session.rollback()
        print("Error during registration:", str(e))
        return jsonify({"message": "Internal server error"}), 500

@routes_app.route('/admin', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def admin_dashboard():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    lots = ParkingLot.query.all()
    lot_data = []
    for lot in lots:
        spots = ParkingSpot.query.filter_by(lot_id=lot.id).all()
        spot_data = [spot.to_dict() for spot in spots]
        lot_data.append({"lot": lot.to_dict(), "spots": spot_data})
    return jsonify(lot_data), 200

@routes_app.route('/api/registered-users', methods=['GET'])
@token_required
def get_registered_users():
    user = g.current_user
    if not any(role.name == 'admin' for role in user.roles):
        return jsonify({'error': 'Admin access required'}), 403
    users = User.query.all()
    user_list = []
    for user in users:
        user_list.append({
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'phone_number': user.phone_number,
            'vehicle_number': user.vehicle_number,
            'address': user.address,
            'age': user.age,
            'active': user.active,
            'roles': [{'id': r.id, 'name': r.name} for r in user.roles]
        })
    return jsonify({'users': user_list}), 200

@routes_app.route('/customer', methods=['GET'])
@token_required
def user_dashboard():
    try:
        if not hasattr(g, 'current_user') or not g.current_user:
            return jsonify({"error": "Authentication error"}), 401

        user = g.current_user
        return jsonify({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "address": user.address,
            "vehicle_number": user.vehicle_number,
            "age": user.age,
        }), 200

    except Exception as e:
        print("Error in user_dashboard:", str(e))
        return jsonify({"error": "Failed to load user profile"}), 500

@routes_app.route('/debug/routes', methods=['GET'])
def debug_routes():
    from flask import current_app
    routes = []
    for rule in current_app.url_map.iter_rules():
        routes.append({
            'endpoint': rule.endpoint,
            'methods': list(rule.methods),
            'rule': str(rule)
        })
    return jsonify(routes)

@routes_app.route('/api/profile/<int:user_id>', methods=['GET'])
@token_required
def get_profile(user_id):
    if not hasattr(g, 'current_user') or g.current_user.id != user_id:
        return jsonify({"error": "Unauthorized access"}), 403

    user = g.current_user
    return jsonify({
        "email": user.email,
        "full_name": user.full_name,
        "phone_number": user.phone_number,
        "vehicle_number": getattr(user, 'vehicle_number', None),
        "address": user.address,
        "age": user.age
    }), 200

@routes_app.route('/api/profile/<int:user_id>', methods=['POST'])
@token_required
def update_profile(user_id):
    if not hasattr(g, 'current_user') or g.current_user.id != user_id:
        return jsonify({"error": "Unauthorized access"}), 403

    data = request.get_json()
    user = g.current_user

    user.email = data.get('email', user.email)
    if data.get('password'):
        user.password = generate_password_hash(data['password'])
    user.full_name = data.get('full_name', user.full_name)
    user.phone_number = data.get('phone_number', user.phone_number)
    if hasattr(user, 'vehicle_number'):
        user.vehicle_number = data.get('vehicle_number', user.vehicle_number)
    user.address = data.get('address', user.address)
    user.age = data.get('age', user.age)

    try:
        db.session.commit()
        return jsonify({"message": "Profile updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        print("Error updating profile:", str(e))
        return jsonify({"error": "Failed to update profile"}), 500

@routes_app.route('/api/parkinglots/search', methods=['GET'])
@token_required
def search_parking_lots():
    query = request.args.get('q', '').strip().lower()
    search_type = request.args.get('type', 'all')
    lots_query = ParkingLot.query

    if query:
        if search_type == 'name':
            lots_query = lots_query.filter(ParkingLot.prime_location_name.ilike(f'%{query}%'))
        elif search_type == 'address':
            lots_query = lots_query.filter(ParkingLot.address.ilike(f'%{query}%'))
        elif search_type == 'pincode':
            lots_query = lots_query.filter(ParkingLot.pincode.ilike(f'%{query}%'))
        else:  # all
            lots_query = lots_query.filter(
                (ParkingLot.prime_location_name.ilike(f'%{query}%')) |
                (ParkingLot.address.ilike(f'%{query}%')) |
                (ParkingLot.pincode.ilike(f'%{query}%'))
            )
    lots = lots_query.all()
    return jsonify([{
        'id': lot.id,
        'prime_location_name': lot.prime_location_name,
        'address': lot.address,
        'pincode': lot.pincode,
        'number_of_spots': lot.number_of_spots
    } for lot in lots])

@routes_app.route('/api/parkinglots', methods=['GET'])
@cache.cached(timeout=10)
def get_all_parking_lots():
    try:
        lots = ParkingLot.query.all()
        lot_data = []
        for lot in lots:
            available_spots = ParkingSpot.query.filter_by(
                lot_id=lot.id, 
                status='A'
            ).count()
            lot_dict = lot.to_dict() if hasattr(lot, 'to_dict') else {
                'id': lot.id,
                'prime_location_name': lot.prime_location_name,
                'address': lot.address,
                'pincode': lot.pincode,
                'number_of_spots': lot.number_of_spots
            }
            lot_dict['available_spots'] = available_spots
            lot_data.append(lot_dict)
        return jsonify(lot_data), 200
    except Exception as e:
        print("Error fetching parking lots:", str(e))
        return jsonify({"error": "Failed to fetch parking lots"}), 500

@routes_app.route('/api/parkinglots/<int:lot_id>', methods=['GET'])
@token_required
@cache.memoize(timeout=10)
def get_parking_lot_by_id(lot_id):
    print("Current user roles:", [role.name for role in g.current_user.roles])
    try:
        lot = ParkingLot.query.get(lot_id)
        if not lot:
            return jsonify({"error": "Parking lot not found"}), 404
        available_spots = ParkingSpot.query.filter_by(
            lot_id=lot.id, 
            status='A'
        ).count()
        lot_data = lot.to_dict() if hasattr(lot, 'to_dict') else {
            'id': lot.id,
            'prime_location_name': lot.prime_location_name,
            'address': lot.address,
            'pincode': lot.pincode,
            'number_of_spots': lot.number_of_spots
        }
        lot_data['available_spots'] = available_spots
        return jsonify(lot_data), 200
        print("Current user roles:", [role.name for role in g.current_user.roles])
    except Exception as e:
        print("Error fetching parking lot:", str(e))
        return jsonify({"error": "Failed to fetch parking lot"}), 500

@routes_app.route('/api/parkingspots/available', methods=['GET'])
@token_required
def get_available_spots_updated():
    try:
        lot_id = request.args.get('lot_id')
        query = ParkingSpot.query.filter_by(status='A')
        if lot_id:
            query = query.filter_by(lot_id=int(lot_id))
        spots = query.all()
        spot_data = []
        for spot in spots:
            spot_dict = spot.to_dict() if hasattr(spot, 'to_dict') else {
                'id': spot.id,
                'spot_number': spot.spot_number,
                'lot_id': spot.lot_id,
                'status': spot.status
            }
            spot_data.append(spot_dict)
        return jsonify(spot_data), 200
    except Exception as e:
        print("Error fetching available spots:", str(e))
        return jsonify({"error": "Failed to fetch available spots"}), 500

@routes_app.route('/api/bookings', methods=['POST'])
@token_required
def create_booking():
    try:
        data = request.get_json()
        required_fields = ['spot_id', 'user_id', 'vehicle_number']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400
        spot = ParkingSpot.query.get(data['spot_id'])
        if not spot:
            return jsonify({"error": "Parking spot not found"}), 404
        if spot.status != 'A':
            return jsonify({"error": "Parking spot is not available"}), 400
        reservation = Reservation(
            spot_id=data['spot_id'],
            user_id=data['user_id'],
            vehicle_number=data['vehicle_number'],
            parking_timestamp=datetime.now()
        )
        spot.status = 'O'
        db.session.add(reservation)
        db.session.commit()
        return jsonify({
            "message": "Booking created successfully",
            "booking_id": reservation.id
        }), 201
    except Exception as e:
        db.session.rollback()
        print("Error creating booking:", str(e))
        import traceback; traceback.print_exc()
        return jsonify({"error": "Failed to create booking"}), 500

@routes_app.route('/api/bookings/user/<int:user_id>', methods=['GET'])
@token_required
def get_user_bookings(user_id):
    try:
        if not hasattr(g, 'current_user') or g.current_user.id != user_id:
            return jsonify({"error": "Unauthorized access"}), 403
        bookings = Reservation.query.filter_by(user_id=user_id).order_by(
            Reservation.parking_timestamp.desc()
        ).all()
        booking_data = []
        for booking in bookings:
            lot_id = booking.spot.lot_id if booking.spot else None
            status = 'R' if booking.leaving_timestamp else 'A'
            booking_dict = {
                'id': booking.id,
                'spot_id': booking.spot_id,
                'lot_id': lot_id,
                'user_id': booking.user_id,
                'vehicle_number': getattr(booking, 'vehicle_number', ''),
                'created_at': booking.parking_timestamp.isoformat() if booking.parking_timestamp else None,
                'parking_timestamp': booking.parking_timestamp.isoformat() if booking.parking_timestamp else None,
                'leaving_timestamp': booking.leaving_timestamp.isoformat() if booking.leaving_timestamp else None,
                'parking_cost': booking.parking_cost,
                'status': status 
            }
            booking_data.append(booking_dict)
        return jsonify(booking_data), 200
    except Exception as e:
        print("Error fetching user bookings:", str(e))
        import traceback; traceback.print_exc()
        return jsonify({"error": "Failed to fetch bookings"}), 500

@routes_app.route('/api/bookings/<int:booking_id>', methods=['GET'])
@token_required
def get_booking_by_id(booking_id):
    try:
        booking = Reservation.query.get(booking_id)
        if not booking:
            return jsonify({"error": "Booking not found"}), 404
        if not hasattr(g, 'current_user') or g.current_user.id != booking.user_id:
            return jsonify({"error": "Unauthorized access"}), 403
        lot_id = booking.spot.lot_id if booking.spot else None
        booking_dict = {
            'id': booking.id,
            'spot_id': booking.spot_id,
            'lot_id': lot_id,
            'user_id': booking.user_id,
            'vehicle_number': getattr(booking, 'vehicle_number', ''),
            'created_at': booking.parking_timestamp.isoformat() if booking.parking_timestamp else None,
            'parking_timestamp': booking.parking_timestamp.isoformat() if booking.parking_timestamp else None,
            'leaving_timestamp': booking.leaving_timestamp.isoformat() if booking.leaving_timestamp else None,
            'parking_cost': booking.parking_cost,
            'status': 'R' if booking.leaving_timestamp else 'A'
        }
        return jsonify(booking_dict), 200
    except Exception as e:
        print("Error fetching booking:", str(e))
        return jsonify({"error": "Failed to fetch booking"}), 500

@routes_app.route('/api/spotdetails/<int:spot_id>', methods=['GET'])
@token_required
def get_spot_details(spot_id):
    spot = ParkingSpot.query.get(spot_id)
    if not spot:
        return jsonify({"error": "Spot not found"}), 404

    # Find the latest active reservation for this spot
    booking = Reservation.query.filter_by(spot_id=spot_id).order_by(Reservation.parking_timestamp.desc()).first()
    if not booking or booking.leaving_timestamp is not None:
        return jsonify({"error": "Spot is not currently occupied"}), 404

    user = User.query.get(booking.user_id)
    lot = ParkingLot.query.get(spot.lot_id)
    # Calculate estimated cost (if needed)
    time_in = booking.parking_timestamp
    now = datetime.now()
    hours = max(1, int((now - time_in).total_seconds() // 3600))
    estimated_cost = (lot.price if lot and hasattr(lot, 'price') else 0) * hours

    return jsonify({
        "id": spot.id,
        "customer_id": user.id if user else None,
        "vehicle_number": booking.vehicle_number,
        "time_in": time_in.strftime("%Y-%m-%d %H:%M:%S") if time_in else "",
        "estimated_cost": estimated_cost
    }), 200

@routes_app.route('/api/bookings/<int:booking_id>/release', methods=['PUT'])
@token_required
def release_booking(booking_id):
    try:
        booking = Reservation.query.get(booking_id)
        if not booking:
            return jsonify({"error": "Booking not found"}), 404
        if not hasattr(g, 'current_user') or g.current_user.id != booking.user_id:
            return jsonify({"error": "Unauthorized access"}), 403
        data = request.get_json()
        booking.leaving_timestamp = datetime.now()
        spot = ParkingSpot.query.get(booking.spot_id)
        lot = ParkingLot.query.get(spot.lot_id) if spot else None

        # Set parking_cost
        if data and 'total_cost' in data:
            booking.parking_cost = float(data['total_cost'])
        elif booking.parking_timestamp and lot:
            duration_hours = (booking.leaving_timestamp - booking.parking_timestamp).total_seconds() / 3600
            price = lot.price
            cost = max(1, int(duration_hours)) * price
            booking.parking_cost = cost

        if spot:
            spot.status = 'A'
        db.session.commit()
        return jsonify({"message": "Booking released successfully"}), 200
    except Exception as e:
        db.session.rollback()
        print("Error releasing booking:", str(e))
        return jsonify({"error": "Failed to release booking"}), 500


@routes_app.route('/api/user-summary/<int:user_id>', methods=['GET'])
@token_required
# @cache.memoize(timeout=10)
def get_user_summary(user_id):
    try:
        # Verify user access
        if not hasattr(g, 'current_user') or g.current_user.id != user_id:
            return jsonify({"error": "Unauthorized access"}), 403
        
        # Get period parameter (days)
        period = request.args.get('period', '30')
        
        # Calculate date range
        if period == 'all':
            start_date = None
        else:
            days = int(period)
            start_date = datetime.now() - timedelta(days=days)
        
        # Build base query for user's reservations
        base_query = Reservation.query.filter_by(user_id=user_id)
        if start_date:
            base_query = base_query.filter(Reservation.parking_timestamp >= start_date)
        
        # Get all reservations for analysis
        reservations = base_query.all()
        
        # Generate summary data
        summary_data = {
            'overview': _calculate_overview(reservations),
            'expenditureByLot': _calculate_expenditure_by_lot(reservations),
            'timeByLot': _calculate_time_by_lot(reservations),
            'recentSessions': _get_recent_sessions(reservations),
            'statistics': _calculate_statistics(reservations),
            'trends': _calculate_trends(reservations, period),
            'period': period,
            'dateRange': {
                'start': start_date.isoformat() if start_date else None,
                'end': datetime.now().isoformat()
            }
        }
        
        return jsonify(summary_data), 200
        
    except Exception as e:
        print(f"Error generating user summary: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to generate summary"}), 500

def _calculate_overview(reservations):
    """Calculate overview statistics"""
    total_expenditure = 0
    total_hours = 0
    total_sessions = len(reservations)
    location_counts = {}
    
    for reservation in reservations:
        # Calculate cost
        if reservation.parking_cost:
            total_expenditure += reservation.parking_cost
        elif reservation.parking_timestamp and reservation.leaving_timestamp:
            # Calculate based on duration and lot price
            duration_hours = (reservation.leaving_timestamp - reservation.parking_timestamp).total_seconds() / 3600
            if reservation.spot and reservation.spot.lot:
                lot_price = getattr(reservation.spot.lot, 'price', 10)  # Default price
                total_expenditure += max(1, int(duration_hours)) * lot_price
        
        # Calculate time
        if reservation.parking_timestamp and reservation.leaving_timestamp:
            duration = (reservation.leaving_timestamp - reservation.parking_timestamp).total_seconds() / 3600
            total_hours += duration
        
        # Track favorite location
        if reservation.spot and reservation.spot.lot:
            lot_name = reservation.spot.lot.prime_location_name
            location_counts[lot_name] = location_counts.get(lot_name, 0) + 1
    
    favorite_spot = max(location_counts.items(), key=lambda x: x[1])[0] if location_counts else None
    
    return {
        'totalExpenditure': round(total_expenditure, 2),
        'totalHours': round(total_hours, 2),
        'totalSessions': total_sessions,
        'favoriteSpot': favorite_spot
    }

def _calculate_expenditure_by_lot(reservations):
    """Calculate expenditure breakdown by parking lot"""
    lot_data = {}
    total_spent = 0
    
    for reservation in reservations:
        if not reservation.spot or not reservation.spot.lot:
            continue
            
        lot = reservation.spot.lot
        lot_key = f"{lot.id}_{lot.prime_location_name}"
        
        if lot_key not in lot_data:
            lot_data[lot_key] = {
                'lotName': lot.prime_location_name,
                'location': lot.address,
                'totalSpent': 0,
                'sessions': 0
            }
        
        # Calculate cost for this reservation
        cost = 0
        if reservation.parking_cost:
            cost = reservation.parking_cost
        elif reservation.parking_timestamp and reservation.leaving_timestamp:
            duration_hours = (reservation.leaving_timestamp - reservation.parking_timestamp).total_seconds() / 3600
            lot_price = getattr(lot, 'price', 10)
            cost = max(1, int(duration_hours)) * lot_price
        
        lot_data[lot_key]['totalSpent'] += cost
        lot_data[lot_key]['sessions'] += 1
        total_spent += cost
    
    # Calculate percentages and averages
    result = []
    for lot_info in lot_data.values():
        lot_info['avgPerSession'] = lot_info['totalSpent'] / lot_info['sessions'] if lot_info['sessions'] > 0 else 0
        lot_info['percentage'] = (lot_info['totalSpent'] / total_spent * 100) if total_spent > 0 else 0
        result.append(lot_info)
    
    # Sort by total spent descending
    return sorted(result, key=lambda x: x['totalSpent'], reverse=True)

def _calculate_time_by_lot(reservations):
    """Calculate time spent breakdown by parking lot"""
    lot_data = {}
    
    for reservation in reservations:
        if not reservation.spot or not reservation.spot.lot:
            continue
        if not reservation.parking_timestamp or not reservation.leaving_timestamp:
            continue
            
        lot = reservation.spot.lot
        lot_key = f"{lot.id}_{lot.prime_location_name}"
        
        if lot_key not in lot_data:
            lot_data[lot_key] = {
                'lotName': lot.prime_location_name,
                'totalHours': 0,
                'sessions': 0,
                'hourlyPattern': [0] * 24  # 24-hour usage pattern
            }
        
        # Calculate duration
        duration_hours = (reservation.leaving_timestamp - reservation.parking_timestamp).total_seconds() / 3600
        lot_data[lot_key]['totalHours'] += duration_hours
        lot_data[lot_key]['sessions'] += 1
        
        # Track hourly usage pattern
        start_hour = reservation.parking_timestamp.hour
        lot_data[lot_key]['hourlyPattern'][start_hour] += 1
    
    # Calculate averages and usage patterns
    result = []
    for lot_info in lot_data.values():
        if lot_info['sessions'] > 0:
            lot_info['avgDuration'] = lot_info['totalHours'] / lot_info['sessions']
            
            # Determine usage pattern
            peak_hour = lot_info['hourlyPattern'].index(max(lot_info['hourlyPattern']))
            if 6 <= peak_hour <= 10:
                pattern = "Morning Rush"
            elif 11 <= peak_hour <= 15:
                pattern = "Midday"
            elif 16 <= peak_hour <= 20:
                pattern = "Evening Rush"
            else:
                pattern = "Off-Peak"
            
            lot_info['usagePattern'] = pattern
            
            # Normalize hourly pattern for display
            max_pattern = max(lot_info['hourlyPattern']) if max(lot_info['hourlyPattern']) > 0 else 1
            lot_info['hourlyPattern'] = [h / max_pattern for h in lot_info['hourlyPattern']]
            
            result.append(lot_info)
    
    return sorted(result, key=lambda x: x['totalHours'], reverse=True)

def _get_recent_sessions(reservations, limit=10):
    """Get recent parking sessions"""
    recent = sorted(reservations, key=lambda x: x.parking_timestamp or datetime.min, reverse=True)[:limit]
    
    result = []
    for reservation in recent:
        if not reservation.spot or not reservation.spot.lot:
            continue
        lot = reservation.spot.lot
        # Calculate duration and cost
        duration = 0
        cost = 0
        status = 'active'
        
        if reservation.leaving_timestamp:
            duration = (reservation.leaving_timestamp - reservation.parking_timestamp).total_seconds() / 3600
            status = 'completed'
        elif reservation.parking_timestamp:
            duration = (datetime.now() - reservation.parking_timestamp).total_seconds() / 3600
        
        if reservation.parking_cost:
            cost = reservation.parking_cost
        elif duration > 0:
            lot_price = getattr(lot, 'price', 10)
            cost = max(1, int(duration)) * lot_price
        
        result.append({
            'id': reservation.id,
            'lotName': lot.prime_location_name,
            'lotAddress': lot.address,
            'lotPincode': lot.pincode,
            'startTime': reservation.parking_timestamp.isoformat() if reservation.parking_timestamp else None,
            'endTime': reservation.leaving_timestamp.isoformat() if reservation.leaving_timestamp else None,
            'duration': round(duration, 2),
            'cost': round(cost, 2),
            'status': status,
            'vehicleNumber': getattr(reservation, 'vehicle_number', '')
        })
    
    return result

def _calculate_statistics(reservations):
    """Calculate usage statistics"""
    if not reservations:
        return {
            'mostActiveDay': 'N/A',
            'peakHours': 'N/A',
            'avgSessionLength': 0,
            'totalSavings': 0
        }
    
    # Day of week analysis
    day_counts = [0] * 7  # Monday = 0, Sunday = 6
    hour_counts = [0] * 24
    total_duration = 0
    session_count = 0
    
    for reservation in reservations:
        if reservation.parking_timestamp:
            day_counts[reservation.parking_timestamp.weekday()] += 1
            hour_counts[reservation.parking_timestamp.hour] += 1
            
            if reservation.leaving_timestamp:
                duration = (reservation.leaving_timestamp - reservation.parking_timestamp).total_seconds() / 3600
                total_duration += duration
                session_count += 1
    
    # Most active day
    most_active_day_idx = day_counts.index(max(day_counts)) if max(day_counts) > 0 else 0
    most_active_day = calendar.day_name[most_active_day_idx]
    
    # Peak hours
    peak_hour = hour_counts.index(max(hour_counts)) if max(hour_counts) > 0 else 12
    peak_hours = f"{peak_hour:02d}:00 - {(peak_hour+1)%24:02d}:00"
    
    # Average session length
    avg_session_length = total_duration / session_count if session_count > 0 else 0
    
    # Calculate potential savings (mock calculation)
    total_savings = len(reservations) * 2.5  # Assume $2.50 saved per session vs street parking
    
    return {
        'mostActiveDay': most_active_day,
        'peakHours': peak_hours,
        'avgSessionLength': round(avg_session_length, 2),
        'totalSavings': round(total_savings, 2)
    }

def _calculate_trends(reservations, period):
    """Calculate spending and usage trends over time"""
    if not reservations or period == 'all':
        return []
    
    try:
        days = int(period)
    except ValueError:
        days = 30
    
    # Create daily buckets
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days)
    
    daily_data = {}
    current_date = start_date
    
    # Initialize all days with zero values
    while current_date <= end_date:
        daily_data[current_date] = {
            'date': current_date.isoformat(),
            'expenditure': 0,
            'sessions': 0,
            'hours': 0
        }
        current_date += timedelta(days=1)
    
    # Populate with actual data
    for reservation in reservations:
        if not reservation.parking_timestamp:
            continue
            
        date_key = reservation.parking_timestamp.date()
        if date_key not in daily_data:
            continue
        
        daily_data[date_key]['sessions'] += 1
        
        # Add expenditure
        if reservation.parking_cost:
            daily_data[date_key]['expenditure'] += reservation.parking_cost
        elif reservation.leaving_timestamp:
            duration_hours = (reservation.leaving_timestamp - reservation.parking_timestamp).total_seconds() / 3600
            if reservation.spot and reservation.spot.lot:
                lot_price = getattr(reservation.spot.lot, 'price', 10)
                daily_data[date_key]['expenditure'] += max(1, int(duration_hours)) * lot_price
        
        # Add hours
        if reservation.leaving_timestamp:
            duration_hours = (reservation.leaving_timestamp - reservation.parking_timestamp).total_seconds() / 3600
            daily_data[date_key]['hours'] += duration_hours
    
    # Convert to list and sort by date
    trends = list(daily_data.values())
    trends.sort(key=lambda x: x['date'])
    
    # Round values
    for trend in trends:
        trend['expenditure'] = round(trend['expenditure'], 2)
        trend['hours'] = round(trend['hours'], 2)
    
    return trends


@routes_app.route('/api/user-summary/<int:user_id>/comparison', methods=['GET'])
@token_required
def get_user_comparison(user_id):
    """
    Get user performance comparison with system averages
    """
    try:
        # Verify user access
        if not hasattr(g, 'current_user') or g.current_user.id != user_id:
            return jsonify({"error": "Unauthorized access"}), 403
        
        period = request.args.get('period', '30')
        
        # Calculate date range
        if period == 'all':
            start_date = None
        else:
            days = int(period)
            start_date = datetime.now() - timedelta(days=days)
        
        # Get user's data
        user_query = Reservation.query.filter_by(user_id=user_id)
        if start_date:
            user_query = user_query.filter(Reservation.parking_timestamp >= start_date)
        user_reservations = user_query.all()
        
        # Get system averages
        system_query = Reservation.query
        if start_date:
            system_query = system_query.filter(Reservation.parking_timestamp >= start_date)
        
        # Calculate user metrics
        user_total_cost = sum(r.parking_cost or 0 for r in user_reservations)
        user_total_sessions = len(user_reservations)
        user_avg_cost = user_total_cost / user_total_sessions if user_total_sessions > 0 else 0
        
        # Calculate system averages
        system_stats = db.session.query(
            func.avg(Reservation.parking_cost).label('avg_cost'),
            func.count(Reservation.id).label('total_sessions'),
            func.count(func.distinct(Reservation.user_id)).label('total_users')
        ).filter(Reservation.parking_cost.isnot(None))
        
        if start_date:
            system_stats = system_stats.filter(Reservation.parking_timestamp >= start_date)
        
        system_data = system_stats.first()
        system_avg_cost = float(system_data.avg_cost) if system_data.avg_cost else 0
        system_avg_sessions = system_data.total_sessions / system_data.total_users if system_data.total_users > 0 else 0
        
        comparison_data = {
            'user': {
                'totalCost': round(user_total_cost, 2),
                'totalSessions': user_total_sessions,
                'avgCostPerSession': round(user_avg_cost, 2)
            },
            'system': {
                'avgCostPerSession': round(system_avg_cost, 2),
                'avgSessionsPerUser': round(system_avg_sessions, 2)
            },
            'comparison': {
                'costVsAverage': round(((user_avg_cost - system_avg_cost) / system_avg_cost * 100), 2) if system_avg_cost > 0 else 0,
                'sessionsVsAverage': round(((user_total_sessions - system_avg_sessions) / system_avg_sessions * 100), 2) if system_avg_sessions > 0 else 0
            }
        }
        
        return jsonify(comparison_data), 200
        
    except Exception as e:
        print(f"Error generating comparison: {str(e)}")
        return jsonify({"error": "Failed to generate comparison"}), 500

@routes_app.route('/api/admin-summary', methods=['GET'])
@token_required
# @cache.cached(timeout=10)
def get_admin_summary():
    user = g.current_user
    if not any(role.name == 'admin' for role in user.roles):
        return jsonify({'error': 'Admin access required'}), 403

    try:
        # Revenue by lot (no period filter)
        revenue_query = db.session.query(
            ParkingLot.id,
            ParkingLot.prime_location_name,
            func.sum(Reservation.parking_cost).label('revenue')
        ).join(ParkingSpot, ParkingSpot.lot_id == ParkingLot.id)\
         .join(Reservation, Reservation.spot_id == ParkingSpot.id)\
         .filter(Reservation.parking_cost.isnot(None))\
         .group_by(ParkingLot.id, ParkingLot.prime_location_name)
        revenue_by_lot = [
            {
                'lotId': row.id,
                'lotName': row.prime_location_name,
                'revenue': float(row.revenue or 0)
            }
            for row in revenue_query.all()
        ]

        lots = ParkingLot.query.all()
        parking_lot_stats = []
        for lot in lots:
            spots = ParkingSpot.query.filter_by(lot_id=lot.id).all()
            total_spots = len(spots)
            occupied_spots = sum(1 for s in spots if s.status != 'A')
            available_spots = total_spots - occupied_spots
            parking_lot_stats.append({
                'lotId': lot.id,
                'lotName': lot.prime_location_name,
                'totalSpots': total_spots,
                'occupiedSpots': occupied_spots,
                'availableSpots': available_spots
            })

        total_revenue = sum(lot['revenue'] for lot in revenue_by_lot)
        total_users = User.query.count()
        total_sessions = Reservation.query.count()
        active_sessions = Reservation.query.filter(Reservation.leaving_timestamp == None).count()
        total_parking_lots = len(lots)
        total_spots = ParkingSpot.query.count()

        overview = {
            'totalRevenue': round(total_revenue, 2),
            'totalUsers': total_users,
            'newUsers': 0,
            'totalSessions': total_sessions,
            'activeSessions': active_sessions,
            'totalParkingLots': total_parking_lots,
            'totalSpots': total_spots
        }

        # Daily user activity (optional, can be empty if no created_at)
        daily_activity = []

        return jsonify({
            'overview': overview,
            'revenueByLot': revenue_by_lot,
            'parkingLotStats': parking_lot_stats,
            'dailyActivity': daily_activity,
            'paymentMethods': []
        }), 200

    except Exception as e:
        print(f"Error in admin summary: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to generate admin summary'}), 500

from statsmodels.tsa.holtwinters import ExponentialSmoothing
import numpy as np

def get_hourly_occupancy(lot_id, hours=72):
    """
    Returns a list of occupied spot counts for each hour in the past `hours` hours.
    """
    now = datetime.now()
    hourly_occupancy = []
    for h in range(hours, 0, -1):
        start = now - timedelta(hours=h)
        end = start + timedelta(hours=1)
        occupied = ParkingSpot.query.filter_by(lot_id=lot_id, status='O').count()
        hourly_occupancy.append(occupied)
    return hourly_occupancy

@routes_app.route('/api/parkinglots/<int:lot_id>/predict', methods=['GET'])
@token_required
def predict_lot_occupancy(lot_id):
    """
    Predict occupancy for the next 3 hours using historical data.
    """
    try:
        # Get last 72 hours of occupancy data
        history = get_hourly_occupancy(lot_id, hours=72)
        if len(history) < 24:
            return jsonify({"error": "Not enough data for prediction"}), 400

        # Fit Exponential Smoothing model
        model = ExponentialSmoothing(history, trend='add', seasonal=None)
        fit = model.fit()
        forecast = fit.forecast(3)  # Predict next 3 hours

        return jsonify({
            "lot_id": lot_id,
            "predicted_occupancy": [max(0, int(round(x))) for x in forecast]
        }), 200
    except Exception as e:
        print("Error in occupancy prediction:", str(e))
        return jsonify({"error": "Failed to predict occupancy"}), 500