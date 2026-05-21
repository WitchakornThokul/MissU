import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ModalPage from '../../components/ModalPage';
import { collection, setDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiEdit3, FiHeart, FiStar, FiSmile, FiSun, FiWind, FiMoon, FiSave, FiEdit } from 'react-icons/fi';

const MOODS = [
  { key: 'love',    Icon: FiHeart,  label: 'รักมาก',    bg: '#fff1f3', accent: '#f43f5e' },
  { key: 'sweet',   Icon: FiStar,   label: 'หวานใจ',    bg: '#fdf4ff', accent: '#a855f7' },
  { key: 'happy',   Icon: FiSmile,  label: 'มีความสุข', bg: '#fefce8', accent: '#f59e0b' },
  { key: 'calm',    Icon: FiSun,    label: 'สงบใจ',     bg: '#ecfdf5', accent: '#10b981' },
  { key: 'hug',     Icon: FiWind,   label: 'อยากกอด',   bg: '#fff7ed', accent: '#f97316' },
  { key: 'miss',    Icon: FiMoon,   label: 'คิดถึง',    bg: '#eff6ff', accent: '#6366f1' },
];

function getMood(key) {
  return MOODS.find(m => m.key === key) || null;
}

function MoodDisplay({ moodKey, size = 44 }) {
  const m = getMood(moodKey);
  if (!m) return null;
  const { Icon, accent, bg, label } = m;
  return (
    <div className="rounded-2xl p-5 text-center" style={{ background: bg, border: `2px solid ${accent}30` }}>
      <div className="flex justify-center mb-2">
        <Icon size={size} color={accent} fill={m.key === 'love' ? accent : 'none'} />
      </div>
      <p className="font-display font-semibold text-xl" style={{ color: accent }}>{label}</p>
    </div>
  );
}

export default function DailyNote() {
  const { currentUser, userProfile, partnerProfile, updateUserProfile } = useAuth();
  const coupleId = currentUser && userProfile?.partnerId
    ? [currentUser.uid, userProfile.partnerId].sort().join('_') : null;

  function localDateStr(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  const today = localDateStr();
  const yesterday = localDateStr(new Date(Date.now() - 86400000));

  const [notes, setNotes] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [message, setMessage] = useState('');
  const [todayNote, setTodayNote] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const prevLen = useRef(0);

  useEffect(() => {
    if (!coupleId) return;
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    const q = query(collection(db, 'couples', coupleId, 'dailyNotes'), orderBy('date', 'desc'));
    return onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (prevLen.current > 0 && all.length > prevLen.current) {
        const latest = all[0];
        if (latest.authorId !== currentUser.uid && latest.date === today && Notification.permission === 'granted') {
          new Notification('โน้ตรายวันใหม่!', {
            body: `${latest.author || partnerProfile?.displayName || 'คู่รัก'} บันทึกความรู้สึกวันนี้แล้ว`,
            icon: '/favicon.ico',
          });
        }
      }
      prevLen.current = all.length;
      setNotes(all);
      const mine = all.find(n => n.date === today && n.authorId === currentUser.uid) || null;
      setTodayNote(mine);
      setEditing(false);
    });
  }, [coupleId]);

  async function saveNote(e) {
    e.preventDefault();
    if (!selectedKey || !coupleId || saving) return;
    setSaving(true);
    try {
      const docId = `${currentUser.uid}_${today}`;
      await setDoc(doc(db, 'couples', coupleId, 'dailyNotes', docId), {
        date: today,
        moodKey: selectedKey,
        message: message.trim(),
        author: userProfile?.displayName || 'Unknown',
        authorId: currentUser.uid,
      });

      const lastDate = userProfile?.lastStreakDate;
      let streakCount = userProfile?.streakCount || 0;
      if (lastDate !== today) {
        streakCount = lastDate === yesterday ? streakCount + 1 : 1;
        await updateUserProfile({ streakCount, lastStreakDate: today });
      }
    } catch (err) {
      console.error('Error saving note:', err);
      alert('บันทึกไม่สำเร็จ: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(note) {
    setSelectedKey(note.moodKey || null);
    setMessage(note.message || '');
    setEditing(true);
  }

  const myPastNotes = notes.filter(n => n.authorId === currentUser.uid && n.date !== today);
  const partnerTodayNote = notes.find(n => n.authorId !== currentUser.uid && n.date === today);
  const showForm = !todayNote || editing;

  return (
    <ModalPage title="โน้ตรายวัน" subtitle="บอกความรู้สึกทุกวัน" from="#f97316" to="#f59e0b" bg="linear-gradient(160deg,#fefce8,#fff7ed,#fff1f3)">
      <div>

        {/* Today card */}
        <div className="card-love p-6 mb-5 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <FiSun size={16} color="#f97316" /> วันนี้รู้สึกยังไง?
            </h3>
            <span className="text-xs text-gray-400">
              {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>

          {showForm ? (
            <form onSubmit={saveNote} className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {MOODS.map(m => {
                  const { Icon } = m;
                  const selected = selectedKey === m.key;
                  return (
                    <button key={m.key} type="button" onClick={() => setSelectedKey(m.key)}
                      className="py-3 px-2 rounded-2xl text-center transition-all duration-200 border-2"
                      style={{
                        background: selected ? m.bg : 'white',
                        borderColor: selected ? m.accent : '#fce7f3',
                        transform: selected ? 'scale(1.05)' : 'scale(1)',
                        boxShadow: selected ? `0 4px 16px ${m.accent}30` : 'none',
                      }}>
                      <div className="flex justify-center mb-1.5">
                        <Icon size={26} color={selected ? m.accent : '#d1d5db'} fill={selected && m.key === 'love' ? m.accent : 'none'} />
                      </div>
                      <div className="text-xs font-semibold leading-tight" style={{ color: selected ? m.accent : '#9ca3af' }}>
                        {m.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              <textarea value={message} onChange={e => setMessage(e.target.value)}
                placeholder="อยากบอกอะไรสักอย่างวันนี้..."
                className="input-love resize-none h-24" style={{ borderColor: '#fed7aa', resize: 'none' }} />

              <div className="flex gap-2">
                {editing && (
                  <button type="button" onClick={() => setEditing(false)}
                    className="flex-1 py-3.5 rounded-2xl font-bold text-sm border-2"
                    style={{ borderColor: '#fed7aa', color: '#9ca3af' }}>
                    ยกเลิก
                  </button>
                )}
                <button type="submit" disabled={!selectedKey || saving}
                  className="btn-love flex-1 py-3.5 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#f97316,#f59e0b)', opacity: selectedKey && !saving ? 1 : 0.4 }}>
                  {saving
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                    : <FiSave size={16} />}
                  {editing ? 'อัปเดต' : 'บันทึกวันนี้'}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <MoodDisplay moodKey={todayNote.moodKey} />
              {todayNote.message && (
                <p className="text-gray-500 text-sm mt-3 text-center font-display italic">"{todayNote.message}"</p>
              )}
              <button onClick={() => startEdit(todayNote)}
                className="mt-4 text-xs text-gray-400 hover:text-rose-400 transition-colors flex items-center gap-1 mx-auto">
                <FiEdit size={11} /> แก้ไขโน้ตวันนี้
              </button>
            </div>
          )}
        </div>

        {/* Partner's today note */}
        {partnerTodayNote && (
          <div className="card-love p-5 mb-5">
            <p className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-1.5">
              <FiHeart size={11} color="#f43f5e" fill="#f43f5e" /> {partnerTodayNote.author} วันนี้รู้สึก...
            </p>
            <MoodDisplay moodKey={partnerTodayNote.moodKey} size={36} />
            {partnerTodayNote.message && (
              <p className="text-gray-500 text-xs mt-2 text-center font-display italic">"{partnerTodayNote.message}"</p>
            )}
          </div>
        )}

        {/* Past notes */}
        {myPastNotes.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-600 mb-3 px-1 flex items-center gap-2 text-sm">
              <FiEdit3 size={14} color="#f97316" /> ย้อนดูความรู้สึก
            </h3>
            <div className="space-y-3">
              {myPastNotes.slice(0, 10).map(n => {
                const m = getMood(n.moodKey);
                const Icon = m?.Icon;
                return (
                  <div key={n.id} className="bg-white rounded-2xl p-4 flex items-center gap-3"
                    style={{ border: '1px solid rgba(251,146,60,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: m?.bg || '#fff1f3' }}>
                      {Icon && <Icon size={20} color={m.accent} fill={m.key === 'love' ? m.accent : 'none'} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm" style={{ color: m?.accent || '#f43f5e' }}>{m?.label || n.moodKey}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(n.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      {n.message && <p className="text-xs text-gray-400 mt-0.5 font-display italic truncate">"{n.message}"</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ModalPage>
  );
}
