import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import PageHeader from '../../components/PageHeader';

const LS_KEY = 'missu_dailynotes';
const MOODS = [
  { emoji:'😍', label:'รักมาก',      bg:'#fff1f3', accent:'#f43f5e' },
  { emoji:'🥰', label:'หวานใจ',      bg:'#fdf4ff', accent:'#a855f7' },
  { emoji:'😊', label:'มีความสุข',   bg:'#fefce8', accent:'#f59e0b' },
  { emoji:'😌', label:'สงบใจ',       bg:'#ecfdf5', accent:'#10b981' },
  { emoji:'🤗', label:'อยากกอด',     bg:'#fff7ed', accent:'#f97316' },
  { emoji:'😔', label:'คิดถึง',      bg:'#eff6ff', accent:'#6366f1' },
];

export default function DailyNote() {
  const { currentUser, userProfile, isLocal } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [notes, setNotes] = useState([]);
  const [mood, setMood] = useState(null);
  const [message, setMessage] = useState('');
  const [todayNote, setTodayNote] = useState(null);
  const key = isLocal ? LS_KEY : `${LS_KEY}_${currentUser?.uid}`;

  useEffect(()=>{
    const stored=JSON.parse(localStorage.getItem(key)||'[]');
    setNotes(stored);
    setTodayNote(stored.find(n=>n.date===today)||null);
  },[]);

  function saveNote(e){
    e.preventDefault(); if(!mood)return;
    const stored=JSON.parse(localStorage.getItem(key)||'[]').filter(n=>n.date!==today);
    const newNote={date:today,mood,message,author:userProfile?.displayName,emoji:userProfile?.avatarEmoji||'💕',id:today};
    stored.unshift(newNote);
    localStorage.setItem(key,JSON.stringify(stored));
    setNotes(stored); setTodayNote(newNote);
  }

  const pastNotes = notes.filter(n=>n.date!==today);

  return (
    <div className="min-h-screen" style={{background:'linear-gradient(160deg,#fefce8,#fff7ed,#fff1f3)'}}>
      <Navbar />
      <PageHeader emoji="💝" title="โน้ตรายวัน" subtitle="บอกความรู้สึกทุกวัน" grad="from-yellow-400 to-orange-500" />

      <div className="max-w-lg mx-auto px-4 -mt-6 pb-10">
        <div className="card-love p-6 mb-5 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <span>🌸</span> วันนี้รู้สึกยังไง?
            </h3>
            <span className="text-xs text-gray-400">{new Date().toLocaleDateString('th-TH',{weekday:'long',day:'numeric',month:'long'})}</span>
          </div>

          {!todayNote ? (
            <form onSubmit={saveNote} className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {MOODS.map((m,i)=>(
                  <button key={i} type="button" onClick={()=>setMood(m)}
                    className="py-3 px-2 rounded-2xl text-center transition-all duration-200 border-2"
                    style={{
                      background: mood?.emoji===m.emoji ? m.bg : 'white',
                      borderColor: mood?.emoji===m.emoji ? m.accent : '#fce7f3',
                      transform: mood?.emoji===m.emoji ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: mood?.emoji===m.emoji ? `0 4px 16px ${m.accent}30` : 'none',
                    }}>
                    <div className="text-3xl mb-1">{m.emoji}</div>
                    <div className="text-xs font-semibold" style={{color: mood?.emoji===m.emoji ? m.accent : '#9ca3af'}}>
                      {m.label}
                    </div>
                  </button>
                ))}
              </div>
              <textarea value={message} onChange={e=>setMessage(e.target.value)}
                placeholder="อยากบอกอะไรสักอย่างวันนี้..."
                className="input-love resize-none h-24" style={{borderColor:'#fed7aa',resize:'none'}} />
              <button type="submit" disabled={!mood} className="btn-love w-full py-3.5"
                style={{background:'linear-gradient(135deg,#f97316,#f59e0b)', opacity:mood?1:0.4}}>
                บันทึกวันนี้ 💝
              </button>
            </form>
          ) : (
            <div className="rounded-2xl p-5 text-center transition-all"
              style={{background:todayNote.mood?.bg||'#fff1f3', border:`2px solid ${todayNote.mood?.accent||'#f43f5e'}30`}}>
              <div className="text-5xl mb-2 animate-pulse-soft">{todayNote.mood?.emoji}</div>
              <p className="font-display font-semibold text-xl" style={{color:todayNote.mood?.accent||'#f43f5e'}}>
                {todayNote.mood?.label}
              </p>
              {todayNote.message && (
                <p className="text-gray-500 text-sm mt-3 font-display italic">"{todayNote.message}"</p>
              )}
              <button onClick={()=>setTodayNote(null)} className="mt-3 text-xs text-gray-400 hover:text-rose-400 transition-colors">
                แก้ไข
              </button>
            </div>
          )}
        </div>

        {pastNotes.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-600 mb-3 px-1 flex items-center gap-2">
              <span>📖</span> ย้อนดูความรู้สึก
            </h3>
            <div className="space-y-3">
              {pastNotes.slice(0,10).map(n=>(
                <div key={n.id} className="bg-white rounded-2xl p-4 flex items-center gap-3"
                  style={{border:'1px solid rgba(251,146,60,0.15)', boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                  <span className="text-3xl">{n.mood?.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm" style={{color:n.mood?.accent||'#f43f5e'}}>{n.mood?.label}</span>
                      <span className="text-xs text-gray-400">{new Date(n.date).toLocaleDateString('th-TH',{day:'numeric',month:'short'})}</span>
                    </div>
                    {n.message && <p className="text-xs text-gray-400 mt-0.5 font-display italic truncate">"{n.message}"</p>}
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
