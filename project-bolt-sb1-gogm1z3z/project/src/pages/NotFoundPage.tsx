import { Link } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-600 text-white shadow-lg mb-6"><Stethoscope className="h-8 w-8" /></div>
        <h1 className="text-6xl font-bold text-slate-900 mb-2">404</h1>
        <p className="text-lg text-slate-500 mb-6">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary inline-flex">Go Home</Link>
      </div>
    </div>
  );
}
