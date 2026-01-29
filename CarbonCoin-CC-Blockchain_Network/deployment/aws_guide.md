# AWS Deployment Guide for CarbonCoin Network

## 1. Launch EC2 Instance
- **OS**: Ubuntu Server 22.04 LTS (recommended) (or 20.04)
- **Instance Type**: t2.small or t2.medium (min 2GB RAM recommended)
- **Security Group**: Allow Custom TCP ports:
  - 3000-3005 (Miners)
  - 5000-5005 (Users)
  - 7000 (Collection Node)
  - 8000 (Gateway)
  - 22 (SSH)

## 2. Connect to Instance
```bash
ssh -i "your-key.pem" ubuntu@<your-ec2-public-ip>
```

## 3. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3 and pip
sudo apt install python3 python3-pip python3-venv -y

# Install Node.js and NPM (for PM2)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (Process Manager)
sudo npm install pm2@latest -g
```

## 4. Setup Project
```bash
# Clone repository
git clone <your-repo-url>
cd CarbonCoin-CC-Blockchain_Network

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python requirements
pip install -r requirements.txt
```

## 5. Configuration (Environment Variables)
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your server's details:
   ```bash
   nano .env
   ```

3. **Crucial Settings to Change**:
   - `HOST_IP`: Set this to your EC2 **Public IP** (e.g., `54.123.45.67`)
   - `BOOTSTRAP_PEERS`: Update the list to use your Public IP instead of localhost if running across multiple servers (or keep localhost if all on one box, but `HOST_IP` is still needed for self-identity).
   - `MONGO_URI`: Add your MongoDB connection string.

## 6. Start Network with PM2
We use PM2 to keep the blockchain nodes running in the background.

```bash
# Start all nodes using the ecosystem config
pm2 start ecosystem.config.js

# View status
pm2 status

# View logs
pm2 logs
```

## 7. Troubleshooting
- **Nodes not connecting?** Check `pm2 logs` and ensure Security Group allows ports 3000, 7000, 8000.
- **Wrong IP?** Ensure `HOST_IP` in `.env` is correct.
- **Database error?** Ensure MongoDB URI is reachable from the EC2.
