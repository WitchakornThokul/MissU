import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { ref, onValue, query as rtdbQuery, limitToLast } from 'firebase/database';
import { db, rtdb } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { FiHome, FiMessageCircle, FiUsers, FiRss, FiUser, FiHeart, FiLogOut } from 'react-icons/fi';

export default function DesktopSidebar() {
  const { currentUser, userProfile, logout, incomingRequests, isLocal, getFriends } = useAuth();
  const location = useLocation();
  const active = location.pathname;
  const [friendReqCount, setFriendReqCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

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

  useEffect(() => {
    if (!currentUser || isLocal) return;
    let unsubs = [];
    const msgMap = {};
    getFriends(currentUser.uid).then(friends => {
      const allIds = [
        ...(userProfile?.partnerId ? [[currentUser.uid, userProfile.partnerId].sort().join('_')] : []),
        ...friends.map(f => [currentUser.uid, f.uid].sort().join('_')),
      ];
      function recount() {
        let total = 0;
        allIds.forEach(id => {
          const msg = msgMap[id];
          if (!msg || msg.senderId === currentUser.uid) return;
          const lastRead = parseInt(localStorage.getItem(`missu_lastRead_${id}`) || '0');
          if (msg.timestamp > lastRead) total++;
        });
        setUnreadChatCount(total);
      }
      unsubs = allIds.map(cid => {
        const q = rtdbQuery(ref(rtdb, `chats/${cid}/messages`), limitToLast(1));
        return onValue(q, snap => {
          const data = snap.val();
          if (data) msgMap[cid] = Object.values(data)[0];
          else delete msgMap[cid];
          recount();
        });
      });
    });
    return () => unsubs.forEach(u => u());
  }, [currentUser, isLocal, userProfile?.partnerId]);

  const MENU = [
    { to: '/dashboard', label: 'หน้าหลัก', Icon: FiHome },
    { to: '/feed',      label: 'ฟีด',      Icon: FiRss },
    { to: '/chat',      label: 'ข้อความ',  Icon: FiMessageCircle, badge: unreadChatCount },
    { to: '/people',    label: 'คนรู้จัก', Icon: FiUsers, badge: friendReqCount },
    { to: '/find-partner', label: 'คู่รัก', Icon: FiHeart },
    { to: '/profile',   label: 'โปรไฟล์',  Icon: FiUser },
  ];

  async function handleLogout() {
    await logout();
    window.location.href = '/';
  }

  return (
    <div
      className="hidden lg:flex fixed left-0 top-0 h-full flex-col justify-between"
      style={{
        width: 260,
        background: '#fff',
        borderRight: '1px solid #dbdbdb',
        zIndex: 50,
      }}>

      {/* Top section */}
      <div className="flex flex-col py-8 px-3">
        {/* Logo */}
        <Link to="/dashboard" className="px-4 py-6 mb-3">
          <span style={{
            fontWeight: 800,
            fontSize: '1.75rem',
            background: 'linear-gradient(135deg,#e8637a,#1da0bc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: "'Nunito', sans-serif",
          }}>
            MissU
          </span>
        </Link>

        {/* Menu items */}
        <nav className="flex flex-col gap-1">
          {MENU.map(({ to, label, Icon, badge }) => {
            const isActive = active === to || (to === '/find-partner' && active === '/find-partner');
            return (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all hover:bg-gray-50 active:scale-[0.98] relative"
                style={{
                  background: isActive ? '#fafafa' : 'transparent',
                }}>
                <Icon
                  size={26}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  color={isActive ? '#111' : '#6b7280'}
                />
                <span style={{
                  fontSize: '1rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#111' : '#6b7280',
                }}>
                  {label}
                </span>
                {badge > 0 && (
                  <span
                    className="absolute right-3 w-5 h-5 rounded-full flex items-center justify-center font-black text-white"
                    style={{
                      fontSize: '0.65rem',
                      background: '#ed4956',
                    }}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom section - Profile + Logout */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-all">
          {userProfile?.photoURL ? (
            <img
              src={userProfile.photoURL}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{
                background: 'linear-gradient(135deg,#f43f5e,#a855f7)',
              }}>
              {userProfile?.avatarEmoji || '💕'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-800 truncate">
              {userProfile?.displayName || 'ผู้ใช้'}
            </p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-rose-500 transition-all font-medium">
              <FiLogOut size={12} />
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
