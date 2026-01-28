<p align="center">
  <img src="https://img.shields.io/badge/ReAtmos-Climate%20Action%20Platform-00C853?style=for-the-badge&logo=leaflet&logoColor=white" alt="ReAtmos"/>
</p>

<h1 align="center">🌍 ReAtmos</h1>
<h3 align="center">AI-Powered Climate Action Platform with Blockchain Rewards</h3>

<p align="center">
  <strong>Transforming Air Quality Predictions into Real-World Environmental Action</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/PyTorch-LSTM-EE4C2C?style=flat-square&logo=pytorch&logoColor=white" alt="PyTorch"/>
  <img src="https://img.shields.io/badge/Blockchain-Custom-F7931A?style=flat-square&logo=bitcoin&logoColor=white" alt="Blockchain"/>
  <img src="https://img.shields.io/badge/Django-4.0+-092E20?style=flat-square&logo=django&logoColor=white" alt="Django"/>
</p>

<p align="center">
  <a href="#-the-problem">Problem</a> •
  <a href="#-our-solution">Solution</a> •
  <a href="#-key-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-team">Team</a>
</p>

---

## 🔴 The Problem

Air pollution and rising carbon emissions are among the most critical global challenges today. While governments and organizations publish AQI data and carbon statistics daily, this information remains **passive** — people can see that pollution is increasing, but there is **no system that converts this awareness into immediate, organized, community-driven action**.

### Existing Solutions Suffer From Three Major Gaps:

| Gap | Description |
|-----|-------------|
| **🔮 Prediction without Action** | AQI and carbon levels are monitored and predicted, but there is no mechanism that uses these predictions to trigger real-world environmental activities at the right time and place. |
| **👥 Lack of Public Participation** | Environmental events like tree plantation, clean-up drives, or cycling campaigns rely heavily on volunteers, but there is no intelligent system that mobilizes citizens when pollution risk is high. |
| **🎁 No Incentive for Climate-Positive Behavior** | People are rarely rewarded for participating in eco-friendly actions. There is no structured reward or motivation system that recognizes individuals and organizers contributing to carbon reduction. |

> **Result:** Air quality data remains informational rather than actionable, communities remain uncoordinated, and individuals lack motivation to participate in climate-improving activities.

---

## 💡 Our Solution

**ReAtmos** is an integrated platform that bridges the gap between environmental data and real-world climate action.

<p align="center">
  <img src="https://img.shields.io/badge/1-PREDICT-blue?style=for-the-badge" alt="Predict"/>
  <img src="https://img.shields.io/badge/→-white?style=for-the-badge" alt="arrow"/>
  <img src="https://img.shields.io/badge/2-ORGANIZE-green?style=for-the-badge" alt="Organize"/>
  <img src="https://img.shields.io/badge/→-white?style=for-the-badge" alt="arrow"/>
  <img src="https://img.shields.io/badge/3-MOBILIZE-orange?style=for-the-badge" alt="Mobilize"/>
  <img src="https://img.shields.io/badge/→-white?style=for-the-badge" alt="arrow"/>
  <img src="https://img.shields.io/badge/4-REWARD-gold?style=for-the-badge" alt="Reward"/>
</p>

### What ReAtmos Does:

| Feature | Description |
|---------|-------------|
| **🔮 Predicts** | Uses LSTM deep learning models to forecast AQI levels for the next 7 days with real-time calibration |
| **📅 Converts** | Transforms high-pollution predictions into timely environmental events (tree plantation, clean-up drives, cycling campaigns) |
| **📢 Mobilizes** | Notifies citizens via automated QR-based event invites with location-based targeting |
| **🪙 Rewards** | Distributes **CarbonCoin (CC)** — our custom blockchain cryptocurrency — to participants for verified attendance |

---

## ⭐ Key Features

### 🤖 AI-Powered AQI Prediction
- **LSTM Neural Network** trained on historical pollution data
- **7-day forecasting** with real-time calibration from WAQI API
- **23 engineered features** including lags, rolling statistics, and temporal patterns
- **Multi-city support** across India with automatic trend analysis

### 📊 Real-Time Environmental Dashboard
- Live AQI monitoring with condition categorization
- Interactive maps showing user distribution and API centers
- Forecast visualization with trend insights
- Best/worst day predictions for activity planning

### 📅 Smart Event Management
- **Create environmental events** (Tree Plantation, Clean-up Drives, Cycling Campaigns)
- **Location-based event discovery** for nearby activities
- **QR Code attendance system** with email delivery
- **Automatic event archival** for past events

### 🪙 CarbonCoin Blockchain Rewards
- **Custom cryptocurrency** built from scratch in Python
- **ECDSA signatures** (secp256k1) for secure transactions
- **Proof-of-Work mining** with configurable difficulty
- **Automatic reward distribution** to verified event attendees
- **Gateway API** for seamless frontend integration

### 🔐 Secure User Management
- **OAuth 2.0 integration** (Google authentication)
- **JWT-based session management**
- **Role-based access control** (Admin/User)
- **Wallet integration** per user account

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              ReAtmos Platform Architecture                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│    ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐     │
│    │   React.js      │   API   │   Node.js       │   API   │   Django        │     │
│    │   Frontend      │◄───────►│   Backend       │◄───────►│   Backend       │     │
│    │   (Vite)        │         │   (Express)     │         │   (REST API)    │     │
│    │   Port: 5173    │         │   Port: 5000    │         │   Port: 8001    │     │
│    └────────┬────────┘         └────────┬────────┘         └────────┬────────┘     │
│             │                           │                           │               │
│             │                           │                           │               │
│             │         ┌─────────────────┼─────────────────┐         │               │
│             │         │                 │                 │         │               │
│             │         ▼                 ▼                 ▼         │               │
│             │    ┌──────────┐    ┌──────────┐    ┌──────────┐      │               │
│             │    │ MongoDB  │    │ MongoDB  │    │ ML Model │      │               │
│             │    │ (Users)  │    │ (Events) │    │ (PyTorch)│      │               │
│             │    └──────────┘    └──────────┘    │ Port:5001│      │               │
│             │                                    └────┬─────┘      │               │
│             │                                         │            │               │
│             └──────────────────┬──────────────────────┘            │               │
│                                │                                   │               │
│                                ▼                                   ▼               │
│    ┌───────────────────────────────────────────────────────────────────────────┐   │
│    │                    CarbonCoin Blockchain Network                          │   │
│    ├───────────────────────────────────────────────────────────────────────────┤   │
│    │                                                                           │   │
│    │   ┌──────────┐    ┌──────────┐    ┌──────────┐                           │   │
│    │   │ Miner 1  │    │ Miner 2  │    │ Miner 3  │     Mining Nodes          │   │
│    │   │ :3000    │    │ :3001    │    │ :3002    │     (PoW Consensus)       │   │
│    │   └────┬─────┘    └────┬─────┘    └────┬─────┘                           │   │
│    │        │               │               │                                  │   │
│    │        └───────────────┼───────────────┘                                  │   │
│    │                        ▼                                                  │   │
│    │               ┌────────────────┐       ┌────────────────┐                │   │
│    │               │  Collection    │       │  Gateway API   │◄── Frontend   │   │
│    │               │  Node :7000    │       │  :8000         │    Integration │   │
│    │               └───────┬────────┘       └────────────────┘                │   │
│    │                       │                                                   │   │
│    │                       ▼                                                   │   │
│    │   ┌──────────┐    ┌──────────┐    ┌──────────┐                           │   │
│    │   │ User 1   │    │ User 2   │    │ User N   │    User Wallets           │   │
│    │   │ :5000    │    │ :5001    │    │ :500X    │    (Dynamic Creation)     │   │
│    │   └──────────┘    └──────────┘    └──────────┘                           │   │
│    │                                                                           │   │
│    └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | Modern UI with hooks and context |
| **Vite** | Lightning-fast build tooling |
| **React Router** | Client-side navigation |
| **Axios** | HTTP client with interceptors |
| **CSS3** | Custom animations and responsive design |

### Backend Services
| Technology | Purpose |
|------------|---------|
| **Node.js + Express** | Main API server for users and events |
| **Django + DRF** | Secondary API for maps and data visualization |
| **Passport.js** | OAuth 2.0 authentication (Google) |
| **Nodemailer** | QR code email delivery |
| **MongoDB** | NoSQL database for flexible schemas |

### Machine Learning
| Technology | Purpose |
|------------|---------|
| **PyTorch** | Deep learning framework |
| **LSTM Networks** | Time-series AQI prediction |
| **Pandas/NumPy** | Data processing and feature engineering |
| **Flask** | ML model API serving |
| **WAQI API** | Real-time AQI calibration |

### Blockchain
| Technology | Purpose |
|------------|---------|
| **Python** | Core blockchain implementation |
| **ECDSA (secp256k1)** | Cryptographic signatures |
| **Cython** | 2-5x performance optimization |
| **Flask** | Node API endpoints |
| **JSON/File Storage** | Persistent blockchain data |

---

## 📁 Project Structure

```
ReAtmos/
├── 📁 carbon-frontend/          # React.js Frontend Application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Route pages (Home, Events, Profile, Admin)
│   │   ├── context/             # React Context (Auth)
│   │   └── api/                 # Axios instance and API calls
│   └── package.json
│
├── 📁 carbon-backend/           # Node.js Backend API
│   ├── src/
│   │   ├── controllers/         # Route handlers (Auth, Events, Wallet)
│   │   ├── models/              # MongoDB schemas (User, Event, Wallet)
│   │   ├── middleware/          # Auth, Admin, Location middleware
│   │   ├── routes/              # API route definitions
│   │   └── utils/               # Email sender, helpers
│   └── server.js
│
├── 📁 ML-Model/                 # AI/ML Prediction Service
│   ├── Model/
│   │   └── Training.py          # LSTM model training script
│   ├── Dataset/
│   │   └── new_aqi.csv          # Historical AQI data
│   └── src/
│       ├── app.py               # Flask API for predictions
│       └── model_defs.py        # LSTM model architecture
│
├── 📁 CarbonCoin-CC-Blockchain_Network/   # Custom Blockchain
│   ├── blockchain/              # Core blockchain logic
│   ├── wallet/                  # ECDSA wallet implementation
│   ├── transaction/             # Transaction handling
│   ├── node/                    # P2P node implementation
│   ├── gateway/                 # Frontend API gateway
│   ├── cython_modules/          # Performance optimizations
│   └── scripts/                 # PowerShell management scripts
│
└── 📁 ReAtmos/                  # Django Backend (Maps & Analytics)
    ├── pollution/               # Main Django app
    │   ├── views.py             # API views
    │   ├── services.py          # Forecast services
    │   └── mongo.py             # MongoDB connection
    └── frontend-next/           # Next.js dashboard (optional)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **Python** >= 3.10
- **MongoDB** (local or Atlas)
- **Git**

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/DeepVaishnav17/Carbin.git
cd Carbin
```

### 2️⃣ Start the ML Model Service

```powershell
cd ML-Model
pip install -r requirements.txt
python src/app.py
# Running on http://localhost:5001
```

### 3️⃣ Start the Blockchain Network

```powershell
cd CarbonCoin-CC-Blockchain_Network
pip install -r requirements.txt

# Start all nodes
.\blockchain.ps1 start-network

# Start mining
.\blockchain.ps1 start-mining

# Start gateway API
.\blockchain.ps1 start-gateway
# Gateway running on http://localhost:8000
```

### 4️⃣ Start the Node.js Backend

```powershell
cd carbon-backend
npm install

# Create .env file
# MONGO_URI=your_mongodb_uri
# JWT_SECRET=your_secret
# GOOGLE_CLIENT_ID=your_client_id
# GOOGLE_CLIENT_SECRET=your_client_secret
# FRONTEND_URL=http://localhost:5173

npm start
# Running on http://localhost:5000
```

### 5️⃣ Start the React Frontend

```powershell
cd carbon-frontend
npm install
npm run dev
# Running on http://localhost:5173
```

### 6️⃣ (Optional) Start Django Backend

```powershell
cd ReAtmos
pip install -r requirements.txt
python manage.py runserver
# Running on http://localhost:8000
```

---

## 📡 API Endpoints

### ML Model API (Port 5001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/predict` | Get 7-day AQI prediction |
| `GET` | `/realtime/{city}` | Get real-time AQI |
| `GET` | `/health` | Health check |

### Main Backend API (Port 5000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | User registration |
| `POST` | `/api/auth/login` | User login |
| `GET` | `/api/auth/me` | Get current user |
| `GET` | `/api/events` | List all events |
| `POST` | `/api/events/create` | Create new event |
| `POST` | `/api/events/join/:id` | Join an event |
| `POST` | `/api/wallet/create` | Create blockchain wallet |
| `GET` | `/api/wallet/balance` | Get CC balance |

### Blockchain Gateway API (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/balance?wallet=` | Get wallet balance |
| `GET` | `/api/transactions?wallet=` | Get transaction history |
| `POST` | `/create_wallet` | Create new wallet |
| `POST` | `/assign_reward` | Assign CC to user |
| `GET` | `/health` | Health check |

---

## 🎮 User Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           User Journey                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  1. User Signs Up / Login     │
                    │     (OAuth or Email)          │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  2. Set Location & API Center │
                    │     (City-based targeting)    │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  3. View AQI Predictions      │
                    │     (7-day LSTM forecast)     │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  4. Discover/Join Events      │
                    │     (Tree plantation, etc.)   │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  5. Receive QR via Email      │
                    │     (Attendance verification) │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  6. Attend Event & Scan QR    │
                    │     (Organizer verification)  │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  7. Earn CarbonCoins (CC)     │
                    │     (Blockchain rewards)      │
                    └───────────────────────────────┘
```

---

## 🪙 CarbonCoin Economics

| Parameter | Value |
|-----------|-------|
| **Symbol** | CC |
| **Mining Reward** | 10 CC per block |
| **Event Attendance Reward** | 5-20 CC (configurable) |
| **Organizer Bonus** | 50 CC per successful event |
| **Auto-Transfer Threshold** | 100 CC (miner → collection) |
| **Mining Difficulty** | Configurable (default: 4 zeros) |

---

## 🔮 Future Roadmap

- [ ] **Mobile App** - React Native cross-platform application
- [ ] **Carbon Credit Marketplace** - Trade CC tokens
- [ ] **Government Integration** - Official AQI data feeds
- [ ] **IoT Sensors** - Real-time hyperlocal AQI monitoring
- [ ] **NFT Certificates** - Proof of participation badges
- [ ] **Corporate Partnerships** - CSR activity tracking
- [ ] **Multi-Language Support** - Hindi, Regional languages

---

## 🏆 Achievements

- 🥇 **Built from scratch** — Custom blockchain, ML models, full-stack app
- 🔗 **End-to-end integration** — Prediction → Event → Attendance → Reward
- 🌍 **Real-world impact** — Converting data into action
- 🔒 **Production-ready security** — OAuth, JWT, ECDSA

---

## 👥 Team

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/DeepVaishnav17">
        <img src="https://via.placeholder.com/100" width="100px;" alt=""/>
        <br />
        <sub><b>Deep vaishnav - Leader</b></sub>
      </a>
      <br />
      <sub>Full Stack Developer</sub>
      <br />
      <sub>🔧 Backend & Frontend</sub>
    </td>
    <td align="center">
      <a href="https://github.com/ronakmaniya">
        <img src="https://via.placeholder.com/100" width="100px;" alt=""/>
        <br />
        <sub><b>Ronak Maniya</b></sub>
      </a>
      <br />
      <sub>Blockchain Developer</sub>
      <br />
      <sub>🪙 CarbonCoin Network</sub>
    </td>
    <td align="center">
      <a href="https://github.com/Shiv-61">
        <img src="https://via.placeholder.com/100" width="100px;" alt=""/>
        <br />
        <sub><b>Shiv Gowda</b></sub>
      </a>
      <br />
      <sub>ML Engineer</sub>
      <br />
      <sub>🤖 AQI Prediction Model</sub>
    </td>
    <td align="center">
      <a href="https://github.com/patelmann2212">
        <img src="https://via.placeholder.com/100" width="100px;" alt=""/>
        <br />
        <sub><b>Mann Patel</b></sub>
      </a>
      <br />
      <sub>UI/UX Designer</sub>
      <br />
      <sub>🎨 Design & Frontend</sub>
    </td>
  </tr>
</table>

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [World Air Quality Index](https://waqi.info/) for real-time AQI API
- [PyTorch](https://pytorch.org/) for deep learning framework
- [MongoDB](https://www.mongodb.com/) for flexible data storage
- All open-source contributors who made this possible

- **GitHub Repository:** https://github.com/DeepVaishnav17/Carbin
- **Demo Video (YouTube):** https://youtu.be/KkNYLWnSKHg
- **Devfolio Project Submission:** https://devfolio.co/projects/reatmos-d05f
- **DUHacks 5.0 (Attended Hackathon Page):** https://duhacks5.devfolio.co/overview?slug=duhacks5.devfolio.co

---

<p align="center">
  <strong>🌱 Built with passion for a cleaner planet 🌍</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Made%20with-❤️-red?style=for-the-badge" alt="Made with love"/>
  <img src="https://img.shields.io/badge/For-DUHacks-blue?style=for-the-badge" alt="DUHacks"/>
</p>

<p align="center">
  <sub>If you found this project useful, please consider giving it a ⭐!</sub>
</p>
