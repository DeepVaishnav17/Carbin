import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Location from "./pages/Location";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import Events from "./pages/Events";
import Admin from "./pages/Admin";
import AdminRoute from "./components/AdminRoute";
import OAuthSuccess from "./pages/OAuthSuccess";

import HomeRedirect from "./components/HomeRedirect";
import PublicHome from "./pages/Home"; // reuse Home as public
import ScanQR from "./pages/ScanQR";


function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />


        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        <Route path="/location" element={<Location />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        {/* Redirect /dashboard to /profile for backward compatibility */}
        <Route path="/dashboard" element={<Navigate to="/profile" replace />} />
        {/* <Route
          path="/events"
          element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          }
        /> */}
        <Route path="/events" element={<Events />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
        <Route path="/scan" element={<ScanQR />} />

        <Route path="/oauth-success" element={<OAuthSuccess />} />
      </Routes>

    </BrowserRouter>
  );
}

export default App;
