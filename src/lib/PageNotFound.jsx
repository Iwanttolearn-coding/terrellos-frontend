/**
 * PageNotFound.jsx — TM Dezigns AI Designer
 * Clean 404 page with navigation. No white screen.
 */
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function PageNotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-8">
      <div className="text-center space-y-6">
        <div className="text-8xl font-black text-gray-800">404</div>
        <div>
          <h1 className="text-2xl font-black text-white">Page Not Found</h1>
          <p className="text-gray-500 text-sm mt-2">This route doesn't exist in TM Dezigns AI Designer.</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white text-sm transition-all">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <Link to="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 text-white text-sm font-bold hover:opacity-90 transition-opacity">
            <Home className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
