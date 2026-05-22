import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ModalPage from '../../components/ModalPage';
import { useDialog } from '../../components/Dialog';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

const QUESTION_SETS = [
  // ชุดที่ 1 — อาหาร & กิจกรรม
  [
    { q:'ของกินที่ฉันชอบที่สุดคืออะไร?',          choices:['ข้าวผัด','พิซซ่า','ซูชิ','ส้มตำ'] },
    { q:'ฉันชอบดูหนังแนวไหนมากที่สุด?',            choices:['โรแมนติก','แอ็คชั่น','ตลก','สยองขวัญ'] },
    { q:'กิจกรรมยามว่างที่ฉันชอบที่สุดคืออะไร?',   choices:['ฟังเพลง','อ่านหนังสือ','เล่นเกม','ดูซีรีส์'] },
    { q:'สีที่ฉันชอบมากที่สุดคือสีอะไร?',          choices:['ชมพู','น้ำเงิน','เขียว','ม่วง'] },
    { q:'ช่วงเวลาที่ฉันชอบที่สุดคือตอนไหน?',       choices:['ตอนเช้า','กลางวัน','เย็น','กลางคืน'] },
    { q:'ฉันชอบเดินทางแบบไหนมากที่สุด?',           choices:['ทะเล','ภูเขา','เมือง','ธรรมชาติ'] },
    { q:'เครื่องดื่มที่ฉันดื่มบ่อยที่สุดคืออะไร?',  choices:['น้ำเปล่า','กาแฟ','ชา','น้ำผลไม้'] },
    { q:'สัตว์เลี้ยงในฝันของฉันคืออะไร?',           choices:['แมว','หมา','กระต่าย','นก'] },
  ],
  // ชุดที่ 2 — นิสัย & บุคลิก
  [
    { q:'ฉันเป็นคนแบบไหนมากกว่า?',                choices:['ขี้เงียบ','ช่างพูด','เฉยๆ','แล้วแต่อารมณ์'] },
    { q:'เวลาเครียดฉันมักจะทำอะไร?',               choices:['นอน','กินของอร่อย','คุยกับเพื่อน','ฟังเพลง'] },
    { q:'ฉันชอบของขวัญแบบไหนมากกว่า?',             choices:['สิ่งของ','ประสบการณ์','คำพูดหวาน','เวลาด้วยกัน'] },
    { q:'วันหยุดในฝันของฉันคือแบบไหน?',             choices:['นอนอยู่บ้าน','เดินทางไกล','ทำกิจกรรม','ไปคาเฟ่'] },
    { q:'ฉันจัดการห้องนอนแบบไหน?',                 choices:['เป็นระเบียบมาก','พอใช้ได้','ปล่อยตามใจ','ขึ้นกับวัน'] },
    { q:'ฉันชอบดนตรีแนวไหน?',                     choices:['ป๊อป','อาร์แอนด์บี','ร็อก','อินดี้'] },
    { q:'ถ้ามีเงิน 10,000 บาทจะซื้ออะไร?',         choices:['เสื้อผ้า','ท่องเที่ยว','ของกิน','ออมเก็บ'] },
    { q:'ฉันชอบกลิ่นไหนมากที่สุด?',                choices:['ดอกไม้','ฝนตก','กาแฟ','ขนมอบ'] },
  ],
  // ชุดที่ 3 — ความรัก & ความสัมพันธ์
  [
    { q:'ฉันแสดงความรักด้วยวิธีไหนมากที่สุด?',      choices:['คำพูด','สัมผัส','ของขวัญ','เวลา'] },
    { q:'ฉันชอบเดทแบบไหนมากกว่า?',                 choices:['ดูหนัง','กินข้าว','เดินเล่น','ทำอาหารด้วยกัน'] },
    { q:'เวลาทะเลาะฉันมักจะ...?',                   choices:['บอกตรงๆ','เงียบไปก่อน','ขอโทษก่อน','หาเหตุผล'] },
    { q:'ฉันอยากเจอกันบ่อยแค่ไหน?',                choices:['ทุกวัน','สัปดาห์ละครั้ง','ขึ้นกับงาน','เมื่อพร้อม'] },
    { q:'สิ่งที่ฉันชอบในความสัมพันธ์มากที่สุดคือ?', choices:['ความไว้วางใจ','ความสนุก','การเติบโต','ความอบอุ่น'] },
    { q:'ฉันชอบรับรู้ว่าถูกรักด้วยวิธีไหน?',        choices:['พูดบอก','กอดจับ','ทำสิ่งดีๆ ให้','ใช้เวลาด้วยกัน'] },
    { q:'Couple Goal ของฉันคือแบบไหน?',             choices:['เป็นเพื่อนกัน','เดินทางด้วยกัน','สร้างครอบครัว','เติบโตด้วยกัน'] },
    { q:'เรื่องอะไรที่ฉันอยากทำด้วยกันมากที่สุด?',   choices:['เดินทาง','ทำอาหาร','ออกกำลังกาย','ดูซีรีส์'] },
  ],
  // ชุดที่ 4 — ชีวิตประจำวัน
  [
    { q:'ฉันตื่นนอนตอนกี่โมงโดยปกติ?',             choices:['ก่อน 7 โมง','7-9 โมง','หลัง 9 โมง','ขึ้นกับวัน'] },
    { q:'อาหารเช้าที่ฉันชอบคืออะไร?',              choices:['ข้าวต้ม','ขนมปัง','โจ๊ก','ไม่กิน'] },
    { q:'ฉันชอบซื้อของที่ไหน?',                    choices:['ห้าง','ตลาด','ออนไลน์','ร้านย่อย'] },
    { q:'ออกกำลังกายบ่อยแค่ไหน?',                  choices:['ทุกวัน','3-4 ครั้ง/สัปดาห์','บางที','แทบไม่ได้ทำ'] },
    { q:'ฉันชอบอ่านอะไร?',                         choices:['นิยาย','ข่าว','Social media','ไม่ค่อยอ่าน'] },
    { q:'ฉันชอบรับประทานอาหารที่ไหน?',             choices:['ที่บ้าน','ร้านอาหาร','ข้างถนน','ซื้อกลับบ้าน'] },
    { q:'ฉันใช้เวลาในโซเชียลแพลตฟอร์มไหนมากสุด?', choices:['Instagram','TikTok','Facebook','Twitter/X'] },
    { q:'ฉันชอบอากาศแบบไหน?',                      choices:['ร้อน','เย็น','ฝน','ลม'] },
  ],
  // ชุดที่ 5 — ความฝัน & อนาคต
  [
    { q:'งานในฝันของฉันคืออะไร?',                  choices:['ครีเอทีฟ','ธุรกิจ','ช่วยเหลือคน','เทคโนโลยี'] },
    { q:'ฉันอยากอยู่ที่ไหนในอีก 5 ปี?',            choices:['เมืองเดิม','ต่างจังหวัด','ต่างประเทศ','ยังไม่แน่ใจ'] },
    { q:'ฉันฝันอยากมีอะไร?',                       choices:['บ้าน','รถ','ธุรกิจ','เดินทางรอบโลก'] },
    { q:'ฉันอยากมีลูกไหม?',                        choices:['อยาก 1-2 คน','อยากมีหลายคน','ยังไม่แน่ใจ','ไม่อยาก'] },
    { q:'ฉันอยากเกษียณตอนอายุเท่าไหร่?',           choices:['ก่อน 40','40-50','50-60','ทำไปจนสุดแรง'] },
    { q:'ถ้าเลือกได้อยากเก่งเรื่องอะไร?',           choices:['ดนตรี','ภาษา','กีฬา','ทำอาหาร'] },
    { q:'ฉันกลัวอะไรมากที่สุด?',                   choices:['ความเหงา','ความล้มเหลว','สูญเสียคนรัก','ไม่มีอนาคต'] },
    { q:'สิ่งที่ฉันภูมิใจในตัวเองมากที่สุดคืออะไร?', choices:['ความตั้งใจ','ความอ่อนโยน','ความเก่ง','ความสนุก'] },
  ],
];

export default function LoveQuiz() {
  const { currentUser, userProfile } = useAuth();
  const { alert } = useDialog();
  const coupleId = currentUser && userProfile?.partnerId
    ? [currentUser.uid, userProfile.partnerId].sort().join('_') : null;

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('menu');
  const [partnerData, setPartnerData] = useState(null);
  const [score, setScore] = useState(null);
  const [myAnswersSaved, setMyAnswersSaved] = useState(false);
  const [setIndex, setSetIndex] = useState(0);

  useEffect(() => {
    if (!coupleId || !userProfile?.partnerId) return;
    const unsub = onSnapshot(doc(db, 'couples', coupleId, 'quiz', userProfile.partnerId), snap => {
      setPartnerData(snap.exists() ? snap.data() : null);
    });
    getDoc(doc(db, 'couples', coupleId, 'quiz', currentUser.uid)).then(snap => {
      setMyAnswersSaved(snap.exists());
    });
    return unsub;
  }, [coupleId]);

  function startAnswer() {
    const idx = Math.floor(Math.random() * QUESTION_SETS.length);
    setSetIndex(idx);
    setMode('answer'); setCurrent(0); setAnswers([]); setSelected(null);
  }

  async function startQuiz() {
    if (!partnerData) { await alert('รอให้คู่รักตอบคำถามก่อน แล้วค่อยกดทดสอบ', { title: 'ยังไม่มีคำตอบจากคู่รัก', type: 'info' }); return; }
    setSetIndex(partnerData.setIndex ?? 0);
    setMode('quiz'); setCurrent(0); setAnswers([]); setSelected(null);
  }

  const QUESTIONS = QUESTION_SETS[setIndex];

  async function handleNext() {
    if (selected === null) return;
    const newAns = [...answers, selected];
    if (mode === 'answer' && current === QUESTIONS.length - 1) {
      await setDoc(doc(db, 'couples', coupleId, 'quiz', currentUser.uid), { answers: newAns, setIndex });
      setMyAnswersSaved(true);
      setMode('done_answer');
    } else if (mode === 'quiz' && current === QUESTIONS.length - 1) {
      setScore(newAns.filter((a, i) => a === (partnerData?.answers ?? [])[i]).length);
      setMode('done_quiz');
    } else {
      setAnswers(newAns); setCurrent(c => c + 1); setSelected(null);
    }
  }

  const q = QUESTIONS[current];
  const progress = (current / QUESTIONS.length) * 100;

  return (
    <ModalPage title="รู้จักกันดีแค่ไหน" subtitle="ทดสอบว่าเข้าใจกันมากแค่ไหน" from="#6366f1" to="#818cf8" bg="linear-gradient(160deg,#eff6ff,#e0e7ff,#f3e8ff)">
      <div>
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
              {partnerData && (
                <>
                  <p className="text-xs text-indigo-500 font-medium">✓ คู่รักตอบคำถามแล้ว พร้อมทายได้เลย!</p>
                  <p className="text-xs text-gray-400 mt-1">ชุดคำถาม #{(partnerData.setIndex ?? 0) + 1}</p>
                </>
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
            <p className="text-gray-500 mb-2 font-semibold">คะแนนที่ได้ — ชุดที่ #{setIndex + 1}</p>
            <p className="font-display text-xl text-purple-500 italic mb-6">
              {score>=7?'รู้จักกันดีมากเลย! 💕':score>=5?'รู้จักกันดีพอสมควร':score>=3?'ยังต้องคุยกันอีกเยอะนะ':'เวลาทำความรู้จักกันใหม่แล้ว 😄'}
            </p>
            <button onClick={()=>setMode('menu')} className="btn-love px-8 py-3"
              style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)'}}>เล่นอีกครั้ง</button>
          </div>
        )}
      </div>
    </ModalPage>
  );
}
