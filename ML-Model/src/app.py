from flask import Flask, jsonify, request
from model_defs import predict_aqi

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    result = predict_aqi(data)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
