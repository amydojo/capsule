import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Artifact, PreservationStage } from "../types/artifact";
import type { CaptureInput, PreservationSession } from "../types/capture";

type PreservationSessionContextValue = {
  session: PreservationSession;
  startCapture: (input: CaptureInput) => PreservationSession;
  beginPreservation: () => void;
  setStageProgress: (stage: PreservationStage, progress: number) => void;
  completePreservation: (artifact: Artifact) => Promise<Artifact>;
  failPreservation: (error: string) => void;
  resetSession: () => void;
};

const SESSION_KEY = "capsule_preservation_session_v1";

const createId = () => {
  const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return `session-${randomId}`;
};

const idleSession = (): PreservationSession => ({
  id: createId(),
  status: "idle",
  activeStage: "captured",
  progress: 0,
});

const readSession = (): PreservationSession => {
  if (typeof window === "undefined") return idleSession();

  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return idleSession();
    const parsed = JSON.parse(raw) as PreservationSession;
    return parsed?.id && parsed?.status ? parsed : idleSession();
  } catch {
    return idleSession();
  }
};

const persistSession = (session: PreservationSession) => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Session persistence is best-effort. The active React state remains authoritative.
  }
};

const PreservationSessionContext = createContext<PreservationSessionContextValue | undefined>(undefined);

export function PreservationSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<PreservationSession>(() => readSession());

  const setSession = useCallback((updater: PreservationSession | ((current: PreservationSession) => PreservationSession)) => {
    let committed = idleSession();
    setSessionState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      committed = next;
      persistSession(next);
      return next;
    });
    return committed;
  }, []);

  const value = useMemo<PreservationSessionContextValue>(
    () => ({
      session,
      startCapture: (input) => {
        const next: PreservationSession = {
          id: createId(),
          status: "intake",
          input,
          activeStage: "captured",
          progress: 8,
        };
        setSession(next);
        return next;
      },
      beginPreservation: () => {
        setSession((current) => ({
          ...current,
          status: "preserving",
          activeStage: "captured",
          progress: 12,
          error: undefined,
        }));
      },
      setStageProgress: (stage, progress) => {
        setSession((current) => ({
          ...current,
          activeStage: stage,
          progress,
        }));
      },
      completePreservation: async (artifact) => {
        setSession((current) => ({
          ...current,
          status: "complete",
          artifact,
          activeStage: "preserved",
          progress: 100,
          error: undefined,
        }));
        return artifact;
      },
      failPreservation: (error) => {
        setSession((current) => ({
          ...current,
          status: "error",
          error,
        }));
      },
      resetSession: () => {
        setSession(idleSession());
      },
    }),
    [session, setSession],
  );

  return <PreservationSessionContext.Provider value={value}>{children}</PreservationSessionContext.Provider>;
}

export const usePreservationSession = () => {
  const context = useContext(PreservationSessionContext);
  if (!context) {
    throw new Error("usePreservationSession must be used within PreservationSessionProvider");
  }
  return context;
};
