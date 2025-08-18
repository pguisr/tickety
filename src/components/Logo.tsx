import React from 'react';
import logoSvg from './logo.svg';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-10 w-auto'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={logoSvg} 
        alt="Logo" 
        className={`${sizeClasses[size]}`}
      />
    </div>
  );
};

export default Logo;
