import React from 'react';

interface SkeletonProps {
  className?: string;
}

/**
 * Shimmer animation skeleton for loading states.
 * Usage: <Skeleton className="h-4 w-32" /> for a text line
 *        <Skeleton className="h-64 w-full rounded-3xl" /> for an image
 */
const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-shimmer rounded-md ${className}`}
      aria-hidden="true"
    />
  );
};

export default Skeleton;
