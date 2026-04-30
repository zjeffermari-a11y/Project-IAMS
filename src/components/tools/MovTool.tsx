import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestoreUtils';
import { useAuth } from '../../App';
import clsx from 'clsx';
import { Plus, FileText } from 'lucide-react';

export default function MovTool({ engagement }: { engagement: any }) {
  const { user, profile } = useAuth();
  const [movs, setMovs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberRole, setMemberRole] = useState<string>('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, `engagements/${engagement.id}/movs`), snap => {
      setMovs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, error => handleFirestoreError(error, OperationType.LIST, `engagements/${engagement.id}/movs`));
    return unsub;
  }, [engagement.id]);

  useEffect(() => {
    // Read member role from user profile or engagements member collection?
    // Simply fetch engagement member doc
    const unsub = onSnapshot(doc(db, `engagements/${engagement.id}/members/${user!.uid}`), snap => {
      if (snap.exists()) {
        setMemberRole(snap.data().engagementRole);
      } else if (profile?.role === 'Director' || profile?.role === 'Division Chief') {
        setMemberRole(profile.role);
      }
    });
    return unsub;
  }, [engagement.id, user, profile]);

  const addRow = async () => {
    try {
      const ref = doc(collection(db, `engagements/${engagement.id}/movs`));
      await setDoc(ref, {
        documentName: '',
        auditorLink: '',
        auditeeResponse1: '',
        auditeeResponse2: '',
        auditeeResponse3: '',
        status: 'Pending',
        createdBy: user!.uid,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `engagements/${engagement.id}/movs`);
    }
  };

  const updateRow = async (id: string, field: string, value: string) => {
    const m = movs.find(x => x.id === id);
    if (!m) return;

    const updatedData = { ...m, [field]: value };
    let newStatus = updatedData.status;

    if (field.startsWith('auditeeResponse')) {
       newStatus = (updatedData.auditeeResponse1 === 'Provided' && updatedData.auditeeResponse2 === 'Verified') ? 'Completed' : 'Pending';
    }

    try {
      await setDoc(doc(db, `engagements/${engagement.id}/movs`, id), {
        ...updatedData,
        status: newStatus,
        updatedAt: Date.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `engagements/${engagement.id}/movs`);
    }
  };

  if (loading) return <div>Loading MOVs...</div>;

  const isAuditor = ['Auditor', 'Team Leader', 'ATL', 'Director', 'Division Chief'].includes(memberRole);
  const isAuditee = memberRole === 'Auditee';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Management of Verification (MOVs)</h2>
          <p className="text-sm text-gray-500">Track requested documents and auditee responses.</p>
        </div>
        {isAuditor && (
          <button onClick={addRow} className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <Plus size={16} /> Add MOV
          </button>
        )}
      </div>

      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 border-collapse">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="p-4 border-b border-gray-200 font-semibold w-1/4">Document / Link (Auditor)</th>
              <th className="p-4 border-b border-gray-200 font-semibold w-1/5">Response (Auditee)</th>
              <th className="p-4 border-b border-gray-200 font-semibold w-1/5">Secondary Status</th>
              <th className="p-4 border-b border-gray-200 font-semibold w-1/5">Remarks</th>
              <th className="p-4 border-b border-gray-200 font-semibold">Overall Status</th>
            </tr>
          </thead>
          <tbody>
            {movs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">No MOVs added yet.</td>
              </tr>
            )}
            {movs.map(mov => (
              <tr key={mov.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="p-4 align-top">
                  {isAuditor ? (
                    <div className="space-y-2">
                      <input type="text" className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-blue-500" value={mov.documentName} onChange={e => updateRow(mov.id, 'documentName', e.target.value)} placeholder="Document Name" title="Document Name" />
                      <input type="url" className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm text-blue-600 outline-none focus:border-blue-500" value={mov.auditorLink} onChange={e => updateRow(mov.id, 'auditorLink', e.target.value)} placeholder="Google Drive Link" title="Google Drive Link" />
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-gray-900 mb-1">{mov.documentName || 'Unnamed Document'}</p>
                      {mov.auditorLink ? (
                        <a href={mov.auditorLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs break-all flex items-center gap-1">
                          <FileText size={12}/> Open Link
                        </a>
                      ) : <span className="text-xs text-gray-400">No link provided</span>}
                    </div>
                  )}
                </td>
                
                <td className="p-4 align-top">
                  <select 
                    disabled={!isAuditee}
                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-transparent disabled:border-transparent disabled:appearance-none disabled:text-gray-900 font-medium"
                    value={mov.auditeeResponse1} 
                    onChange={e => updateRow(mov.id, 'auditeeResponse1', e.target.value)}
                  >
                    <option value="">- Select -</option>
                    <option value="Provided">Provided</option>
                    <option value="Not Applicable">Not Applicable</option>
                    <option value="To Follow">To Follow</option>
                  </select>
                </td>

                <td className="p-4 align-top">
                  <select 
                    disabled={!isAuditee}
                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-transparent disabled:border-transparent disabled:appearance-none disabled:text-gray-900"
                    value={mov.auditeeResponse2} 
                    onChange={e => updateRow(mov.id, 'auditeeResponse2', e.target.value)}
                  >
                    <option value="">- Select -</option>
                    <option value="Verified">Verified</option>
                    <option value="Requires Modification">Requires Modification</option>
                  </select>
                </td>

                <td className="p-4 align-top">
                  <select 
                    disabled={!isAuditee}
                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-transparent disabled:border-transparent disabled:appearance-none disabled:text-gray-900"
                    value={mov.auditeeResponse3} 
                    onChange={e => updateRow(mov.id, 'auditeeResponse3', e.target.value)}
                  >
                    <option value="">- Select -</option>
                    <option value="Acknowledged">Acknowledged</option>
                    <option value="Pending Review">Pending Review</option>
                  </select>
                </td>

                <td className="p-4 align-top">
                  <span className={clsx("px-2.5 py-1 rounded-lg text-xs font-medium border", 
                    mov.status === 'Completed' ? "bg-green-50 text-green-700 border-green-200" : "bg-orange-50 text-orange-700 border-orange-200"
                  )}>
                    {mov.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

