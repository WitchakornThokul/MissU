import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import PageHeader from '../../components/PageHeader';
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiCheckSquare, FiPlus, FiX, FiTrash2, FiCheck } from 'react-icons/fi';

const SUGGESTIONS = ['ดูพระอาทิตย์ตกด้วยกัน','ทำอาหารด้วยกัน','ดูหนังกลางแปลง','ไปเที่ยวทะเล','ปลูกต้นไม้ด้วยกัน','เรียนทำเบเกอรี่','ขี่จักรยานตอนเช้า','ถ่ายรูปคู่พิเศษ','ไปดูคอนเสิร์ต','ดูดาวตอนกลางคืน'];

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

export default function BucketList() {
  const { currentUser, userProfile, partnerProfile } = useAuth();
  const coupleId = currentUser && userProfile?.partnerId
    ? [currentUser.uid, userProfile.partnerId].sort().join('_') : null;

  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const prevLen = useRef(0);

  useEffect(() => {
    if (!coupleId) return;
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    const q = query(collection(db, 'couples', coupleId, 'bucketItems'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, snap => {
      const newItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (prevLen.current > 0 && newItems.length > prevLen.current) {
        const latest = newItems[newItems.length - 1];
        if (!latest.doneBy && Notification.permission === 'granted') {
          new Notification('Bucket List ใหม่!', { body: `${partnerProfile?.displayName || 'คู่รัก'}: "${latest.text}"`, icon: '/favicon.ico' });
        }
      }
      prevLen.current = newItems.length;
      setItems(newItems);
    });
  }, [coupleId]);

  async function addItem(t) {
    if (!t.trim() || !coupleId) return;
    await addDoc(collection(db, 'couples', coupleId, 'bucketItems'), {
      text: t.trim(), done: false, createdAt: serverTimestamp(),
    });
    setText('');
  }

  async function toggle(item) {
    await updateDoc(doc(db, 'couples', coupleId, 'bucketItems', item.id), { done: !item.done });
  }

  async function remove(id) {
    await deleteDoc(doc(db, 'couples', coupleId, 'bucketItems', id));
  }

  const done = items.filter(i => i.done).length;
  const pct = items.length ? (done / items.length) * 100 : 0;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#fff7ed,#fef3c7,#fff1f3)' }}>
      <Navbar />
      <PageHeader icon={FiCheckSquare} title="Bucket List คู่รัก" subtitle="สิ่งที่อยากทำด้วยกันในชีวิตนี้" from="#f97316" to="#f59e0b" />

      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-24">
        {items.length > 0 && (
          <div className="card-love p-5 text-center mb-5 shadow-xl">
            <div className="flex items-center justify-center gap-4 mb-3">
              <span className="font-display font-bold text-5xl text-gradient-gold">{done}</span>
              <span className="text-3xl text-gray-300">/</span>
              <span className="font-display font-bold text-5xl text-gray-300">{items.length}</span>
            </div>
            <div className="h-3 bg-orange-100 rounded-full overflow-hidden">
              <div className="h-3 rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#f97316,#f43f5e)' }} />
            </div>
            <p className="text-xs text-gray-400 mt-2 font-semibold">{Math.round(pct)}% ทำสำเร็จแล้ว</p>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-20">
            <FiCheckSquare size={56} color="#fed7aa" style={{ margin: '0 auto 12px' }} />
            <p className="font-display italic text-xl text-gray-300">เพิ่มความฝันของคุณทั้งคู่!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id}
                className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3 transition-all"
                style={{ border: '1px solid rgba(251,146,60,0.2)', opacity: item.done ? 0.65 : 1, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <button onClick={() => toggle(item)}
                  className="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ background: item.done ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'transparent', borderColor: item.done ? 'transparent' : '#fed7aa', color: 'white' }}>
                  {item.done && <FiCheck size={13} strokeWidth={3} />}
                </button>
                <span className={`flex-1 font-medium text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {item.text}
                </span>
                <button onClick={() => remove(item.id)} className="text-gray-200 hover:text-rose-400 transition-colors">
                  <FiTrash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-5 md:bottom-8 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-90"
        style={{ background: 'linear-gradient(135deg,#f97316,#f59e0b)', zIndex: 40 }}>
        <FiPlus size={24} />
      </button>

      <Modal show={showModal} onClose={() => setShowModal(false)} title="เพิ่มสิ่งที่อยากทำ">
        <div className="space-y-4">
          <div>
            <label className="input-label">ชื่อกิจกรรม</label>
            <div className="flex gap-2">
              <input value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(text); setShowModal(false); } }}
                placeholder="อยากทำอะไร?"
                className="input-love flex-1" style={{ borderColor: '#fed7aa' }} />
              <button onClick={() => { addItem(text); setShowModal(false); }}
                disabled={!text.trim()}
                className="btn-love px-5"
                style={{ background: 'linear-gradient(135deg,#f97316,#f59e0b)', opacity: text.trim() ? 1 : 0.4 }}>
                <FiPlus size={18} />
              </button>
            </div>
          </div>
          <div>
            <p className="input-label mb-2">หรือเลือกจากคำแนะนำ</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => { addItem(s); setShowModal(false); }}
                  className="text-xs px-3 py-1.5 rounded-full font-medium transition-all hover:-translate-y-0.5"
                  style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}>
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
