import os
import sys


def main() -> int:
    # Ensure imports work no matter where this script is launched from.
    project_root = os.path.dirname(os.path.abspath(__file__))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

    if len(sys.argv) < 2:
        print("Usage: python run_node.py <port>")
        print("")
        print("Port ranges:")
        print("  3000-3002  = Miner nodes")
        print("  7000       = Collection node")
        print("  5000+      = User nodes")
        return 2

    try:
        port = int(sys.argv[1])
    except ValueError:
        print("Port must be an integer")
        return 2

    from network.app import app, create_app
    from config import get_node_type_from_port, COIN_SYMBOL

    # Initialize the node with the correct port
    create_app(port)
    
    node_type = get_node_type_from_port(port)
    print(f"")
    print(f"╔══════════════════════════════════════════════════════════╗")
    print(f"║           CarbonCoin ({COIN_SYMBOL}) Blockchain Network            ║")
    print(f"╠══════════════════════════════════════════════════════════╣")
    print(f"║  Node Type: {node_type.upper():<45} ║")
    print(f"║  Port:      {port:<45} ║")
    print(f"╚══════════════════════════════════════════════════════════╝")
    print(f"")
    
    if node_type == "miner":
        print("📍 Miner endpoints:")
        print(f"   POST http://localhost:{port}/miner/start  - Start mining + auto-transfer")
        print(f"   POST http://localhost:{port}/miner/stop   - Stop all services")
        print(f"   GET  http://localhost:{port}/balance      - Check balance")
    elif node_type == "collection":
        print("📍 Collection node endpoints:")
        print(f"   POST http://localhost:{port}/reward       - Reward a user")
        print(f"   GET  http://localhost:{port}/balance      - Check balance")
    else:
        print("📍 User node endpoints:")
        print(f"   GET  http://localhost:{port}/balance      - Check balance")
        print(f"   POST http://localhost:{port}/transfer     - Transfer coins")
    
    print("")
    print(f"📊 Common endpoints:")
    print(f"   GET  http://localhost:{port}/             - Node info")
    print(f"   GET  http://localhost:{port}/chain        - View blockchain")
    print(f"   GET  http://localhost:{port}/stats        - Network stats")
    print("")

    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
