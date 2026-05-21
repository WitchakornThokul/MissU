import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import PageHeader from '../../components/PageHeader';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function LoveLetters() {
  const { currentUser, userProfile } = useAuth();
  const coupleId = currentUser && userProfile?.partnerId
    ? [currentUser.uid, userProfile.partnerId].sort().join('_') : null;

  const [letters, setLetters] = useState([]);
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    if (!coupleId) return;
    const q = query(collection(db, 'couples', coupleId, 'letters'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setLetters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [coupleId]);

  async function handleSend(e) {
    e.preventDefault();
    if (!coupleId) return;
    setLoading(true);
    await addDoc(collection(db, 'couples', coupleId, 'letters'), {
      title: title || 'จดหมายรัก',
      text,
      author: userProfile?.displayName,
      authorId: currentUser.uid,
      emoji: userProfile?.avatarEmoji || '💕',
      createdAt: serverTimestamp(),
    });
    setText(''); setTitle(''); setLoading(false);
  }

  return (
    <div className="min-h-screen" style={{background:'linear-gradient(160deg,#fff1f3,#fce7f3,#f3e8ff)'}}>
      <Navbar />
      <PageHeader emoji="💌" title="จดหมายรัก" subtitle="เขียนความรู้สึกที่ลึกที่สุดให้กัน" grad="from-rose-400 to-pink-500" />

      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-10">
        <div className="card-love p-6 mb-5 shadow-xl">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span>✍️</span> เขียนจดหมายใหม่
          </h3>
          <form onSubmit={handleSend} className="space-y-3">
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="หัวเรื่อง (ไม่จำเป็น)"
              className="input-love" />
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="เขียนจากใจ..."
              className="input-love resize-none h-36" required style={{resize:'none'}} />
            <button type="submit" disabled={loading} className="btn-love w-full py-3">
              {loading ? '...' : 'ส่งจดหมาย 💌'}
            </button>
          </form>
        </div>

        <div className="space-y-3">
          {letters.length === 0 && (
            <div className="text-center py-16 text-gray-300">
              <div className="text-6xl mb-3 opacity-40">💌</div>
              <p className="font-display italic text-xl">ยังไม่มีจดหมาย เริ่มเขียนเลย!</p>
            </div>
          )}
          {letters.map(l => (
            <div key={l.id}
              className="bg-white rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-lg"
              style={{ border:'1px solid rgba(244,63,94,0.1)', boxShadow: open===l.id ? '0 8px 32px rgba(244,63,94,0.15)' : '0 2px 12px rgba(0,0,0,0.04)' }}
              onClick={()=>setOpen(open===l.id?null:l.id)}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{l.emoji}</span>
                  <span className="font-bold text-gray-800">{l.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {l.createdAt?.toDate ? l.createdAt.toDate().toLocaleDateString('th-TH') : ''}
                  </span>
                  <span className="text-gray-300 transition-transform" style={{transform:open===l.id?'rotate(180deg)':''}}>▾</span>
                </div>
              </div>
              <p className="text-xs text-pink-400 mb-1">จาก {l.author}</p>
              {open===l.id && (
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap mt-3 pt-3 font-display italic text-base"
                  style={{borderTop:'1px solid #fce7f3'}}>
                  {l.text}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
