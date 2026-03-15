import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import WaitlistSuccess from "./components/WaitlistSuccess";
import AdminPage from "./components/AdminPage";

function App() {
  return (
    <div className="min-h-screen bg-white selection:bg-black/10 selection:text-black">
      <Routes>
        <Route path="/" element={<><Navbar /><LandingPage /></>} />
        <Route path="/verify" element={<><Navbar /><WaitlistSuccess /></>} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </div>
  );
}

export default App;
