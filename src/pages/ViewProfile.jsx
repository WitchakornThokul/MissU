import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Navbar from '../components/Navbar';

export default function ViewProfile() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'users', uid)).then(snap => {
      if (snap.exists()) setProfile(snap.data());
      setLoading(false);
    });
  }, [uid]);

  const days = profile?.relationshipStart
    ? Math.floor((Date.now() - new Date(profile.relationshipStart)) / 86400000) : null;

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{background:'#f8f5f7'}}>
      <Navbar/>
      <div className="max-w-lg mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center pt-20">
            <div className="w-8 h-8 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin-slow"/>
          </div>
        ) : !profile ? (
          <div className="text-center pt-20">
            <div className="text-5xl mb-4">😕</div>
            <p className="font-bold text-gray-600 mb-2">ไม่พบโปรไฟล์</p>
            <button onClick={() => navigate(-1)} className="btn-primary mt-4">กลับ</button>
          </div>
        ) : (
          <div className="card overflow-hidden" style={{boxShadow:'0 8px 40px rgba(244,63,94,.12)'}}>
            {/* Gradient banner */}
            <div className="relative pt-10 pb-20 px-6"
              style={{background:'linear-gradient(135deg,#f43f5e,#c026d3,#7c3aed)'}}>
              <div className="absolute top-4 right-6 w-20 h-20 rounded-full opacity-10" style={{background:'white'}}/>
              <div className="absolute top-8 right-12 w-8 h-8 rounded-full opacity-10" style={{background:'white'}}/>
            </div>

            {/* Avatar */}
            <div className="relative -mt-14 flex justify-center mb-3">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt=""
                  className="w-28 h-28 rounded-full object-cover border-4 border-white"
                  style={{boxShadow:'0 4px 20px rgba(0,0,0,.15)'}}/>
              ) : (
                <div className="w-28 h-28 rounded-full border-4 border-white flex items-center justify-center text-5xl"
                  style={{background:'linear-gradient(135deg,#f43f5e,#a855f7)', boxShadow:'0 4px 20px rgba(0,0,0,.15)'}}>
                  {profile.avatarEmoji || '💕'}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-center px-6 pb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-0.5">{profile.displayName}</h2>
              {profile.bio && (
                <p className="font-display italic text-slate-500 text-base mb-5">"{profile.bio}"</p>
              )}

              {days !== null && days >= 0 && (
                <div className="flex justify-center gap-3 mb-6">
                  <div className="text-center px-5 py-3 rounded-2xl" style={{background:'#fff1f3'}}>
                    <p className="font-display font-bold text-3xl text-gradient leading-none">{days}</p>
                    <p className="text-xs text-rose-400 font-bold uppercase tracking-wider mt-0.5">วันด้วยกัน</p>
                  </div>
                  {profile.relationshipStart && (
                    <div className="text-center px-5 py-3 rounded-2xl" style={{background:'#f3e8ff'}}>
                      <p className="font-bold text-purple-500 text-base mt-1">
                        {new Date(profile.relationshipStart).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'})}
                      </p>
                      <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mt-0.5">วันแรก</p>
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => navigate(-1)}
                className="w-full py-3 rounded-2xl font-bold text-sm transition-colors"
                style={{background:'#f1f5f9', color:'#64748b'}}>
                ← กลับ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
