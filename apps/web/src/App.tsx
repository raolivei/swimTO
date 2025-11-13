import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DarkModeProvider } from "./contexts/DarkModeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import MapView from "./pages/MapView";
import ScheduleView from "./pages/ScheduleView";
import About from "./pages/About";
import RealTimeUpdates from "./pages/RealTimeUpdates";
import LogoEvolution from "./pages/LogoEvolution";
import AuthCallback from "./pages/AuthCallback";

function App() {
  return (
    <DarkModeProvider>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="map" element={<MapView />} />
              <Route path="schedule" element={<ScheduleView />} />
              <Route path="about" element={<About />} />
              <Route path="real-time-updates" element={<RealTimeUpdates />} />
              <Route path="logo-picker" element={<LogoEvolution />} />
            </Route>
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
        </AuthProvider>
      </Router>
    </DarkModeProvider>
  );
}

export default App;
