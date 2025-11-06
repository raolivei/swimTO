import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DarkModeProvider } from "./contexts/DarkModeContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import MapView from "./pages/MapView";
import ScheduleView from "./pages/ScheduleView";
import About from "./pages/About";
import RealTimeUpdates from "./pages/RealTimeUpdates";

function App() {
  return (
    <DarkModeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="map" element={<MapView />} />
            <Route path="schedule" element={<ScheduleView />} />
            <Route path="about" element={<About />} />
            <Route path="real-time-updates" element={<RealTimeUpdates />} />
          </Route>
        </Routes>
      </Router>
    </DarkModeProvider>
  );
}

export default App;
