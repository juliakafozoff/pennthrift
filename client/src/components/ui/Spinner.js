import React from 'react';
import crest from '../../assets/penn-crest-blue.png';

/**
 * Loading spinner using the Penn crest. Use for page/section loaders and button loading states.
 * @param {string} className - Tailwind classes (e.g. "h-8 w-8", "h-4 w-4"). Default: "h-8 w-8"
 * @param {string} alt - Accessible alt text (default: "Loading")
 */
export const Spinner = ({ className = 'h-8 w-8', alt = 'Loading', ...props }) => (
  <img
    src={crest}
    alt={alt}
    className={`animate-spin ${className}`}
    {...props}
  />
);

export default Spinner;
