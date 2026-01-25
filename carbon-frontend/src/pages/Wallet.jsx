import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./Wallet.css";

// Wallet Icon
const WalletIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
    </svg>
);

export default function Wallet() {
    const navigate = useNavigate();
    const { user, fetchUser } = useContext(AuthContext);

    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    const createWallet = async () => {
        try {
            setCreating(true);
            setError("");
            await api.post("/wallet/create");
            await fetchUser(); // Refresh user data
            navigate("/events", { replace: true });
        } catch (err) {
            setError("Failed to create wallet. Please try again.");
        } finally {
            setCreating(false);
        }
    };

    // If user already has wallet, redirect to events
    if (user?.walletCreated) {
        navigate("/events", { replace: true });
        return null;
    }

    return (
        <div className="wallet-page">
            {/* Background Effects */}
            <div className="wallet-bg-effects">
                <div className="wallet-grid"></div>
                <div className="wallet-particles">
                    <div className="wallet-particle"></div>
                    <div className="wallet-particle"></div>
                    <div className="wallet-particle"></div>
                    <div className="wallet-particle"></div>
                </div>
            </div>

            {/* Main Card */}
            <div className="wallet-card">
                {/* Logo */}
                <div className="wallet-logo">
                    <span className="wallet-logo-text">
                        <span className="wallet-logo-re">Re</span>
                        <span className="wallet-logo-atmos">Atmos</span>
                    </span>
                </div>

                {/* Icon */}
                <div className="wallet-icon">
                    <div className="wallet-icon-circle">
                        <WalletIcon />
                    </div>
                </div>

                {/* Title */}
                <h1 className="wallet-title">Carbon Wallet Required</h1>

                {/* Subtitle */}
                <p className="wallet-subtitle">
                    To participate in or organize environmental events, you need a Carbon Wallet.
                    Your wallet will store the coins you earn from attending events.
                </p>

                {/* Error */}
                {error && <div className="wallet-error">{error}</div>}

                {/* Features */}
                <div className="wallet-features">
                    <div className="wallet-feature">
                        <span className="wallet-feature-icon">🌱</span>
                        <span>Earn coins for attending events</span>
                    </div>
                    <div className="wallet-feature">
                        <span className="wallet-feature-icon">📊</span>
                        <span>Track your environmental impact</span>
                    </div>
                    <div className="wallet-feature">
                        <span className="wallet-feature-icon">🎯</span>
                        <span>Organize your own green events</span>
                    </div>
                </div>

                {/* Create Button */}
                <button
                    className="wallet-create-btn"
                    onClick={createWallet}
                    disabled={creating}
                >
                    {creating ? "Creating Wallet..." : "Create My Carbon Wallet"}
                </button>

                {/* Skip Link */}
                <button
                    className="wallet-skip"
                    onClick={() => navigate("/events")}
                >
                    Skip for now (view events only)
                </button>
            </div>
        </div>
    );
}
