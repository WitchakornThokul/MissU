import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

const ACTIVITIES = [
  { id: 'love-letters', emoji: '💌', title: 'จดหมายรัก', desc: 'เขียนจดหมายให้กัน', color: 'from-rose-100 to-pink-100', border: 'border-rose-200' },
  { id: 'countdown', emoji: '⏰', title: 'นับวัน', desc: 'นับวันพิเศษของเรา', color: 'from-purple-100 to-pink-100', border: 'border-purple-200' },
  { id: 'bucket-list', emoji: '🎯', title: 'Bucket List', desc: 'สิ่งที่อยากทำด้วยกัน', color: 'from-orange-100 to-yellow-100', border: 'border-orange-200' },
  { id: 'memory-wall', emoji: '📸', title: 'กำแพงความทรงจำ', desc: 'เก็บทุกช่วงเวลาดีๆ', color: 'from-teal-100 to-green-100', border: 'border-teal-200' },
  { id: 'love-quiz', emoji: '❓', title: 'คุณรู้จักฉันดีแค่ไหน', desc: 'ทดสอบความรู้จักกัน', color: 'from-blue-100 to-indigo-100', border: 'border-blue-200' },
  { id: 'date-wheel', emoji: '🎲', title: 'วงล้อเดท', desc: 'สปินหาไอเดียเดทสุดพิเศษ', color: 'from-pink-100 to-rose-100', border: 'border-pink-200' },
  { id: 'daily-note', emoji: '💝', title: 'โน้ตรายวัน', desc: 'บอกความรู้สึกทุกวัน', color: 'from-yellow-100 to-orange-100', border: 'border-yellow-200' },
  { id: 'achievements', emoji: '🏆', title: 'ความสำเร็จคู่รัก', desc: 'ปลดล็อคความทรงจำ', color: 'from-amber-100 to-yellow-100', border: 'border-amber-200' },
];

export default function Dashboard() {
  const { userProfile } = useAuth();
  const daysCount = userProfile?.relationshipStart
    ? Math.floor((new Date() - new Date(userProfile.relationshipStart)) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <Navbar />
      <div className="max-w-5xl mx-auto p-4 pt-6">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">{userProfile?.avatarEmoji || '💕'}</div>
          <h1 className="text-3xl font-bold text-gray-700 mb-1">
            สวัสดี, {userProfile?.displayName || 'ที่รัก'}!
          </h1>
          {daysCount !== null && daysCount >= 0 && (
            <p className="text-rose-400 font-medium">เราอยู่ด้วยกันมา {daysCount} วันแล้ว 🌸</p>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {ACTIVITIES.map(a => (
            <Link
              key={a.id}
              to={`/activity/${a.id}`}
              className={`bg-gradient-to-br ${a.color} border ${a.border} rounded-3xl p-5 text-center hover:shadow-lg transition-all hover:-translate-y-1 block`}
            >
              <div className="text-4xl mb-2">{a.emoji}</div>
              <h3 className="font-bold text-gray-700 text-sm mb-1">{a.title}</h3>
              <p className="text-gray-500 text-xs">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
