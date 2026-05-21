import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import PageHeader from '../../components/PageHeader';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiCamera, FiPlus, FiX, FiImage, FiTrash2 } from 'react-icons/fi';

const IMGBB_KEY = import.meta.env.VITE_IMGBB_KEY;

const CARD_STYLES = [
  { bg: '#fff1f3', border: '#fda4af' }, { bg: '#f3e8ff', border: '#d8b4fe' },
  { bg: '#ecfdf5', border: '#6ee7b7' }, { bg: '#eff6ff', border: '#93c5fd' },
  { bg: '#fff7ed', border: '#fcd34d' }, { bg: '#fdf4ff', border: '#f0abfc' },
];

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

export default function MemoryWall() {
  const { currentUser, userProfile, partnerProfile } = useAuth();
  const coupleId = currentUser && userProfile?.partnerId
    ? [currentUser.uid, userProfile.partnerId].sort().join('_') : null;

  const [memories, setMemories] = useState([]);
  const [form, setForm] = useState({ title: '', note: '', date: new Date().toISOString().split('T')[0] });
  const [showForm, setShowForm] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const prevLen = useRef(0);

  useEffect(() => {
    if (!coupleId) return;
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    const q = query(collection(db, 'couples', coupleId, 'memories'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (prevLen.current > 0 && items.length > prevLen.current) {
        const latest = items[0];
        if (latest.authorId !== currentUser.uid && Notification.permission === 'granted') {
          new Notification('ความทรงจำใหม่!', { body: `${partnerProfile?.displayName || 'คู่รัก'}: "${latest.title}"`, icon: '/favicon.ico' });
        }
      }
      prevLen.current = items.length;
      setMemories(items);
    });
  }, [coupleId]);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function addMemory(e) {
    e.preventDefault();
    if (!coupleId || !form.title.trim()) return;
    setUploading(true);
    try {
      let imageUrl = null;
      if (imageFile) imageUrl = await uploadToImgBB(imageFile);
      const style = CARD_STYLES[Math.floor(Math.random() * CARD_STYLES.length)];
      await addDoc(collection(db, 'couples', coupleId, 'memories'), {
        ...form, ...style,
        authorId: currentUser.uid,
        createdAt: serverTimestamp(),
        ...(imageUrl ? { imageUrl } : {}),
      });
      setForm({ title: '', note: '', date: new Date().toISOString().split('T')[0] });
      clearImage();
      setShowForm(false);
    } catch (err) {
      alert('อัปโหลดไม่สำเร็จ: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function removeMemory(id) {
    await deleteDoc(doc(db, 'couples', coupleId, 'memories', id));
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#ecfdf5,#d1fae5,#e0f2fe)' }}>
      <Navbar />
      <PageHeader icon={FiCamera} title="กำแพงความทรงจำ" subtitle="เก็บทุกช่วงเวลาที่ดีไว้ตลอดกาล" from="#14b8a6" to="#06b6d4" />

      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-24">
        {memories.length === 0 && !showForm && (
          <div className="text-center py-20">
            <FiCamera size={56} color="#a7f3d0" style={{ margin: '0 auto 12px' }} />
            <p className="font-display italic text-xl text-gray-300">เริ่มเก็บความทรงจำดีๆ ของคุณ!</p>
          </div>
        )}

        <div className="columns-2 gap-4">
          {memories.map(m => (
            <div key={m.id} className="break-inside-avoid mb-4 rounded-2xl overflow-hidden group relative transition-all hover:shadow-lg"
              style={{ background: m.bg || '#fff1f3', border: `1px solid ${m.border || '#fda4af'}` }}>
              <button onClick={() => removeMemory(m.id)}
                className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-white/90 text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow">
                <FiTrash2 size={11} />
              </button>
              {m.imageUrl && (
                <img src={m.imageUrl} alt="" className="w-full max-h-48 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <FiCamera size={13} color={m.border || '#14b8a6'} />
                  <h4 className="font-bold text-gray-800 text-sm leading-tight">{m.title}</h4>
                </div>
                {m.note && <p className="text-gray-500 text-xs leading-relaxed mb-2">{m.note}</p>}
                <p className="text-xs font-semibold" style={{ color: m.border || '#14b8a6' }}>
                  {new Date(m.date).toLocaleDateString('th-TH')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => setShowForm(true)}
        className="fixed bottom-24 right-5 md:bottom-8 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-90"
        style={{ background: 'linear-gradient(135deg,#14b8a6,#06b6d4)', zIndex: 40 }}>
        <FiPlus size={24} />
      </button>

      <Modal show={showForm} onClose={() => { setShowForm(false); clearImage(); }} title="เพิ่มความทรงจำ">
        <form onSubmit={addMemory} className="space-y-4">
          <div>
            <label className="input-label">หัวเรื่อง</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="ความทรงจำนี้คือ..." required
              className="input-love" style={{ borderColor: '#a7f3d0' }} />
          </div>
          <div>
            <label className="input-label">บันทึก (ไม่บังคับ)</label>
            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="เล่าสิ่งที่เกิดขึ้น..."
              className="input-love resize-none h-20" style={{ borderColor: '#a7f3d0', resize: 'none' }} />
          </div>
          <div>
            <label className="input-label">วันที่</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="input-love" style={{ borderColor: '#a7f3d0' }} />
          </div>

          {/* Image upload */}
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="memory-img" />
            {!imagePreview ? (
              <label htmlFor="memory-img"
                className="flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-2xl p-4 justify-center text-sm font-semibold transition-all hover:bg-teal-50"
                style={{ borderColor: '#a7f3d0', color: '#14b8a6' }}>
                <FiImage size={18} />
                เพิ่มรูปภาพ (ไม่บังคับ)
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden">
                <img src={imagePreview} alt="" className="w-full max-h-48 object-cover rounded-2xl" />
                <button type="button" onClick={clearImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center">
                  <FiX size={14} />
                </button>
              </div>
            )}
          </div>

          <button type="submit" disabled={uploading || !form.title.trim()}
            className="btn-love w-full py-3.5 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#14b8a6,#06b6d4)', opacity: uploading || !form.title.trim() ? 0.6 : 1 }}>
            <FiCamera size={16} />
            {uploading ? 'กำลังอัปโหลด...' : 'บันทึกความทรงจำ'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
