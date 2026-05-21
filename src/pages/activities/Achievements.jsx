import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import PageHeader from '../../components/PageHeader';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../firebase/config';

const ACHIEVEMENTS = [
  { id:'first_day',    emoji:'🌟', title:'จุดเริ่มต้น',      desc:'วันแรกของความรัก',                check:d=>!!d.relationshipStart },
  { id:'7days',        emoji:'🌈', title:'1 สัปดาห์แล้ว',    desc:'อยู่ด้วยกันมา 7 วัน',             check:d=>d.days>=7 },
  { id:'30days',       emoji:'🌸', title:'ครบเดือน!',         desc:'อยู่ด้วยกันมา 30 วัน',            check:d=>d.days>=30 },
  { id:'100days',      emoji:'💯', title:'100 วัน!',          desc:'ผ่านมาแล้ว 100 วัน',              check:d=>d.days>=100 },
  { id:'365days',      emoji:'🎂', title:'ครบปีแล้ว!',        desc:'ครบรอบ 1 ปีแห่งความรัก',         check:d=>d.days>=365 },
  { id:'profile',      emoji:'✨', title:'ตกแต่งโปรไฟล์',    desc:'เพิ่ม bio ในโปรไฟล์',             check:d=>!!d.bio },
  { id:'first_letter', emoji:'💌', title:'จดหมายฉบับแรก',    desc:'เขียนจดหมายรักครั้งแรก',          check:d=>d.letterCount>0 },
  { id:'letters_5',    emoji:'📮', title:'นักเขียนตัวยง',     desc:'เขียนจดหมายครบ 5 ฉบับ',          check:d=>d.letterCount>=5 },
  { id:'first_memory', emoji:'📸', title:'ความทรงจำแรก',      desc:'บันทึกความทรงจำชิ้นแรก',         check:d=>d.memoryCount>0 },
  { id:'memories_5',   emoji:'🗃️', title:'คลังความทรงจำ',    desc:'บันทึกความทรงจำครบ 5 ชิ้น',       check:d=>d.memoryCount>=5 },
  { id:'bucket_item',  emoji:'🎯', title:'ฝันแรก',            desc:'เพิ่ม Bucket List ข้อแรก',        check:d=>d.bucketCount>0 },
  { id:'bucket_done',  emoji:'🏆', title:'ทำสำเร็จแล้ว!',    desc:'ทำสิ่งใน Bucket List สำเร็จ',     check:d=>d.bucketDone>0 },
  { id:'first_note',   emoji:'💝', title:'ความรู้สึกวันนี้',  desc:'บันทึกอารมณ์วันแรก',              check:d=>d.noteCount>0 },
  { id:'notes_7',      emoji:'📔', title:'ไดอารี่คู่รัก',     desc:'บันทึกอารมณ์ครบ 7 วัน',          check:d=>d.noteCount>=7 },
  { id:'date_spun',    emoji:'🎲', title:'นักเดทสายลุย',      desc:'สปินวงล้อเดทครั้งแรก',            check:d=>d.dateSpun>0 },
  { id:'quiz_done',    emoji:'🧠', title:'รู้จักกันดี',        desc:'เล่นควิซรู้จักกัน',               check:d=>d.quizDone>0 },
];

export default function Achievements() {
  const { currentUser, userProfile } = useAuth();
  const coupleId = currentUser && userProfile?.partnerId
    ? [currentUser.uid, userProfile.partnerId].sort().join('_') : null;

  const [stats, setStats] = useState({
    letterCount: 0, memoryCount: 0, bucketCount: 0,
    bucketDone: 0, noteCount: 0, dateSpun: 0, quizDone: 0,
  });

  useEffect(() => {
    if (!coupleId) return;
    const unsubs = [];
    unsubs.push(onSnapshot(query(collection(db, 'couples', coupleId, 'letters')),
      snap => setStats(s => ({ ...s, letterCount: snap.size }))));
    unsubs.push(onSnapshot(query(collection(db, 'couples', coupleId, 'memories')),
      snap => setStats(s => ({ ...s, memoryCount: snap.size }))));
    unsubs.push(onSnapshot(query(collection(db, 'couples', coupleId, 'bucketItems')),
      snap => setStats(s => ({ ...s, bucketCount: snap.size, bucketDone: snap.docs.filter(d=>d.data().done).length }))));
    unsubs.push(onSnapshot(query(collection(db, 'couples', coupleId, 'dailyNotes')),
      snap => setStats(s => ({ ...s, noteCount: snap.docs.filter(d=>d.data().authorId===currentUser.uid).length }))));
    unsubs.push(onSnapshot(query(collection(db, 'couples', coupleId, 'dateHistory')),
      snap => setStats(s => ({ ...s, dateSpun: snap.size }))));
    unsubs.push(onSnapshot(query(collection(db, 'couples', coupleId, 'quiz')),
      snap => setStats(s => ({ ...s, quizDone: snap.docs.some(d=>d.id===currentUser.uid) ? 1 : 0 }))));
    return () => unsubs.forEach(u => u());
  }, [coupleId]);

  const days = userProfile?.relationshipStart
    ? Math.floor((new Date() - new Date(userProfile.relationshipStart))/86400000) : 0;
  const data = { ...stats, days, relationshipStart: userProfile?.relationshipStart, bio: userProfile?.bio };
  const unlocked = ACHIEVEMENTS.filter(a => a.check(data));
  const locked = ACHIEVEMENTS.filter(a => !a.check(data));
  const pct = Math.round((unlocked.length/ACHIEVEMENTS.length)*100);

  return (
    <div className="min-h-screen" style={{background:'linear-gradient(160deg,#fffbeb,#fef3c7,#fff7ed)'}}>
      <Navbar />
      <PageHeader emoji="🏆" title="ความสำเร็จ" subtitle="ปลดล็อกความสำเร็จร่วมกัน" grad="from-amber-400 to-yellow-500" />

      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-28 md:pb-12">
        <div className="card-love p-5 text-center mb-5 shadow-xl">
          <div className="font-display font-bold text-5xl text-gradient-gold mb-1">{unlocked.length}/{ACHIEVEMENTS.length}</div>
          <p className="text-gray-400 text-sm font-semibold mb-3">ปลดล็อคแล้ว</p>
          <div className="h-3 bg-amber-100 rounded-full overflow-hidden">
            <div className="h-3 rounded-full transition-all duration-700"
              style={{width:`${pct}%`,background:'linear-gradient(90deg,#f59e0b,#f97316)'}} />
          </div>
          <p className="text-xs text-amber-400 font-bold mt-2">{pct}%</p>
        </div>

        {unlocked.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-gray-600 mb-3 flex items-center gap-2">
              <span>🎉</span> ปลดล็อคแล้ว
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {unlocked.map(a=>(
                <div key={a.id} className="rounded-2xl p-4 text-center"
                  style={{background:'linear-gradient(135deg,#fffbeb,#fef3c7)',border:'2px solid #fcd34d',
                    boxShadow:'0 4px 16px rgba(245,158,11,0.2)'}}>
                  <div className="text-3xl mb-1.5">{a.emoji}</div>
                  <p className="font-bold text-gray-800 text-sm leading-tight">{a.title}</p>
                  <p className="text-xs text-gray-400 mt-1 leading-snug">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {locked.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-300 mb-3 flex items-center gap-2">
              <span>🔒</span> ยังไม่ได้ปลดล็อค
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {locked.map(a=>(
                <div key={a.id} className="rounded-2xl p-4 text-center opacity-50"
                  style={{background:'#f9fafb',border:'1px solid #e5e7eb'}}>
                  <div className="text-3xl mb-1.5 grayscale">{a.emoji}</div>
                  <p className="font-semibold text-gray-400 text-sm leading-tight">{a.title}</p>
                  <p className="text-xs text-gray-300 mt-1 leading-snug">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
