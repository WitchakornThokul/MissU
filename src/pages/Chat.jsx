import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ref, onValue, query, limitToLast } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { FiMessageCircle, FiHeart, FiUsers } from 'react-icons/fi';

function Avatar({ user, size = 48 }) {
  if (user?.photoURL) return (
    <img src={user.photoURL} alt="" className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size }} />
  );
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 text-white"
      style={{ width: size, height: size, background: 'linear-gradient(135deg,#f43f5e,#a855f7)', fontSize: size * 0.38 }}>
      {user?.avatarEmoji || '💕'}
    </div>
  );
}

function fmtTime(ts) {
  if (!ts) return '';
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d === 0) return new Date(ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  if (d === 1) return 'เมื่อวาน';
  return new Date(ts).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

function UnreadDot({ chatId, currentUid }) {
  const [unread, setUnread] = useState(false);
  useEffect(() => {
    if (!chatId) return;
    const q = query(ref(rtdb, `chats/${chatId}/messages`), limitToLast(1));
    const unsub = onValue(q, snap => {
      const data = snap.val();
      if (!data) { setUnread(false); return; }
      const msg = Object.values(data)[0];
      if (!msg || msg.senderId === currentUid) { setUnread(false); return; }
      const lastRead = parseInt(localStorage.getItem(`missu_lastRead_${chatId}`) || '0');
      setUnread(msg.timestamp > lastRead);
    });
    return () => unsub();
  }, [chatId, currentUid]);
  if (!unread) return null;
  return (
    <span style={{
      width: 10, height: 10, borderRadius: '50%',
      background: '#f43f5e', flexShrink: 0, display: 'inline-block',
      boxShadow: '0 0 0 2px white',
    }} />
  );
}

function LastMessagePreview({ chatId, currentUid }) {
  const [last, setLast] = useState(null);

  useEffect(() => {
    if (!chatId) return;
    const q = query(ref(rtdb, `chats/${chatId}/messages`), limitToLast(1));
    const unsub = onValue(q, snap => {
      const data = snap.val();
      if (data) {
        const msg = Object.values(data)[0];
        setLast(msg);
      } else {
        setLast(null);
      }
    });
    return () => unsub();
  }, [chatId]);

  if (!last) return <span style={{ fontSize: '0.8rem', color: '#c4b8d0' }}>กดเพื่อเริ่มสนทนา</span>;

  const isOwn = last.senderId === currentUid;
  const prefix = isOwn ? 'คุณ: ' : '';
  let preview = '';
  if (last.type === 'heart') preview = '❤️ ส่งความรัก';
  else if (last.type === 'image') preview = '📷 รูปภาพ';
  else preview = last.text || '';

  return (
    <span className="truncate" style={{ fontSize: '0.8rem', color: '#9ca3af', maxWidth: 180, display: 'inline-block' }}>
      {prefix}{preview}
    </span>
  );
}

export default function Chat() {
  const { currentUser, userProfile, partnerProfile, getFriends } = useAuth();
  const [friends, setFriends] = useState([]);
  const [onlineMap, setOnlineMap] = useState({});

  const hasPartner = !!userProfile?.partnerId;
  const partnerChatId = hasPartner && currentUser
    ? [currentUser.uid, userProfile.partnerId].sort().join('_') : null;

  // Load friends
  useEffect(() => {
    if (!currentUser) return;
    getFriends(currentUser.uid).then(setFriends);
  }, [currentUser]);

  // Listen to online presence for partner + friends
  useEffect(() => {
    if (!currentUser) return;
    const uids = [
      ...(userProfile?.partnerId ? [userProfile.partnerId] : []),
      ...friends.map(f => f.uid),
    ];
    const unsubs = uids.map(uid => {
      return onValue(ref(rtdb, `presence/${uid}`), snap => {
        const d = snap.val();
        setOnlineMap(prev => ({ ...prev, [uid]: d?.online === true }));
      });
    });
    return () => unsubs.forEach(u => u());
  }, [currentUser, friends, userProfile?.partnerId]);

  return (
    <div className="min-h-screen" style={{ background: '#fafafa', paddingBottom: 80 }}>
      <Navbar />

      <div className="max-w-[860px] px-4 py-5 lg:py-8 lg:px-6">
        <div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 style={{ fontWeight: 800, fontSize: '1.3rem', color: '#111' }}>ข้อความ</h1>
          <FiMessageCircle size={22} color="#111" strokeWidth={1.8} />
        </div>

        <div className="space-y-2.5">

          {/* Partner — always on top */}
          {hasPartner && partnerProfile && (
            <>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c4b8d0', letterSpacing: '0.06em', paddingLeft: 4, marginBottom: 6 }}>
                คู่รัก
              </p>
              <Link to="/chat/partner"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: '#fff',
                  borderRadius: 16,
                  padding: '12px 14px',
                  boxShadow: 'none',
                  textDecoration: 'none',
                  border: '1px solid #efefef',
                }}>
                {/* Avatar + online dot */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar user={partnerProfile} size={54} />
                  {onlineMap[userProfile.partnerId] && (
                    <span style={{
                      position: 'absolute', bottom: 2, right: 2,
                      width: 13, height: 13, borderRadius: '50%',
                      background: '#22c55e', border: '2.5px solid white',
                    }} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.97rem' }}>{partnerProfile.displayName}</p>
                    <span style={{ fontSize: '0.68rem', background: '#fff1f3', color: '#f43f5e', fontWeight: 700, borderRadius: 8, padding: '2px 7px' }}>
                      💕 คู่รัก
                    </span>
                  </div>
                  <LastMessagePreview chatId={partnerChatId} currentUid={currentUser.uid} />
                </div>

                <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <LastMessageTime chatId={partnerChatId} />
                  <UnreadDot chatId={partnerChatId} currentUid={currentUser.uid} />
                </div>
              </Link>
            </>
          )}

          {/* Friends */}
          {friends.length > 0 && (
            <>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c4b8d0', letterSpacing: '0.06em', paddingLeft: 4, marginTop: 16, marginBottom: 6 }}>
                เพื่อน ({friends.length})
              </p>
              {friends.map(friend => {
                const chatId = [currentUser.uid, friend.uid].sort().join('_');
                return (
                  <Link key={friend.uid} to={`/messages/${friend.uid}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: '#fff',
                      borderRadius: 16,
                      padding: '12px 14px',
                      boxShadow: 'none',
                      textDecoration: 'none',
                      border: '1px solid #efefef',
                    }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar user={friend} size={54} />
                      {onlineMap[friend.uid] && (
                        <span style={{
                          position: 'absolute', bottom: 2, right: 2,
                          width: 13, height: 13, borderRadius: '50%',
                          background: '#22c55e', border: '2.5px solid white',
                        }} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.97rem', marginBottom: 2 }}>{friend.displayName}</p>
                      <LastMessagePreview chatId={chatId} currentUid={currentUser.uid} />
                    </div>

                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <LastMessageTime chatId={chatId} />
                      <UnreadDot chatId={chatId} currentUid={currentUser.uid} />
                    </div>
                  </Link>
                );
              })}
            </>
          )}

          {/* Empty state */}
          {!hasPartner && friends.length === 0 && (
            <div className="text-center py-16"
              style={{ background: 'white', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div className="text-5xl mb-4">💬</div>
              <p className="font-bold text-slate-600 mb-2">ยังไม่มีการสนทนา</p>
              <p style={{ fontSize: '0.85rem', color: '#b0a8bc' }}>เพิ่มเพื่อนหรือเชื่อมต่อคู่รักก่อน</p>
            </div>
          )}

        </div>
        </div>


      </div>
    </div>
  );
}

/* ── Helper: show last message time ── */
function LastMessageTime({ chatId }) {
  const [ts, setTs] = useState(null);
  useEffect(() => {
    if (!chatId) return;
    const q = query(ref(rtdb, `chats/${chatId}/messages`), limitToLast(1));
    const unsub = onValue(q, snap => {
      const data = snap.val();
      if (data) setTs(Object.values(data)[0]?.timestamp || null);
    });
    return () => unsub();
  }, [chatId]);
  if (!ts) return null;
  return <span style={{ fontSize: '0.72rem', color: '#c4b8d0' }}>{fmtTime(ts)}</span>;
}
