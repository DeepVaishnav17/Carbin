import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Dashboard() {
  const [walletCreated, setWalletCreated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me");
        setWalletCreated(res.data.walletCreated);
      } catch (err) {}
      setLoading(false);
    };

    fetchUser();
  }, []);

  const createWallet = async () => {
    try {
      setCreating(true);
      await api.post("/wallet/create");
      alert("🎉 Wallet Created!");
      setWalletCreated(true);
    } catch (err) {
      alert("Failed to create wallet");
    } finally {
      setCreating(false);
    }
  };

  const getBalance = async () => {
    try {
      const res = await api.get("/wallet/balance");
      setBalance(res.data.balance);
    } catch (err) {
      alert("Failed to fetch balance");
    }
  };

const getTransactions = async () => {
  try {
    const res = await api.get("/wallet/transactions");
    setTransactions(res.data.transactions);
  } catch (err) {
    alert("Failed to fetch transactions");
  }
};


  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1>Dashboard</h1>

      {!walletCreated && (
        <div style={{ border: "1px solid #444", padding: "20px", marginTop: "20px" }}>
          <h2>Create Your Carbon Wallet</h2>
          <p>This wallet will store your carbon coins and rewards.</p>
          <button onClick={createWallet} disabled={creating}>
            {creating ? "Creating..." : "Get My Carbon Wallet"}
          </button>
        </div>
      )}

      {walletCreated && (
        <div style={{ marginTop: "20px" }}>
          <h2>✅ Carbon Wallet Active</h2>

          <button onClick={getBalance}>Get Balance</button>
          <button onClick={getTransactions} style={{ marginLeft: "10px" }}>
            Get Transactions
          </button>

          {balance !== null && (
            <p style={{ marginTop: "10px" }}>
              💰 Balance: {balance} Carbon Coins
            </p>
          )}

         {transactions.length > 0 && (
  <div style={{ marginTop: "20px" }}>
    <h3>Recent Transactions</h3>

    <table border="1" cellPadding="8" style={{ marginTop: "10px" }}>
      <thead>
        <tr>
          <th>Type</th>
          <th>Amount</th>
          <th>From</th>
          <th>To</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((tx) => (
          <tr key={tx.tx_id}>
            <td>{tx.direction === "received" ? "⬇ Received" : "⬆ Sent"}</td>
            <td>{tx.amount} CC</td>
            <td>{tx.sender.slice(0, 10)}...</td>
            <td>{tx.recipient.slice(0, 10)}...</td>
            <td>
              {new Date(tx.timestamp * 1000).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

        </div>
      )}
    </div>
  );
}
