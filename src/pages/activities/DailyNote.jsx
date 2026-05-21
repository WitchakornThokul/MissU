import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import PageHeader from '../../components/PageHeader';
import { collection, setDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiEdit3, FiHeart, FiStar, FiSmile, FiSun, FiWind, FiMoon, FiSave, FiEdit } from 'react-icons/fi';

const MOODS = [
  { Icon: FiHeart,  label: 'รักมาก',    bg: '#fff1f3', accent: '#f43f5e' },
  { Icon: FiStar,   label: 'หวานใจ',    bg: '#fdf4ff', accent: '#a855f7' },
  { Icon: FiSmile,  label: 'มีความสุข', bg: '#fefce8', accent: '#f59e0b' },
  { Icon: FiSun,    label: 'สงบใจ',     bg: '#ecfdf5', accent: '#10b981' },
  { Icon: FiWind,   label: 'อยากกอด',   bg: '#fff7ed', accent: '#f97316' },
  { Icon: FiMoon,   label: 'คิดถึง',    bg: '#eff6ff', accent: '#6366f1' },
];

export default function DailyNote() {
  const { currentUser, userProfile, partnerProfile, updateUserProfile } = useAuth();
  const coupleId = currentUser && userProfile?.partnerId
    ? [currentUser.uid, userProfile.partnerId].sort().join('_') : null;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const [notes, setNotes] = useState([]);
  const [mood, setMood] = useState(null);
  const [message, setMessage] = useState('');
  const [todayNote, setTodayNote] = useState(null);
  const prevLen = useRef(0);

  useEffect(() => {
    if (!coupleId) return;
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    const q = query(collection(db, 'couples', coupleId, 'dailyNotes'), orderBy('date', 'desc'));
    return onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Check for new partner note
      if (prevLen.current > 0 && all.length > prevLen.current) {
        const latest = all[0];
        if (latest.authorId !== currentUser.uid && latest.date === today && Notification.permission === 'granted') {
          new Notification('โน้ตรายวันใหม่!', { body: `${latest.author || partnerProfile?.displayName || 'คู่รัก'} บันทึกความรู้สึกวันนี้แล้ว`, icon: '/favicon.ico' });
        }
      }
      prevLen.current = all.length;
      setNotes(all);
      setTodayNote(all.find(n => n.date === today && n.authorId === currentUser.uid) || null);
    });
  }, [coupleId]);

  async function saveNote(e) {
    e.preventDefault();
    if (!mood || !coupleId) return;
    const docId = `${currentUser.uid}_${today}`;
    await setDoc(doc(db, 'couples', coupleId, 'dailyNotes', docId), {
      date: today, mood, message,
      author: userProfile?.displayName,
      authorId: currentUser.uid,
    });

    // Update streak
    const lastDate = userProfile?.lastStreakDate;
    let streakCount = userProfile?.streakCount || 0;
    if (lastDate !== today) {
      streakCount = lastDate === yesterday ? streakCount + 1 : 1;
      await updateUserProfile({ streakCount, lastStreakDate: today });
    }
  }

  const myPastNotes = notes.filter(n => n.authorId === currentUser.uid && n.date !== today);
  const partnerTodayNote = notes.find(n => n.authorId !== currentUser.uid && n.date === today);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg,#fefce8,#fff7ed,#fff1f3)' }}>
      <Navbar />
      <PageHeader icon={FiEdit3} title="โน้ตรายวัน" subtitle="บอกความรู้สึกทุกวัน" from="#f59e0b" to="#ef4444" />

      <div className="max-w-lg mx-auto px-4 -mt-6 pb-24">
        {/* My today note */}
        <div className="card-love p-6 mb-5 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <FiSun size={16} color="#f97316" /> วันนี้รู้สึกยังไง?
            </h3>
            <span className="text-xs text-gray-400">{new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>

          {!todayNote ? (
            <form onSubmit={saveNote} className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {MOODS.map((m, i) => {
                  const { Icon } = m;
                  const selected = mood?.label === m.label;
                  return (
                    <button key={i} type="button" onClick={() => setMood(m)}
                      className="py-3 px-2 rounded-2xl text-center transition-all duration-200 border-2"
                      style={{
                        background: selected ? m.bg : 'white',
                        borderColor: selected ? m.accent : '#fce7f3',
                        transform: selected ? 'scale(1.05)' : 'scale(1)',
                        boxShadow: selected ? `0 4px 16px ${m.accent}30` : 'none',
                      }}>
                      <div className="flex justify-center mb-1.5">
                        <Icon size={26} color={selected ? m.accent : '#d1d5db'} fill={selected && m.Icon === FiHeart ? m.accent : 'none'} />
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
              <button type="submit" disabled={!mood}
                className="btn-love w-full py-3.5 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#f97316,#f59e0b)', opacity: mood ? 1 : 0.4 }}>
                <FiSave size={16} />
                บันทึกวันนี้
              </button>
            </form>
          ) : (
            <div className="rounded-2xl p-5 text-center"
              style={{ background: todayNote.mood?.bg || '#fff1f3', border: `2px solid ${todayNote.mood?.accent || '#f43f5e'}30` }}>
              {todayNote.mood?.Icon ? (
                <div className="flex justify-center mb-2">
                  {(() => { const MoodIcon = todayNote.mood.Icon; return <MoodIcon size={44} color={todayNote.mood.accent} />; })()}
                </div>
              ) : null}
              <p className="font-display font-semibold text-xl" style={{ color: todayNote.mood?.accent || '#f43f5e' }}>
                {todayNote.mood?.label}
              </p>
              {todayNote.message && (
                <p className="text-gray-500 text-sm mt-3 font-display italic">"{todayNote.message}"</p>
              )}
              <button onClick={() => setTodayNote(null)} className="mt-3 text-xs text-gray-400 hover:text-rose-400 transition-colors flex items-center gap-1 mx-auto">
                <FiEdit size={11} /> แก้ไข
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
            <div className="rounded-2xl p-4 text-center"
              style={{ background: partnerTodayNote.mood?.bg || '#fff1f3', border: `2px solid ${partnerTodayNote.mood?.accent || '#f43f5e'}30` }}>
              {partnerTodayNote.mood?.Icon ? (
                <div className="flex justify-center mb-1">
                  {(() => { const MoodIcon = partnerTodayNote.mood.Icon; return <MoodIcon size={36} color={partnerTodayNote.mood.accent} />; })()}
                </div>
              ) : null}
              <p className="font-semibold text-sm" style={{ color: partnerTodayNote.mood?.accent || '#f43f5e' }}>{partnerTodayNote.mood?.label}</p>
              {partnerTodayNote.message && <p className="text-gray-500 text-xs mt-2 font-display italic">"{partnerTodayNote.message}"</p>}
            </div>
          </div>
        )}

        {/* My past notes */}
        {myPastNotes.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-600 mb-3 px-1 flex items-center gap-2 text-sm">
              <FiEdit3 size={14} color="#f97316" /> ย้อนดูความรู้สึก
            </h3>
            <div className="space-y-3">
              {myPastNotes.slice(0, 10).map(n => {
                const MoodIcon = n.mood?.Icon;
                return (
                  <div key={n.id} className="bg-white rounded-2xl p-4 flex items-center gap-3"
                    style={{ border: '1px solid rgba(251,146,60,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: n.mood?.bg || '#fff1f3' }}>
                      {MoodIcon ? <MoodIcon size={20} color={n.mood?.accent || '#f43f5e'} /> : null}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm" style={{ color: n.mood?.accent || '#f43f5e' }}>{n.mood?.label}</span>
                        <span className="text-xs text-gray-400">{new Date(n.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
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
    </div>
  );
}
