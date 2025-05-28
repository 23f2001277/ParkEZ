from flask import request, jsonify
from flask_restful import Api, Resource, reqparse, marshal_with, fields
from .models import *
from flask_security import auth_required, roles_required, current_user

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
    @marshal_with(parkinglot_fields)
    def get(self):
        return ParkingLot.query.all()

    @auth_required('token')
    @roles_required('admin')
    def post(self):
        print("Authorization header:", request.headers.get('Authorization'))
        print("Current user:", current_user.email if current_user else "No user")
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

        return {"message": "Parking lot added successfully!"}, 200

class SingleParkingLotAPI(Resource):
    @marshal_with(parkinglot_fields)
    def get(self, lot_id):
        lot = ParkingLot.query.get_or_404(lot_id)
        return lot

class ParkingSpotAPI(Resource):
    @auth_required('token')
    @roles_required('admin')
    @marshal_with(parkingspot_fields)
    def get(self):
        return ParkingSpot.query.all()

api.add_resource(ParkingLotAPI, '/parkinglots')
api.add_resource(SingleParkingLotAPI, '/parkinglots/<int:lot_id>')
api.add_resource(ParkingSpotAPI, '/parkingspots')
