import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import { Link } from 'react-router-dom';

const LS_KEY = 'missu_dailynotes';
const MOODS = [
  { emoji: '😍', label: 'รักมาก', color: 'bg-rose-100 border-rose-300' },
  { emoji: '😊', label: 'มีความสุข', color: 'bg-yellow-100 border-yellow-300' },
  { emoji: '😌', label: 'สงบ', color: 'bg-blue-100 border-blue-300' },
  { emoji: '🥰', label: 'หวานใจ', color: 'bg-pink-100 border-pink-300' },
  { emoji: '😔', label: 'เศร้านิดหน่อย', color: 'bg-gray-100 border-gray-300' },
  { emoji: '🤗', label: 'อยากกอด', color: 'bg-orange-100 border-orange-300' },
];

export default function DailyNote() {
  const { currentUser, userProfile, isLocal } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [notes, setNotes] = useState([]);
  const [mood, setMood] = useState(null);
  const [message, setMessage] = useState('');
  const [todayNote, setTodayNote] = useState(null);

  const key = isLocal ? LS_KEY : `${LS_KEY}_${currentUser?.uid}`;

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    setNotes(stored);
    const tn = stored.find(n => n.date === today);
    if (tn) setTodayNote(tn);
  }, []);

  function saveNote(e) {
    e.preventDefault();
    if (!mood) return;
    const stored = JSON.parse(localStorage.getItem(key) || '[]').filter(n => n.date !== today);
    const newNote = { date: today, mood, message, author: userProfile?.displayName, emoji: userProfile?.avatarEmoji || '💕', id: today };
    stored.unshift(newNote);
    localStorage.setItem(key, JSON.stringify(stored));
    setNotes(stored);
    setTodayNote(newNote);
  }

  const pastNotes = notes.filter(n => n.date !== today);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50">
      <Navbar />
      <div className="max-w-lg mx-auto p-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/dashboard" className="text-rose-400 hover:text-rose-500 text-sm">← กลับ</Link>
          <h1 className="text-2xl font-bold text-gray-700">💝 โน้ตรายวัน</h1>
        </div>
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-600">วันนี้ ({new Date().toLocaleDateString('th-TH')})</h3>
            {todayNote && <span className="text-xs text-green-500 bg-green-50 px-2 py-1 rounded-full">บันทึกแล้ว</span>}
          </div>
          {!todayNote ? (
            <form onSubmit={saveNote} className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">รู้สึกยังไงวันนี้?</p>
                <div className="grid grid-cols-3 gap-2">
                  {MOODS.map((m, i) => (
                    <button key={i} type="button" onClick={() => setMood(m)}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${mood?.emoji === m.emoji ? m.color + ' scale-105 shadow' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="text-2xl">{m.emoji}</div>
                      <div className="text-xs text-gray-500 mt-1">{m.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">อยากบอกอะไรสักอย่างวันนี้?</p>
                <textarea
                  value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="เขียนอะไรก็ได้ที่อยากระบาย..."
                  className="w-full border border-yellow-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-400 resize-none h-24"
                />
              </div>
              <button type="submit" disabled={!mood}
                className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-200 text-white font-medium py-2.5 rounded-2xl transition-all">
                บันทึกวันนี้
              </button>
            </form>
          ) : (
            <div className={`${todayNote.mood?.color || 'bg-rose-100'} rounded-2xl p-5 text-center`}>
              <div className="text-4xl mb-2">{todayNote.mood?.emoji}</div>
              <p className="font-medium text-gray-700">{todayNote.mood?.label}</p>
              {todayNote.message && <p className="text-gray-500 text-sm mt-2 italic">"{todayNote.message}"</p>}
              <button onClick={() => setTodayNote(null)} className="mt-3 text-xs text-gray-400 hover:text-rose-400">แก้ไข</button>
            </div>
          )}
        </div>
        {pastNotes.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-600 mb-3 px-1">ย้อนหลัง</h3>
            <div className="space-y-3">
              {pastNotes.slice(0, 7).map(n => (
                <div key={n.id} className="bg-white rounded-2xl shadow p-4 flex items-center gap-3">
                  <span className="text-2xl">{n.mood?.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-gray-700">{n.mood?.label}</span>
                      <span className="text-xs text-gray-400">{new Date(n.date).toLocaleDateString('th-TH')}</span>
                    </div>
                    {n.message && <p className="text-xs text-gray-400 mt-1 truncate italic">"{n.message}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
