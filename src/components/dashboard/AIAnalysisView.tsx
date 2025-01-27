'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  UserCircle, Target, MessageSquare, Clock,
  CheckCircle2, TrendingUp, Brain, Network
} from 'lucide-react';
import type { ContextualInsight } from '@/types/email-analysis';

interface AIAnalysisViewProps {
  analysis: string;
  contextualInsights?: ContextualInsight[];
}

export function AIAnalysisView({ analysis, contextualInsights = [] }: AIAnalysisViewProps) {
  const sections = analysis.split('###').filter(Boolean).map(section => {
    const [title, ...content] = section.split('\n').filter(Boolean);
    return {
      title: title.trim(),
      content: content.map(line => line.replace(/^-\s*/, '').trim())
    };
  });

  const getIconForSection = (title: string) => {
    if (title.includes('Role')) return <UserCircle className="h-5 w-5 text-blue-500" />;
    if (title.includes('Projects')) return <Target className="h-5 w-5 text-purple-500" />;
    if (title.includes('Communication')) return <MessageSquare className="h-5 w-5 text-green-500" />;
    if (title.includes('Time')) return <Clock className="h-5 w-5 text-orange-500" />;
    if (title.includes('Action')) return <CheckCircle2 className="h-5 w-5 text-red-500" />;
    if (title.includes('Pattern')) return <Brain className="h-5 w-5 text-indigo-500" />;
    return <TrendingUp className="h-5 w-5 text-gray-500" />;
  };

  // Group insights by type
  const patternInsights = contextualInsights.filter(i => i.type === 'pattern');
  const actionInsights = contextualInsights.filter(i => i.type === 'action');

  return (
    <div className="space-y-6">
      {/* Contextual Patterns Section */}
      {patternInsights.length > 0 && (
        <Card className="border-t-4 border-t-indigo-500">
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-indigo-500" />
              Behavioral Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {patternInsights.map((insight, index) => (
                <Alert key={index} className="bg-indigo-50">
                  <Network className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">{insight.content}</div>
                    {insight.context.length > 0 && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Based on: {insight.context.join(' • ')}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Original Sections */}
      {sections.map((section, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              {getIconForSection(section.title)}
              {section.title.replace('###', '')}
            </CardTitle>
          </CardHeader>
          <CardContent className="mt-4">
            <div className="space-y-4">
              {section.content.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-primary" />
                  <div className="space-y-1 flex-1">
                    <p className="text-sm leading-relaxed">{item}</p>
                    {section.title.includes('Projects') && (
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {item.includes('Design') ? 'Design' : 
                           item.includes('Research') ? 'Research' : 
                           item.includes('Meeting') ? 'Meetings' : 'Project'}
                        </Badge>
                        {contextualInsights?.find(i => 
                          i.context.some(c => item.toLowerCase().includes(c.toLowerCase()))
                        )?.priority && (
                          <Badge variant="default" className="text-xs">
                            {contextualInsights.find(i => 
                              i.context.some(c => item.toLowerCase().includes(c.toLowerCase()))
                            )?.priority}
                          </Badge>
                        )}
                      </div>
                    )}
                    {section.title.includes('Action Items') && (
                      <div className="flex gap-2 mt-2">
                        <Badge variant="default" className="text-xs">Priority</Badge>
                        <Badge variant="outline" className="text-xs">Next 24h</Badge>
                        {actionInsights.find(i => 
                          i.content.toLowerCase().includes(item.toLowerCase())
                        )?.dueDate && (
                          <Badge variant="secondary" className="text-xs">
                            Due: {actionInsights.find(i => 
                              i.content.toLowerCase().includes(item.toLowerCase())
                            )?.dueDate}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Summary Card */}
      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Key Takeaways
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <div className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-blue-500" />
              <span>Cross-functional role with diverse responsibilities</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-purple-500" />
              <span>High meeting load requiring effective time management</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-green-500" />
              <span>Key collaborator in multiple strategic initiatives</span>
            </li>
            {contextualInsights.length > 0 && (
              <li className="flex items-start gap-2">
                <div className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full bg-indigo-500" />
                <span>Established communication patterns and relationships</span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}