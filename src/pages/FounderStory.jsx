import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Zap, Code, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FounderStory() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span className="px-4 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-primary text-xs font-semibold uppercase tracking-widest">
              The Founder's Journey
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            From Loss to <span className="gradient-text">Building</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            How a painful mistake became the catalyst for learning, growth, and creating tools that empower others.
          </p>
        </div>

        {/* Main Story */}
        <div className="space-y-8 mb-16">
          {/* Section 1 - The Struggle */}
          <div className="card-glass rounded-2xl p-8 lg:p-10 border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-destructive" />
              </div>
              The Darkest Moment
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed text-lg">
              Six months ago, I was in one of the darkest and most frustrating moments of my life. I lost thousands of dollars in Bitcoin because I trusted systems and people I did not fully understand. At the time, I honestly did not know enough about computers, cybersecurity, APIs, wallets, backend systems, or how digital infrastructure actually worked. I was operating off faith, hope, and surface-level knowledge, and that negligence cost me heavily.
            </p>
            <p className="text-muted-foreground leading-relaxed text-lg">
              The feeling of realizing that my money was gone, that I had been burned, and that I did not even fully understand how it happened hit me hard. It was embarrassing. It was painful. It made me feel powerless.
            </p>
          </div>

          {/* Section 2 - The Turning Point */}
          <div className="card-glass rounded-2xl p-8 lg:p-10 border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              The Turning Point
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed text-lg">
              But that loss became a turning point. Instead of letting it destroy me mentally, I decided I was never going to be ignorant about technology again. I realized the modern world is built on code, systems, databases, APIs, servers, AI, automation, and digital infrastructure. I understood that if I wanted to protect myself, build wealth, help people, and create something meaningful, I had to learn the language behind the systems controlling the future.
            </p>
            <p className="text-muted-foreground mb-4 leading-relaxed text-lg">
              That experience pushed me back into learning. I went back to school determined to understand technology from the inside out. I started studying computer systems, backend architecture, APIs, authentication, databases, automation, AI integrations, cloud systems, and application development. What started as frustration slowly turned into obsession.
            </p>
            <p className="text-muted-foreground leading-relaxed text-lg">
              I spent countless nights researching, testing, failing, rebuilding, and learning how modern applications actually function behind the scenes.
            </p>
          </div>

          {/* Section 3 - Faith and Growth */}
          <div className="card-glass rounded-2xl p-8 lg:p-10 border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              Faith, Discipline, and Persistence
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed text-lg">
              Through all of it, my faith kept me grounded. I truly believe God used that painful situation to redirect my life. What felt like a disaster became motivation. Through prayer, discipline, and persistence, I started seeing progress. I began understanding concepts that once intimidated me — backend logic, API security, database structures, authentication systems, production deployment, Supabase integrations, cloud infrastructure, and AI-powered tools.
            </p>
            <p className="text-muted-foreground leading-relaxed text-lg">
              With the help of God and faith in Jesus Christ, I stopped looking at myself as somebody who was defeated and started seeing myself as somebody capable of building solutions. Today, I am actively creating AI-powered applications, backend systems, and integrated platforms designed to help real people.
            </p>
          </div>

          {/* Section 4 - Purpose */}
          <div className="card-glass rounded-2xl p-8 lg:p-10 border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              Building for Others
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed text-lg">
              What makes my journey different is that I did not come from a traditional Silicon Valley background. I came from real struggle, real mistakes, real losses, and real life experience. I understand what it feels like to be taken advantage of because you lack technical knowledge. That is exactly why I'm building systems designed to empower people instead of confusing them.
            </p>
            <p className="text-muted-foreground mb-4 leading-relaxed text-lg">
              My mission is bigger than just coding. I want to create platforms that help churches, families, creators, businesses, and everyday people use AI and technology in ways that improve lives. I want to bridge the gap between complicated systems and ordinary people who simply need tools that work.
            </p>
            <p className="text-muted-foreground leading-relaxed text-lg">
              I want to prove that somebody can come from hardship, make mistakes, lose money, rebuild themselves through faith and education, and still create something powerful. The same pain that almost broke me became the reason I learned how to build.
            </p>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="mb-16">
          <div className="card-glass rounded-2xl p-10 lg:p-12 border border-primary/40 bg-primary/5">
            <div className="flex items-start gap-4 mb-4">
              <Code className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-foreground mb-3">The Mission</h3>
                <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                  Building real backend systems, integrating APIs, deploying production databases, creating AI platforms, and building applications that represent <span className="text-foreground font-semibold">resilience, growth, faith, and transformation</span>.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  This is only the beginning. 🚀
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Ready to Build Your Vision?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start creating with AI today. The same tools and systems that powered my journey are now available to help you build amazing projects.
          </p>
          <Link to="/ai-builder">
            <Button className="gradient-purple-blue text-white font-semibold h-12 px-8 text-lg rounded-xl gap-2 inline-flex">
              Start Building
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Impact Stats */}
      <div className="mt-24 py-16 border-t border-border bg-card/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text mb-2">6 months</div>
              <p className="text-muted-foreground">From loss to building</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text mb-2">100%</div>
              <p className="text-muted-foreground">Faith-driven journey</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text mb-2">∞</div>
              <p className="text-muted-foreground">Potential to help others</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-6">
          Join the movement. Build with purpose. Transform ideas into reality.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/ai-builder">
            <Button className="gradient-purple-blue text-white font-semibold gap-2">
              <Zap className="w-4 h-4" />
              AI Builder
            </Button>
          </Link>
          <Link to="/pricing">
            <Button variant="outline" className="gap-2">
              View Pricing
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}