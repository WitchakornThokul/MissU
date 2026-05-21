import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import {
  FiMail, FiClock, FiCheckSquare, FiCamera,
  FiHelpCircle, FiRefreshCw, FiEdit3, FiAward,
} from 'react-icons/fi';

const ACTIVITIES = [
  { id:'love-letters', Icon:FiMail,        title:'จดหมายรัก',        desc:'เขียนความรู้สึกให้กัน',   from:'#e8637a', to:'#f472b6' },
  { id:'countdown',    Icon:FiClock,       title:'นับวัน',            desc:'นับวันพิเศษของเรา',         from:'#8b5cf6', to:'#a78bfa' },
  { id:'bucket-list',  Icon:FiCheckSquare, title:'Bucket List',       desc:'สิ่งที่อยากทำด้วยกัน',     from:'#f97316', to:'#fbbf24' },
  { id:'memory-wall',  Icon:FiCamera,      title:'ความทรงจำ',         desc:'เก็บทุกช่วงเวลาดีๆ',        from:'#14b8a6', to:'#1da0bc' },
  { id:'love-quiz',    Icon:FiHelpCircle,  title:'รู้จักกันดีแค่ไหน', desc:'ทดสอบความเข้าใจกัน',      from:'#6366f1', to:'#818cf8' },
  { id:'date-wheel',   Icon:FiRefreshCw,   title:'วงล้อเดท',          desc:'สปินหาไอเดียเดท',          from:'#ec4899', to:'#e8637a' },
  { id:'daily-note',   Icon:FiEdit3,       title:'โน้ตรายวัน',        desc:'บอกความรู้สึกทุกวัน',       from:'#f59e0b', to:'#ef4444' },
  { id:'achievements', Icon:FiAward,       title:'ความสำเร็จ',        desc:'ปลดล็อกความทรงจำ',          from:'#eab308', to:'#f97316' },
];

const QUOTES = [
  'ทุกวันที่มีคุณ คือวันที่ดีที่สุด',
  'รักคุณมากกว่าที่คำพูดจะอธิบายได้',
  'ขอบคุณที่อยู่เคียงข้างกันเสมอ',
  'คุณคือเหตุผลที่ฉันยิ้มทุกวัน',
  'ทุกนาทีกับคุณ มีค่ายิ่งกว่าสิ่งใด',
];

const LockIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

function ActivityCard({ a, hasPartner }) {
  const { Icon } = a;
  const content = (
    <div className="card card-hover group overflow-hidden h-full flex flex-col">
      {/* Icon area with gradient bg */}
      <div className="relative flex items-center justify-center py-8 overflow-hidden"
        style={{background:`linear-gradient(135deg,${a.from}15,${a.to}28)`}}>
        <div className="absolute inset-0 opacity-15"
          style={{background:`radial-gradient(circle at 50% 70%,${a.to},transparent 65%)`}}/>

        {/* Icon circle */}
        <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
          style={{
            background:`linear-gradient(135deg,${a.from},${a.to})`,
            boxShadow:`0 8px 24px ${a.from}45`,
          }}>
          <Icon size={28} strokeWidth={1.8} color="white"/>
        </div>

        {!hasPartner && (
          <div className="absolute inset-0 flex items-center justify-center rounded-t-[20px]"
            style={{background:'rgba(255,255,255,.75)', backdropFilter:'blur(2px)'}}>
            <div className="flex flex-col items-center gap-1">
              <LockIcon/>
              <span className="text-xs font-bold text-slate-400">ต้องการคู่รัก</span>
            </div>
          </div>
        )}
      </div>

      {/* Color accent bar */}
      <div className="h-[3px]" style={{background:`linear-gradient(90deg,${a.from},${a.to})`}}/>

      {/* Text */}
      <div className="p-4 flex-1 flex flex-col justify-center">
        <h3 className="font-bold text-slate-800 leading-snug mb-1" style={{fontSize:'0.95rem'}}>
          {a.title}
        </h3>
        <p className="text-slate-400 leading-snug" style={{fontSize:'0.8rem'}}>
          {a.desc}
        </p>
      </div>
    </div>
  );

  if (hasPartner) {
    return <Link to={`/activity/${a.id}`} className="block h-full">{content}</Link>;
  }
  return <Link to="/find-partner" className="block h-full">{content}</Link>;
}

function PartnerSection({ partnerProfile, userProfile, isLocal }) {
  if (isLocal) return null;

  if (!partnerProfile) {
    return (
      <Link to="/find-partner"
        className="flex items-center gap-4 p-5 rounded-3xl mb-6 transition-all hover:scale-[1.01] active:scale-[0.99]"
        style={{
          background:'linear-gradient(135deg,rgba(232,99,122,.08),rgba(29,160,188,.08))',
          border:'2px dashed rgba(232,99,122,.35)',
        }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
          style={{background:'rgba(232,99,122,.1)'}}>
          💕
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-700" style={{fontSize:'1rem'}}>
            เชื่อมต่อกับคู่รักของคุณ
          </p>
          <p className="text-slate-400 mt-0.5" style={{fontSize:'0.85rem'}}>
            ค้นหาและเชื่อมต่อเพื่อทำกิจกรรมร่วมกัน
          </p>
        </div>
        <div className="flex-shrink-0 px-4 py-2 rounded-2xl text-white font-bold text-sm"
          style={{background:'linear-gradient(135deg,#e8637a,#1da0bc)'}}>
          เชื่อมต่อ
        </div>
      </Link>
    );
  }

  return (
    <Link to="/chat"
      className="flex items-center gap-4 p-5 rounded-3xl mb-6 transition-all hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background:'white',
        border:'1px solid rgba(29,160,188,.15)',
        boxShadow:'0 4px 20px rgba(29,160,188,.08)',
      }}>
      {/* My avatar */}
      {userProfile?.photoURL ? (
        <img src={userProfile.photoURL} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          style={{boxShadow:'0 0 0 2px #fff, 0 0 0 4px rgba(232,99,122,.3)'}}/>
      ) : (
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
          style={{background:'linear-gradient(135deg,#e8637a,#1da0bc)',boxShadow:'0 0 0 2px #fff, 0 0 0 4px rgba(232,99,122,.25)'}}>
          {userProfile?.avatarEmoji || '💕'}
        </div>
      )}

      <div className="flex-1 min-w-0 text-center px-2">
        <div className="text-2xl animate-heartbeat">💕</div>
      </div>

      {/* Partner avatar */}
      {partnerProfile.photoURL ? (
        <img src={partnerProfile.photoURL} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          style={{boxShadow:'0 0 0 2px #fff, 0 0 0 4px rgba(29,160,188,.3)'}}/>
      ) : (
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
          style={{background:'linear-gradient(135deg,#1da0bc,#e8637a)',boxShadow:'0 0 0 2px #fff, 0 0 0 4px rgba(29,160,188,.25)'}}>
          {partnerProfile.avatarEmoji || '💕'}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">คู่รักของฉัน</p>
        <p className="font-bold text-slate-700 truncate" style={{fontSize:'1rem'}}>
          {partnerProfile.displayName}
        </p>
        <p className="text-xs text-teal-500 font-semibold">แตะเพื่อแชท →</p>
      </div>
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

      {/* ── Hero ── */}
      <div style={{
        background:'linear-gradient(135deg, #e8637a 0%, #1da0bc 100%)',
        padding:'2.5rem 1.5rem 4rem',
        position:'relative',
        overflow:'hidden',
      }}>
        {/* Decorative blobs */}
        <div className="absolute pointer-events-none"
          style={{top:-40,right:-40,width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,.06)'}}/>
        <div className="absolute pointer-events-none"
          style={{bottom:-20,left:-20,width:120,height:120,borderRadius:'50%',background:'rgba(255,255,255,.06)'}}/>

        {/* Cutout bottom */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{height:32,background:'var(--bg)',clipPath:'ellipse(55% 100% at 50% 100%)'}}/>

        <div className="max-w-2xl mx-auto relative z-10">
          <div className="flex items-center justify-between gap-4">
            {/* User info */}
            <div className="flex items-center gap-3 min-w-0">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt=""
                  className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                  style={{boxShadow:'0 0 0 3px rgba(255,255,255,.4)'}}/>
              ) : (
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl flex-shrink-0"
                  style={{background:'rgba(255,255,255,.2)',boxShadow:'0 0 0 3px rgba(255,255,255,.3)'}}>
                  {userProfile?.avatarEmoji || '💕'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-white/60 font-bold uppercase tracking-widest" style={{fontSize:'0.7rem'}}>
                  ยินดีต้อนรับ
                </p>
                <h1 className="font-bold text-white truncate"
                  style={{fontSize:'1.6rem',lineHeight:1.15,letterSpacing:'-0.5px'}}>
                  {userProfile?.displayName || 'ที่รัก'}
                </h1>
                <p className="font-display italic text-white/65 mt-1 truncate"
                  style={{fontSize:'0.9rem'}}>
                  "{quote}"
                </p>
              </div>
            </div>

            {/* Days counter */}
            {days !== null && days >= 0 && (
              <div className="flex-shrink-0 text-center px-5 py-3 rounded-2xl"
                style={{background:'rgba(255,255,255,.18)',backdropFilter:'blur(12px)'}}>
                <p className="text-white/60 font-bold uppercase tracking-wider" style={{fontSize:'0.62rem'}}>
                  อยู่ด้วยกัน
                </p>
                <p className="font-black text-white leading-none"
                  style={{fontSize:'2.8rem',fontFamily:"'Nunito',sans-serif"}}>
                  {days}
                </p>
                <p className="text-white/60 font-bold" style={{fontSize:'0.72rem'}}>วัน</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-4 -mt-5 pb-32 md:pb-12">

        {/* Partner section */}
        <PartnerSection
          partnerProfile={partnerProfile}
          userProfile={userProfile}
          isLocal={isLocal}
        />

        {/* Section title */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-700" style={{fontSize:'1.1rem'}}>
            กิจกรรมของเรา
          </h2>
          {!hasPartner && (
            <span className="badge badge-rose">ต้องการคู่รัก</span>
          )}
        </div>

        {/* 2×4 Grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {ACTIVITIES.map(a => (
            <ActivityCard key={a.id} a={a} hasPartner={hasPartner}/>
          ))}
        </div>

        <p className="text-center mt-8 font-display italic"
          style={{color:'#c8d9e2', fontSize:'0.82rem'}}>
          Made with 💕 for you two
        </p>
      </div>
    </div>
  );
}
