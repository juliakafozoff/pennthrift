import React from 'react';

/**
 * PageHeader component - title + optional actions
 */
export const PageHeader = ({ 
  title, 
  subtitle,
  actions,
  className = '' 
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className || 'mb-8'}`}>
      <div>
        <h1 className="text-3xl font-semibold text-[var(--color-text)]">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-base text-[var(--color-muted)]">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;

