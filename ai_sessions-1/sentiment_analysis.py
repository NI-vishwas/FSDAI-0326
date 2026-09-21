from transformers import pipeline
import torch
from dotenv import load_dotenv
import os

load_dotenv()

# Get the HF_TOKEN from hugging face and set it in a file called .env
HF_TOKEN = os.getenv("HF_TOKEN")

def analyze_data_with_transformers(data):
    sentiment_analyzer = pipeline("sentiment-analysis")
    sentiment = sentiment_analyzer(data)
    return sentiment

if __name__ == "__main__":
    data = "Best meal I've had in a while!"
    # Analyze data with transformers
    transformer_results = analyze_data_with_transformers(data)
    print(transformer_results)
