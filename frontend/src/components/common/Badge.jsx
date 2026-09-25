import React from 'react';

export function Badge({ children, variant = 'default', size = 'sm', className = '' }) {
  const variantStyles = {
    default: 'bg-[#21262d] text-gray-300 border-[#30363d]',
    primary: 'bg-indigo-950/60 text-indigo-400 border-indigo-500/40',
    success: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40',
    warning: 'bg-amber-950/60 text-amber-400 border-amber-500/40',
    danger: 'bg-red-950/60 text-red-400 border-red-500/40',
    secondary: 'bg-[#161b22] text-gray-400 border-[#30363d]',
  };

  const sizeStyles = {
    xs: 'text-[11px] px-1.5 py-0.5',
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant] || variantStyles.default} ${sizeStyles[size] || sizeStyles.sm} ${className}`}
    >
      {children}
    </span>
  );
}
