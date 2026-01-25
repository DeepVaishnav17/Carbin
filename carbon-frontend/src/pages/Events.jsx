import { useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./Events.css";

export default function Events() {
  const { user } = useContext(AuthContext);

  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendedMap, setAttendedMap] = useState({});
  const [qrMap, setQrMap] = useState({});
  const [pastEvents, setPastEvents] = useState([]);

  // ✅ NEW: toggle create event form
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
  });

  // -------- FETCHERS --------
  const fetchEvents = async () => {
    const res = await api.get("/events");
    setEvents(res.data);
  };

  const fetchMyEvents = async () => {
    if (!user) return;
    const res = await api.get("/events/my-events");
    setMyEvents(res.data);
  };

  const fetchPastEvents = async () => {
    const res = await api.get("/events/past");
    setPastEvents(res.data);
  };

  useEffect(() => {
    fetchEvents();
    fetchMyEvents();
    fetchPastEvents();
  }, [user]);

  // -------- HANDLERS --------
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Create Event (All Users)
  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      await api.post("/events/create", form);

      alert("✅ Event created");

      // reset form
      setForm({ title: "", description: "", date: "", location: "" });

      // ✅ refresh events so newly created event appears instantly
      await fetchEvents();
      await fetchPastEvents();
      await fetchMyEvents();

      // ✅ close form (optional)
      setShowCreateForm(false);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to create event");
    }
  };

  // Join Event
  const handleJoin = async (eventId) => {
    await api.post(`/events/join/${eventId}`);

    setEvents((prevEvents) =>
      prevEvents.map((ev) => {
        if (ev._id === eventId) {
          return {
            ...ev,
            participants: [...ev.participants, user._id],
            participantsCount: (ev.participantsCount || ev.participants.length) + 1,
          };
        }
        return ev;
      })
    );
  };

  // Organizer: View Participants
  const handleViewParticipants = async (eventId) => {
    const res = await api.get(`/events/participants/${eventId}`);

    setParticipants(res.data.participants);

    const map = {};
    res.data.attendedUsers.forEach((id) => {
      map[id] = true;
    });

    setAttendedMap(map);
    setSelectedEvent(eventId);
  };

  // Organizer: Mark Attendance
  const handleMarkAttendance = async (eventId, userId) => {
    await api.post(`/events/attendance/${eventId}`, { userId });

    setAttendedMap((prev) => ({
      ...prev,
      [userId]: true,
    }));
  };

  // Get QR
  const handleGetQR = async (eventId) => {
    const res = await api.get(`/events/qr/${eventId}`);

    setQrMap((prev) => ({
      ...prev,
      [eventId]: res.data.qrImage,
    }));
  };

  const handleArchive = async (eventId) => {
    await api.post(`/events/archive/${eventId}`);
    fetchEvents();
    fetchMyEvents();
    fetchPastEvents();
  };

  // Helper function to determine event status
  const getEventStatus = (date) => {
    const eventDate = new Date(date);
    const now = new Date();
    if (eventDate > now) return "Upcoming";
    if (eventDate.toDateString() === now.toDateString()) return "Ongoing";
    return "Past";
  };

  // Combine all events for display
  const allEvents = [...events, ...pastEvents];

  // -------- UI --------
  return (
    <div className="events-page">
      <header className="events-header">
        <h1 className="events-title">Events</h1>
        <p className="events-subtitle">
          Air quality initiatives, alerts, and awareness programs
        </p>

        {/* ✅ Allow all users to create events */}
        {user && (
          <button
            className="btn-manage"
            style={{ marginTop: "16px" }}
            onClick={() => setShowCreateForm((prev) => !prev)}
          >
            {showCreateForm ? "Close Create Event" : "Create New Event"}
          </button>
        )}
      </header>

      {/* ✅ Create Event Form (VISIBLE TO ALL USERS NOW) */}
      {user && showCreateForm && (
        <div
          className="create-event-section"
          style={{
            maxWidth: "1200px",
            margin: "0 auto 2rem auto",
            backgroundColor: "rgba(0,0,0,0.3)",
            padding: "1rem",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#fff" }}>Create Event</h2>

          <form
            onSubmit={handleCreate}
            style={{ display: "grid", gap: "10px", gridTemplateColumns: "1fr" }}
          >
            <input
              name="title"
              placeholder="Title"
              value={form.title}
              onChange={handleChange}
              required
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "#1a1a1a",
                color: "#fff",
              }}
            />

            <input
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              required
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "#1a1a1a",
                color: "#fff",
              }}
            />

            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "#1a1a1a",
                color: "#fff",
              }}
            />

            <input
              name="location"
              placeholder="Location"
              value={form.location}
              onChange={handleChange}
              required
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "#1a1a1a",
                color: "#fff",
              }}
            />

            <button type="submit" className="btn-join">
              Create Event
            </button>
          </form>
        </div>
      )}

      <div className="events-grid">
        {allEvents.length === 0 ? (
          <div className="empty-state">
            <p>No events available at this time.</p>
            <p>Check back later for upcoming air quality initiatives and programs.</p>
          </div>
        ) : (
          allEvents.map((event) => {
            const isOrganizer = user && event.organizer._id === user._id;
            const alreadyJoined = user && event.participants.includes(user._id);
            const status = getEventStatus(event.date);

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
                  <span className="event-organizer">
                    Organized by {event.organizer.name}
                  </span>
                  <span className="event-participants">
                    {event.participantsCount || event.participants.length} participants
                  </span>
                </div>

                <div className="event-actions">
                  {!isOrganizer && !alreadyJoined && status === "Upcoming" && (
                    <button className="btn-join" onClick={() => handleJoin(event._id)}>
                      Join Event
                    </button>
                  )}

                  {alreadyJoined && (
                    <button className="btn-qr" onClick={() => handleGetQR(event._id)}>
                      Get QR
                    </button>
                  )}

                  {isOrganizer && (
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
                    <h4>Participants:</h4>
                    {participants.map((p) => (
                      <div key={p._id} className="participant">
                        {p.name} — {p.email}
                        {!attendedMap[p._id] ? (
                          <button onClick={() => handleMarkAttendance(event._id, p._id)}>
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
          })
        )}
      </div>
    </div>
  );
}
