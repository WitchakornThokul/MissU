import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import PageHeader from '../../components/PageHeader';

const LS_KEY = 'missu_countdowns';

export default function Countdown() {
  const { userProfile, isLocal, currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ name:'', date:'' });
  const [now, setNow] = useState(new Date());
  const key = isLocal ? LS_KEY : `${LS_KEY}_${currentUser?.uid}`;

  useEffect(() => { setEvents(JSON.parse(localStorage.getItem(key)||'[]')); }, []);
  useEffect(() => { const t = setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(t); }, []);

  function save(list) { localStorage.setItem(key,JSON.stringify(list)); setEvents(list); }
  function handleAdd(e) {
    e.preventDefault();
    save([...events, {...form, id:Date.now().toString()}]);
    setForm({name:'',date:''});
  }

  function getDiff(dateStr) {
    const diff = new Date(dateStr) - now;
    if (diff < 0) return { past:true, days: Math.floor(Math.abs(diff)/86400000) };
    return {
      past:false,
      days: Math.floor(diff/86400000),
      hours: Math.floor((diff%86400000)/3600000),
      mins: Math.floor((diff%3600000)/60000),
      secs: Math.floor((diff%60000)/1000),
    };
  }

  const relDays = userProfile?.relationshipStart
    ? Math.floor((now - new Date(userProfile.relationshipStart))/86400000) : null;

  return (
    <div className="min-h-screen" style={{background:'linear-gradient(160deg,#faf5ff,#f3e8ff,#fce7f3)'}}>
      <Navbar />
      <PageHeader emoji="⏰" title="นับวัน" subtitle="ทุกวันมีความหมาย" grad="from-violet-400 to-purple-500" />

      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-10">
        {/* Days together hero */}
        {relDays !== null && (
          <div className="rounded-3xl p-7 text-center text-white mb-5 relative overflow-hidden shadow-xl"
            style={{ background:'linear-gradient(135deg,#7c3aed,#a855f7,#ec4899)' }}>
            <div className="absolute inset-0 opacity-10 text-8xl flex items-center justify-center pointer-events-none">💜</div>
            <p className="text-white/60 text-sm uppercase tracking-widest font-bold mb-1">เราอยู่ด้วยกันมา</p>
            <p className="font-display font-bold text-8xl leading-none">{relDays}</p>
            <p className="text-white/60 text-sm uppercase tracking-widest font-bold mt-1">วัน</p>
          </div>
        )}

        {/* Add event */}
        <div className="card-love p-5 mb-5">
          <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><span>📅</span> เพิ่มวันสำคัญ</h3>
          <form onSubmit={handleAdd} className="flex gap-2 flex-wrap">
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
              placeholder="ชื่อวันสำคัญ" required className="input-love flex-1 min-w-[150px]" />
            <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} required
              className="input-love w-auto" />
            <button type="submit" className="btn-love px-5 py-2.5 text-sm">เพิ่ม</button>
          </form>
        </div>

        <div className="space-y-4">
          {events.map(ev => {
            const d = getDiff(ev.date);
            return (
              <div key={ev.id} className="card-love p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-800 text-lg">{ev.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{new Date(ev.date).toLocaleDateString('th-TH')}</span>
                    <button onClick={()=>save(events.filter(e=>e.id!==ev.id))} className="text-gray-200 hover:text-rose-400 text-xl leading-none transition-colors">×</button>
                  </div>
                </div>
                {d.past ? (
                  <div className="text-center py-3">
                    <span className="text-purple-400 font-display italic text-xl">ผ่านมาแล้ว {d.days} วัน 🎉</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {[{v:d.days,l:'วัน'},{v:d.hours,l:'ชั่วโมง'},{v:d.mins,l:'นาที'},{v:d.secs,l:'วินาที'}].map(({v,l})=>(
                      <div key={l} className="text-center rounded-2xl py-3"
                        style={{background:'linear-gradient(135deg,#f3e8ff,#ede9fe)'}}>
                        <p className="font-display font-bold text-3xl text-purple-600 leading-none">{String(v).padStart(2,'0')}</p>
                        <p className="text-xs text-purple-400 mt-1 font-semibold">{l}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {events.length===0 && (
            <div className="text-center py-16 text-gray-300">
              <div className="text-6xl mb-3 opacity-40">📅</div>
              <p className="font-display italic text-xl">เพิ่มวันสำคัญของคุณ!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
