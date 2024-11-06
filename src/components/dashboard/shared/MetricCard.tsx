import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { HelpCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { Metric } from '@/types/metrics';
import InsightTooltip from './InsightTooltip';

interface MetricCardProps {
  title: string;
  metric: Metric;
  children: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, metric, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {metric.icon && <metric.icon className="h-5 w-5" />}
          <span className="flex-grow">{title}</span>
          <button
            className="ml-2 relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <HelpCircle className="h-4 w-4 text-gray-400" />
            {showTooltip && <InsightTooltip metric={metric} />}
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className={`${isExpanded ? '' : 'max-h-64 overflow-hidden'}`}>
        {children}
      </CardContent>
    </Card>
  );
};

export default MetricCard;