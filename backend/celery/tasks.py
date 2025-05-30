from celery import shared_task
from backend.models import Reservation, ParkingSpot, ParkingLot, db, User
import csv
import os
from datetime import datetime, timedelta
import flask_excel
from backend.celery.mail_service import send_email

@shared_task(bind=True, ignore_result=False)
def create_user_csv(self, user_id):
    reservations = Reservation.query.filter_by(user_id=user_id).all()
    task_id = self.request.id
    filename = f'user_parking_{user_id}_{task_id}.csv'
    filepath = f'./backend/celery/user-downloads/{filename}'

    with open(filepath, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['slot_id', 'spot_id', 'parking_timestamp', 'leaving_timestamp', 'parking_cost', 'remarks'])
        for r in reservations:
            writer.writerow([
                r.spot.lot_id if r.spot else '',
                r.spot_id,
                r.parking_timestamp,
                r.leaving_timestamp,
                r.parking_cost,
                getattr(r, 'remarks', '') or getattr(r, 'vehicle_number', '')
            ])
    return filename

@shared_task(bind=True, ignore_result=False)
def send_daily_reminders(self):
    today = datetime.now().date()
    users = User.query.all()
    for user in users:
        # Check if user has a reservation today
        has_today_booking = Reservation.query.filter(
            Reservation.user_id == user.id,
            Reservation.parking_timestamp >= datetime.combine(today, datetime.min.time()),
            Reservation.parking_timestamp <= datetime.combine(today, datetime.max.time())
        ).first()
        if not has_today_booking:
            subject = "Daily Parking Reminder"
            content = f"Hi {user.full_name},\n\nDon't forget to book your parking spot for today if needed!"
            send_email(user.email, subject, content)

# @shared_task(bind=True, ignore_result=False)
# def send_monthly_activity_reports(self):
#     today = datetime.now().date()
#     first_day = today.replace(day=1)
#     last_month = first_day - timedelta(days=1)
#     month_start = last_month.replace(day=1)
#     month_end = last_month
#     month_name = month_start.strftime('%B %Y')

#     users = User.query.all()
#     for user in users:
#         # Get all reservations for last month
#         reservations = Reservation.query.filter(
#             Reservation.user_id == user.id,
#             Reservation.parking_timestamp >= datetime.combine(month_start, datetime.min.time()),
#             Reservation.parking_timestamp <= datetime.combine(month_end, datetime.max.time())
#         ).all()

#         total_bookings = len(reservations)
#         total_amount = sum(r.parking_cost or 0 for r in reservations)

#         # Most used parking lot
#         lot_counts = {}
#         for r in reservations:
#             lot_id = r.spot.lot_id if r.spot else None
#             if lot_id:
#                 lot_counts[lot_id] = lot_counts.get(lot_id, 0) + 1
#         most_used_lot = "N/A"
#         if lot_counts:
#             most_used_lot_id = max(lot_counts, key=lot_counts.get)
#             lot = ParkingLot.query.get(most_used_lot_id)
#             most_used_lot = lot.prime_location_name if lot else "Unknown"

#         # Prepare booking details for the template
#         bookings = []
#         for r in reservations:
#             bookings.append({
#                 "id": r.id,
#                 "lot_name": r.spot.lot.prime_location_name if r.spot and r.spot.lot else "N/A",
#                 "spot_id": r.spot_id,
#                 "date": r.parking_timestamp.strftime('%Y-%m-%d'),
#                 "cost": r.parking_cost or 0
#             })

#         # Render HTML (using Jinja2 template engine)
#         from flask import render_template
#         html = render_template(
#             "monthly_report.html",
#             total_bookings=total_bookings,
#             total_amount=total_amount,
#             most_used_lot=most_used_lot,
#             month_name=month_name,
#             bookings=bookings
#         )

#         send_email(user.email, f"Your Monthly Parking Activity Report ({month_name})", html)


@shared_task(bind=True, ignore_result=False)
def send_monthly_activity_reports(self):
    today = datetime.now().date()
    # For testing: use current month instead of previous month
    month_start = today.replace(day=1)
    month_end = today
    month_name = month_start.strftime('%B %Y')

    users = User.query.all()
    for user in users:
        # Get all reservations for current month
        reservations = Reservation.query.filter(
            Reservation.user_id == user.id,
            Reservation.parking_timestamp >= datetime.combine(month_start, datetime.min.time()),
            Reservation.parking_timestamp <= datetime.combine(month_end, datetime.max.time())
        ).all()

        total_bookings = len(reservations)
        total_amount = sum(r.parking_cost or 0 for r in reservations)

        # Most used parking lot
        lot_counts = {}
        for r in reservations:
            lot_id = r.spot.lot_id if r.spot else None
            if lot_id:
                lot_counts[lot_id] = lot_counts.get(lot_id, 0) + 1
        most_used_lot = "N/A"
        if lot_counts:
            most_used_lot_id = max(lot_counts, key=lot_counts.get)
            lot = ParkingLot.query.get(most_used_lot_id)
            most_used_lot = lot.prime_location_name if lot else "Unknown"

        # Prepare booking details for the template
        bookings = []
        for r in reservations:
            bookings.append({
                "id": r.id,
                "lot_name": r.spot.lot.prime_location_name if r.spot and r.spot.lot else "N/A",
                "spot_id": r.spot_id,
                "date": r.parking_timestamp.strftime('%Y-%m-%d'),
                "cost": r.parking_cost or 0
            })

        # Render HTML (using Jinja2 template engine)
        from flask import render_template
        html = render_template(
            "monthly_report.html",
            total_bookings=total_bookings,
            total_amount=total_amount,
            most_used_lot=most_used_lot,
            month_name=month_name,
            bookings=bookings
        )

        send_email(user.email, f"Your Monthly Parking Activity Report ({month_name})", html)