/**
 * BackgroundSelector.jsx — TM Dezigns AI Designer
 * Coming soon — production implementation in progress.
 */
import { Link } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';

export default function BackgroundSelector() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-8">
      <div className="text-center max-w-lg space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-violet-500/10 border-2 border-dashed border-violet-500/30 flex items-center justify-center mx-auto">
          <Construction className="w-9 h-9 text-violet-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Background & Live Background</h1>
          <p className="text-gray-400 text-sm mt-3 leading-relaxed">Choose from curated static and animated backgrounds for your designs, mockups, and brand visuals.</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-left space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">What's coming</p>
                    <div className="flex items-center gap-2 text-sm text-gray-400"><span className="text-violet-500">→</span>Static background library</div>
          <div className="flex items-center gap-2 text-sm text-gray-400"><span className="text-violet-500">→</span>Animated / live backgrounds</div>
          <div className="flex items-center gap-2 text-sm text-gray-400"><span className="text-violet-500">→</span>AI background generation</div>
          <div className="flex items-center gap-2 text-sm text-gray-400"><span className="text-violet-500">→</span>Transparent PNG support</div>
          <div className="flex items-center gap-2 text-sm text-gray-400"><span className="text-violet-500">→</span>Brand color theming</div>
        </div>
        <div className="flex items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">
            🚧 In Development
          </div>
        </div>
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
