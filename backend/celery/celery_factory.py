from celery import Celery, Task
from flask import Flask
from backend.celery.celery_schedule import setup_periodic_tasks
import os

class CeleryConfig():
    broker_url = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    result_backend = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/1')
    timezone = os.environ.get('TIMEZONE', 'Asia/Kolkata')

    # Add these important configurations
    task_serializer = 'json'
    accept_content = ['json']
    result_serializer = 'json'
    task_track_started = True
    task_time_limit = 30 * 60  # 30 minutes
    worker_prefetch_multiplier = 1

    # Important for beat scheduling
    beat_scheduler = 'celery.beat:PersistentScheduler'
    beat_schedule_filename = 'celerybeat-schedule'

def celery_init_app(app: Flask) -> Celery:
    class FlaskTask(Task):
        def __call__(self, *args: object, **kwargs: object) -> object:
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app = Celery(app.name, task_cls=FlaskTask)
    celery_app.config_from_object(CeleryConfig)
    celery_app.set_default()

    # Ensure extensions dict exists
    if not hasattr(app, 'extensions'):
        app.extensions = {}
    app.extensions["celery"] = celery_app

    # Setup periodic tasks
    setup_periodic_tasks(celery_app)

    return celery_app