import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  doc, getDoc, collection, query, where, onSnapshot, updateDoc,
  arrayUnion, arrayRemove, addDoc, serverTimestamp, deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { FiMessageCircle, FiArrowLeft, FiUserPlus, FiUserCheck, FiHeart, FiGrid, FiX } from 'react-icons/fi';

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
  const [liking, setLiking] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const liked = post.likes?.includes(currentUser?.uid);
  const likeCount = post.likes?.length || 0;
  const isOwn = post.authorId === currentUser?.uid;

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
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 560, maxHeight: '90vh', borderRadius: '18px 18px 0 0', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#dbdbdb', margin: '10px auto 0' }} />
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

export default function ViewProfile() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile, getFriendStatus, sendFriendRequest } = useAuth();
  const [profile, setProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState('none');
  const [adding, setAdding] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const isOwn = currentUser?.uid === uid;
  const canSeePosts = isOwn || friendStatus === 'friends';

  const days = profile?.partnerId && profile?.relationshipStart
    ? Math.floor((Date.now() - new Date(profile.relationshipStart)) / 86400000) : null;
  const hasPartner = !!profile?.partnerId && days !== null && days >= 0;

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

  useEffect(() => {
    if (!canSeePosts) return;
    const q = query(collection(db, 'posts'), where('authorId', '==', uid));
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setPosts(data);
    });
  }, [uid, canSeePosts]);

  async function handleAdd() {
    if (!profile) return;
    setAdding(true);
    await sendFriendRequest(profile);
    setFriendStatus('sent');
    setAdding(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', paddingBottom: 80 }}>
      <Navbar />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #dbdbdb', borderTopColor: '#111', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : !profile ? (
        <div style={{ textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>😕</div>
          <p style={{ fontWeight: 700, color: '#111', marginBottom: 8 }}>ไม่พบโปรไฟล์</p>
          <button onClick={() => navigate(-1)} style={{ background: 'linear-gradient(135deg,#f43f5e,#a855f7)', color: 'white', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>กลับ</button>
        </div>
      ) : (
        <>
          {/* IG profile header */}
          <div style={{ background: '#fff', borderBottom: '1px solid #dbdbdb' }}>
            <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 0' }}>

              {/* Back button */}
              <button onClick={() => navigate(-1)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#111', marginBottom: 16, padding: 0, fontSize: '0.9rem', fontWeight: 600 }}>
                <FiArrowLeft size={20} /> กลับ
              </button>

              {/* Avatar + stats */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16 }}>
                <div style={{ flexShrink: 0 }}>
                  <AvatarImg user={profile} size={86} ring={hasPartner} />
                </div>
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
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {partnerProfile.photoURL
                          ? <img src={partnerProfile.photoURL} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '1rem' }}>{partnerProfile.avatarEmoji || '💕'}</span>
                        }
                      </div>
                      <div style={{ fontSize: '0.73rem', color: '#e8637a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{partnerProfile.displayName}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Name + bio */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontWeight: 700, color: '#111', fontSize: '0.95rem', marginBottom: 2 }}>{profile.displayName}</p>
                {profile.bio && <p style={{ color: '#111', fontSize: '0.88rem', lineHeight: 1.5 }}>{profile.bio}</p>}
              </div>

              {/* Action buttons */}
              {!isOwn && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {friendStatus === 'friends' && (
                    <Link to={`/messages/${uid}`}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 8, border: '1px solid #dbdbdb', background: '#fff', fontWeight: 700, fontSize: '0.88rem', color: '#111', textDecoration: 'none' }}>
                      <FiMessageCircle size={16} /> ส่งข้อความ
                    </Link>
                  )}
                  {friendStatus === 'none' && (
                    <button onClick={handleAdd} disabled={adding}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 8, border: 'none', background: '#e8637a', color: 'white', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>
                      {adding
                        ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
                        : <><FiUserPlus size={15} /> เพิ่มเพื่อน</>}
                    </button>
                  )}
                  {friendStatus === 'sent' && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: 8, border: '1px solid #dbdbdb', background: '#fff', fontWeight: 700, fontSize: '0.88rem', color: '#8e8e8e' }}>
                      ส่งคำขอแล้ว
                    </div>
                  )}
                  {friendStatus === 'received' && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 8, border: 'none', background: '#22c55e', color: 'white', fontWeight: 700, fontSize: '0.88rem' }}>
                      <FiUserCheck size={15} /> รับในหน้าคนรู้จัก
                    </div>
                  )}
                  {friendStatus === 'friends' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #dbdbdb', background: '#fff', fontWeight: 700, fontSize: '0.85rem', color: '#22c55e', flexShrink: 0 }}>
                      <FiUserCheck size={14} /> เพื่อน
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Grid tab */}
            <div style={{ borderTop: '1px solid #dbdbdb', display: 'flex', justifyContent: 'center', padding: '10px 0 0', maxWidth: 600, margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 16px 10px', borderTop: '2px solid #111' }}>
                <FiGrid size={14} strokeWidth={2.5} color="#111" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#111' }}>โพส</span>
              </div>
            </div>
          </div>

          {/* Post grid */}
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            {canSeePosts ? (
              posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 12 }}>✍️</div>
                  <p style={{ color: '#8e8e8e', fontSize: '0.88rem' }}>ยังไม่มีโพส</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, paddingTop: 2 }}>
                  {posts.map(post => (
                    <button key={post.id} onClick={() => setSelectedPost(post)}
                      style={{ aspectRatio: '1', background: '#efefef', border: 'none', padding: 0, cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
                      {post.imageUrl
                        ? <img src={post.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, background: '#f9f9f9' }}>
                            <p style={{ fontSize: '0.7rem', color: '#6b7280', textAlign: 'center', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                              {post.text}
                            </p>
                          </div>
                      }
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderTop: '1px solid #efefef' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔒</div>
                <p style={{ fontWeight: 700, color: '#111', marginBottom: 4 }}>โพสของ {profile.displayName}</p>
                <p style={{ color: '#8e8e8e', fontSize: '0.85rem' }}>เพิ่มเป็นเพื่อนเพื่อดูโพส</p>
              </div>
            )}
          </div>
        </>
      )}

      {selectedPost && userProfile && (
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
