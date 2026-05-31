import React from 'react';
import Skeleton from './Skeleton';

/**
 * Skeleton placeholder that matches the ProductCard layout.
 * Shows: image area + text lines + price while loading.
 */
const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-surface p-4 rounded-[32px] border border-border-tan/30 card-shadow">
      {/* Image area */}
      <Skeleton className="aspect-[4/5] w-full rounded-[24px] mb-6" />

      {/* Text content */}
      <div className="space-y-3 px-2">
        {/* Product name */}
        <Skeleton className="h-5 w-3/4 rounded-full" />

        {/* Color swatches */}
        <div className="flex gap-1.5 py-1">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="w-4 h-4 rounded-full" />
        </div>

        {/* Category + Price row */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
