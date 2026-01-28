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

def get_realtime_aqi(city_name, state_name=None):
    """
    Fetch real-time AQI from WAQI (World Air Quality Index)
    Free API using demo token - works without registration
    """
    try:
        # Try with city name first
        url = f"https://api.waqi.info/feed/{city_name}/?token=demo"
        response = requests.get(url, timeout=5)
        data = response.json()
        
        if data.get('status') == 'ok':
            aqi_value = data['data'].get('aqi', None)
            if aqi_value is not None:
                return {
                    'city': city_name,
                    'aqi': float(aqi_value),
                    'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    'status': 'success',
                    'source': 'WAQI'
                }
        
        # Try with state,city format
        if state_name:
            url = f"https://api.waqi.info/feed/{state_name}/{city_name}/?token=demo"
            response = requests.get(url, timeout=5)
            data = response.json()
            
            if data.get('status') == 'ok':
                aqi_value = data['data'].get('aqi', None)
                if aqi_value is not None:
                    return {
                        'city': city_name,
                        'aqi': float(aqi_value),
                        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        'status': 'success',
                        'source': 'WAQI'
                    }
        
        return {
            'status': 'error',
            'message': f'Real-time data not available for {city_name}. Using predictions only.',
            'source': 'WAQI'
        }
    except requests.exceptions.RequestException as e:
        return {
            'status': 'error',
            'message': f'API Connection Error: {str(e)}. Using predictions only.',
            'source': 'WAQI'
        }

def adjust_predictions_with_realtime(predicted_values, current_aqi):
    """
    Adjust future predictions based on deviation from current real-time AQI.
    The model is trained on old data, so we calibrate it using current conditions.
    
    Strategy:
    - Calculate the difference between predicted Day 1 and actual current AQI
    - Apply this offset to smooth future predictions
    - Use exponential decay to gradually return to model's trend
    """
    if current_aqi is None:
        return predicted_values
    
    adjusted = list(predicted_values)
    day1_deviation = current_aqi - predicted_values[0]
    
    # Apply correction with exponential decay
    # Day 1 gets full correction, subsequent days get decreasing correction
    for i in range(len(adjusted)):
        # Decay factor: decrease correction as we go further into future
        decay_factor = np.exp(-i * 0.3)  # Exponential decay
        adjustment = day1_deviation * decay_factor * 0.7  # Use 70% of deviation for smoothing
        adjusted[i] = adjusted[i] + adjustment
        
        # Ensure AQI stays in reasonable range (0-500)
        adjusted[i] = max(0, min(500, adjusted[i]))
    
    return adjusted

def create_comparison_report(predicted_values, current_aqi, city_name, state_name, realtime_data):
    """
    Create a detailed comparison report between predictions and real-time data
    """
    report = {
        'has_realtime_data': current_aqi is not None,
        'realtime_aqi': current_aqi,
        'city': city_name,
        'state': state_name,
        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    
    if current_aqi is not None:
        day1_deviation = abs(current_aqi - predicted_values[0])
        percent_error = (day1_deviation / current_aqi * 100) if current_aqi != 0 else 0
        
        report['comparison'] = {
            'current_aqi': round(current_aqi, 2),
            'predicted_day1': round(predicted_values[0], 2),
            'deviation': round(day1_deviation, 2),
            'percent_error': round(percent_error, 2),
            'current_category': get_aqi_condition(current_aqi),
            'current_emoji': get_aqi_emoji(current_aqi),
        }
        
        # Trend analysis
        avg_predicted = np.mean(predicted_values)
        trend = "Increasing ↑" if predicted_values[-1] > predicted_values[0] else "Decreasing ↓"
        best_day = np.argmin(predicted_values) + 1
        worst_day = np.argmax(predicted_values) + 1
        
        report['insights'] = {
            'average_predicted_aqi': round(avg_predicted, 2),
            'trend': trend,
            'best_day': int(best_day),
            'best_day_aqi': round(predicted_values[int(best_day) - 1], 2),
            'worst_day': int(worst_day),
            'worst_day_aqi': round(predicted_values[int(worst_day) - 1], 2),
        }
    
    return report

def get_prediction(state_name, area_name):
    state_name_lower = state_name.lower()
    area_name_lower = area_name.lower()
    
    data = df[(df['state'].str.lower() == state_name_lower) & (df['area'].str.lower() == area_name_lower)].copy()
    if data.empty:
        return None, "Area not found in database."

    data['date'] = pd.to_datetime(data['date'], format='%d-%m-%Y')
    series = data.sort_values('date').set_index('date')['aqi_value']
    series = series.resample('D').mean().interpolate()

    if len(series) < 30:
        return None, "Not enough historical data (30 days required)."

    # Create multivariate features (23 dimensions)
    # This includes the original value + 22 engineered features (lags, rolling stats, etc.)
    features_df = pd.DataFrame(index=series.index)
    features_df['aqi'] = series.values
    
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
    
    # Temporal features
    features_df['day_of_year'] = features_df.index.dayofyear
    features_df['day_of_week'] = features_df.index.dayofweek
    features_df['day_of_month'] = features_df.index.day
    features_df['month'] = features_df.index.month
    features_df['quarter'] = features_df.index.quarter
    
    # Difference features
    features_df['aqi_diff_1'] = features_df['aqi'].diff(1)
    features_df['aqi_diff_7'] = features_df['aqi'].diff(7)
    
    # Fill NaN values using ffill and bfill
    features_df = features_df.bfill().ffill()
    
    # Select last 30 days and get the last row for prediction
    recent_data = features_df.iloc[-30:].values
    
    # Normalize the features
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(recent_data)
    
    input_window = torch.FloatTensor(scaled_data).unsqueeze(0)
    
    with torch.no_grad():
        prediction_scaled = model(input_window)
    
    prediction_actual = prediction_scaled.numpy().flatten()  # Shape (7,)
    
   
    dummy_for_transform = np.tile(scaled_data[-1, :], (7, 1))  # Repeat last row 7 times
    dummy_for_transform[:, 0] = prediction_actual  # Put predictions in AQI column
    
    prediction_actual = scaler.inverse_transform(dummy_for_transform)[:, 0]
    
    return prediction_actual.tolist(), None

@app.route('/predict', methods=['GET'])
def predict_endpoint():
    state = request.args.get('state')
    area = request.args.get('area')
    use_realtime = request.args.get('realtime', 'true').lower() == 'true'

    if not state or not area:
        return jsonify({"error": "Please provide state and area parameters"}), 400

    forecast, error = get_prediction(state, area)
    
    if error:
        return jsonify({"status": "error", "message": error}), 404
    
    # Fetch real-time AQI and adjust predictions
    realtime_data = None
    adjusted_forecast = forecast
    
    if use_realtime:
        realtime_data = get_realtime_aqi(area, state)
        
        if realtime_data.get('status') == 'success':
            current_aqi = realtime_data.get('aqi')
            # Adjust predictions based on real-time data
            adjusted_forecast = adjust_predictions_with_realtime(forecast, current_aqi)
    
    # Use adjusted forecast for final output
    average_aqi = sum(adjusted_forecast) / len(adjusted_forecast)
    overall_condition = get_aqi_condition(average_aqi)
    
    forecast_by_day = [
        {
            "day": i + 1,
            "aqi": round(aqi_val, 2),
            "category": get_aqi_condition(aqi_val),
            "emoji": get_aqi_emoji(aqi_val)
        }
        for i, aqi_val in enumerate(adjusted_forecast)
    ]
    
    # Create detailed comparison report
    comparison_report = create_comparison_report(
        adjusted_forecast,
        realtime_data.get('aqi') if realtime_data and realtime_data.get('status') == 'success' else None,
        area,
        state,
        realtime_data
    )
    
    return jsonify({
        "status": "success",
        "state": state,
        "area": area,
        "forecast": forecast_by_day,
        "average_aqi": round(average_aqi, 2),
        "condition": overall_condition,
        "comparison_report": comparison_report,
        "note": "Predictions adjusted based on real-time AQI data. Model trained on historical data; real-time calibration improves accuracy."
    })

@app.route('/predict-with-comparison', methods=['GET'])
def predict_with_comparison():
    """
    Enhanced endpoint that provides detailed comparison between predictions and real-time AQI
    Includes adjusted predictions and accuracy metrics
    """
    state = request.args.get('state')
    area = request.args.get('area')

    if not state or not area:
        return jsonify({"error": "Please provide state and area parameters"}), 400

    forecast, error = get_prediction(state, area)
    
    if error:
        return jsonify({"status": "error", "message": error}), 404
    
    # Fetch real-time AQI
    realtime_data = get_realtime_aqi(area, state)
    
    response_data = {
        "status": "success",
        "state": state,
        "area": area,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    
    # Add raw predictions
    response_data['raw_predictions'] = [
        {
            "day": i + 1,
            "aqi": round(aqi_val, 2),
            "category": get_aqi_condition(aqi_val),
            "emoji": get_aqi_emoji(aqi_val)
        }
        for i, aqi_val in enumerate(forecast)
    ]
    
    # If real-time data available, provide adjusted predictions
    if realtime_data.get('status') == 'success':
        current_aqi = realtime_data.get('aqi')
        adjusted_forecast = adjust_predictions_with_realtime(forecast, current_aqi)
        
        response_data['realtime_aqi'] = round(current_aqi, 2)
        response_data['realtime_category'] = get_aqi_condition(current_aqi)
        response_data['realtime_emoji'] = get_aqi_emoji(current_aqi)
        
        # Adjusted predictions
        response_data['adjusted_predictions'] = [
            {
                "day": i + 1,
                "aqi": round(aqi_val, 2),
                "category": get_aqi_condition(aqi_val),
                "emoji": get_aqi_emoji(aqi_val)
            }
            for i, aqi_val in enumerate(adjusted_forecast)
        ]
        
        # Accuracy metrics
        day1_raw_diff = abs(current_aqi - forecast[0])
        day1_adjusted_diff = abs(current_aqi - adjusted_forecast[0])
        
        response_data['accuracy_metrics'] = {
            'raw_prediction_error_day1': round(day1_raw_diff, 2),
            'adjusted_prediction_error_day1': round(day1_adjusted_diff, 2),
            'raw_prediction_error_percent': round((day1_raw_diff / current_aqi * 100) if current_aqi != 0 else 0, 2),
            'adjusted_prediction_error_percent': round((day1_adjusted_diff / current_aqi * 100) if current_aqi != 0 else 0, 2),
            'improvement_percent': round(((day1_raw_diff - day1_adjusted_diff) / day1_raw_diff * 100) if day1_raw_diff > 0 else 0, 2)
        }
        
        # Summary
        avg_adjusted = np.mean(adjusted_forecast)
        response_data['summary'] = {
            'average_aqi': round(avg_adjusted, 2),
            'overall_condition': get_aqi_condition(avg_adjusted),
            'trend': "Increasing ↑" if adjusted_forecast[-1] > adjusted_forecast[0] else "Decreasing ↓",
            'best_day': int(np.argmin(adjusted_forecast) + 1),
            'worst_day': int(np.argmax(adjusted_forecast) + 1),
        }
        
        response_data['info'] = {
            'realtime_source': realtime_data.get('source', 'WAQI'),
            'model_status': 'Calibrated with real-time data',
            'note': 'Predictions adjusted based on current AQI to account for model training on historical data'
        }
    else:
        response_data['realtime_info'] = realtime_data.get('message', 'Real-time data unavailable')
        response_data['info'] = {
            'model_status': 'Using raw predictions (no real-time calibration)',
            'note': 'Real-time AQI API unavailable. Predictions based on historical model only.'
        }
    
    return jsonify(response_data)

@app.route('/realtime-aqi', methods=['GET'])
def get_realtime_aqi_endpoint():
    """
    Fetch current real-time AQI for a city
    No parameters required - uses WAQI API with free token
    """
    city = request.args.get('city')
    state = request.args.get('state')
    
    if not city:
        return jsonify({"error": "Please provide city parameter"}), 400
    
    realtime_data = get_realtime_aqi(city, state)
    
    if realtime_data.get('status') == 'success':
        return jsonify({
            "status": "success",
            "city": city,
            "aqi": round(realtime_data['aqi'], 2),
            "category": get_aqi_condition(realtime_data['aqi']),
            "emoji": get_aqi_emoji(realtime_data['aqi']),
            "timestamp": realtime_data['timestamp'],
            "source": realtime_data['source']
        })
    else:
        return jsonify({
            "status": "error",
            "city": city,
            "message": realtime_data.get('message', 'Unable to fetch real-time AQI'),
            "source": realtime_data.get('source', 'WAQI')
        }), 404

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
        "service": "ReAtmos - Real-time AQI Prediction & Comparison API",
        "version": "2.0",
        "description": "LSTM-based 7-day AQI forecasting with real-time calibration",
        "endpoints": {
            "/predict": {
                "method": "GET",
                "description": "Get 7-day AQI prediction with real-time calibration",
                "parameters": {
                    "state": "State name (required)",
                    "area": "City/Area name (required)",
                    "realtime": "Use real-time data for adjustment (default: true)"
                },
                "example": "/predict?state=Karnataka&area=Bengaluru"
            },
            "/predict-with-comparison": {
                "method": "GET",
                "description": "Get detailed comparison between raw predictions and real-time AQI",
                "parameters": {
                    "state": "State name (required)",
                    "area": "City/Area name (required)"
                },
                "response_includes": [
                    "Raw predictions",
                    "Real-time AQI",
                    "Adjusted predictions",
                    "Accuracy metrics",
                    "Improvement percentage"
                ],
                "example": "/predict-with-comparison?state=Karnataka&area=Bengaluru"
            },
            "/realtime-aqi": {
                "method": "GET",
                "description": "Fetch current real-time AQI for a city",
                "parameters": {
                    "city": "City name (required)",
                    "state": "State name (optional)"
                },
                "example": "/realtime-aqi?city=Bengaluru&state=Karnataka"
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
        "note": "All predictions are automatically calibrated with real-time AQI data to account for model training on historical data"
    })

if __name__ == '__main__':
    app.run(host="0.0.0.0",port=5000, debug=False)