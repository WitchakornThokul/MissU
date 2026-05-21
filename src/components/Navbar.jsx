import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 text-rose-500 font-bold text-xl">
          <span>💕</span> MissU
        </Link>
        {currentUser && (
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className={`text-sm font-medium transition-colors ${location.pathname === '/dashboard' ? 'text-rose-500' : 'text-gray-500 hover:text-rose-400'}`}
            >
              Home
            </Link>
            <Link
              to="/profile"
              className={`text-sm font-medium transition-colors ${location.pathname === '/profile' ? 'text-rose-500' : 'text-gray-500 hover:text-rose-400'}`}
            >
              Profile
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-lg">{userProfile?.avatarEmoji || '💕'}</span>
              <span className="text-sm text-gray-600 hidden sm:block">{userProfile?.displayName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-rose-400 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
