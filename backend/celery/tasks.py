from celery import shared_task
from backend.models import Reservation, ParkingSpot, ParkingLot, db, User
import csv
import os
from datetime import datetime, timedelta
import flask_excel
from backend.celery.mail_service import send_email
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@shared_task(bind=True, ignore_result=False)
def create_user_csv(self, user_id):
    reservations = Reservation.query.filter_by(user_id=user_id).all()
    task_id = self.request.id
    filename = f'user_parking_{user_id}_{task_id}.csv'
    filepath = f'./backend/celery/user-downloads/{filename}'

    with open(filepath, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['slot_id', 'spot_id', 'parking_timestamp', 'leaving_timestamp', 'parking_cost', 'vehicle_number'])
        for r in reservations:
            writer.writerow([
                r.spot.lot_id if r.spot else '',
                r.spot_id,
                r.parking_timestamp,
                r.leaving_timestamp,
                r.parking_cost,
                getattr(r, 'vehicle_number', '')
            ])
    return filename

@shared_task(bind=True, ignore_result=False)
def send_daily_reminders(self):
    logger.info("Starting daily reminder task")
    current_datetime = datetime.now()
    actual_today = current_datetime.date()  
    logger.info(f"Task running at: {current_datetime}")
    logger.info(f"Checking for bookings on: {actual_today}")
    
    users = User.query.all()
    reminder_count = 0
    
    for user in users:
        # Check if user has a reservation for the actual today (July 2nd)
        has_today_booking = Reservation.query.filter(
            Reservation.user_id == user.id,
            Reservation.parking_timestamp >= datetime.combine(actual_today, datetime.min.time()),
            Reservation.parking_timestamp <= datetime.combine(actual_today, datetime.max.time())
        ).first()
        
        # Send reminder only if user DOESN'T have booking for actual today
        if not has_today_booking:
            try:
                subject = "Daily Parking Reminder"
                content = f"""
                <html>
                <body>
                    <h2>Parking Reminder</h2>
                    <p>Hi {user.full_name},</p>
                    <p>You don't have a parking spot booked for {actual_today.strftime('%B %d, %Y')}.</p>
                    <p>If you need parking, please visit our parking portal to make your reservation.</p>
                    <br>
                    <p>Best regards,<br>ParkEZ Team</p>
                </body>
                </html>
                """
                send_email(user.email, subject, content)
                reminder_count += 1
                logger.info(f"Sent reminder to {user.email} - no booking for {actual_today}")
            except Exception as e:
                logger.error(f"Failed to send reminder to {user.email}: {str(e)}")
        else:
            logger.info(f"Skipped {user.email} - already has booking for {actual_today}")
    
    logger.info(f"Daily reminder task completed. Sent {reminder_count} reminders for {actual_today}.")
    return f"Sent {reminder_count} reminders for {actual_today}"

@shared_task(bind=True, ignore_result=False)
def send_monthly_activity_reports(self):
    logger.info("Starting monthly activity report task")
    
    today = datetime.now().date()
    # Get previous month's data
    if today.month == 1:
        previous_month = 12
        year = today.year - 1
    else:
        previous_month = today.month - 1
        year = today.year
    
    month_start = datetime(year, previous_month, 1).date()
    # Get last day of previous month
    if previous_month == 12:
        month_end = datetime(year + 1, 1, 1).date() - timedelta(days=1)
    else:
        month_end = datetime(year, previous_month + 1, 1).date() - timedelta(days=1)
    
    month_name = month_start.strftime('%B %Y')
    
    users = User.query.all()
    report_count = 0
    
    for user in users:
        try:
            # Get all reservations for previous month
            reservations = Reservation.query.filter(
                Reservation.user_id == user.id,
                Reservation.parking_timestamp >= datetime.combine(month_start, datetime.min.time()),
                Reservation.parking_timestamp <= datetime.combine(month_end, datetime.max.time())
            ).all()

            # Only send report if user had any activity
            if not reservations:
                continue

            total_bookings = len(reservations)
            total_amount = sum(r.parking_cost or 0 for r in reservations)

            # Most used parking lot
            lot_counts = {}
            for r in reservations:
                if r.spot and r.spot.lot_id:
                    lot_id = r.spot.lot_id
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
                    "spot_id": r.spot_id or "N/A",
                    "date": r.parking_timestamp.strftime('%Y-%m-%d'),
                    "cost": r.parking_cost or 0
                })

            # Render HTML using your template
            html = render_template('monthly_report.html', 
                                 user_name=user.full_name,
                                 month_name=month_name,
                                 total_bookings=total_bookings,
                                 total_amount=total_amount,
                                 most_used_lot=most_used_lot,
                                 bookings=bookings)

            # Send email with rendered HTML
            subject = f"Your Monthly Parking Activity Report ({month_name})"
            send_email(user.email, subject, html)
            
            report_count += 1
            logger.info(f"Sent monthly report to {user.email}")
            
        except Exception as e:
            logger.error(f"Failed to send monthly report to {user.email}: {str(e)}")
            continue  # Continue with next user even if one fails
    
    logger.info(f"Monthly report task completed. Sent {report_count} reports.")
    return f"Sent {report_count} monthly reports"