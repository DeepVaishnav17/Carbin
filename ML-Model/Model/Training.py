import torch
import torch.nn as nn
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from model_defs import AQILSTM

# 1. Load and Filter
df = pd.read_csv('aqi.csv')
delhi_data = df[df['state'] == 'Delhi'].copy()
delhi_data['date'] = pd.to_datetime(delhi_data['date'], format='%d-%m-%Y')
series = delhi_data.sort_values('date').set_index('date')['aqi_value']
series = series.resample('D').mean().interpolate().values.reshape(-1, 1)

# 2. Scale
scaler = MinMaxScaler(feature_range=(0, 1))
scaled_data = scaler.fit_transform(series)

# 3. Create Sequences (Sliding Window)
def create_sequences(data, seq_length):
    xs, ys = [], []
    for i in range(len(data) - seq_length - 7):
        x = data[i:(i + seq_length)]
        y = data[(i + seq_length):(i + seq_length + 7)]
        xs.append(x)
        ys.append(y)
    return torch.FloatTensor(np.array(xs)), torch.FloatTensor(np.array(ys)).squeeze(-1)

X, y = create_sequences(scaled_data, 30)

# 4. Training Loop
model = AQILSTM()
criterion = nn.MSELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

print("Starting Training...")
for epoch in range(2000):
    model.train()
    optimizer.zero_grad()
    output = model(X)
    loss = criterion(output, y)
    loss.backward()
    optimizer.step()
    if (epoch+1) % 10 == 0:
        print(f'Epoch [{epoch+1}/2000], Loss: {loss.item():.4f}')

# 5. Save the Weights
torch.save(model.state_dict(), 'pretrained_model.pth')
print("Model saved as delhi_aqi_model.pth")