
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = "" }) => (
  <div className={`glass rounded-2xl p-6 transition-all duration-300 hover:shadow-xl ${className}`}>
    {children}
  </div>
);
