import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Admin() {
  const [events, setEvents] = useState([]);
  const [coins, setCoins] = useState({});
  const [wallets, setWallets] = useState({});

  const fetchAll = async () => {
    const res = await api.get("/events/admin/all");
    setEvents(res.data);

    // fetch wallets for all users
    const userIds = new Set();
    res.data.forEach((e) => {
      e.participants.forEach((p) => userIds.add(p._id));
    });

    for (let id of userIds) {
      try {
        const w = await api.get(`/wallet/${id}`);
        setWallets((prev) => ({
          ...prev,
          [id]: w.data.walletAddress,
        }));
      } catch {
        setWallets((prev) => ({
          ...prev,
          [id]: "Not set",
        }));
      }
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCoinChange = (userId, value) => {
    setCoins((prev) => ({
      ...prev,
      [userId]: value,
    }));
  };

  const assignCoins = async (userId) => {
    const amount = coins[userId];
    if (!amount) return alert("Enter coin amount");

    await api.post("/wallet/assign", {
      userId,
      coins: amount,
    });

    alert("Coins assigned!");
    setCoins((prev) => ({ ...prev, [userId]: "" }));
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1>Admin Dashboard</h1>

      {events.map((event) => (
        <div
          key={event._id}
          style={{
            border: "1px solid gray",
            marginBottom: "20px",
            padding: "15px",
          }}
        >
          <h2>{event.title}</h2>
          <p><b>Organizer:</b> {event.organizer.name}</p>
          <p><b>Date:</b> {new Date(event.date).toDateString()}</p>

          <h3>Participants</h3>

          {event.participants.map((p) => {
            const attended = event.attendedUsers.some(
              (a) => a._id.toString() === p._id.toString()
            );

            return (
              <div key={p._id} style={{ marginBottom: "10px" }}>
                <b>{p.name}</b> — {p.email} <br />

                Wallet: {wallets[p._id] || "Loading..."} <br />

                {attended && (
                  <span style={{ color: "green" }}>Attended ✅</span>
                )}

                <div style={{ marginTop: "5px" }}>
                  <input
                    type="number"
                    placeholder="Coins"
                    value={coins[p._id] || ""}
                    onChange={(e) =>
                      handleCoinChange(p._id, e.target.value)
                    }
                  />
                  <button onClick={() => assignCoins(p._id)}>
                    Assign Coins
                  </button>
                </div>
                <hr />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
