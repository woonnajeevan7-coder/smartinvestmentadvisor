import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import InputForm from './pages/InputForm';
import DashboardPage from './pages/DashboardPage';
import Simulator from './pages/Simulator';
import History from './pages/History';
import Market from './pages/Market';
import Profile from './pages/Profile';
import Login from './pages/Login';
import AIAdvisor from './pages/AIAdvisor';
import Banking from './pages/Banking';
import LoaderDemo from './pages/LoaderDemo';
import AIFloatingChat from './components/AIFloatingChat';
import { MarketProvider } from './context/MarketContext';
import { UserProvider, useUser } from './context/UserContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useUser();
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neu-bg text-neu-primary font-dm-sans">
        <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-xs tracking-widest uppercase opacity-75">Restoring Secure Session...</p>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppContent() {
  const { isAuthenticated, loading } = useUser();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neu-bg text-neu-primary font-dm-sans">
        <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-xs tracking-widest uppercase opacity-75">Initializing Wealth Terminal...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neu-bg text-neu-primary font-dm-sans selection:bg-neu-accent selection:text-white">
      {isAuthenticated && !isLoginPage && <Sidebar />}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neu-bg">
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/input" element={<ProtectedRoute><InputForm /></ProtectedRoute>} />
          <Route path="/simulator" element={<ProtectedRoute><Simulator /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/market" element={<ProtectedRoute><Market /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/ai" element={<ProtectedRoute><AIAdvisor /></ProtectedRoute>} />
          <Route path="/banking" element={<ProtectedRoute><Banking /></ProtectedRoute>} />
          <Route path="/loader-demo" element={<ProtectedRoute><LoaderDemo /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        </Routes>
        {isAuthenticated && <AIFloatingChat />}
      </main>
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <MarketProvider>
        <AppContent />
      </MarketProvider>
    </UserProvider>
  );
}

export default App;
