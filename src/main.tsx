import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import { PreservationSessionProvider } from "./context/PreservationSessionContext";
import ArtifactView from "./pages/ArtifactView";
import Archive from "./pages/Archive";
import CapturePoint from "./pages/CapturePoint";
import PreservationChamber from "./pages/PreservationChamber";
import Rediscover from "./pages/Rediscover";
import "./styles/tokens.css";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PreservationSessionProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/chamber" replace />} />
            <Route path="/chamber" element={<PreservationChamber />} />
            <Route path="/artifact/:id" element={<ArtifactView />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/rediscover" element={<Rediscover />} />
            <Route path="/capture" element={<CapturePoint />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PreservationSessionProvider>
  </StrictMode>,
);
