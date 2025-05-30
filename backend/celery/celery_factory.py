from celery import Celery, Task
from flask import Flask
from backend.celery.celery_schedule import setup_periodic_tasks
import os
class CeleryConfig():
    broker_url = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    result_backend = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/1')
    timezone = os.environ.get('TIMEZONE', 'Asia/Kolkata')

def celery_init_app(app: Flask) -> Celery:
    class FlaskTask(Task):
        def __call__(self, *args: object, **kwargs: object) -> object:
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app = Celery(app.name, task_cls=FlaskTask)
    celery_app.config_from_object(CeleryConfig)
    celery_app.set_default() 
    app.extensions["celery"] = celery_app

    setup_periodic_tasks(celery_app)

    return celery_app
