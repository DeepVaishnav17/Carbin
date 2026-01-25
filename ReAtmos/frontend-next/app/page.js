export default function Home() {
  const BACKEND =
    process.env.NEXT_PUBLIC_BACKEND_URL || "https://your-backend.onrender.com";

  return (
    <div style={{ textAlign: "center", padding: "4rem" }}>
      <h1>Welcome to ReAtmos Next.js</h1>
      <p>Monitor pollution emissions.</p>

      <div
        style={{
          display: "flex",
          gap: "2rem",
          justifyContent: "center",
          marginTop: "2rem",
        }}
      >
        <a
          href={BACKEND}
          style={{
            padding: "1rem",
            background: "#4CAF50",
            color: "white",
            borderRadius: "4px",
            textDecoration: "none",
          }}
        >
          Go to Earth
        </a>
      </div>
    </div>
  );
}
