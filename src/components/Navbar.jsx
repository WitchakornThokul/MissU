import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HeartIcon = () => (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

export default function Navbar() {
  const { currentUser, userProfile, logout, incomingRequests, isLocal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() { await logout(); navigate('/'); }

  const active = location.pathname;
  const pendingCount = isLocal ? 0 : incomingRequests.length;

  const NAV_LINKS = [
    { to: '/dashboard', label: 'หน้าหลัก' },
    { to: '/find-partner', label: 'คู่รัก', badge: pendingCount },
    { to: '/profile', label: 'โปรไฟล์' },
  ];

  return (
    <nav className="glass-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <span className="text-xl group-hover:animate-heartbeat">💕</span>
          <span className="font-display font-bold text-xl text-gradient">MissU</span>
        </Link>

        {currentUser && (
          <div className="flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, badge }) => (
              <Link key={to} to={to}
                className={`relative px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all ${active === to ? 'text-rose-500' : 'text-slate-400 hover:text-slate-700'}`}
                style={active === to ? {background:'#fff1f3'} : {}}>
                {label}
                {badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                    style={{fontSize:'0.6rem', background:'linear-gradient(135deg,#f43f5e,#a855f7)'}}>
                    {badge}
                  </span>
                )}
              </Link>
            ))}
            <div className="w-px h-5 mx-2" style={{background:'rgba(244,63,94,.15)'}}/>
            <div className="flex items-center gap-2">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="" className="w-7 h-7 rounded-full object-cover avatar-ring"/>
              ) : (
                <span className="text-xl">{userProfile?.avatarEmoji||'💕'}</span>
              )}
              <span className="text-sm font-semibold text-slate-600 hidden sm:block max-w-[90px] truncate">
                {userProfile?.displayName}
              </span>
              <button onClick={handleLogout} className="btn-ghost text-xs">ออก</button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
