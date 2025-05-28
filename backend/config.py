class Config:
    DEBUG = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class LocalDevelopmentConfig(Config):
    #configuration for local development
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///parking.sqlite3"
    #configuration for security
    SECRET_KEY = 'super-secret-key'
    SECURITY_PASSWORD_HASH = 'bcrypt'
    SECURITY_PASSWORD_SALT = 'some-arbitrary-salt'
    WTF_CSRF_ENABLED = False
    SECURITY_TOKEN_AUTHENTICATION_HEADER = 'Authorization'
    SECURITY_TOKEN_MAX_AGE = 3600