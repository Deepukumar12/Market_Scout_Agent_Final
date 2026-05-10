import React from 'react';
import { cn } from '@/utils/utils';

interface HorizontalScrollerProps {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
  count: number;
}

const HorizontalScroller: React.FC<HorizontalScrollerProps> = ({ 
  children, 
  className, 
  itemClassName,
  count 
}) => {
  // If we have more than 3 items, enable horizontal scroll on smaller screens or specific views
  const isScrollable = count > 3;

  return (
    <div 
      className={cn(
        "flex gap-6 overflow-x-auto pb-6 px-2 -mx-2 custom-scrollbar snap-x snap-mandatory",
        isScrollable ? "flex-nowrap" : "lg:grid lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {React.Children.map(children, (child) => (
        <div className={cn(
          "snap-start shrink-0",
          isScrollable ? "w-[82vw] md:w-[42vw] lg:w-[28vw]" : "w-full",
          itemClassName
        )}>
          {child}
        </div>
      ))}
    </div>
  );
};

export default HorizontalScroller;
