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
import { FiHeart, FiMessageCircle, FiImage, FiSend, FiTrash2, FiX, FiEdit3 } from 'react-icons/fi';

/* ── Pastel palette (memory-wall style) ── */
const COMMENT_PALETTES = [
  { bg: '#fff1f3', border: '#fda4af', name: '#e8637a' },
  { bg: '#f3e8ff', border: '#d8b4fe', name: '#a855f7' },
  { bg: '#eff6ff', border: '#93c5fd', name: '#3b82f6' },
  { bg: '#ecfdf5', border: '#6ee7b7', name: '#10b981' },
  { bg: '#fff7ed', border: '#fcd34d', name: '#f97316' },
  { bg: '#fdf4ff', border: '#f0abfc', name: '#d946ef' },
];

function Avatar({ user, size = 40 }) {
  if (user?.photoURL) return (
    <img src={user.photoURL} alt="" className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size }} />
  );
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 text-white"
      style={{ width: size, height: size, background: 'linear-gradient(135deg,#f43f5e,#a855f7)', fontSize: size * 0.4 }}>
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

/* ── Comments — memory-wall pastel card style ── */
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
    <div style={{ borderTop: '1px solid #f0eaf6', padding: '14px 16px 16px' }}>

      {/* Comment list — pastel memory cards */}
      {comments.length > 0 && (
        <div className="space-y-2 mb-4">
          {comments.map((c, i) => {
            const pal = COMMENT_PALETTES[i % COMMENT_PALETTES.length];
            return (
              <div key={c.id} className="rounded-2xl px-4 py-3"
                style={{ background: pal.bg, border: `1.5px solid ${pal.border}40`, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                <p className="font-bold mb-0.5" style={{ fontSize: '0.78rem', color: pal.name }}>
                  {c.authorName}
                </p>
                <p className="text-slate-600 leading-snug" style={{ fontSize: '0.85rem' }}>{c.text}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Input */}
      <form onSubmit={send} className="flex gap-2 items-center">
        <Avatar user={userProfile} size={32} />
        <div className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-2"
          style={{ background: '#f8f4fb', border: '1.5px solid #ede5f5' }}>
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="เขียนความคิดเห็น..."
            className="flex-1 outline-none bg-transparent"
            style={{ color: '#1f2937', fontSize: '0.85rem', border: 'none' }}
            maxLength={500}
          />
          <button type="submit" disabled={!text.trim() || sending}
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white transition-all active:scale-90"
            style={{ background: text.trim() ? 'linear-gradient(135deg,#f43f5e,#a855f7)' : '#e5e7eb' }}>
            <FiSend size={12} />
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Post Card ── */
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
        <Link to={`/profile/${post.authorId}`} className="flex-shrink-0">
          <Avatar user={{ photoURL: post.authorPhoto, avatarEmoji: post.authorEmoji }} size={44} />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${post.authorId}`}>
            <p className="font-bold text-slate-800 leading-tight" style={{ fontSize: '0.93rem' }}>{post.authorName}</p>
          </Link>
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
        <p className="px-4 pb-3 text-slate-700 leading-relaxed"
          style={{ fontSize: '0.92rem' }}>
          {post.text}
        </p>
      )}

      {/* Image */}
      {post.imageUrl && (
        <div className="px-3 pb-3">
          <img src={post.imageUrl} alt=""
            className="w-full object-cover"
            style={{ borderRadius: 14, maxHeight: 380 }}
          />
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

/* ── Create Post Box ── */
function CreatePostBox({ currentUser, userProfile }) {
  const [text, setNewText] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const [focused, setFocused] = useState(false);
  const fileRef = useRef(null);
  const textRef = useRef(null);

  const expanded = focused || !!text || !!preview;

  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImage(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
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
      setNewText('');
      setImage(null);
      setPreview(null);
      setFocused(false);
    } catch (err) {
      alert('โพสไม่สำเร็จ: ' + err.message);
    }
    setPosting(false);
  }

  const canPost = (text.trim() || image) && !posting;

  return (
    <div style={{
      background: 'white',
      borderRadius: 20,
      boxShadow: '0 2px 20px rgba(244,63,94,0.07), 0 1px 4px rgba(0,0,0,0.04)',
      overflow: 'hidden',
    }}>
      {/* Gradient top stripe */}
      <div style={{ height: 4, background: 'linear-gradient(90deg,#f43f5e,#a855f7,#6366f1)' }} />

      <div className="p-4">
        <div className="flex gap-3 items-start">
          <Avatar user={userProfile} size={42} />
          <div className="flex-1">
            <textarea
              ref={textRef}
              value={text}
              onChange={e => setNewText(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder={`${userProfile?.displayName || 'คุณ'} อยากเล่าอะไร?`}
              rows={expanded ? 3 : 1}
              className="w-full outline-none resize-none transition-all"
              style={{
                background: 'none',
                border: 'none',
                color: '#1f2937',
                fontSize: '0.92rem',
                lineHeight: 1.55,
                minHeight: expanded ? 72 : 40,
                padding: '8px 0',
              }}
              maxLength={1000}
            />
          </div>
        </div>

        {/* Image preview */}
        {preview && (
          <div className="relative mt-2 rounded-2xl overflow-hidden"
            style={{ border: '2px solid #f0e8f8' }}>
            <img src={preview} alt="" className="w-full object-cover" style={{ maxHeight: 220 }} />
            <button type="button" onClick={removeImage}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white"
              style={{ background: 'rgba(0,0,0,0.5)' }}>
              <FiX size={14} />
            </button>
          </div>
        )}

        {/* Divider + actions */}
        {expanded && (
          <>
            <div style={{ height: 1, background: '#f5f0fa', margin: '12px 0' }} />
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all active:scale-95"
                style={{ color: '#a855f7', fontSize: '0.82rem', fontWeight: 600, background: '#faf5ff' }}>
                <FiImage size={16} />
                รูปภาพ
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

              <div className="flex items-center gap-2">
                {(text || preview) && (
                  <button type="button"
                    onClick={() => { setNewText(''); removeImage(); setFocused(false); }}
                    className="px-3 py-2 rounded-xl font-semibold transition-all"
                    style={{ fontSize: '0.82rem', color: '#b0a8bc', background: '#f8f4fb' }}>
                    ยกเลิก
                  </button>
                )}
                <button onClick={handlePost} disabled={!canPost}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-white transition-all active:scale-95"
                  style={{
                    background: canPost ? 'linear-gradient(135deg,#f43f5e,#a855f7)' : '#e5e7eb',
                    fontSize: '0.85rem',
                    boxShadow: canPost ? '0 4px 14px rgba(244,63,94,0.3)' : 'none',
                  }}>
                  {posting
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                    : <><FiEdit3 size={14} /> โพส</>}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Feed Page ── */
export default function Feed() {
  const { currentUser, userProfile, getFriends } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friendUids, setFriendUids] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    getFriends(currentUser.uid).then(friends => {
      setFriendUids(friends.map(f => f.uid));
    });
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || friendUids === null) return;
    const visibleUids = [currentUser.uid, ...friendUids];
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg,#fdf4ff 0%,#f4eef8 100%)', paddingBottom: 90 }}>
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-bold text-slate-800" style={{ fontSize: '1.25rem' }}>ฟีด</h1>
            <p style={{ fontSize: '0.78rem', color: '#b0a8bc', marginTop: 1 }}>โพสของคุณและเพื่อน</p>
          </div>
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#f43f5e,#a855f7)' }}>
            <FiEdit3 size={16} color="white" />
          </div>
        </div>

        {/* Create Post */}
        {userProfile && (
          <div className="mb-5">
            <CreatePostBox currentUser={currentUser} userProfile={userProfile} />
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-2 border-rose-200 border-t-rose-400 rounded-full animate-spin-slow" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16"
            style={{ background: 'white', borderRadius: 20, boxShadow: '0 2px 20px rgba(244,63,94,0.07)' }}>
            <div className="text-5xl mb-4">✨</div>
            <p className="font-bold text-slate-700 mb-2">ยังไม่มีโพส</p>
            <p className="text-slate-400" style={{ fontSize: '0.85rem' }}>เพิ่มเพื่อนแล้วโพสอะไรสักอย่าง</p>
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
