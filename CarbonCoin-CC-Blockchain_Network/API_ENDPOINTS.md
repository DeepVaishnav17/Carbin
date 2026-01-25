# CarbonCoin (CC) API Endpoints

Complete API reference for the CarbonCoin blockchain network.

## Node Types

| Type           | Ports     | Description                              |
| -------------- | --------- | ---------------------------------------- |
| **Miner**      | 3000-3002 | Mines blocks, earns CC rewards           |
| **Collection** | 7000      | Receives auto-transfers, assigns rewards |
| **User**       | 5000+     | Regular users, receive rewards           |

---

## Common Endpoints (All Nodes)

### GET /

Get node information.

**Response:**

```json
{
  "success": true,
  "name": "CarbonCoin Node",
  "symbol": "CC",
  "node_type": "miner",
  "port": 3000,
  "address": "abc123...",
  "balance": 50.0,
  "chain_length": 10,
  "pending_transactions": 2,
  "peers_count": 3,
  "sync_active": true,
  "mining_active": true,
  "auto_transfer_active": true
}
```

### GET /health

Health check endpoint.

**Response:**

```json
{
  "success": true,
  "status": "healthy",
  "node_type": "miner",
  "port": 3000
}
```

### GET /address

Get wallet address and public key.

**Response:**

```json
{
  "success": true,
  "address": "abc123def456...",
  "public_key": "04abc123..."
}
```

### GET /balance

Get wallet balance.

**Query params:** `?address=<wallet_address>` (optional)

**Response:**

```json
{
  "success": true,
  "address": "abc123...",
  "balance": "50.00 CC",
  "available": "45.00 CC",
  "pending": "5.00 CC"
}
```

### GET /balances

Get all wallet balances in the network.

### GET /chain

Get the full blockchain.

### GET /mempool

Get pending transactions.

### GET /stats

Get network statistics.

**Response:**

```json
{
  "success": true,
  "chain_length": 15,
  "difficulty": 3,
  "pending_transactions": 2,
  "total_supply": "150.00 CC",
  "peers_count": 3
}
```

### GET /peers

Get connected peer nodes.

**Response:**

```json
{
  "success": true,
  "count": 3,
  "peers": [
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:7000"
  ]
}
```

### POST /add_peer

Manually add a peer node.

**Body:**

```json
{ "peer": "http://localhost:3001" }
```

### POST /announce_peer

(Internal) Receive peer announcement from network.

**Body:**

```json
{
  "peer": "http://localhost:5000",
  "from": "http://localhost:3000"
}
```

### GET /consensus

Run consensus algorithm to sync with longest chain.

### GET /transactions

Get transaction history for this node's address.

**Query params:** `?address=<wallet_address>` (optional)

---

## Transaction Endpoints

### POST /transfer

Transfer coins from this node's wallet.

**Body:**

```json
{
  "receiver": "recipient_address",
  "amount": 10.5
}
```

**Response:**

```json
{
  "success": true,
  "message": "Transaction created",
  "tx_id": "abc123...",
  "sender": "your_address",
  "receiver": "recipient_address",
  "amount": "10.50 CC"
}
```

### POST /transaction

Create and broadcast a new transaction.

**Body:**

```json
{
  "receiver": "recipient_address",
  "amount": 10.5
}
```

### POST /receive_transaction

(Internal) Receive transaction from peer.

### POST /receive_block

(Internal) Receive block from peer.

---

## Miner-Only Endpoints (Ports 3000-3002)

### POST /miner/start

Start all miner services (mining + auto-transfer).

**Response:**

```json
{
  "success": true,
  "message": "Miner services started",
  "mining": true,
  "auto_transfer": true,
  "mining_reward": "10.00 CC",
  "auto_transfer_threshold": "100.00 CC"
}
```

### POST /miner/stop

Stop all miner services.

**Response:**

```json
{
  "success": true,
  "message": "Miner services stopped",
  "mining": false,
  "auto_transfer": false
}
```

### GET /mine

Mine a single block manually.

### POST /mining/start

Start background mining service only.

### POST /mining/stop

Stop background mining service.

### GET /mining/status

Get mining service status.

### POST /autotransfer/start

Start auto-transfer service (transfers to collection when balance >= 100 CC).

### POST /autotransfer/stop

Stop auto-transfer service.

### GET /autotransfer/status

Get auto-transfer service status.

---

## Collection Node Endpoints (Port 7000)

### POST /assign_reward

Assign reward to a user's wallet address. Only the collection node can call this.
Reward amount is fixed at **5 CC** (configured in `config.py`).

**Body:**

```json
{
  "user_address": "user_wallet_address_here"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Reward of 5.00 CC assigned to user",
  "reward_id": "a1b2c3d4e5f6g7h8",
  "tx_id": "abc123def456...",
  "amount": "5.00 CC",
  "recipient": "user_wallet_address_here"
}
```

**Errors:**

- `403` - Not a collection node
- `400` - Missing `user_address`
- `400` - Insufficient balance

### GET /reward_status/{reward_id}

Get status of a specific reward assignment.

**Response:**

```json
{
  "success": true,
  "reward_id": "a1b2c3d4e5f6g7h8",
  "reward": {
    "user_address": "user_wallet_address",
    "amount": "5.00 CC",
    "timestamp": 1737734400,
    "tx_id": "abc123def456...",
    "status": "confirmed"
  }
}
```

> Status is `pending` until the transaction is mined, then `confirmed`.

### GET /rewards

Get all assigned rewards.

**Response:**

```json
{
  "success": true,
  "total_rewards": 3,
  "rewards": [
    {
      "user_address": "user1_address",
      "amount": 5.0,
      "timestamp": 1737734400,
      "tx_id": "tx123...",
      "status": "confirmed"
    },
    {
      "user_address": "user2_address",
      "amount": 10.0,
      "timestamp": 1737734500,
      "tx_id": "tx456...",
      "status": "pending"
    }
  ]
}
```

---

## Example Workflows

### 1. Start Network & Begin Mining

```powershell
# Start all nodes (peers auto-connect!)
.\blockchain.ps1 start-network

# Start mining on all miners
.\blockchain.ps1 start-mining
```

### 2. Check Balances

```powershell
# Collection node balance
Invoke-RestMethod -Uri "http://localhost:7000/balance"

# All balances in network
Invoke-RestMethod -Uri "http://localhost:7000/balances"

# Specific address balance
Invoke-RestMethod -Uri "http://localhost:7000/balance?address=abc123..."
```

### 3. Collection Node Assigns Reward to User

```powershell
# First, get the user's wallet address
$userInfo = Invoke-RestMethod -Uri "http://localhost:5000/address"
$userAddress = $userInfo.address

# Collection node assigns reward (default 5 CC)
$body = @{
    user_address = $userAddress
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:7000/assign_reward" -Method POST -Body $body -ContentType "application/json"

# Or assign custom amount
$body = @{
    user_address = $userAddress
    amount = 10.0
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:7000/assign_reward" -Method POST -Body $body -ContentType "application/json"

# Check reward status
Invoke-RestMethod -Uri "http://localhost:7000/reward_status/a1b2c3d4"

# View all assigned rewards
Invoke-RestMethod -Uri "http://localhost:7000/rewards"

# Check user's new balance (after mining)
Invoke-RestMethod -Uri "http://localhost:5000/balance"
```

### 4. User Transfers Coins

```powershell
# Transfer from user to another address
$body = @{
    receiver = "recipient_address_here"
    amount = 2.5
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/transfer" -Method POST -Body $body -ContentType "application/json"
```

### 5. View Transaction History

```powershell
# View all transactions for this node
Invoke-RestMethod -Uri "http://localhost:5000/transactions"

# View transactions for a specific address
Invoke-RestMethod -Uri "http://localhost:7000/transactions?address=abc123..."
```

### 6. Check Peer Connections

```powershell
# See all connected peers
Invoke-RestMethod -Uri "http://localhost:3000/peers"

# Check network health
Invoke-RestMethod -Uri "http://localhost:3000/health"
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed description"
}
```

### Common HTTP Status Codes

| Code | Meaning                          |
| ---- | -------------------------------- |
| 200  | Success                          |
| 201  | Created (transaction/claim)      |
| 400  | Bad request (missing parameters) |
| 403  | Forbidden (wrong node type)      |
| 404  | Not found                        |
| 500  | Internal server error            |
| 503  | Service unavailable              |
