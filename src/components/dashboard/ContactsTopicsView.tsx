'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Users, Building, MapPin } from 'lucide-react';

interface ContactsTopicsViewProps {
  entities: {
    people: string[];
    organizations: string[];
    places: string[];
  };
  contactDetails: Array<{
    name: string;
    email: string;
    phone: string;
  }>;
}

export function ContactsTopicsView({ entities, contactDetails }: ContactsTopicsViewProps) {
  // Group contacts by frequency
  const contactFrequency = entities.people.reduce((acc, name) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const frequentContacts = Object.entries(contactFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Key Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {frequentContacts.map(([name, frequency]) => (
              <div key={name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <span className="font-semibold">{name.charAt(0)}</span>
                  </Avatar>
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-sm text-muted-foreground">
                      {contactDetails.find(c => c.name === name)?.email || 'No email found'}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{frequency} interactions</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
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
  );
}