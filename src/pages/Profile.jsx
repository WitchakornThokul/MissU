import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

const EMOJIS = ['💕','🌹','🦋','🌸','💖','🍓','🌺','🐱','🐰','🌙','🎀','🍭','🌈','✨','🦄','🍒','🎸','🎹','🌊','🌿'];

const CameraIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);

export default function Profile() {
  const { currentUser, userProfile, partnerProfile, updateUserProfile, updateLocalProfile, uploadProfilePhoto, uploadLocalPhoto, isLocal } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const days = userProfile?.relationshipStart
    ? Math.floor((Date.now() - new Date(userProfile.relationshipStart)) / 86400000) : null;

  function startEdit() {
    setForm({ displayName:userProfile?.displayName||'', bio:userProfile?.bio||'', avatarEmoji:userProfile?.avatarEmoji||'💕', relationshipStart:userProfile?.relationshipStart||'' });
    setEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (isLocal) updateLocalProfile(form);
    else await updateUserProfile(form);
    setSaved(true); setEditing(false);
    setTimeout(()=>setSaved(false), 2500);
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      if (isLocal) await uploadLocalPhoto(file);
      else await uploadProfilePhoto(file);
    } catch(err) { console.error(err); }
    setUploading(false);
  }

  return (
    <div className="min-h-screen" style={{background:'#f8f5f7'}}>
      <Navbar/>
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Top card */}
        <div className="card overflow-hidden mb-4" style={{boxShadow:'0 8px 40px rgba(244,63,94,.12)'}}>
          {/* Gradient header */}
          <div className="relative pt-12 pb-20 px-6 text-center"
            style={{background:'linear-gradient(135deg,#f43f5e,#c026d3,#7c3aed)'}}>
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full" style={{background:'rgba(255,255,255,0.07)',transform:'translate(30%,-30%)'}}/>
            <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full" style={{background:'rgba(255,255,255,0.06)'}}/>
            <div className="absolute top-6 left-8 w-8 h-8 rounded-full" style={{background:'rgba(255,255,255,0.08)'}}/>
          </div>

          {/* Avatar — overlaps gradient */}
          <div className="relative -mt-14 flex justify-center mb-3">
            <div className="relative">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="profile"
                  className="w-28 h-28 rounded-full object-cover border-4 border-white"
                  style={{boxShadow:'0 4px 20px rgba(0,0,0,.15)'}}/>
              ) : (
                <div className="w-28 h-28 rounded-full border-4 border-white flex items-center justify-center text-5xl"
                  style={{background:'linear-gradient(135deg,#f43f5e,#a855f7)',boxShadow:'0 4px 20px rgba(0,0,0,.15)'}}>
                  {userProfile?.avatarEmoji||'💕'}
                </div>
              )}
              {/* Camera button */}
              <button onClick={()=>fileRef.current?.click()}
                className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-white flex items-center justify-center transition-all hover:scale-110 text-rose-500"
                style={{boxShadow:'0 2px 10px rgba(0,0,0,.2)',border:'2px solid #fff1f3'}}>
                {uploading
                  ? <div className="w-4 h-4 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin-slow"/>
                  : <CameraIcon/>}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto}/>
            </div>
          </div>

          {/* Info */}
          <div className="text-center px-6 pb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-0.5">{userProfile?.displayName}</h2>
            <p className="text-sm text-slate-400 mb-3">{userProfile?.email||'Local Account'}</p>
            {userProfile?.bio && <p className="font-display italic text-slate-500 text-base mb-4">"{userProfile.bio}"</p>}

            {/* Stats row — only show if has partner */}
            {userProfile?.partnerId && days !== null && days >= 0 && (
              <div className="mb-5">
                {/* Partner name */}
                {partnerProfile && (
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="text-rose-300">💕</span>
                    <Link to={`/profile/${userProfile.partnerId}`}
                      className="font-bold text-rose-400 hover:text-rose-500 transition-colors"
                      style={{ fontSize: '0.9rem' }}>
                      {partnerProfile.displayName}
                    </Link>
                  </div>
                )}
                <div className="flex justify-center gap-3">
                  <div className="text-center px-6 py-3.5 rounded-2xl flex-1"
                    style={{background:'linear-gradient(135deg,#fff1f3,#ffe4e9)',border:'1px solid rgba(244,63,94,0.12)',boxShadow:'0 2px 12px rgba(244,63,94,0.08)'}}>
                    <p className="font-display font-bold text-4xl text-gradient leading-none">{days}</p>
                    <p className="text-xs text-rose-400 font-bold uppercase tracking-wider mt-1">วันด้วยกัน</p>
                  </div>
                  {userProfile?.relationshipStart && (
                    <div className="text-center px-6 py-3.5 rounded-2xl flex-1"
                      style={{background:'linear-gradient(135deg,#f3e8ff,#ede9fe)',border:'1px solid rgba(168,85,247,0.12)',boxShadow:'0 2px 12px rgba(168,85,247,0.08)'}}>
                      <p className="font-bold text-purple-500 text-base mt-1">
                        {new Date(userProfile.relationshipStart).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'})}
                      </p>
                      <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mt-0.5">วันแรก</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isLocal && <div className="badge badge-yellow mb-4 mx-auto">📱 Local Mode</div>}
            {saved && <div className="badge badge-green mb-4 mx-auto">✓ บันทึกแล้ว</div>}

            {!editing ? (
              <button onClick={startEdit} className="btn-primary w-full">แก้ไขโปรไฟล์</button>
            ) : (
              <form onSubmit={handleSave} className="text-left space-y-4 pt-2">
                <div>
                  <label className="input-label">เลือก Emoji</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {EMOJIS.map(e=>(
                      <button key={e} type="button" onClick={()=>setForm(f=>({...f,avatarEmoji:e}))}
                        className={`text-xl p-1.5 rounded-xl transition-all ${form.avatarEmoji===e?'scale-110 shadow':'opacity-40 hover:opacity-80'}`}
                        style={form.avatarEmoji===e?{background:'#fff1f3',outline:'2px solid #f43f5e'}:{}}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="input-label">ชื่อเล่น</label>
                  <input value={form.displayName} onChange={e=>setForm(f=>({...f,displayName:e.target.value}))} className="input" required maxLength={50}/>
                </div>
                <div>
                  <label className="input-label">Bio</label>
                  <textarea value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))}
                    placeholder="เขียนอะไรสักอย่างเกี่ยวกับตัวเอง..."
                    className="input resize-none h-20" style={{resize:'none'}} maxLength={200}/>
                </div>
                <div>
                  <label className="input-label">วันที่เริ่มคบกัน</label>
                  <input type="date" value={form.relationshipStart} onChange={e=>setForm(f=>({...f,relationshipStart:e.target.value}))} className="input"/>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="submit" className="btn-primary flex-1 justify-center">บันทึก</button>
                  <button type="button" onClick={()=>setEditing(false)}
                    className="flex-1 py-3 rounded-2xl font-bold text-sm text-slate-500 transition-colors hover:text-slate-700"
                    style={{background:'#f1f5f9'}}>
                    ยกเลิก
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
