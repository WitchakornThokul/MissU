import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import { Link } from 'react-router-dom';

const LS_KEY = 'missu_memories';
const BG_COLORS = ['bg-rose-100','bg-pink-100','bg-purple-100','bg-blue-100','bg-teal-100','bg-yellow-100','bg-orange-100','bg-green-100'];

export default function MemoryWall() {
  const { currentUser, isLocal } = useAuth();
  const [memories, setMemories] = useState([]);
  const [form, setForm] = useState({ title: '', note: '', date: new Date().toISOString().split('T')[0], emoji: '📸' });
  const [showForm, setShowForm] = useState(false);

  const key = isLocal ? LS_KEY : `${LS_KEY}_${currentUser?.uid}`;
  const EMOJIS = ['📸','🌸','🎉','❤️','🌊','🎂','✈️','🎵','🌙','☀️','🍕','🎁'];

  useEffect(() => {
    setMemories(JSON.parse(localStorage.getItem(key) || '[]').reverse());
  }, []);

  function save(newList) {
    const reversed = [...newList].reverse();
    localStorage.setItem(key, JSON.stringify(newList));
    setMemories(reversed);
  }

  function addMemory(e) {
    e.preventDefault();
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    stored.push({ ...form, id: Date.now().toString(), bg: BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)], createdAt: new Date().toISOString() });
    save(stored);
    setForm({ title: '', note: '', date: new Date().toISOString().split('T')[0], emoji: '📸' });
    setShowForm(false);
  }

  function removeMemory(id) {
    const stored = JSON.parse(localStorage.getItem(key) || '[]').filter(m => m.id !== id);
    save(stored);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-green-50 to-blue-50">
      <Navbar />
      <div className="max-w-2xl mx-auto p-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-rose-400 hover:text-rose-500 text-sm">← กลับ</Link>
            <h1 className="text-2xl font-bold text-gray-700">📸 กำแพงความทรงจำ</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="bg-teal-400 hover:bg-teal-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">
            + เพิ่ม
          </button>
        </div>
        {showForm && (
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
            <form onSubmit={addMemory} className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => setForm(f => ({ ...f, emoji: e }))}
                    className={`text-2xl p-1.5 rounded-xl transition-all ${form.emoji === e ? 'bg-teal-100 scale-110 shadow' : 'hover:bg-gray-50'}`}>{e}</button>
                ))}
              </div>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="หัวเรื่อง" required
                className="w-full border border-teal-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
              <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="บันทึกความทรงจำ..."
                className="w-full border border-teal-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none h-24" />
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border border-teal-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
              <button type="submit" className="w-full bg-teal-400 hover:bg-teal-500 text-white font-medium py-2.5 rounded-2xl transition-all">บันทึกความทรงจำ</button>
            </form>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          {memories.length === 0 && <div className="col-span-2 text-center text-gray-400 py-12">เริ่มเก็บความทรงจำดีๆ ของคุณ!</div>}
          {memories.map(m => (
            <div key={m.id} className={`${m.bg || 'bg-rose-100'} rounded-2xl p-4 relative group`}>
              <button onClick={() => removeMemory(m.id)} className="absolute top-2 right-2 text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none">×</button>
              <div className="text-3xl mb-2">{m.emoji}</div>
              <h4 className="font-bold text-gray-700 text-sm mb-1">{m.title}</h4>
              {m.note && <p className="text-gray-500 text-xs mb-2 leading-relaxed">{m.note}</p>}
              <p className="text-xs text-gray-400">{new Date(m.date).toLocaleDateString('th-TH')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
