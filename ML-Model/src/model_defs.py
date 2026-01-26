import numpy as np
from sklearn.ensemble import RandomForestRegressor

def predict_aqi(features):
    model = RandomForestRegressor(n_estimators=100)
    prediction = model.predict([features])
    return {'aqi': float(prediction[0])}

def load_model():
    return RandomForestRegressor(n_estimators=100)
