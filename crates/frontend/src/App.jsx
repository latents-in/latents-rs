import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import WaitlistSuccess from "./components/WaitlistSuccess";
import AdminPage from "./components/AdminPage";
import Home from "./Home";

function App() {
  return (
    <div className="min-h-screen bg-white selection:bg-black/10 selection:text-black">
      <Routes>
        <Route path="/" element={<><Navbar /><LandingPage /></>} />
        <Route path="/verify" element={<><Navbar /><WaitlistSuccess /></>} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </div>
  );
}

export default App;
