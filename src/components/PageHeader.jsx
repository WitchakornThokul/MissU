import { Link } from 'react-router-dom';

export default function PageHeader({ emoji, title, subtitle, grad = 'from-rose-400 to-pink-500' }) {
  return (
    <div className={`page-hero bg-gradient-to-r ${grad}`}>
      <div className="max-w-2xl mx-auto">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-medium mb-4 transition-colors">
          ← กลับหน้าหลัก
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-5xl animate-bounce-gentle">{emoji}</span>
          <div>
            <h1 className="font-display text-3xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-white/70 text-sm mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
