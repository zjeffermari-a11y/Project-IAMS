import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import clsx from 'clsx';
import { Building2 } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Auditor');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      
      const userId = userCredential.user.uid;
      try {
        await setDoc(doc(db, 'users', userId), {
          name,
          role,
          roleVerified: false,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
      }

      setMessage('Registration successful! Please check your email to verify your account.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create an account.');
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
        <h1 className="text-2xl font-semibold text-center text-gray-900 mb-2">Create Account</h1>
        <p className="text-center text-gray-500 text-sm mb-8">Internal Audit Management System</p>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg">{message}</div>}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@gov.ph or gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select 
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="Director">Director</option>
              <option value="Division Chief">Division Chief</option>
              <option value="Team Leader">Team Leader</option>
              <option value="Auditor">Auditor</option>
              <option value="Auditee">Auditee</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <button 
            disabled={loading}
            className={clsx(
              "w-full py-2.5 px-4 rounded-lg text-white font-medium transition-all mt-6",
              loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
            )}
            type="submit"
          >
            {loading ? "Registering..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
