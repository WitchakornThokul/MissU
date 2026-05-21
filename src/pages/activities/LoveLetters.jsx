import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import BottomSheet from '../../components/BottomSheet';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiMail, FiEdit3, FiX, FiChevronDown, FiArrowLeft } from 'react-icons/fi';

/* ── Write modal ── */
function WriteModal({ show, onClose, onSend, loading }) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onSend(title, text, () => { setTitle(''); setText(''); });
  }

  return (
    <BottomSheet show={show} onClose={onClose} title="เขียนจดหมายรัก">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="input-label">หัวเรื่อง</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="ถึงคนที่รัก..."
            className="input-love" />
        </div>
        <div>
          <label className="input-label">เนื้อหา</label>
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="เขียนจากใจ..." required
            className="input-love resize-none h-36" style={{ resize: 'none' }} />
        </div>
        <button type="submit" disabled={loading || !text.trim()} className="btn-love w-full py-3.5 flex items-center justify-center gap-2">
          <FiMail size={16} />
          {loading ? 'กำลังส่ง...' : 'ส่งจดหมาย'}
        </button>
      </form>
    </BottomSheet>
  );
}

export default function LoveLetters() {
  const navigate = useNavigate();
  const { currentUser, userProfile, partnerProfile } = useAuth();
  const coupleId = currentUser && userProfile?.partnerId
    ? [currentUser.uid, userProfile.partnerId].sort().join('_') : null;

  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(null);
  const [showWrite, setShowWrite] = useState(false);
  const [kbOffset, setKbOffset] = useState(0);
  const prevLen = useRef(0);

  useEffect(() => {
    if (!window.visualViewport) return;
    function update() {
      const vv = window.visualViewport;
      const hidden = window.innerHeight - (vv.height + vv.offsetTop);
      setKbOffset(Math.max(0, hidden));
    }
    window.visualViewport.addEventListener('resize', update);
    window.visualViewport.addEventListener('scroll', update);
    return () => {
      window.visualViewport.removeEventListener('resize', update);
      window.visualViewport.removeEventListener('scroll', update);
    };
  }, []);

  useEffect(() => {
    if (!coupleId) return;
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    const q = query(collection(db, 'couples', coupleId, 'letters'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (prevLen.current > 0 && items.length > prevLen.current) {
        const latest = items[0];
        if (latest.authorId && latest.authorId !== currentUser.uid && Notification.permission === 'granted') {
          new Notification('จดหมายรักใหม่!', { body: `${latest.author || partnerProfile?.displayName || 'คู่รัก'} เขียนจดหมายถึงคุณ`, icon: '/favicon.ico' });
        }
      }
      prevLen.current = items.length;
      setLetters(items);
    });
  }, [coupleId]);

  async function handleSend(title, text, reset) {
    if (!coupleId || !text.trim()) return;
    setLoading(true);
    await addDoc(collection(db, 'couples', coupleId, 'letters'), {
      title: title.trim() || 'จดหมายรัก',
      text: text.trim(),
      author: userProfile?.displayName,
      authorId: currentUser.uid,
      createdAt: serverTimestamp(),
    });
    reset();
    setLoading(false);
    setShowWrite(false);
  }

  return (
    <>
      {/* Full-screen modal overlay */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
        onClick={() => navigate(-1)} />

      <div className="animate-slide-up" style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 51,
        maxWidth: 560, margin: '0 auto',
        background: 'linear-gradient(160deg,#fff1f3,#fce7f3,#f3e8ff)',
        borderRadius: '28px 28px 0 0',
        height: '92vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        transform: `translateY(-${kbOffset}px)`,
        transition: 'transform 0.2s ease',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 20px 16px',
          background: 'linear-gradient(135deg,#f43f5e,#fb7185)',
          flexShrink: 0,
        }}>
          <button onClick={() => navigate(-1)}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiArrowLeft size={18} />
          </button>
          <div className="text-center">
            <p style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>จดหมายรัก</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem' }}>เขียนความรู้สึกที่ลึกที่สุดให้กัน</p>
          </div>
          <button onClick={() => setShowWrite(true)}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiEdit3 size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px max(24px,env(safe-area-inset-bottom))' }}>
          {letters.length === 0 ? (
            <div className="text-center py-20">
              <FiMail size={56} color="#fda4af" style={{ margin: '0 auto 12px' }} />
              <p className="font-display italic text-xl text-gray-300">ยังไม่มีจดหมาย เริ่มเขียนเลย!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {letters.map(l => (
                <div key={l.id}
                  className="bg-white rounded-2xl p-5 cursor-pointer transition-all duration-300"
                  style={{ boxShadow: open === l.id ? '0 8px 32px rgba(244,63,94,0.15)' : '0 2px 12px rgba(0,0,0,0.05)' }}
                  onClick={() => setOpen(open === l.id ? null : l.id)}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <FiMail size={16} color="#f43f5e" />
                      <span className="font-bold text-gray-800 text-sm">{l.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {l.createdAt?.toDate ? l.createdAt.toDate().toLocaleDateString('th-TH') : ''}
                      </span>
                      <FiChevronDown size={14} color="#d1d5db"
                        style={{ transform: open === l.id ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
                    </div>
                  </div>
                  <p className="text-xs text-pink-400 mb-1">จาก {l.author}</p>
                  {open === l.id && (
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap mt-3 pt-3 font-display italic"
                      style={{ borderTop: '1px solid #fce7f3' }}>
                      {l.text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <WriteModal
        show={showWrite}
        onClose={() => setShowWrite(false)}
        onSend={handleSend}
        loading={loading}
      />
    </>
  );
}
