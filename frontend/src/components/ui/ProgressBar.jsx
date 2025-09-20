import React from 'react';

export const ProgressBar = ({ 
  value, 
  max = 10, 
  className = '', 
  showValue = true,
  color = 'primary',
  size = 'md'
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colors = {
    primary: 'bg-primary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    danger: 'bg-danger-600'
  };
  
  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };
  
  const getColorByValue = (val) => {
    if (val >= 7) return colors.danger;
    if (val >= 5) return colors.warning;
    return colors.success;
  };
  
  const barColor = color === 'primary' ? getColorByValue(value) : colors[color];
  
  return (
    <div className={`w-full ${className}`}>
      <div className={`bg-gray-200 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`${barColor} transition-all duration-500 ease-out ${sizes[size]} rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>0</span>
          <span className="font-medium">{value.toFixed(1)}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
};