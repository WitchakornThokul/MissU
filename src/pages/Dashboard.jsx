import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  FiMail, FiClock, FiCheckSquare, FiCamera,
  FiHelpCircle, FiRefreshCw, FiEdit3, FiAward, FiMessageCircle, FiZap,
} from 'react-icons/fi';

const ACTIVITIES = [
  { id:'love-letters', Icon:FiMail,        title:'จดหมายรัก',        desc:'เขียนความรู้สึกให้กัน',   from:'#f43f5e', to:'#fb7185' },
  { id:'countdown',    Icon:FiClock,       title:'นับวัน',            desc:'นับวันพิเศษของเรา',       from:'#a855f7', to:'#c084fc' },
  { id:'bucket-list',  Icon:FiCheckSquare, title:'Bucket List',       desc:'สิ่งที่อยากทำด้วยกัน',   from:'#f97316', to:'#fb923c' },
  { id:'memory-wall',  Icon:FiCamera,      title:'ความทรงจำ',         desc:'เก็บทุกช่วงเวลาดีๆ',    from:'#ec4899', to:'#f472b6' },
  { id:'love-quiz',    Icon:FiHelpCircle,  title:'รู้จักกันดีแค่ไหน', desc:'ทดสอบความเข้าใจกัน',    from:'#6366f1', to:'#818cf8' },
  { id:'date-wheel',   Icon:FiRefreshCw,   title:'วงล้อเดท',          desc:'สปินหาไอเดียเดท',        from:'#e879f9', to:'#f0abfc' },
  { id:'daily-note',   Icon:FiEdit3,       title:'โน้ตรายวัน',        desc:'บอกความรู้สึกทุกวัน',    from:'#f43f5e', to:'#fb923c' },
  { id:'achievements', Icon:FiAward,       title:'ความสำเร็จ',        desc:'ปลดล็อกความสำเร็จ',      from:'#eab308', to:'#fbbf24' },
];

const QUOTES = [
  'ทุกวันที่มีคุณ คือวันที่ดีที่สุด',
  'รักคุณมากกว่าที่คำพูดจะอธิบายได้',
  'ขอบคุณที่อยู่เคียงข้างกันเสมอ',
  'คุณคือเหตุผลที่ฉันยิ้มทุกวัน',
  'ทุกนาทีกับคุณ มีค่ายิ่งกว่าสิ่งใด',
  'ห่างกันแค่ไหน หัวใจยังอยู่ใกล้',
  'รักแท้ไม่ได้วัดด้วยระยะทาง แต่วัดด้วยใจ',
  'การมีคุณอยู่ข้างๆ คือความสุขที่แท้จริง',
  'คุณทำให้โลกใบนี้สวยงามขึ้นมาก',
  'พรุ่งนี้จะดีกว่า เพราะยังมีคุณ',
  'ขอบคุณที่เป็นแรงบันดาลใจให้กันและกัน',
  'ทุกช่วงเวลาที่มีเธอ คือความทรงจำที่ดีที่สุด',
];

function AvatarBubble({ profile, label, ringFrom, ringTo, size = 16 }) {
  const px = size * 4;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="p-[3px] rounded-full"
        style={{background:`linear-gradient(135deg,${ringFrom},${ringTo})`}}>
        {profile?.photoURL ? (
          <img src={profile.photoURL} alt=""
            className="rounded-full object-cover block"
            style={{width:px, height:px, border:'2.5px solid white'}}/>
        ) : (
          <div className="rounded-full flex items-center justify-center"
            style={{width:px, height:px, background:'#fff', border:'2.5px solid white', fontSize: size > 16 ? '2rem' : '1.5rem'}}>
            {profile?.avatarEmoji || '💕'}
          </div>
        )}
      </div>
      <span className="font-semibold text-gray-600 truncate text-center"
        style={{maxWidth: px + 16, fontSize: size > 16 ? '0.85rem' : '0.72rem'}}>
        {profile?.displayName || label}
      </span>
    </div>
  );
}

/* ── Desktop couple sidebar ── */
function CoupleSidebar({ userProfile, partnerProfile, isLocal, days, quote, quoteFade }) {
  return (
    <div className="hidden md:flex flex-col gap-4 w-72 flex-shrink-0">
      <div className="rounded-3xl overflow-hidden text-center"
        style={{boxShadow:'0 8px 32px rgba(232,99,122,0.18)', position:'sticky', top:80}}>
        {(partnerProfile || isLocal) ? (
          <>
            {/* Gradient section */}
            <div className="relative px-6 pt-6 pb-10"
              style={{background:'linear-gradient(135deg,#f43f5e,#c026d3,#7c3aed)'}}>
              <div style={{position:'absolute',top:-20,right:-20,width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.07)'}}/>
              <div style={{position:'absolute',bottom:-30,left:-10,width:70,height:70,borderRadius:'50%',background:'rgba(255,255,255,0.05)'}}/>
              <div className="flex items-center justify-between mb-5">
                <AvatarBubble profile={userProfile} label="ฉัน" ringFrom="#fff" ringTo="#fce7f3" size={20}/>
                <div className="flex flex-col items-center flex-1">
                  <div className="font-black text-white leading-none"
                    style={{fontSize:'3.2rem', fontFamily:"'Nunito',sans-serif", textShadow:'0 2px 12px rgba(0,0,0,0.2)'}}>
                    {days !== null && days >= 0 ? days : '—'}
                  </div>
                  <div className="text-xs font-bold mt-1" style={{color:'rgba(255,255,255,0.7)'}}>วันที่อยู่ด้วยกัน</div>
                  <div className="flex items-center gap-2 mt-2 justify-center">
                    <div className="animate-heartbeat text-xl">💕</div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                      style={{background: userProfile?.streakCount > 0 ? 'rgba(249,115,22,0.9)' : 'rgba(255,255,255,0.2)'}}>
                      <span style={{fontSize:'0.85rem'}}>🔥</span>
                      <span className="text-xs font-black text-white">{userProfile?.streakCount || 0}</span>
                    </div>
                  </div>
                </div>
                <AvatarBubble profile={partnerProfile} label="คู่รัก" ringFrom="#fff" ringTo="#e0e7ff" size={20}/>
              </div>
            </div>
            {/* White section */}
            <div className="bg-white px-6 py-5">
              <p className="font-display italic text-gray-400 text-sm leading-relaxed mb-4"
                style={{transition:'opacity 0.4s ease', opacity: quoteFade ? 1 : 0}}>
                "{quote}"
              </p>
              <div className="flex gap-2 mb-3">
                <Link to={`/profile/${userProfile?.partnerId}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl font-bold text-sm transition-all hover:opacity-90"
                  style={{background:'#fff0f3', color:'#e8637a', border:'1.5px solid rgba(232,99,122,.2)'}}>
                  👤 โปรไฟล์
                </Link>
                <Link to="/chat"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl font-bold text-sm transition-all hover:opacity-90"
                  style={{background:'linear-gradient(135deg,#e8637a,#1da0bc)', color:'white'}}>
                  <FiMessageCircle size={15}/> แชท
                </Link>
              </div>
              <p className="font-display italic text-center"
                style={{fontSize:'0.62rem', color:'#e8c5cc', letterSpacing:'0.04em'}}>
                Made with 💕 for you two
              </p>
            </div>
          </>
        ) : !isLocal ? (
          <div className="bg-white p-6">
            <div className="text-5xl mb-3">💕</div>
            <p className="font-bold text-gray-700 mb-1">ยังไม่มีคู่รัก</p>
            <p className="text-gray-400 text-sm mb-4">เชื่อมต่อเพื่อทำกิจกรรมร่วมกัน</p>
            <Link to="/find-partner"
              className="flex items-center justify-center w-full py-2.5 rounded-2xl font-bold text-sm text-white"
              style={{background:'linear-gradient(135deg,#e8637a,#1da0bc)'}}>
              เชื่อมต่อเลย
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ── Story circles (mobile) ── */
function StoryCircle({ a, hasPartner }) {
  const { Icon } = a;
  return (
    <Link
      to={hasPartner ? `/activity/${a.id}` : '/find-partner'}
      className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-90 transition-transform">
      <div className="p-[3px] rounded-full"
        style={{background: hasPartner ? `linear-gradient(135deg,${a.from},${a.to})` : '#e5e7eb'}}>
        <div className="w-[58px] h-[58px] rounded-full bg-white flex items-center justify-center"
          style={{border:'2px solid white'}}>
          <Icon size={22} strokeWidth={1.8} color={hasPartner ? a.from : '#d1d5db'}/>
        </div>
      </div>
      <span className="text-center leading-tight font-semibold"
        style={{fontSize:'0.62rem', color: hasPartner ? '#374151' : '#9ca3af', width:68, display:'block'}}>
        {a.title}
      </span>
    </Link>
  );
}

/* ── Desktop activity card ── */
function ActivityCard({ a, hasPartner }) {
  const { Icon } = a;
  return (
    <Link
      to={hasPartner ? `/activity/${a.id}` : '/find-partner'}
      className="bg-white rounded-3xl p-6 flex flex-col items-center gap-3 transition-all hover:-translate-y-1 active:scale-[0.97] group"
      style={{boxShadow:'0 4px 16px rgba(0,0,0,0.06)'}}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
        style={{
          background: hasPartner ? `linear-gradient(135deg,${a.from},${a.to})` : '#f3f4f6',
          boxShadow: hasPartner ? `0 8px 20px ${a.from}35` : 'none',
        }}>
        <Icon size={28} strokeWidth={1.8} color={hasPartner ? 'white' : '#d1d5db'}/>
      </div>
      <div className="text-center">
        <p className="font-bold text-gray-700 text-sm leading-tight">{a.title}</p>
        <p className="text-gray-400 text-xs mt-1 leading-snug">{a.desc}</p>
      </div>
      {!hasPartner && (
        <span className="text-xs font-semibold text-gray-300">🔒 ต้องการคู่รัก</span>
      )}
    </Link>
  );
}

export default function Dashboard() {
  const { currentUser, userProfile, partnerProfile, isLocal } = useAuth();
  const days = userProfile?.relationshipStart
    ? Math.floor((Date.now() - new Date(userProfile.relationshipStart)) / 86400000) : null;
  const hasPartner = isLocal || !!userProfile?.partnerId;
  const coupleId = currentUser && userProfile?.partnerId
    ? [currentUser.uid, userProfile.partnerId].sort().join('_') : null;

  const [memories, setMemories] = useState([]);
  useEffect(() => {
    if (!coupleId) return;
    const q = query(collection(db, 'couples', coupleId, 'memories'), orderBy('createdAt','desc'), limit(6));
    return onSnapshot(q, snap => setMemories(snap.docs.map(d => ({ id:d.id, ...d.data() }))));
  }, [coupleId]);

  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [quoteFade, setQuoteFade] = useState(true);
  useEffect(() => {
    const t = setInterval(() => {
      setQuoteFade(false);
      setTimeout(() => {
        setQuoteIdx(i => (i + 1) % QUOTES.length);
        setQuoteFade(true);
      }, 400);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen" style={{background:'#fafafa'}}>
      <Navbar/>

      {/* Mobile-only sticky top bar */}
      <div
        className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-12"
        style={{
          background:'rgba(255,255,255,0.97)',
          backdropFilter:'blur(16px)',
          WebkitBackdropFilter:'blur(16px)',
          borderBottom:'1px solid #f0f0f0',
        }}>
        <span className="font-display font-bold text-xl text-gradient">MissU</span>
        <Link to="/chat"
          className="w-9 h-9 flex items-center justify-center rounded-full"
          style={{background:'#fff0f3'}}>
          <FiMessageCircle size={20} color="#e8637a" strokeWidth={2}/>
        </Link>
      </div>

      {/* ── Main layout ── */}
      <div className="max-w-6xl mx-auto px-5 pt-6 pb-36 md:pb-12 md:flex md:gap-8">

        {/* Desktop sidebar */}
        <CoupleSidebar
          userProfile={userProfile}
          partnerProfile={partnerProfile}
          isLocal={isLocal}
          days={days}
          quote={QUOTES[quoteIdx]}
          quoteFade={quoteFade}
        />

        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* ── Mobile: couple header ── */}
          <div className="md:hidden">
            {(hasPartner && (partnerProfile || isLocal)) ? (
              <div className="rounded-3xl mb-5 overflow-hidden"
                style={{boxShadow:'0 8px 32px rgba(232,99,122,0.18)'}}>
                {/* Gradient top section */}
                <div className="relative px-5 pt-6 pb-6 text-center"
                  style={{background:'linear-gradient(135deg,#f43f5e,#c026d3,#7c3aed)'}}>
                  {/* Decorative circles */}
                  <div style={{position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:'rgba(255,255,255,0.07)'}}/>
                  <div style={{position:'absolute',bottom:-30,left:-10,width:80,height:80,borderRadius:'50%',background:'rgba(255,255,255,0.05)'}}/>
                  {/* Avatars */}
                  <div className="flex items-center justify-between">
                    <AvatarBubble profile={userProfile} label="ฉัน" ringFrom="#fff" ringTo="#fce7f3" size={15}/>
                    <div className="flex flex-col items-center flex-1">
                      <div className="font-black leading-none text-white"
                        style={{fontSize:'clamp(3rem,10vw,3.5rem)', fontFamily:"'Nunito',sans-serif", textShadow:'0 2px 12px rgba(0,0,0,0.2)'}}>
                        {days !== null && days >= 0 ? days : '—'}
                      </div>
                      <div className="text-xs font-bold mt-1" style={{color:'rgba(255,255,255,0.7)'}}>วันที่อยู่ด้วยกัน</div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="animate-heartbeat text-lg">💕</div>
                        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full"
                          style={{background: userProfile?.streakCount > 0 ? 'rgba(249,115,22,0.9)' : 'rgba(255,255,255,0.2)'}}>
                          <span style={{fontSize:'0.8rem'}}>🔥</span>
                          <span className="text-xs font-black text-white">
                            {userProfile?.streakCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link to={`/profile/${userProfile?.partnerId}`}>
                      <AvatarBubble profile={partnerProfile} label="คู่รัก" ringFrom="#fff" ringTo="#e0e7ff" size={15}/>
                    </Link>
                  </div>
                </div>
                {/* White bottom section */}
                <div className="bg-white px-5 py-4">
                  <p className="font-display italic text-center text-gray-400 text-xs leading-relaxed mb-3"
                    style={{transition:'opacity 0.4s ease', opacity: quoteFade ? 1 : 0}}>
                    "{QUOTES[quoteIdx]}"
                  </p>
                  <div className="flex gap-2 mb-3">
                    <Link to={`/profile/${userProfile?.partnerId}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl font-bold text-sm"
                      style={{background:'#fff0f3', color:'#e8637a'}}>
                      👤 โปรไฟล์
                    </Link>
                    <Link to="/chat"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl font-bold text-sm text-white"
                      style={{background:'linear-gradient(135deg,#e8637a,#1da0bc)'}}>
                      <FiMessageCircle size={15}/> แชท
                    </Link>
                  </div>
                  <p className="font-display italic text-center"
                    style={{fontSize:'0.62rem', color:'#e8c5cc', letterSpacing:'0.04em'}}>
                    Made with 💕 for you two
                  </p>
                </div>
              </div>
            ) : !isLocal ? (
              <Link to="/find-partner"
                className="flex items-center gap-3 bg-white p-4 rounded-2xl mb-5"
                style={{border:'1.5px dashed rgba(232,99,122,.3)'}}>
                <div className="text-3xl">💕</div>
                <div className="flex-1">
                  <p className="font-bold text-gray-700 text-sm">เชื่อมต่อกับคู่รักของคุณ</p>
                  <p className="text-gray-400 text-xs mt-0.5">ทำกิจกรรมร่วมกันได้เลย</p>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-full text-white flex-shrink-0"
                  style={{background:'linear-gradient(135deg,#e8637a,#1da0bc)'}}>
                  เชื่อมต่อ
                </span>
              </Link>
            ) : null}
          </div>

          {/* ── Mobile: story circles ── */}
          <div className="md:hidden bg-white rounded-3xl p-5 mb-6"
            style={{boxShadow:'0 4px 16px rgba(0,0,0,0.06)'}}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5 px-1">กิจกรรมของเรา</p>
            <div className="flex gap-6 overflow-x-auto pb-1 hide-scrollbar">
              {ACTIVITIES.map(a => <StoryCircle key={a.id} a={a} hasPartner={hasPartner}/>)}
            </div>
          </div>

          {/* ── Desktop: activity grid ── */}
          <div className="hidden md:block">
            <p className="font-bold text-gray-600 mb-5" style={{fontSize:'1.05rem'}}>กิจกรรมของเรา</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {ACTIVITIES.map(a => <ActivityCard key={a.id} a={a} hasPartner={hasPartner}/>)}
            </div>
          </div>

          {/* ── Memories preview ── */}
          {memories.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-gray-600 text-sm">ความทรงจำล่าสุด</p>
                <Link to="/activity/memory-wall"
                  className="text-xs font-bold"
                  style={{color:'#14b8a6'}}>ดูทั้งหมด →</Link>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {memories.map(m => (
                  <Link key={m.id} to="/activity/memory-wall"
                    className="rounded-2xl overflow-hidden transition-all hover:scale-[1.03] hover:shadow-lg"
                    style={{background:m.bg||'#fff1f3', boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
                    {m.imageUrl ? (
                      <img src={m.imageUrl} alt="" className="w-full aspect-square object-cover"/>
                    ) : (
                      <div className="aspect-square flex flex-col items-center justify-center p-3">
                        <p className="text-xs font-bold text-gray-700 text-center leading-tight line-clamp-3">{m.title}</p>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
