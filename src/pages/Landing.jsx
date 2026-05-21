import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MissULogo } from '../components/MissULogo';

const FLOATS = [
  { emoji:'💕', s:'text-3xl', top:'8%',  left:'5%',   cls:'animate-float-a delay-0' },
  { emoji:'🌸', s:'text-2xl', top:'12%', left:'88%',  cls:'animate-float-b delay-500' },
  { emoji:'💖', s:'text-3xl', top:'68%', left:'4%',   cls:'animate-float-c delay-1000' },
  { emoji:'✨', s:'text-xl',  top:'30%', left:'93%',  cls:'animate-sparkle delay-300' },
  { emoji:'🌹', s:'text-2xl', top:'80%', left:'82%',  cls:'animate-float-b delay-1500' },
  { emoji:'💫', s:'text-xl',  top:'50%', left:'2%',   cls:'animate-sparkle delay-700' },
  { emoji:'🦋', s:'text-2xl', top:'44%', left:'91%',  cls:'animate-float-a delay-2000' },
];

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);

export default function Landing() {
  const [mode, setMode] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const go = () => navigate('/dashboard');

  async function handleGoogle() {
    setGoogleLoading(true); setError('');
    try { await loginWithGoogle(); go(); }
    catch { setError('เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่'); }
    setGoogleLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password, name);
      go();
    } catch(err) {
      const msg = err?.message || '';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential'))
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      else if (msg.includes('email-already-in-use'))
        setError('อีเมลนี้ถูกใช้งานแล้ว');
      else
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{background:'linear-gradient(150deg, #0f1f2b 0%, #0d2233 40%, #0a1420 100%)'}}>

      {/* Ambient glow */}
      <div className="absolute pointer-events-none" style={{top:'15%',left:'10%',width:420,height:420,borderRadius:'50%',background:'radial-gradient(circle,rgba(232,99,122,.10) 0%,transparent 70%)'}}/>
      <div className="absolute pointer-events-none" style={{bottom:'15%',right:'10%',width:380,height:380,borderRadius:'50%',background:'radial-gradient(circle,rgba(29,160,188,.10) 0%,transparent 70%)'}}/>
      <div className="absolute pointer-events-none" style={{top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(255,255,255,.02) 0%,transparent 60%)'}}/>

      {/* Floating decorations */}
      {FLOATS.map((f,i) => (
        <div key={i} className={`absolute select-none pointer-events-none ${f.s} ${f.cls}`}
          style={{top:f.top, left:f.left}}>{f.emoji}</div>
      ))}

      {/* Main card */}
      <div className="relative z-10 w-full max-w-[420px] mx-auto px-5 py-10">

        {!mode ? (
          /* ── Home screen ── */
          <div className="animate-fade-up flex flex-col items-center">

            {/* Logo centered */}
            <div className="mb-10">
              <MissULogo iconSize={72} textSize="2.6rem" showTagline={true} dark={false}/>
            </div>

            {/* Auth options */}
            <div className="w-full space-y-5">
              {/* Google */}
              <button onClick={handleGoogle} disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 font-semibold text-sm transition-all"
                style={{
                  background:'white', color:'#3c4043',
                  borderRadius:14, padding:'0.9rem 1.6rem',
                  boxShadow:'0 2px 16px rgba(0,0,0,.25)',
                  border:'none', cursor:'pointer',
                }}>
                {googleLoading
                  ? <div className="w-5 h-5 border-2 border-gray-300 border-t-rose-500 rounded-full animate-spin-slow"/>
                  : <GoogleIcon/>}
                {googleLoading ? 'กำลังเข้าสู่ระบบ...' : 'Continue with Google'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-0.5">
                <div className="flex-1 h-px" style={{background:'rgba(255,255,255,.08)'}}/>
                <span style={{color:'rgba(255,255,255,.25)',fontSize:'.75rem',fontWeight:600}}>หรือ</span>
                <div className="flex-1 h-px" style={{background:'rgba(255,255,255,.08)'}}/>
              </div>

              {/* Email login */}
              <button onClick={() => setMode('login')}
                className="w-full font-bold text-sm text-white flex items-center justify-center"
                style={{
                  background:'linear-gradient(135deg,#e8637a,#d44f66)',
                  borderRadius:14, padding:'0.9rem 1.6rem', border:'none', cursor:'pointer',
                  boxShadow:'0 4px 20px rgba(232,99,122,.4)',
                }}>
                เข้าสู่ระบบ
              </button>

              {/* Register */}
              <button onClick={() => setMode('register')}
                className="w-full font-bold text-sm flex items-center justify-center"
                style={{
                  background:'rgba(255,255,255,.06)',
                  border:'1.5px solid rgba(255,255,255,.14)',
                  color:'rgba(255,255,255,.85)',
                  borderRadius:14, padding:'0.9rem 1.6rem', cursor:'pointer',
                }}>
                สมัครสมาชิกใหม่
              </button>

            </div>

            <p className="text-center mt-8 text-xs" style={{color:'rgba(255,255,255,.18)'}}>
              พื้นที่พิเศษสำหรับสองคน
            </p>
          </div>

        ) : (
          /* ── Auth card ── */
          <div className="animate-scale-in rounded-3xl relative overflow-hidden"
            style={{
              background:'rgba(255,255,255,.06)',
              backdropFilter:'blur(28px)',
              WebkitBackdropFilter:'blur(28px)',
              border:'1px solid rgba(255,255,255,.10)',
              padding:'2rem',
            }}>

            {/* Card inner top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px"
              style={{background:'linear-gradient(90deg,transparent,rgba(29,160,188,.4),transparent)'}}/>

            {/* Back */}
            <button onClick={() => { setMode(null); setError(''); }}
              className="flex items-center gap-1.5 text-sm mb-6 transition-colors"
              style={{color:'rgba(255,255,255,.35)',background:'none',border:'none',cursor:'pointer',padding:0}}>
              <BackIcon/> กลับ
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl"
                style={{
                  background: mode === 'login' ? 'rgba(232,99,122,.12)' : 'rgba(29,160,188,.12)',
                  border: '1px solid rgba(255,255,255,.08)',
                }}>
                {mode === 'login' ? '🔑' : '✨'}
              </div>
              <h2 style={{fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:'1.4rem',color:'white',letterSpacing:'-0.3px'}}>
                {mode === 'login' ? 'ยินดีต้อนรับกลับ' : 'เริ่มต้นใหม่'}
              </h2>
              <p style={{color:'rgba(255,255,255,.35)',fontSize:'.82rem',marginTop:4}}>
                {mode === 'login' ? 'เข้าสู่ระบบเพื่อใช้งาน' : 'สร้างบัญชีใหม่'}
              </p>
            </div>

            {/* Google */}
            <>
                <button onClick={handleGoogle} disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-2.5 font-semibold text-sm mb-5 transition-all"
                  style={{
                    background:'white',color:'#3c4043',borderRadius:12,
                    padding:'.8rem 1.2rem',border:'none',cursor:'pointer',
                    boxShadow:'0 2px 12px rgba(0,0,0,.2)',
                  }}>
                  {googleLoading
                    ? <div className="w-4 h-4 border-2 border-gray-300 border-t-rose-500 rounded-full animate-spin-slow"/>
                    : <GoogleIcon/>}
                  Continue with Google
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px" style={{background:'rgba(255,255,255,.08)'}}/>
                  <span style={{color:'rgba(255,255,255,.25)',fontSize:'.73rem',fontWeight:600}}>หรือใช้อีเมล</span>
                  <div className="flex-1 h-px" style={{background:'rgba(255,255,255,.08)'}}/>
                </div>
            </>

            {/* Error */}
            {error && (
              <div className="mb-4 py-2.5 px-4 rounded-2xl text-sm text-center"
                style={{background:'rgba(232,99,122,.15)',border:'1px solid rgba(232,99,122,.3)',color:'#ffb3bf'}}>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="input-label" style={{color:'rgba(255,255,255,.35)'}}>ชื่อเล่น</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="ชื่อของคุณ" required autoComplete="nickname"
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                    style={{
                      fontFamily:"'Nunito',sans-serif",
                      background:'rgba(255,255,255,.10)',
                      border:'1.5px solid rgba(255,255,255,.18)',
                      color:'white',
                      colorScheme:'dark',
                    }}/>
                </div>
              )}
              <div>
                <label className="input-label" style={{color:'rgba(255,255,255,.35)'}}>อีเมล</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required autoComplete="email"
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{
                    fontFamily:"'Nunito',sans-serif",
                    background:'rgba(255,255,255,.10)',
                    border:'1.5px solid rgba(255,255,255,.18)',
                    color:'white',
                    colorScheme:'dark',
                  }}/>
              </div>
              <div>
                <label className="input-label" style={{color:'rgba(255,255,255,.35)'}}>รหัสผ่าน</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                  style={{
                    fontFamily:"'Nunito',sans-serif",
                    background:'rgba(255,255,255,.10)',
                    border:'1.5px solid rgba(255,255,255,.18)',
                    color:'white',
                    colorScheme:'dark',
                  }}/>
              </div>
              <div className="pt-1">
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2"
                  style={{
                    background:'linear-gradient(135deg,#e8637a,#d44f66)',
                    boxShadow:'0 4px 20px rgba(232,99,122,.4)',
                    border:'none', cursor:'pointer',
                    opacity: loading ? 0.7 : 1,
                  }}>
                  {loading && <div className="spinner"/>}
                  {loading ? 'กำลังดำเนินการ...'
                    : mode === 'login' ? 'เข้าสู่ระบบ'
                    : mode === 'register' ? 'สร้างบัญชี'
                    : 'เริ่มต้นเลย'}
                </button>
              </div>
            </form>

            {mode === 'login' && (
              <p className="text-center text-xs mt-4" style={{color:'rgba(255,255,255,.25)'}}>
                ยังไม่มีบัญชี?{' '}
                <button onClick={() => { setMode('register'); setError(''); }}
                  className="font-bold" style={{color:'#ffb3bf',background:'none',border:'none',cursor:'pointer'}}>
                  สมัครสมาชิก
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
