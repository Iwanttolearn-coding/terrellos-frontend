/**
 * PageSkeleton — full-page loading skeleton, replaces white screens.
 */
export default function PageSkeleton({ rows = 4, title = true }) {
  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto animate-pulse">
      {title && (
        <div className="mb-6">
          <div className="h-7 w-48 bg-secondary rounded-lg mb-2" />
          <div className="h-4 w-72 bg-secondary/60 rounded" />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="card-glass rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-secondary rounded w-2/3" />
                <div className="h-3 bg-secondary/60 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}