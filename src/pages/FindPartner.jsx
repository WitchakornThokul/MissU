import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/>
  </svg>
);
const HeartIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);
const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
  </svg>
);
const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
  </svg>
);
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
  </svg>
);

function Avatar({ user, size = 'md' }) {
  const sz = size === 'lg' ? 'w-16 h-16 text-3xl' : 'w-11 h-11 text-xl';
  if (user?.photoURL) return (
    <img src={user.photoURL} alt="" className={`${sz} rounded-full object-cover flex-shrink-0`}
      style={{boxShadow:'0 2px 10px rgba(0,0,0,.1)'}}/>
  );
  return (
    <div className={`${sz} rounded-full flex items-center justify-center flex-shrink-0`}
      style={{background:'linear-gradient(135deg,#f43f5e,#a855f7)'}}>
      <span>{user?.avatarEmoji || user?.fromEmoji || '💕'}</span>
    </div>
  );
}

export default function FindPartner() {
  const {
    userProfile, partnerProfile,
    searchUsers, sendPartnerRequest, acceptPartnerRequest,
    declinePartnerRequest, removePartner, incomingRequests,
  } = useAuth();
  const navigate = useNavigate();

  const [searchQ, setSearchQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sentTo, setSentTo] = useState(new Set());
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [toast, setToast] = useState('');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const res = await searchUsers(searchQ.trim());
      setResults(res);
    } catch (err) {
      showToast('เกิดข้อผิดพลาด ลองใหม่อีกครั้ง');
    }
    setSearching(false);
  }

  async function handleSend(user) {
    const status = await sendPartnerRequest(user);
    if (status === 'already_sent') {
      showToast('ส่งคำขอไปแล้ว รอการตอบรับ...');
    } else {
      setSentTo(prev => new Set([...prev, user.uid]));
      showToast(`ส่งคำขอถึง ${user.displayName} แล้ว!`);
    }
  }

  async function handleAccept(req) {
    await acceptPartnerRequest(req);
    showToast(`เชื่อมต่อกับ ${req.fromName} สำเร็จ!`);
    setTimeout(() => navigate('/dashboard'), 1200);
  }

  async function handleDecline(req) {
    await declinePartnerRequest(req.id);
    showToast('ปฏิเสธคำขอแล้ว');
  }

  async function handleRemove() {
    await removePartner();
    setConfirmRemove(false);
    showToast('ยกเลิกการเชื่อมต่อแล้ว');
  }

  // ── Already has partner ───────────────────────────────────────
  if (userProfile?.partnerId) {
    return (
      <div className="min-h-screen lg:ml-[260px]" style={{background:'#f8f5f7'}}>
        <Navbar/>
        {toast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-lg animate-fade-up"
            style={{background:'linear-gradient(135deg,#f43f5e,#a855f7)'}}>
            {toast}
          </div>
        )}
        <div className="max-w-lg mx-auto px-4 py-10">
          <h1 className="font-display font-bold text-center mb-1" style={{fontSize:'1.8rem'}}>
            <span className="text-gradient">คู่รักของฉัน</span>
          </h1>
          <p className="text-center text-slate-400 text-sm mb-8">คุณเชื่อมต่อกับคู่รักแล้ว</p>

          <div className="card p-8 text-center mb-4" style={{boxShadow:'0 8px 40px rgba(244,63,94,.12)'}}>
            <div className="flex items-center justify-center gap-4 mb-5">
              <div className="text-center">
                <Avatar user={userProfile} size="lg"/>
                <p className="text-xs font-bold text-slate-500 mt-1.5 max-w-[80px] truncate mx-auto">
                  {userProfile?.displayName}
                </p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-rose-400 animate-heartbeat text-2xl">💕</span>
              </div>
              <div className="text-center">
                <Avatar user={partnerProfile} size="lg"/>
                <p className="text-xs font-bold text-slate-500 mt-1.5 max-w-[80px] truncate mx-auto">
                  {partnerProfile?.displayName}
                </p>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              เชื่อมต่อกันเรียบร้อยแล้ว<br/>ไปทำกิจกรรมสนุกๆ ด้วยกันได้เลย!
            </p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary w-full mb-3">
              ไปหน้าหลัก
            </button>
            {!confirmRemove ? (
              <button onClick={() => setConfirmRemove(true)}
                className="w-full py-2.5 rounded-2xl text-sm font-semibold text-slate-400 hover:text-rose-500 transition-colors flex items-center justify-center gap-2">
                <TrashIcon/> ยกเลิกการเชื่อมต่อ
              </button>
            ) : (
              <div className="rounded-2xl p-4 text-center" style={{background:'#fff1f3'}}>
                <p className="text-sm font-semibold text-rose-600 mb-3">
                  ยืนยันการยกเลิกการเชื่อมต่อ?
                </p>
                <div className="flex gap-2">
                  <button onClick={handleRemove}
                    className="flex-1 py-2 rounded-xl bg-rose-500 text-white text-sm font-bold">
                    ยืนยัน
                  </button>
                  <button onClick={() => setConfirmRemove(false)}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold text-slate-500"
                    style={{background:'#f1f5f9'}}>
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── No partner yet ────────────────────────────────────────────
  return (
    <div className="min-h-screen lg:ml-[260px]" style={{background:'#f8f5f7'}}>
      <Navbar/>
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-lg animate-fade-up"
          style={{background:'linear-gradient(135deg,#f43f5e,#a855f7)'}}>
          {toast}
        </div>
      )}

      {/* Hero */}
      <div className="page-hero">
        <div className="max-w-lg mx-auto relative z-10 text-center">
          <div className="text-4xl mb-3 animate-heartbeat">💕</div>
          <h1 className="font-display font-bold text-white mb-1" style={{fontSize:'1.9rem'}}>
            หาคู่รักของคุณ
          </h1>
          <p className="text-white/60 text-sm">ค้นหาด้วยชื่อ แล้วส่งคำขอเชื่อมต่อ</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 pb-28 md:pb-12 space-y-4">

        {/* Incoming requests */}
        {incomingRequests.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse-soft"/>
              <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">
                คำขอเชื่อมต่อ ({incomingRequests.length})
              </h2>
            </div>
            <div className="space-y-3">
              {incomingRequests.map(req => (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{background:'#fff8f9',border:'1px solid rgba(244,63,94,.1)'}}>
                  <Avatar user={{photoURL: req.fromPhoto, avatarEmoji: req.fromEmoji}}/>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{req.fromName}</p>
                    <p className="text-xs text-slate-400">ต้องการเป็นคู่รักกับคุณ</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleAccept(req)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110"
                      style={{background:'linear-gradient(135deg,#f43f5e,#a855f7)'}}>
                      <CheckIcon/>
                    </button>
                    <button onClick={() => handleDecline(req)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all hover:scale-110"
                      style={{background:'#f1f5f9'}}>
                      <XIcon/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="card p-5">
          <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-4">
            ค้นหาด้วยชื่อ
          </h2>
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="พิมพ์ชื่อเล่น..."
              className="input flex-1"
            />
            <button type="submit" disabled={searching}
              className="btn-primary px-4 flex-shrink-0"
              style={{borderRadius:'12px',padding:'.75rem 1rem'}}>
              {searching
                ? <div className="spinner"/>
                : <SearchIcon/>}
            </button>
          </form>

          {/* Results */}
          {results.length > 0 ? (
            <div className="space-y-2">
              {results.map(user => {
                const isSent = sentTo.has(user.uid);
                return (
                  <div key={user.uid} className="flex items-center gap-3 p-3 rounded-2xl transition-colors"
                    style={{background:'#fafafa',border:'1px solid #f0e8ec'}}>
                    <Avatar user={user}/>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{user.displayName}</p>
                      {user.bio && <p className="text-xs text-slate-400 truncate">{user.bio}</p>}
                    </div>
                    <button
                      onClick={() => handleSend(user)}
                      disabled={isSent}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSent
                          ? 'text-rose-400 cursor-default'
                          : 'text-white hover:scale-105'
                      }`}
                      style={isSent
                        ? {background:'#fff1f3',border:'1px solid rgba(244,63,94,.2)'}
                        : {background:'linear-gradient(135deg,#f43f5e,#a855f7)'}}>
                      {isSent ? (<><CheckIcon/> ส่งแล้ว</>) : (<><HeartIcon/> ส่งคำขอ</>)}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : searchQ && !searching ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">🔍</p>
              <p className="text-slate-400 text-sm">ไม่พบผู้ใช้ชื่อ "{searchQ}"</p>
              <p className="text-slate-300 text-xs mt-1">ลองตรวจสอบการสะกดอีกครั้ง</p>
            </div>
          ) : null}

          {!searchQ && results.length === 0 && (
            <div className="text-center py-6">
              <p className="text-slate-300 text-sm">พิมพ์ชื่อเล่นของคู่รักคุณเพื่อค้นหา</p>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="card p-5">
          <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-3">
            วิธีการเชื่อมต่อ
          </h2>
          <ol className="space-y-2">
            {[
              { n: '1', text: 'ค้นหาชื่อเล่นของคู่รักคุณ' },
              { n: '2', text: 'กดส่งคำขอเชื่อมต่อ' },
              { n: '3', text: 'รอคู่รักกดยอมรับ' },
              { n: '4', text: 'ทำกิจกรรมร่วมกันได้เลย!' },
            ].map(({ n, text }) => (
              <li key={n} className="flex items-center gap-3 text-sm text-slate-600">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{background:'linear-gradient(135deg,#f43f5e,#a855f7)'}}>
                  {n}
                </span>
                {text}
              </li>
            ))}
          </ol>
        </div>

      </div>
    </div>
  );
}
