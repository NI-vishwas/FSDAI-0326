from transformers import AutoModelForSequenceClassification, AutoTokenizer, pipeline

#HF_TOKEN = "hf_XXXXXX"  # Replace with your actual Hugging Face token

tokenizer = AutoTokenizer.from_pretrained("jason23322/email-classifier-distilbert")
model = AutoModelForSequenceClassification.from_pretrained(
    "jason23322/email-classifier-distilbert", use_auth_token=HF_TOKEN
)

# classifier = pipeline("text-classification", model=model, tokenizer=tokenizer)
# result = classifier("Your verification code is 123456")
# print(result)

tokenizer.save_pretrained("email-classifier-distilbert")
model.save_pretrained("email-classifier-distilbert")
