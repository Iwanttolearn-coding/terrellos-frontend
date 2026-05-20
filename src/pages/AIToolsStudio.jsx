import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { ToolCard } from '@/api/entities';

const CATEGORIES = ['All', 'AI', 'Tattoo', 'Print', 'Vector', 'Design', 'Gallery', 'Upload'];

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 2 + Math.random() * 3,
  duration: 8 + Math.random() * 12,
  delay: Math.random() * 8,
  color: ['#ff4680', '#5078ff', '#00ffc8', '#a855f7', '#f59e0b'][Math.floor(Math.random() * 5)],
}));

export default function AIToolsStudio() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [liveBg, setLiveBg] = useState(true);
  const [search, setSearch] = useState('');
  const { access } = useAuth();

  useEffect(() => {
    ToolCard.list().then(data => {
      const sorted = [...data].sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99));
      setTools(sorted.filter(t => t.enabled !== false));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = tools.filter(t => {
    const matchCat = activeCategory === 'All' || t.category === activeCategory;
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const featured = filtered.filter(t => t.featured);
  const regular = filtered.filter(t => !t.featured);

  return (
    <div className={`ai-help-page min-h-screen relative overflow-hidden ${liveBg ? 'live-bg' : 'bg-gray-950'}`}>
      {/* ── Animated background layers ── */}
      {liveBg && (
        <>
          <div className="bg-glow-blob blob-1" />
          <div className="bg-glow-blob blob-2" />
          <div className="bg-glow-blob blob-3" />
          <div className="bg-grid" />
          <div className="bg-float-glow" />
          {/* Floating particles */}
          <div className="particles-layer">
            {PARTICLES.map(p => (
              <div key={p.id} className="particle"
                style={{
                  left: `${p.x}%`, top: `${p.y}%`,
                  width: p.size, height: p.size,
                  background: p.color,
                  animationDuration: `${p.duration}s`,
                  animationDelay: `${p.delay}s`,
                  boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                }}
              />
            ))}
          </div>
          {/* DTF silhouettes */}
          <div className="silhouettes-layer" aria-hidden="true">
            {['🌀','⬡','◈','✦','⟐','❋','◉'].map((s, i) => (
              <span key={i} className="silhouette"
                style={{ left: `${8 + i * 13}%`, top: `${15 + (i % 3) * 25}%`,
                  animationDelay: `${i * 1.2}s`, fontSize: `${24 + (i % 3) * 12}px` }}>
                {s}
              </span>
            ))}
          </div>
        </>
      )}

      {/* ── Content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-10 md:py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-purple-300 mb-4 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            AI Tools Studio · All Around Customs
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
            Your Creative<br />
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              AI Toolkit
            </span>
          </h1>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            Powered by TerrellOS · Generate, vectorize, print, and create without limits
          </p>
          {/* Admin links */}
          {access?.founder && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <Link to="/tools/manage-ai-tools"
                className="text-xs bg-purple-700/60 hover:bg-purple-600/80 text-purple-200 px-4 py-1.5 rounded-full border border-purple-500/30 backdrop-blur-sm transition-all">
                ⚙️ Manage Tools
              </Link>
              <button onClick={() => setLiveBg(v => !v)}
                className={`text-xs px-4 py-1.5 rounded-full border backdrop-blur-sm transition-all ${
                  liveBg ? 'bg-cyan-700/60 border-cyan-500/30 text-cyan-200' : 'bg-gray-700/60 border-gray-500/30 text-gray-400'
                }`}>
                {liveBg ? '✨ Live BG: ON' : '◻ Live BG: OFF'}
              </button>
            </div>
          )}
        </div>

        {/* Search + Category filter */}
        <div className="flex flex-col md:flex-row gap-3 mb-8 items-center justify-between">
          <div className="relative w-full md:w-72">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tools..."
              className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm backdrop-blur-sm focus:outline-none focus:border-purple-500/60 transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/20 hover:text-white backdrop-blur-sm'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {/* Featured cards — larger */}
            {featured.length > 0 && activeCategory === 'All' && !search && (
              <div className="mb-8">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">⭐ Featured</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {featured.map(tool => (
                    <ToolCardComponent key={tool.id} tool={tool} featured />
                  ))}
                </div>
              </div>
            )}

            {/* All / filtered cards */}
            {(regular.length > 0 || search || activeCategory !== 'All') && (
              <div>
                {featured.length > 0 && activeCategory === 'All' && !search && (
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">All Tools</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {(search || activeCategory !== 'All' ? filtered : regular).map(tool => (
                    <ToolCardComponent key={tool.id} tool={tool} />
                  ))}
                </div>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="text-center py-20">
                <span className="text-5xl">🔍</span>
                <p className="text-gray-400 mt-4">No tools found for "{search || activeCategory}"</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Embedded CSS */}
      <style>{`
        .ai-help-page.live-bg {
          background: radial-gradient(circle at 20% 20%, rgba(255,70,120,0.22) 0%, transparent 35%),
                      radial-gradient(circle at 80% 30%, rgba(80,120,255,0.20) 0%, transparent 35%),
                      radial-gradient(circle at 50% 90%, rgba(0,255,200,0.14) 0%, transparent 35%),
                      #050816;
        }
        .bg-grid {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background-image: linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: gridMove 18s linear infinite;
        }
        .bg-float-glow {
          position: absolute; inset: -20%; pointer-events: none; z-index: 0;
          background: radial-gradient(circle, rgba(255,255,255,0.06), transparent 14%);
          animation: floatGlow 12s ease-in-out infinite alternate;
        }
        .bg-glow-blob {
          position: absolute; border-radius: 50%; pointer-events: none; z-index: 0;
          filter: blur(80px); opacity: 0.45; animation: blobFloat 15s ease-in-out infinite alternate;
        }
        .blob-1 { width: 420px; height: 420px; background: rgba(168,85,247,0.35); top: -80px; left: -80px; animation-delay: 0s; }
        .blob-2 { width: 380px; height: 380px; background: rgba(236,72,153,0.30); bottom: -60px; right: -60px; animation-delay: -5s; }
        .blob-3 { width: 300px; height: 300px; background: rgba(6,182,212,0.25); top: 40%; left: 40%; animation-delay: -10s; }
        .particles-layer { position: absolute; inset: 0; pointer-events: none; z-index: 1; overflow: hidden; }
        .particle {
          position: absolute; border-radius: 50%;
          animation: particleFloat linear infinite;
        }
        .silhouettes-layer { position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
        .silhouette {
          position: absolute; opacity: 0.04; color: white;
          animation: silhouetteFloat 20s ease-in-out infinite alternate;
        }
        .ai-tool-card {
          position: relative; z-index: 2;
          background: rgba(15,23,42,0.72);
          border: 1px solid rgba(255,255,255,0.10);
          backdrop-filter: blur(14px);
          border-radius: 22px;
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .ai-tool-card:hover {
          transform: translateY(-5px);
          border-color: rgba(255,255,255,0.20);
        }
        .ai-tool-card.featured { border-color: rgba(167,139,250,0.30); }
        .ai-tool-card.featured:hover { border-color: rgba(167,139,250,0.55); }
        @keyframes gridMove { from { transform: translateY(0); } to { transform: translateY(48px); } }
        @keyframes floatGlow {
          from { transform: translate3d(-3%,-2%,0) scale(1); }
          to   { transform: translate3d(4%,3%,0) scale(1.08); }
        }
        @keyframes blobFloat {
          0%   { transform: translate(0,0) scale(1); }
          50%  { transform: translate(30px,20px) scale(1.06); }
          100% { transform: translate(-20px,30px) scale(0.95); }
        }
        @keyframes particleFloat {
          0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0.7; }
          50%  { transform: translateY(-60px) translateX(20px) scale(1.2); opacity: 1; }
          100% { transform: translateY(-120px) translateX(-10px) scale(0.8); opacity: 0; }
        }
        @keyframes silhouetteFloat {
          from { transform: translateY(0) rotate(0deg); }
          to   { transform: translateY(-30px) rotate(15deg); }
        }
      `}</style>
    </div>
  );
}

function ToolCardComponent({ tool, featured = false }) {
  const navigate = useNavigate();
  const glowColor = tool.glow_color || 'rgba(167,139,250,0.35)';

  return (
    <div
      className={`ai-tool-card group cursor-pointer ${featured ? 'featured' : ''}`}
      style={{ '--glow': glowColor }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 32px ${glowColor}`; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
      onClick={() => tool.route && navigate(tool.route)}
    >
      <div className={`p-5 ${featured ? 'p-6' : ''}`}>
        {/* Icon + category */}
        <div className="flex items-start justify-between mb-3">
          <div className={`flex items-center justify-center rounded-xl ${featured ? 'w-14 h-14 text-3xl' : 'w-11 h-11 text-2xl'} bg-gradient-to-br ${tool.bg_color || 'from-purple-600 to-violet-800'} shadow-lg`}>
            {tool.icon_url
              ? <img src={tool.icon_url} alt="" className="w-full h-full object-cover rounded-xl" />
              : <span>{tool.icon_emoji || '🛠️'}</span>
            }
          </div>
          <span className="text-xs text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
            {tool.category}
          </span>
        </div>

        {/* Text */}
        <h3 className={`font-bold text-white mb-1.5 ${featured ? 'text-lg' : 'text-sm'}`}>
          {tool.title}
        </h3>
        <p className="text-gray-400 text-xs leading-relaxed mb-4 line-clamp-3">
          {tool.description}
        </p>

        {/* Button */}
        <button
          className={`w-full py-2 rounded-xl text-xs font-semibold transition-all
            bg-gradient-to-r ${tool.bg_color || 'from-purple-600 to-violet-700'}
            text-white opacity-80 group-hover:opacity-100 group-hover:shadow-lg`}
          style={{ boxShadow: `0 2px 12px ${glowColor}` }}
        >
          {tool.button_label || 'Open Tool'} →
        </button>
      </div>
    </div>
  );
}
