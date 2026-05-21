import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ref, push, onValue, query, limitToLast } from 'firebase/database';
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
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const HeartBtn = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);
const CameraIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

/* ── Avatar ── */
function Avatar({ user, size = 8 }) {
  const px = size * 4;
  if (user?.photoURL || user?.senderPhoto) return (
    <img src={user.photoURL || user.senderPhoto} alt=""
      className="rounded-full object-cover flex-shrink-0"
      style={{width:px, height:px}}/>
  );
  return (
    <div className="rounded-full flex items-center justify-center text-sm flex-shrink-0"
      style={{width:px, height:px, background:'linear-gradient(135deg,#e8637a,#1da0bc)'}}>
      {user?.avatarEmoji || user?.senderEmoji || '💕'}
    </div>
  );
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' });
}
function formatDate(ts) {
  const d = new Date(ts);
  const diff = Math.floor((Date.now() - d) / 86400000);
  if (diff === 0) return 'วันนี้';
  if (diff === 1) return 'เมื่อวาน';
  return d.toLocaleDateString('th-TH', { day:'numeric', month:'short' });
}

/* ── Bubble ── */
function Bubble({ msg, isOwn, showAvatar }) {
  return (
    <div className={`flex items-end gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="w-8 flex-shrink-0">
        {showAvatar && !isOwn && <Avatar user={msg} size={8}/>}
      </div>
      <div className={`max-w-[72%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {msg.type === 'heart' ? (
          <div className="text-3xl animate-heartbeat px-2">💕</div>
        ) : msg.type === 'image' ? (
          <div>
            <img
              src={msg.imageUrl} alt=""
              className="rounded-2xl max-w-[220px] cursor-pointer block"
              style={{
                borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                boxShadow: '0 2px 12px rgba(0,0,0,.12)',
              }}
              onClick={() => window.open(msg.imageUrl, '_blank')}
            />
          </div>
        ) : (
          <div
            className="px-4 py-2.5 text-sm leading-relaxed"
            style={{
              borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: isOwn ? 'linear-gradient(135deg,#e8637a,#c9486b)' : '#ffffff',
              color: isOwn ? 'white' : '#1a2a35',
              boxShadow: isOwn ? '0 2px 12px rgba(232,99,122,.3)' : '0 1px 4px rgba(0,0,0,.08)',
              wordBreak: 'break-word',
            }}>
            {msg.text}
          </div>
        )}
        <span className="text-xs text-slate-300 mt-0.5 px-1">{formatTime(msg.timestamp)}</span>
      </div>
    </div>
  );
}

function NoPartner() {
  return (
    <div style={{height:'100dvh', display:'flex', flexDirection:'column', background:'var(--bg)'}}>
      <div className="glass-white h-14 flex items-center px-4 gap-3 flex-shrink-0">
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
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const chatId = currentUser && userProfile?.partnerId
    ? [currentUser.uid, userProfile.partnerId].sort().join('_') : null;

  useEffect(() => {
    if (!chatId) { setLoadingMsgs(false); return; }
    const q = query(ref(rtdb, `chats/${chatId}/messages`), limitToLast(100));
    const unsub = onValue(q, snap => {
      const data = snap.val();
      if (data) {
        setMessages(
          Object.entries(data)
            .map(([id, msg]) => ({ id, ...msg }))
            .sort((a, b) => a.timestamp - b.timestamp)
        );
      } else {
        setMessages([]);
      }
      setLoadingMsgs(false);
    });
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e?.preventDefault();
    if (!text.trim() || !chatId || sending || text.length > MAX_MSG_LEN) return;
    setSending(true);
    try {
      await push(ref(rtdb, `chats/${chatId}/messages`), {
        text: text.trim(),
        senderId: currentUser.uid,
        senderName: userProfile.displayName,
        senderEmoji: userProfile.avatarEmoji || '💕',
        senderPhoto: userProfile.photoURL || null,
        timestamp: Date.now(),
        type: 'text',
      });
      setText('');
      inputRef.current?.focus();
    } catch (err) { console.error(err); }
    setSending(false);
  }

  async function sendHeart() {
    if (!chatId) return;
    await push(ref(rtdb, `chats/${chatId}/messages`), {
      text: '',
      senderId: currentUser.uid,
      senderName: userProfile.displayName,
      senderEmoji: userProfile.avatarEmoji || '💕',
      senderPhoto: userProfile.photoURL || null,
      timestamp: Date.now(),
      type: 'heart',
    });
  }

  async function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file || !chatId) return;
    setUploadingImg(true);
    try {
      const imageUrl = await uploadToImgBB(file);
      await push(ref(rtdb, `chats/${chatId}/messages`), {
        text: '',
        imageUrl,
        senderId: currentUser.uid,
        senderName: userProfile.displayName,
        senderEmoji: userProfile.avatarEmoji || '💕',
        senderPhoto: userProfile.photoURL || null,
        timestamp: Date.now(),
        type: 'image',
      });
    } catch (err) {
      alert('อัปโหลดรูปไม่สำเร็จ: ' + err.message);
    } finally {
      setUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
    <div style={{height:'100dvh', display:'flex', flexDirection:'column', background:'var(--bg)'}}>

      {/* Header */}
      <div className="glass-white flex-shrink-0 flex items-center gap-3 px-4"
        style={{height:64, borderBottom:'1px solid rgba(29,160,188,.10)', paddingTop:'env(safe-area-inset-top)'}}>
        <Link to="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors mr-1">
          <BackIcon/>
        </Link>
        {partnerProfile ? (
          <>
            <Avatar user={partnerProfile} size={10}/>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm truncate">{partnerProfile.displayName}</p>
              <p className="text-xs text-teal-500 font-semibold">คู่รักของคุณ 💕</p>
            </div>
          </>
        ) : (
          <div className="flex-1"><p className="font-bold text-slate-800 text-sm">กำลังโหลด...</p></div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
        {loadingMsgs ? (
          <div className="flex justify-center pt-10">
            <div className="w-8 h-8 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin-slow"/>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center pt-16">
            <div className="text-5xl mb-3 animate-heartbeat">💌</div>
            <p className="font-bold text-slate-600 text-base">เริ่มบทสนทนาแรกของคุณ</p>
            <p className="text-slate-400 text-sm mt-1">พิมพ์ข้อความหรือกดหัวใจเพื่อส่งความรัก</p>
          </div>
        ) : (
          groups.map(item => {
            if (item.type === 'date') return (
              <div key={item.key} className="flex justify-center py-3">
                <span className="text-xs text-slate-400 font-semibold px-3 py-1 rounded-full"
                  style={{background:'rgba(0,0,0,.05)'}}>
                  {item.label}
                </span>
              </div>
            );
            return (
              <Bubble key={item.key} msg={item.msg}
                isOwn={item.msg.senderId === currentUser.uid}
                showAvatar={item.showAvatar}/>
            );
          })
        )}
        <div ref={endRef}/>
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 glass-white px-3 py-3 flex items-end gap-2"
        style={{
          borderTop:'1px solid rgba(29,160,188,.10)',
          paddingBottom:'max(0.75rem, env(safe-area-inset-bottom))',
        }}>

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange}/>

        {/* Heart */}
        <button onClick={sendHeart}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-110 active:scale-95"
          style={{background:'#fff0f2', color:'#e8637a', border:'1.5px solid rgba(232,99,122,.2)'}}>
          <HeartBtn/>
        </button>

        {/* Camera */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImg}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-110 active:scale-95"
          style={{background:'#f0f9ff', color:'#1da0bc', border:'1.5px solid rgba(29,160,188,.2)'}}>
          {uploadingImg
            ? <div className="w-4 h-4 border-2 border-teal-300 border-t-teal-500 rounded-full animate-spin-slow"/>
            : <CameraIcon/>
          }
        </button>

        {/* Text input */}
        <div className="flex-1 flex flex-col rounded-2xl px-4 py-2"
          style={{
            background:'#f1f5f7',
            border: text.length > MAX_MSG_LEN ? '1.5px solid #e8637a' : '1.5px solid #e2eaee',
            minHeight:44,
          }}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value.slice(0, MAX_MSG_LEN))}
            onKeyDown={handleKeyDown}
            placeholder="พิมพ์ข้อความ..."
            rows={1}
            className="flex-1 bg-transparent outline-none text-sm text-slate-700 resize-none"
            style={{fontFamily:"'Nunito',sans-serif", maxHeight:120, lineHeight:'1.5'}}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          {text.length > MAX_MSG_LEN * 0.8 && (
            <span className="text-right text-xs mt-0.5"
              style={{color: text.length >= MAX_MSG_LEN ? '#e8637a' : '#94a3b8'}}>
              {text.length}/{MAX_MSG_LEN}
            </span>
          )}
        </div>

        {/* Send */}
        <button onClick={handleSend} disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white transition-all hover:scale-110 active:scale-95"
          style={{
            background: text.trim() ? 'linear-gradient(135deg,#e8637a,#1da0bc)' : '#e2eaee',
            color: text.trim() ? 'white' : '#94a3b8',
          }}>
          {sending
            ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin-slow"/>
            : <SendIcon/>}
        </button>
      </div>
    </div>
  );
}
