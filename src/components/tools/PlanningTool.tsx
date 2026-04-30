import React from 'react';
import { Construction } from 'lucide-react';

export default function PlanningTool({ engagement }: { engagement: any }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center flex flex-col items-center justify-center">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
        <Construction size={32} />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Buong Planning Tool</h2>
      <p className="text-gray-500 max-w-md">This module covers the complete planning phase of the audit engagement (pre-audit activities, resource allocation, scheduling).</p>
      <div className="mt-6 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">Pending further specifications</div>
    </div>
  );
}
