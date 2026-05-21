import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ref, onValue, query, limitToLast } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { FiMessageCircle, FiHeart } from 'react-icons/fi';

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
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg,#fdf4ff 0%,#f4eef8 100%)', paddingBottom: 90 }}>
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-bold text-slate-800" style={{ fontSize: '1.25rem' }}>ข้อความ</h1>
            <p style={{ fontSize: '0.78rem', color: '#b0a8bc', marginTop: 1 }}>แชทกับคู่รักและเพื่อน</p>
          </div>
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#f43f5e,#a855f7)' }}>
            <FiMessageCircle size={16} color="white" />
          </div>
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
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'white',
                  borderRadius: 20,
                  padding: '14px 16px',
                  boxShadow: '0 2px 16px rgba(244,63,94,0.08)',
                  textDecoration: 'none',
                  border: '1.5px solid rgba(244,63,94,0.08)',
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

                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <LastMessageTime chatId={partnerChatId} />
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
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: 'white',
                      borderRadius: 20,
                      padding: '14px 16px',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                      textDecoration: 'none',
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

                    <div style={{ flexShrink: 0 }}>
                      <LastMessageTime chatId={chatId} />
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
