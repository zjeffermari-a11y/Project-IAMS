import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { useEngagements } from '../hooks/useEngagements';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { FileText, CheckSquare, Clock } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

interface MovInventoryItem {
  id: string;
  documentName: string;
  auditorLink: string;
  auditeeResponse1: string;
  auditeeResponse2: string;
  auditeeResponse3: string;
  status: string;
  engagementId: string;
  engagementTitle: string;
}

export default function MovInventory() {
  const { engagements, loading: engagementsLoading } = useEngagements();
  const [movs, setMovs] = useState<MovInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (engagementsLoading) return;
    if (engagements.length === 0) {
      setLoading(false);
      return;
    }

    async function fetchMovs() {
      try {
        const allMovs: MovInventoryItem[] = [];
        for (const eng of engagements) {
          const movsRef = collection(db, `engagements/${eng.id}/movs`);
          const snapshot = await getDocs(movsRef);
          snapshot.forEach(doc => {
            const data = doc.data();
            allMovs.push({
              id: doc.id,
              engagementId: eng.id,
              engagementTitle: eng.title,
              ...data
            } as MovInventoryItem);
          });
        }
        setMovs(allMovs);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'movs');
      } finally {
        setLoading(false);
      }
    }
    fetchMovs();
  }, [engagementsLoading, engagements]);

  const stats = {
    total: movs.length,
    completed: movs.filter(m => m.status === 'Completed').length,
    pending: movs.filter(m => m.status === 'Pending').length,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">MOV Inventory</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><FileText size={20} /></div>
          <div>
            <p className="text-gray-500 text-sm">Total MOVs</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center"><CheckSquare size={20} /></div>
          <div>
            <p className="text-gray-500 text-sm">Completed</p>
            <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center"><Clock size={20} /></div>
          <div>
            <p className="text-gray-500 text-sm">Pending</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-medium">
              <tr>
                <th className="px-6 py-4 border-b border-gray-200">Document Name</th>
                <th className="px-6 py-4 border-b border-gray-200">Engagement</th>
                <th className="px-6 py-4 border-b border-gray-200">Responses (1,2,3)</th>
                <th className="px-6 py-4 border-b border-gray-200">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading || engagementsLoading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading MOVs...</td></tr>
              ) : movs.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No MOVs found across engagements.</td></tr>
              ) : (
                movs.map(mov => (
                  <tr key={mov.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                       <a href={mov.auditorLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                         {mov.documentName}
                       </a>
                    </td>
                    <td className="px-6 py-4">{mov.engagementTitle}</td>
                    <td className="px-6 py-4 max-w-xs truncate" title={`${mov.auditeeResponse1} | ${mov.auditeeResponse2} | ${mov.auditeeResponse3}`}>
                       {mov.auditeeResponse1 || '-'} / {mov.auditeeResponse2 || '-'} / {mov.auditeeResponse3 || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx("px-2 py-1 rounded text-xs font-medium", 
                        mov.status === 'Completed' ? "bg-green-100 text-green-800" :
                        "bg-orange-100 text-orange-800"
                      )}>{mov.status || 'Pending'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
