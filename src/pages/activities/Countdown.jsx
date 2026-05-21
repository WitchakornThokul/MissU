import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import PageHeader from '../../components/PageHeader';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiClock, FiPlus, FiX, FiTrash2, FiCalendar } from 'react-icons/fi';

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

export default function Countdown() {
  const { currentUser, userProfile, partnerProfile } = useAuth();
  const coupleId = currentUser && userProfile?.partnerId
    ? [currentUser.uid, userProfile.partnerId].sort().join('_') : null;

  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ name: '', date: '' });
  const [now, setNow] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const prevLen = useRef(0);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!coupleId) return;
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    const q = query(collection(db, 'couples', coupleId, 'countdowns'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, snap => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (prevLen.current > 0 && items.length > prevLen.current) {
        const latest = items[items.length - 1];
        if (Notification.permission === 'granted') {
          new Notification('เพิ่มวันสำคัญใหม่!', { body: `${partnerProfile?.displayName || 'คู่รัก'}: "${latest.name}"`, icon: '/favicon.ico' });
        }
      }
      prevLen.current = items.length;
      setEvents(items);
    });
  }, [coupleId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!coupleId || !form.name.trim() || !form.date) return;
    await addDoc(collection(db, 'couples', coupleId, 'countdowns'), {
      name: form.name.trim(), date: form.date, createdAt: serverTimestamp(),
    });
    setForm({ name: '', date: '' });
    setShowModal(false);
  }

  async function handleRemove(id) {
    await deleteDoc(doc(db, 'couples', coupleId, 'countdowns', id));
  }

  function getDiff(dateStr) {
    const diff = new Date(dateStr) - now;
    if (diff < 0) return { past: true, days: Math.floor(Math.abs(diff) / 86400000) };
    return {
      past: false,
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      mins: Math.floor((diff % 3600000) / 60000),
      secs: Math.floor((diff % 60000) / 1000),
    };
  }

  const relDays = userProfile?.relationshipStart
    ? Math.floor((now - new Date(userProfile.relationshipStart)) / 86400000) : null;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#faf5ff,#f3e8ff,#fce7f3)' }}>
      <Navbar />
      <PageHeader icon={FiClock} title="นับวัน" subtitle="ทุกวันมีความหมาย" from="#7c3aed" to="#a855f7" />

      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-28 md:pb-12">
        {relDays !== null && (
          <div className="rounded-3xl p-7 text-center text-white mb-5 relative overflow-hidden shadow-xl"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7,#ec4899)' }}>
            <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
              <FiClock size={160} color="white" />
            </div>
            <p className="text-white/60 text-sm uppercase tracking-widest font-bold mb-1">เราอยู่ด้วยกันมา</p>
            <p className="font-display font-bold text-8xl leading-none">{relDays}</p>
            <p className="text-white/60 text-sm uppercase tracking-widest font-bold mt-1">วัน</p>
          </div>
        )}

        {events.length === 0 ? (
          <div className="text-center py-16">
            <FiCalendar size={56} color="#ddd6fe" style={{ margin: '0 auto 12px' }} />
            <p className="font-display italic text-xl text-gray-300">เพิ่มวันสำคัญของคุณ!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(ev => {
              const d = getDiff(ev.date);
              return (
                <div key={ev.id} className="card-love p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FiCalendar size={16} color="#8b5cf6" />
                      <h4 className="font-bold text-gray-800">{ev.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{new Date(ev.date).toLocaleDateString('th-TH')}</span>
                      <button onClick={() => handleRemove(ev.id)} className="text-gray-200 hover:text-rose-400 transition-colors">
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {d.past ? (
                    <div className="text-center py-3">
                      <span className="text-purple-400 font-display italic text-xl">ผ่านมาแล้ว {d.days} วัน</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      {[{ v: d.days, l: 'วัน' }, { v: d.hours, l: 'ชั่วโมง' }, { v: d.mins, l: 'นาที' }, { v: d.secs, l: 'วินาที' }].map(({ v, l }) => (
                        <div key={l} className="text-center rounded-2xl py-3"
                          style={{ background: 'linear-gradient(135deg,#f3e8ff,#ede9fe)' }}>
                          <p className="font-display font-bold text-3xl text-purple-600 leading-none">{String(v).padStart(2, '0')}</p>
                          <p className="text-xs text-purple-400 mt-1 font-semibold">{l}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-5 md:bottom-8 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-90"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', zIndex: 40 }}>
        <FiPlus size={24} />
      </button>

      <Modal show={showModal} onClose={() => setShowModal(false)} title="เพิ่มวันสำคัญ">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="input-label">ชื่อวันสำคัญ</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="เช่น วันครบรอบ, วันเกิด..." required className="input" />
          </div>
          <div>
            <label className="input-label">วันที่</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              required className="input" />
          </div>
          <button type="submit" disabled={!form.name.trim() || !form.date}
            className="btn-love w-full py-3.5 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', opacity: form.name.trim() && form.date ? 1 : 0.4 }}>
            <FiCalendar size={16} />
            เพิ่มวันสำคัญ
          </button>
        </form>
      </Modal>
    </div>
  );
}
