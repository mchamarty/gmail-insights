'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Users,
  Calendar,
  Mail,
  TrendingUp,
  Clock,
  Brain,
  Network
} from 'lucide-react';
import type { EmailAnalysisResult, RelationshipInsight, ContextualInsight } from '@/types/email-analysis';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  analysis: EmailAnalysisResult;
}

export function EmailInsightsDashboard({ analysis }: DashboardProps) {
  const urgentInsights = analysis.contextualInsights.filter(i => i.priority === 'high');
  const relationshipInsights = analysis.relationships.topCollaborators;

  const getActivityData = () => {
    return analysis.relationships.communicationPatterns.busyPeriods.map(period => ({
      time: `${period.day} ${period.hour}:00`,
      volume: period.volume
    }));
  };

  return (
    <div className="space-y-6">
      {/* Overview Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Email Volume"
          value={analysis.metrics.totalEmails}
          icon={<Mail />}
          change={10}
          subtext="Last 7 days"
        />
        <MetricCard
          title="Active Collaborators"
          value={analysis.relationships.topCollaborators.length}
          icon={<Users />}
          change={5}
          subtext="Regular contacts"
        />
        <MetricCard
          title="Response Rate"
          value={`${Math.round(analysis.relationships.communicationPatterns.responseMetrics.averageTime)}h`}
          icon={<Clock />}
          change={-15}
          subtext="Average response time"
        />
      </div>

      {/* Priority Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Priority Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {urgentInsights.map((insight, index) => (
            <Alert key={index} className={
              insight.priority === 'high' ? 'bg-red-50' :
              insight.priority === 'medium' ? 'bg-yellow-50' : 'bg-blue-50'
            }>
              <AlertDescription>
                <div className="font-medium">{insight.content}</div>
                {insight.context.length > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    Context: {insight.context.join(' • ')}
                  </div>
                )}
                {insight.dueDate && (
                  <Badge variant="outline" className="mt-2">
                    Due: {new Date(insight.dueDate).toLocaleDateString()}
                  </Badge>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>

      {/* Activity Patterns */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Communication Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={getActivityData()}>
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="volume" stroke="#2563eb" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Relationships</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relationshipInsights.slice(0, 3).map((relation, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{relation.person}</div>
                    <Badge variant="outline">
                      {relation.interactions.frequency} interactions
                    </Badge>
                  </div>
                  <Progress 
                    value={relation.strength * 100} 
                    className="h-2"
                  />
                  <div className="text-sm text-gray-600">
                    Common topics: {relation.interactions.commonTopics.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Insights */}
      {analysis.relationships.networkMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Network Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.relationships.networkMetrics.clusters.map((cluster, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium mb-2">
                    Collaboration Group {index + 1}
                  </div>
                  <div className="text-sm text-gray-600">
                    Members: {cluster.members.join(', ')}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Focus: {cluster.commonTopics.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change?: number;
  subtext: string;
}

function MetricCard({ title, value, icon, change, subtext }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className={`text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
          </div>
        )}
        <p className="text-xs text-muted-foreground">{subtext}</p>
      </CardContent>
    </Card>
  );
}