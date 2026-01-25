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
        </footer>
    );
}
