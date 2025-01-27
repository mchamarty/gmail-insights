import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRetry } from './useRetry';
import type { EmailAnalysisResult } from '@/types/email-analysis';

interface AnalysisStage {
  name: string;
  progress: number;
  status: 'pending' | 'processing' | 'complete' | 'error';
}

export function useEmailAnalysis() {
  const { data: session } = useSession();
  const [selectedDays, setSelectedDays] = useState(7);
  const [stages, setStages] = useState<AnalysisStage[]>([
    { name: 'Fetching emails', progress: 0, status: 'pending' },
    { name: 'Processing content', progress: 0, status: 'pending' }
  ]);

  // Debug stages changes
  useEffect(() => {
    console.log('Stages updated:', JSON.stringify(stages, null, 2));
  }, [stages]);

  const updateStage = useCallback((index: number, updates: Partial<AnalysisStage>) => {
    console.log(`Updating stage ${index}:`, updates);
    setStages(current => {
      const updated = current.map((stage, i) => 
        i === index ? { ...stage, ...updates } : stage
      );
      return updated;
    });
  }, []);

  const fetchAnalysis = useCallback(async () => {
    console.log('=== Starting Analysis ===');
  console.log('Session:', session);
  console.log('Access Token exists:', !!session?.accessToken);
  console.log('Selected Days:', selectedDays);

  if (!session?.accessToken) {
    console.error('No access token found');
    throw new Error('Please sign in to analyze emails');
  }
    console.log('Starting fetchAnalysis...');
    if (!session?.accessToken) {
      console.error('No access token found');
      throw new Error('Please sign in to analyze emails');
    }

    try {
      // Reset stages
      console.log('Resetting stages...');
      setStages(stages => stages.map(stage => ({
        ...stage,
        progress: 0,
        status: 'pending'
      })));

      // Stage 1: Fetching
      console.log('Starting email fetch...');
      updateStage(0, { status: 'processing', progress: 10 });
      
      const response = await fetch('/api/analyze-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: selectedDays })
      });

      updateStage(0, { progress: 50 });

      if (!response.ok) {
        console.error('API response not OK:', response.status);
        throw new Error(`Analysis failed: ${response.status}`);
      }

      updateStage(0, { progress: 100, status: 'complete' });

      // Stage 2: Processing
      console.log('Processing response...');
      updateStage(1, { status: 'processing', progress: 20 });
      
      const data = await response.json();
      console.log('Response parsed successfully');
      
      updateStage(1, { progress: 100, status: 'complete' });

      return data as EmailAnalysisResult;
    } catch (error) {
      console.error('Analysis error:', error);
      setStages(stages => stages.map(stage => ({
        ...stage,
        status: 'error'
      })));
      throw error;
    }
  }, [session, selectedDays, updateStage]);

  const { data, isLoading, error, retry } = useRetry<EmailAnalysisResult>(fetchAnalysis, [selectedDays]);

  // Reset stages when loading completes
  useEffect(() => {
    console.log('Loading state changed:', isLoading);
    if (!isLoading && stages.some(s => s.status === 'processing')) {
      console.log('Resetting stages after load');
      setStages(stages => stages.map(stage => ({
        ...stage,
        progress: 0,
        status: 'pending'
      })));
    }
  }, [isLoading, stages]);

  // Calculate total progress with better debugging
  const totalProgress = Math.min(
    100,
    stages.reduce((acc, stage) => {
      const stageContribution = stage.progress / stages.length;
      console.log(`Stage progress contribution: ${stage.name} = ${stageContribution}`);
      return acc + stageContribution;
    }, 0)
  );

  return { 
    data, 
    isLoading, 
    error, 
    retry,
    selectedDays,
    setSelectedDays,
    stages,
    progress: totalProgress
  };
}