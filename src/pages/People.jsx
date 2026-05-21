import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { FiSearch, FiUserPlus, FiUserCheck, FiUsers, FiCheck, FiX } from 'react-icons/fi';

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
  const { currentUser, userProfile, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend, getFriends, getFriendStatus, searchAllUsers } = useAuth();
  const [tab, setTab] = useState('discover');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [incomingFriendReqs, setIncomingFriendReqs] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Listen to incoming friend requests
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

  // Load friends when on friends tab
  useEffect(() => {
    if (tab !== 'friends' || !currentUser) return;
    getFriends(currentUser.uid).then(setFriends);
  }, [tab, currentUser]);

  // Search
  useEffect(() => {
    if (tab !== 'discover') return;
    if (!search.trim()) {
      // Show recent users when no search
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

  return (
    <div className="min-h-screen" style={{ background: '#f8f5f7', paddingBottom: 80 }}>
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-800">คนรู้จัก</h1>
          <p className="text-sm text-slate-400 mt-1">ค้นหาและเพิ่มเพื่อนในระบบ</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 p-1 rounded-2xl" style={{ background: '#f0eaf2' }}>
          {[
            { id: 'discover', label: 'ค้นหา', icon: <FiSearch size={14} /> },
            { id: 'requests', label: `คำขอ${pendingCount > 0 ? ` (${pendingCount})` : ''}`, icon: <FiUserPlus size={14} /> },
            { id: 'friends', label: 'เพื่อน', icon: <FiUsers size={14} /> },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-xs transition-all"
              style={{
                background: tab === t.id ? 'white' : 'transparent',
                color: tab === t.id ? '#e8637a' : '#9ca3af',
                boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Discover Tab */}
        {tab === 'discover' && (
          <div>
            <div className="relative mb-4">
              <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อผู้ใช้..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none"
                style={{ background: 'white', border: '1.5px solid #f0eaf2', color: '#1f2937' }}
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 border-2 border-rose-200 border-t-rose-400 rounded-full animate-spin-slow" />
              </div>
            ) : (
              <div className="space-y-3">
                {results.length === 0 && search && (
                  <p className="text-center text-slate-400 py-10">ไม่พบผู้ใช้ชื่อ "{search}"</p>
                )}
                {results.map(user => {
                  const status = statusMap[user.uid] || 'none';
                  return (
                    <div key={user.uid} className="card flex items-center gap-3 px-4 py-3">
                      <Link to={`/profile/${user.uid}`}>
                        <Avatar user={user} size={48} />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/profile/${user.uid}`}>
                          <p className="font-bold text-slate-800 text-sm truncate">{user.displayName}</p>
                        </Link>
                        {user.bio && <p className="text-xs text-slate-400 truncate">{user.bio}</p>}
                      </div>
                      {status === 'none' && (
                        <button onClick={() => handleAdd(user)} disabled={actionLoading[user.uid]}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs text-white transition-all"
                          style={{ background: 'linear-gradient(135deg,#f43f5e,#a855f7)', minWidth: 80 }}>
                          {actionLoading[user.uid]
                            ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                            : <><FiUserPlus size={13} /> แอด</>}
                        </button>
                      )}
                      {status === 'sent' && (
                        <span className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400"
                          style={{ background: '#f3f4f6' }}>ส่งแล้ว</span>
                      )}
                      {status === 'friends' && (
                        <span className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold"
                          style={{ background: '#f0fdf4', color: '#16a34a' }}>
                          <FiUserCheck size={13} /> เพื่อน
                        </span>
                      )}
                      {status === 'received' && (
                        <button onClick={() => {
                          const req = incomingFriendReqs.find(r => r.fromUid === user.uid);
                          if (req) handleAccept(req);
                        }}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-white"
                          style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                          รับ
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {tab === 'requests' && (
          <div className="space-y-3">
            {incomingFriendReqs.length === 0 ? (
              <div className="text-center py-12">
                <FiUserPlus size={48} className="mx-auto text-slate-200 mb-3" />
                <p className="text-slate-400 text-sm">ไม่มีคำขอเพื่อน</p>
              </div>
            ) : incomingFriendReqs.map(req => (
              <div key={req.id} className="card flex items-center gap-3 px-4 py-3">
                <Link to={`/profile/${req.fromUid}`}>
                  <Avatar user={{ photoURL: req.fromPhoto, avatarEmoji: req.fromEmoji }} size={48} />
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm">{req.fromName}</p>
                  <p className="text-xs text-slate-400">ส่งคำขอเพื่อน</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAccept(req)} disabled={actionLoading[req.id]}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                    style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                    {actionLoading[req.id]
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                      : <FiCheck size={16} />}
                  </button>
                  <button onClick={() => handleDecline(req)} disabled={actionLoading[req.id]}
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: '#fef2f2', color: '#ef4444' }}>
                    <FiX size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Friends Tab */}
        {tab === 'friends' && (
          <div className="space-y-3">
            {friends.length === 0 ? (
              <div className="text-center py-12">
                <FiUsers size={48} className="mx-auto text-slate-200 mb-3" />
                <p className="text-slate-400 text-sm">ยังไม่มีเพื่อน</p>
                <button onClick={() => setTab('discover')} className="mt-3 text-sm font-bold"
                  style={{ color: '#e8637a', background: 'none', border: 'none', cursor: 'pointer' }}>
                  ค้นหาเพื่อน →
                </button>
              </div>
            ) : friends.map(friend => (
              <div key={friend.uid} className="card flex items-center gap-3 px-4 py-3">
                <Link to={`/profile/${friend.uid}`}>
                  <Avatar user={friend} size={48} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${friend.uid}`}>
                    <p className="font-bold text-slate-800 text-sm truncate">{friend.displayName}</p>
                  </Link>
                  {friend.bio && <p className="text-xs text-slate-400 truncate">{friend.bio}</p>}
                </div>
                <button onClick={() => handleRemoveFriend(friend.uid)}
                  className="p-2 rounded-xl text-slate-300 hover:text-red-400 transition-colors">
                  <FiX size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
