import { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./Profile.css";

// Icons
const OverviewIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
    </svg>
);

const WalletIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
    </svg>
);

const ActivityIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
);

const SettingsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

const LogoutIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

const LocationIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const CoinIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v12M9 9h6M9 15h6" />
    </svg>
);

export default function Profile() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, setUser, fetchUser } = useContext(AuthContext);

    const [activeTab, setActiveTab] = useState(location.state?.tab || "overview");
    const [walletCreated, setWalletCreated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [balance, setBalance] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [loadingTx, setLoadingTx] = useState(false);

    useEffect(() => {
        const loadUserData = async () => {
            try {
                // If context user is not fully loaded or we want fresh data
                const res = await api.get("/auth/me");
                setWalletCreated(res.data.walletCreated);
            } catch {
                // ignore
            }
            setLoading(false);
        };

        loadUserData();
    }, []);

    const createWallet = async () => {
        try {
            setCreating(true);
            await api.post("/wallet/create");
            await fetchUser(); // Update global user state immediately
            setWalletCreated(true);
            setTimeout(() => alert("Wallet Created! You are ready to join events."), 100);
        } catch (err) {
            alert("Failed to create wallet");
        } finally {
            setCreating(false);
        }
    };

    const getWalletAddress = async () => {
        try {
            const res = await api.get("/wallet/address");
            if (res.data.walletAddress) setWalletAddress(res.data.walletAddress);
        } catch (err) {
            console.log("Could not fetch address");
        }
    };

    const getBalance = async () => {
        try {
            setLoadingBalance(true);
            const res = await api.get("/wallet/balance");
            setBalance(res.data.balance);
            if (res.data.walletAddress) {
                setWalletAddress(res.data.walletAddress);
            } else {
                // If backend didn't return address with balance, try fetching it explicitly
                getWalletAddress();
            }
        } catch (err) {
            alert("Failed to fetch balance");
        } finally {
            setLoadingBalance(false);
        }
    };

    const getTransactions = async () => {
        try {
            setLoadingTx(true);
            const res = await api.get("/wallet/transactions");
            setTransactions(res.data.transactions);
        } catch (err) {
            alert("Failed to fetch transactions");
        } finally {
            setLoadingTx(false);
        }
    };

    const handleLogout = async () => {
        await api.get("/auth/logout");
        setUser(null);
        navigate("/");
    };

    // Auto-fetch balance when wallet tab is opened
    const [walletAddress, setWalletAddress] = useState(user?.walletAddress || null);

    useEffect(() => {
        // Debug logs
        console.log("Profile Effect - User:", user);
        console.log("Profile Effect - Wallet Address State:", walletAddress);

        if (activeTab === "wallet" && walletCreated) {
            if (balance === null) getBalance();
            if (!walletAddress) {
                console.log("Fetching wallet address explicitly...");
                getWalletAddress();
            }
        }
        if (activeTab === "activity" && walletCreated && transactions.length === 0) {
            getTransactions();
        }
    }, [activeTab, walletCreated, user]);

    const getInitials = (name) => {
        if (!name) return "?";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    if (loading) {
        return (
            <div className="profile-page">
                <div className="profile-loading">Loading...</div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            {/* Sidebar */}
            <aside className="profile-sidebar">
                {/* User Info */}
                <div className="profile-user-info">
                    <div className="profile-avatar">
                        <span className="profile-avatar-text">{getInitials(user?.name)}</span>
                    </div>
                    <h3 className="profile-user-name">{user?.name || "User"}</h3>
                    <p className="profile-user-email">{user?.email}</p>
                    {user?.city && (
                        <div className="profile-user-location">
                            <LocationIcon />
                            <span>{user.city}</span>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="profile-nav">
                    <button
                        className={`profile-nav-item ${activeTab === "overview" ? "active" : ""}`}
                        onClick={() => setActiveTab("overview")}
                    >
                        <OverviewIcon />
                        Overview
                    </button>
                    {user?.role !== 'admin' && (
                        <button
                            className={`profile-nav-item ${activeTab === "wallet" ? "active" : ""}`}
                            onClick={() => setActiveTab("wallet")}
                        >
                            <WalletIcon />
                            Wallet
                        </button>
                    )}
                    {user?.role !== 'admin' && (
                        <button
                            className={`profile-nav-item ${activeTab === "activity" ? "active" : ""}`}
                            onClick={() => setActiveTab("activity")}
                        >
                            <ActivityIcon />
                            My Activity
                        </button>
                    )}
                    <button
                        className={`profile-nav-item ${activeTab === "settings" ? "active" : ""}`}
                        onClick={() => setActiveTab("settings")}
                    >
                        <SettingsIcon />
                        Settings
                    </button>
                </nav>

                {/* Logout */}
                <button className="profile-logout" onClick={handleLogout}>
                    <LogoutIcon />
                    Logout
                </button>
            </aside>

            {/* Main Content */}
            <main className="profile-content">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <>
                        <div className="profile-content-header">
                            <h1 className="profile-content-title">Overview</h1>
                            <p className="profile-content-subtitle">Your ReAtmos dashboard at a glance</p>
                        </div>

                        <div className="profile-cards-grid">
                            {/* Wallet Status Card - Only for non-admin users */}
                            {user?.role !== 'admin' && (
                                <div className={`profile-stat-card ${!walletCreated ? "highlight" : ""}`}>
                                    <div className="profile-stat-header">
                                        <div className="profile-stat-icon green">
                                            <WalletIcon />
                                        </div>
                                    </div>
                                    {walletCreated ? (
                                        <>
                                            <h2 className="profile-stat-value">{balance !== null ? balance : "---"}</h2>
                                            <p className="profile-stat-label">Carbon Coins</p>
                                            {balance === null && (
                                                <button
                                                    className="profile-action-btn secondary"
                                                    onClick={getBalance}
                                                    disabled={loadingBalance}
                                                    style={{ marginTop: 16 }}
                                                >
                                                    {loadingBalance ? "Loading..." : "Load Balance"}
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="profile-action-title">Create Your Wallet</h3>
                                            <p className="profile-action-desc">
                                                Get your Carbon Wallet to earn coins by attending events.
                                            </p>
                                            <button
                                                className="profile-action-btn"
                                                onClick={createWallet}
                                                disabled={creating}
                                            >
                                                {creating ? "Creating..." : "Get My Wallet"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Location Card */}
                            <div className="profile-stat-card">
                                <div className="profile-stat-header">
                                    <div className="profile-stat-icon purple">
                                        <LocationIcon />
                                    </div>
                                </div>
                                <h2 className="profile-stat-value">{user?.city || "Not Set"}</h2>
                                <p className="profile-stat-label">Your Location</p>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="profile-cards-grid">
                            <div className="profile-action-card">
                                <h3 className="profile-action-title">Explore Events</h3>
                                <p className="profile-action-desc">
                                    Find and join environmental events near you to earn Carbon Coins.
                                </p>
                                <button
                                    className="profile-action-btn secondary"
                                    onClick={() => navigate("/events")}
                                >
                                    View Events
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Wallet Tab */}
                {activeTab === "wallet" && (
                    <>
                        <div className="profile-content-header">
                            <h1 className="profile-content-title">Carbon Wallet</h1>
                            <p className="profile-content-subtitle">Manage your carbon coins and rewards</p>
                        </div>

                        {!walletCreated ? (
                            <div className="profile-action-card highlight">
                                {creating ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '160px' }}>
                                        <div style={{
                                            border: '3px solid rgba(255,255,255,0.1)',
                                            borderTop: '3px solid #00ff88',
                                            borderRadius: '50%',
                                            width: '32px',
                                            height: '32px',
                                            animation: 'spin 1s linear infinite',
                                            marginBottom: '16px'
                                        }}></div>
                                        <h3 className="profile-action-title">Creating Wallet...</h3>
                                        <p className="profile-action-desc">Please wait while we generate your secure address.</p>
                                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="profile-action-title">Create Your Carbon Wallet</h3>
                                        <p className="profile-action-desc">
                                            This wallet will store your carbon coins earned from participating in environmental events.
                                        </p>
                                        <button
                                            className="profile-action-btn"
                                            onClick={createWallet}
                                            disabled={creating}
                                        >
                                            Get My Carbon Wallet
                                        </button>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="profile-cards-grid">
                                <div className="profile-stat-card">
                                    <div className="profile-stat-header">
                                        <div className="profile-stat-icon green">
                                            <CoinIcon />
                                        </div>
                                    </div>
                                    <h2 className="profile-stat-value">
                                        {loadingBalance ? "..." : (balance !== null ? balance : "---")}
                                    </h2>
                                    <p className="profile-stat-label">Carbon Coins</p>

                                    {/* Wallet Address Display - Only for regular users */}
                                    {user.role === 'user' && (
                                        <div style={{ marginTop: '20px' }}>

                                            <div className="profile-wallet-address-container" style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace' }}>
                                                    {walletAddress || "Loading address..."}
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        if (walletAddress) {
                                                            navigator.clipboard.writeText(walletAddress);
                                                            alert("Address copied!");
                                                        }
                                                    }}
                                                    style={{ background: 'rgba(44, 255, 5, 0.1)', border: '1px solid rgba(44, 255, 5, 0.2)', color: '#2CFF05', cursor: 'pointer', fontSize: '12px', padding: '4px 12px', borderRadius: '4px', fontWeight: '500', transition: 'all 0.2s' }}
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Wallet Address</p>
                                        </div>
                                    )}
                                    <button
                                        className="profile-action-btn secondary"
                                        onClick={getBalance}
                                        disabled={loadingBalance}
                                        style={{ marginTop: 16 }}
                                    >
                                        {loadingBalance ? "Refreshing..." : "Refresh Balance"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Activity Tab */}
                {activeTab === "activity" && (
                    <>
                        <div className="profile-content-header">
                            <h1 className="profile-content-title">My Activity</h1>
                            <p className="profile-content-subtitle">Your transaction history and activity</p>
                        </div>

                        {!walletCreated ? (
                            <div className="profile-empty">
                                <p>Create a wallet to see your activity</p>
                            </div>
                        ) : (
                            <div className="profile-table-container">
                                <div className="profile-table-header">
                                    <h3 className="profile-table-title">Recent Transactions</h3>
                                    <button
                                        className="profile-action-btn secondary"
                                        onClick={getTransactions}
                                        disabled={loadingTx}
                                    >
                                        {loadingTx ? "Loading..." : "Refresh"}
                                    </button>
                                </div>

                                {transactions.length === 0 ? (
                                    <div className="profile-empty">
                                        <p>No transactions yet</p>
                                    </div>
                                ) : (
                                    <table className="profile-table">
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
                                                    <td>
                                                        <span className={`tx-type ${tx.direction}`}>
                                                            {tx.direction === "received" ? "Received" : "Sent"}
                                                        </span>
                                                    </td>
                                                    <td className="tx-amount">{tx.amount} CC</td>
                                                    <td className="tx-address">{tx.sender.slice(0, 10)}...</td>
                                                    <td className="tx-address">{tx.recipient.slice(0, 10)}...</td>
                                                    <td>{new Date(tx.timestamp * 1000).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Settings Tab */}
                {activeTab === "settings" && (
                    <>
                        <div className="profile-content-header">
                            <h1 className="profile-content-title">Settings</h1>
                            <p className="profile-content-subtitle">Manage your account preferences</p>
                        </div>

                        <div className="profile-settings">
                            <div className="profile-setting-item">
                                <div className="profile-setting-info">
                                    <h4>Update Location</h4>
                                    <p>Change your city for AQI updates</p>
                                </div>
                                <button
                                    className="profile-action-btn secondary"
                                    onClick={() => navigate("/location")}
                                >
                                    Change
                                </button>
                            </div>

                            <div className="profile-setting-item">
                                <div className="profile-setting-info">
                                    <h4>Account</h4>
                                    <p>{user?.email}</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
