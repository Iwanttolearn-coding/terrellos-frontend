import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Home, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ThankYou() {
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    // Get credits from URL params or session
    const params = new URLSearchParams(window.location.search);
    const purchasedCredits = params.get('credits') || '1000';
    setCredits(parseInt(purchasedCredits));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-emerald-500/5 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome aboard!
        </h1>
        <p className="text-muted-foreground mb-6">
          Your purchase was successful. Your credits are ready to use.
        </p>

        {/* Credits display */}
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-6 mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-muted-foreground">Your balance</span>
          </div>
          <div className="text-4xl font-bold text-emerald-400">
            {credits.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">AI credits</div>
        </div>

        {/* Next steps */}
        <div className="rounded-xl bg-card border border-border p-6 mb-8">
          <h3 className="font-semibold text-foreground mb-4 text-sm">Next steps:</h3>
          <ol className="text-left space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex-shrink-0 font-semibold text-primary">1.</span>
              <span>Check your email for a receipt and account details</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 font-semibold text-primary">2.</span>
              <span>Log in to start building with AI</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 font-semibold text-primary">3.</span>
              <span>Your credits will be applied automatically</span>
            </li>
          </ol>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Link to="/">
            <Button className="w-full gradient-purple-blue text-white h-10 font-semibold">
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
          <Link to="/ai-builder">
            <Button variant="outline" className="w-full h-10 font-semibold">
              Start Building
            </Button>
          </Link>
        </div>

        {/* Support note */}
        <p className="text-xs text-muted-foreground mt-8">
          Questions? <a href="mailto:support@terrellos.app" className="text-primary hover:underline">Contact support</a>
        </p>
      </div>
    </div>
  );
}