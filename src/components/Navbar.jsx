import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MissUNavLogo } from './MissULogo';

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

        {/* Logo */}
        <Link to="/dashboard" className="group hover:opacity-90 transition-opacity">
          <MissUNavLogo dark={true}/>
        </Link>

        {currentUser && (
          <div className="flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, badge }) => (
              <Link key={to} to={to}
                className={`relative px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  active === to ? 'text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
                style={active === to
                  ? {background:'linear-gradient(135deg,#e8637a,#1da0bc)', color:'white'}
                  : {}}>
                {label}
                {badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                    style={{fontSize:'0.6rem', background:'#e8637a'}}>
                    {badge}
                  </span>
                )}
              </Link>
            ))}

            <div className="w-px h-5 mx-2" style={{background:'rgba(29,160,188,.15)'}}/>

            <div className="flex items-center gap-2">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="" className="w-7 h-7 rounded-full object-cover avatar-ring"/>
              ) : (
                <span className="text-xl">{userProfile?.avatarEmoji || '💕'}</span>
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
