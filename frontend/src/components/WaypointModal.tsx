import { useEffect, useState } from "react";

interface WaypointModalProps {
  title: string;
  steps: string[];
  // The real async work being awaited elsewhere — the modal advances
  // through `steps` on a timer for perceived progress, then snaps to
  // 100% and calls onDone once the actual promise resolves.
  isComplete: boolean;
}

// The signature loading moment: a dotted flight path with waypoints that
// light up in sequence, echoing the Logo mark and the literal pipeline
// (Read JD -> Read Resume -> Identify Skills -> Generate Questions -> ...).
export default function WaypointModal({ title, steps, isComplete }: WaypointModalProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (isComplete) {
      setActiveStep(steps.length - 1);
      return;
    }
    const interval = setInterval(() => {
      setActiveStep((s) => (s < steps.length - 2 ? s + 1 : s));
    }, 1600);
    return () => clearInterval(interval);
  }, [isComplete, steps.length]);

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3 className="modal-title">{title}</h3>
        <div className="waypoint-track">
          {steps.map((step, i) => (
            <div key={step} className={`waypoint ${i <= activeStep ? "waypoint-done" : ""} ${i === activeStep && !isComplete ? "waypoint-active" : ""}`}>
              <span className="waypoint-dot" />
              <span className="waypoint-label">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
