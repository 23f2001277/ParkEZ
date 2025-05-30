# backend/app/models.py
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_security import UserMixin, RoleMixin
from flask_security.utils import get_token_status
import uuid

db = SQLAlchemy()

class UserRoles(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'))

class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255))

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    fs_uniquifier = db.Column(db.String(255), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    full_name = db.Column(db.String(255), nullable=True)  # Add this
    phone_number = db.Column(db.String(20), nullable=True)
    vehicle_number = db.Column(db.String(20), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    age = db.Column(db.Integer, nullable=True)  
    active = db.Column(db.Boolean, default=True)
    roles = db.relationship('Role', secondary='user_roles', backref=db.backref('users', lazy='dynamic'))
    reservations = db.relationship('Reservation', backref='user', cascade='all, delete-orphan')

    def get_auth_token(self):
        from flask_security.core import _security
        return _security.generate_token(self)

class ParkingLot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    prime_location_name = db.Column(db.String(255), nullable=False)
    price = db.Column(db.Float, nullable=False)
    address = db.Column(db.String(255), nullable=False)
    pincode = db.Column(db.String(10), nullable=False)
    number_of_spots = db.Column(db.Integer, nullable=False)
    spots = db.relationship('ParkingSpot', backref='lot', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            "id": self.id,
            "prime_location_name": self.prime_location_name,
            "price": self.price,
            "address": self.address,
            "pincode": self.pincode,
            "number_of_spots": self.number_of_spots
        }

    def __repr__(self):
        return f'<ParkingLot {self.prime_location_name}>'

class ParkingSpot(db.Model):
    STATUS_AVAILABLE = 'A'
    STATUS_OCCUPIED = 'O'

    id = db.Column(db.Integer, primary_key=True)
    lot_id = db.Column(db.Integer, db.ForeignKey('parking_lot.id'), nullable=False)
    status = db.Column(db.String(1), nullable=False, default=STATUS_AVAILABLE, index=True)
    reservations = db.relationship('Reservation', backref='spot', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            "id": self.id,
            "lot_id": self.lot_id,
            "status": self.status
        }

class Reservation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    spot_id = db.Column(db.Integer, db.ForeignKey('parking_spot.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    parking_timestamp = db.Column(db.DateTime, default=datetime.now(), nullable=False)
    leaving_timestamp = db.Column(db.DateTime, nullable=True)
    parking_cost = db.Column(db.Float, nullable=True)
    vehicle_number = db.Column(db.String(20), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "spot_id": self.spot_id,
            "user_id": self.user_id,
            "parking_timestamp": self.parking_timestamp,
            "leaving_timestamp": self.leaving_timestamp,
            "parking_cost": self.parking_cost,
            "vehicle_number": self.vehicle_number
        }