import React from 'react';

interface AppIconProps {
  className?: string;
}

export const ChromeIcon: React.FC<AppIconProps> = ({ className = '' }) => {
  return (
    <img
      src="/Google_Chrome_icon.png"
      className={`inline-block object-contain ${className}`}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
};
