import { useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function Events() {
  const { user } = useContext(AuthContext);

  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendedMap, setAttendedMap] = useState({});
  const [qrMap, setQrMap] = useState({});
  const [pastEvents, setPastEvents] = useState([]);



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

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post("/events/create", form);
    alert("Event created");
    setForm({ title: "", description: "", date: "", location: "" });
    fetchEvents();
    fetchMyEvents();
  };

  const handleJoin = async (eventId) => {
  await api.post(`/events/join/${eventId}`);

  setEvents((prevEvents) =>
    prevEvents.map((ev) => {
      if (ev._id === eventId) {
        return {
          ...ev,
          participants: [...ev.participants, user._id],
          participantsCount: ev.participantsCount + 1,
        };
      }
      return ev;
    })
  );
};


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
const handleArchive = async (eventId) => {
  await api.post(`/events/archive/${eventId}`);
  fetchEvents();
  fetchMyEvents();
};



  // -------- UI --------
  return (
    <div style={{ padding: "30px" }}>
      <h2>Create Event</h2>

      <form onSubmit={handleCreate}>
        <input name="title" placeholder="Title" value={form.title} onChange={handleChange} />
        <br /><br />
        <input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
        <br /><br />
        <input type="date" name="date" value={form.date} onChange={handleChange} />
        <br /><br />
        <input name="location" placeholder="Location" value={form.location} onChange={handleChange} />
        <br /><br />
        <button type="submit">Create Event</button>
      </form>

      <hr /><br />

      {/* -------- MY EVENTS -------- */}
      <h2>My Events</h2>
      {myEvents.length === 0 ? (
        <p>You haven't created any events yet</p>
      ) : (
        myEvents.map((event) => (
          <div
            key={event._id}
            style={{
              border: "2px solid green",
              padding: "15px",
              marginBottom: "15px",
            }}
          >
            <h3>{event.title}</h3>
            <p>{event.description}</p>
            <p><b>Date:</b> {new Date(event.date).toDateString()}</p>
            <p><b>Location:</b> {event.location}</p>
            <p>
              <b>Participants:</b> {event.participants.length} |{" "}
              <b>Attended:</b> {event.attendedUsers.length}
            </p>
          </div>
        ))
      )}

      <hr /><br />

      {/* -------- ALL EVENTS -------- */}
      <h2>All Events</h2>

      {events.map((event) => {
        const isOrganizer = user && event.organizer._id === user._id;
        const alreadyJoined =
          user && event.participants.includes(user._id);

        return (
          <div
            key={event._id}
            style={{
              border: "1px solid gray",
              padding: "15px",
              marginBottom: "15px",
            }}
          >
            <h3>{event.title}</h3>
            <p>{event.description}</p>
            <p><b>Date:</b> {new Date(event.date).toDateString()}</p>
            <p><b>Location:</b> {event.location}</p>
            <p><b>Organizer:</b> {event.organizer.name}</p>

            <p>
              <b>Participants:</b> {event.participantsCount}
              {isOrganizer && (
                <> | <b>Attended:</b> {event.attendedCount}</>
              )}
            </p>

            {!isOrganizer && !alreadyJoined && (
              <button onClick={() => handleJoin(event._id)}>
                Join Event
              </button>
            )}

            {alreadyJoined && (
  <>
    <p>You joined this event</p>
    <button onClick={() => handleGetQR(event._id)}>
      Get QR
    </button>
  </>
)}
{qrMap[event._id] && (
  <div style={{ marginTop: "10px" }}>
    <img src={qrMap[event._id]} alt="QR Code" width="150" />
  </div>
)}



            {isOrganizer && (
              <button
                style={{ marginTop: "10px" }}
                onClick={() => handleViewParticipants(event._id)}
              >
                View Participants
              </button>

            )}
            {isOrganizer && (
  <button
    style={{ marginLeft: "10px" }}
    onClick={() => handleArchive(event._id)}
  >
    Archive Event
  </button>
)}

            {selectedEvent === event._id && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "10px",
                  border: "1px dashed gray",
                }}
              >
                <h4>Participants:</h4>
                {participants.map((p) => (
                  <div key={p._id} style={{ marginBottom: "8px" }}>
                    {p.name} — {p.email}

                    {!attendedMap[p._id] ? (
                      <button
                        style={{ marginLeft: "10px" }}
                        onClick={() => handleMarkAttendance(event._id, p._id)}
                      >
                        Mark Attended
                      </button>
                    ) : (
                      <span style={{ marginLeft: "10px", color: "green" }}>
                        Attended ✅
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <hr /><br />

<h2>Past Events</h2>

{pastEvents.length === 0 ? (
  <p>No past events yet</p>
) : (
  pastEvents.map((event) => {
    const didAttend =
      user && event.attendedUsers.includes(user._id);

    return (
      <div
        key={event._id}
        style={{
          border: "2px solid orange",
          padding: "15px",
          marginBottom: "15px",
        }}
      >
        <h3>{event.title}</h3>
        <p>{event.description}</p>
        <p><b>Date:</b> {new Date(event.date).toDateString()}</p>
        <p><b>Location:</b> {event.location}</p>
        <p><b>Organizer:</b> {event.organizer.name}</p>

        <p>
          <b>Participants:</b> {event.participants.length} |{" "}
          <b>Attended:</b> {event.attendedUsers.length}
        </p>

        {didAttend && (
          <p style={{ color: "green" }}>
            You attended this event ✅
          </p>
        )}
      </div>
    );
  })
)}

    </div>
    
  );
}
