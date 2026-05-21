import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { ref, onValue, query as rtdbQuery, limitToLast } from 'firebase/database';
import { db, rtdb } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { FiHome, FiMessageCircle, FiUsers, FiRss, FiUser } from 'react-icons/fi';

export default function BottomNav() {
  const { currentUser, userProfile, incomingRequests, isLocal, getFriends } = useAuth();
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

  const TABS = [
    { to: '/dashboard', label: 'หน้าหลัก', Icon: FiHome },
    { to: '/feed',      label: 'ฟีด',      Icon: FiRss },
    { to: '/chat',      label: 'แชท',      Icon: FiMessageCircle, badge: unreadChatCount },
    { to: '/people',    label: 'คนรู้จัก', Icon: FiUsers, badge: friendReqCount },
    { to: '/profile',   label: 'โปรไฟล์',  Icon: FiUser },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{
        background: '#ffffff',
        borderTop: '1px solid #dbdbdb',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', height: 52 }}>
        {TABS.map(({ to, label, Icon, badge }) => {
          const isActive = active === to;
          const color = isActive ? '#111111' : '#8e8e8e';
          return (
            <Link
              key={to}
              to={to}
              style={{
                flex: 1, height: '100%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 3, textDecoration: 'none', position: 'relative',
              }}>
              <div style={{ position: 'relative' }}>
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  color={color}
                />
                {badge > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -6,
                    minWidth: 15, height: 15, borderRadius: 8,
                    background: '#ed4956', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.5rem', fontWeight: 800, padding: '0 3px',
                  }}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.6rem', fontWeight: isActive ? 700 : 500, color, lineHeight: 1 }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
