'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  UserCircle,
  Target,
  MessageSquare,
  Clock,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';

interface AIAnalysisViewProps {
  analysis: string;
}

export function AIAnalysisView({ analysis }: AIAnalysisViewProps) {
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
    return <TrendingUp className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
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
                      </div>
                    )}
                    {section.title.includes('Action Items') && (
                      <div className="flex gap-2 mt-2">
                        <Badge variant="default" className="text-xs">Priority</Badge>
                        <Badge variant="outline" className="text-xs">Next 24h</Badge>
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
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}