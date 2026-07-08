import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import { ARTIFACT_RECORD_PATH, ROUTES } from "./constants/navigation";
import { PreservationSessionProvider } from "./context/PreservationSessionContext";
import ArtifactView from "./pages/ArtifactView";
import Archive from "./pages/Archive";
import CapturePoint from "./pages/CapturePoint";
import PreservationChamber from "./pages/PreservationChamber";
import Rediscover from "./pages/Rediscover";
import "./styles/tokens.css";
import "./styles/modes.css";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PreservationSessionProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to={ROUTES.vault} replace />} />
            <Route path={ROUTES.chamber} element={<PreservationChamber />} />
            <Route path={ARTIFACT_RECORD_PATH} element={<ArtifactView />} />
            <Route path={ROUTES.vault} element={<Archive />} />
            <Route path={ROUTES.rediscover} element={<Rediscover />} />
            <Route path={ROUTES.capture} element={<CapturePoint />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PreservationSessionProvider>
  </StrictMode>,
);
