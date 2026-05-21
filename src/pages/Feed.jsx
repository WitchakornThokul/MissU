import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  collection, query, where, onSnapshot, addDoc,
  orderBy, serverTimestamp, updateDoc, doc, arrayUnion, arrayRemove,
  getDocs, deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { FiHeart, FiMessageCircle, FiImage, FiSend, FiMoreHorizontal, FiTrash2, FiX } from 'react-icons/fi';

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
  const d = (Date.now() - ts.toMillis?.() ?? ts) / 1000;
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
    const q = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
    <div className="px-4 pb-4 border-t border-slate-50">
      <div className="space-y-2 mt-3 mb-3">
        {comments.map(c => (
          <div key={c.id} className="flex gap-2.5 items-start">
            <Avatar user={{ photoURL: c.authorPhoto, avatarEmoji: c.authorEmoji }} size={28} />
            <div className="flex-1 rounded-2xl px-3 py-2" style={{ background: '#f8f5f7' }}>
              <span className="font-bold text-xs text-slate-700 mr-1.5">{c.authorName}</span>
              <span className="text-xs text-slate-600">{c.text}</span>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2 items-center">
        <Avatar user={userProfile} size={30} />
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="เขียนคอมเมนต์..."
          className="flex-1 rounded-full px-4 py-2 text-xs outline-none"
          style={{ background: '#f0eaf2', border: 'none', color: '#1f2937' }}
          maxLength={500}
        />
        <button type="submit" disabled={!text.trim() || sending}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-all"
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
  const liked = post.likes?.includes(currentUser?.uid);
  const likeCount = post.likes?.length || 0;

  async function toggleLike() {
    if (!currentUser) return;
    await updateDoc(doc(db, 'posts', post.id), {
      likes: liked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
    });
  }

  async function deletePost() {
    if (!confirm('ลบโพสนี้?')) return;
    await deleteDoc(doc(db, 'posts', post.id));
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <Link to={`/profile/${post.authorId}`}>
          <Avatar user={{ photoURL: post.authorPhoto, avatarEmoji: post.authorEmoji }} size={44} />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${post.authorId}`}>
            <p className="font-bold text-slate-800 text-sm">{post.authorName}</p>
          </Link>
          <p className="text-xs text-slate-400">{timeAgo(post.createdAt)}</p>
        </div>
        {post.authorId === currentUser?.uid && (
          <div className="relative">
            <button onClick={() => setShowMenu(p => !p)}
              className="p-2 rounded-full text-slate-400 hover:bg-slate-50">
              <FiMoreHorizontal size={18} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 rounded-2xl shadow-xl py-1 z-10 min-w-[120px]"
                style={{ background: 'white', border: '1px solid #f0eaf2' }}>
                <button onClick={() => { deletePost(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
                  <FiTrash2 size={14} /> ลบโพส
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {post.text && (
        <p className="px-4 pb-3 text-sm text-slate-700 leading-relaxed">{post.text}</p>
      )}
      {post.imageUrl && (
        <img src={post.imageUrl} alt="" className="w-full object-cover" style={{ maxHeight: 400 }} />
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-slate-50">
        <button onClick={toggleLike}
          className="flex items-center gap-1.5 text-sm font-semibold transition-all active:scale-90"
          style={{ color: liked ? '#f43f5e' : '#9ca3af' }}>
          <FiHeart size={18} fill={liked ? '#f43f5e' : 'none'} strokeWidth={liked ? 0 : 2} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        <button onClick={() => setShowComments(p => !p)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-all">
          <FiMessageCircle size={18} />
          <span>คอมเมนต์</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <CommentSection postId={post.id} currentUser={currentUser} userProfile={userProfile} />
      )}
    </div>
  );
}

export default function Feed() {
  const { currentUser, userProfile, getFriends } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friendUids, setFriendUids] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newText, setNewText] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef(null);

  // Load friends for feed
  useEffect(() => {
    if (!currentUser) return;
    getFriends(currentUser.uid).then(friends => {
      const uids = friends.map(f => f.uid);
      setFriendUids(uids);
    });
  }, [currentUser]);

  // Load feed posts (own + friends)
  useEffect(() => {
    if (!currentUser) return;
    const visibleUids = [currentUser.uid, ...friendUids];
    if (!visibleUids.length) { setLoading(false); return; }

    // Firestore `in` supports up to 30 values
    const chunks = [];
    for (let i = 0; i < visibleUids.length; i += 10) {
      chunks.push(visibleUids.slice(i, i + 10));
    }

    const unsubs = chunks.map(chunk => {
      const q = query(
        collection(db, 'posts'),
        where('authorId', 'in', chunk),
        orderBy('createdAt', 'desc')
      );
      return onSnapshot(q, snap => {
        const newPosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPosts(prev => {
          const filtered = prev.filter(p => !chunk.includes(p.authorId));
          return [...filtered, ...newPosts].sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() || 0;
            const tb = b.createdAt?.toMillis?.() || 0;
            return tb - ta;
          });
        });
        setLoading(false);
      });
    });

    return () => unsubs.forEach(u => u());
  }, [currentUser, friendUids]);

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setNewImage(file);
    setNewImagePreview(URL.createObjectURL(file));
  }

  async function handlePost(e) {
    e.preventDefault();
    if (!newText.trim() && !newImage) return;
    if (!currentUser || !userProfile) return;
    setPosting(true);
    try {
      let imageUrl = null;
      if (newImage) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(newImage);
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
        text: newText.trim().slice(0, 1000),
        imageUrl,
        authorId: currentUser.uid,
        authorName: userProfile.displayName,
        authorEmoji: userProfile.avatarEmoji || '💕',
        authorPhoto: userProfile.photoURL || null,
        likes: [],
        createdAt: serverTimestamp(),
      });
      setNewText('');
      setNewImage(null);
      setNewImagePreview(null);
      setShowCreate(false);
    } catch (err) {
      alert('โพสไม่สำเร็จ: ' + err.message);
    }
    setPosting(false);
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8f5f7', paddingBottom: 80 }}>
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">ฟีด</h1>
            <p className="text-sm text-slate-400 mt-0.5">โพสของคุณและเพื่อน</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm text-white"
            style={{ background: 'linear-gradient(135deg,#f43f5e,#a855f7)', boxShadow: '0 4px 16px rgba(244,63,94,0.25)' }}>
            + โพส
          </button>
        </div>

        {/* Create Post Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
            <div className="w-full max-w-lg rounded-t-3xl md:rounded-3xl p-5"
              style={{ background: 'white', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">สร้างโพสใหม่</h3>
                <button onClick={() => setShowCreate(false)} className="p-2 rounded-full text-slate-400 hover:bg-slate-100">
                  <FiX size={18} />
                </button>
              </div>
              <form onSubmit={handlePost}>
                <div className="flex gap-3 mb-4">
                  <Avatar user={userProfile} size={44} />
                  <textarea
                    value={newText}
                    onChange={e => setNewText(e.target.value)}
                    placeholder={`${userProfile?.displayName || 'คุณ'} กำลังคิดอะไรอยู่?`}
                    className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                    style={{ background: '#f8f5f7', border: '1.5px solid #f0eaf2', color: '#1f2937', minHeight: 100 }}
                    maxLength={1000}
                    autoFocus
                  />
                </div>
                {newImagePreview && (
                  <div className="relative mb-4 rounded-2xl overflow-hidden">
                    <img src={newImagePreview} alt="" className="w-full object-cover max-h-60" />
                    <button type="button" onClick={() => { setNewImage(null); setNewImagePreview(null); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center">
                      <FiX size={14} />
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors">
                    <FiImage size={16} /> รูปภาพ
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  <button type="submit" disabled={(!newText.trim() && !newImage) || posting}
                    className="px-5 py-2.5 rounded-2xl font-bold text-sm text-white transition-all"
                    style={{
                      background: (!newText.trim() && !newImage) || posting
                        ? '#e5e7eb'
                        : 'linear-gradient(135deg,#f43f5e,#a855f7)',
                    }}>
                    {posting ? 'กำลังโพส...' : 'โพสเลย'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-rose-200 border-t-rose-400 rounded-full animate-spin-slow" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📝</div>
            <p className="font-bold text-slate-700 mb-1">ยังไม่มีโพส</p>
            <p className="text-sm text-slate-400 mb-5">เพิ่มเพื่อนเพื่อดูโพสของพวกเขา<br/>หรือสร้างโพสแรกของคุณ</p>
            <button onClick={() => setShowCreate(true)}
              className="px-5 py-3 rounded-2xl font-bold text-sm text-white"
              style={{ background: 'linear-gradient(135deg,#f43f5e,#a855f7)' }}>
              สร้างโพสแรก
            </button>
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
