import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import { collection, addDoc, query, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Link } from 'react-router-dom';

const LS_KEY = 'missu_letters';

export default function LoveLetters() {
  const { currentUser, userProfile, isLocal } = useAuth();
  const [letters, setLetters] = useState([]);
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(null);

  useEffect(() => { loadLetters(); }, []);

  async function loadLetters() {
    if (isLocal) {
      const stored = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      setLetters(stored.reverse());
    } else {
      const q = query(collection(db, 'users', currentUser.uid, 'letters'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setLetters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    const letter = { title: title || 'จดหมายรัก', text, author: userProfile?.displayName, emoji: userProfile?.avatarEmoji || '💕', createdAt: new Date().toISOString() };
    if (isLocal) {
      const stored = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      stored.push({ ...letter, id: Date.now().toString() });
      localStorage.setItem(LS_KEY, JSON.stringify(stored));
    } else {
      await addDoc(collection(db, 'users', currentUser.uid, 'letters'), { ...letter, createdAt: serverTimestamp() });
    }
    setText(''); setTitle('');
    await loadLetters();
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <Navbar />
      <div className="max-w-2xl mx-auto p-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/dashboard" className="text-rose-400 hover:text-rose-500 text-sm">← กลับ</Link>
          <h1 className="text-2xl font-bold text-gray-700">💌 จดหมายรัก</h1>
        </div>
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <h3 className="font-bold text-gray-600 mb-4">เขียนจดหมายใหม่</h3>
          <form onSubmit={handleSend} className="space-y-3">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="หัวเรื่อง (ไม่จำเป็น)"
              className="w-full border border-pink-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-400"
            />
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="เขียนความรู้สึกของคุณ..."
              className="w-full border border-pink-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-400 resize-none h-32"
              required
            />
            <button type="submit" disabled={loading} className="w-full bg-rose-400 hover:bg-rose-500 text-white font-medium py-2.5 rounded-2xl transition-all">
              ส่งจดหมาย 💌
            </button>
          </form>
        </div>
        <div className="space-y-4">
          {letters.length === 0 && <p className="text-center text-gray-400 py-8">ยังไม่มีจดหมาย เริ่มเขียนเลย!</p>}
          {letters.map(l => (
            <div key={l.id} className="bg-white rounded-2xl shadow p-5 cursor-pointer hover:shadow-md transition-all" onClick={() => setOpen(open === l.id ? null : l.id)}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span>{l.emoji}</span>
                  <span className="font-bold text-gray-700">{l.title}</span>
                </div>
                <span className="text-xs text-gray-400">{new Date(l.createdAt?.seconds ? l.createdAt.seconds * 1000 : l.createdAt).toLocaleDateString('th-TH')}</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">จาก {l.author}</p>
              {open === l.id && <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap border-t border-pink-100 pt-3 mt-2">{l.text}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
