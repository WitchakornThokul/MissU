import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ref, push, onValue, query, limitToLast, set, onDisconnect } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { rtdb, db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { FiArrowLeft, FiSend, FiImage, FiHeart, FiMessageCircle } from 'react-icons/fi';
import { useDialog } from '../components/Dialog';

const MAX_MSG_LEN = 2000;

function Avatar({ user, size = 32 }) {
  if (user?.photoURL || user?.senderPhoto) return (
    <img src={user.photoURL || user.senderPhoto} alt=""
      className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size }} />
  );
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 text-white"
      style={{ width: size, height: size, background: 'linear-gradient(135deg,#f43f5e,#a855f7)', fontSize: size * 0.42 }}>
      {user?.avatarEmoji || user?.senderEmoji || '?'}
    </div>
  );
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(ts) {
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d === 0) return 'วันนี้';
  if (d === 1) return 'เมื่อวาน';
  return new Date(ts).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });
}

function Bubble({ msg, isOwn, showAvatar, showTime }) {
  const ownRadius = '18px 4px 18px 18px';
  const otherRadius = '4px 18px 18px 18px';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      alignItems: 'flex-end',
      gap: 6,
      marginBottom: 2,
    }}>
      {!isOwn && (
        <div style={{ width: 28, flexShrink: 0, alignSelf: 'flex-end' }}>
          {showAvatar && <Avatar user={msg} size={28} />}
        </div>
      )}
      <div style={{
        maxWidth: '72%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOwn ? 'flex-end' : 'flex-start',
      }}>
        {msg.type === 'heart' ? (
          <span style={{ fontSize: 28, lineHeight: 1, padding: '4px 4px' }}>
            <FiHeart size={26} fill="#f43f5e" color="#f43f5e" />
          </span>
        ) : msg.type === 'image' ? (
          <img src={msg.imageUrl} alt=""
            onClick={() => window.open(msg.imageUrl, '_blank')}
            style={{
              maxWidth: 220, cursor: 'pointer', display: 'block',
              borderRadius: isOwn ? ownRadius : otherRadius,
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            }}
          />
        ) : (
          <div style={{
            padding: '10px 14px',
            borderRadius: isOwn ? ownRadius : otherRadius,
            background: isOwn ? 'linear-gradient(135deg,#f43f5e,#a855f7)' : '#f0f0f0',
            color: isOwn ? '#fff' : '#1a2a35',
            fontSize: '0.9rem',
            lineHeight: 1.45,
            wordBreak: 'break-word',
            boxShadow: isOwn ? '0 2px 10px rgba(244,63,94,0.28)' : 'none',
          }}>
            {msg.text}
          </div>
        )}
        {showTime && (
          <span style={{ fontSize: '0.62rem', color: '#9ca3af', marginTop: 3, paddingLeft: 2, paddingRight: 2 }}>
            {fmtTime(msg.timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}

async function uploadToImgBB(file) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64 }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Upload failed');
  return json.url;
}

export default function FriendChat() {
  const { uid: friendUid } = useParams();
  const { currentUser, userProfile } = useAuth();
  const { alert } = useDialog();
  const navigate = useNavigate();
  const [friendProfile, setFriendProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [uploadingImg, setUploadingImg] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const prevCount = useRef(0);

  const chatId = currentUser && friendUid
    ? [currentUser.uid, friendUid].sort().join('_') : null;

  // Load friend profile
  useEffect(() => {
    if (!friendUid) return;
    getDoc(doc(db, 'users', friendUid)).then(snap => {
      if (snap.exists()) setFriendProfile(snap.data());
    });
  }, [friendUid]);

  // Viewport/keyboard fix
  useEffect(() => {
    const update = () => {
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }));
    };
    window.visualViewport?.addEventListener('resize', update);
    return () => window.visualViewport?.removeEventListener('resize', update);
  }, []);

  // Online presence
  useEffect(() => {
    if (!currentUser) return;
    const myRef = ref(rtdb, `presence/${currentUser.uid}`);
    set(myRef, { online: true, lastSeen: Date.now() }).catch(() => {});
    onDisconnect(myRef).set({ online: false, lastSeen: Date.now() });
    return () => { set(myRef, { online: false, lastSeen: Date.now() }).catch(() => {}); };
  }, [currentUser]);

  // Messages listener
  useEffect(() => {
    if (!chatId) { setLoadingMsgs(false); return; }
    const q = query(ref(rtdb, `chats/${chatId}/messages`), limitToLast(100));
    const unsub = onValue(q, snap => {
      const data = snap.val();
      const msgs = data
        ? Object.entries(data).map(([id, m]) => ({ id, ...m })).sort((a, b) => a.timestamp - b.timestamp)
        : [];
      setMessages(msgs);
      setLoadingMsgs(false);
    });
    return () => unsub();
  }, [chatId]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Mark as read when opening chat
  useEffect(() => {
    if (!chatId) return;
    localStorage.setItem(`missu_lastRead_${chatId}`, Date.now().toString());
  }, [chatId]);

  // Scroll to bottom + push notification for new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: prevCount.current === 0 ? 'auto' : 'smooth' });

    if (messages.length && currentUser) {
      const last = messages[messages.length - 1];
      const isNew = Date.now() - last.timestamp < 8000;
      const fromFriend = last.senderId !== currentUser.uid;
      if (isNew && fromFriend && messages.length > prevCount.current && prevCount.current > 0) {
        // Mark as read (user is viewing)
        if (chatId) localStorage.setItem(`missu_lastRead_${chatId}`, Date.now().toString());
        if (Notification.permission === 'granted') {
          const body = last.type === 'heart' ? 'ส่งความรักมาให้'
            : last.type === 'image' ? 'ส่งรูปมาให้'
            : last.text;
          new Notification(last.senderName || friendProfile?.displayName || 'เพื่อน', {
            body, icon: '/favicon.ico',
          });
        }
      }
    }

    prevCount.current = messages.length;
  }, [messages]);

  async function handleSend(e) {
    e?.preventDefault();
    if (!text.trim() || !chatId || sending) return;
    setSending(true);
    try {
      await push(ref(rtdb, `chats/${chatId}/messages`), {
        text: text.trim().slice(0, MAX_MSG_LEN),
        senderId: currentUser.uid,
        senderName: userProfile.displayName,
        senderEmoji: userProfile.avatarEmoji || '',
        senderPhoto: userProfile.photoURL || null,
        timestamp: Date.now(),
        type: 'text',
      });
      setText('');
      if (inputRef.current) inputRef.current.style.height = 'auto';
      inputRef.current?.focus();
    } catch (err) { console.error(err); }
    setSending(false);
  }

  async function sendHeart() {
    if (!chatId) return;
    await push(ref(rtdb, `chats/${chatId}/messages`), {
      text: '', senderId: currentUser.uid,
      senderName: userProfile.displayName,
      senderEmoji: userProfile.avatarEmoji || '',
      senderPhoto: userProfile.photoURL || null,
      timestamp: Date.now(), type: 'heart',
    });
  }

  async function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file || !chatId) return;
    setUploadingImg(true);
    try {
      const imageUrl = await uploadToImgBB(file);
      await push(ref(rtdb, `chats/${chatId}/messages`), {
        text: '', imageUrl, senderId: currentUser.uid,
        senderName: userProfile.displayName,
        senderEmoji: userProfile.avatarEmoji || '',
        senderPhoto: userProfile.photoURL || null,
        timestamp: Date.now(), type: 'image',
      });
    } catch (err) { alert('อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่', { title: 'เกิดข้อผิดพลาด' }); }
    finally {
      setUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  // Build display groups
  const groups = [];
  let lastDate = null;
  messages.forEach((msg, i) => {
    const dateLabel = fmtDate(msg.timestamp);
    if (dateLabel !== lastDate) {
      groups.push({ type: 'date', label: dateLabel, key: `d-${i}` });
      lastDate = dateLabel;
    }
    const isOwn = msg.senderId === currentUser.uid;
    const next = messages[i + 1];
    const isLastInGroup = !next || next.senderId !== msg.senderId;
    groups.push({ type: 'msg', msg, isOwn, showAvatar: !isOwn && isLastInGroup, showTime: isLastInGroup, key: msg.id });
  });

  return (
    <div className="lg:left-[260px]" style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        flexShrink: 0,
        minHeight: 60,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 16px',
        paddingTop: 'env(safe-area-inset-top)',
        background: '#fff', borderBottom: '1px solid #f0f0f0',
        boxShadow: '0 1px 0 #f0f0f0',
        zIndex: 10,
      }}>
        <button onClick={() => navigate(-1)} style={{
          width: 36, height: 36, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#374151', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
        }}>
          <FiArrowLeft size={20} />
        </button>

        {friendProfile ? (
          <Link to={`/profile/${friendUid}`} style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10,
            textDecoration: 'none', minWidth: 0,
          }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Avatar user={friendProfile} size={38} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {friendProfile.displayName}
              </p>
              {friendProfile.bio && (
                <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {friendProfile.bio}
                </p>
              )}
            </div>
          </Link>
        ) : (
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>กำลังโหลด...</p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 4px', overscrollBehavior: 'contain', minHeight: 0 }}>
        {loadingMsgs ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 64 }}>
            <div className="w-7 h-7 border-2 border-rose-200 border-t-rose-400 rounded-full animate-spin-slow" />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px', minHeight: 300 }}>
            <FiMessageCircle size={56} color="#fda4af" style={{ marginBottom: 14 }} />
            <p style={{ fontWeight: 700, color: '#374151', fontSize: '1rem', marginBottom: 6 }}>เริ่มบทสนทนา</p>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>ส่งข้อความหาเพื่อนได้เลย</p>
          </div>
        ) : (
          <div>
            {groups.map(item => {
              if (item.type === 'date') return (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#9ca3af', background: '#f3f4f6', padding: '3px 12px', borderRadius: 99 }}>
                    {item.label}
                  </span>
                </div>
              );
              return (
                <Bubble key={item.key} msg={item.msg}
                  isOwn={item.isOwn}
                  showAvatar={item.showAvatar}
                  showTime={item.showTime} />
              );
            })}
          </div>
        )}
        <div ref={endRef} style={{ height: 6 }} />
      </div>

      {/* Input bar */}
      <div style={{
        flexShrink: 0,
        padding: '8px 12px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        background: '#fff',
        borderTop: '1px solid #f0f0f0',
        display: 'flex', alignItems: 'flex-end', gap: 8,
        zIndex: 10,
      }}>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />

        <button onClick={sendHeart}
          style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff1f3', border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e' }}
          className="active:scale-90 hover:bg-rose-100 transition-colors">
          <FiHeart size={18} />
        </button>

        <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImg}
          style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0f9ff', border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9', opacity: uploadingImg ? 0.6 : 1 }}
          className="active:scale-90 hover:bg-sky-100 transition-colors">
          {uploadingImg
            ? <div className="w-4 h-4 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin-slow" />
            : <FiImage size={18} />}
        </button>

        <div style={{
          flex: 1, display: 'flex', alignItems: 'flex-end',
          background: '#f3f4f6', borderRadius: 24,
          padding: '8px 14px', minHeight: 40,
        }}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value.slice(0, MAX_MSG_LEN))}
            onKeyDown={handleKeyDown}
            onFocus={() => setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 300)}
            placeholder="Aa"
            rows={1}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: '0.9rem', color: '#111827', resize: 'none',
              maxHeight: 100, lineHeight: '1.5',
              fontFamily: "'Nunito',sans-serif",
            }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
            }}
          />
        </div>

        <button onClick={handleSend} disabled={!text.trim() || sending}
          style={{
            width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: text.trim() ? 'pointer' : 'default',
            background: text.trim() ? 'linear-gradient(135deg,#f43f5e,#a855f7)' : '#e5e7eb',
            color: 'white', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
            boxShadow: text.trim() ? '0 2px 12px rgba(244,63,94,0.35)' : 'none',
          }}
          className="active:scale-90">
          {sending
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
            : <FiSend size={15} />}
        </button>
      </div>
    </div>
  );
}
