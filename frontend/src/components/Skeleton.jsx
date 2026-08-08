export function Skeleton({ className = '', variant = 'text' }) {
  const baseClasses = 'animate-pulse bg-gray-800/50 rounded';
  
  const variants = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    circle: 'rounded-full',
    card: 'h-32 w-full rounded-xl',
    stat: 'h-24 w-full rounded-xl',
    button: 'h-10 w-24 rounded-lg',
    avatar: 'h-10 w-10 rounded-full',
  };

  return (
    <div className={`${baseClasses} ${variants[variant] || ''} ${className}`} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton variant="title" className="w-48" />
        <Skeleton variant="text" className="w-64" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#1a1a2e] rounded-xl border border-gray-800/50 p-5 space-y-3">
            <div className="flex justify-between">
              <Skeleton variant="text" className="w-20" />
              <Skeleton variant="avatar" />
            </div>
            <Skeleton variant="title" className="w-16" />
            <Skeleton variant="text" className="w-24" />
          </div>
        ))}
      </div>

      {/* Services List */}
      <div className="bg-[#1a1a2e] rounded-xl border border-gray-800/50 overflow-hidden">
        <div className="p-5 border-b border-gray-800/50 flex justify-between">
          <div className="space-y-1">
            <Skeleton variant="title" className="w-32" />
            <Skeleton variant="text" className="w-24" />
          </div>
          <Skeleton variant="button" />
        </div>
        <div className="p-5 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <Skeleton variant="circle" className="w-3 h-3" />
                <div className="space-y-1">
                  <Skeleton variant="text" className="w-40" />
                  <Skeleton variant="text" className="w-28" />
                </div>
              </div>
              <Skeleton variant="button" className="w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton variant="title" className="w-40" />
          <Skeleton variant="text" className="w-56" />
        </div>
        <Skeleton variant="button" className="w-36" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="button" className="w-20" />
        ))}
      </div>

      {/* Notifications */}
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#1a1a2e] rounded-xl border border-gray-800/50 p-4 flex gap-4">
            <Skeleton variant="avatar" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <Skeleton variant="text" className="w-48" />
                <Skeleton variant="text" className="w-16" />
              </div>
              <Skeleton variant="text" className="w-full" />
              <Skeleton variant="text" className="w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ServicesSkeleton() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton variant="title" className="w-32" />
        <Skeleton variant="button" className="w-32" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#1a1a2e] rounded-xl border border-gray-800/50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton variant="circle" className="w-3 h-3" />
              <div className="space-y-1">
                <Skeleton variant="text" className="w-40" />
                <Skeleton variant="text" className="w-32" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton variant="button" className="w-14" />
              <Skeleton variant="button" className="w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`${sizes[size]} border-2 border-red-500 border-t-transparent rounded-full animate-spin ${className}`} />
  );
}