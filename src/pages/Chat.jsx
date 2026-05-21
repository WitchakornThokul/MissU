import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ref, push, onValue, query, limitToLast, set, onDisconnect } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { FiArrowLeft, FiSend, FiImage, FiHeart, FiMessageCircle } from 'react-icons/fi';

const IMGBB_KEY = import.meta.env.VITE_IMGBB_KEY;
const MAX_MSG_LEN = 2000;

/* ── Avatar ── */
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
function fmtLastSeen(ts) {
  if (!ts) return '';
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'เมื่อสักครู่';
  if (m < 60) return `${m} นาทีที่แล้ว`;
  if (m < 1440) return `${Math.floor(m / 60)} ชั่วโมงที่แล้ว`;
  return 'นานแล้ว';
}

/* ── Chat bubble (FB/IG style) ── */
function Bubble({ msg, isOwn, showAvatar, showTime }) {
  const ownRadius = '18px 4px 18px 18px';
  const partnerRadius = '4px 18px 18px 18px';

  return (
    <div style={{
      display: 'flex',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      alignItems: 'flex-end',
      gap: 6,
      marginBottom: 2,
    }}>
      {/* Partner avatar (reserved space even when hidden) */}
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
          <span style={{ fontSize: 28, lineHeight: 1, padding: '4px 4px' }} className="animate-heartbeat">
            <FiHeart size={26} fill="#f43f5e" color="#f43f5e" />
          </span>
        ) : msg.type === 'image' ? (
          <img
            src={msg.imageUrl} alt=""
            onClick={() => window.open(msg.imageUrl, '_blank')}
            style={{
              maxWidth: 220, cursor: 'pointer', display: 'block',
              borderRadius: isOwn ? ownRadius : partnerRadius,
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            }}
          />
        ) : (
          <div style={{
            padding: '10px 14px',
            borderRadius: isOwn ? ownRadius : partnerRadius,
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

/* ── No partner screen ── */
function NoPartner() {
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={{ height: 60, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <Link to="/dashboard" style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', textDecoration: 'none' }}>
          <FiArrowLeft size={20} />
        </Link>
        <span style={{ fontWeight: 700, color: '#374151' }}>แชท</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px' }}>
        <FiMessageCircle size={60} color="#e2e8f0" style={{ marginBottom: 16 }} />
        <h2 style={{ fontWeight: 700, color: '#374151', fontSize: '1.1rem', marginBottom: 8 }}>ยังไม่มีคู่รัก</h2>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: 24 }}>เชื่อมต่อกับคู่รักก่อนเพื่อเริ่มแชท</p>
        <Link to="/find-partner" className="btn-primary">หาคู่รัก</Link>
      </div>
    </div>
  );
}

/* ── ImgBB upload ── */
async function uploadToImgBB(file) {
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const body = new FormData();
  body.append('key', IMGBB_KEY);
  body.append('image', base64);
  const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Upload failed');
  return json.data.url;
}

export default function Chat() {
  const { currentUser, userProfile, partnerProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [partnerLastSeen, setPartnerLastSeen] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const prevCount = useRef(0);

  const chatId = currentUser && userProfile?.partnerId
    ? [currentUser.uid, userProfile.partnerId].sort().join('_') : null;
  const partnerUid = userProfile?.partnerId;

  /* ── Viewport / keyboard fix ── */
  useEffect(() => {
    const update = () => {
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }));
    };
    window.visualViewport?.addEventListener('resize', update);
    return () => window.visualViewport?.removeEventListener('resize', update);
  }, []);

  /* ── Online presence ── */
  useEffect(() => {
    if (!currentUser) return;
    const myRef = ref(rtdb, `presence/${currentUser.uid}`);
    set(myRef, { online: true, lastSeen: Date.now() }).catch(err => {
      console.error('Error setting presence:', err);
    });
    onDisconnect(myRef).set({ online: false, lastSeen: Date.now() });
    return () => {
      set(myRef, { online: false, lastSeen: Date.now() }).catch(() => {});
    };
  }, [currentUser]);

  useEffect(() => {
    if (!partnerUid) return;
    return onValue(ref(rtdb, `presence/${partnerUid}`), snap => {
      const d = snap.val();
      setPartnerOnline(d?.online === true);
      setPartnerLastSeen(d?.lastSeen || null);
    }, err => {
      console.error('Error reading partner presence:', err);
    });
  }, [partnerUid]);

  /* ── Notification permission ── */
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  /* ── Messages listener ── */
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

  /* ── Scroll to bottom on new messages ── */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: prevCount.current === 0 ? 'auto' : 'smooth' });
  }, [messages]);

  /* ── Push notification for partner messages ── */
  useEffect(() => {
    if (!messages.length || !currentUser) return;
    const last = messages[messages.length - 1];
    const isNew = Date.now() - last.timestamp < 8000;
    const fromPartner = last.senderId !== currentUser.uid;
    if (isNew && fromPartner && messages.length > prevCount.current && prevCount.current > 0) {
      if (Notification.permission === 'granted') {
        const body = last.type === 'heart' ? 'ส่งความรักมาให้'
          : last.type === 'image' ? 'ส่งรูปมาให้'
          : last.text;
        new Notification(`${last.senderName || 'คู่รัก'}`, { body, icon: '/favicon.ico' });
      }
    }
    prevCount.current = messages.length;
  }, [messages]);

  /* ── Send text ── */
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
      if (inputRef.current) { inputRef.current.style.height = 'auto'; }
      inputRef.current?.focus();
    } catch (err) { console.error(err); }
    setSending(false);
  }

  /* ── Send heart ── */
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

  /* ── Send image ── */
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
    } catch (err) { alert('อัปโหลดรูปไม่สำเร็จ: ' + err.message); }
    finally {
      setUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  if (!userProfile?.partnerId) return <NoPartner />;

  /* ── Build display groups ── */
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
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden' }}>

      {/* ── Header ── */}
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
        <Link to="/dashboard" style={{
          width: 36, height: 36, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#374151', textDecoration: 'none', flexShrink: 0,
        }} className="hover:bg-gray-100 transition-colors">
          <FiArrowLeft size={20} />
        </Link>

        {partnerProfile ? (
          <Link to={`/profile/${partnerUid}`} style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10,
            textDecoration: 'none', minWidth: 0,
          }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Avatar user={partnerProfile} size={38} />
              {partnerOnline && (
                <span style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 11, height: 11, borderRadius: '50%',
                  background: '#22c55e', border: '2px solid white',
                }} />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {partnerProfile.displayName}
              </p>
              <p style={{ fontSize: '0.7rem', fontWeight: 600, color: partnerOnline ? '#22c55e' : '#9ca3af', marginTop: 1 }}>
                {partnerOnline ? '● ออนไลน์' : partnerLastSeen ? fmtLastSeen(partnerLastSeen) : 'ออฟไลน์'}
              </p>
            </div>
          </Link>
        ) : (
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>กำลังโหลด...</p>
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 4px', overscrollBehavior: 'contain', minHeight: 0 }}>
        {loadingMsgs ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 64 }}>
            <div className="w-7 h-7 border-2 border-rose-200 border-t-rose-400 rounded-full animate-spin-slow" />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px', minHeight: 300 }}>
            <FiMessageCircle size={56} color="#fda4af" style={{ marginBottom: 14 }} className="animate-pulse-soft" />
            <p style={{ fontWeight: 700, color: '#374151', fontSize: '1rem', marginBottom: 6 }}>เริ่มบทสนทนาแรก</p>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>ส่งข้อความหรือกดหัวใจ</p>
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

      {/* ── Input bar ── */}
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

        {/* Heart */}
        <button onClick={sendHeart}
          style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff1f3', border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s', color: '#f43f5e' }}
          className="active:scale-90 hover:bg-rose-100 transition-colors">
          <FiHeart size={18} />
        </button>

        {/* Camera */}
        <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImg}
          style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0f9ff', border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9', opacity: uploadingImg ? 0.6 : 1 }}
          className="active:scale-90 hover:bg-sky-100 transition-colors">
          {uploadingImg
            ? <div className="w-4 h-4 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin-slow" />
            : <FiImage size={18} />}
        </button>

        {/* Text input */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'flex-end',
          background: '#f3f4f6', borderRadius: 24,
          padding: '8px 14px', minHeight: 40,
          border: '1.5px solid transparent',
          transition: 'border-color 0.2s',
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
          {text.length > MAX_MSG_LEN * 0.8 && (
            <span style={{ fontSize: '0.62rem', color: text.length >= MAX_MSG_LEN ? '#f43f5e' : '#9ca3af', alignSelf: 'flex-end', flexShrink: 0, paddingLeft: 4 }}>
              {text.length}/{MAX_MSG_LEN}
            </span>
          )}
        </div>

        {/* Send */}
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
