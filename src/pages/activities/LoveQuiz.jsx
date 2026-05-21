import { useState } from 'react';
import Navbar from '../../components/Navbar';
import { Link } from 'react-router-dom';

const QUESTIONS = [
  { q: 'ของกินที่ฉันชอบที่สุดคืออะไร?', choices: ['ข้าวผัด', 'พิซซ่า', 'ซูชิ', 'ส้มตำ'] },
  { q: 'ฉันชอบดูหนังแนวไหนมากที่สุด?', choices: ['โรแมนติก', 'แอ็คชั่น', 'ตลก', 'สยองขวัญ'] },
  { q: 'กิจกรรมที่ฉันชอบทำยามว่างคืออะไร?', choices: ['ฟังเพลง', 'อ่านหนังสือ', 'เล่นเกม', 'ดูซีรีส์'] },
  { q: 'สีที่ฉันชอบมากที่สุดคือสีอะไร?', choices: ['ชมพู', 'น้ำเงิน', 'เขียว', 'ม่วง'] },
  { q: 'ช่วงเวลาที่ฉันชอบที่สุดคือช่วงไหน?', choices: ['ตอนเช้า', 'ตอนกลางวัน', 'ตอนเย็น', 'ตอนกลางคืน'] },
  { q: 'ฉันชอบเดินทางแบบไหน?', choices: ['ทะเล', 'ภูเขา', 'เมือง', 'ธรรมชาติ'] },
  { q: 'แก้วน้ำที่ฉันชอบดื่มบ่อยที่สุดคืออะไร?', choices: ['น้ำเปล่า', 'กาแฟ', 'ชา', 'น้ำผลไม้'] },
  { q: 'สัตว์เลี้ยงในฝันของฉันคืออะไร?', choices: ['แมว', 'หมา', 'กระต่าย', 'นก'] },
];

export default function LoveQuiz() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(null);
  const [partnerAnswers, setPartnerAnswers] = useState(null);
  const [mode, setMode] = useState('menu'); // menu | answer | quiz

  function startAnswer() { setMode('answer'); setCurrent(0); setAnswers([]); setSelected(null); setDone(false); }
  function startQuiz() {
    const saved = localStorage.getItem('missu_quiz_answers');
    if (!saved) { alert('ยังไม่มีคำตอบที่บันทึกไว้! กรุณาให้อีกฝ่ายตอบคำถามก่อน'); return; }
    setPartnerAnswers(JSON.parse(saved));
    setMode('quiz'); setCurrent(0); setAnswers([]); setSelected(null); setDone(false);
  }

  function handleAnswer() {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    if (mode === 'answer' && current === QUESTIONS.length - 1) {
      localStorage.setItem('missu_quiz_answers', JSON.stringify(newAnswers));
      setDone(true); setMode('done_answer');
    } else if (mode === 'quiz' && current === QUESTIONS.length - 1) {
      const s = newAnswers.filter((a, i) => a === partnerAnswers[i]).length;
      setScore(s); setDone(true); setMode('done_quiz');
    } else {
      setCurrent(c => c + 1); setSelected(null);
    }
  }

  const q = QUESTIONS[current];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navbar />
      <div className="max-w-lg mx-auto p-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/dashboard" className="text-rose-400 hover:text-rose-500 text-sm">← กลับ</Link>
          <h1 className="text-2xl font-bold text-gray-700">❓ คุณรู้จักฉันดีแค่ไหน</h1>
        </div>
        {mode === 'menu' && (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">❓</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">ทดสอบความรู้จักกัน</h2>
            <p className="text-gray-400 text-sm mb-8">ฝ่ายหนึ่งตอบ ฝ่ายหนึ่งทาย แล้วดูว่ารู้จักกันดีแค่ไหน!</p>
            <div className="space-y-3">
              <button onClick={startAnswer} className="w-full bg-blue-400 hover:bg-blue-500 text-white font-medium py-3 rounded-2xl transition-all">
                ฉันจะตอบคำถามเกี่ยวกับตัวเอง
              </button>
              <button onClick={startQuiz} className="w-full bg-purple-400 hover:bg-purple-500 text-white font-medium py-3 rounded-2xl transition-all">
                ฉันจะทายคำตอบของแฟน
              </button>
              {localStorage.getItem('missu_quiz_answers') && (
                <p className="text-xs text-green-500">มีคำตอบที่บันทึกไว้แล้ว พร้อมทายได้!</p>
              )}
            </div>
          </div>
        )}
        {(mode === 'answer' || mode === 'quiz') && (
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">{current + 1} / {QUESTIONS.length}</span>
              <div className="h-2 bg-gray-100 rounded-full flex-1 mx-4">
                <div className="h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all" style={{ width: `${((current + 1) / QUESTIONS.length) * 100}%` }} />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-700 mb-6 text-center">
              {mode === 'quiz' ? `แฟนของคุณ: "${q.q}"` : q.q}
            </p>
            <div className="space-y-3">
              {q.choices.map((c, i) => (
                <button key={i} onClick={() => setSelected(i)}
                  className={`w-full text-left px-5 py-3.5 rounded-2xl border-2 transition-all text-sm font-medium ${selected === i ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300 text-gray-700'}`}
                >{c}</button>
              ))}
            </div>
            <button onClick={handleAnswer} disabled={selected === null}
              className="w-full mt-5 bg-blue-400 hover:bg-blue-500 disabled:bg-gray-200 text-white font-medium py-3 rounded-2xl transition-all">
              {current === QUESTIONS.length - 1 ? 'ส่งคำตอบ' : 'ต่อไป'}
            </button>
          </div>
        )}
        {mode === 'done_answer' && (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">บันทึกคำตอบแล้ว!</h2>
            <p className="text-gray-400 text-sm mb-6">ให้แฟนเข้ามาทายคำตอบของคุณได้เลย</p>
            <button onClick={() => setMode('menu')} className="bg-blue-400 hover:bg-blue-500 text-white font-medium py-3 px-8 rounded-2xl transition-all">กลับหน้าหลัก</button>
          </div>
        )}
        {mode === 'done_quiz' && (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">{score >= 6 ? '💖' : score >= 4 ? '😊' : '🤔'}</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-1">{score} / {QUESTIONS.length}</h2>
            <p className="text-gray-500 mb-2">คะแนนที่ได้</p>
            <p className="text-lg font-medium text-purple-500 mb-6">
              {score >= 7 ? 'คุณรู้จักกันดีมาก! 💕' : score >= 5 ? 'รู้จักกันดีพอสมควร' : score >= 3 ? 'ยังต้องทำความรู้จักกันอีกนิดนะ' : 'เวลาหาเรื่องคุยกันแล้ว 😄'}
            </p>
            <button onClick={() => setMode('menu')} className="bg-purple-400 hover:bg-purple-500 text-white font-medium py-3 px-8 rounded-2xl transition-all">เล่นอีกครั้ง</button>
          </div>
        )}
      </div>
    </div>
  );
}
