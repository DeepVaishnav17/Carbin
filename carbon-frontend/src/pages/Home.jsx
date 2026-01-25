import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import styles from "./Home.module.css";

import Footer from "../components/Footer";

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await api.get("/auth/me");

        if (!res.data.city || !res.data.apiCenter) {
          navigate("/location");
          return;
        }
      } catch (err) {
        // User not logged in, just show landing page
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  if (loading) return <div style={{ background: '#000', height: '100vh', width: '100vw' }}></div>;

  return (
    <div className={styles.homeContainer}>
      <Navbar />

      {/* Hero Section */}
      <main className={styles.heroSection}>
        <div className={styles.contentWrapper}>
          <h1 className={styles.headline}>
            Preserving Life<br />
            <span style={{ color: '#2CFF05' }}>On Earth</span>
          </h1>
          <p className={styles.subHeadline}>
            ReAtmos is driven by the conviction that breathing clean air is not a luxury,
            but a fundamental right for every living being on our planet.
          </p>
          {/* Button removed as requested */}
        </div>

        <div className={styles.earthWrapper}>
          <div className={styles.earth}>
            <div className={styles.texture}></div>
          </div>
        </div>
      </main>

      {/* Content Section */}
      <section className={styles.infoSection}>
        <div className={styles.quoteContainer}>
          <p className={styles.quoteText}>
            "We do not inherit the earth from our ancestors, we borrow it from our children."
          </p>
          <p className={styles.quoteAuthor}>— Native American Proverb</p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>262M+</span>
            <span className={styles.statLabel}>Asthma Cases</span>
            <p className={styles.statDesc}>
              People affected by asthma globally, with pollution being a major trigger for attacks and chronic development.
            </p>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statNumber}>7M</span>
            <span className={styles.statLabel}>Premature Deaths</span>
            <p className={styles.statDesc}>
              Estimated annual deaths linked to air pollution according to the WHO, making it the world's largest environmental health risk.
            </p>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statNumber}>99%</span>
            <span className={styles.statLabel}>Global Population</span>
            <p className={styles.statDesc}>
              Living in places where air quality guidelines levels strictly established by WHO are not met!.
            </p>
          </div>
        </div>
      </section>

      {/* Map Embed Section */}
      {/* Map Portal Section */}
      <section className={styles.iframeSection}>
        <div className={styles.portalContainer}>
          <div className={styles.portalContent}>
            <h2 className={styles.portalTitle}>ReAtmos Global Map</h2>
            <p className={styles.portalDesc}>
              Explore real-time air quality data across the globe with our interactive 3D visualization.
            </p>
            <a
              href="https://reatmos.onrender.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.portalButton}
            >
              Launch Global Map
              <span className={styles.arrowIcon}>→</span>
            </a>
          </div>
          <div className={styles.portalBackground}></div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
