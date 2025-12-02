from flask import Flask
from routes import bp
from logger import logger

def create_app():
    app = Flask(__name__)
    app.register_blueprint(bp)
    logger.info("Flask app initialized")
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000)
