import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, getDocs, query, where, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestoreUtils';
import { useAuth } from '../../App';

export default function TeamManager({ engagement }: { engagement: any }) {
  const { user, profile } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  
  // Adding New Members
  const [addingRole, setAddingRole] = useState<'ATL' | 'Auditor' | null>(null);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, `engagements/${engagement.id}/members`), async snap => {
      const mems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMembers(mems);
      
      const names: Record<string, string> = {};
      for (const m of mems) {
        if (!memberNames[m.userId]) {
          try {
            const userDoc = await getDoc(doc(db, 'users', m.userId));
            if (userDoc.exists()) {
              names[m.userId] = userDoc.data().name;
            }
          } catch (e) {}
        }
      }
      setMemberNames(prev => ({ ...prev, ...names }));
      setLoading(false);
    }, error => handleFirestoreError(error, OperationType.LIST, `engagements/${engagement.id}/members`));
    
    return unsub;
  }, [engagement.id]);

  const loadAvailableUsers = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'Auditor'));
      const snap = await getDocs(q);
      setAvailableUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'users');
    }
  };

  useEffect(() => {
    if (addingRole) {
      loadAvailableUsers();
    }
  }, [addingRole]);

  const handleAddMember = async () => {
    if (!selectedUserId || !addingRole) return;
    try {
      await setDoc(doc(db, `engagements/${engagement.id}/members`, selectedUserId), {
        userId: selectedUserId,
        engagementRole: addingRole,
        createdAt: Date.now()
      });
      setAddingRole(null);
      setSelectedUserId('');
    } catch (err) {
       handleFirestoreError(err, OperationType.CREATE, `engagements/${engagement.id}/members`);
    }
  };

  const amITeamLeaderOrHigher = profile?.role === 'Director' || profile?.role === 'Division Chief' || profile?.role === 'Team Leader';

  if (loading) return <div>Loading team...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Engagement Team</h2>
        {amITeamLeaderOrHigher && (
          <div className="flex gap-2">
            <button onClick={() => setAddingRole('ATL')} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded transition-colors border border-gray-200">
              + Assign ATL
            </button>
            <button onClick={() => setAddingRole('Auditor')} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded transition-colors border border-blue-200">
              + Add Auditor
            </button>
          </div>
        )}
      </div>

      {addingRole && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select {addingRole === 'ATL' ? 'Assistant Team Leader' : 'Auditor'}
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
            >
              <option value="">- Choose a registered Auditor -</option>
              {availableUsers
                .filter(u => !members.some(m => m.userId === u.id))
                .map(u => (
                <option key={u.id} value={u.id}>{u.name} (Auditor)</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAddingRole(null)} className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50">Cancel</button>
            <button onClick={handleAddMember} disabled={!selectedUserId} className="px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">Add Member</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map(m => (
          <div key={m.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {memberNames[m.userId] || (m.userId === engagement.teamLeaderId ? 'Team Leader' : m.userId === engagement.auditeeId ? 'Auditee' : 'User')}
              </p>
              <p className="text-xs text-gray-500">ID: {m.userId}</p>
            </div>
            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium">{m.engagementRole}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
