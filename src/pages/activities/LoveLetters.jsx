import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import PageHeader from '../../components/PageHeader';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiMail, FiEdit3, FiX, FiChevronDown, FiPlus } from 'react-icons/fi';

/* ── Bottom-sheet modal ── */
function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div className="animate-slide-up" style={{
        position: 'relative', width: '100%', maxWidth: 520,
        background: 'white', borderRadius: '28px 28px 0 0',
        padding: '24px 24px max(24px,env(safe-area-inset-bottom))',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111827' }}>{title}</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
            <FiX size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function LoveLetters() {
  const { currentUser, userProfile, partnerProfile } = useAuth();
  const coupleId = currentUser && userProfile?.partnerId
    ? [currentUser.uid, userProfile.partnerId].sort().join('_') : null;

  const [letters, setLetters] = useState([]);
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const prevLen = useRef(0);

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

  async function handleSend(e) {
    e.preventDefault();
    if (!coupleId || !text.trim()) return;
    setLoading(true);
    await addDoc(collection(db, 'couples', coupleId, 'letters'), {
      title: title.trim() || 'จดหมายรัก',
      text: text.trim(),
      author: userProfile?.displayName,
      authorId: currentUser.uid,
      createdAt: serverTimestamp(),
    });
    setText(''); setTitle(''); setLoading(false); setShowModal(false);
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#fff1f3,#fce7f3,#f3e8ff)' }}>
      <Navbar />
      <PageHeader icon={FiMail} title="จดหมายรัก" subtitle="เขียนความรู้สึกที่ลึกที่สุดให้กัน" from="#e8637a" to="#f472b6" />

      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-28 md:pb-12">
        {letters.length === 0 ? (
          <div className="text-center py-20">
            <FiMail size={56} color="#fda4af" style={{ margin: '0 auto 12px' }} />
            <p className="font-display italic text-xl text-gray-300">ยังไม่มีจดหมาย เริ่มเขียนเลย!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {letters.map(l => (
              <div key={l.id}
                className="bg-white rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-lg"
                style={{ border: '1px solid rgba(244,63,94,0.1)', boxShadow: open === l.id ? '0 8px 32px rgba(244,63,94,0.15)' : '0 2px 12px rgba(0,0,0,0.04)' }}
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
                    <FiChevronDown size={14} color="#d1d5db" style={{ transform: open === l.id ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
                  </div>
                </div>
                <p className="text-xs text-pink-400 mb-1">จาก {l.author}</p>
                {open === l.id && (
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap mt-3 pt-3 font-display italic text-base"
                    style={{ borderTop: '1px solid #fce7f3' }}>
                    {l.text}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-5 md:bottom-8 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-90 animate-glow-pulse"
        style={{ background: 'linear-gradient(135deg,#e8637a,#f472b6)', zIndex: 40 }}>
        <FiEdit3 size={22} />
      </button>

      <Modal show={showModal} onClose={() => setShowModal(false)} title="เขียนจดหมายรัก">
        <form onSubmit={handleSend} className="space-y-4">
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
      </Modal>
    </div>
  );
}
