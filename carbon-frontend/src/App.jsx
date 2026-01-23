import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Location from "./pages/Location";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Admin from "./pages/Admin";
import AdminRoute from "./components/AdminRoute";

import HomeRedirect from "./components/HomeRedirect";
import PublicHome from "./pages/Home"; // reuse Home as public
import ScanQR from "./pages/ScanQR";


function App() {
  return (
    <BrowserRouter>
     <Navbar />
      <Routes>
      <Route path="/" element={<HomeRedirect />} />
<Route path="/home" element={<Home />} />
<Route path="/public" element={<Home />} />


        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/location" element={<Location />} />
        <Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
  <Route
  path="/events"
  element={
    <ProtectedRoute>
      <Events />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin"
  element={
    <AdminRoute>
      <Admin />
    </AdminRoute>
  }
/>
<Route path="/scan" element={<ScanQR />} />

      </Routes>
      
    </BrowserRouter>
  );
}

export default App;
