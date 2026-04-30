import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import clsx from 'clsx';
import { Building2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent. Check your inbox.');
    } catch (err: any) {
      console.error(err);
      setError('Failed to send reset email. Ensure the email is registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700">
            <Building2 size={24} />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-center text-gray-900 mb-2">Reset Password</h1>
        <p className="text-center text-gray-500 text-sm mb-8">Internal Audit Management System</p>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg">{message}</div>}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <button 
            disabled={loading}
            className={clsx(
              "w-full py-2.5 px-4 rounded-lg text-white font-medium transition-all mt-6",
              loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
            )}
            type="submit"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Remembered your password? <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
