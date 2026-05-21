import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { resolveUserAccess } from '@/lib/resolveUserAccess';

import { Cpu, FolderKanban, HardDrive, ScrollText, Activity, ShieldCheck, Smile, Mic, Brain, MessageSquare, Database, Settings2, ChevronRight, GitBranch, FileCode, Layers, Terminal, DollarSign, Rocket, BarChart2, Zap, Globe, CreditCard, Heart, TrendingDown } from 'lucide-react';

const TOOLS = [
  { path: '/tools/ai-builder',    label: 'AI Builder',     desc: 'Send prompts to live backend',        icon: Cpu,           color: 'from-violet-600 to-purple-800',  perm: 'ai_tools' },
  { path: '/ai-builder-split',    label: 'AI Split View',  desc: 'Code + live preview side-by-side',   icon: Cpu,           color: 'from-indigo-600 to-purple-800',  perm: 'ai_tools' },
  { path: '/tools/chat-engine',   label: 'Chat Engine',    desc: 'AI conversation interface',           icon: MessageSquare, color: 'from-blue-600 to-blue-800',      perm: 'chat_engine' },
  { path: '/tools/avatar-lab',    label: 'Avatar Lab',     desc: 'Build your spiritual avatar',         icon: Smile,         color: 'from-pink-600 to-rose-800',      perm: 'avatar_lab' },
  { path: '/tools/voice-lab',     label: 'Voice Lab',      desc: 'Record, upload & manage voice',       icon: Mic,           color: 'from-cyan-600 to-teal-800',      perm: 'voice_lab' },
  { path: '/tools/memory-vault',  label: 'Memory Vault',   desc: 'Preserve stories & memories',         icon: Brain,         color: 'from-amber-600 to-orange-800',   perm: 'memory_vault' },
  { path: '/tools/projects',      label: 'Projects',       desc: 'Create and manage projects',          icon: FolderKanban,  color: 'from-emerald-600 to-green-800',  perm: 'projects' },
  { path: '/tools/uploads',       label: 'Upload Files',   desc: 'Upload & manage your files',          icon: HardDrive,     color: 'from-sky-600 to-indigo-800',     perm: 'uploads' },
  { path: '/tools/logs',          label: 'Activity Logs',  desc: 'Frontend & backend ping logs',        icon: ScrollText,    color: 'from-yellow-600 to-amber-800',   perm: 'logs' },
  { path: '/tools/system-status', label: 'System Status',  desc: 'Backend health & environment',        icon: Activity,      color: 'from-lime-600 to-green-800',     perm: 'system_status' },
  { path: '/tools/database',      label: 'Database',       desc: 'Database hooks & table explorer',     icon: Database,      color: 'from-slate-600 to-slate-800',    perm: 'database' },
  { path: '/tools/api-manager',   label: 'API Manager',    desc: 'Manage backend API configs',          icon: Settings2,     color: 'from-fuchsia-600 to-purple-900', perm: 'api_manager' },
  { path: '/tools/workflow',       label: 'Workflow Editor',   desc: 'Visual node-based automation builder', icon: GitBranch,    color: 'from-indigo-600 to-violet-900',   perm: 'ai_tools' },
  { path: '/ecosystem',            label: 'App Ecosystem',     desc: 'Multi-app registry & launcher',        icon: Layers,       color: 'from-violet-600 to-blue-900',     perm: 'app_registry' },
  { path: '/admin/live-console',  label: 'Live Console',      desc: 'Terminal-style event stream',          icon: Terminal,     color: 'from-slate-600 to-slate-900',     perm: 'live_console' },
  { path: '/admin/cost-manager',  label: 'Cost Manager',      desc: 'AI cost tracking & alerts',            icon: DollarSign,   color: 'from-emerald-600 to-green-900',   perm: 'cost_manager' },
  { path: '/admin/automation',    label: 'Automation Engine', desc: 'Workflows, reminders, triggers',       icon: Cpu,          color: 'from-indigo-600 to-violet-900',   perm: 'automation_engine' },
  { path: '/analytics',           label: 'Analytics',         desc: 'Real metrics — no fake data',          icon: Activity,     color: 'from-teal-600 to-emerald-900',    perm: 'analytics' },
  { path: '/live-logs',           label: 'Live Logs',         desc: 'Real-time build & activity logs',      icon: ScrollText,   color: 'from-yellow-600 to-amber-800',    perm: 'logs' },
  { path: '/backend-manifest',    label: 'Backend Manifest',  desc: 'Production Python backend files',      icon: FileCode,     color: 'from-slate-600 to-slate-800',     perm: 'developer_tools' },
  { path: '/tools/deploy',        label: 'Deployment Manager', desc: 'Push code live to Vercel or Netlify',  icon: Rocket,       color: 'from-violet-600 to-indigo-900',   perm: 'developer_tools' },
  { path: '/sandbox',               label: 'Live Sandbox',     desc: 'Live preview with build console & HMR', icon: Cpu,          color: 'from-violet-600 to-indigo-900',   perm: 'ai_tools' },
  { path: '/tools/supabase-auth',   label: 'Supabase Auth',    desc: 'Login / signup via Supabase',          icon: ShieldCheck,  color: 'from-green-600 to-emerald-900',   perm: 'ai_tools' },
  { path: '/tools/supabase-status', label: 'Supabase Status',  desc: 'Table health, row counts & PASS/FAIL', icon: Database,     color: 'from-cyan-600 to-teal-900',        perm: 'ai_tools' },
  { path: '/account',               label: 'Account Dashboard', desc: 'Profile, role, session & plan',       icon: ShieldCheck,  color: 'from-amber-600 to-orange-900',    perm: 'ai_tools' },
  { path: '/admin',               label: 'Admin Panel',       desc: 'Founder command center',               icon: ShieldCheck,  color: 'from-rose-600 to-red-900',        perm: 'admin' },
  { path: '/admin/founder',       label: 'Founder Admin',     desc: 'Users, roles, plans & activity log',   icon: ShieldCheck,  color: 'from-red-700 to-rose-900',        perm: 'admin' },
  { path: '/pricing',              label: 'Pricing Page',      desc: 'Public pricing & credit purchase',     icon: Zap,          color: 'from-amber-600 to-orange-900',    perm: 'ai_tools' },
  { path: '/billing',              label: 'Billing',           desc: 'Buy credits & manage subscriptions',       icon: CreditCard,   color: 'from-blue-600 to-cyan-900',       perm: 'ai_tools' },
  { path: '/credit-dashboard',     label: 'Credit Monitor',    desc: 'Real-time usage & low-credit alerts',      icon: TrendingDown, color: 'from-red-600 to-orange-900',      perm: 'ai_tools' },
  { path: '/founder-story',        label: 'Founder Story',     desc: 'Terrell\'s journey of resilience & faith',  icon: Heart,        color: 'from-rose-600 to-pink-900',       perm: 'ai_tools' },
  { path: '/publish',              label: 'Publish',           desc: 'Deploy app to production & custom domain', icon: Globe,     color: 'from-green-600 to-emerald-900',   perm: 'developer_tools' },
  { path: '/tools/ai-tools-studio', label: '🎨 AI Tools Studio', desc: 'All Around Customs creator toolkit — animated', icon: Cpu, color: 'from-pink-600 to-purple-900', perm: 'ai_tools' },
  { path: '/tools/manage-ai-tools',  label: '⚙️ Manage Tools',    desc: 'Add/edit/reorder tool cards (Founder only)', icon: HardDrive, color: 'from-slate-600 to-slate-900', perm: 'admin' },
  { path: '/tools/tattoo-studio',  label: '🎯 Tattoo Studio',  desc: 'AI tattoo concepts, stencils & vectors',     icon: Cpu,       color: 'from-pink-600 to-rose-900',        perm: 'ai_tools' },
  { path: '/tools/creator-vault',  label: '🗄️ Creator Vault',  desc: 'Gallery, folders, prompt history & assets',  icon: HardDrive, color: 'from-purple-600 to-violet-900',    perm: 'ai_tools' },
];

export default function Tools() {
  const [access, setAccess] = useState({ isSuperAdmin: false, founder: false, toolsAccess: false });

  const { user, access: authAccess, isLoadingAuth } = useAuth();
  
  useEffect(() => {
    setAccess(authAccess);
  }, [authAccess]);

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text">Tool Launcher</h1>
        <p className="text-sm text-muted-foreground mt-1">Select a tool to get started</p>
        {access?.founder || access?.founder && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30">
            <ShieldCheck className="w-3 h-3 text-primary" />
            <span className="text-xs font-mono text-primary font-bold">SUPER ADMIN — ALL ACCESS ENABLED</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {TOOLS.map(({ path, label, desc, icon: Icon, color, perm }) => {
          const locked = access && !access.permissions[perm];
          return (
            <Link
              key={path}
              to={locked ? '#' : path}
              className={`flex items-center gap-4 p-4 rounded-2xl border border-border bg-card transition-all group ${locked ? 'opacity-40 pointer-events-none' : 'hover:border-primary/40 hover:bg-secondary/60'}`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground">{label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}