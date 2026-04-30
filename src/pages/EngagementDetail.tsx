import React, { useEffect, useState } from 'react';
import { useParams, Link, Routes, Route, useLocation } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../App';

import AwpTool from '../components/tools/AwpTool';
import MovTool from '../components/tools/MovTool';
import PlanningTool from '../components/tools/PlanningTool';
import TeamManager from '../components/tools/TeamManager';

export default function EngagementDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [engagement, setEngagement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, 'engagements', id), (snap) => {
      if (snap.exists()) {
        setEngagement({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `engagements/${id}`);
    });
    return unsub;
  }, [id]);

  if (loading) return <div className="p-8 text-gray-500">Loading engagement...</div>;
  if (!engagement) return <div className="p-8 text-gray-500">Engagement not found.</div>;

  const tabs = [
    { label: 'Overview', path: '' },
    { label: 'Audit Work Program', path: 'awp' },
    { label: 'MOVs', path: 'movs' },
    { label: 'Planning', path: 'planning' },
    { label: 'Team', path: 'team' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center text-sm text-gray-500 mb-2 gap-2">
        <Link to="/engagements" className="hover:text-blue-600">Engagements</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium truncate max-w-md">{engagement.title}</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">{engagement.title}</h1>
          <p className="text-gray-500 mt-1">{engagement.typeOfAudit} · Status: {engagement.status}</p>
        </div>
        <div className="px-6 flex gap-6 overflow-x-auto border-b border-gray-200">
          {tabs.map(tab => {
            const fullPath = `/engagements/${id}${tab.path ? `/${tab.path}` : ''}`;
            const isActive = tab.path === '' ? location.pathname === `/engagements/${id}` : location.pathname.startsWith(`/engagements/${id}/${tab.path}`);
            return (
              <Link
                key={tab.path}
                to={fullPath}
                className={clsx(
                  "py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap",
                  isActive ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        
        <div className="p-6 bg-gray-50 rounded-b-xl min-h-[500px]">
          <Routes>
            <Route path="/" element={<Overview engagement={engagement} />} />
            <Route path="awp" element={<AwpTool engagement={engagement} />} />
            <Route path="movs" element={<MovTool engagement={engagement} />} />
            <Route path="planning" element={<PlanningTool engagement={engagement} />} />
            <Route path="team" element={<TeamManager engagement={engagement} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function Overview({ engagement }: { engagement: any }) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Engagement Details</h3>
        <div className="grid grid-cols-2 gap-y-4 text-sm">
          <div>
            <p className="text-gray-500">Audit Type</p>
            <p className="font-medium text-gray-900">{engagement.typeOfAudit}</p>
          </div>
          <div>
            <p className="text-gray-500">Period</p>
            <p className="font-medium text-gray-900">{engagement.periodStart} to {engagement.periodEnd}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Reference Documents</h3>
        <div>
          <p className="text-sm text-gray-500 mb-1">Flowchart</p>
          {engagement.flowchartUrl ? (
            <a href={engagement.flowchartUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{engagement.flowchartUrl}</a>
          ) : <span className="text-gray-400">Not provided</span>}
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Feedback Survey Form</p>
          {engagement.feedbackSurveyUrl ? (
            <a href={engagement.feedbackSurveyUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{engagement.feedbackSurveyUrl}</a>
          ) : <span className="text-gray-400">Not provided</span>}
        </div>
      </div>
    </div>
  );
}
