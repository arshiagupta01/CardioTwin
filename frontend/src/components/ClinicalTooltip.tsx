import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface ClinicalTooltipProps {
  term: string;
  definition: string;
  clinicalSignificance?: string;
  normalRange?: string;
  children?: React.ReactNode;
}

export const ClinicalTooltip: React.FC<ClinicalTooltipProps> = ({
  term,
  definition,
  clinicalSignificance,
  normalRange,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className="relative inline-flex items-center gap-1 cursor-help group"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      {children || <span className="underline decoration-dotted decoration-[#7C839B]">{term}</span>}
      <HelpCircle className="w-3 h-3 text-[#9EA4B5] group-hover:text-emerald-400 transition-colors inline-block" />

      {isVisible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-72 p-2.5 bg-[#0A0E18] border border-[#323D57] rounded text-left shadow-2xl text-[11px] font-sans text-[#F2F4F6] pointer-events-none normal-case leading-normal font-normal">
          <strong className="block text-emerald-400 font-mono text-[10px] uppercase tracking-wider mb-1">
            {term}
          </strong>
          <span className="text-[#F2F4F6] block mb-1">{definition}</span>
          {normalRange && (
            <span className="text-sky-300 block font-mono text-[10px] mb-1">
              • Expected Baseline: {normalRange}
            </span>
          )}
          {clinicalSignificance && (
            <span className="text-amber-300/90 block text-[10px]">
              • Clinical Impact: {clinicalSignificance}
            </span>
          )}
        </span>
      )}
    </span>
  );
};
