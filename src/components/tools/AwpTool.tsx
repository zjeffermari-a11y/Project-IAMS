import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestoreUtils';
import { useAuth } from '../../App';
import clsx from 'clsx';
import { Plus } from 'lucide-react';

export default function AwpTool({ engagement }: { engagement: any }) {
  const { user, profile } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [signoffs, setSignoffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberRole, setMemberRole] = useState<string>('');

  useEffect(() => {
    const unsubRows = onSnapshot(collection(db, `engagements/${engagement.id}/awpRows`), snap => {
      setRows(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, error => handleFirestoreError(error, OperationType.LIST, `engagements/${engagement.id}/awpRows`));

    const unsubSignoffs = onSnapshot(collection(db, `engagements/${engagement.id}/awpSignoffs`), snap => {
      setSignoffs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, error => handleFirestoreError(error, OperationType.LIST, `engagements/${engagement.id}/awpSignoffs`));

    const unsubRole = onSnapshot(doc(db, `engagements/${engagement.id}/members/${user!.uid}`), snap => {
      if (snap.exists()) {
        setMemberRole(snap.data().engagementRole);
      } else if (profile?.role === 'Director' || profile?.role === 'Division Chief') {
        setMemberRole(profile.role);
      }
    });

    return () => { unsubRows(); unsubSignoffs(); unsubRole(); };
  }, [engagement.id, user, profile]);

  const addRow = async (section: string) => {
    try {
      const ref = doc(collection(db, `engagements/${engagement.id}/awpRows`));
      await setDoc(ref, {
        section,
        objective: '',
        procedure: '',
        reference: '',
        status: 'Draft',
        createdBy: user!.uid,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `engagements/${engagement.id}/awpRows`);
    }
  };

  const updateRow = async (id: string, field: string, value: string) => {
    const r = rows.find(x => x.id === id);
    if (!r) return;
    try {
      await setDoc(doc(db, `engagements/${engagement.id}/awpRows`, id), {
        ...r,
        [field]: value,
        updatedAt: Date.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `engagements/${engagement.id}/awpRows`);
    }
  };

  const signOff = async (stage: string) => {
    try {
      const ref = doc(collection(db, `engagements/${engagement.id}/awpSignoffs`));
      await setDoc(ref, {
        userId: user!.uid,
        userName: profile!.name,
        userRole: profile!.role,
        stage,
        timestamp: Date.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `engagements/${engagement.id}/awpSignoffs`);
    }
  };

  if (loading) return <div>Loading AWP...</div>;

  const sections = ['Planning & Risk Assessment', 'Fieldwork', 'Reporting'];

  const getLatestSignoff = (stage: string) => {
    const matches = signoffs.filter(s => s.stage === stage).sort((a, b) => b.timestamp - a.timestamp);
    return matches[0];
  };

  const preparedBy = getLatestSignoff('Prepared by');
  const reviewedBy = getLatestSignoff('Reviewed by');
  const approvedBy = getLatestSignoff('Approved by');

  let awpStatus = 'Drafting';
  let statusColor = 'bg-gray-100 text-gray-800';
  if (approvedBy) {
    awpStatus = 'Approved';
    statusColor = 'bg-green-100 text-green-800';
  } else if (reviewedBy) {
    awpStatus = 'Under Approval';
    statusColor = 'bg-blue-100 text-blue-800';
  } else if (preparedBy) {
    awpStatus = 'Under Review';
    statusColor = 'bg-orange-100 text-orange-800';
  }

  const canPrepare = ['Auditor', 'Team Leader', 'ATL', 'Director', 'Division Chief'].includes(memberRole);
  const canReview = !!preparedBy && ['Team Leader', 'ATL', 'Director', 'Division Chief'].includes(memberRole);
  const canApprove = !!reviewedBy && ['Team Leader', 'Director', 'Division Chief'].includes(memberRole);

  const canAddRow = awpStatus !== 'Approved' && ['Auditor', 'Team Leader', 'ATL', 'Director', 'Division Chief'].includes(memberRole);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Audit Work Program (AWP)</h2>
          <p className="text-sm text-gray-500 mt-1">Define objectives, procedures, and references.</p>
        </div>
        <div>
          <span className={clsx("px-3 py-1.5 rounded-lg text-sm font-medium border", statusColor, statusColor.replace('bg-', 'border-').replace('100', '200'))}>
            {awpStatus}
          </span>
        </div>
      </div>

      <div className="p-0">
        {sections.map(section => {
          const sectionRows = rows.filter(r => r.section === section);
          return (
            <div key={section} className="border-b border-gray-200 last:border-0 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{section}</h3>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-left text-sm text-gray-600 border-collapse border border-gray-200">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="p-3 border border-gray-200 w-1/4">Objective</th>
                      <th className="p-3 border border-gray-200 w-2/4">Audit Procedure</th>
                      <th className="p-3 border border-gray-200 w-1/4">Reference (MOV)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionRows.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-3 border border-gray-200 text-center text-gray-400 italic">No rows added yet.</td>
                      </tr>
                    )}
                    {sectionRows.map(row => (
                      <tr key={row.id}>
                        <td className="p-0 border border-gray-200">
                          <textarea disabled={!canAddRow} className="w-full h-full p-3 min-h-[80px] resize-none outline-none focus:bg-blue-50 transition-colors disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-not-allowed" value={row.objective} onChange={e => updateRow(row.id, 'objective', e.target.value)} placeholder="Enter objective..." />
                        </td>
                        <td className="p-0 border border-gray-200">
                          <textarea disabled={!canAddRow} className="w-full h-full p-3 min-h-[80px] resize-none outline-none focus:bg-blue-50 transition-colors disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-not-allowed" value={row.procedure} onChange={e => updateRow(row.id, 'procedure', e.target.value)} placeholder="Enter procedure..." />
                        </td>
                        <td className="p-0 border border-gray-200">
                          <input disabled={!canAddRow} type="text" className="w-full h-full p-3 outline-none focus:bg-blue-50 transition-colors disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-not-allowed" value={row.reference} onChange={e => updateRow(row.id, 'reference', e.target.value)} placeholder="e.g. MOV-1" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {canAddRow && (
                <button onClick={() => addRow(section)} className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                  <Plus size={16} /> Add Row to {section}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50 p-6 border-t border-gray-200 rounded-b-xl">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Sign-Offs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SignOffBox title="Prepared by" signoff={preparedBy} onSignOff={() => signOff('Prepared by')} canSignOff={canPrepare} />
          <SignOffBox title="Reviewed by" signoff={reviewedBy} onSignOff={() => signOff('Reviewed by')} canSignOff={canReview} />
          <SignOffBox title="Approved by" signoff={approvedBy} onSignOff={() => signOff('Approved by')} canSignOff={canApprove} />
        </div>

        {signoffs.length > 0 && (
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Sign-Off History Log</h4>
            <div className="space-y-3">
              {[...signoffs].sort((a, b) => b.timestamp - a.timestamp).map(s => (
                <div key={s.id} className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-['Georgia'] italic font-medium text-gray-900">{s.userName}</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] uppercase tracking-wider font-medium">{s.userRole}</span>
                    </div>
                    <div className="text-xs text-gray-500">{new Date(s.timestamp).toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                      {s.stage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SignOffBox({ title, signoff, onSignOff, canSignOff }: { title: string, signoff: any, onSignOff: () => void, canSignOff: boolean }) {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center text-center justify-between min-h-[140px]">
      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">{title}</h4>
      {signoff ? (
        <div className="mb-4">
          <div className="font-['Georgia'] italic text-lg text-gray-900 mb-1">{signoff.userName}</div>
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">{signoff.userRole}</div>
          <div className="text-[10px] text-gray-400 mt-2">{new Date(signoff.timestamp).toLocaleString()}</div>
        </div>
      ) : (
        <div className="text-sm text-gray-400 italic mb-4">Pending</div>
      )}
      {canSignOff && (
        <button onClick={onSignOff} className="w-full py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-sm font-medium transition-colors">
          Sign Off
        </button>
      )}
    </div>
  );
}
