import { useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./Events.css";

export default function Events() {
  const { user } = useContext(AuthContext);

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
    await api.post(`/events/join/${eventId}`);
    fetchEvents();
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
    setAttendedMap((prev) => ({ ...prev, [userId]: true }));
  };

  const handleGetQR = async (eventId) => {
    const res = await api.get(`/events/qr/${eventId}`);
    setQrMap((prev) => ({ ...prev, [eventId]: res.data.qrImage }));
  };

  /* ================= DATA SPLIT ================= */

  const allEvents = [...events, ...pastEvents];

  const myEvents = allEvents.filter(isOrganizer);
  const otherEvents = allEvents.filter((ev) => !isOrganizer(ev));

  /* ================= UI ================= */

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

  return (
    <div className="events-page">
      <header className="events-header">
        <h1 className="events-title">Events</h1>
        <p className="events-subtitle">
          Air quality initiatives, alerts, and awareness programs
        </p>

        {user && (
          <button className="btn-manage" onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? "Close Create Event" : "Create New Event"}
          </button>
        )}
      </header>

      {user && showCreateForm && (
        <form onSubmit={handleCreate} className="event-card" style={{ maxWidth: 500 }}>
          <input name="title" placeholder="Title" required onChange={handleChange} />
          <input name="description" placeholder="Description" required onChange={handleChange} />
          <input type="date" name="date" required onChange={handleChange} />
          <input name="location" placeholder="Location" required onChange={handleChange} />
          <button className="btn-join">Create Event</button>
        </form>
      )}

      {user && myEvents.length > 0 && (
        <>
          <h2 style={{ margin: "32px 0 16px" }}>My Events</h2>
          <div className="events-grid">{myEvents.map(renderEventCard)}</div>
        </>
      )}

      <h2 style={{ margin: "40px 0 16px" }}>All Events</h2>
      <div className="events-grid">
        {otherEvents.length === 0 ? (
          <div className="empty-state">No events available</div>
        ) : (
          otherEvents.map(renderEventCard)
        )}
      </div>
    </div>
  );
}
