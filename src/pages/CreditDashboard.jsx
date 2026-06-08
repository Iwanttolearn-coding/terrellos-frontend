import React from 'react';
import CreditMonitor from '@/components/dashboard/CreditMonitor';
import { Zap, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function CreditDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-6 h-6 text-primary" />
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">AI Credit Monitor</h1>
            </div>
            <p className="text-muted-foreground">Real-time consumption tracking and low-credit alerts</p>
          </div>
        </div>

        {/* Main Monitor */}
        <CreditMonitor />

        {/* Insights Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-glass rounded-xl p-6 border border-border">
            <h3 className="font-semibold text-foreground mb-3">📌 Key Insights</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <span className="text-foreground">Avatar Lab</span> is at 93% — upgrade recommended</li>
              <li>• <span className="text-foreground">Pastor AI</span> consuming 2.2 credits per request</li>
              <li>• Peak usage window: <span className="text-foreground">2-4 PM Central</span></li>
              <li>• Estimated burnout: <span className="text-foreground">3 days</span> at current rate</li>
            </ul>
          </div>

          <div className="card-glass rounded-xl p-6 border border-border">
            <h3 className="font-semibold text-foreground mb-3">🚀 Next Steps</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Upgrade to <span className="text-primary font-semibold">Pro Plan</span> for unlimited credits</li>
              <li>• Optimize API requests per generation</li>
              <li>• Set up automatic alerts at 75% threshold</li>
              <li>• Review project efficiency metrics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}