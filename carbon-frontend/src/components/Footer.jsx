export default function Footer() {
    return (
        <footer style={{
            padding: "20px",
            textAlign: "center",
            background: "#111",
            color: "#666",
            borderTop: "1px solid #333",
            marginTop: "auto"
        }}>
            <p>&copy; {new Date().getFullYear()} ReAtmos. All rights reserved.</p>
            <p style={{ marginTop: "10px", fontSize: "0.9em" }}>
                Made with ❤️ | View on <a href="https://github.com/DeepVaishnav17/Carbin" target="_blank" rel="noopener noreferrer" style={{ color: "#2CFF05", textDecoration: "none" }}>GitHub</a>
            </p>
        </footer>
    );
}
