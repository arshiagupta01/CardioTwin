import React, { useState } from 'react';
import { X, Stethoscope, CheckSquare, AlertCircle, FileCheck } from 'lucide-react';
import { PatientProfile } from '../../types/clinical';

interface OrderModalProps {
  patient: PatientProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({ patient, isOpen, onClose }) => {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([
    'High-Sensitivity Troponin I (STAT)',
    '12-Lead Electrocardiogram (ECG)',
    'Comprehensive Metabolic Panel (CMP)',
  ]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const orderOptions = [
    { id: 'trop', label: 'High-Sensitivity Troponin I (STAT)', urgency: 'CRITICAL (30 min)' },
    { id: 'ecg', label: '12-Lead Electrocardiogram (ECG)', urgency: 'IMMEDIATE' },
    { id: 'bnp', label: 'NT-proBNP / Heart Failure Peptide', urgency: 'ROUTINE (2 hr)' },
    { id: 'cmp', label: 'Comprehensive Metabolic Panel (CMP)', urgency: 'ROUTINE (1 hr)' },
    { id: 'holter', label: '24-Hour Ambulatory Holter Monitor', urgency: 'DISPATCH HOME' },
  ];

  const toggleOrder = (label: string) => {
    setSelectedOrders((prev) =>
      prev.includes(label) ? prev.filter((o) => o !== label) : [...prev, label]
    );
  };

  const handleConfirm = () => {
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#131B2E] border border-[#323D57] rounded-[4px] shadow-none overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0A0E18] border-b border-[#323D57]">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold font-mono uppercase text-[#F2F4F6]">
              STAT DIAGNOSTIC ORDER REQUISITION SHEET
            </h3>
          </div>
          <button onClick={onClose} className="text-[#9EA4B5] hover:text-[#F2F4F6]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 font-mono text-xs">
          <div className="bg-[#0A0E18] p-3 rounded-[2px] border border-[#323D57]">
            <div className="text-[10px] text-[#9EA4B5] uppercase">REQUISITION FOR:</div>
            <div className="font-bold text-sm text-[#F2F4F6]">{patient.ehr.name} // PT-{patient.ehr.patient_id}</div>
            <div className="text-xs text-[#9EA4B5]">CLINICAL INDICATION: Acute Cardiovascular Decompensation Horizon (80.5% ML Flag)</div>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] text-[#9EA4B5] uppercase font-bold">SELECT DIAGNOSTIC PANELS:</div>
            {orderOptions.map((opt) => {
              const isChecked = selectedOrders.includes(opt.label);
              return (
                <div
                  key={opt.id}
                  onClick={() => toggleOrder(opt.label)}
                  className={`p-2 rounded-[2px] border flex items-center justify-between cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-[#161E31] border-emerald-500/60 text-[#F2F4F6]'
                      : 'bg-[#0A0E18] border-[#323D57]/60 text-[#9EA4B5] hover:border-[#7C839B]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-[2px] border flex items-center justify-center ${isChecked ? 'bg-emerald-600 border-emerald-500' : 'border-[#323D57]'}`}>
                      {isChecked && <CheckSquare className="w-3 h-3 text-white" />}
                    </div>
                    <span>{opt.label}</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-[2px] bg-[#0A0E18] border border-[#323D57] text-amber-300">
                    {opt.urgency}
                  </span>
                </div>
              );
            })}
          </div>

          {isSubmitted && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/60 rounded-[2px] text-emerald-300 flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              <span>STAT Requisition transmitted to Hospital Lab Information System (LIS).</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#323D57]">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-[#161E31] text-[#9EA4B5] hover:text-[#F2F4F6] rounded-[2px]"
            >
              CANCEL
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-[2px] font-bold"
            >
              DISPATCH STAT ORDER ({selectedOrders.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
