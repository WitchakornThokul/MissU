import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import PageHeader from '../../components/PageHeader';
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

const DATE_IDEAS = [
  { emoji:'🍣', idea:'ซูชิเดท',         detail:'หาร้านซูชิแสนอร่อย นั่งคุยกันชิวๆ' },
  { emoji:'🎬', idea:'ดูหนังในโรง',      detail:'เลือกหนังที่ทั้งคู่อยากดูด้วยกัน' },
  { emoji:'🌅', idea:'ดูพระอาทิตย์ตก',  detail:'ไปจุดชมวิวสวยๆ ด้วยกัน' },
  { emoji:'🍳', idea:'ทำอาหารที่บ้าน',  detail:'เลือกเมนูพิเศษ ทำร่วมกัน' },
  { emoji:'🎡', idea:'ไปสวนสนุก',        detail:'ขึ้นเครื่องเล่น กินของว่าง สนุกๆ' },
  { emoji:'🌳', idea:'ปิกนิกในสวน',      detail:'เตรียมผ้าปูพื้นและอาหาร' },
  { emoji:'🎭', idea:'ดูการแสดง',         detail:'คอนเสิร์ต ละคร หรือการแสดงสด' },
  { emoji:'🏖️', idea:'ไปทะเล',           detail:'เดินเล่นริมหาด ถ่ายรูปสวยๆ' },
  { emoji:'🎨', idea:'คลาสวาดรูป',       detail:'สร้างงานศิลปะด้วยกัน' },
  { emoji:'🌙', idea:'ดูดาว',             detail:'ไปที่มืดและเงียบ นอนดูดาว' },
  { emoji:'☕', idea:'คาเฟ่โฮป',          detail:'เดินเข้าคาเฟ่สวยๆ หลายเจ้า' },
  { emoji:'🚲', idea:'ขี่จักรยาน',        detail:'ปั่นจักรยานชมวิวสวยๆ' },
];

const SEGMENT_COLORS = [
  '#f43f5e','#ec4899','#a855f7','#6366f1',
  '#3b82f6','#14b8a6','#f97316','#f59e0b',
  '#ef4444','#8b5cf6','#06b6d4','#10b981',
];

export default function DateWheel() {
  const { currentUser, userProfile } = useAuth();
  const coupleId = currentUser && userProfile?.partnerId
    ? [currentUser.uid, userProfile.partnerId].sort().join('_') : null;

  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [history, setHistory] = useState([]);
  const n = DATE_IDEAS.length;
  const seg = 360 / n;

  useEffect(() => {
    if (!coupleId) return;
    const q = query(collection(db, 'couples', coupleId, 'dateHistory'), orderBy('createdAt', 'desc'), limit(5));
    return onSnapshot(q, snap => {
      setHistory(snap.docs.map(d => d.data()));
    });
  }, [coupleId]);

  async function spin() {
    if (spinning) return;
    setSpinning(true); setResult(null);
    const extra = 1440 + Math.random()*1080;
    const newRot = rotation + extra;
    setRotation(newRot);
    setTimeout(async () => {
      const idx = Math.floor(((360-(newRot%360))/360)*n)%n;
      const picked = DATE_IDEAS[idx];
      setResult(picked);
      setSpinning(false);
      if (coupleId) {
        await addDoc(collection(db, 'couples', coupleId, 'dateHistory'), {
          ...picked,
          spunBy: userProfile?.displayName,
          createdAt: serverTimestamp(),
        });
      }
    }, 3000);
  }

  const conicStr = SEGMENT_COLORS.map((c,i)=>`${c} ${i*seg}deg ${(i+1)*seg}deg`).join(',');

  return (
    <div className="min-h-screen" style={{background:'linear-gradient(160deg,#fff1f3,#fce7f3,#f3e8ff)'}}>
      <Navbar />
      <PageHeader emoji="🎲" title="วงล้อเดท" subtitle="สปินเพื่อรับไอเดียเดทสุดพิเศษ!" grad="from-pink-400 to-rose-500" />

      <div className="max-w-lg mx-auto px-4 -mt-6 pb-28 md:pb-12">
        <div className="card-love p-6 text-center mb-5 shadow-xl">
          <div className="relative inline-block mb-6">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 text-3xl drop-shadow-lg">🔻</div>
            <div className="relative w-64 h-64 mx-auto">
              <div className="w-full h-full rounded-full border-4 border-white shadow-2xl"
                style={{
                  background:`conic-gradient(${conicStr})`,
                  transform:`rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 3s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none',
                }}>
                {DATE_IDEAS.map((d,i)=>{
                  const angle = i*seg + seg/2;
                  const rad = (angle-90)*Math.PI/180;
                  const r = 90;
                  const x = 128 + r*Math.cos(rad);
                  const y = 128 + r*Math.sin(rad);
                  return (
                    <div key={i} className="absolute text-lg pointer-events-none"
                      style={{left:x,top:y,transform:'translate(-50%,-50%)'}}>
                      {d.emoji}
                    </div>
                  );
                })}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center text-2xl">💕</div>
              </div>
            </div>
          </div>

          <button onClick={spin} disabled={spinning}
            className={`btn-love px-10 py-4 text-lg ${spinning?'opacity-60':''}`}>
            {spinning ? '🎲 กำลังสปิน...' : '🎲 สปิน!'}
          </button>
        </div>

        {result && (
          <div className="card-love p-6 text-center animate-fade-up shadow-xl mb-5"
            style={{borderTop:'4px solid #f43f5e'}}>
            <div className="text-5xl mb-3 animate-bounce-gentle">{result.emoji}</div>
            <h3 className="font-display text-2xl font-bold text-gray-800 mb-2">{result.idea}</h3>
            <p className="text-gray-500">{result.detail}</p>
          </div>
        )}

        {history.length > 0 && (
          <div className="card-love p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">ผลล่าสุด</p>
            <div className="space-y-2">
              {history.map((h,i)=>(
                <div key={i} className="flex items-center gap-2 text-sm text-gray-500 py-1"
                  style={{borderBottom:'1px solid #fce7f3'}}>
                  <span className="text-xl">{h.emoji}</span>
                  <span className="flex-1">{h.idea}</span>
                  {h.spunBy && <span className="text-xs text-gray-300">{h.spunBy}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
