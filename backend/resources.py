from flask import request, jsonify, g
from flask_restful import Api, Resource, reqparse, marshal_with, fields
from .models import *
from functools import wraps
from .extensions import cache

def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'message': 'Token is missing'}), 401
        
        token = auth_header.split(' ')[1]
        
        # Find user by fs_uniquifier (our token)
        user = User.query.filter_by(fs_uniquifier=token).first()
        if not user:
            return jsonify({'message': 'Token is invalid'}), 401
        
        # Set current user in Flask-Security context
        g.current_user = user
        return f(*args, **kwargs)
    
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(g, 'current_user') or not g.current_user:
            return jsonify({'message': 'Authentication required'}), 401
        
        # Check if user has admin role
        if not any(role.name == 'admin' for role in g.current_user.roles):
            return jsonify({'message': 'Admin access required'}), 403
        
        return f(*args, **kwargs)
    
    return decorated_function
    
# Initialize API with prefix
api = Api(prefix='/api')

user_fields = {
    'id': fields.Integer,
    'email': fields.String,
    'full_name': fields.String,
    'phone_number': fields.Integer,
    'vehicle_number': fields.String,
    'address': fields.String,
    'age': fields.Integer,
    'active': fields.Boolean
}

parkinglot_fields = {
    'id': fields.Integer,
    'prime_location_name': fields.String,
    'address': fields.String,
    'pincode': fields.String,
    'price': fields.Integer,
    'number_of_spots': fields.Integer
}

parkingspot_fields = {
    'id': fields.Integer,
    'lot_id': fields.Integer,
    'status': fields.String
}

class ParkingLotAPI(Resource): 
    @token_required
    @cache.cached(timeout=10)  
    @marshal_with(parkinglot_fields)
    def get(self):
        return ParkingLot.query.all()

    @token_required
    @admin_required
    def post(self):
        data = request.get_json()
        address = data.get('address')
        pincode = data.get('pincode')
        existing_lot = ParkingLot.query.filter_by(address=address, pincode=pincode).first()

        if existing_lot:
            return {"message": "Parking lot with this address already exists."}, 409

        new_parkinglot = ParkingLot(
            prime_location_name=data.get('prime_location_name'),
            price=data.get('price'),
            address=data.get('address'),
            pincode=data.get('pincode'),
            number_of_spots=data.get('number_of_spots')
        )
        db.session.add(new_parkinglot)
        db.session.commit()

        # Create parking spots for the new lot
        try:
            for i in range(data.get('number_of_spots')):
                new_spot = ParkingSpot(
                    lot_id=new_parkinglot.id,
                    status='A'  # Available by default
                )
                db.session.add(new_spot)
            db.session.commit()
        except Exception as e:
            print(f"Error creating parking spots: {str(e)}")
            # Don't fail the lot creation if spot creation fails
            pass

        return {"message": "Parking lot added successfully!"}, 200

class SingleParkingLotAPI(Resource):
    @token_required
    @cache.memoize(timeout=10)
    @marshal_with(parkinglot_fields)
    def get(self, lot_id):
        lot = ParkingLot.query.get_or_404(lot_id)
        return lot
    
    @token_required
    @admin_required
    def put(self, lot_id):
        data = request.get_json()
        lot = ParkingLot.query.get_or_404(lot_id)
        old_spot_count = lot.number_of_spots

        try:
            lot.prime_location_name = data.get('prime_location_name', lot.prime_location_name)
            lot.address = data.get('address', lot.address)
            lot.pincode = data.get('pincode', lot.pincode)
            lot.price = data.get('price', lot.price)
            new_spot_count = data.get('number_of_spots', lot.number_of_spots)
            lot.number_of_spots = new_spot_count
            
            # Handle spot count changes
            if new_spot_count > old_spot_count:
                # Add new spots
                for i in range(new_spot_count - old_spot_count):
                    new_spot = ParkingSpot(lot_id=lot_id, status='A')
                    db.session.add(new_spot)
            elif new_spot_count < old_spot_count:
                # Remove excess spots (only if they're available)
                spots_to_remove = ParkingSpot.query.filter_by(
                    lot_id=lot_id, status='A'
                ).limit(old_spot_count - new_spot_count).all()
                
                for spot in spots_to_remove:
                    db.session.delete(spot)
            
            db.session.commit()
            return {'message': 'Parking lot updated successfully'}, 200
        except Exception as e:
            db.session.rollback()
            print("Error updating parking lot:", str(e))
            return {'error': 'Failed to update parking lot'}, 400
    
    @token_required
    @admin_required
    def delete(self, lot_id):
        lot = ParkingLot.query.get(lot_id)
        if not lot:
            return {"message": "Parking lot not found"}, 404

        # Check if any spots are occupied before deleting
        spots = ParkingSpot.query.filter_by(lot_id=lot_id).all()
        if any(spot.status != 'A' for spot in spots):
            return {"message": "Cannot delete. Some spots may be occupied."}, 400

        try:
            # Delete all spots first
            ParkingSpot.query.filter_by(lot_id=lot_id).delete()
            # Then delete the lot
            db.session.delete(lot)
            db.session.commit()
            return {"message": "Parking lot deleted successfully"}, 200
        except Exception as e:
            db.session.rollback()
            print("Error deleting parking lot:", str(e))
            return {"error": "Failed to delete parking lot", "details": str(e)}, 500

class ParkingSpotAPI(Resource):
    @token_required
    @admin_required
    @cache.cached(timeout=10)
    @marshal_with(parkingspot_fields)
    def get(self):
        return ParkingSpot.query.all()

    @token_required
    @admin_required
    @marshal_with(parkingspot_fields)
    def post(self):        
        data = request.get_json()
        lot_id = data.get('lot_id')
        status = data.get('status', 'A')

        # Input validation
        if not lot_id:
            print("Error: lot_id is required")
            return {"error": "lot_id is required"}, 400

        lot = ParkingLot.query.get(lot_id)
        if not lot:
            print(f"Error: Parking lot with id {lot_id} does not exist")
            return {"error": f"Parking lot with id {lot_id} does not exist"}, 400

        try:
            new_spot = ParkingSpot(
                lot_id=lot_id,
                status=status  # Default to available
            )
            db.session.add(new_spot)
            db.session.commit()
            
            print(f"Successfully created spot with ID {new_spot.id}")
            return new_spot, 201
        except Exception as e:
            db.session.rollback()
            print("Error creating spot:", str(e))
            return {"error": "Failed to create spot"}, 400

class SingleParkingSpotAPI(Resource):
    @token_required
    @cache.memoize(timeout=10)
    @marshal_with(parkingspot_fields)
    def get(self, spot_id):
        spot = ParkingSpot.query.get_or_404(spot_id)
        return spot 

    @token_required
    @admin_required
    def delete(self, spot_id):
        spot = ParkingSpot.query.get(spot_id)
        if not spot:
            return {"message": "Spot not found"}, 404
            
        try:
            lot = ParkingLot.query.get(spot.lot_id)
            db.session.delete(spot)
            if lot and lot.number_of_spots > 0:
                lot.number_of_spots -= 1
                if lot.number_of_spots == 0:
                    db.session.delete(lot)
            db.session.commit()
            return {"message": "Spot deleted successfully"}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": "Failed to delete spot"}, 400

# Register all resources
api.add_resource(ParkingLotAPI, '/parkinglots')
api.add_resource(SingleParkingLotAPI, '/parkinglots/<int:lot_id>')
api.add_resource(ParkingSpotAPI, '/parkingspots')
api.add_resource(SingleParkingSpotAPI, '/parkingspots/<int:spot_id>')