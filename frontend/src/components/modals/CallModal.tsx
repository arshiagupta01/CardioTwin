import React, { useState } from 'react';
import { X, PhoneCall, PhoneForwarded, Check, Clock, User, AlertTriangle } from 'lucide-react';
import { PatientProfile } from '../../types/clinical';

interface CallModalProps {
  patient: PatientProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({ patient, isOpen, onClose }) => {
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'completed'>('idle');
  const [notes, setNotes] = useState('Patient reported moderate nocturnal palpitations and sleep interruption. Advised rest, immediate BP verification, and prescribed emergency clinic visit.');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#131B2E] border border-[#323D57] rounded-[4px] shadow-none overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0A0E18] border-b border-[#323D57]">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-red-400" />
            <h3 className="text-xs font-bold font-mono uppercase text-[#F2F4F6]">
              CLINICAL TRIAGE OUTREACH // DIRECT CALL
            </h3>
          </div>
          <button onClick={onClose} className="text-[#9EA4B5] hover:text-[#F2F4F6]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 font-mono text-xs">
          <div className="p-2.5 bg-red-950/30 border border-red-500/40 rounded-[2px] text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>24–48h Acute Decompensation flag active. Immediate patient contact recommended.</span>
          </div>

          <div className="bg-[#0A0E18] p-3 rounded-[2px] border border-[#323D57] space-y-1">
            <div className="text-[10px] text-[#9EA4B5] uppercase">PATIENT PROFILE</div>
            <div className="font-bold text-sm text-[#F2F4F6]">{patient.ehr.name} (PT-{patient.ehr.patient_id})</div>
            <div className="text-xs text-[#9EA4B5]">PHONE: +91 98450 21984 (Primary Mobile)</div>
            <div className="text-xs text-[#9EA4B5]">ATTENDING: Dr. E. Vance, MD • CCU On-Duty</div>
          </div>

          {/* Call Status Simulator */}
          <div className="flex items-center justify-between p-3 bg-[#161E31] rounded-[2px] border border-[#323D57]">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${callStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : callStatus === 'calling' ? 'bg-amber-400 animate-ping' : 'bg-zinc-600'}`} />
              <span className="font-bold text-[#F2F4F6]">
                {callStatus === 'idle' && 'READY TO DIAL'}
                {callStatus === 'calling' && 'DIALING PATIENT...'}
                {callStatus === 'connected' && 'CALL CONNECTED (00:48)'}
                {callStatus === 'completed' && 'CALL LOGGED TO EHR'}
              </span>
            </div>

            {callStatus === 'idle' && (
              <button
                onClick={() => {
                  setCallStatus('calling');
                  setTimeout(() => setCallStatus('connected'), 1500);
                }}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-[2px] font-bold flex items-center gap-1.5"
              >
                <PhoneForwarded className="w-3.5 h-3.5" />
                INITIATE CALL
              </button>
            )}

            {callStatus === 'connected' && (
              <button
                onClick={() => setCallStatus('completed')}
                className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded-[2px] font-bold"
              >
                END & LOG CALL
              </button>
            )}
          </div>

          {/* Triage Note Entry */}
          <div>
            <label className="block text-[10px] uppercase text-[#9EA4B5] mb-1">
              CLINICAL TRIAGE NOTES FOR EHR DISPATCH
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#0A0E18] border border-[#323D57] p-2 rounded-[2px] text-[#F2F4F6] text-xs font-mono focus:border-[#7C839B] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#323D57]">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-[#161E31] text-[#9EA4B5] hover:text-[#F2F4F6] rounded-[2px]"
            >
              CLOSE
            </button>
            <button
              onClick={() => {
                alert('Triage note appended to patient medical record.');
                onClose();
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2px] font-bold"
            >
              CONFIRM & COMMIT TO EHR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
