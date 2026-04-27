"use client";

import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <motion.div
      className={`bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer ${className}`}
      style={{
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite linear",
      }}
    />
  );
}

export function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex gap-4 relative overflow-hidden">
      <Skeleton className="w-24 h-24 rounded-xl shrink-0" />
      <div className="flex flex-col flex-1 justify-between py-1">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex items-center justify-between mt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <Skeleton className="h-4 w-32 mb-3" />
            <Skeleton className="h-10 w-24 mb-2" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-5 w-48 mb-2" />
      <Skeleton className="h-4 w-64 mb-3" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}
