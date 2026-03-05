import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import WaitlistSuccess from "./components/WaitlistSuccess";

function App() {
  return (
    <div className="min-h-screen bg-white selection:bg-black/10 selection:text-black">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/verify" element={<WaitlistSuccess />} />
      </Routes>
    </div>
  );
}

export default App;
