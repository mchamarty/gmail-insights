'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, Network, Activity, Clock, ArrowUpRight, 
  MessageCircle, Mail 
} from 'lucide-react';
import { RelationshipInsight, CommunicationPatterns } from '@/types/email-analysis';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

interface NetworkAnalysisProps {
  relationships: {
    topCollaborators: RelationshipInsight[];
    activeProjects: string[];
    communicationPatterns: CommunicationPatterns;
    networkMetrics?: {
      centralPeople: string[];
      clusters: Array<{
        members: string[];
        commonTopics: string[];
      }>;
    };
  };
}

export function NetworkAnalysis({ relationships }: NetworkAnalysisProps) {
  // Transform busy periods data for chart
  const activityData = relationships.communicationPatterns.busyPeriods.map(period => ({
    time: `${period.day} ${period.hour}:00`,
    volume: period.volume
  }));

  return (
    <div className="space-y-6">
      {/* Communication Activity Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Communication Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#2563eb" 
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Best response time: {relationships.communicationPatterns.responseMetrics.bestTime}
              </AlertDescription>
            </Alert>
            <Alert>
              <MessageCircle className="h-4 w-4" />
              <AlertDescription>
                Avg. response: {relationships.communicationPatterns.responseMetrics.averageTime}h
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Key Collaborators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Key Collaborators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {relationships.topCollaborators.map((collaborator, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{collaborator.person}</h4>
                    {collaborator.role && (
                      <p className="text-sm text-muted-foreground">{collaborator.role}</p>
                    )}
                  </div>
                  <Badge variant="outline">
                    {Math.round(collaborator.strength * 100)}% engagement
                  </Badge>
                </div>
                <Progress 
                  value={collaborator.strength * 100} 
                  className="h-2"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {collaborator.interactions.commonTopics.map((topic, i) => (
                    <Badge key={i} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Collaboration Clusters */}
      {relationships.networkMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Collaboration Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relationships.networkMetrics.clusters.map((cluster, index) => (
                <div key={index} className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Group {index + 1}</h4>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {cluster.members.map((member, i) => (
                      <Badge key={i} variant="outline">
                        {member}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Common topics: {cluster.commonTopics.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5" />
            Active Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {relationships.activeProjects.map((project, index) => (
              <div key={index} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{project}</span>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}