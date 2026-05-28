import React from 'react';

interface ChromeIconProps {
  className?: string;
}

export const ChromeIcon: React.FC<ChromeIconProps> = ({ className = '' }) => {
  const reactId = React.useId();
  const clipPathId = `chrome-icon-${reactId.replace(/:/g, '')}`;

  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={clipPathId}>
          <circle cx="24" cy="24" r="22" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipPathId})`}>
        <path d="M24 24 5 24A22 22 0 0 1 41.8 8.1Z" fill="#ea4335" />
        <path d="M24 24 41.8 8.1A22 22 0 0 1 24 46Z" fill="#fbbc04" />
        <path d="M24 24 24 46A22 22 0 0 1 5 24Z" fill="#34a853" />
        <path d="M5 24A22 22 0 0 1 13 7.1h28.8L24 24Z" fill="#ea4335" />
        <path d="M24 46 33.7 29.1 41.8 8.1A22 22 0 0 1 24 46Z" fill="#fbbc04" />
        <path d="M5 24h19l9.7 5.1L24 46A22 22 0 0 1 5 24Z" fill="#34a853" />
      </g>
      <circle cx="24" cy="24" r="9.5" fill="#4285f4" />
      <circle cx="24" cy="24" r="6.1" fill="#7db4ff" />
      <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1.2" />
    </svg>
  );
};
