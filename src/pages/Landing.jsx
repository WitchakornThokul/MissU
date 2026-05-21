import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const EMOJIS = ['💕','🌹','🦋','🌸','💖','🍓','🌺','🐱','🐰','🌙'];

const FLOATS = [
  { emoji:'💕', s:'text-3xl', top:'7%',  left:'6%',   cls:'animate-float-a', d:'delay-0' },
  { emoji:'🌸', s:'text-2xl', top:'14%', left:'87%',  cls:'animate-float-b', d:'delay-500' },
  { emoji:'💖', s:'text-4xl', top:'70%', left:'5%',   cls:'animate-float-c', d:'delay-1000' },
  { emoji:'✨', s:'text-xl',  top:'28%', left:'92%',  cls:'animate-sparkle', d:'delay-300' },
  { emoji:'🌹', s:'text-2xl', top:'82%', left:'80%',  cls:'animate-float-b', d:'delay-1500' },
  { emoji:'💫', s:'text-xl',  top:'52%', left:'3%',   cls:'animate-sparkle', d:'delay-700' },
  { emoji:'🦋', s:'text-2xl', top:'42%', left:'90%',  cls:'animate-float-a', d:'delay-2000' },
];

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function Landing() {
  const [mode, setMode] = useState(null); // null | 'login' | 'register' | 'local'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('💕');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, register, loginWithGoogle, loginLocal } = useAuth();
  const navigate = useNavigate();

  const go = () => navigate('/dashboard');

  async function handleGoogle() {
    setGoogleLoading(true); setError('');
    try { await loginWithGoogle(); go(); }
    catch(e) { setError('เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่'); }
    setGoogleLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else if (mode === 'register') await register(email, password, name);
      else { loginLocal(name.trim(), emoji); setLoading(false); go(); return; }
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
      style={{background:'linear-gradient(140deg,#1e0a2e 0%,#2d0a1e 40%,#0e0720 100%)'}}>

      {/* Ambient glows */}
      <div className="absolute pointer-events-none" style={{top:'20%',left:'15%',width:380,height:380,borderRadius:'50%',background:'radial-gradient(circle,rgba(244,63,94,.12) 0%,transparent 70%)'}}/>
      <div className="absolute pointer-events-none" style={{bottom:'20%',right:'15%',width:320,height:320,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,.12) 0%,transparent 70%)'}}/>

      {/* Floating decorations */}
      {FLOATS.map((f,i)=>(
        <div key={i} className={`absolute select-none pointer-events-none ${f.s} ${f.cls} ${f.d}`} style={{top:f.top,left:f.left}}>{f.emoji}</div>
      ))}

      <div className="relative z-10 w-full max-w-[400px] mx-auto px-5 py-8">
        {!mode ? (
          /* ── Home screen ── */
          <div className="animate-fade-up text-center">
            <div className="text-7xl mb-5 animate-heartbeat">💕</div>
            <h1 className="font-display font-bold text-white mb-1" style={{fontSize:'3.5rem',letterSpacing:'-1.5px',lineHeight:1}}>MissU</h1>
            <p className="text-white/50 font-display italic text-lg mb-10">พื้นที่พิเศษสำหรับสองคน</p>

            <div className="space-y-3">
              {/* Google */}
              <button onClick={handleGoogle} disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-semibold text-sm transition-all"
                style={{background:'white',color:'#3c4043',boxShadow:'0 2px 12px rgba(0,0,0,.2)'}}>
                {googleLoading ? <div className="w-5 h-5 border-2 border-gray-300 border-t-rose-500 rounded-full animate-spin-slow"/> : <GoogleIcon/>}
                {googleLoading ? 'กำลังเข้าสู่ระบบ...' : 'Continue with Google'}
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px" style={{background:'rgba(255,255,255,.1)'}}/>
                <span style={{color:'rgba(255,255,255,.3)',fontSize:'.75rem'}}>หรือ</span>
                <div className="flex-1 h-px" style={{background:'rgba(255,255,255,.1)'}}/>
              </div>

              <button onClick={()=>setMode('login')}
                className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all"
                style={{background:'linear-gradient(135deg,#f43f5e,#e11d48)',color:'white',boxShadow:'0 4px 16px rgba(244,63,94,.4)'}}>
                เข้าสู่ระบบด้วยอีเมล
              </button>
              <button onClick={()=>setMode('register')}
                className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all"
                style={{background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.12)',color:'rgba(255,255,255,.85)'}}>
                สมัครสมาชิกใหม่
              </button>
              <button onClick={()=>setMode('local')}
                className="w-full py-3 rounded-2xl font-semibold text-sm transition-all"
                style={{background:'transparent',border:'1.5px solid rgba(244,63,94,.35)',color:'#fca5a5'}}>
                ใช้งานแบบออฟไลน์ (Local)
              </button>
            </div>
          </div>
        ) : (
          /* ── Auth card ── */
          <div className="animate-scale-in rounded-3xl p-7 relative"
            style={{background:'rgba(255,255,255,.06)',backdropFilter:'blur(24px)',border:'1px solid rgba(255,255,255,.1)'}}>

            <button onClick={()=>{setMode(null);setError('');}}
              className="flex items-center gap-1.5 text-sm mb-5 transition-colors"
              style={{color:'rgba(255,255,255,.4)'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              กลับ
            </button>

            <div className="text-center mb-6">
              <div className="text-4xl mb-2">{mode==='login'?'🔑':mode==='register'?'✨':'📱'}</div>
              <h2 className="font-display text-2xl font-semibold text-white">
                {mode==='login'?'ยินดีต้อนรับกลับ':mode==='register'?'เริ่มต้นใหม่':'ใช้งานแบบ Local'}
              </h2>
            </div>

            {/* Google button (login/register only) */}
            {mode !== 'local' && (
              <>
                <button onClick={handleGoogle} disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl text-sm font-semibold mb-4 transition-all"
                  style={{background:'white',color:'#3c4043',boxShadow:'0 2px 12px rgba(0,0,0,.2)'}}>
                  {googleLoading ? <div className="w-4 h-4 border-2 border-gray-300 border-t-rose-500 rounded-full animate-spin-slow"/> : <GoogleIcon/>}
                  Continue with Google
                </button>
                <div className="divider mb-4" style={{color:'rgba(255,255,255,.25)'}}>
                  <div className="flex-1 h-px" style={{background:'rgba(255,255,255,.1)'}}/>
                  <span className="text-xs px-2">หรือใช้อีเมล</span>
                  <div className="flex-1 h-px" style={{background:'rgba(255,255,255,.1)'}}/>
                </div>
              </>
            )}

            {error && (
              <div className="mb-4 py-2.5 px-4 rounded-xl text-sm text-center"
                style={{background:'rgba(244,63,94,.15)',border:'1px solid rgba(244,63,94,.3)',color:'#fca5a5'}}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {(mode==='register'||mode==='local') && (
                <div>
                  <label className="input-label" style={{color:'rgba(255,255,255,.4)'}}>ชื่อเล่น</label>
                  <input value={name} onChange={e=>setName(e.target.value)} placeholder="ชื่อของคุณ" required
                    className="w-full rounded-2xl px-4 py-3 text-sm outline-none text-white placeholder-white/20"
                    style={{background:'rgba(255,255,255,.07)',border:'1.5px solid rgba(255,255,255,.12)'}}/>
                </div>
              )}
              {mode==='local' && (
                <div>
                  <label className="input-label" style={{color:'rgba(255,255,255,.4)'}}>เลือก Emoji</label>
                  <div className="flex flex-wrap gap-2">
                    {EMOJIS.map(e=>(
                      <button key={e} type="button" onClick={()=>setEmoji(e)}
                        className={`text-xl p-2 rounded-xl transition-all ${emoji===e?'scale-125 shadow-lg':'opacity-50 hover:opacity-100'}`}
                        style={emoji===e?{background:'rgba(255,255,255,.15)'}:{background:'rgba(255,255,255,.05)'}}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {mode!=='local' && (
                <>
                  <div>
                    <label className="input-label" style={{color:'rgba(255,255,255,.4)'}}>อีเมล</label>
                    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required
                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none text-white placeholder-white/20"
                      style={{background:'rgba(255,255,255,.07)',border:'1.5px solid rgba(255,255,255,.12)'}}/>
                  </div>
                  <div>
                    <label className="input-label" style={{color:'rgba(255,255,255,.4)'}}>รหัสผ่าน</label>
                    <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required minLength={6}
                      className="w-full rounded-2xl px-4 py-3 text-sm outline-none text-white placeholder-white/20"
                      style={{background:'rgba(255,255,255,.07)',border:'1.5px solid rgba(255,255,255,.12)'}}/>
                  </div>
                </>
              )}
              <div className="pt-1">
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all"
                  style={{background:'linear-gradient(135deg,#f43f5e,#e11d48)',boxShadow:'0 4px 16px rgba(244,63,94,.4)',opacity:loading?0.7:1}}>
                  {loading && <div className="spinner"/>}
                  {loading ? 'กำลังดำเนินการ...' : mode==='login'?'เข้าสู่ระบบ':mode==='register'?'สร้างบัญชี':'เริ่มต้นเลย'}
                </button>
              </div>
            </form>

            {mode==='login' && (
              <p className="text-center text-xs mt-4" style={{color:'rgba(255,255,255,.3)'}}>
                ยังไม่มีบัญชี?{' '}
                <button onClick={()=>{setMode('register');setError('');}} className="font-bold" style={{color:'#fca5a5'}}>
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
