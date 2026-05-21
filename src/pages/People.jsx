import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { FiSearch, FiUserPlus, FiUsers, FiCheck, FiX, FiMessageCircle, FiUserCheck } from 'react-icons/fi';

function Avatar({ user, size = 40 }) {
  if (user?.photoURL) return (
    <img src={user.photoURL} alt="" className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size }} />
  );
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold"
      style={{ width: size, height: size, background: 'linear-gradient(135deg,#f43f5e,#a855f7)', fontSize: size * 0.38 }}>
      {user?.avatarEmoji || '💕'}
    </div>
  );
}

export default function People() {
  const { currentUser, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend, getFriends, getFriendStatus, searchAllUsers } = useAuth();
  const [tab, setTab] = useState('discover');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [incomingFriendReqs, setIncomingFriendReqs] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'friendRequests'),
      where('toUid', '==', currentUser.uid),
      where('status', '==', 'pending')
    );
    return onSnapshot(q, snap => {
      setIncomingFriendReqs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [currentUser]);

  useEffect(() => {
    if (tab !== 'friends' || !currentUser) return;
    getFriends(currentUser.uid).then(setFriends);
  }, [tab, currentUser]);

  useEffect(() => {
    if (tab !== 'discover') return;
    if (!search.trim()) {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(20));
      const unsub = onSnapshot(q, snap => {
        const users = snap.docs.map(d => d.data()).filter(u => u.uid !== currentUser?.uid);
        setResults(users);
        users.forEach(u => loadStatus(u.uid));
      });
      return unsub;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const users = await searchAllUsers(search);
      setResults(users);
      users.forEach(u => loadStatus(u.uid));
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, tab, currentUser]);

  async function loadStatus(uid) {
    const status = await getFriendStatus(uid);
    setStatusMap(prev => ({ ...prev, [uid]: status }));
  }

  async function handleAdd(user) {
    setActionLoading(p => ({ ...p, [user.uid]: true }));
    await sendFriendRequest(user);
    setStatusMap(p => ({ ...p, [user.uid]: 'sent' }));
    setActionLoading(p => ({ ...p, [user.uid]: false }));
  }

  async function handleAccept(req) {
    setActionLoading(p => ({ ...p, [req.id]: true }));
    await acceptFriendRequest(req.id, req.fromUid);
    setActionLoading(p => ({ ...p, [req.id]: false }));
  }

  async function handleDecline(req) {
    setActionLoading(p => ({ ...p, [req.id]: true }));
    await declineFriendRequest(req.id);
    setActionLoading(p => ({ ...p, [req.id]: false }));
  }

  async function handleRemoveFriend(uid) {
    if (!confirm('ลบเพื่อนคนนี้?')) return;
    await removeFriend(uid);
    setFriends(prev => prev.filter(f => f.uid !== uid));
  }

  const pendingCount = incomingFriendReqs.length;

  const TABS = [
    { id: 'discover', label: 'ค้นหา',  Icon: FiSearch },
    { id: 'requests', label: 'คำขอ',   Icon: FiUserPlus, badge: pendingCount },
    { id: 'friends',  label: 'เพื่อน', Icon: FiUsers },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg,#fdf4ff 0%,#f4eef8 100%)', paddingBottom: 90 }}>
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-5">

        {/* Header */}
        <div className="mb-5">
          <h1 className="font-bold text-slate-800" style={{ fontSize: '1.25rem' }}>คนรู้จัก</h1>
          <p style={{ fontSize: '0.78rem', color: '#b0a8bc', marginTop: 2 }}>ค้นหาและเพิ่มเพื่อนในระบบ</p>
        </div>

        {/* Tabs — bigger, easier to tap */}
        <div className="flex gap-2 mb-5 p-1.5 rounded-3xl" style={{ background: '#ece4f0' }}>
          {TABS.map(({ id, label, Icon, badge }) => {
            const isActive = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)}
                className="flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
                style={{
                  padding: '10px 8px',
                  borderRadius: 18,
                  background: isActive ? 'white' : 'transparent',
                  color: isActive ? '#e8637a' : '#a09ab0',
                  boxShadow: isActive ? '0 3px 12px rgba(232,99,122,0.15)' : 'none',
                  position: 'relative',
                }}>
                <div className="relative">
                  <Icon size={isActive ? 20 : 18} strokeWidth={isActive ? 2.5 : 1.8} />
                  {badge > 0 && (
                    <span className="absolute -top-2 -right-2.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-black"
                      style={{ fontSize: '0.5rem', background: '#e8637a' }}>
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: isActive ? '0.78rem' : '0.74rem', fontWeight: isActive ? 700 : 500 }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Discover Tab ── */}
        {tab === 'discover' && (
          <div>
            {/* Search bar */}
            <div className="relative mb-4">
              <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#c4b8d0' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อผู้ใช้..."
                className="w-full outline-none"
                style={{
                  background: 'white',
                  border: '1.5px solid #ede5f5',
                  borderRadius: 18,
                  padding: '13px 16px 13px 44px',
                  color: '#1f2937',
                  fontSize: '0.92rem',
                  boxShadow: '0 2px 12px rgba(244,63,94,0.05)',
                }}
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-7 h-7 border-2 border-rose-200 border-t-rose-400 rounded-full animate-spin-slow" />
              </div>
            ) : (
              <div className="space-y-3">
                {results.length === 0 && search && (
                  <div className="text-center py-14"
                    style={{ background: 'white', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="font-semibold text-slate-500">ไม่พบผู้ใช้ชื่อ "{search}"</p>
                  </div>
                )}
                {results.map(user => {
                  const status = statusMap[user.uid] || 'none';
                  return (
                    <div key={user.uid}
                      style={{ background: 'white', borderRadius: 20, padding: '14px 16px', boxShadow: '0 2px 12px rgba(244,63,94,0.05)', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <Link to={`/profile/${user.uid}`} className="flex-shrink-0">
                        <Avatar user={user} size={56} />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/profile/${user.uid}`}>
                          <p className="font-bold text-slate-800 truncate" style={{ fontSize: '0.97rem' }}>{user.displayName}</p>
                        </Link>
                        <p style={{ fontSize: '0.78rem', color: '#b0a8bc', marginTop: 2 }} className="truncate">
                          {user.bio || 'ไม่มีไบโอ'}
                        </p>
                      </div>

                      {status === 'none' && (
                        <button onClick={() => handleAdd(user)} disabled={actionLoading[user.uid]}
                          className="flex items-center gap-1.5 font-bold text-white transition-all active:scale-95 flex-shrink-0"
                          style={{
                            background: 'linear-gradient(135deg,#f43f5e,#a855f7)',
                            borderRadius: 14, padding: '9px 16px',
                            fontSize: '0.85rem',
                            boxShadow: '0 3px 12px rgba(244,63,94,0.25)',
                          }}>
                          {actionLoading[user.uid]
                            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                            : <><FiUserPlus size={15} /> แอด</>}
                        </button>
                      )}
                      {status === 'sent' && (
                        <span className="flex-shrink-0 font-semibold"
                          style={{ background: '#f3f4f6', color: '#9ca3af', fontSize: '0.82rem', borderRadius: 12, padding: '8px 14px' }}>
                          ส่งแล้ว
                        </span>
                      )}
                      {status === 'friends' && (
                        <span className="flex items-center gap-1.5 flex-shrink-0 font-semibold"
                          style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '0.82rem', borderRadius: 12, padding: '8px 14px' }}>
                          <FiUserCheck size={14} /> เพื่อน
                        </span>
                      )}
                      {status === 'received' && (
                        <button onClick={() => {
                          const req = incomingFriendReqs.find(r => r.fromUid === user.uid);
                          if (req) handleAccept(req);
                        }}
                          className="flex items-center gap-1.5 font-bold text-white flex-shrink-0 active:scale-95 transition-all"
                          style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', borderRadius: 14, padding: '9px 14px', fontSize: '0.85rem' }}>
                          <FiCheck size={14} /> รับ
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Requests Tab ── */}
        {tab === 'requests' && (
          <div>
            {incomingFriendReqs.length === 0 ? (
              <div className="text-center py-16"
                style={{ background: 'white', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div className="text-5xl mb-4">📭</div>
                <p className="font-bold text-slate-600 mb-1">ไม่มีคำขอเพื่อน</p>
                <p style={{ fontSize: '0.85rem', color: '#b0a8bc' }}>เมื่อมีคนส่งคำขอ จะแสดงที่นี่</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="font-semibold px-1" style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                  {incomingFriendReqs.length} คำขอที่รอการตอบรับ
                </p>
                {incomingFriendReqs.map(req => (
                  <div key={req.id}
                    style={{ background: 'white', borderRadius: 20, padding: '16px', boxShadow: '0 2px 12px rgba(244,63,94,0.05)' }}>
                    <div className="flex items-center gap-4 mb-4">
                      <Link to={`/profile/${req.fromUid}`} className="flex-shrink-0">
                        <Avatar user={{ photoURL: req.fromPhoto, avatarEmoji: req.fromEmoji }} size={58} />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800" style={{ fontSize: '1rem' }}>{req.fromName}</p>
                        <p style={{ fontSize: '0.8rem', color: '#b0a8bc', marginTop: 3 }}>ส่งคำขอเป็นเพื่อน</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleAccept(req)} disabled={actionLoading[req.id]}
                        className="flex-1 flex items-center justify-center gap-2 font-bold text-white transition-all active:scale-95"
                        style={{
                          background: actionLoading[req.id] ? '#e5e7eb' : 'linear-gradient(135deg,#22c55e,#16a34a)',
                          borderRadius: 14, padding: '12px',
                          fontSize: '0.92rem',
                          boxShadow: actionLoading[req.id] ? 'none' : '0 4px 12px rgba(34,197,94,0.25)',
                        }}>
                        {actionLoading[req.id]
                          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                          : <><FiCheck size={17} /> รับเป็นเพื่อน</>}
                      </button>
                      <button onClick={() => handleDecline(req)} disabled={actionLoading[req.id]}
                        className="flex items-center justify-center gap-2 font-semibold transition-all active:scale-95"
                        style={{ background: '#fef2f2', color: '#ef4444', borderRadius: 14, padding: '12px 18px', fontSize: '0.88rem' }}>
                        <FiX size={18} /> ปฏิเสธ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Friends Tab ── */}
        {tab === 'friends' && (
          <div>
            {friends.length === 0 ? (
              <div className="text-center py-16"
                style={{ background: 'white', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div className="text-5xl mb-4">👥</div>
                <p className="font-bold text-slate-600 mb-2">ยังไม่มีเพื่อน</p>
                <p style={{ fontSize: '0.85rem', color: '#b0a8bc', marginBottom: 16 }}>ค้นหาและเพิ่มเพื่อนใหม่ได้เลย</p>
                <button onClick={() => setTab('discover')}
                  className="inline-flex items-center gap-2 font-bold text-white transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#f43f5e,#a855f7)', borderRadius: 16, padding: '11px 22px', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(244,63,94,0.3)' }}>
                  <FiSearch size={15} /> ค้นหาเพื่อน
                </button>
              </div>
            ) : (
              <>
                <p className="font-semibold px-1 mb-3" style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                  {friends.length} เพื่อน
                </p>
                <div className="space-y-3">
                  {friends.map(friend => (
                    <div key={friend.uid}
                      style={{ background: 'white', borderRadius: 20, padding: '14px 16px', boxShadow: '0 2px 12px rgba(244,63,94,0.05)', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <Link to={`/profile/${friend.uid}`} className="flex-shrink-0">
                        <Avatar user={friend} size={56} />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/profile/${friend.uid}`}>
                          <p className="font-bold text-slate-800 truncate" style={{ fontSize: '0.97rem' }}>{friend.displayName}</p>
                        </Link>
                        {friend.bio && (
                          <p style={{ fontSize: '0.78rem', color: '#b0a8bc', marginTop: 2 }} className="truncate">{friend.bio}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link to={`/messages/${friend.uid}`}
                          className="flex items-center justify-center transition-all active:scale-95"
                          style={{ background: 'linear-gradient(135deg,#f43f5e,#a855f7)', color: 'white', borderRadius: 14, width: 42, height: 42, boxShadow: '0 3px 10px rgba(244,63,94,0.25)' }}>
                          <FiMessageCircle size={18} />
                        </Link>
                        <button onClick={() => handleRemoveFriend(friend.uid)}
                          className="flex items-center justify-center transition-all active:scale-95"
                          style={{ background: '#fef2f2', color: '#ef4444', borderRadius: 14, width: 42, height: 42 }}>
                          <FiX size={17} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
