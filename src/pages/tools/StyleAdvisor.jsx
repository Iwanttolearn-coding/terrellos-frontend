/**
 * StyleAdvisor.jsx — TM Dezigns AI Designer
 * Coming soon — production implementation in progress.
 */
import { Link } from 'react-router-dom';
import { Construction, ArrowLeft } from 'lucide-react';

export default function StyleAdvisor() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-8">
      <div className="text-center max-w-lg space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-pink-500/10 border-2 border-dashed border-pink-500/30 flex items-center justify-center mx-auto">
          <Construction className="w-9 h-9 text-pink-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white">Style Advisor</h1>
          <p className="text-gray-400 text-sm mt-3 leading-relaxed">Describe your brand, customer, or design vision and get AI-powered style recommendations tailored to TM Dezigns aesthetics.</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-left space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">What's coming</p>
                    <div className="flex items-center gap-2 text-sm text-gray-400"><span className="text-pink-500">→</span>Color palette generation</div>
          <div className="flex items-center gap-2 text-sm text-gray-400"><span className="text-pink-500">→</span>Typography pairing suggestions</div>
          <div className="flex items-center gap-2 text-sm text-gray-400"><span className="text-pink-500">→</span>Design trend analysis</div>
          <div className="flex items-center gap-2 text-sm text-gray-400"><span className="text-pink-500">→</span>Brand identity guidance</div>
          <div className="flex items-center gap-2 text-sm text-gray-400"><span className="text-pink-500">→</span>Competitor style audit</div>
        </div>
        <div className="flex items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-semibold">
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
