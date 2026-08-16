import { ReactNode } from "react";

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
}

// Generic popup shell (distinct from WaypointModal, which is specifically
// for step-by-step progress). Used for confirmations and celebratory
// moments like "your interview kit is ready to generate."
export default function Modal({ onClose, children }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
