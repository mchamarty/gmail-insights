'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, Building, MapPin, Network, Clock, 
  TrendingUp, MessageSquare 
} from 'lucide-react';
import type { ContactDetail, RelationshipInsight } from '@/types/email-analysis';

interface ContactsTopicsViewProps {
  entities: {
    people: string[];
    organizations: string[];
    places: string[];
  };
  contactDetails: ContactDetail[];
  relationships?: {
    topCollaborators: RelationshipInsight[];
    networkMetrics?: {
      centralPeople: string[];
      clusters: Array<{
        members: string[];
        commonTopics: string[];
      }>;
    };
  };
}

export function ContactsTopicsView({ 
  entities, 
  contactDetails,
  relationships 
}: ContactsTopicsViewProps) {
  // Group contacts by frequency
  const contactFrequency = entities.people.reduce((acc, name) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const frequentContacts = Object.entries(contactFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Enhance contact details with relationship data
  const enhancedContacts = frequentContacts.map(([name, frequency]) => {
    const relationshipData = relationships?.topCollaborators.find(
      c => c.person === name
    );
    const contact = contactDetails.find(c => c.name === name);
    
    return {
      name,
      frequency,
      email: contact?.email || '',
      relationshipStrength: relationshipData?.strength || 0,
      commonTopics: relationshipData?.interactions.commonTopics || [],
      lastInteraction: relationshipData?.interactions.lastDate,
      communicationPattern: contact?.communicationPattern
    };
  });

  return (
    <div className="space-y-6">
      {/* Network Overview */}
      {relationships?.networkMetrics && (
        <Card className="border-t-4 border-t-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Network Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {relationships.networkMetrics.clusters.map((cluster, index) => (
                <Alert key={index} className="bg-blue-50">
                  <Users className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">Collaboration Group {index + 1}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {cluster.members.map((member, i) => (
                        <Badge key={i} variant="secondary">
                          {member}
                        </Badge>
                      ))}
                    </div>
                    {cluster.commonTopics.length > 0 && (
                      <div className="text-sm text-muted-foreground mt-2">
                        Focus: {cluster.commonTopics.join(', ')}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Key Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Key Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {enhancedContacts.map(contact => (
                <div key={contact.name} className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <span className="font-semibold">{contact.name.charAt(0)}</span>
                      </Avatar>
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {contact.email || 'No email found'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{contact.frequency} interactions</Badge>
                      {contact.lastInteraction && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Last: {new Date(contact.lastInteraction).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  {contact.relationshipStrength > 0 && (
                    <div className="space-y-1 px-2">
                      <div className="flex justify-between text-sm">
                        <span>Relationship Strength</span>
                        <span>{Math.round(contact.relationshipStrength * 100)}%</span>
                      </div>
                      <Progress value={contact.relationshipStrength * 100} />
                    </div>
                  )}
                  {contact.commonTopics.length > 0 && (
                    <div className="flex flex-wrap gap-1 px-2">
                      {contact.commonTopics.map((topic, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {contact.communicationPattern && (
                    <div className="flex gap-2 px-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Best response: {contact.communicationPattern.preferredTime}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Organizations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Organizations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {entities.organizations.map((org, index) => (
                  <Badge key={index} variant="outline">{org}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Communication Stats */}
          {relationships?.topCollaborators[0]?.interactions.patterns && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Communication Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {relationships.topCollaborators.slice(0, 3).map((collab, i) => (
                    <Alert key={i}>
                      <TrendingUp className="h-4 w-4" />
                      <AlertDescription>
                        <span className="font-medium">{collab.person}:</span>{' '}
                        {collab.interactions.patterns?.timeOfDay?.join(', ')}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Locations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {entities.places.map((place, index) => (
                  <Badge key={index} variant="outline">{place}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}