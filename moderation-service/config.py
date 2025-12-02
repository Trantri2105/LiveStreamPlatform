import os
from dotenv import load_dotenv

load_dotenv() 

MODEL_NAME = os.getenv("MODEL_NAME", "thanh29nt/nightbot-toxicity-filter")
DEVICE = os.getenv("DEVICE", "cuda")
MAX_LENGTH = int(os.getenv("MAX_LENGTH", 64))
TOXIC_THRESHOLD = float(os.getenv("TOXIC_THRESHOLD", 0.5))
