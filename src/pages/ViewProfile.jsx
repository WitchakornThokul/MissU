import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { FiMessageCircle, FiArrowLeft, FiUserPlus, FiUserCheck, FiHeart, FiGrid, FiSend, FiTrash2 } from 'react-icons/fi';

function Avatar({ user, size = 40 }) {
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

function timeAgo(ts) {
  if (!ts) return '';
  const ms = ts.toMillis?.() ?? (typeof ts === 'number' ? ts : Date.now());
  const d = (Date.now() - ms) / 1000;
  if (d < 60) return 'เมื่อสักครู่';
  if (d < 3600) return `${Math.floor(d / 60)} นาทีที่แล้ว`;
  if (d < 86400) return `${Math.floor(d / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(d / 86400)} วันที่แล้ว`;
}

function CommentSection({ postId, currentUser, userProfile }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, 'posts', postId, 'comments'));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));
      setComments(data);
    });
  }, [postId]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    await addDoc(collection(db, 'posts', postId, 'comments'), {
      text: text.trim().slice(0, 500),
      authorId: currentUser.uid,
      authorName: userProfile.displayName,
      authorEmoji: userProfile.avatarEmoji || '💕',
      authorPhoto: userProfile.photoURL || null,
      createdAt: serverTimestamp(),
    });
    setText('');
    setSending(false);
    inputRef.current?.focus();
  }

  return (
    <div style={{ borderTop: '1px solid #f0f0f0', padding: '14px 16px 16px' }}>
      <div className="flex items-center gap-2 mb-3">
        <FiMessageCircle size={15} color="#9ca3af" />
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6b7280' }}>
          ความคิดเห็น ({comments.length})
        </span>
      </div>
      {comments.length > 0 && (
        <div className="space-y-2.5 mb-4">
          {comments.map(c => (
            <div key={c.id} className="flex gap-2">
              {c.authorPhoto ? (
                <img src={c.authorPhoto} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#f43f5e,#a855f7)', color: 'white' }}>
                  {c.authorEmoji || '💕'}
                </div>
              )}
              <div className="flex-1 rounded-2xl px-3 py-2" style={{ background: '#f9fafb' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>{c.authorName}</p>
                <p style={{ fontSize: '0.88rem', color: '#4b5563', lineHeight: 1.45, marginTop: 2 }}>{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={send} className="flex gap-2 items-center">
        <Avatar user={userProfile} size={32} />
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="เขียนความคิดเห็น..."
          className="flex-1 outline-none"
          style={{
            background: '#f3f4f6',
            border: '1.5px solid #e5e7eb',
            borderRadius: 99,
            padding: '8px 16px',
            color: '#1f2937',
            fontSize: '0.85rem',
          }}
          maxLength={500}
        />
        <button type="submit" disabled={!text.trim() || sending}
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white transition-all active:scale-90"
          style={{ background: text.trim() ? 'linear-gradient(135deg,#f43f5e,#a855f7)' : '#e5e7eb' }}>
          <FiSend size={14} />
        </button>
      </form>
    </div>
  );
}

function PostCard({ post, currentUser, userProfile }) {
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [liking, setLiking] = useState(false);
  const liked = post.likes?.includes(currentUser?.uid);
  const likeCount = post.likes?.length || 0;
  const isOwn = post.authorId === currentUser?.uid;

  useEffect(() => {
    const q = query(collection(db, 'posts', post.id, 'comments'));
    return onSnapshot(q, snap => setCommentCount(snap.size));
  }, [post.id]);

  async function toggleLike() {
    if (!currentUser || liking) return;
    setLiking(true);
    await updateDoc(doc(db, 'posts', post.id), {
      likes: liked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
    });
    setLiking(false);
  }

  async function deletePost() {
    if (!confirm('ลบโพสนี้?')) return;
    await deleteDoc(doc(db, 'posts', post.id));
  }

  return (
    <div className="overflow-hidden"
      style={{
        background: 'white',
        borderRadius: 20,
        boxShadow: '0 2px 20px rgba(244,63,94,0.07), 0 1px 4px rgba(0,0,0,0.04)',
      }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="flex-shrink-0">
          <Avatar user={{ photoURL: post.authorPhoto, avatarEmoji: post.authorEmoji }} size={44} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 leading-tight" style={{ fontSize: '0.93rem' }}>{post.authorName}</p>
          <p style={{ fontSize: '0.72rem', color: '#b0a8bc', marginTop: 2 }}>{timeAgo(post.createdAt)}</p>
        </div>
        {isOwn && (
          <button onClick={deletePost}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-red-50 active:scale-90"
            style={{ color: '#e0d0e8' }}>
            <FiTrash2 size={14} />
          </button>
        )}
      </div>
      {/* Text */}
      {post.text && (
        <p className="px-4 pb-3 text-slate-700 leading-relaxed" style={{ fontSize: '0.92rem' }}>
          {post.text}
        </p>
      )}
      {/* Image */}
      {post.imageUrl && (
        <div className="px-3 pb-3">
          <img src={post.imageUrl} alt="" className="w-full object-cover" style={{ borderRadius: 14, maxHeight: 380 }} />
        </div>
      )}
      {/* Stats row */}
      {(likeCount > 0 || commentCount > 0) && (
        <div className="flex items-center justify-between px-4 pb-2" style={{ gap: 8 }}>
          {likeCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#f43f5e,#a855f7)' }}>
                <FiHeart size={10} fill="white" color="white" />
              </div>
              <span style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600 }}>{likeCount}</span>
            </div>
          )}
          {commentCount > 0 && (
            <button onClick={() => setShowComments(p => !p)}
              className="ml-auto"
              style={{ fontSize: '0.78rem', color: '#b0a8bc', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
              {commentCount} ความคิดเห็น
            </button>
          )}
        </div>
      )}
      {/* Divider */}
      <div style={{ height: 1, background: '#f5f0fa', margin: '0 16px' }} />
      {/* Action buttons */}
      <div className="flex items-center px-2 py-1">
        <button onClick={toggleLike} disabled={liking}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl font-semibold transition-all active:scale-95"
          style={{ color: liked ? '#f43f5e' : '#c4b8d0', fontSize: '0.85rem' }}>
          <FiHeart
            size={18}
            fill={liked ? '#f43f5e' : 'none'}
            color={liked ? '#f43f5e' : '#c4b8d0'}
            strokeWidth={liked ? 0 : 2}
            style={{ transition: 'transform 0.15s', transform: liked ? 'scale(1.15)' : 'scale(1)' }}
          />
          ถูกใจ
        </button>
        <div style={{ width: 1, height: 20, background: '#f0e8f5', flexShrink: 0 }} />
        <button onClick={() => setShowComments(p => !p)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl font-semibold transition-all active:scale-95"
          style={{ color: showComments ? '#a855f7' : '#c4b8d0', fontSize: '0.85rem' }}>
          <FiMessageCircle size={18} color={showComments ? '#a855f7' : '#c4b8d0'} />
          คอมเมนต์
        </button>
      </div>
      {/* Comments */}
      {showComments && (
        <CommentSection postId={post.id} currentUser={currentUser} userProfile={userProfile} />
      )}
    </div>
  );
}

export default function ViewProfile() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { currentUser, getFriendStatus, sendFriendRequest } = useAuth();
  const [profile, setProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState('none');
  const [adding, setAdding] = useState(false);

  const isOwn = currentUser?.uid === uid;
  const canSeePosts = isOwn || friendStatus === 'friends';

  useEffect(() => {
    getDoc(doc(db, 'users', uid)).then(async snap => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        if (data.partnerId) {
          const partnerSnap = await getDoc(doc(db, 'users', data.partnerId));
          if (partnerSnap.exists()) setPartnerProfile(partnerSnap.data());
        }
      }
      setLoading(false);
    });
  }, [uid]);

  useEffect(() => {
    if (!currentUser || isOwn) return;
    getFriendStatus(uid).then(setFriendStatus);
  }, [uid, currentUser, isOwn]);

  // Load posts once friend status is known
  useEffect(() => {
    if (!canSeePosts) return;
    const q = query(collection(db, 'posts'), where('authorId', '==', uid));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setPosts(data);
    });
  }, [uid, canSeePosts]);

  const days = profile?.partnerId && profile?.relationshipStart
    ? Math.floor((Date.now() - new Date(profile.relationshipStart)) / 86400000) : null;

  async function handleAdd() {
    if (!profile) return;
    setAdding(true);
    await sendFriendRequest(profile);
    setFriendStatus('sent');
    setAdding(false);
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: 'linear-gradient(180deg,#fdf4ff 0%,#f4eef8 100%)' }}>
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center pt-20">
            <div className="w-8 h-8 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin-slow" />
          </div>
        ) : !profile ? (
          <div className="text-center pt-20">
            <div className="text-5xl mb-4">😕</div>
            <p className="font-bold text-slate-600 mb-2">ไม่พบโปรไฟล์</p>
            <button onClick={() => navigate(-1)} className="btn-primary mt-4">กลับ</button>
          </div>
        ) : (
          <>
            {/* Profile card */}
            <div style={{ background: 'white', borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 32px rgba(244,63,94,0.10)', marginBottom: 20 }}>

              {/* Gradient banner */}
              <div className="relative pt-12 pb-20 px-6"
                style={{ background: 'linear-gradient(135deg,#f43f5e,#c026d3,#7c3aed)' }}>
                <div style={{ position: 'absolute', top: -24, right: -24, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
                <div style={{ position: 'absolute', bottom: -20, left: -10, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                <button onClick={() => navigate(-1)}
                  className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', cursor: 'pointer' }}>
                  <FiArrowLeft size={18} />
                </button>
              </div>

              {/* Avatar */}
              <div className="relative -mt-16 flex justify-center mb-4">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt=""
                    className="w-28 h-28 rounded-full object-cover border-4 border-white"
                    style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} />
                ) : (
                  <div className="w-28 h-28 rounded-full border-4 border-white flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#f43f5e,#a855f7)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', fontSize: '3rem' }}>
                    {profile.avatarEmoji || '💕'}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="text-center px-6 pb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">{profile.displayName}</h2>
                {profile.bio && (
                  <p className="font-display italic text-slate-400 mb-4" style={{ fontSize: '0.95rem' }}>"{profile.bio}"</p>
                )}

                {/* Partner + days */}
                {profile.partnerId && days !== null && days >= 0 && (
                  <div className="mb-5">
                    {partnerProfile && (
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-px h-4" style={{ background: '#fda4af' }} />
                        <span style={{ fontSize: '0.82rem', color: '#b0a8bc' }}>คู่รักกับ</span>
                        <Link to={`/profile/${profile.partnerId}`}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full font-bold transition-all hover:opacity-80"
                          style={{ background: '#fff1f3', color: '#e8637a', fontSize: '0.85rem' }}>
                          {partnerProfile.photoURL
                            ? <img src={partnerProfile.photoURL} alt="" className="w-5 h-5 rounded-full object-cover" />
                            : <span style={{ fontSize: '0.9rem' }}>{partnerProfile.avatarEmoji || '💕'}</span>
                          }
                          {partnerProfile.displayName}
                        </Link>
                        <div className="w-px h-4" style={{ background: '#fda4af' }} />
                      </div>
                    )}
                    <div className="flex justify-center gap-3">
                      <div className="text-center px-6 py-3.5 rounded-2xl flex-1"
                        style={{ background: 'linear-gradient(135deg,#fff1f3,#ffe4e9)', border: '1px solid rgba(244,63,94,0.12)' }}>
                        <p className="font-bold text-3xl text-gradient leading-none">{days}</p>
                        <p className="text-xs text-rose-400 font-bold uppercase tracking-wider mt-1">วันด้วยกัน</p>
                      </div>
                      {profile.relationshipStart && (
                        <div className="text-center px-6 py-3.5 rounded-2xl flex-1"
                          style={{ background: 'linear-gradient(135deg,#f3e8ff,#ede9fe)', border: '1px solid rgba(168,85,247,0.12)' }}>
                          <p className="font-bold text-purple-500 text-base mt-1">
                            {new Date(profile.relationshipStart).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </p>
                          <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mt-0.5">วันแรก</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                {!isOwn && (
                  <div className="flex gap-3">
                    {friendStatus === 'friends' && (
                      <Link to={`/messages/${uid}`}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-white transition-all active:scale-95"
                        style={{ background: 'linear-gradient(135deg,#f43f5e,#a855f7)', fontSize: '0.92rem', boxShadow: '0 4px 16px rgba(244,63,94,0.3)' }}>
                        <FiMessageCircle size={17} /> ส่งข้อความ
                      </Link>
                    )}
                    {friendStatus === 'none' && (
                      <button onClick={handleAdd} disabled={adding}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-white transition-all active:scale-95"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', fontSize: '0.92rem', boxShadow: '0 4px 16px rgba(99,102,241,0.25)' }}>
                        {adding
                          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                          : <><FiUserPlus size={17} /> เพิ่มเพื่อน</>}
                      </button>
                    )}
                    {friendStatus === 'sent' && (
                      <div className="flex-1 flex items-center justify-center py-3 rounded-2xl font-bold"
                        style={{ background: '#f3f4f6', color: '#9ca3af', fontSize: '0.92rem' }}>
                        ส่งคำขอแล้ว
                      </div>
                    )}
                    {friendStatus === 'received' && (
                      <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold"
                        style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '0.92rem' }}>
                        <FiUserCheck size={17} /> รับคำขอใน คนรู้จัก
                      </div>
                    )}
                    {friendStatus === 'friends' && (
                      <div className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl font-bold"
                        style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '0.85rem' }}>
                        <FiUserCheck size={15} /> เพื่อน
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Posts section */}
            {canSeePosts && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <FiGrid size={15} color="#b0a8bc" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6b7280' }}>
                    โพส{posts.length > 0 ? ` (${posts.length})` : ''}
                  </span>
                </div>

                {posts.length === 0 ? (
                  <div className="text-center py-12"
                    style={{ background: 'white', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                    <div className="text-4xl mb-3">✍️</div>
                    <p style={{ fontSize: '0.88rem', color: '#b0a8bc', fontWeight: 500 }}>
                      {isOwn ? 'คุณยังไม่มีโพส' : 'ยังไม่มีโพส'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map(post => (
                      <PostCard key={post.id} post={post} currentUser={currentUser} userProfile={userProfile} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Not friend — blurred hint */}
            {!canSeePosts && (
              <div className="text-center py-12"
                style={{ background: 'white', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div className="text-4xl mb-3">🔒</div>
                <p className="font-bold text-slate-600 mb-1">โพสของ {profile.displayName}</p>
                <p style={{ fontSize: '0.85rem', color: '#b0a8bc' }}>เพิ่มเป็นเพื่อนเพื่อดูโพส</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
