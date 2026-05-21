import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <nav className="sticky top-0 z-50 glass-white shadow-sm"
      style={{ borderBottom:'1px solid rgba(244,63,94,0.1)' }}>
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">

        <Link to="/dashboard" className="flex items-center gap-2 group">
          <span className="text-2xl group-hover:animate-heartbeat">💕</span>
          <span className="font-display font-bold text-xl text-gradient">MissU</span>
        </Link>

        {currentUser && (
          <div className="flex items-center gap-1 sm:gap-3">
            {[
              { to:'/dashboard', label:'หน้าหลัก' },
              { to:'/profile',   label:'โปรไฟล์' },
            ].map(({ to, label }) => (
              <Link key={to} to={to}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  location.pathname === to
                    ? 'text-white'
                    : 'text-gray-500 hover:text-rose-500'
                }`}
                style={location.pathname === to
                  ? { background:'linear-gradient(135deg,#f43f5e,#ec4899)', boxShadow:'0 2px 12px rgba(244,63,94,0.3)' }
                  : {}}>
                {label}
              </Link>
            ))}

            <div className="flex items-center gap-2 ml-1 pl-3"
              style={{ borderLeft:'1px solid rgba(244,63,94,0.15)' }}>
              <span className="text-xl">{userProfile?.avatarEmoji || '💕'}</span>
              <span className="text-sm font-semibold text-gray-600 hidden sm:block max-w-[80px] truncate">
                {userProfile?.displayName}
              </span>
              <button onClick={handleLogout}
                className="text-xs text-gray-300 hover:text-rose-400 transition-colors font-medium ml-1">
                ออก
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
