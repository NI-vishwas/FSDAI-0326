import nltk
import re
import string

from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import CountVectorizer

# download required NLTK resources
nltk.download('punkt')
nltk.download('punkt_tab')
nltk.download('wordnet')
nltk.download('stopwords')


raw_text = "The running athletes were continuously running in the 2026 games!"
print("Raw text:", raw_text)

# lowercase the text
raw_text = raw_text.lower()
print("Lowercased text:", raw_text)

# remove punctuation
raw_text = raw_text.translate(str.maketrans('', '', string.punctuation))
print("Punctuation removed text:", raw_text)

# tokenize the text
tokens = word_tokenize(raw_text)
print("Tokenized text:", tokens)

# remove stopwords
stop_words = set(stopwords.words('english'))
filtered_tokens = [token for token in tokens if token not in stop_words]
print("Stopwords removed text:", filtered_tokens)

# Stemming the tokens
stemmer = nltk.PorterStemmer()
stemmed_tokens = [stemmer.stem(token) for token in filtered_tokens]
print("Stemmed text:", stemmed_tokens)

# lemmatize the tokens
lemmatizer = WordNetLemmatizer()
lemmatized_tokens = [lemmatizer.lemmatize(token) for token in stemmed_tokens]
print("Lemmatized text:", lemmatized_tokens)

# Vectorization using Bag of Words
vectorizer = CountVectorizer()
vectorized_text = vectorizer.fit_transform([' '.join(lemmatized_tokens)])
print("Vectorized text (Bag of Words):", vectorized_text.toarray())
