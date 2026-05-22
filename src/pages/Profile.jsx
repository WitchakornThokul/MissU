import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { useDialog } from '../components/Dialog';
import {
  collection, query, where, onSnapshot,
  addDoc, serverTimestamp, deleteDoc, updateDoc,
  arrayUnion, arrayRemove, doc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { FiHeart, FiMessageCircle, FiGrid } from 'react-icons/fi';

const EMOJIS = ['💕','🌹','🦋','🌸','💖','🍓','🌺','🐱','🐰','🌙','🎀','🍭','🌈','✨','🦄','🍒','🎸','🎹','🌊','🌿'];

function AvatarImg({ user, size = 40, ring = false }) {
  const inner = user?.photoURL
    ? <img src={user.photoURL} alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', border: ring ? '3px solid #fff' : 'none' }} />
    : <div style={{ width: '100%', height: '100%', borderRadius: '50%',
        background: 'linear-gradient(135deg,#f43f5e,#a855f7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.42, border: ring ? '3px solid #fff' : 'none' }}>
        {user?.avatarEmoji || '💕'}
      </div>;
  if (!ring) return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>{inner}</div>
  );
  return (
    <div style={{ width: size + 8, height: size + 8, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', padding: 3 }}>
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
        {userProfile?.photoURL
          ? <img src={userProfile.photoURL} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#f43f5e,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'white', flexShrink: 0 }}>{userProfile?.avatarEmoji}</div>
        }
        <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
          placeholder="เพิ่มความคิดเห็น..."
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '0.88rem', color: '#111' }}
          maxLength={500} />
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

function PostModal({ post, currentUser, userProfile, onClose }) {
  const { deleteConfirm } = useDialog();
  const [liking, setLiking] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(true);
  const liked = post.likes?.includes(currentUser?.uid);
  const likeCount = post.likes?.length || 0;

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
    const ok = await deleteConfirm('โพสนี้จะถูกลบถาวรและไม่สามารถกู้คืนได้');
    if (!ok) return;
    await deleteDoc(doc(db, 'posts', post.id));
    onClose();
  }

  const isOwn = post.authorId === currentUser?.uid;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}>
      <div
        style={{ background: '#fff', width: '100%', maxWidth: 560, maxHeight: '90vh', borderRadius: '18px 18px 0 0', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        {/* Handle bar */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#dbdbdb', margin: '10px auto 0' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', gap: 10 }}>
          <AvatarImg user={{ photoURL: post.authorPhoto, avatarEmoji: post.authorEmoji }} size={34} ring />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, color: '#111', fontSize: '0.88rem' }}>{post.authorName}</p>
            <p style={{ fontSize: '0.7rem', color: '#8e8e8e' }}>{timeAgo(post.createdAt)}</p>
          </div>
          {isOwn && (
            <button onClick={deletePost} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e8e', fontSize: '1.3rem', padding: '0 4px', letterSpacing: 2 }}>···</button>
          )}
        </div>

        {post.imageUrl && (
          <img src={post.imageUrl} onDoubleClick={toggleLike} style={{ width: '100%', display: 'block', maxHeight: 420, objectFit: 'cover' }} />
        )}

        <div style={{ padding: '8px 14px 4px' }}>
          <div style={{ display: 'flex', gap: 14, marginBottom: 6 }}>
            <button onClick={toggleLike} disabled={liking} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <FiHeart size={24} fill={liked ? '#ed4956' : 'none'} color={liked ? '#ed4956' : '#111'} strokeWidth={liked ? 0 : 2} />
            </button>
            <button onClick={() => setShowComments(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <FiMessageCircle size={23} color={showComments ? '#e8637a' : '#111'} strokeWidth={2} />
            </button>
          </div>
          {likeCount > 0 && <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111', marginBottom: 4 }}>{likeCount.toLocaleString()} ถูกใจ</p>}
          {post.text && <p style={{ fontSize: '0.88rem', color: '#111', lineHeight: 1.5, marginBottom: 6 }}><strong>{post.authorName}</strong>{' '}{post.text}</p>}
        </div>

        {showComments && <CommentSection postId={post.id} currentUser={currentUser} userProfile={userProfile} />}
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}

const CameraIcon = () => (
  <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);

export default function Profile() {
  const { currentUser, userProfile, partnerProfile, updateUserProfile, updateLocalProfile, uploadProfilePhoto, uploadLocalPhoto, isLocal } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const fileRef = useRef();

  const days = userProfile?.relationshipStart
    ? Math.floor((Date.now() - new Date(userProfile.relationshipStart)) / 86400000) : null;

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'posts'), where('authorId', '==', currentUser.uid));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setPosts(data);
    });
  }, [currentUser]);

  function startEdit() {
    setForm({ displayName: userProfile?.displayName || '', bio: userProfile?.bio || '', avatarEmoji: userProfile?.avatarEmoji || '💕', relationshipStart: userProfile?.relationshipStart || '' });
    setEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (isLocal) updateLocalProfile(form);
    else await updateUserProfile(form);
    setSaved(true); setEditing(false);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      if (isLocal) await uploadLocalPhoto(file);
      else await uploadProfilePhoto(file);
    } catch (err) { console.error(err); }
    setUploading(false);
  }

  const hasPartner = !!userProfile?.partnerId && days !== null && days >= 0;

  return (
    <div className="lg:ml-[260px]" style={{ minHeight: '100vh', background: '#fafafa', paddingBottom: 80 }}>
      <Navbar />

      {/* IG profile header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #dbdbdb' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px 20px' }}>

          {/* Avatar + stats row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16 }}>
            {/* Avatar with camera */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <AvatarImg user={userProfile} size={86} ring={hasPartner} />
              <button onClick={() => fileRef.current?.click()}
                style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: '#fff', border: '1.5px solid #dbdbdb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111' }}>
                {uploading
                  ? <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #dbdbdb', borderTopColor: '#111', animation: 'spin 0.8s linear infinite' }} />
                  : <CameraIcon />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
            </div>

            {/* Stats */}
            <div style={{ flex: 1, display: 'flex', gap: 0, textAlign: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111' }}>{posts.length}</div>
                <div style={{ fontSize: '0.78rem', color: '#8e8e8e' }}>โพส</div>
              </div>
              {hasPartner && (
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111' }}>{days}</div>
                  <div style={{ fontSize: '0.78rem', color: '#8e8e8e' }}>วันด้วยกัน</div>
                </div>
              )}
              {partnerProfile && hasPartner && (
                <div style={{ flex: 1 }}>
                  <Link to={`/profile/${userProfile.partnerId}`} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      {partnerProfile.photoURL
                        ? <img src={partnerProfile.photoURL} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '1rem' }}>{partnerProfile.avatarEmoji || '💕'}</span>
                      }
                    </div>
                    <div style={{ fontSize: '0.73rem', color: '#e8637a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{partnerProfile.displayName}</div>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Name + bio */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontWeight: 700, color: '#111', fontSize: '0.95rem', marginBottom: 2 }}>{userProfile?.displayName}</p>
            {userProfile?.bio && <p style={{ color: '#111', fontSize: '0.88rem', lineHeight: 1.5 }}>{userProfile.bio}</p>}
            {isLocal && <span style={{ fontSize: '0.75rem', color: '#8e8e8e', background: '#efefef', borderRadius: 6, padding: '2px 8px', marginTop: 4, display: 'inline-block' }}>Local Mode</span>}
            {saved && <span style={{ fontSize: '0.75rem', color: '#22c55e', background: '#f0fdf4', borderRadius: 6, padding: '2px 8px', marginTop: 4, display: 'inline-block' }}>บันทึกแล้ว</span>}
          </div>

          {/* Action button */}
          {!editing ? (
            <button onClick={startEdit}
              style={{ width: '100%', padding: '7px 16px', borderRadius: 8, border: '1px solid #dbdbdb', background: '#fff', fontWeight: 700, fontSize: '0.88rem', color: '#111', cursor: 'pointer' }}>
              แก้ไขโปรไฟล์
            </button>
          ) : (
            <form onSubmit={handleSave} style={{ marginTop: 4 }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#8e8e8e', display: 'block', marginBottom: 4 }}>เลือก Emoji</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {EMOJIS.map(e => (
                    <button key={e} type="button" onClick={() => setForm(f => ({ ...f, avatarEmoji: e }))}
                      style={{ fontSize: '1.2rem', padding: '4px 6px', borderRadius: 8, border: form.avatarEmoji === e ? '2px solid #e8637a' : '2px solid transparent', background: form.avatarEmoji === e ? '#fff1f3' : 'none', cursor: 'pointer', opacity: form.avatarEmoji === e ? 1 : 0.5 }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#8e8e8e', display: 'block', marginBottom: 4 }}>ชื่อเล่น</label>
                <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} required maxLength={50}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #dbdbdb', outline: 'none', fontSize: '0.9rem', color: '#111' }} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#8e8e8e', display: 'block', marginBottom: 4 }}>Bio</label>
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="เขียนอะไรสักอย่าง..." maxLength={200} rows={3}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #dbdbdb', outline: 'none', fontSize: '0.9rem', color: '#111', resize: 'none' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#8e8e8e', display: 'block', marginBottom: 4 }}>วันที่เริ่มคบกัน</label>
                <input type="date" value={form.relationshipStart} onChange={e => setForm(f => ({ ...f, relationshipStart: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #dbdbdb', outline: 'none', fontSize: '0.9rem', color: '#111' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit"
                  style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#f43f5e,#a855f7)', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
                  บันทึก
                </button>
                <button type="button" onClick={() => setEditing(false)}
                  style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid #dbdbdb', background: '#fff', fontWeight: 700, fontSize: '0.9rem', color: '#111', cursor: 'pointer' }}>
                  ยกเลิก
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Grid/posts tab divider */}
        <div style={{ borderTop: '1px solid #dbdbdb', display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 16px 10px', borderTop: '2px solid #111' }}>
            <FiGrid size={14} strokeWidth={2.5} color="#111" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#111' }}>โพส</span>
          </div>
        </div>
      </div>

      {/* Post grid */}
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fafafa' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>✍️</div>
            <p style={{ fontWeight: 700, color: '#111', fontSize: '0.95rem', marginBottom: 4 }}>ยังไม่มีโพส</p>
            <p style={{ color: '#8e8e8e', fontSize: '0.85rem' }}>แชร์ภาพหรือความรู้สึกในหน้าฟีดได้เลย</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, paddingTop: 2 }}>
            {posts.map(post => (
              <button key={post.id} onClick={() => setSelectedPost(post)}
                style={{ aspectRatio: '1', background: '#efefef', border: 'none', padding: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
                {post.imageUrl
                  ? <img src={post.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 8, background: '#f9f9f9' }}>
                      <p style={{ fontSize: '0.7rem', color: '#6b7280', textAlign: 'center', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                        {post.text}
                      </p>
                    </div>
                }
                {/* Like count overlay */}
                {(post.likes?.length > 0) && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(0,0,0,0.45)', borderRadius: 8, padding: '4px 10px' }}>
                      <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiHeart size={13} fill="white" color="white" /> {post.likes.length}
                      </span>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Post modal */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          currentUser={currentUser}
          userProfile={userProfile}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
}
