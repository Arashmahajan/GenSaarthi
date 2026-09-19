import React from 'react';
import { EmergencyHelp } from './EmergencyHelp';
import { useApp } from '../context/AppContext';

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({ isOpen, onClose }) => {
  const { sosTargetNumber } = useApp();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-stone-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border-4 border-rose-500 max-h-[92vh] overflow-y-auto">
        <EmergencyHelp
          initialTargetNumber={sosTargetNumber}
          onClose={onClose}
          isModal={true}
        />
      </div>
    </div>
  );
};
