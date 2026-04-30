import React from 'react';
import { useAuth } from '../App';
import { useEngagements } from '../hooks/useEngagements';
import { Link } from 'react-router-dom';
import { FileText, CheckSquare, Bell, PenTool, LayoutTemplate, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { profile } = useAuth();
  const { engagements, loading } = useEngagements();

  const canCreateEngagement = profile?.role === 'Director' || profile?.role === 'Division Chief';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        {canCreateEngagement && (
          <Link to="/engagements/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            + New Audit Engagement
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AWP Status Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 col-span-1 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4 text-gray-900">
            <LayoutTemplate size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold">AWP Status</h2>
          </div>
          {loading ? (
            <div className="text-gray-500 text-sm">Loading...</div>
          ) : engagements.length === 0 ? (
            <div className="text-gray-500 text-sm">No active AWPs found.</div>
          ) : (
            <div className="space-y-3">
              {engagements.map(eng => (
                <div key={eng.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{eng.title}</p>
                    <p className="text-xs text-gray-500">{eng.typeOfAudit}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">In Progress</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4 text-gray-900">
            <Bell size={20} className="text-red-500" />
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
          <div className="text-gray-500 text-sm">
            <p>You're all caught up!</p>
          </div>
        </div>

        {/* Audit Engagements Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 col-span-1 lg:col-span-3">
          <div className="flex justify-between items-center mb-4 text-gray-900">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-indigo-600" />
              <h2 className="text-lg font-semibold">Audit Engagements</h2>
            </div>
            <Link to="/engagements" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-medium">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3 rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                {engagements.slice(0, 5).map((eng) => (
                  <tr key={eng.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <Link to={`/engagements/${eng.id}`} className="hover:text-blue-600 hover:underline">{eng.title}</Link>
                    </td>
                    <td className="px-4 py-3">{eng.typeOfAudit}</td>
                    <td className="px-4 py-3">{format(new Date(eng.periodStart), 'MMM yyyy')} - {format(new Date(eng.periodEnd), 'MMM yyyy')}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs">{eng.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MOV Progress Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 col-span-1 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4 text-gray-900">
            <CheckSquare size={20} className="text-green-600" />
            <h2 className="text-lg font-semibold">MOV Progress</h2>
          </div>
          <div className="space-y-4">
            {engagements.map(eng => (
               <div key={eng.id}>
                 <div className="flex justify-between text-sm mb-1">
                   <span className="font-medium text-gray-700">{eng.title}</span>
                   <span className="text-gray-500">0%</span>
                 </div>
                 <div className="w-full bg-gray-100 rounded-full h-2">
                   <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                 </div>
               </div>
            ))}
          </div>
        </div>

        {/* Generated Tools Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4 text-gray-900">
            <PenTool size={20} className="text-orange-500" />
            <h2 className="text-lg font-semibold">Generated Tools</h2>
          </div>
          <p className="text-sm text-gray-500 mb-2">Tools across all engagements:</p>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>• Audit Work Program (AWP)</li>
            <li>• Management of Verification (MOVs)</li>
          </ul>
        </div>
        
        {/* Supplementary Modules */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-sm p-6 col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-2"><Activity size={20} /> IAS Cares Module</h2>
            <p className="text-blue-100 text-sm">Under construction. Tracking relevant metrics.</p>
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-2"><Activity size={20} /> AAPES Dashboard</h2>
            <p className="text-blue-100 text-sm">Under construction.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
