from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import pandas as pd
import numpy as np
import os
from sklearn.preprocessing import MinMaxScaler
from model_defs import AQILSTM
import requests
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# --- GLOBAL CONFIG ---
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODEL_PATH = os.path.join(BASE_DIR, 'Model', 'multivariate_model.pth')
DATA_PATH = os.path.join(BASE_DIR, 'Dataset', 'new_aqi.csv')

model = AQILSTM()
model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
model.eval()

print("Model loaded from:", MODEL_PATH)
print("Dataset loaded from:", DATA_PATH)

df = pd.read_csv(DATA_PATH)

def get_aqi_condition(aqi_value):
    """
    Categorize AQI value into air quality condition.
    Based on standard AQI ranges.
    """
    if aqi_value <= 50:
        return "Good"
    elif aqi_value <= 100:
        return "Moderate"
    elif aqi_value <= 200:
        return "Unhealthy"
    elif aqi_value <= 300:
        return "Very Unhealthy"
    else:
        return "Hazardous"

def get_aqi_emoji(aqi_value):
    """Return emoji based on AQI value"""
    if aqi_value <= 50:
        return "😊"
    elif aqi_value <= 100:
        return "😐"
    elif aqi_value <= 150:
        return "⚠️"
    elif aqi_value <= 200:
        return "❌"
    elif aqi_value <= 300:
        return "🔴"
    else:
        return "💀"

def get_prediction(state_name, area_name):
    state_name_lower = state_name.lower()
    area_name_lower = area_name.lower()
    
    print(f"CSV Columns: {df.columns.tolist()}")
    print(f"Searching for state='{state_name}', area='{area_name}'")
    print(f"Available states: {df['state'].unique()[:10]}")
    print(f"Available areas: {df['area'].unique()[:10]}")
    
    # Filter data by state and area
    data = df[(df['state'].str.lower() == state_name_lower) & (df['area'].str.lower() == area_name_lower)].copy()
    
    print(f"Filtered data rows: {len(data)}")
    
    if data.empty:
        return None, f"Area not found in database. Available states: {df['state'].unique().tolist()}"

    # Get AQI values (no date parsing needed)
    aqi_values = data['aqi_value'].dropna().values
    
    print(f"AQI values count: {len(aqi_values)}")

    # Use available data (minimum 7 days)
    if len(aqi_values) < 7:
        return None, f"Not enough historical data for {area_name} (found {len(aqi_values)} records, need minimum 7)."

    # Use last 30 days if available, otherwise use all available data
    window_size = min(30, len(aqi_values))
    
    # Create multivariate features (23 dimensions)
    series = aqi_values[-window_size:]  # Take last window_size values
    
    features_df = pd.DataFrame(index=range(len(series)))
    features_df['aqi'] = series
    
    # Lag features (days 1-7)
    for i in range(1, 8):
        features_df[f'aqi_lag_{i}'] = features_df['aqi'].shift(i)
    
    # Rolling statistics (7-day window)
    features_df['rolling_mean_7'] = features_df['aqi'].rolling(window=7).mean()
    features_df['rolling_std_7'] = features_df['aqi'].rolling(window=7).std()
    features_df['rolling_min_7'] = features_df['aqi'].rolling(window=7).min()
    features_df['rolling_max_7'] = features_df['aqi'].rolling(window=7).max()
    
    # Rolling statistics (14-day window)
    features_df['rolling_mean_14'] = features_df['aqi'].rolling(window=14).mean()
    features_df['rolling_std_14'] = features_df['aqi'].rolling(window=14).std()
    features_df['rolling_min_14'] = features_df['aqi'].rolling(window=14).min()
    features_df['rolling_max_14'] = features_df['aqi'].rolling(window=14).max()
    
    # Temporal features (day index based)
    features_df['day_of_week'] = features_df.index % 7
    features_df['day_of_month'] = (features_df.index % 30) + 1
    features_df['month'] = ((features_df.index // 30) % 12) + 1
    features_df['quarter'] = ((features_df.index // 90) % 4) + 1
    features_df['day_of_year'] = features_df.index % 365
    
    # Difference features
    features_df['aqi_diff_1'] = features_df['aqi'].diff(1)
    features_df['aqi_diff_7'] = features_df['aqi'].diff(7)
    
    # Fill NaN values using ffill and bfill
    features_df = features_df.bfill().ffill()
    
    # Select all data
    recent_data = features_df.values
    
    # Normalize the features
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(recent_data)
    
    input_window = torch.FloatTensor(scaled_data).unsqueeze(0)
    
    with torch.no_grad():
        prediction_scaled = model(input_window)
    
    prediction_actual = prediction_scaled.numpy().flatten()  # Shape (7,)
    
    dummy_for_transform = np.tile(scaled_data[-1, :], (7, 1))
    dummy_for_transform[:, 0] = prediction_actual
    
    prediction_actual = scaler.inverse_transform(dummy_for_transform)[:, 0]
    
    return prediction_actual.tolist(), None

@app.route('/predict', methods=['GET'])
def predict_endpoint():
    try:
        state = request.args.get('state')
        area = request.args.get('area')

        if not state or not area:
            return jsonify({"error": "Please provide state and area parameters"}), 400

        forecast, error = get_prediction(state, area)
        
        if error:
            return jsonify({"status": "error", "message": error}), 404
        
        # Use forecast directly
        average_aqi = sum(forecast) / len(forecast)
        overall_condition = get_aqi_condition(average_aqi)
        
        forecast_by_day = [
            {
                "day": i + 1,
                "aqi": round(aqi_val, 2),
                "category": get_aqi_condition(aqi_val),
                "emoji": get_aqi_emoji(aqi_val)
            }
            for i, aqi_val in enumerate(forecast)
        ]
        
        return jsonify({
            "status": "success",
            "state": state,
            "area": area,
            "forecast": forecast_by_day,
            "average_aqi": round(average_aqi, 2),
            "condition": overall_condition,
            "note": "7-day AQI forecast based on historical data."
        })
    except Exception as e:
        print(f"Error in /predict: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "ReAtmos AQI Prediction API",
        "model_loaded": model is not None,
        "data_loaded": df is not None,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

@app.route('/api-info', methods=['GET'])
def api_info():
    """API documentation and usage information"""
    return jsonify({
        "service": "ReAtmos - AQI Prediction API",
        "version": "2.0",
        "description": "LSTM-based 7-day AQI forecasting",
        "endpoints": {
            "/predict": {
                "method": "GET",
                "description": "Get 7-day AQI prediction",
                "parameters": {
                    "state": "State name (required)",
                    "area": "City/Area name (required)"
                },
                "example": "/predict?state=Karnataka&area=Bengaluru"
            },
            "/health": {
                "method": "GET",
                "description": "Service health check"
            },
            "/api-info": {
                "method": "GET",
                "description": "Get this API documentation"
            }
        },
        "model_info": {
            "type": "LSTM Neural Network",
            "input_window": 30,
            "output_window": 7,
            "hidden_size": 64,
            "layers": 2,
            "trained_on": "Historical AQI data from India",
            "training_data_age": "1 year"
        },
        "aqi_categories": {
            "0-50": "Good ",
            "51-100": "Moderate",
            "101-150": "Unhealthy for Sensitive Groups",
            "151-200": "Unhealthy",
            "201-300": "Very Unhealthy",
            "301+": "Hazardous"
        },
        "note": "7-day AQI forecast based on historical data and LSTM neural network"
    })

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=False)