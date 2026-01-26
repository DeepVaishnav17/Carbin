import pandas as pd
from sklearn.model_selection import train_test_split
from tensorflow import keras

# Load dataset
data = pd.read_csv('Dataset/new_aqi.csv')
print("Dataset loaded successfully")
