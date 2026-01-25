# CarbonCoin (CC) Blockchain Network

A high-performance blockchain network for carbon credits/rewards, built with Python and optional Cython optimizations.

## 🌿 Overview

CarbonCoin (CC) is a blockchain-based reward system designed for environmental initiatives. Users earn CC tokens for participating in eco-friendly events, which can be tracked and transferred on the blockchain.

### Key Features

- 🪙 **CarbonCoin (CC)** - Custom cryptocurrency for carbon rewards
- ⛏️ **3 Miner Nodes** - Mine blocks and earn 10 CC per block
- 💰 **Collection Node** - Central node that distributes rewards to users
- 👥 **User Nodes** - Receive and transfer carbon coins
- 🔗 **Automatic Peer Discovery** - Nodes auto-connect via bootstrap peers
- ⚡ **Cython Optimization** - 2-5x faster mining with C extensions (optional)
- 🔐 **ECDSA Signatures** - Secure transaction signing (secp256k1)
- 🔄 **Auto-Transfer** - Miners auto-transfer to collection when balance ≥ 100 CC

## 📋 Network Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CarbonCoin Network                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
│   │ Miner 1  │    │ Miner 2  │    │ Miner 3  │                 │
│   │ :3000    │    │ :3001    │    │ :3002    │                 │
│   └────┬─────┘    └────┬─────┘    └────┬─────┘                 │
│        │               │               │                        │
│        │   Mining rewards (10 CC)      │                        │
│        │   Auto-transfer (≥100 CC)     │                        │
│        └───────────────┼───────────────┘                        │
│                        ▼                                        │
│               ┌────────────────┐                                │
│               │  Collection    │                                │
│               │  Node :7000    │                                │
│               └───────┬────────┘                                │
│                       │                                         │
│                       │  Claim rewards (5 CC)                   │
│                       ▼                                         │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
│   │ User 1   │    │ User 2   │    │ User 3   │    ...          │
│   │ :5000    │    │ :5001    │    │ :5002    │                 │
│   └──────────┘    └──────────┘    └──────────┘                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Node Types

| Type           | Ports     | Purpose                                           |
| -------------- | --------- | ------------------------------------------------- |
| **Miner**      | 3000-3002 | Mine blocks, earn CC, auto-transfer to collection |
| **Collection** | 7000      | Receive from miners, reward users for claims      |
| **User**       | 5000+     | Claim rewards, transfer coins                     |

## 🚀 Quick Start

### 1. Install Dependencies

```powershell
cd blockchain_network
python -m pip install -r requirements.txt
```

### 2. (Optional) Build Cython for Faster Mining

```powershell
.\blockchain.ps1 build
```

### 3. Start the Network

```powershell
# Start all nodes (3 miners + 1 collection) - peers auto-connect!
.\blockchain.ps1 start-network
```

### 4. Start Mining

```powershell
.\blockchain.ps1 start-mining
```

### 5. (Optional) Create a User Node

```powershell
.\blockchain.ps1 create-user
# Or manually: python run_node.py 5000
```

## 💻 Controller Commands

Use the main controller script for all operations:

```powershell
.\blockchain.ps1 start-network    # Start all nodes (auto peer connection)
.\blockchain.ps1 start-mining     # Start mining on all miners
.\blockchain.ps1 stop-mining      # Stop mining on all miners
.\blockchain.ps1 create-user      # Create a new user node
.\blockchain.ps1 status           # Check node status
.\blockchain.ps1 stop-network     # Stop all nodes
.\blockchain.ps1 build            # Build Cython extensions
.\blockchain.ps1 help             # Show all commands
```

## 💻 Manual Node Startup

Start nodes individually in separate terminals:

```powershell
# Terminal 1: Collection Node
python run_node.py 7000

# Terminal 2-4: Miner Nodes
python run_node.py 3000
python run_node.py 3001
python run_node.py 3002

# Terminal 5: User Node
python run_node.py 5000
```

**Note:** Nodes automatically discover and connect to each other via bootstrap peers!

## 📡 API Usage

### Check Node Status

```powershell
# Node info
Invoke-RestMethod -Uri "http://localhost:7000/"

# Health check
Invoke-RestMethod -Uri "http://localhost:7000/health"

# Network statistics
Invoke-RestMethod -Uri "http://localhost:7000/stats"

# View all balances
Invoke-RestMethod -Uri "http://localhost:7000/balances"
```

### Mining Operations (Miner Nodes)

```powershell
# Start mining + auto-transfer
Invoke-RestMethod -Uri "http://localhost:3000/miner/start" -Method POST

# Stop mining
Invoke-RestMethod -Uri "http://localhost:3000/miner/stop" -Method POST
```

### Assign Reward (Collection Node)

```powershell
# Collection node assigns 5 CC to a user
$body = @{
    user_address = "user_wallet_address_here"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:7000/assign_reward" -Method POST -Body $body -ContentType "application/json"
```

### Transfer Coins

```powershell
$body = @{
    receiver = "recipient_address"
    amount = 10
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/transfer" -Method POST -Body $body -ContentType "application/json"
```

### View Blockchain

```powershell
# View full chain
Invoke-RestMethod -Uri "http://localhost:7000/chain"

# View pending transactions
Invoke-RestMethod -Uri "http://localhost:7000/mempool"

# View transaction history
Invoke-RestMethod -Uri "http://localhost:5000/transactions"
```

See [API_ENDPOINTS.md](API_ENDPOINTS.md) for complete API documentation.

## ⚙️ Configuration

Edit `config.py` to customize:

```python
COIN_NAME = "CarbonCoin"
COIN_SYMBOL = "CC"
MINING_REWARD = 10.0                    # CC per block
ASSIGN_REWARD = 5.0                     # CC per reward assignment
MINER_AUTO_TRANSFER_THRESHOLD = 100.0   # Auto-transfer threshold
MAX_TRANSACTIONS_PER_BLOCK = 1          # Transactions per block

# Bootstrap peers for auto-discovery
BOOTSTRAP_PEERS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:7000",
]
```

## 📁 Project Structure

```
blockchain_network/
├── blockchain/              # Core blockchain logic
│   ├── block.py            # Block class with hash calculation
│   └── blockchain.py       # Chain management, mining, balances
├── cython_modules/         # C-optimized performance modules
│   ├── block_utils.pyx     # Fast mining
│   ├── crypto_utils.pyx    # Fast hashing
│   └── wallet_utils.pyx    # Fast address generation
├── network/
│   └── app.py              # Flask REST API (all endpoints)
├── node/
│   └── node.py             # Node types, services, peer management
├── transaction/
│   └── transaction.py      # Transaction handling, signatures
├── wallet/
│   └── wallet.py           # ECDSA key management
├── scripts/                # PowerShell utility scripts
│   ├── network_start.ps1   # Launch all nodes
│   ├── mining_start.ps1    # Start mining on miners
│   ├── mining_stop.ps1     # Stop mining
│   ├── network_stop.ps1    # Stop all nodes
│   └── create_user_node.ps1 # Create user node
├── config.py               # Network configuration
├── run_node.py             # Node startup script
├── blockchain.ps1          # Main controller script
└── API_ENDPOINTS.md        # API documentation
```

## 🔧 How It Works

### Automatic Peer Discovery

1. New node starts and reads `BOOTSTRAP_PEERS` from config
2. Connects to available bootstrap peers
3. Announces itself to the network
4. Receives peer lists from connected nodes
5. All nodes end up fully connected!

### Coin Generation (Mining)

1. **Miners mine blocks** - Each block awards 10 CC to the miner (coinbase transaction)
2. **Auto-transfer** - When miner balance ≥ 100 CC, automatically transfers to collection node
3. **Collection assigns rewards** - Collection node calls `/assign_reward` to send 5 CC to users

### Transaction Flow

1. User/node creates transaction with amount and receiver
2. Transaction is signed with ECDSA private key
3. Transaction broadcast to all peers
4. Miner includes transaction in next block (max 1 per block)
5. Block is broadcast to network
6. All nodes update their chain via consensus

### Balance Validation

- All transfers check sender has sufficient balance
- Insufficient balance returns error: `"Insufficient balance. Have: X CC, Need: Y CC"`
- Coinbase transactions (mining rewards) create new coins

## 🏎️ Performance

Build Cython extensions for faster mining:

```powershell
.\blockchain.ps1 build
```

| Operation    | Python   | Cython    | Speedup |
| ------------ | -------- | --------- | ------- |
| SHA256       | baseline | optimized | ~1.5-2x |
| Block Mining | baseline | optimized | ~2-5x   |
| Address Gen  | baseline | optimized | ~1.5x   |

## 📋 Requirements

- Python 3.8+
- Flask, ecdsa, requests

**For Cython builds (optional):**

- Windows: Visual Studio Build Tools with C++ workload
- Linux: `build-essential`, `python3-dev`
- Mac: Xcode Command Line Tools

## 🎯 Use Cases

1. **Carbon Credit Rewards** - Reward users for eco-friendly activities
2. **Event Participation Tokens** - Distribute tokens for attending environmental events
3. **Corporate Sustainability Programs** - Track and reward employee green initiatives
4. **Community Environmental Projects** - Incentivize tree planting, recycling, etc.

## 📜 License

MIT License
