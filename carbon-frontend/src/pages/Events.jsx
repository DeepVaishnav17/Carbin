import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./Events.css";

export default function Events() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendedMap, setAttendedMap] = useState({});
  const [qrMap, setQrMap] = useState({});
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
  });

  /* ================= FETCH ================= */

  const fetchEvents = async () => {
    const res = await api.get("/events");
    setEvents(res.data);
  };

  const fetchPastEvents = async () => {
    const res = await api.get("/events/past");
    setPastEvents(res.data);
  };

  useEffect(() => {
    fetchEvents();
    fetchPastEvents();
  }, []);

  /* ================= CURSOR TRACKING ================= */
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;

      document.documentElement.style.setProperty("--mouse-x", `${x}%`);
      document.documentElement.style.setProperty("--mouse-y", `${y}%`);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  /* ================= HELPERS ================= */

  const getEventStatus = (date) => {
    const eventDate = new Date(date);
    const now = new Date();

    if (eventDate > now) return "Upcoming";
    if (eventDate.toDateString() === now.toDateString()) return "Ongoing";
    return "Past";
  };

  const isOrganizer = (event) =>
    user && event.organizer && event.organizer._id === user._id;

  /* ================= FORM ================= */

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    await api.post("/events/create", form);
    setForm({ title: "", description: "", date: "", location: "" });
    setShowCreateForm(false);

    fetchEvents();
    fetchPastEvents();
  };

  /* ================= ACTIONS ================= */

  const handleJoin = async (eventId) => {
    if (!user) {
      alert("Please login to join events");
      navigate("/login");
      return;
    }

    // Check if user has a wallet BEFORE optimistic update
    if (!user.walletCreated && !user.walletAddress) {
      if (confirm("You need a Carbon Wallet to join events and earn rewards! Go to Wallet now?")) {
        navigate("/profile", { state: { tab: "wallet" } });
      }
      return;
    }

    try {
      // Optimistic update
      setEvents(prevEvents => prevEvents.map(ev => {
        if (ev._id === eventId) {
          return { ...ev, participants: [...ev.participants, user._id] };
        }
        return ev;
      }));

      await api.post(`/events/join/${eventId}`);
      await fetchEvents();
      alert("Successfully joined event!");
    } catch (err) {
      // Revert on failure
      fetchEvents();
      alert(err.response?.data?.message || "Failed to join event");
    }
  };

  const handleViewParticipants = async (eventId) => {
    const res = await api.get(`/events/participants/${eventId}`);

    setParticipants(res.data.participants);
    setSelectedEvent(eventId);

    const map = {};
    res.data.attendedUsers.forEach((id) => {
      map[id] = true;
    });

    setAttendedMap(map);
  };

  const handleMarkAttendance = async (eventId, userId) => {
    await api.post(`/events/attendance/${eventId}`, { userId });

    setAttendedMap((prev) => ({
      ...prev,
      [userId]: true,
    }));
  };

  const handleGetQR = async (eventId) => {
    const res = await api.get(`/events/qr/${eventId}`);

    setQrMap((prev) => ({
      ...prev,
      [eventId]: res.data.qrImage,
    }));
  };

  /* ================= DATA SPLIT ================= */

  const allEvents = [...events, ...pastEvents];
  const myEvents = allEvents.filter(isOrganizer);
  const otherEvents = allEvents.filter((ev) => !isOrganizer(ev));

  /* ================= CARD ================= */

  const renderEventCard = (event) => {
    const status = getEventStatus(event.date);
    const joined = user && event.participants.includes(user._id);

    return (
      <div key={event._id} className="event-card">
        <div className="event-header">
          <h3 className="event-title">{event.title}</h3>
          <span className={`event-status status-${status.toLowerCase()}`}>
            {status}
          </span>
        </div>

        <p className="event-description">{event.description}</p>

        <div className="event-meta">
          <span className="event-date">
            {new Date(event.date).toLocaleDateString()}
          </span>
          <span className="event-location">{event.location}</span>
        </div>

        <div className="event-footer">
          <span>Organized by {event.organizer.name}</span>
          <span>{event.participants.length} participants</span>
        </div>

        <div className="event-actions">
          {!isOrganizer(event) && !joined && status === "Upcoming" && (
            <button className="btn-join" onClick={() => handleJoin(event._id)}>
              Join Event
            </button>
          )}

          {joined && (
            <button className="btn-qr" onClick={() => handleGetQR(event._id)}>
              Get QR
            </button>
          )}

          {isOrganizer(event) && (
            <button
              className="btn-manage"
              onClick={() => handleViewParticipants(event._id)}
            >
              Manage
            </button>
          )}
        </div>

        {qrMap[event._id] && (
          <div className="qr-code">
            <img src={qrMap[event._id]} alt="QR Code" />
          </div>
        )}

        {selectedEvent === event._id && (
          <div className="participants-list">
            <h4>Participants</h4>
            {participants.map((p) => (
              <div key={p._id} className="participant">
                <span>{p.name}</span>
                {!attendedMap[p._id] ? (
                  <button
                    onClick={() => handleMarkAttendance(event._id, p._id)}
                  >
                    Mark Attended
                  </button>
                ) : (
                  <span className="attended">Attended</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  /* ================= UI ================= */

  return (
    <div className="events-page">
      {/* ===== HERO / HEADER SECTION ===== */}
      <section className="events-hero">
        <div className="events-hero-content">
          <h1 className="events-title">Events</h1>
          <p className="events-subtitle">
            Air quality initiatives, alerts, and awareness programs
          </p>

          {user && (
            <button
              className="btn-manage"
              onClick={() => setShowCreateForm((prev) => !prev)}
            >
              {showCreateForm ? "Close Create Event" : "Create New Event"}
            </button>
          )}
        </div>
      </section>

      {/* ===== CREATE EVENT FORM ===== */}
      {user && showCreateForm && (
        <section className="create-event-section">
          <form className="create-event-form" onSubmit={handleCreate}>
            <div className="form-row">
              <input
                name="title"
                placeholder="Title"
                required
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <input
                name="description"
                placeholder="Description"
                required
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <input
                type="date"
                name="date"
                required
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <input
                name="location"
                placeholder="Location"
                required
                onChange={handleChange}
              />
            </div>

            <div className="form-actions">
              <button className="btn-join">Create Event</button>
            </div>
          </form>
        </section>
      )}


      {/* ===== MY EVENTS ===== */}
      {user && myEvents.length > 0 && (
        <section className="events-section">
          <h2 className="section-title">My Events</h2>
          <div className="events-grid">{myEvents.map(renderEventCard)}</div>
        </section>
      )}

      {/* ===== ALL EVENTS ===== */}
      <section className="events-section">
        <h2 className="section-title">All Events</h2>
        <div className="events-grid">
          {otherEvents.length === 0 ? (
            <div className="empty-state">No events available</div>
          ) : (
            otherEvents.map(renderEventCard)
          )}
        </div>
      </section>
    </div>
  );

}
