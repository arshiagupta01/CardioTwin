import React from 'react';

interface PatientAvatarProps {
  patientId: number;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14' };
const patientPhotos: Record<number, string> = {
  101: '/patients/pt1.jpg',
  102: '/patients/pt2.jpg',
  103: '/patients/pt3.jpg',
  104: '/patients/pt4.jpg',
  105: '/patients/pt5.jpg',
};
const portraits = [
  { skin: '#b97754', hair: '#272c31', shirt: '#344a5b', backdrop: '#b9d0d8', style: 0 },
  { skin: '#996047', hair: '#282623', shirt: '#566b68', backdrop: '#d8c3b7', style: 1 },
  { skin: '#e2b28b', hair: '#252c31', shirt: '#334b59', backdrop: '#c4d4c8', style: 2 },
  { skin: '#edc7a7', hair: '#685348', shirt: '#4e5b69', backdrop: '#d8d0c4', style: 3 },
];

export const PatientAvatar: React.FC<PatientAvatarProps> = ({
  patientId,
  name,
  size = 'md',
  className = '',
}) => {
  const portrait = portraits[Math.abs(patientId - 1) % portraits.length];
  const photo = patientPhotos[patientId];

  return (
    <div
      className={`${sizes[size]} shrink-0 overflow-hidden rounded-[3px] border border-[#323D57] bg-[#161E31] ${className}`}
      role="img"
      aria-label={`Sample portrait of ${name}`}
    >
      {photo ? (
        <img
          src={photo}
          alt={`Sample patient portrait: ${name}`}
          className="block h-full w-full object-cover"
          style={{ objectPosition: '50% 30%' }}
        />
      ) : (
        <svg viewBox="0 0 100 100" className="block h-full w-full" aria-hidden="true">
          <rect width="100" height="100" fill={portrait.backdrop} />
          <circle cx="50" cy="43" r="34" fill="white" opacity=".12" />
          <path d="M9 100c3-22 17-32 41-32s38 10 41 32" fill={portrait.shirt} />
          <path d="M41 63h18v17c-4 7-14 7-18 0z" fill={portrait.skin} />
          <ellipse cx="50" cy="43" rx="22" ry="27" fill={portrait.skin} />
          <path d="M28 43c-2-22 8-34 24-34 19 0 27 15 22 36l-5-2-3-17c-8 8-21 12-37 11z" fill={portrait.hair} />
          <ellipse cx="42" cy="45" rx="1.8" ry="1.4" fill="#282522" />
          <ellipse cx="58" cy="45" rx="1.8" ry="1.4" fill="#282522" />
          <path d="M45 58c3 2 7 2 10 0" stroke="#704b3b" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
};
