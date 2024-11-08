'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Users, Calendar, Mail, TrendingUp } from 'lucide-react';
import { ContactsTopicsView } from './ContactsTopicsView';
import { ActionableInsights } from './ActionableInsights';
import { AIAnalysisView } from './AIAnalysisView';
import type { EmailAnalysisResult } from '@/types/email-analysis';

interface EmailAnalysisTabProps {
  analysis: EmailAnalysisResult | null;
  setAnalysis: (analysis: EmailAnalysisResult | null) => void;
}

export default function EmailAnalysisTab({ analysis, setAnalysis }: EmailAnalysisTabProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(7);

  const fetchAnalysis = async () => {
    if (!session?.accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: selectedDays })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!analysis) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Email Analysis</h2>
            <p className="text-muted-foreground">
              Analyze your last {selectedDays} days of emails
            </p>
          </div>
          <Button
            onClick={fetchAnalysis}
            disabled={isLoading || !session}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Emails'
            )}
          </Button>
        </div>

        {error && (
          <Card className="bg-destructive/10">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="insights">AI Insights</TabsTrigger>
        <TabsTrigger value="contacts">Contacts & Topics</TabsTrigger>
        <TabsTrigger value="actions">Actionable Insights</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysis.metrics.totalEmails}</div>
              <p className="text-xs text-muted-foreground">
                In the last {selectedDays} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Key Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysis.entities.people.length}</div>
              <p className="text-xs text-muted-foreground">
                Unique contacts identified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Topic Clusters</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysis.topicClusters.nodes.length}</div>
              <p className="text-xs text-muted-foreground">
                Key topics identified
              </p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="insights" className="space-y-4">
        <AIAnalysisView analysis={analysis.analysis} />
      </TabsContent>

      <TabsContent value="contacts" className="space-y-4">
        <ContactsTopicsView 
          entities={analysis.entities}
          contactDetails={analysis.contactDetails}
        />
      </TabsContent>

      <TabsContent value="actions" className="space-y-4">
        <ActionableInsights 
          analysis={analysis.analysis}
          emailMetrics={analysis.metrics}
        />
      </TabsContent>
    </Tabs>
  );
}