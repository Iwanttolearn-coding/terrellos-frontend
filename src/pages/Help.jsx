import { HelpCircle, MessageSquare, Book, ExternalLink, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SECTIONS = [
  {
    icon: Zap,
    title: 'Getting Started',
    items: [
      'TerrellOS is your AI-powered operating system for managing all your apps.',
      'Use the Founder Command Center (/founder) to control tools and monitor system health.',
      'All AI tools connect to the live backend at terrellos-backend.onrender.com.',
    ],
  },
  {
    icon: MessageSquare,
    title: 'AI Tools',
    items: [
      'AI Chat — converse with the backend AI model.',
      'Code Generator — generate React, Python, FastAPI, and more.',
      'Error Debugger — paste errors and get exact fix instructions.',
      'App Builder — generate full app blueprints and route maps.',
      'Document Writer — create business plans, guides, and summaries.',
    ],
  },
  {
    icon: Book,
    title: 'App Portfolio',
    items: [
      'TerrellOS controls Pastor AI Connect, Heavenly Eternal Echo, Kindred Love Birds, ResidentSync AI, All Around Customs, TMG Torque, Builder\'s AI, and Tattoo AI Generator.',
      'Each app shares the TerrellOS backend API layer.',
    ],
  },
];

export default function Help() {
  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl gradient-purple-blue flex items-center justify-center glow-purple">
          <HelpCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold gradient-text">Help & Documentation</h1>
          <p className="text-xs text-muted-foreground font-mono">TerrellOS platform guide</p>
        </div>
      </div>

      <div className="space-y-6">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="card-glass rounded-2xl p-5 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">{section.title}</h2>
              </div>
              <ul className="space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        <div className="card-glass rounded-2xl p-5 border border-primary/25">
          <h2 className="text-sm font-bold text-foreground mb-3">Need Support?</h2>
          <p className="text-xs text-muted-foreground mb-4">
            TerrellOS is built and maintained by TM Designz. For support, contact the founder directly.
          </p>
          <a href="mailto:millzterrell5@gmail.com">
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="w-3.5 h-3.5" /> Contact Founder
            </Button>
          </a>
        </div>
      </div>

      <div className="mt-8 text-center text-[10px] text-muted-foreground font-mono">
        Powered by TM Designz™
      </div>
    </div>
  );
}