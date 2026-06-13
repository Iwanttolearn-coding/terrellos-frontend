/**
 * Tools.jsx — TerrellOS Tool Launcher
 * Uses resolveUserAccess().permissions for all gates.
 * Founder bypasses everything. No church/memorial branding.
 */
import React from 'react';
import IMG from '@/lib/sectionImages';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  Cpu, FolderKanban, HardDrive, ScrollText, Activity, ShieldCheck,
  Mic, Brain, MessageSquare, Database, Settings2, ChevronRight,
  GitBranch, Terminal, DollarSign, Rocket, BarChart2, CreditCard,
  TrendingDown, Globe, Image, Scissors, Printer, Palette, LayoutGrid,
  Crown, Zap, Layers, FileCode, Heart
} from 'lucide-react';

const TOOL_GROUPS = [
  {
    group: 'Creative AI',
    color: 'text-violet-400',
    tools: [
      { path: '/tools/ai-tools-studio',  label: 'AI Image Studio',  desc: 'Generate AI images & artwork',                icon: Image,        color: 'from-violet-600 to-purple-800',  perm: 'ai_tools' },
      { path: '/tools/tattoo-studio',    label: 'Tattoo Studio',    desc: 'Custom tattoo concepts & stencils',           icon: Scissors,     color: 'from-orange-600 to-amber-800',   perm: 'tattoo_studio' },
      { path: '/tools/style-advisor',    label: 'Style Advisor',    desc: 'AI-powered design recommendations',           icon: Palette,      color: 'from-pink-600 to-rose-800',      perm: 'style_advisor' },
      { path: '/tools/print-readiness',  label: 'Print Readiness',  desc: 'Check print quality & specs',                icon: Printer,      color: 'from-cyan-600 to-blue-800',      perm: 'print_readiness' },
      { path: '/tools/creator-vault',    label: 'Creator Vault',    desc: 'Gallery, folders & saved designs',           icon: LayoutGrid,   color: 'from-fuchsia-600 to-violet-800', perm: 'creator_vault' },
    ]
  },
  {
    group: 'AI Engine',
    color: 'text-blue-400',
    tools: [
      { path: '/tools/chat-engine',  label: 'Chat Engine',  desc: 'GPT-4o AI assistant',          icon: MessageSquare, color: 'from-sky-600 to-blue-800',     perm: 'chat_engine' },
      { path: '/tools/voice-lab',    label: 'Voice Lab',    desc: 'ElevenLabs TTS & voice tools', icon: Mic,           color: 'from-indigo-600 to-violet-800', perm: 'voice_lab' },
      { path: '/tools/avatar-lab',   label: 'Avatar Lab',   desc: 'Build your AI avatar',         icon: Brain,         color: 'from-pink-600 to-rose-800',     perm: 'avatar_lab' },
      { path: '/tools/ai-builder',   label: 'AI Builder',   desc: 'Send prompts to live backend', icon: Cpu,           color: 'from-violet-600 to-purple-800', perm: 'ai_tools' },
    ]
  },
  {
    group: 'Projects & Files',
    color: 'text-emerald-400',
    tools: [
      { path: '/tools/projects',  label: 'Projects',     desc: 'Create and manage projects',     icon: FolderKanban, color: 'from-emerald-600 to-green-800', perm: 'projects' },
      { path: '/tools/uploads',   label: 'Upload Files', desc: 'Upload & manage your files',     icon: HardDrive,    color: 'from-sky-600 to-indigo-800',   perm: 'uploads' },
      { path: '/tools/memory-vault', label: 'Memory Vault', desc: 'Preserve stories & memories', icon: Brain,        color: 'from-amber-600 to-orange-800', perm: 'memory_vault' },
    ]
  },
  {
    group: 'System & Admin',
    color: 'text-amber-400',
    adminOnly: true,
    tools: [
      { path: '/tools/system-status',   label: 'System Status',    desc: 'Backend health & environment',         icon: Activity,     color: 'from-lime-600 to-green-800',    perm: 'system_status' },
      { path: '/tools/logs',            label: 'Activity Logs',    desc: 'Frontend & backend logs',              icon: ScrollText,   color: 'from-yellow-600 to-amber-800',  perm: 'logs' },
      { path: '/tools/database',        label: 'Database',         desc: 'Table explorer & DB hooks',            icon: Database,     color: 'from-slate-600 to-slate-800',   perm: 'database' },
      { path: '/tools/api-manager',     label: 'API Manager',      desc: 'Manage backend API configs',           icon: Settings2,    color: 'from-fuchsia-600 to-purple-900',perm: 'api_manager' },
      { path: '/tools/workflow',        label: 'Workflow Editor',  desc: 'Visual node-based automation',         icon: GitBranch,    color: 'from-indigo-600 to-violet-900', perm: 'workflow_editor' },
      { path: '/admin/live-console',    label: 'Live Console',     desc: 'Terminal-style event stream',          icon: Terminal,     color: 'from-slate-600 to-slate-900',   perm: 'live_console' },
      { path: '/admin/cost-manager',    label: 'Cost Manager',     desc: 'AI cost tracking & alerts',            icon: DollarSign,   color: 'from-emerald-600 to-green-900', perm: 'cost_manager' },
      { path: '/analytics',            label: 'Analytics',        desc: 'Real metrics & usage data',            icon: BarChart2,    color: 'from-teal-600 to-emerald-900',  perm: 'analytics' },
      { path: '/admin',                label: 'Admin Panel',      desc: 'User management & system ops',         icon: ShieldCheck,  color: 'from-rose-600 to-red-900',      perm: 'admin' },
    ]
  },
];

export default function Tools() {
  const { access } = useAuth();
  const perms = access?.permissions || {};
  const isFounder = access?.founder;

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto pb-24">

      {/* Tools Hub Banner */}
      <div style={{ position:"relative", width:"100%", height:160, overflow:"hidden", borderRadius:16, marginBottom:24 }}>
        <img src={IMG.toolsHub} alt="TerrellOS Tool Library"
          style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 40%", filter:"brightness(0.45)" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,rgba(3,0,7,0.4),rgba(124,58,237,0.25))" }} />
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 24px" }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.15em", color:"#a78bfa", textTransform:"uppercase", marginBottom:6 }}>All Tools</div>
          <div style={{ fontSize:22, fontWeight:900, color:"#fff" }}>TerrellOS Tool Library</div>
          <div style={{ color:"#c4b5fd", fontSize:12, marginTop:4 }}>Chat · Voice · Builder · Vault · AI Studio · Tattoo</div>
        </div>
      </div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Tool Launcher</h1>
        <p className="text-sm text-gray-400 mt-1">TerrellOS AI Engine — {isFounder ? 'All tools unlocked' : 'Select a tool to get started'}</p>
        {isFounder && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30">
            <Crown className="w-3 h-3 text-amber-400" />
            <span className="text-xs font-mono text-amber-300 font-bold">FOUNDER · SUPER ADMIN · ALL ACCESS</span>
          </div>
        )}
      </div>

      {/* Tool groups */}
      <div className="space-y-8">
        {TOOL_GROUPS.map(({ group, color, adminOnly, tools }) => {
          // Hide admin groups from non-admins
          if (adminOnly && !access?.canViewAdmin && !isFounder) return null;
          return (
            <div key={group}>
              <h2 className={`text-xs uppercase tracking-widest font-bold mb-3 ${color}`}>{group}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tools.map(({ path, label, desc, icon: Icon, color: cardColor, perm }) => {
                  const locked = !isFounder && !perms[perm];
                  return (
                    <Link key={path} to={locked ? '/pricing' : path}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group
                        ${locked
                          ? 'border-gray-800 bg-gray-900/50 opacity-60 cursor-pointer'
                          : 'border-gray-800 bg-gray-900 hover:border-violet-500/40 hover:bg-gray-800 hover:-translate-y-0.5'
                        }`}>
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cardColor} flex items-center justify-center flex-shrink-0 shadow-lg ${locked ? 'opacity-50 grayscale' : ''}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-sm leading-tight">{label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                        {locked && <div className="text-xs text-amber-500/70 mt-1 font-medium">Upgrade to unlock →</div>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0 flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-800 mt-12">TerrellOS AI Engine · app.tm-dezigns.com</p>
    </div>
  );
}