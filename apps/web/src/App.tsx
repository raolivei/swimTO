import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DarkModeProvider } from "./contexts/DarkModeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import MapView from "./pages/MapView";
import ScheduleView from "./pages/ScheduleView";
import About from "./pages/About";
import RealTimeUpdates from "./pages/RealTimeUpdates";
import AuthCallback from "./pages/AuthCallback";
import ProfileView from "./pages/ProfileView";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import LogoOptions from "./pages/LogoOptions";

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
              <Route path="profile" element={<ProfileView />} />
              <Route path="real-time-updates" element={<RealTimeUpdates />} />
              <Route path="terms" element={<TermsOfService />} />
              <Route path="privacy" element={<PrivacyPolicy />} />
            </Route>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/logo-options" element={<LogoOptions />} />
          </Routes>
        </AuthProvider>
      </Router>
    </DarkModeProvider>
  );
}

export default App;
