import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiHome, FiMessageCircle, FiGrid, FiHeart, FiUser } from 'react-icons/fi';

export default function BottomNav() {
  const { userProfile, incomingRequests, isLocal } = useAuth();
  const location = useLocation();
  const active = location.pathname;

  const hasPartner = isLocal || !!userProfile?.partnerId;
  const pendingCount = isLocal ? 0 : incomingRequests.length;

  const TABS = [
    { to: '/dashboard',    label: 'หน้าหลัก', Icon: FiHome },
    { to: '/chat',         label: 'แชท',      Icon: FiMessageCircle, locked: !hasPartner },
    { to: '/dashboard',    label: 'กิจกรรม',  Icon: FiGrid },
    { to: '/find-partner', label: 'คู่รัก',   Icon: FiHeart, badge: pendingCount },
    { to: '/profile',      label: 'โปรไฟล์',  Icon: FiUser },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{
        background: '#ffffff',
        borderTop: '1px solid #f0f0f0',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
      <div className="flex items-center justify-around px-2 py-2">
        {TABS.map(({ to, label, Icon, badge, locked }) => {
          const isActive = active === to;
          const color = isActive ? '#e8637a' : locked ? '#d1d5db' : '#9ca3af';
          return (
            <Link
              key={label}
              to={locked ? '/find-partner' : to}
              className="flex flex-col items-center gap-1 flex-1 py-2 px-1 transition-all active:scale-90">
              <div className="relative">
                {isActive && (
                  <div style={{
                    position: 'absolute', inset: -8,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg,rgba(232,99,122,0.12),rgba(29,160,188,0.08))',
                  }}/>
                )}
                <Icon
                  size={26}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  color={color}
                />
                {badge > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full text-white flex items-center justify-center font-black"
                    style={{fontSize:'0.55rem', background:'#e8637a'}}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span
                className="font-semibold leading-none"
                style={{fontSize:'0.72rem', color}}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
