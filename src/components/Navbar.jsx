import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { MissUNavLogo } from './MissULogo';
import { FiLogOut } from 'react-icons/fi';

export default function Navbar() {
  const { currentUser, userProfile, logout, incomingRequests, isLocal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [friendReqCount, setFriendReqCount] = useState(0);

  async function handleLogout() { await logout(); navigate('/'); }

  const active = location.pathname;
  const pendingCount = isLocal ? 0 : incomingRequests.length;

  useEffect(() => {
    if (!currentUser || isLocal) return;
    const q = query(
      collection(db, 'friendRequests'),
      where('toUid', '==', currentUser.uid),
      where('status', '==', 'pending')
    );
    return onSnapshot(q, snap => setFriendReqCount(snap.size));
  }, [currentUser, isLocal]);

  const NAV_LINKS = [
    { to: '/dashboard',    label: 'หน้าหลัก' },
    { to: '/feed',         label: 'ฟีด' },
    { to: '/chat',         label: 'แชท' },
    { to: '/find-partner', label: 'คู่รัก', badge: pendingCount },
    { to: '/people',       label: 'คนรู้จัก', badge: friendReqCount },
    { to: '/profile',      label: 'โปรไฟล์' },
  ];

  return (
    /* Desktop only — mobile uses BottomNav */
    <nav className="glass-white sticky top-0 z-50 hidden md:block">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">

        <Link to="/dashboard" className="hover:opacity-90 transition-opacity">
          <MissUNavLogo dark={true}/>
        </Link>

        {currentUser && (
          <div className="flex items-center gap-1.5">
            {NAV_LINKS.map(({ to, label, badge }) => (
              <Link key={to} to={to}
                className={`relative px-4 py-2 rounded-xl font-semibold transition-all ${
                  active === to ? 'text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
                style={{
                  fontSize: '0.92rem',
                  ...(active === to ? {background:'linear-gradient(135deg,#e8637a,#1da0bc)'} : {}),
                }}>
                {label}
                {badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full text-white flex items-center justify-center font-bold"
                    style={{fontSize:'0.65rem', background:'#e8637a'}}>
                    {badge}
                  </span>
                )}
              </Link>
            ))}

            <div className="w-px h-6 mx-2" style={{background:'rgba(29,160,188,.15)'}}/>

            <div className="flex items-center gap-2.5">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="" className="w-8 h-8 rounded-full object-cover avatar-ring"/>
              ) : (
                <span className="text-2xl">{userProfile?.avatarEmoji || '💕'}</span>
              )}
              <span className="font-semibold text-slate-600 hidden sm:block max-w-[110px] truncate"
                style={{fontSize:'0.92rem'}}>
                {userProfile?.displayName}
              </span>
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all font-semibold"
                style={{fontSize:'0.85rem'}}>
                <FiLogOut size={14} strokeWidth={2.5}/>
                ออก
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
