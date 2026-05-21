import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ref, push, onValue, query, limitToLast, set, onDisconnect } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

const IMGBB_KEY = import.meta.env.VITE_IMGBB_KEY;

/* ── Icons ── */
const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);
const SendIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);
const HeartIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);
const CameraIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

/* ── Avatar ── */
function Avatar({ user, size = 36 }) {
  if (user?.photoURL || user?.senderPhoto) return (
    <img src={user.photoURL || user.senderPhoto} alt=""
      className="rounded-full object-cover flex-shrink-0 ring-2 ring-white"
      style={{width:size, height:size}}/>
  );
  return (
    <div className="rounded-full flex items-center justify-center text-sm flex-shrink-0 ring-2 ring-white"
      style={{width:size, height:size, background:'linear-gradient(135deg,#f43f5e,#a855f7)', fontSize:size*0.4}}>
      {user?.avatarEmoji || user?.senderEmoji || '💕'}
    </div>
  );
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' });
}
function formatDate(ts) {
  const diff = Math.floor((Date.now() - ts) / 86400000);
  if (diff === 0) return 'วันนี้';
  if (diff === 1) return 'เมื่อวาน';
  return new Date(ts).toLocaleDateString('th-TH', { weekday:'short', day:'numeric', month:'short' });
}
function formatLastSeen(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - ts) / 60000);
  if (diff < 1) return 'เมื่อสักครู่';
  if (diff < 60) return `${diff} นาทีที่แล้ว`;
  if (diff < 1440) return `${Math.floor(diff/60)} ชั่วโมงที่แล้ว`;
  return 'นานแล้ว';
}

/* ── Chat bubble ── */
function Bubble({ msg, isOwn, showAvatar }) {
  return (
    <div className={`flex items-end gap-2 mb-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {/* Partner avatar placeholder */}
      {!isOwn && (
        <div className="flex-shrink-0" style={{width:32}}>
          {showAvatar && <Avatar user={msg} size={32}/>}
        </div>
      )}

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`} style={{maxWidth:'70%'}}>
        {msg.type === 'heart' ? (
          <div className="text-3xl animate-heartbeat px-3 py-1">💕</div>
        ) : msg.type === 'image' ? (
          <img
            src={msg.imageUrl} alt=""
            onClick={() => window.open(msg.imageUrl,'_blank')}
            className="cursor-pointer block"
            style={{
              maxWidth:220, borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              boxShadow:'0 4px 20px rgba(0,0,0,0.15)',
            }}
          />
        ) : (
          <div
            className="text-sm leading-relaxed"
            style={{
              padding:'10px 16px',
              borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: isOwn
                ? 'linear-gradient(135deg,#f43f5e 0%,#e8637a 60%,#db2777 100%)'
                : 'rgba(255,255,255,0.92)',
              color: isOwn ? 'white' : '#1a2a35',
              boxShadow: isOwn
                ? '0 4px 20px rgba(244,63,94,0.35), 0 1px 4px rgba(244,63,94,0.2)'
                : '0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
              backdropFilter: isOwn ? 'none' : 'blur(8px)',
              wordBreak:'break-word',
            }}>
            {msg.text}
          </div>
        )}
        <span className="text-[10px] font-medium mt-0.5 px-1"
          style={{color: isOwn ? 'rgba(244,63,94,0.45)' : 'rgba(100,116,139,0.6)'}}>
          {formatTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
}

/* ── No partner ── */
function NoPartner() {
  return (
    <div style={{height:'var(--vh,100dvh)', display:'flex', flexDirection:'column', background:'#fdf2f8'}}>
      <div className="glass-white h-14 flex items-center px-4 gap-3 flex-shrink-0" style={{borderBottom:'1px solid #fce7f3'}}>
        <Link to="/dashboard"><BackIcon/></Link>
        <span className="font-bold text-slate-700">แชท</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="font-bold text-slate-700 text-lg mb-2">ยังไม่มีคู่รัก</h2>
        <p className="text-slate-400 text-sm mb-6">เชื่อมต่อกับคู่รักก่อนเพื่อเริ่มแชท</p>
        <Link to="/find-partner" className="btn-primary">หาคู่รัก</Link>
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
  const body = new FormData();
  body.append('key', IMGBB_KEY);
  body.append('image', base64);
  const res = await fetch('https://api.imgbb.com/1/upload', { method:'POST', body });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Upload failed');
  return json.data.url;
}

const MAX_MSG_LEN = 2000;

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
  const prevMsgCount = useRef(0);

  const chatId = currentUser && userProfile?.partnerId
    ? [currentUser.uid, userProfile.partnerId].sort().join('_') : null;
  const partnerUid = userProfile?.partnerId;

  /* ── Keyboard / viewport fix ── */
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      document.documentElement.style.setProperty('--vh', `${vv.height}px`);
      // Scroll to bottom when keyboard appears
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior:'smooth' }));
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      document.documentElement.style.removeProperty('--vh');
    };
  }, []);

  /* ── Online presence ── */
  useEffect(() => {
    if (!currentUser) return;
    const myRef = ref(rtdb, `presence/${currentUser.uid}`);
    set(myRef, { online: true, lastSeen: Date.now() });
    onDisconnect(myRef).set({ online: false, lastSeen: Date.now() });
    return () => { set(myRef, { online: false, lastSeen: Date.now() }); };
  }, [currentUser]);

  useEffect(() => {
    if (!partnerUid) return;
    return onValue(ref(rtdb, `presence/${partnerUid}`), snap => {
      const d = snap.val();
      setPartnerOnline(d?.online === true);
      setPartnerLastSeen(d?.lastSeen || null);
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
        ? Object.entries(data).map(([id, msg]) => ({ id, ...msg })).sort((a,b) => a.timestamp - b.timestamp)
        : [];
      setMessages(msgs);
      setLoadingMsgs(false);
    });
    return () => unsub();
  }, [chatId]);

  /* ── Scroll to bottom on new messages ── */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  /* ── Push notification for new partner messages ── */
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    const isNew = Date.now() - last.timestamp < 8000;
    const fromPartner = last.senderId !== currentUser?.uid;
    if (isNew && fromPartner && messages.length > prevMsgCount.current) {
      if (document.hidden && Notification.permission === 'granted') {
        const body = last.type === 'heart' ? '💕 ส่งความรักมาให้'
          : last.type === 'image' ? '📷 ส่งรูปมาให้'
          : last.text;
        new Notification(`${last.senderName || 'คู่รัก'} 💕`, { body, icon:'/favicon.ico' });
      }
    }
    prevMsgCount.current = messages.length;
  }, [messages]);

  /* ── Send text ── */
  async function handleSend(e) {
    e?.preventDefault();
    if (!text.trim() || !chatId || sending || text.length > MAX_MSG_LEN) return;
    setSending(true);
    try {
      await push(ref(rtdb, `chats/${chatId}/messages`), {
        text: text.trim(), senderId: currentUser.uid,
        senderName: userProfile.displayName,
        senderEmoji: userProfile.avatarEmoji || '💕',
        senderPhoto: userProfile.photoURL || null,
        timestamp: Date.now(), type:'text',
      });
      setText('');
      inputRef.current?.focus();
    } catch (err) { console.error(err); }
    setSending(false);
  }

  /* ── Send heart ── */
  async function sendHeart() {
    if (!chatId) return;
    await push(ref(rtdb, `chats/${chatId}/messages`), {
      text:'', senderId: currentUser.uid,
      senderName: userProfile.displayName,
      senderEmoji: userProfile.avatarEmoji || '💕',
      senderPhoto: userProfile.photoURL || null,
      timestamp: Date.now(), type:'heart',
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
        text:'', imageUrl, senderId: currentUser.uid,
        senderName: userProfile.displayName,
        senderEmoji: userProfile.avatarEmoji || '💕',
        senderPhoto: userProfile.photoURL || null,
        timestamp: Date.now(), type:'image',
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

  if (!userProfile?.partnerId) return <NoPartner/>;

  /* Group by date */
  const groups = [];
  let lastDate = null, lastSender = null;
  messages.forEach((msg, i) => {
    const dateLabel = formatDate(msg.timestamp);
    if (dateLabel !== lastDate) {
      groups.push({ type:'date', label:dateLabel, key:`date-${i}` });
      lastDate = dateLabel; lastSender = null;
    }
    const showAvatar = msg.senderId !== currentUser.uid && msg.senderId !== lastSender;
    groups.push({ type:'msg', msg, showAvatar, key:msg.id });
    lastSender = msg.senderId;
  });

  return (
    <div style={{
      height:'var(--vh,100dvh)',
      display:'flex', flexDirection:'column', overflow:'hidden',
      background:'linear-gradient(160deg,#fdf2f8 0%,#f5f3ff 50%,#eff6ff 100%)',
    }}>

      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4"
        style={{
          height:64,
          background:'rgba(255,255,255,0.85)',
          backdropFilter:'blur(20px)',
          WebkitBackdropFilter:'blur(20px)',
          borderBottom:'1px solid rgba(244,63,94,0.10)',
          boxShadow:'0 2px 20px rgba(244,63,94,0.06)',
          paddingTop:'env(safe-area-inset-top)',
        }}>
        <Link to="/dashboard"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-rose-50 active:scale-90 flex-shrink-0"
          style={{color:'#e8637a'}}>
          <BackIcon/>
        </Link>

        {partnerProfile ? (
          <Link to={`/profile/${partnerUid}`} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <Avatar user={partnerProfile} size={40}/>
              {partnerOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                  style={{background:'#22c55e'}}/>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 leading-tight truncate" style={{fontSize:'0.95rem'}}>
                {partnerProfile.displayName}
              </p>
              <p className="text-xs font-semibold leading-tight mt-0.5"
                style={{color: partnerOnline ? '#22c55e' : '#94a3b8'}}>
                {partnerOnline ? '● ออนไลน์อยู่' : partnerLastSeen ? `เห็นล่าสุด ${formatLastSeen(partnerLastSeen)}` : 'ออฟไลน์'}
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex-1"><p className="font-bold text-slate-800 text-sm">กำลังโหลด...</p></div>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4"
        style={{scrollBehavior:'smooth'}}>
        {loadingMsgs ? (
          <div className="flex justify-center pt-16">
            <div className="w-8 h-8 border-2 border-rose-200 border-t-rose-400 rounded-full animate-spin-slow"/>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="text-6xl mb-4 animate-heartbeat">💌</div>
            <p className="font-bold text-slate-600 text-lg mb-2">เริ่มบทสนทนาแรก</p>
            <p className="text-slate-400 text-sm">พิมพ์ข้อความหรือกดหัวใจ 💕</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {groups.map(item => {
              if (item.type === 'date') return (
                <div key={item.key} className="flex justify-center py-4">
                  <span className="text-xs font-semibold px-4 py-1.5 rounded-full"
                    style={{background:'rgba(255,255,255,0.7)', backdropFilter:'blur(8px)', color:'#94a3b8', border:'1px solid rgba(255,255,255,0.8)'}}>
                    {item.label}
                  </span>
                </div>
              );
              return (
                <Bubble key={item.key} msg={item.msg}
                  isOwn={item.msg.senderId === currentUser.uid}
                  showAvatar={item.showAvatar}/>
              );
            })}
          </div>
        )}
        <div ref={endRef} style={{height:8}}/>
      </div>

      {/* ── Input bar ── */}
      <div className="flex-shrink-0 flex items-end gap-2 px-3 py-3"
        style={{
          background:'rgba(255,255,255,0.90)',
          backdropFilter:'blur(20px)',
          WebkitBackdropFilter:'blur(20px)',
          borderTop:'1px solid rgba(244,63,94,0.08)',
          boxShadow:'0 -4px 24px rgba(244,63,94,0.06)',
          paddingBottom:'max(12px, env(safe-area-inset-bottom))',
        }}>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange}/>

        {/* Heart */}
        <button onClick={sendHeart}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90"
          style={{background:'linear-gradient(135deg,#fce7f3,#fff1f3)', color:'#f43f5e', boxShadow:'0 2px 8px rgba(244,63,94,0.15)'}}>
          <HeartIcon/>
        </button>

        {/* Camera */}
        <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImg}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90"
          style={{background:'linear-gradient(135deg,#e0f2fe,#f0f9ff)', color:'#0ea5e9', boxShadow:'0 2px 8px rgba(14,165,233,0.15)'}}>
          {uploadingImg
            ? <div className="w-4 h-4 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin-slow"/>
            : <CameraIcon/>}
        </button>

        {/* Text area wrapper */}
        <div className="flex-1 flex items-end rounded-3xl px-4 py-2.5 gap-2"
          style={{
            background:'#f8f5ff',
            border:'1.5px solid rgba(168,85,247,0.15)',
            boxShadow:'inset 0 1px 4px rgba(0,0,0,0.04)',
            minHeight:44,
          }}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value.slice(0, MAX_MSG_LEN))}
            onKeyDown={handleKeyDown}
            onFocus={() => setTimeout(() => endRef.current?.scrollIntoView({ behavior:'smooth' }), 300)}
            placeholder="พิมพ์ข้อความ..."
            rows={1}
            className="flex-1 bg-transparent outline-none text-sm text-slate-700 resize-none"
            style={{fontFamily:"'Nunito',sans-serif", maxHeight:120, lineHeight:'1.55'}}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          {text.length > MAX_MSG_LEN * 0.8 && (
            <span className="text-xs self-end pb-0.5 flex-shrink-0"
              style={{color: text.length >= MAX_MSG_LEN ? '#f43f5e' : '#94a3b8'}}>
              {text.length}/{MAX_MSG_LEN}
            </span>
          )}
        </div>

        {/* Send */}
        <button onClick={handleSend} disabled={!text.trim() || sending}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-90"
          style={{
            background: text.trim() ? 'linear-gradient(135deg,#f43f5e,#a855f7)' : '#e5e7eb',
            boxShadow: text.trim() ? '0 4px 16px rgba(244,63,94,0.35)' : 'none',
            transition:'all 0.2s ease',
          }}>
          {sending
            ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin-slow"/>
            : <SendIcon/>}
        </button>
      </div>
    </div>
  );
}
