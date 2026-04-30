import React, { useState } from 'react';
import { useAuth } from '../App';
import { useUsers } from '../hooks/useUsers';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { X } from 'lucide-react';
import clsx from 'clsx';

export default function NewEngagementModal({ onClose }: { onClose: () => void }) {
  const { user, profile } = useAuth();
  const { users } = useUsers();
  
  const teamLeaders = users.filter(u => u.role === 'Team Leader');
  const auditees = users.filter(u => u.role === 'Auditee');

  const [title, setTitle] = useState('');
  const [typeOfAudit, setTypeOfAudit] = useState('Compliance Management');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [teamLeaderId, setTeamLeaderId] = useState('');
  const [auditeeId, setAuditeeId] = useState('');
  const [flowchartUrl, setFlowchartUrl] = useState('');
  const [feedbackSurveyUrl, setFeedbackSurveyUrl] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamLeaderId || !auditeeId) {
      return setError('Please select a Team Leader and an Auditee.');
    }
    setError('');
    setLoading(true);

    try {
      const batch = writeBatch(db);
      const engagementRef = doc(collection(db, 'engagements'));
      
      const engagementId = engagementRef.id;
      const now = Date.now();

      // We explicitly construct memberIds: creator + TL + auditee.
      // A Director creates it, so we add the Director to members, plus team leader and auditee.
      const initialMembers = [user!.uid, teamLeaderId, auditeeId];
      // remove duplicates if creator is also TL (unlikely but possible)
      const uniqueMembers = Array.from(new Set(initialMembers));

      batch.set(engagementRef, {
        title,
        typeOfAudit,
        periodStart,
        periodEnd,
        teamLeaderId,
        auditeeId,
        flowchartUrl,
        feedbackSurveyUrl,
        status: 'Open',
        memberIds: uniqueMembers,
        createdAt: now,
        updatedAt: now
      });

      // Add actual member roles into the subcollection
      const creatorMemberRef = doc(db, `engagements/${engagementId}/members/${user!.uid}`);
      batch.set(creatorMemberRef, {
        userId: user!.uid,
        engagementRole: profile!.role,
        createdAt: now
      });

      if (teamLeaderId !== user!.uid) {
        const tlMemberRef = doc(db, `engagements/${engagementId}/members/${teamLeaderId}`);
        batch.set(tlMemberRef, {
          userId: teamLeaderId,
          engagementRole: 'Team Leader',
          createdAt: now
        });
      }

      if (auditeeId !== user!.uid && auditeeId !== teamLeaderId) {
        const auditeeMemberRef = doc(db, `engagements/${engagementId}/members/${auditeeId}`);
        batch.set(auditeeMemberRef, {
          userId: auditeeId,
          engagementRole: 'Auditee',
          createdAt: now
        });
      }

      await batch.commit();
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'engagements');
      setError('Failed to create engagement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">New Audit Engagement</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Engagement Title</label>
            <input 
              type="text" required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={title} onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type of Audit</label>
            <select
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={typeOfAudit} onChange={e => setTypeOfAudit(e.target.value)}
            >
              <option value="Compliance Management">Compliance Management</option>
              <option value="Operation Management">Operation Management</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input 
                type="date" required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={periodStart} onChange={e => setPeriodStart(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input 
                type="date" required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Team Leader</label>
              <select 
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={teamLeaderId} onChange={e => setTeamLeaderId(e.target.value)}
              >
                <option value="">Select Team Leader</option>
                {teamLeaders.map(tl => (
                  <option key={tl.id} value={tl.id}>{tl.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Auditee / Office</label>
              <select 
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={auditeeId} onChange={e => setAuditeeId(e.target.value)}
              >
                <option value="">Select Auditee</option>
                {auditees.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Upload Documents</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Flowchart (Google Drive Link)</label>
                <input 
                  type="url" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={flowchartUrl} onChange={e => setFlowchartUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Feedback Survey Form (Google Drive Link)</label>
                <input 
                  type="url" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={feedbackSurveyUrl} onChange={e => setFeedbackSurveyUrl(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <button 
              type="button" onClick={onClose}
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" disabled={loading}
              className={clsx("px-4 py-2 bg-blue-600 text-white font-medium rounded-lg transition-colors", loading && "opacity-70 cursor-not-allowed")}
            >
              {loading ? "Creating..." : "Create Engagement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
