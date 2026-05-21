import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import PageHeader from '../../components/PageHeader';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

const QUESTIONS = [
  { q:'ของกินที่ฉันชอบที่สุดคืออะไร?',         choices:['ข้าวผัด','พิซซ่า','ซูชิ','ส้มตำ'] },
  { q:'ฉันชอบดูหนังแนวไหนมากที่สุด?',           choices:['โรแมนติก','แอ็คชั่น','ตลก','สยองขวัญ'] },
  { q:'กิจกรรมยามว่างที่ฉันชอบที่สุดคืออะไร?',  choices:['ฟังเพลง','อ่านหนังสือ','เล่นเกม','ดูซีรีส์'] },
  { q:'สีที่ฉันชอบมากที่สุดคือสีอะไร?',         choices:['ชมพู','น้ำเงิน','เขียว','ม่วง'] },
  { q:'ช่วงเวลาที่ฉันชอบที่สุดคือตอนไหน?',      choices:['ตอนเช้า','กลางวัน','เย็น','กลางคืน'] },
  { q:'ฉันชอบเดินทางแบบไหนมากที่สุด?',          choices:['ทะเล','ภูเขา','เมือง','ธรรมชาติ'] },
  { q:'เครื่องดื่มที่ฉันดื่มบ่อยที่สุดคืออะไร?', choices:['น้ำเปล่า','กาแฟ','ชา','น้ำผลไม้'] },
  { q:'สัตว์เลี้ยงในฝันของฉันคืออะไร?',          choices:['แมว','หมา','กระต่าย','นก'] },
];

export default function LoveQuiz() {
  const { currentUser, userProfile } = useAuth();
  const coupleId = currentUser && userProfile?.partnerId
    ? [currentUser.uid, userProfile.partnerId].sort().join('_') : null;

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('menu');
  const [partnerAnswers, setPartnerAnswers] = useState(null);
  const [score, setScore] = useState(null);
  const [myAnswersSaved, setMyAnswersSaved] = useState(false);

  useEffect(() => {
    if (!coupleId || !userProfile?.partnerId) return;
    // Listen for partner's answers
    const unsub = onSnapshot(doc(db, 'couples', coupleId, 'quiz', userProfile.partnerId), snap => {
      if (snap.exists()) setPartnerAnswers(snap.data().answers);
      else setPartnerAnswers(null);
    });
    // Check if I already answered
    getDoc(doc(db, 'couples', coupleId, 'quiz', currentUser.uid)).then(snap => {
      setMyAnswersSaved(snap.exists());
    });
    return unsub;
  }, [coupleId]);

  function startAnswer() { setMode('answer'); setCurrent(0); setAnswers([]); setSelected(null); }

  function startQuiz() {
    if (!partnerAnswers) { alert('ยังไม่มีคำตอบจากคู่รัก รอให้คู่รักตอบก่อนนะ'); return; }
    setMode('quiz'); setCurrent(0); setAnswers([]); setSelected(null);
  }

  async function handleNext() {
    if (selected === null) return;
    const newAns = [...answers, selected];
    if (mode === 'answer' && current === QUESTIONS.length - 1) {
      await setDoc(doc(db, 'couples', coupleId, 'quiz', currentUser.uid), { answers: newAns });
      setMyAnswersSaved(true);
      setMode('done_answer');
    } else if (mode === 'quiz' && current === QUESTIONS.length - 1) {
      setScore(newAns.filter((a, i) => a === partnerAnswers[i]).length);
      setMode('done_quiz');
    } else {
      setAnswers(newAns); setCurrent(c => c + 1); setSelected(null);
    }
  }

  const q = QUESTIONS[current];
  const progress = (current / QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen" style={{background:'linear-gradient(160deg,#eff6ff,#e0e7ff,#f3e8ff)'}}>
      <Navbar />
      <PageHeader emoji="❓" title="รู้จักกันดีแค่ไหน" subtitle="ทดสอบว่าเข้าใจกันมากแค่ไหน" grad="from-blue-400 to-indigo-500" />

      <div className="max-w-lg mx-auto px-4 -mt-6 pb-10">
        {mode==='menu' && (
          <div className="card-love p-8 text-center animate-fade-up shadow-xl">
            <div className="text-6xl mb-4 animate-bounce-gentle">❓</div>
            <h2 className="font-display text-2xl font-bold text-gray-800 mb-2">วิธีเล่น</h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              คนหนึ่งตอบคำถามเกี่ยวกับตัวเอง<br/>
              อีกคนลองทายคำตอบ แล้วดูคะแนน!
            </p>
            <div className="space-y-3">
              <button onClick={startAnswer} className="btn-love w-full py-3.5"
                style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>
                ฉันจะตอบคำถามเกี่ยวกับตัวเอง
              </button>
              <button onClick={startQuiz} className="btn-ghost w-full py-3.5"
                style={{borderColor:'rgba(99,102,241,0.4)',color:'#6366f1'}}>
                ฉันจะทายคำตอบของแฟน
              </button>
              {myAnswersSaved && (
                <p className="text-xs text-green-500 font-medium">✓ คู่รักสามารถทายคำตอบคุณได้แล้ว!</p>
              )}
              {partnerAnswers && (
                <p className="text-xs text-indigo-500 font-medium">✓ คู่รักตอบคำถามแล้ว พร้อมทายได้เลย!</p>
              )}
            </div>
          </div>
        )}

        {(mode==='answer'||mode==='quiz') && (
          <div className="card-love p-6 animate-fade-up shadow-xl">
            <div className="mb-5">
              <div className="flex justify-between text-xs text-gray-400 mb-2 font-semibold">
                <span>คำถาม {current+1} จาก {QUESTIONS.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-2 rounded-full transition-all duration-500"
                  style={{width:`${progress}%`,background:'linear-gradient(90deg,#6366f1,#a855f7)'}}/>
              </div>
            </div>
            <p className="font-display text-xl font-semibold text-gray-800 mb-6 text-center leading-snug">
              {mode==='quiz' ? `แฟนของคุณ: "${q.q}"` : q.q}
            </p>
            <div className="space-y-3 mb-5">
              {q.choices.map((c,i)=>(
                <button key={i} onClick={()=>setSelected(i)}
                  className="w-full text-left px-5 py-3.5 rounded-2xl border-2 transition-all duration-200 font-medium text-sm"
                  style={{
                    borderColor: selected===i ? '#6366f1' : '#e0e7ff',
                    background: selected===i ? '#eef2ff' : 'white',
                    color: selected===i ? '#4338ca' : '#374151',
                    transform: selected===i ? 'scale(1.01)' : 'scale(1)',
                  }}>
                  <span className="inline-block w-6 h-6 rounded-full text-xs font-bold mr-2 text-center leading-6"
                    style={{background: selected===i?'#6366f1':'#e0e7ff', color: selected===i?'white':'#6366f1'}}>
                    {String.fromCharCode(65+i)}
                  </span>
                  {c}
                </button>
              ))}
            </div>
            <button onClick={handleNext} disabled={selected===null} className="btn-love w-full py-3.5"
              style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',opacity:selected===null?0.4:1}}>
              {current===QUESTIONS.length-1?'ส่งคำตอบ':'ข้อต่อไป →'}
            </button>
          </div>
        )}

        {mode==='done_answer' && (
          <div className="card-love p-8 text-center animate-fade-up shadow-xl">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="font-display text-2xl font-bold text-gray-800 mb-2">บันทึกแล้ว!</h2>
            <p className="text-gray-500 mb-6">ให้แฟนมาทายคำตอบของคุณได้เลย</p>
            <button onClick={()=>setMode('menu')} className="btn-love px-8 py-3"
              style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>กลับหน้าหลัก</button>
          </div>
        )}

        {mode==='done_quiz' && (
          <div className="card-love p-8 text-center animate-fade-up shadow-xl">
            <div className="text-7xl mb-4">{score>=7?'💖':score>=5?'😊':'🤔'}</div>
            <div className="font-display font-bold text-6xl text-gradient mb-1">{score} / {QUESTIONS.length}</div>
            <p className="text-gray-500 mb-2 font-semibold">คะแนนที่ได้</p>
            <p className="font-display text-xl text-purple-500 italic mb-6">
              {score>=7?'รู้จักกันดีมากเลย! 💕':score>=5?'รู้จักกันดีพอสมควร':score>=3?'ยังต้องคุยกันอีกเยอะนะ':'เวลาทำความรู้จักกันใหม่แล้ว 😄'}
            </p>
            <button onClick={()=>setMode('menu')} className="btn-love px-8 py-3"
              style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>เล่นอีกครั้ง</button>
          </div>
        )}
      </div>
    </div>
  );
}
