import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomeIcon = ({ active }) => (
  <svg className="w-5 h-5" fill={active ? 'white' : 'none'} stroke={active ? 'white' : 'currentColor'} viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
);
const ChatIcon = ({ active }) => (
  <svg className="w-5 h-5" fill={active ? 'white' : 'none'} stroke={active ? 'white' : 'currentColor'} viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);
const GridIcon = ({ active }) => (
  <svg className="w-5 h-5" fill={active ? 'white' : 'none'} stroke={active ? 'white' : 'currentColor'} viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
  </svg>
);
const HeartIcon = ({ active }) => (
  <svg className="w-5 h-5" fill={active ? 'white' : 'none'} stroke={active ? 'white' : 'currentColor'} viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);
const UserIcon = ({ active }) => (
  <svg className="w-5 h-5" fill={active ? 'white' : 'none'} stroke={active ? 'white' : 'currentColor'} viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export default function BottomNav() {
  const { userProfile, incomingRequests, isLocal } = useAuth();
  const location = useLocation();
  const active = location.pathname;

  const hasPartner = isLocal || !!userProfile?.partnerId;
  const pendingCount = isLocal ? 0 : incomingRequests.length;

  const TABS = [
    { to: '/dashboard', label: 'หน้าหลัก', Icon: HomeIcon },
    { to: '/chat',      label: 'แชท',      Icon: ChatIcon, locked: !hasPartner },
    { to: '/dashboard', label: 'กิจกรรม',  Icon: GridIcon, action: 'scroll' },
    { to: '/find-partner', label: 'คู่รัก', Icon: HeartIcon, badge: pendingCount },
    { to: '/profile',   label: 'โปรไฟล์',  Icon: UserIcon },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(29,160,188,0.10)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
      }}>
      <div className="flex items-center justify-around px-1 py-1">
        {TABS.map(({ to, label, Icon, badge, locked }) => {
          const isActive = active === to;
          const dim = locked;
          return (
            <Link
              key={label}
              to={locked ? '/find-partner' : to}
              className="flex flex-col items-center gap-0.5 flex-1 py-2 px-1 rounded-2xl transition-all"
              style={isActive ? {background:'linear-gradient(135deg,#e8637a,#1da0bc)'} : {}}>
              <div className="relative">
                <Icon active={isActive}/>
                {badge > 0 && (
                  <span
                    className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                    style={{fontSize:'0.55rem', background:'#e8637a'}}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span
                className="text-xs font-semibold leading-none"
                style={{color: isActive ? 'white' : dim ? '#c8d9e2' : '#6b8a99'}}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
