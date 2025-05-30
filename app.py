from flask import Flask
from backend.models import db, User, Role
from backend.routes import routes_app, test_bp
from backend.config import LocalDevelopmentConfig
from flask_security import Security, SQLAlchemyUserDatastore
from werkzeug.security import generate_password_hash
from backend.extensions import cache
from backend.celery.celery_factory import celery_init_app
import flask_excel as excel

def create_app():
    app = Flask(__name__, template_folder='frontend', static_folder='frontend', static_url_path='/static')
    app.config.from_object(LocalDevelopmentConfig)

    # Initialize the database
    db.init_app(app)
    cache.init_app(app) 
    
    excel.init_excel(app)  # Initialize Flask-Excel

    # Initialize Flask-Security
    datastore = SQLAlchemyUserDatastore(db, User, Role)
    app.cache = cache
    app.security = Security(app, datastore=datastore, register_blueprint=False)

    # Register routes
    app.register_blueprint(routes_app)
    app.register_blueprint(test_bp)
    from backend.resources import api
    api.init_app(app)
    with app.app_context():
        db.create_all()

        # Create roles and users
        if not datastore.find_role("admin"):
            datastore.create_role(name='admin', description='superuser')
        if not datastore.find_role("user"):
            datastore.create_role(name='user', description='general user')

        if not datastore.find_user(email='admin@gmail.com'):
            datastore.create_user(email='admin@gmail.com',
                                   password=generate_password_hash('admin'),
                                   roles=['admin'])

        # if not datastore.find_user(email='ayush@gmail.com'):
        #     datastore.create_user(email='ayush@gmail.com',
        #                            password=generate_password_hash('ayush'),
        #                            roles=['user'])

        db.session.commit()

    return app

app = create_app()

celery_app = celery_init_app(app)
# import backend.celery.celery_schedule  # Import to register periodic tasks
excel.init_excel(app)  # Initialize Flask-Excel

if __name__ == '__main__':
    app.run(debug=True)