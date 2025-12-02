import torch
from transformers import BertTokenizer, BertForSequenceClassification
from logger import logger
from config import MODEL_NAME, DEVICE, MAX_LENGTH, TOXIC_THRESHOLD

device = torch.device("cuda" if DEVICE == "cuda" and torch.cuda.is_available() else "cpu")
logger.info(f"Loading model: {MODEL_NAME} on {device}...")

tokenizer = BertTokenizer.from_pretrained(MODEL_NAME)
model = BertForSequenceClassification.from_pretrained(MODEL_NAME)

if device.type == 'cpu':
    logger.info("⚡ Applying dynamic quantization for CPU inference...")
    model = torch.quantization.quantize_dynamic(
        model, {torch.nn.Linear}, dtype=torch.qint8
    )

model.to(device)
model.eval()
logger.info(f"Model loaded on {device}")


def predict_toxicity(text: str) -> dict:
    if not text.strip():
        return {"is_toxic": False,
                "scores": {k: 0.0 for k in ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"]}}

    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=MAX_LENGTH
    ).to(device)

    with torch.no_grad():
        logits = model(**inputs).logits
        probs = torch.sigmoid(logits).cpu().numpy()[0]

    is_toxic = any(score > TOXIC_THRESHOLD for score in probs)

    scores = {
        "toxic": float(f"{probs[0]:.4f}"),
        "severe_toxic": float(f"{probs[1]:.4f}"),
        "obscene": float(f"{probs[2]:.4f}"),
        "threat": float(f"{probs[3]:.4f}"),
        "insult": float(f"{probs[4]:.4f}"),
        "identity_hate": float(f"{probs[5]:.4f}"),
    }

    return {"is_toxic": bool(is_toxic), "scores": scores}
