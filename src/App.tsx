import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged, User as FirebaseUser, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Engagements from './pages/Engagements';
import EngagementDetail from './pages/EngagementDetail';
import MovInventory from './pages/MovInventory';
import ForgotPassword from './pages/ForgotPassword';

interface UserProfile {
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });
export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currUser) => {
      setUser(currUser);
      if (currUser) {
        const docRef = doc(db, 'users', currUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/engagements" element={<Engagements />} />
            <Route path="/engagements/:id/*" element={<EngagementDetail />} />
            <Route path="/movs" element={<MovInventory />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleResend = async () => {
    setResending(true);
    setMessage('');
    try {
      await sendEmailVerification(user);
      setMessage('Verification email sent! Please check your inbox.');
    } catch (err: any) {
      setMessage(err.message || 'Failed to send verification email.');
    } finally {
      setResending(false);
    }
  };

  const handleRefresh = async () => {
    await user.reload();
    window.location.reload(); // Quick way to force context refresh
  };

  const handleSignOut = async () => {
    await auth.signOut();
  };

  if (!user.emailVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h2>
          <p className="text-gray-600 mb-6">
            We've sent an email to <span className="font-medium text-gray-900">{user.email}</span>. 
            Please verify your email address to continue.
          </p>
          
          {message && (
            <div className={`mb-6 p-3 rounded-lg text-sm ${message.includes('sent') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          <div className="space-y-3">
            <button 
              onClick={handleRefresh}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              I've verified my email
            </button>
            <button 
              onClick={handleResend}
              disabled={resending}
              className="w-full py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
            >
              {resending ? 'Sending...' : 'Resend verification email'}
            </button>
            <button 
              onClick={handleSignOut}
              className="w-full py-2 px-4 text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors mt-4 text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

import Layout from './components/Layout';
