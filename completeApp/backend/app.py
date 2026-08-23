from flask import Flask, jsonify, request
from ai_models.utils import is_spam
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://127.0.0.1:5500"}})

@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "hello"})


@app.route('/analyze', methods=['POST'])
def analyze_text():
    input_data = request.get_json()
    if is_spam(input_data['message']):
        return jsonify({"message": input_data['message'], "category": "SPAM"})
    else:
        return jsonify({"message": input_data['message'], "category": "NOT SPAM"})
    



if __name__ == '__main__':
    app.run(debug=True)