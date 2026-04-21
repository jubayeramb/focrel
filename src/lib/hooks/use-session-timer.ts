import { useEffect, useState } from "react";

type SessionTimerResult = {
  remainingSeconds: number;
  elapsedSeconds: number;
  isOvertime: boolean;
  progress01: number;
};

function computeValues(startedAt: number, plannedDurationMinutes: number): SessionTimerResult {
  const plannedSeconds = plannedDurationMinutes * 60;
  const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
  const remaining = plannedSeconds - elapsedSeconds;
  return {
    elapsedSeconds,
    remainingSeconds: Math.max(0, remaining),
    isOvertime: elapsedSeconds > plannedSeconds,
    progress01: Math.min(1, elapsedSeconds / plannedSeconds),
  };
}

export function useSessionTimer(
  startedAt: number,
  plannedDurationMinutes: number,
): SessionTimerResult {
  const [values, setValues] = useState<SessionTimerResult>(() =>
    computeValues(startedAt, plannedDurationMinutes),
  );

  useEffect(() => {
    const tick = () => setValues(computeValues(startedAt, plannedDurationMinutes));

    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, plannedDurationMinutes]);

  return values;
}
