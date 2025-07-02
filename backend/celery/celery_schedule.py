from celery.schedules import crontab
from backend.celery.tasks import send_daily_reminders, send_monthly_activity_reports

def setup_periodic_tasks(celery_app):
    celery_app.conf.beat_schedule = {
        'send-daily-reminders': {
            'task': 'backend.celery.tasks.send_daily_reminders',
            'schedule': crontab(hour=19, minute=30),
        },
        'send-monthly-activity-reports': {
            'task': 'backend.celery.tasks.send_monthly_activity_reports',
            'schedule': crontab(hour=18, minute=30, day_of_month=1),
        },
    }