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

### GET /wallets

Get all registered wallets (useful for testing).

**Response:**

```json
{
  "success": true,
  "wallets": [
    {
      "address": "abc123...",
      "private_key": "def456...",
      "label": "miner_1",
      "created_at": 1706123456.789,
      "active_on_port": 3000
    }
  ],
  "total_wallets": 5
}
```

### GET /sessions

Get all active sessions (which wallet is on which port).

**Response:**

```json
{
  "success": true,
  "sessions": [
    {
      "port": 3000,
      "wallet_address": "abc123..."
    }
  ],
  "active_count": 4
}
```

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

### POST /save

Save all node data to disk (blockchain, wallet, pending transactions, peers).

**Response:**

```json
{
  "success": true,
  "message": "State saved to disk",
  "port": 3000,
  "chain_length": 15,
  "pending_transactions": 2,
  "peers_count": 3
}
```

### POST /shutdown

Save state and prepare for graceful shutdown. Stops all background services and saves data.

**Response:**

```json
{
  "success": true,
  "message": "Node ready for shutdown",
  "port": 3000,
  "data_saved": true
}
```

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
Reward amount defaults to **5 CC** (configured in `config.py`) but can be customized per request.

**Body:**

```json
{
  "user_address": "user_wallet_address_here",
  "amount": 10.0  // Optional - defaults to 5 CC if not provided
}
```

**Response:**

```json
{
  "success": true,
  "message": "Reward of 10.00 CC assigned to user",
  "tx_id": "abc123def456...",
  "amount": "10.00 CC",
  "recipient": "user_wallet_address_here"
}
```

**Errors:**

- `403` - Not a collection node
- `400` - Missing `user_address`
- `400` - Invalid amount value
- `400` - Amount must be greater than 0
- `400` - Insufficient balance

> **Note:** Rewards appear as normal transactions. Users can view them via `/transactions` endpoint.

---

## Gateway API Endpoints (Port 8000)

The Gateway API provides centralized endpoints for frontend/website integration.

### POST /create_wallet

Create a new user wallet. This endpoint is used by the main website to create wallets for users.
- Wallet is stored in local `wallets.json` with username as label
- Wallet is also stored in MongoDB `Wallets` collection for website integration
- Optional `userId` (MongoDB ObjectId from Users collection) is stored ONLY in MongoDB for optimized queries
- Only creates the wallet, does NOT start it on any port

**Body:**

```json
{
  "userName": "john_doe",
  "userId": "507f1f77bcf86cd799439011"
}
```

| Field      | Type   | Required | Description                                                        |
| ---------- | ------ | -------- | ------------------------------------------------------------------ |
| `userName` | string | Yes      | Username or email (3-254 chars)                                    |
| `userId`   | string | No       | MongoDB ObjectId from Users collection (for website integration)   |

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Wallet created for user 'john_doe'",
  "wallet_address": "ab86738cbd9bd4c94151dfc5b1a4be430496355d7b7a0c737fa069dc350636f3",
  "private_key": "10805c29860fb072533fc5e558d0beb9a9ac14dc7a0646dac847bf6710f1a977",
  "created_at": 1769251200.886504,
  "userName": "john_doe",
  "stored_in_mongodb": true,
  "note": "IMPORTANT: Save your private_key securely! You will need it to access your wallet."
}
```

**Errors:**

- `400` - Missing JSON body
- `400` - `userName` is required
- `400` - `userName` must be at least 3 characters
- `400` - `userName` must be less than 254 characters (supports email addresses)
- `409` - Username/email already has a wallet assigned
- `500` - Failed to create wallet

> **Note:** The `userName` field supports email addresses. The `userId` field allows linking the wallet to a user in the main website's Users collection - this is stored ONLY in MongoDB, not in local wallets.json. The private_key should be saved by the user securely.

### GET /api/balance?wallet=\<address\>

Get wallet balance from blockchain.

### GET /api/transactions?wallet=\<address\>

Get wallet transaction history.

### GET /api/wallet/info?wallet=\<address\>

Get full wallet information including balance, transactions, and session status.

### GET /api/sessions

Get all active user sessions.

### GET /health

Gateway service health check.

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

# Check user's new balance (after mining)
Invoke-RestMethod -Uri "http://localhost:5000/balance"

# View user's transactions (rewards appear here)
Invoke-RestMethod -Uri "http://localhost:5000/transactions"
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
