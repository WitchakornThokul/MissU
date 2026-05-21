import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  collection, query, where, onSnapshot, addDoc,
  serverTimestamp, updateDoc, doc, arrayUnion, arrayRemove,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { FiHeart, FiMessageCircle, FiImage, FiSend, FiMoreHorizontal, FiTrash2, FiX, FiEdit3 } from 'react-icons/fi';

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
  }

  return (
    <div style={{ borderTop: '1px solid #f5f0f7', padding: '12px 16px 16px' }}>
      <div className="space-y-2.5 mb-3">
        {comments.map(c => (
          <div key={c.id} className="flex gap-2 items-start">
            <Avatar user={{ photoURL: c.authorPhoto, avatarEmoji: c.authorEmoji }} size={28} />
            <div className="flex-1 rounded-2xl px-3 py-2" style={{ background: '#f8f4fb' }}>
              <span className="font-bold text-slate-700 mr-1.5" style={{ fontSize: '0.78rem' }}>{c.authorName}</span>
              <span className="text-slate-600" style={{ fontSize: '0.82rem' }}>{c.text}</span>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2 items-center">
        <Avatar user={userProfile} size={30} />
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="แสดงความคิดเห็น..."
          className="flex-1 rounded-full px-4 py-2 outline-none"
          style={{ background: '#f5f0f7', border: 'none', color: '#1f2937', fontSize: '0.82rem' }}
          maxLength={500}
        />
        <button type="submit" disabled={!text.trim() || sending}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-all active:scale-90"
          style={{ background: text.trim() ? 'linear-gradient(135deg,#f43f5e,#a855f7)' : '#e5e7eb' }}>
          <FiSend size={13} />
        </button>
      </form>
    </div>
  );
}

function PostCard({ post, currentUser, userProfile }) {
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const liked = post.likes?.includes(currentUser?.uid);
  const likeCount = post.likes?.length || 0;

  useEffect(() => {
    const q = query(collection(db, 'posts', post.id, 'comments'));
    return onSnapshot(q, snap => setCommentCount(snap.size));
  }, [post.id]);

  async function toggleLike() {
    if (!currentUser) return;
    await updateDoc(doc(db, 'posts', post.id), {
      likes: liked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
    });
  }

  async function deletePost() {
    if (!confirm('ลบโพสนี้?')) return;
    setShowMenu(false);
    await deleteDoc(doc(db, 'posts', post.id));
  }

  return (
    <div className="card overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(244,63,94,0.06)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <Link to={`/profile/${post.authorId}`} className="flex-shrink-0">
          <Avatar user={{ photoURL: post.authorPhoto, avatarEmoji: post.authorEmoji }} size={46} />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${post.authorId}`}>
            <p className="font-bold text-slate-800" style={{ fontSize: '0.93rem' }}>{post.authorName}</p>
          </Link>
          <p className="text-slate-400" style={{ fontSize: '0.75rem', marginTop: 1 }}>{timeAgo(post.createdAt)}</p>
        </div>
        {post.authorId === currentUser?.uid && (
          <div className="relative">
            <button onClick={() => setShowMenu(p => !p)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
              <FiMoreHorizontal size={17} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-10 rounded-2xl shadow-xl py-1.5 z-20 min-w-[130px]"
                  style={{ background: 'white', border: '1px solid #f0e8f5' }}>
                  <button onClick={deletePost}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 font-semibold text-red-500 hover:bg-red-50 transition-colors"
                    style={{ fontSize: '0.85rem' }}>
                    <FiTrash2 size={14} /> ลบโพส
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Text */}
      {post.text && (
        <p className="px-4 pb-3 text-slate-700 leading-relaxed" style={{ fontSize: '0.9rem' }}>{post.text}</p>
      )}

      {/* Image */}
      {post.imageUrl && (
        <img src={post.imageUrl} alt="" className="w-full object-cover" style={{ maxHeight: 420 }} />
      )}

      {/* Stats */}
      {(likeCount > 0 || commentCount > 0) && (
        <div className="flex items-center justify-between px-4 py-2"
          style={{ borderTop: '1px solid #f8f4fb' }}>
          {likeCount > 0 && (
            <span className="flex items-center gap-1 text-rose-400" style={{ fontSize: '0.8rem' }}>
              <FiHeart size={13} fill="#f43f5e" strokeWidth={0} /> {likeCount} คน
            </span>
          )}
          {commentCount > 0 && (
            <span className="text-slate-400 ml-auto" style={{ fontSize: '0.8rem' }}>
              {commentCount} ความคิดเห็น
            </span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center px-2 py-1" style={{ borderTop: '1px solid #f8f4fb' }}>
        <button onClick={toggleLike}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl font-semibold transition-all active:scale-95"
          style={{ color: liked ? '#f43f5e' : '#9ca3af', fontSize: '0.85rem' }}>
          <FiHeart size={18} fill={liked ? '#f43f5e' : 'none'} strokeWidth={liked ? 0 : 2} />
          ถูกใจ
        </button>
        <div style={{ width: 1, height: 24, background: '#f0e8f5', flexShrink: 0 }} />
        <button onClick={() => setShowComments(p => !p)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl font-semibold transition-all active:scale-95"
          style={{ color: showComments ? '#a855f7' : '#9ca3af', fontSize: '0.85rem' }}>
          <FiMessageCircle size={18} />
          คอมเมนต์
        </button>
      </div>

      {showComments && (
        <CommentSection postId={post.id} currentUser={currentUser} userProfile={userProfile} />
      )}
    </div>
  );
}

/* ── Create Post Box (inline, like Facebook) ── */
function CreatePostBox({ currentUser, userProfile, onPosted }) {
  const [text, setNewText] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef(null);

  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setExpanded(true);
  }

  async function handlePost(e) {
    e.preventDefault();
    if (!text.trim() && !image) return;
    if (!currentUser || !userProfile) return;
    setPosting(true);
    try {
      let imageUrl = null;
      if (image) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(image);
        });
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        });
        const json = await res.json();
        if (res.ok) imageUrl = json.url;
      }
      await addDoc(collection(db, 'posts'), {
        text: text.trim().slice(0, 1000),
        imageUrl,
        authorId: currentUser.uid,
        authorName: userProfile.displayName,
        authorEmoji: userProfile.avatarEmoji || '💕',
        authorPhoto: userProfile.photoURL || null,
        likes: [],
        createdAt: serverTimestamp(),
      });
      setNewText(''); setImage(null); setPreview(null); setExpanded(false);
      onPosted?.();
    } catch (err) {
      alert('โพสไม่สำเร็จ: ' + err.message);
    }
    setPosting(false);
  }

  return (
    <div className="card p-4" style={{ boxShadow: '0 2px 16px rgba(244,63,94,0.06)' }}>
      <div className="flex gap-3 items-start">
        <Avatar user={userProfile} size={44} />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={e => { setNewText(e.target.value); if (e.target.value) setExpanded(true); }}
            onFocus={() => setExpanded(true)}
            placeholder={`${userProfile?.displayName || 'คุณ'} กำลังคิดอะไรอยู่?`}
            rows={expanded ? 3 : 1}
            className="w-full rounded-2xl px-4 py-3 outline-none resize-none transition-all"
            style={{ background: '#f8f4fb', border: 'none', color: '#1f2937', fontSize: '0.9rem', minHeight: expanded ? 80 : 44 }}
            maxLength={1000}
          />

          {preview && (
            <div className="relative mt-2 rounded-2xl overflow-hidden">
              <img src={preview} alt="" className="w-full object-cover max-h-52 rounded-2xl" />
              <button type="button" onClick={() => { setImage(null); setPreview(null); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center">
                <FiX size={14} />
              </button>
            </div>
          )}

          {expanded && (
            <div className="flex items-center justify-between mt-3">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold transition-all hover:bg-rose-50"
                style={{ color: '#e8637a', fontSize: '0.82rem' }}>
                <FiImage size={16} /> รูปภาพ
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
              <button onClick={handlePost} disabled={(!text.trim() && !image) || posting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-white transition-all active:scale-95"
                style={{
                  background: (!text.trim() && !image) || posting ? '#e5e7eb' : 'linear-gradient(135deg,#f43f5e,#a855f7)',
                  fontSize: '0.85rem',
                  boxShadow: (!text.trim() && !image) ? 'none' : '0 4px 14px rgba(244,63,94,0.3)',
                }}>
                {posting
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" /> กำลังโพส...</>
                  : <><FiSend size={14} /> โพสเลย</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Feed() {
  const { currentUser, userProfile, getFriends } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friendUids, setFriendUids] = useState(null); // null = loading

  // Load friends first
  useEffect(() => {
    if (!currentUser) return;
    getFriends(currentUser.uid).then(friends => {
      setFriendUids(friends.map(f => f.uid));
    });
  }, [currentUser]);

  // Load posts only after friends loaded
  useEffect(() => {
    if (!currentUser || friendUids === null) return;

    const visibleUids = [currentUser.uid, ...friendUids];

    // Query without orderBy to avoid composite index requirement — sort client-side
    const q = query(
      collection(db, 'posts'),
      where('authorId', 'in', visibleUids.slice(0, 10))
    );

    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setPosts(data);
      setLoading(false);
    }, err => {
      console.error('Feed error:', err);
      setLoading(false);
    });

    return unsub;
  }, [currentUser, friendUids]);

  return (
    <div className="min-h-screen" style={{ background: '#f4eef8', paddingBottom: 90 }}>
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-5">

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-800">ฟีด</h1>
          <p className="text-slate-400" style={{ fontSize: '0.82rem', marginTop: 2 }}>โพสของคุณและเพื่อน</p>
        </div>

        {/* Create Post */}
        {userProfile && (
          <div className="mb-4">
            <CreatePostBox currentUser={currentUser} userProfile={userProfile} />
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-rose-200 border-t-rose-400 rounded-full animate-spin-slow" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 card">
            <div className="text-5xl mb-4">📝</div>
            <p className="font-bold text-slate-700 mb-1">ยังไม่มีโพส</p>
            <p className="text-slate-400 mb-1" style={{ fontSize: '0.85rem' }}>เพิ่มเพื่อนเพื่อดูโพสของพวกเขา</p>
            <p className="text-slate-400" style={{ fontSize: '0.85rem' }}>หรือเริ่มโพสด้านบนได้เลย</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} currentUser={currentUser} userProfile={userProfile} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
