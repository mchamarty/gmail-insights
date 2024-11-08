'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight,
  UserCheck,
  XCircle,
  PieChart,
  TrendingUp,
  Users 
} from 'lucide-react';

interface ActionableInsightsProps {
  analysis: string;
  emailMetrics: {
    totalEmails: number;
    recentEmails?: Array<{
      subject: string;
      from: string;
      date: string;
      isUnread: boolean;
    }>;
  };
}

export function ActionableInsights({ analysis, emailMetrics }: ActionableInsightsProps) {
  // Parse sections with improved formatting
  const sections = analysis.split('###').filter(Boolean).map(section => {
    const [title, ...content] = section.split('\n').filter(Boolean);
    return { 
      title: title.trim().replace('###', '').trim(),
      content: content.map(line => line.replace(/^-\s*/, '').trim())
    };
  });

  // Extract key metrics and insights
  const actionItems = sections.find(s => s.title.includes('Action Items'))?.content || [];
  const responsibilities = sections.find(s => s.title.includes('Role & Responsibilities'))?.content || [];
  const timeAllocation = sections.find(s => s.title.includes('Time Allocation'))?.content || [];
  const projects = sections.find(s => s.title.includes('Projects/Workstreams'))?.content || [];

  // Enhanced urgent email detection with null check
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

  // Calculate work focus distribution
  const workFocus = {
    meetings: timeAllocation.filter(t => t.toLowerCase().includes('meeting')).length,
    projects: projects.length,
    communication: timeAllocation.filter(t => t.toLowerCase().includes('communication')).length,
    total: timeAllocation.length || 1 // Prevent division by zero
  };

  return (
    <div className="space-y-6">
      {/* Priority Actions Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Priority Actions (Next 24 Hours)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {urgentEmails.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-bold">Urgent Attention Required</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-2">
                  {urgentEmails.map((email, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span>"{email.subject}" from {email.from}</span>
                      <Badge variant="destructive">Urgent</Badge>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">High Priority Actions</h4>
              <Badge variant="outline">{actionItems.length} items</Badge>
            </div>
            <ul className="space-y-3">
              {actionItems.slice(0, 3).map((item, i) => (
                <li key={i} className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>{item}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Recommended timeframe: Next 24 hours
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Work Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
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

      {/* Deprioritization Suggestions */}
      <Card className="border-l-4 border-l-yellow-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-yellow-500" />
            Consider Deprioritizing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {(emailMetrics.recentEmails || [])
              .filter(email => 
                !email.subject.toLowerCase().includes('urgent') &&
                !responsibilities.some(r => 
                  email.subject.toLowerCase().includes(r.toLowerCase())
                )
              )
              .slice(0, 5)
              .map((email, i) => (
                <li key={i} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{email.subject}</p>
                    <p className="text-xs text-muted-foreground mt-1">From: {email.from}</p>
                  </div>
                  <Badge variant="outline" className="ml-2">Low Priority</Badge>
                </li>
              ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}