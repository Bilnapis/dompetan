interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`bg-dark-700/50 rounded-lg animate-pulse ${className}`}
    />
  )
}

/** Skeleton shaped like a TransactionItem row */
export function TransactionItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Icon circle */}
      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
      {/* Text lines */}
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-3.5 w-3/5 rounded" />
        <Skeleton className="h-2.5 w-2/5 rounded" />
      </div>
      {/* Amount */}
      <div className="text-right shrink-0 space-y-2">
        <Skeleton className="h-3.5 w-16 rounded ml-auto" />
        <Skeleton className="h-2.5 w-10 rounded ml-auto" />
      </div>
    </div>
  )
}

/** Skeleton for a list of transactions (with date header) */
export function TransactionListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {/* Date header skeleton */}
      <div className="flex items-center justify-between mb-2 px-1">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
      <div className="glass rounded-2xl overflow-hidden divide-y divide-dark-700/50">
        {Array.from({ length: count }).map((_, i) => (
          <TransactionItemSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

/** Skeleton shaped like a Category list item */
export function CategoryItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-3.5 w-2/5 rounded" />
        <Skeleton className="h-2.5 w-1/4 rounded" />
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
    </div>
  )
}

/** Skeleton for the category list */
export function CategoryListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="glass rounded-2xl overflow-hidden divide-y divide-dark-700/50">
      {Array.from({ length: count }).map((_, i) => (
        <CategoryItemSkeleton key={i} />
      ))}
    </div>
  )
}

/** Skeleton shaped like an Account list item */
export function AccountItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-3.5 w-1/3 rounded" />
        <Skeleton className="h-2.5 w-1/5 rounded" />
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
    </div>
  )
}

/** Skeleton for the accounts list */
export function AccountListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="glass rounded-2xl overflow-hidden divide-y divide-dark-700/50">
      {Array.from({ length: count }).map((_, i) => (
        <AccountItemSkeleton key={i} />
      ))}
    </div>
  )
}

/** Skeleton for Dashboard summary cards */
export function DashboardSummarySkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      {Array.from({ length: 3 }).map((_, i) => (
        <TransactionItemSkeleton key={i} />
      ))}
    </div>
  )
}

/** Skeleton for settings form */
export function SettingsFormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-28 rounded" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-48 rounded" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  )
}

/** Full-page skeleton for initial app load (ProtectedRoute) */
export function AppLoadingSkeleton() {
  return (
    <div className="min-h-dvh bg-dark-900 px-4 pt-6 max-w-lg mx-auto">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-4 w-36 rounded" />
        </div>
        <Skeleton className="w-10 h-10 rounded-xl" />
      </div>
      {/* Balance card skeleton */}
      <div className="glass rounded-2xl p-5 mb-3">
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-2 w-32 rounded" />
          </div>
        </div>
        <Skeleton className="h-7 w-40 rounded" />
      </div>
      {/* Income/Expense row skeleton */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="glass rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-2.5 w-14 rounded" />
          </div>
          <Skeleton className="h-5 w-24 rounded" />
        </div>
        <div className="glass rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-2.5 w-14 rounded" />
          </div>
          <Skeleton className="h-5 w-24 rounded" />
        </div>
      </div>
      {/* Transaction list skeleton */}
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-3 w-16 rounded" />
      </div>
      <div className="glass rounded-2xl overflow-hidden divide-y divide-dark-700/50">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-3.5 w-3/5 rounded" />
              <Skeleton className="h-2.5 w-2/5 rounded" />
            </div>
            <div className="text-right shrink-0 space-y-2">
              <Skeleton className="h-3.5 w-16 rounded ml-auto" />
              <Skeleton className="h-2.5 w-10 rounded ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
