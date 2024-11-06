import React from 'react';
import { Metric } from '@/types/metrics';

interface InsightTooltipProps {
  metric: Metric;
}

export const InsightTooltip: React.FC<InsightTooltipProps> = ({ metric }) => {
  return (
    <div className="absolute z-50 w-80 p-4 bg-white border rounded-lg shadow-lg">
      <div className="font-semibold mb-2 text-lg">{metric.title}</div>
      <div className="space-y-4">
        <div>
          <div className="font-medium text-gray-700">How is this calculated?</div>
          <div className="text-sm text-gray-600">{metric.calculation}</div>
        </div>
        <div>
          <div className="font-medium text-gray-700">Why does this matter?</div>
          <div className="text-sm text-gray-600">{metric.importance}</div>
        </div>
        <div>
          <div className="font-medium text-gray-700">What can you do?</div>
          <ul className="text-sm text-gray-600 list-disc pl-4">
            {metric.actions.map((action, idx) => (
              <li key={idx}>{action}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InsightTooltip;