from flask import Blueprint, request, jsonify
from model import predict_toxicity, MODEL_NAME
from logger import logger

bp = Blueprint("routes", __name__)

@bp.route("/health", methods=["GET"])
def health():
    logger.info("Health check requested")
    return jsonify({"status": "healthy", "model": MODEL_NAME}), 200

@bp.route("/predict", methods=["POST"])
def predict():
    data = request.json
    if not data or "content" not in data:
        logger.warning("No content provided in request")
        return jsonify({"error": "No content provided"}), 400

    text = data["content"]
    logger.info(f"Predicting toxicity for content: {text[:50]}...") 
    result = predict_toxicity(text)
    return jsonify(result)
