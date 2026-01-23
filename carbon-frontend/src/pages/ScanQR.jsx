import { useEffect, useState, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function ScanQR() {
  const [params] = useSearchParams();
  const { user } = useContext(AuthContext);

  const eventId = params.get("eventId");
  const userId = params.get("userId");

  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!user) return; // wait for login

    api
      .get(`/events/scan?eventId=${eventId}&userId=${userId}`)
      .then((res) => setInfo(res.data));
  }, [user]);

  const markAttendance = async () => {
  try {
    await api.post(`/events/attendance/${eventId}`, { userId });
    alert("Attendance marked ✅");
  } catch (err) {
    alert(err.response?.data?.message || "Not allowed");
  }
};


  if (!user) return <h2>Please login as Organizer...</h2>;

  if (!info) return <h2>Loading QR info...</h2>;

  return (
    <div style={{ padding: "30px" }}>
      <h2>QR Scanned</h2>
      <p><b>User:</b> {info.userName}</p>
      <p><b>Event:</b> {info.eventTitle}</p>

      <button onClick={markAttendance}>
        Mark Attendance
      </button>
    </div>
  );
}
