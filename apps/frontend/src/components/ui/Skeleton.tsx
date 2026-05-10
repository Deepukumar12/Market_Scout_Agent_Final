import { cn } from "@/utils/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[#F5F5F7] dark:bg-white/5",
        className
      )}
      {...props}
    />
  );
}
