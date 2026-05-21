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
import { FiHeart, FiMessageCircle, FiImage, FiSend, FiEdit3 } from 'react-icons/fi';

/* ── Story-ring avatar ── */
function Avatar({ user, size = 32, ring = false }) {
  const inner = user?.photoURL
    ? <img src={user.photoURL} alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%',
          border: ring ? '2.5px solid #fff' : 'none' }} />
    : <div style={{ width: '100%', height: '100%', borderRadius: '50%',
        background: 'linear-gradient(135deg,#f43f5e,#a855f7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.4, border: ring ? '2.5px solid #fff' : 'none' }}>
        {user?.avatarEmoji || '💕'}
      </div>;
  if (!ring) return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
      {inner}
    </div>
  );
  return (
    <div style={{ width: size + 6, height: size + 6, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', padding: 2.5 }}>
      {inner}
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

/* ── IG-style comment section ── */
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
    <div style={{ borderTop: '1px solid #efefef', padding: '10px 14px 14px' }}>
      {comments.map(c => (
        <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
          {c.authorPhoto
            ? <img src={c.authorPhoto} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#f43f5e,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', color: 'white', flexShrink: 0 }}>{c.authorEmoji}</div>
          }
          <p style={{ fontSize: '0.86rem', color: '#111', lineHeight: 1.45, flex: 1 }}>
            <strong>{c.authorName}</strong>{' '}{c.text}
          </p>
        </div>
      ))}
      <form onSubmit={send} style={{ display: 'flex', gap: 8, alignItems: 'center',
        borderTop: comments.length ? '1px solid #efefef' : 'none',
        paddingTop: comments.length ? 8 : 0, marginTop: comments.length ? 4 : 0 }}>
        <Avatar user={userProfile} size={26} />
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="เพิ่มความคิดเห็น..."
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '0.88rem', color: '#111' }}
          maxLength={500}
        />
        {text.trim() && (
          <button type="submit" disabled={sending}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', color: '#e8637a' }}>
            โพส
          </button>
        )}
      </form>
    </div>
  );
}

/* ── IG-style Post Card ── */
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
    <div style={{ background: '#fff', borderBottom: '1px solid #efefef' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', gap: 10 }}>
        <Link to={`/profile/${post.authorId}`} style={{ flexShrink: 0 }}>
          <Avatar user={{ photoURL: post.authorPhoto, avatarEmoji: post.authorEmoji }} size={34} ring />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link to={`/profile/${post.authorId}`} style={{ textDecoration: 'none' }}>
            <p style={{ fontWeight: 700, color: '#111', fontSize: '0.88rem', lineHeight: 1.2 }}>{post.authorName}</p>
          </Link>
          <p style={{ fontSize: '0.7rem', color: '#8e8e8e' }}>{timeAgo(post.createdAt)}</p>
        </div>
        {isOwn && (
          <button onClick={deletePost}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e8e', fontSize: '1.3rem', padding: '0 4px', letterSpacing: 2, lineHeight: 1 }}>
            ···
          </button>
        )}
      </div>

      {/* Image — full width, double-tap to like */}
      {post.imageUrl && (
        <img src={post.imageUrl}
          onDoubleClick={toggleLike}
          style={{ width: '100%', display: 'block', maxHeight: 500, objectFit: 'cover' }}
        />
      )}

      {/* Actions */}
      <div style={{ padding: '8px 12px 2px' }}>
        <div style={{ display: 'flex', gap: 14, marginBottom: 6, alignItems: 'center' }}>
          <button onClick={toggleLike} disabled={liking}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <FiHeart
              size={24}
              fill={liked ? '#ed4956' : 'none'}
              color={liked ? '#ed4956' : '#111'}
              strokeWidth={liked ? 0 : 2}
              style={{ transition: 'transform 0.1s', transform: liked ? 'scale(1.12)' : 'scale(1)' }}
            />
          </button>
          <button onClick={() => setShowComments(p => !p)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <FiMessageCircle size={23} color={showComments ? '#e8637a' : '#111'} strokeWidth={2} />
          </button>
        </div>

        {likeCount > 0 && (
          <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111', marginBottom: 4 }}>
            {likeCount.toLocaleString()} ถูกใจ
          </p>
        )}

        {post.text && (
          <p style={{ fontSize: '0.88rem', color: '#111', lineHeight: 1.5, marginBottom: 4 }}>
            <strong>{post.authorName}</strong>{' '}{post.text}
          </p>
        )}

        {commentCount > 0 && !showComments && (
          <button onClick={() => setShowComments(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#8e8e8e', fontSize: '0.84rem', display: 'block', marginBottom: 2 }}>
            ดูความคิดเห็นทั้งหมด {commentCount} รายการ
          </button>
        )}
        <p style={{ fontSize: '0.7rem', color: '#c7c7c7', marginTop: 2, marginBottom: 6 }}>
          {timeAgo(post.createdAt)}
        </p>
      </div>

      {showComments && (
        <CommentSection postId={post.id} currentUser={currentUser} userProfile={userProfile} />
      )}
    </div>
  );
}

/* ── Create Post ── */
function CreatePostBox({ currentUser, userProfile }) {
  const [text, setNewText] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const [focused, setFocused] = useState(false);
  const fileRef = useRef(null);

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
    <div style={{ background: '#fff', borderBottom: '1px solid #efefef', padding: '12px 14px' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Avatar user={userProfile} size={36} ring />
        <div style={{ flex: 1 }}>
          <textarea
            value={text}
            onChange={e => setNewText(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="แชร์ความรู้สึกหรือรูปภาพ..."
            rows={expanded ? 3 : 1}
            style={{
              width: '100%', background: 'none', border: 'none', outline: 'none',
              fontSize: '0.92rem', color: '#111', resize: 'none',
              lineHeight: 1.55, padding: '4px 0',
              minHeight: expanded ? 64 : 32,
            }}
            maxLength={1000}
          />

          {preview && (
            <div style={{ position: 'relative', marginTop: 8, borderRadius: 10, overflow: 'hidden', border: '1px solid #efefef' }}>
              <img src={preview} style={{ width: '100%', objectFit: 'cover', maxHeight: 200, display: 'block' }} />
              <button type="button" onClick={removeImage}
                style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ×
              </button>
            </div>
          )}

          {expanded && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, borderTop: '1px solid #efefef', paddingTop: 10 }}>
              <button type="button" onClick={() => fileRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e8e', fontSize: '0.84rem', fontWeight: 600 }}>
                <FiImage size={18} /> รูปภาพ
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
              <div style={{ display: 'flex', gap: 8 }}>
                {(text || preview) && (
                  <button type="button" onClick={() => { setNewText(''); removeImage(); setFocused(false); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e8e', fontSize: '0.84rem', fontWeight: 600 }}>
                    ยกเลิก
                  </button>
                )}
                <button onClick={handlePost} disabled={!canPost}
                  style={{
                    background: canPost ? 'linear-gradient(135deg,#f43f5e,#a855f7)' : '#efefef',
                    color: canPost ? 'white' : '#8e8e8e',
                    border: 'none', cursor: canPost ? 'pointer' : 'default',
                    borderRadius: 20, padding: '6px 18px',
                    fontWeight: 700, fontSize: '0.84rem',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                  {posting
                    ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
                    : 'โพส'}
                </button>
              </div>
            </div>
          )}
        </div>
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
    <div style={{ minHeight: '100vh', background: '#fafafa', paddingBottom: 80 }}>
      <Navbar />

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30"
        style={{ background: '#fff', borderBottom: '1px solid #dbdbdb', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 800, fontSize: '1.4rem', fontFamily: "'Nunito',sans-serif", color: '#111' }}>MissU</span>
        <FiEdit3 size={22} color="#111" strokeWidth={1.8} />
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Create Post */}
        {userProfile && (
          <CreatePostBox currentUser={currentUser} userProfile={userProfile} />
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #dbdbdb', borderTopColor: '#111', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderBottom: '1px solid #efefef' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>✨</div>
            <p style={{ fontWeight: 700, color: '#111', fontSize: '1rem', marginBottom: 6 }}>ยังไม่มีโพส</p>
            <p style={{ color: '#8e8e8e', fontSize: '0.88rem' }}>เพิ่มเพื่อนแล้วโพสอะไรสักอย่าง</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} currentUser={currentUser} userProfile={userProfile} />
          ))
        )}

      </div>
    </div>
  );
}
