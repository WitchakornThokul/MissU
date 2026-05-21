import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import BottomNav from './components/BottomNav';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ViewProfile from './pages/ViewProfile';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import FindPartner from './pages/FindPartner';
import LoveLetters from './pages/activities/LoveLetters';
import Countdown from './pages/activities/Countdown';
import BucketList from './pages/activities/BucketList';
import MemoryWall from './pages/activities/MemoryWall';
import LoveQuiz from './pages/activities/LoveQuiz';
import DateWheel from './pages/activities/DateWheel';
import DailyNote from './pages/activities/DailyNote';
import Achievements from './pages/activities/Achievements';

const ACTIVITY_MAP = {
  'love-letters': LoveLetters,
  'countdown': Countdown,
  'bucket-list': BucketList,
  'memory-wall': MemoryWall,
  'love-quiz': LoveQuiz,
  'date-wheel': DateWheel,
  'daily-note': DailyNote,
  'achievements': Achievements,
};

function ActivityWrapper() {
  const { id } = useParams();
  const Component = ACTIVITY_MAP[id];
  if (!Component) return <Navigate to="/dashboard" replace />;
  return <Component />;
}

function AuthenticatedBottomNav() {
  const { currentUser } = useAuth();
  const location = useLocation();
  // Hide on chat page (it has its own full-screen layout)
  if (!currentUser || location.pathname === '/chat') return null;
  return (
    <>
      <BottomNav/>
      {/* Spacer so page content isn't hidden behind the fixed bottom nav on mobile */}
      <div className="md:hidden" style={{height:72}}/>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile"      element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/chat"         element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/find-partner" element={<ProtectedRoute><FindPartner /></ProtectedRoute>} />
          <Route path="/activity/:id" element={<ProtectedRoute><ActivityWrapper /></ProtectedRoute>} />
          <Route path="/profile/:uid"  element={<ProtectedRoute><ViewProfile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <AuthenticatedBottomNav/>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
