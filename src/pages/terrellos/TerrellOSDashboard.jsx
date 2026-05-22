/**
 * TerrellOSDashboard.jsx — TerrellOS
 * Dashboard — polished stub, no loops, no blank screens.
 */
import { useNavigate } from 'react-router-dom';
export default function TerrellOSDashboard() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-8">
      <div className="text-center max-w-md space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center mx-auto text-3xl shadow-lg shadow-purple-500/20">📊</div>
        <h2 className="text-2xl font-black text-white">Dashboard</h2>
        <p className="text-gray-400 text-sm leading-relaxed">Analytics, metrics, and platform overview for TerrellOS.</p>
        <div className="inline-block px-4 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-medium">🚧 Coming Soon</div>
        <div>
          <button onClick={() => navigate('/terrellos/welcome')} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Back to Welcome
          </button>
        </div>
      </div>
    </div>
  );
}
