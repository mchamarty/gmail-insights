'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, AlertTriangle, CheckCircle2, ArrowUpRight,
  UserCheck, XCircle, PieChart, TrendingUp, Users, Brain 
} from 'lucide-react';
import type { EmailMetrics, ContextualInsight } from '@/types/email-analysis';

interface ActionableInsightsProps {
  analysis: string;
  emailMetrics: EmailMetrics;
  contextualInsights: ContextualInsight[];
}

export function ActionableInsights({ analysis, emailMetrics, contextualInsights }: ActionableInsightsProps) {
  const sections = analysis.split('###').filter(Boolean).map(section => {
    const [title, ...content] = section.split('\n').filter(Boolean);
    return { 
      title: title.trim().replace('###', '').trim(),
      content: content.map(line => line.replace(/^-\s*/, '').trim())
    };
  });

  const actionItems = sections.find(s => s.title.includes('Action Items'))?.content || [];
  const responsibilities = sections.find(s => s.title.includes('Role & Responsibilities'))?.content || [];
  const timeAllocation = sections.find(s => s.title.includes('Time Allocation'))?.content || [];
  const projects = sections.find(s => s.title.includes('Projects/Workstreams'))?.content || [];

  const urgentEmails = (emailMetrics.recentEmails || [])
    .filter(email => {
      const isUrgent = email.subject.toLowerCase().includes('urgent') ||
                      email.subject.toLowerCase().includes('asap') ||
                      email.subject.toLowerCase().includes('priority');
      const isFromKeyStakeholder = responsibilities.some(r => 
        email.from.toLowerCase().includes(r.toLowerCase())
      );
      return email.isUnread && (isUrgent || isFromKeyStakeholder);
    })
    .slice(0, 3);

  const workFocus = {
    meetings: timeAllocation.filter(t => t.toLowerCase().includes('meeting')).length,
    projects: projects.length,
    communication: timeAllocation.filter(t => t.toLowerCase().includes('communication')).length,
    total: timeAllocation.length || 1
  };

  const urgentInsights = contextualInsights.filter(i => i.priority === 'high');
  const mediumInsights = contextualInsights.filter(i => i.priority === 'medium');

  return (
    <div className="space-y-6">
      {/* Critical Context & Actions */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-red-500" />
            Critical Context & Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {urgentInsights.map((insight, index) => (
            <Alert key={index} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>High Priority Action</AlertTitle>
              <AlertDescription>
                <div className="mt-2">{insight.content}</div>
                {insight.context.length > 0 && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Context: {insight.context.join(' • ')}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>

      {/* Work Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Work Focus Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-500" />
                Work Focus Distribution
              </div>
              <Badge variant="outline" className="ml-2">Last 7 days</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Meetings & Collaboration</span>
                <span>{Math.round((workFocus.meetings / workFocus.total) * 100)}%</span>
              </div>
              <Progress value={(workFocus.meetings / workFocus.total) * 100} className="bg-purple-100" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Project Work</span>
                <span>{Math.round((workFocus.projects / workFocus.total) * 100)}%</span>
              </div>
              <Progress value={(workFocus.projects / workFocus.total) * 100} className="bg-blue-100" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Communication</span>
                <span>{Math.round((workFocus.communication / workFocus.total) * 100)}%</span>
              </div>
              <Progress value={(workFocus.communication / workFocus.total) * 100} className="bg-green-100" />
            </div>
          </CardContent>
        </Card>

        {/* Projects & Stakeholders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Key Projects & Stakeholders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.slice(0, 3).map((project, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-blue-500 mt-1" />
                    <div>
                      <p className="font-medium">{project}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {responsibilities.find(r => 
                          project.toLowerCase().includes(r.toLowerCase())
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
