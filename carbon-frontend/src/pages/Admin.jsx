import { useEffect, useState } from "react";
import api from "../api/axios";
import "./Admin.css";

export default function Admin() {
  const [events, setEvents] = useState([]);
  const [coins, setCoins] = useState({});
  const [wallets, setWallets] = useState({});

  const fetchAll = async () => {
    try {
      const res = await api.get("/events/admin/all");
      setEvents(res.data);

      const userIds = new Set();
      res.data.forEach((e) => {
        e.participants.forEach((p) => userIds.add(p._id));
      });

      for (let id of userIds) {
        try {
          const w = await api.get(`/wallet/${id}`);
          setWallets((prev) => ({
            ...prev,
            [id]: w.data.walletAddress || "Not set",
          }));
        } catch {
          setWallets((prev) => ({
            ...prev,
            [id]: "Not set",
          }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch admin data", err);
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

  const assignCoins = async (userId, eventId) => {
    const amount = coins[userId];
    if (!amount) return alert("Enter coin amount");

    try {
      const res = await api.post("/wallet/assign", {
        userId,
        eventId,
        coins: amount,
      });

      const data = res.data.data;
      alert(`✅ ${data.amount} assigned\nTx ID: ${data.tx_id}`);

      setCoins((prev) => ({
        ...prev,
        [userId]: "",
      }));

      await fetchAll();
    } catch (err) {
      alert("❌ Failed to assign coins");
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <p className="admin-subtitle">Manage events, verify attendance, and distribute rewards.</p>
      </header>

      {events.length === 0 ? (
        <div className="admin-empty-state">No events found.</div>
      ) : (
        <div className="admin-events-grid">
          {events.map((event) => (
            <div key={event._id} className="admin-event-card">
              <div className="admin-event-header">
                <div>
                  <h2 className="admin-event-title">{event.title}</h2>
                  <div className="admin-event-date">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    {new Date(event.date).toDateString()}
                  </div>
                </div>
                <span className="admin-event-organizer">
                  {event.organizer.name}
                </span>
              </div>

              <div className="admin-participants-section">
                <h3 className="admin-section-title">Participants ({event.participants.length})</h3>

                {event.participants.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>No participants yet.</p>
                ) : (
                  event.participants.map((p) => {
                    const attended = event.attendedUsers.some(
                      (a) => a._id.toString() === p._id.toString()
                    );

                    const alreadyRewarded = event.rewardedUsers?.some(
                      (r) => r.toString() === p._id.toString()
                    );

                    return (
                      <div key={p._id} className="admin-participant-item">
                        <div className="admin-participant-info">
                          <div>
                            <div className="admin-participant-name">{p.name}</div>
                            <div className="admin-participant-email">{p.email}</div>
                          </div>
                          <div>
                            {attended && <span className="admin-badge attended">Attended</span>}
                            {alreadyRewarded && <span className="admin-badge rewarded">Rewarded</span>}
                          </div>
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                          <span className="admin-wallet-address">
                            {wallets[p._id] ? (wallets[p._id].length > 20 ? wallets[p._id].substring(0, 18) + "..." : wallets[p._id]) : "Loading..."}
                          </span>
                        </div>

                        {!alreadyRewarded && attended && (
                          <div className="admin-action-row">
                            <input
                              type="number"
                              className="admin-coin-input"
                              placeholder="Coins"
                              value={coins[p._id] || ""}
                              onChange={(e) => handleCoinChange(p._id, e.target.value)}
                            />
                            <button
                              className="admin-assign-btn"
                              onClick={() => assignCoins(p._id, event._id)}
                            >
                              Assign
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
