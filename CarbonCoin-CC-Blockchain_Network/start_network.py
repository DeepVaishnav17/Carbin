import subprocess
import time
import sys
import os
import signal
import platform

# Configuration
NODES = [
    {"name": "Collection Node", "cmd": ["python", "run_node.py", "7000"], "port": 7000},
    {"name": "Miner 1", "cmd": ["python", "run_node.py", "3000"], "port": 3000},
    {"name": "Miner 2", "cmd": ["python", "run_node.py", "3001"], "port": 3001},
    {"name": "Miner 3", "cmd": ["python", "run_node.py", "3002"], "port": 3002},
]

GATEWAY = {
    "name": "Gateway Service",
    "cmd": ["python", "-c", "from gateway.query_service import run_gateway; run_gateway(8000)"],
    "port": 8000
}

processes = []

def signal_handler(sig, frame):
    print("\n\n🛑 Stopping CarbonCoin Network...")
    shutdown_network()
    sys.exit(0)

def shutdown_network():
    for p in processes:
        print(f"   Killing {p['name']}...")
        if platform.system() == "Windows":
            # Force kill on Windows to ensure immediate cleanup
            subprocess.call(['taskkill', '/F', '/T', '/PID', str(p['process'].pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            p['process'].terminate()
    print("✅ Network stopped successfully.")

def start_network():
    print("\n")
    print("╔══════════════════════════════════════════════════════════╗")
    print("║      CarbonCoin (CC) Blockchain Network Launcher         ║")
    print("╠══════════════════════════════════════════════════════════╣")
    print("║  1. Starting 4 Blockchain Nodes (Collection + Miners)    ║")
    print("║  2. Starting Gateway Query Service                       ║")
    print("║  3. Press Ctrl+C to stop the network                     ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print("\n")

    # 1. Start Blockchain Nodes
    for node in NODES:
        print(f"🚀 Starting {node['name']} (Port {node['port']})...")
        # Direct stdout/stderr to DEVNULL for cleaner main terminal, 
        # or remove stderr=subprocess.DEVNULL if you want to see errors.
        if platform.system() == "Windows":
             # Creation flags for separate independent process groups if needed, 
             # but standard Popen is usually fine for this script.
             p = subprocess.Popen(node['cmd'], creationflags=subprocess.CREATE_NEW_CONSOLE)
        else:
             p = subprocess.Popen(node['cmd'], start_new_session=True)
             
        processes.append({"name": node['name'], "process": p})
        time.sleep(1) # stagger start

    print("\n⏳ Waiting for nodes to initialize...")
    time.sleep(5)

    # 2. Start Gateway
    print(f"🌐 Starting {GATEWAY['name']} (Port {GATEWAY['port']})...")
    if platform.system() == "Windows":
        p = subprocess.Popen(GATEWAY['cmd'], creationflags=subprocess.CREATE_NEW_CONSOLE)
    else:
        p = subprocess.Popen(GATEWAY['cmd'], start_new_session=True)
    processes.append({"name": GATEWAY['name'], "process": p})

    print("\n✅ Network is RUNNING!")
    print("   - Collection: http://localhost:7000")
    print("   - Gateway API: http://localhost:8000 (Use this for frontend)")
    print("   - Miners: Ports 3000, 3001, 3002")
    print("\n📝 Logs are visible in the opened terminal windows.")
    print("⌨️  Press Ctrl+C to stop all services.\n")

    # Keep main script alive
    while True:
        try:
            time.sleep(1)
        except KeyboardInterrupt:
            signal_handler(None, None)

if __name__ == "__main__":
    # Register signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    start_network()
