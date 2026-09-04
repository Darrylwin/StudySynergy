import React from 'react';

/**
 * Logo component - utilise l'image /logo.png
 * Sizes: 'sm' = 28px, 'md' = 36px, 'lg' = 44px, 'xl' = 56px
 */
const sizes = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
  xl: 'h-14 w-14',
};

const Logo = ({ size = 'md', className = '' }) => (
  <img
    src="/logo.png"
    alt="StudySynergy"
    className={`${sizes[size]} object-contain rounded-xl ${className}`}
    draggable={false}
  />
);

export default Logo;
