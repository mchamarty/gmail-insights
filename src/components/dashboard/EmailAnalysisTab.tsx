'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, Mail, Brain, Network, Users, Calendar, AlertTriangle 
} from 'lucide-react';
import { EmailInsightsDashboard } from './EmailInsightsDashboard';
import { ContactsTopicsView } from './ContactsTopicsView';
import { ActionableInsights } from './ActionableInsights';
import { AIAnalysisView } from './AIAnalysisView';
import { NetworkAnalysis } from './NetworkAnalysis';
import { useEmailAnalysis } from '@/hooks/useEmailAnalysis';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function EmailAnalysisTab() {
  const { data: session } = useSession();
  const { 
    data: analysis, 
    isLoading, 
    error, 
    retry,
    selectedDays,
    setSelectedDays,
    stages,
    progress
  } = useEmailAnalysis();

  useEffect(() => {
    console.log('Component mounted with session:', session);
  }, [session]);

  const renderTimeRangeSelect = () => (
    <select
      className="px-3 py-2 rounded-md border bg-background"
      value={selectedDays?.toString()}
      onChange={(e) => setSelectedDays?.(parseInt(e.target.value))}
    >
      <option value="7">Last 7 days</option>
      <option value="14">Last 14 days</option>
      <option value="30">Last 30 days</option>
    </select>
  );

  const handleAnalyze = () => {
    console.log('Analyze button clicked');
    console.log('Current session:', session);
    console.log('Selected days:', selectedDays);
    retry();
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">
          {analysis ? 'Communication Insights' : 'Enhanced Email Analysis'}
        </h2>
        <p className="text-muted-foreground">
          {isLoading 
            ? `Analyzing your communications... ${Math.round(progress)}%`
            : 'Deep analysis of your communications'
          }
        </p>
      </div>
      <div className="flex items-center gap-4">
        {renderTimeRangeSelect()}
        {!analysis && (
          <Button 
            onClick={handleAnalyze}
            disabled={isLoading || !session}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : !session ? (
              'Sign in to analyze'
            ) : (
              'Analyze Emails'
            )}
          </Button>
        )}
      </div>
    </div>
  );

  const renderError = () => error && (
    <Card className="bg-destructive/10">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <p className="text-destructive">{error.message}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        {renderHeader()}
        
        <Progress 
          value={Math.min(100, progress)} 
          className="w-full h-2" 
        />
        
        <div className="grid gap-6 md:grid-cols-2">
          {stages.map((stage, index) => (
            <Card key={index}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{stage.name}</h3>
                  <span className={`text-sm ${
                    stage.status === 'error' ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {stage.status === 'complete' ? '✓' : 
                     stage.status === 'error' ? '✗' :
                     stage.status === 'processing' ? `${stage.progress}%` :
                     'Pending'}
                  </span>
                </div>
                <Progress 
                  value={stage.progress} 
                  className={`h-2 ${
                    stage.status === 'error' ? 'bg-destructive/20' : ''
                  }`}
                />
                <div className="h-32 bg-muted/20 rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {renderError()}
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="space-y-8">
        {renderHeader()}
        {renderError()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderHeader()}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="network" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Network
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Actions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <EmailInsightsDashboard analysis={analysis} />
        </TabsContent>

        <TabsContent value="insights">
          <AIAnalysisView 
            analysis={analysis.analysis}
            contextualInsights={analysis.contextualInsights}
          />
        </TabsContent>

        <TabsContent value="network">
          <NetworkAnalysis relationships={analysis.relationships} />
        </TabsContent>

        <TabsContent value="contacts">
          <ContactsTopicsView 
            entities={analysis.entities}
            contactDetails={analysis.contactDetails}
            relationships={analysis.relationships}
          />
        </TabsContent>

        <TabsContent value="actions">
          <ActionableInsights 
            analysis={analysis.analysis}
            emailMetrics={analysis.metrics}
            contextualInsights={analysis.contextualInsights}
          />
        </TabsContent>
      </Tabs>

      {renderError()}
    </div>
  );
}