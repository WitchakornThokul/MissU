import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { FiMessageCircle, FiArrowLeft, FiUserPlus, FiUserCheck } from 'react-icons/fi';

export default function ViewProfile() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { currentUser, getFriendStatus, sendFriendRequest, userProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState('none');
  const [adding, setAdding] = useState(false);

  const isOwn = currentUser?.uid === uid;

  useEffect(() => {
    getDoc(doc(db, 'users', uid)).then(async snap => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        // Fetch partner profile if exists
        if (data.partnerId) {
          const partnerSnap = await getDoc(doc(db, 'users', data.partnerId));
          if (partnerSnap.exists()) setPartnerProfile(partnerSnap.data());
        }
      }
      setLoading(false);
    });
  }, [uid]);

  useEffect(() => {
    if (!currentUser || isOwn) return;
    getFriendStatus(uid).then(setFriendStatus);
  }, [uid, currentUser, isOwn]);

  const days = profile?.partnerId && profile?.relationshipStart
    ? Math.floor((Date.now() - new Date(profile.relationshipStart)) / 86400000) : null;

  async function handleAdd() {
    if (!profile) return;
    setAdding(true);
    await sendFriendRequest(profile);
    setFriendStatus('sent');
    setAdding(false);
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: 'linear-gradient(180deg,#fdf4ff 0%,#f4eef8 100%)' }}>
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center pt-20">
            <div className="w-8 h-8 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin-slow" />
          </div>
        ) : !profile ? (
          <div className="text-center pt-20">
            <div className="text-5xl mb-4">😕</div>
            <p className="font-bold text-slate-600 mb-2">ไม่พบโปรไฟล์</p>
            <button onClick={() => navigate(-1)} className="btn-primary mt-4">กลับ</button>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 32px rgba(244,63,94,0.10)' }}>

            {/* Gradient banner */}
            <div className="relative pt-12 pb-20 px-6"
              style={{ background: 'linear-gradient(135deg,#f43f5e,#c026d3,#7c3aed)' }}>
              <div style={{ position: 'absolute', top: -24, right: -24, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
              <div style={{ position: 'absolute', bottom: -20, left: -10, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              {/* Back button */}
              <button onClick={() => navigate(-1)}
                className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', cursor: 'pointer' }}>
                <FiArrowLeft size={18} />
              </button>
            </div>

            {/* Avatar — overlaps banner */}
            <div className="relative -mt-16 flex justify-center mb-4">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt=""
                  className="w-28 h-28 rounded-full object-cover border-4 border-white"
                  style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} />
              ) : (
                <div className="w-28 h-28 rounded-full border-4 border-white flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#f43f5e,#a855f7)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', fontSize: '3rem' }}>
                  {profile.avatarEmoji || '💕'}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-center px-6 pb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-1">{profile.displayName}</h2>
              {profile.bio && (
                <p className="font-display italic text-slate-400 mb-5" style={{ fontSize: '0.95rem' }}>"{profile.bio}"</p>
              )}

              {/* Partner info + days — only if has partner */}
              {profile.partnerId && days !== null && days >= 0 && (
                <div className="mb-6">
                  {/* Partner name */}
                  {partnerProfile && (
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <div className="w-px h-4" style={{ background: '#fda4af' }} />
                      <span style={{ fontSize: '0.82rem', color: '#b0a8bc' }}>คู่รักกับ</span>
                      <Link to={`/profile/${profile.partnerId}`}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full font-bold transition-all hover:opacity-80"
                        style={{ background: '#fff1f3', color: '#e8637a', fontSize: '0.85rem' }}>
                        {partnerProfile.photoURL
                          ? <img src={partnerProfile.photoURL} alt="" className="w-5 h-5 rounded-full object-cover" />
                          : <span style={{ fontSize: '0.9rem' }}>{partnerProfile.avatarEmoji || '💕'}</span>
                        }
                        {partnerProfile.displayName}
                      </Link>
                      <div className="w-px h-4" style={{ background: '#fda4af' }} />
                    </div>
                  )}
                  {/* Stats */}
                  <div className="flex justify-center gap-3">
                    <div className="text-center px-6 py-3.5 rounded-2xl flex-1"
                      style={{ background: 'linear-gradient(135deg,#fff1f3,#ffe4e9)', border: '1px solid rgba(244,63,94,0.12)' }}>
                      <p className="font-bold text-3xl text-gradient leading-none">{days}</p>
                      <p className="text-xs text-rose-400 font-bold uppercase tracking-wider mt-1">วันด้วยกัน</p>
                    </div>
                    {profile.relationshipStart && (
                      <div className="text-center px-6 py-3.5 rounded-2xl flex-1"
                        style={{ background: 'linear-gradient(135deg,#f3e8ff,#ede9fe)', border: '1px solid rgba(168,85,247,0.12)' }}>
                        <p className="font-bold text-purple-500 text-base mt-1">
                          {new Date(profile.relationshipStart).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </p>
                        <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mt-0.5">วันแรก</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {!isOwn && (
                <div className="flex gap-3 mb-4">
                  {/* Message button */}
                  {(friendStatus === 'friends') && (
                    <Link to={`/messages/${uid}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-white transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg,#f43f5e,#a855f7)', fontSize: '0.92rem', boxShadow: '0 4px 16px rgba(244,63,94,0.3)' }}>
                      <FiMessageCircle size={17} />
                      ส่งข้อความ
                    </Link>
                  )}

                  {/* Add friend button */}
                  {friendStatus === 'none' && (
                    <button onClick={handleAdd} disabled={adding}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-white transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', fontSize: '0.92rem', boxShadow: '0 4px 16px rgba(99,102,241,0.25)' }}>
                      {adding
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                        : <><FiUserPlus size={17} /> เพิ่มเพื่อน</>
                      }
                    </button>
                  )}
                  {friendStatus === 'sent' && (
                    <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold"
                      style={{ background: '#f3f4f6', color: '#9ca3af', fontSize: '0.92rem' }}>
                      ส่งคำขอแล้ว
                    </div>
                  )}
                  {friendStatus === 'received' && (
                    <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold"
                      style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '0.92rem' }}>
                      <FiUserCheck size={17} /> รับคำขอใน คนรู้จัก
                    </div>
                  )}
                  {friendStatus === 'friends' && (
                    <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold"
                      style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '0.85rem' }}>
                      <FiUserCheck size={15} /> เพื่อน
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => navigate(-1)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold transition-colors"
                style={{ background: '#f8f4fb', color: '#9ca3af', fontSize: '0.88rem' }}>
                <FiArrowLeft size={15} /> กลับ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
