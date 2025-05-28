from flask import Blueprint, request, jsonify, session, render_template
from flask_login import login_user
from flask_security import roles_required, hash_password, verify_password, auth_required, current_user
from .models import db, User, Role, ParkingLot, ParkingSpot, Reservation
from flask import Flask, redirect, url_for, flash, render_template
from flask import current_app as app
from werkzeug.security import generate_password_hash, check_password_hash 

routes_app = Blueprint('routes_app', __name__)

@routes_app.route('/', methods=['GET'])
def home():
    return render_template('index.html')
     
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
        return jsonify({"token": user.get_auth_token(), "email": user.email, "roles": user.roles[0].name, "id": user.id})
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
    age = data.get('age')

    # Validate inputs
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


@routes_app.route('/customer', methods=['GET'])
@auth_required('token')
@roles_required('user')
def user_dashboard():
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    reservations = Reservation.query.filter_by(user_id=user_id).order_by(Reservation.id.desc()).all()
    history = []
    for res in reservations:
        history.append({
            "reservation_id": res.id,
            "location": res.spot.lot.prime_location_name,
            "vehicle_number": res.vehicle_number,
            "timestamp": res.parking_timestamp,
            "status": "Parked Out" if res.leaving_timestamp else "Active",
            "spot_id": res.spot_id
        })
    return jsonify(history)
    
@routes_app.route('/add_parkinglots', methods=['POST'])
@auth_required('token')
@roles_required('admin')
def add_parkinglot():
    print("current user", current_user)
    data = request.get_json()
    if not data:
        return jsonify({"message": "No data provided"}), 400
    address = data.get('address')
    pincode = data.get('pincode')
    existing_lot = ParkingLot.query.filter_by(address=address, pincode=pincode).first()

    if existing_lot:
        return jsonify({"message": "Parking lot with this address already exists."}), 409

    new_parkinglot = ParkingLot(
        prime_location_name=data.get('prime_location_name'),
        price=data.get('price'),
        address=data.get('address'),
        pincode=data.get('pincode'),
        number_of_spots=data.get('number_of_spots')
    )
    db.session.add(new_parkinglot)
    db.session.commit()
    return jsonify({"message": "Parking lot added successfully!"}), 200

@routes_app.route('/api/parkinglots/<int:lot_id>', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def get_parking_lot(lot_id):
    lot = ParkingLot.query.get_or_404(lot_id)
    return jsonify({
        "id": lot.id,
        "prime_location_name": lot.prime_location_name,
        "address": lot.address,
        "pincode": lot.pincode,
        "price": lot.price,
        "number_of_spots": lot.number_of_spots
    }), 200


@routes_app.route('/api/parkinglots/<int:lot_id>', methods=['PUT'])
@auth_required('token')
@roles_required('admin')
def edit_parking_lot(lot_id):
    data = request.get_json()
    lot = ParkingLot.query.get_or_404(lot_id)

    try:
        lot.prime_location_name = data['prime_location_name']
        lot.address = data['address']
        lot.pincode = data['pincode']
        lot.price = data['price']
        lot.number_of_spots = data['number_of_spots']
        
        db.session.commit()
        return jsonify({'message': 'Parking lot updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@routes_app.route('/api/parkinglots/<int:lot_id>', methods=['DELETE'])
@auth_required('token')
@roles_required('admin')
def delete_parking_lot(lot_id):
    lot = ParkingLot.query.get(lot_id)
    if not lot:
        return jsonify({"message": "Parking lot not found"}), 404

    spots = ParkingSpot.query.filter_by(lot_id=lot_id).all()
    if any(spot.status != 'A' for spot in spots):
        return jsonify({"message": "Cannot delete. Some spots may be occupied."}), 400

    db.session.delete(lot)
    db.session.commit()
    return jsonify({"message": "Parking lot deleted successfully"}), 200


# @routes_app.route('/admin/edit_parkinglot/<int:lot_id>', methods=['PUT'])
# @jwt_required()
# def edit_parkinglot(lot_id):
#     if 'admin' not in session:
#         flash('You need to be logged in as an admin to access this page.', 'danger')
#         return redirect(url_for('login'))
#     parking_lot = ParkingLot.query.get_or_404(lot_id)
    
#     if request.method == 'PUT':
#         parking_lot.prime_location_name = request.form['prime_location_name']
#         parking_lot.price = request.form['price']
#         parking_lot.address = request.form['address']
#         parking_lot.pin_code = request.form['pin_code']
#         parking_lot.number_of_spots = request.form['number_of_spots']
#         db.session.commit()
#         flash('Parking lot updated successfully!', 'success')
#         return redirect(url_for('admin'))
    

# @routes_app.route('/admin/delete_parkinglot/<int:lot_id>', methods=['DELETE'])
# @jwt_required()
# def delete_parkinglot(lot_id):
#     if 'admin' not in session:
#         flash('You need to be logged in as an admin to access this page.', 'danger')
#         return redirect(url_for('login'))

#     parking_lot = ParkingLot.query.get_or_404(lot_id)

#     # Check if all parking spots in the lot are available
#     occupied_spots = ParkingSpot.query.filter_by(lot_id=lot_id, status=ParkingSpot.STATUS_OCCUPIED).count()
#     if occupied_spots > 0:
#         flash('Cannot delete parking lot. Some spots are still occupied.', 'danger')
#         return redirect(url_for('admin'))

#     # Delete the parking lot if all spots are empty
#     db.session.delete(parking_lot)
#     db.session.commit()
#     flash('Parking lot deleted successfully!', 'success')
#     return redirect(url_for('admin'))



# @routes_app.route('/admin/view_parkingspots/<int:spot_id>', methods=['GET'])
# def view_parkingspots(spot_id):
#     if 'admin' not in session:
#         flash('You need to be logged in as an admin to access this page.', 'danger')
#         return redirect(url_for('login'))
#     parking_spot = ParkingSpot.query.get_or_404(spot_id)
#     response = {
#         "id": parking_spot.id,
#         "lot_id": parking_spot.lot_id,
#         "status": parking_spot.status
#     }

#     # If the spot is occupied, include reservation details
#     if parking_spot.status == ParkingSpot.STATUS_OCCUPIED:
#         reservation = Reservation.query.filter_by(spot_id=spot_id).first()
#         if reservation:
#             response["reservation"] = {
#                 "user_id": reservation.user_id,
#                 "parking_timestamp": reservation.parking_timestamp,
#                 "leaving_timestamp": reservation.leaving_timestamp,
#                 "parking_cost": reservation.parking_cost
#             }

#     return jsonify(response), 200


# @routes_app.route('/admin/delete_parking_spot/<int:spot_id>', methods=['DELETE'])
# def delete_parking_spot(spot_id):
#     if session.get('user_role') != 'admin':
#         return jsonify({"error": "You need to be logged in as an admin to access this page."}), 403

#     parking_spot = ParkingSpot.query.get_or_404(spot_id)

#     # Check if the parking spot is available
#     if parking_spot.status != ParkingSpot.STATUS_AVAILABLE:
#         return jsonify({"error": "Cannot delete parking spot. The spot is currently occupied."}), 400

#     # Delete the parking spot
#     db.session.delete(parking_spot)
#     db.session.commit()
#     return jsonify({"message": "Parking spot deleted successfully!"}), 200


# @routes_app.route('/api/user', methods=['GET'])
# @auth_required('token')
# @roles_required('user')
# def user_home():
#     user = current_user()
#     return jsonify({ 
#         "id": user.id,
#         "email": user.email,
#         "roles": 'admin' if user.has_role('admin') else 'user',
#         "name": user.full_name,
#         "phone_number": user.phone_number
#     }), 200