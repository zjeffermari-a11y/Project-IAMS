import React, { useState } from 'react';
import { useAuth } from '../App';
import { useEngagements } from '../hooks/useEngagements';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { format } from 'date-fns';
import NewEngagementModal from '../components/NewEngagementModal';

export default function Engagements() {
  const { profile } = useAuth();
  const { engagements, loading } = useEngagements();
  const [showModal, setShowModal] = useState(false);

  const canCreateEngagement = profile?.role === 'Director' || profile?.role === 'Division Chief';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Engagements</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track your audit projects</p>
        </div>
        
        {canCreateEngagement && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            New Engagement
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-medium">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl border-b border-gray-200">Title</th>
                <th className="px-6 py-4 border-b border-gray-200">Type</th>
                <th className="px-6 py-4 border-b border-gray-200">Period</th>
                <th className="px-6 py-4 border-b border-gray-200">Status</th>
                <th className="px-6 py-4 rounded-tr-xl border-b border-gray-200 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading engagements...</td>
                </tr>
              ) : engagements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No active engagements found.</td>
                </tr>
              ) : (
                engagements.map((eng) => (
                  <tr key={eng.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{eng.title}</td>
                    <td className="px-6 py-4">{eng.typeOfAudit}</td>
                    <td className="px-6 py-4">{format(new Date(eng.periodStart), 'MMM dd, yyyy')} - {format(new Date(eng.periodEnd), 'MMM dd, yyyy')}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">{eng.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/engagements/${eng.id}`} className="text-blue-600 hover:underline font-medium">View Tools</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <NewEngagementModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
