import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

export default function PageHeader({ icon: Icon, title, subtitle, from = '#f43f5e', to = '#ec4899' }) {
  return (
    <div className="page-hero" style={{ background: `linear-gradient(135deg,${from},${to})` }}>
      <div className="max-w-2xl mx-auto relative z-10">
        <Link to="/dashboard"
          className="inline-flex items-center gap-1.5 text-white/60 hover:text-white/90 text-sm font-semibold mb-4 transition-colors">
          <FiArrowLeft size={14} strokeWidth={2.5} />
          กลับหน้าหลัก
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center glass animate-bounce-gentle">
            {Icon && <Icon size={24} color="white" strokeWidth={1.8} />}
          </div>
          <div>
            <h1 className="font-display font-bold text-white" style={{ fontSize: '1.75rem', lineHeight: 1.1 }}>{title}</h1>
            {subtitle && <p className="text-white/55 text-sm mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
