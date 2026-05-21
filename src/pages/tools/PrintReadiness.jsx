/**
 * PrintReadiness.jsx — TM Dezigns AI Designer
 * Coming soon — production implementation in progress.
 */
import { Link } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';

export default function PrintReadiness() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-8">
      <div className="text-center max-w-lg space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border-2 border-dashed border-cyan-500/30 flex items-center justify-center mx-auto">
          <Construction className="w-9 h-9 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Print Readiness Analyzer</h1>
          <p className="text-gray-400 text-sm mt-3 leading-relaxed">Upload your design and get an instant AI analysis of print quality, color profile, resolution, bleed margins, and DTF/DTG compatibility.</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-left space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">What's coming</p>
                    <div className="flex items-center gap-2 text-sm text-gray-400"><span className="text-cyan-500">→</span>Color profile check (RGB → CMYK)</div>
          <div className="flex items-center gap-2 text-sm text-gray-400"><span className="text-cyan-500">→</span>Resolution & DPI analysis</div>
          <div className="flex items-center gap-2 text-sm text-gray-400"><span className="text-cyan-500">→</span>Bleed margin verification</div>
          <div className="flex items-center gap-2 text-sm text-gray-400"><span className="text-cyan-500">→</span>DTF/DTG compatibility report</div>
          <div className="flex items-center gap-2 text-sm text-gray-400"><span className="text-cyan-500">→</span>File format recommendations</div>
        </div>
        <div className="flex items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
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
