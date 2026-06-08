import React from 'react';
export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight gradient-text">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}