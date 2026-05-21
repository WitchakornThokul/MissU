import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { MissUIcon } from '../components/MissULogo';

const ACTIVITIES = [
  { id:'love-letters', emoji:'💌', title:'จดหมายรัก',       desc:'เขียนความรู้สึกให้กัน',     from:'#f43f5e', to:'#ec4899' },
  { id:'countdown',    emoji:'⏰', title:'นับวัน',           desc:'นับวันพิเศษของเรา',           from:'#7c3aed', to:'#a855f7' },
  { id:'bucket-list',  emoji:'🎯', title:'Bucket List',      desc:'สิ่งที่อยากทำด้วยกัน',       from:'#f97316', to:'#f59e0b' },
  { id:'memory-wall',  emoji:'📸', title:'ความทรงจำ',        desc:'เก็บทุกช่วงเวลาดีๆ',          from:'#14b8a6', to:'#06b6d4' },
  { id:'love-quiz',    emoji:'❓', title:'รู้จักกันดีแค่ไหน', desc:'ทดสอบความเข้าใจกัน',        from:'#6366f1', to:'#8b5cf6' },
  { id:'date-wheel',   emoji:'🎲', title:'วงล้อเดท',          desc:'สปินหาไอเดียเดท',            from:'#ec4899', to:'#f43f5e' },
  { id:'daily-note',   emoji:'💝', title:'โน้ตรายวัน',        desc:'บอกความรู้สึกทุกวัน',         from:'#f59e0b', to:'#f97316' },
  { id:'achievements', emoji:'🏆', title:'ความสำเร็จ',        desc:'ปลดล็อกความทรงจำ',            from:'#eab308', to:'#f59e0b' },
];

const QUOTES = [
  'ทุกวันที่มีคุณ คือวันที่ดีที่สุด',
  'รักคุณมากกว่าที่คำพูดจะอธิบายได้',
  'ขอบคุณที่อยู่เคียงข้างกันเสมอ',
  'คุณคือเหตุผลที่ฉันยิ้มทุกวัน',
  'ทุกนาทีกับคุณ มีค่ายิ่งกว่าสิ่งใด',
];

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

function PartnerBanner({ partnerProfile, isLocal }) {
  if (isLocal) return null;

  if (!partnerProfile) {
    return (
      <Link to="/find-partner"
        className="flex items-center gap-3 p-4 rounded-2xl mb-5 transition-all hover:scale-[1.01]"
        style={{
          background: 'linear-gradient(135deg, rgba(244,63,94,.08), rgba(168,85,247,.08))',
          border: '1.5px dashed rgba(244,63,94,.3)',
        }}>
        <span className="text-2xl">💕</span>
        <div className="flex-1">
          <p className="font-bold text-slate-700 text-sm">เชื่อมต่อกับคู่รักของคุณ</p>
          <p className="text-xs text-slate-400">ค้นหาและเชื่อมต่อเพื่อทำกิจกรรมร่วมกัน</p>
        </div>
        <span className="text-rose-400 font-bold text-xs">เชื่อมต่อ →</span>
      </Link>
    );
  }

  return (
    <Link to="/find-partner"
      className="flex items-center gap-3 p-4 rounded-2xl mb-5 transition-all hover:scale-[1.01]"
      style={{
        background: 'linear-gradient(135deg, rgba(244,63,94,.06), rgba(168,85,247,.06))',
        border: '1px solid rgba(244,63,94,.12)',
      }}>
      {partnerProfile.photoURL ? (
        <img src={partnerProfile.photoURL} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          style={{boxShadow:'0 0 0 2px white, 0 0 0 3px rgba(244,63,94,.3)'}}/>
      ) : (
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
          style={{background:'linear-gradient(135deg,#f43f5e,#a855f7)',boxShadow:'0 0 0 2px white, 0 0 0 3px rgba(244,63,94,.3)'}}>
          {partnerProfile.avatarEmoji || '💕'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-semibold">คู่รักของฉัน</p>
        <p className="font-bold text-slate-700 text-sm truncate">{partnerProfile.displayName}</p>
      </div>
      <span className="text-rose-400 animate-heartbeat text-lg">💕</span>
    </Link>
  );
}

export default function Dashboard() {
  const { userProfile, partnerProfile, isLocal } = useAuth();
  const days = userProfile?.relationshipStart
    ? Math.floor((Date.now() - new Date(userProfile.relationshipStart)) / 86400000) : null;
  const quote = QUOTES[new Date().getDay() % QUOTES.length];
  const hasPartner = isLocal || !!userProfile?.partnerId;

  return (
    <div className="min-h-screen" style={{background:'var(--bg)'}}>
      <Navbar/>

      {/* Hero */}
      <div className="page-hero">
        <div className="max-w-5xl mx-auto relative z-10">
          {/* Subtle icon watermark */}
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <MissUIcon size={100}/>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {userProfile?.photoURL ? (
                  <img src={userProfile.photoURL} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-white/30"/>
                ) : (
                  <span className="text-3xl">{userProfile?.avatarEmoji||'💕'}</span>
                )}
                <div>
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest">ยินดีต้อนรับ</p>
                  <h1 className="font-bold text-white" style={{fontFamily:"'Nunito',sans-serif",fontSize:'1.75rem',lineHeight:1.1,letterSpacing:'-0.5px'}}>
                    {userProfile?.displayName||'ที่รัก'}
                  </h1>
                </div>
              </div>
              <p className="font-display italic text-white/60 text-base">"{quote}"</p>
            </div>
            {days !== null && days >= 0 && (
              <div className="glass rounded-2xl px-6 py-3 text-center min-w-[110px] flex-shrink-0">
                <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-0.5">อยู่ด้วยกัน</p>
                <p className="font-bold text-white leading-none" style={{fontFamily:"'Nunito',sans-serif",fontSize:'2.75rem'}}>{days}</p>
                <p className="text-white/50 text-xs font-semibold mt-0.5">วัน</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 -mt-5 pb-28 md:pb-10">

        {/* Partner banner */}
        <PartnerBanner partnerProfile={partnerProfile} isLocal={isLocal}/>

        {/* Activities Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {ACTIVITIES.map(a => {
            if (hasPartner) {
              return (
                <Link key={a.id} to={`/activity/${a.id}`}
                  className="card card-hover group block overflow-hidden">
                  <div className="h-1" style={{background:`linear-gradient(90deg,${a.from},${a.to})`}}/>
                  <div className="p-5 text-center">
                    <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl transition-transform group-hover:scale-110"
                      style={{background:`linear-gradient(135deg,${a.from}15,${a.to}25)`}}>
                      {a.emoji}
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm mb-1 leading-tight">{a.title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{a.desc}</p>
                  </div>
                </Link>
              );
            }

            // Locked card
            return (
              <Link key={a.id} to="/find-partner"
                className="card group block overflow-hidden relative"
                style={{opacity:.7}}>
                <div className="h-1" style={{background:`linear-gradient(90deg,${a.from}60,${a.to}60)`}}/>
                <div className="p-5 text-center">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl"
                    style={{background:`linear-gradient(135deg,${a.from}08,${a.to}12)`}}>
                    {a.emoji}
                  </div>
                  <h3 className="font-bold text-slate-500 text-sm mb-1 leading-tight">{a.title}</h3>
                  <p className="text-slate-300 text-xs leading-relaxed">{a.desc}</p>
                </div>
                {/* Lock overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[20px]"
                  style={{background:'rgba(255,255,255,.85)'}}>
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center text-rose-400"
                      style={{background:'#fff1f3'}}>
                      <LockIcon/>
                    </div>
                    <p className="text-xs font-bold text-rose-400">เชื่อมต่อก่อน</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {!hasPartner && (
          <p className="text-center text-slate-300 text-xs mt-5 flex items-center justify-center gap-1.5">
            <LockIcon/> เชื่อมต่อกับคู่รักเพื่อปลดล็อกกิจกรรมทั้งหมด
          </p>
        )}

        <p className="text-center text-slate-300 text-xs mt-4 font-display italic">
          Made with 💕 for you two
        </p>
      </div>
    </div>
  );
}
