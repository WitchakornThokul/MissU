import { Link } from 'react-router-dom';

export default function PageHeader({ emoji, title, subtitle, from = '#f43f5e', to = '#ec4899' }) {
  return (
    <div className="page-hero" style={{background:`linear-gradient(135deg,${from},${to})`}}>
      <div className="max-w-2xl mx-auto relative z-10">
        <Link to="/dashboard"
          className="inline-flex items-center gap-1.5 text-white/50 hover:text-white/90 text-sm font-semibold mb-4 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          กลับหน้าหลัก
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl glass animate-bounce-gentle">
            {emoji}
          </div>
          <div>
            <h1 className="font-display font-bold text-white" style={{fontSize:'1.75rem',lineHeight:1.1}}>{title}</h1>
            {subtitle && <p className="text-white/55 text-sm mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
