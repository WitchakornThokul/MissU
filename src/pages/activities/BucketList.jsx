import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import PageHeader from '../../components/PageHeader';
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

const SUGGESTIONS = ['ดูพระอาทิตย์ตกด้วยกัน','ทำอาหารด้วยกัน','ดูหนังกลางแปลง','ไปเที่ยวทะเล','ปลูกต้นไม้ด้วยกัน','เรียนทำเบเกอรี่','ขี่จักรยานตอนเช้า','ถ่ายรูปคู่พิเศษ','ไปดูคอนเสิร์ต','ดูดาวตอนกลางคืน'];

export default function BucketList() {
  const { currentUser, userProfile } = useAuth();
  const coupleId = currentUser && userProfile?.partnerId
    ? [currentUser.uid, userProfile.partnerId].sort().join('_') : null;

  const [items, setItems] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!coupleId) return;
    const q = query(collection(db, 'couples', coupleId, 'bucketItems'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [coupleId]);

  async function addItem(t) {
    if (!t.trim() || !coupleId) return;
    await addDoc(collection(db, 'couples', coupleId, 'bucketItems'), {
      text: t.trim(), done: false, createdAt: serverTimestamp(),
    });
    setText('');
  }

  async function toggle(item) {
    await updateDoc(doc(db, 'couples', coupleId, 'bucketItems', item.id), { done: !item.done });
  }

  async function remove(id) {
    await deleteDoc(doc(db, 'couples', coupleId, 'bucketItems', id));
  }

  const done = items.filter(i=>i.done).length;
  const pct = items.length ? (done/items.length)*100 : 0;

  return (
    <div className="min-h-screen" style={{background:'linear-gradient(160deg,#fff7ed,#fef3c7,#fff1f3)'}}>
      <Navbar />
      <PageHeader emoji="🎯" title="Bucket List คู่รัก" subtitle="สิ่งที่อยากทำด้วยกันในชีวิตนี้" grad="from-orange-400 to-amber-500" />

      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-10">
        {items.length > 0 && (
          <div className="card-love p-5 text-center mb-5 shadow-xl">
            <div className="flex items-center justify-center gap-4 mb-3">
              <span className="font-display font-bold text-5xl text-gradient-gold">{done}</span>
              <span className="text-3xl text-gray-300">/</span>
              <span className="font-display font-bold text-5xl text-gray-300">{items.length}</span>
            </div>
            <div className="h-3 bg-orange-100 rounded-full overflow-hidden">
              <div className="h-3 rounded-full transition-all duration-700"
                style={{width:`${pct}%`, background:'linear-gradient(90deg,#f97316,#f43f5e)'}} />
            </div>
            <p className="text-xs text-gray-400 mt-2 font-semibold">{Math.round(pct)}% ทำสำเร็จแล้ว</p>
          </div>
        )}

        <div className="card-love p-5 mb-5">
          <form onSubmit={e=>{e.preventDefault();addItem(text);}} className="flex gap-2">
            <input value={text} onChange={e=>setText(e.target.value)} placeholder="เพิ่มสิ่งที่อยากทำด้วยกัน..."
              className="input-love flex-1" style={{borderColor:'#fed7aa'}} />
            <button type="submit" className="btn-love px-5 py-2.5 text-sm"
              style={{background:'linear-gradient(135deg,#f97316,#f59e0b)'}}>+</button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTIONS.slice(0,6).map(s=>(
              <button key={s} onClick={()=>addItem(s)}
                className="text-xs px-3 py-1.5 rounded-full font-medium transition-all hover:-translate-y-0.5"
                style={{background:'#fff7ed',border:'1px solid #fed7aa',color:'#c2410c'}}>
                + {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {items.length === 0 && (
            <div className="text-center py-16 text-gray-300">
              <div className="text-6xl mb-3 opacity-40">🎯</div>
              <p className="font-display italic text-xl">เพิ่มความฝันของคุณทั้งคู่!</p>
            </div>
          )}
          {items.map(item=>(
            <div key={item.id} className="bg-white rounded-2xl px-5 py-4 flex items-center gap-3 transition-all"
              style={{border:'1px solid rgba(251,146,60,0.2)', opacity:item.done?0.7:1,
                boxShadow:'0 2px 12px rgba(0,0,0,0.04)'}}>
              <button onClick={()=>toggle(item)}
                className="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all text-sm font-bold"
                style={{
                  background:item.done?'linear-gradient(135deg,#22c55e,#16a34a)':'transparent',
                  borderColor:item.done?'transparent':'#fed7aa',
                  color:'white',
                }}>
                {item.done && '✓'}
              </button>
              <span className={`flex-1 font-medium ${item.done?'line-through text-gray-400':'text-gray-700'}`}>
                {item.text}
              </span>
              <button onClick={()=>remove(item.id)} className="text-gray-200 hover:text-rose-400 text-xl leading-none transition-colors">×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
