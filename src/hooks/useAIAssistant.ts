'use client';

import { useState, useCallback } from 'react';
import { useCompletion } from 'ai/react';

export function useAIAssistant() {
  const [summaryResult, setSummaryResult] = useState<string>('');
  const [improveResult, setImproveResult] = useState<string>('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingImprove, setIsLoadingImprove] = useState(false);

  const { completion: autocompleteResult, complete: triggerAutocomplete, isLoading: isLoadingAutocomplete } =
    useCompletion({
      api: '/api/ai/autocomplete',
    });

  const summarize = useCallback(async (content: string) => {
    setIsLoadingSummary(true);
    setSummaryResult('');
    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error('Summarize failed');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        
        const lines = chunk.split('\n').filter((l) => l.trim());
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const text = JSON.parse(line.slice(2));
              result += text;
              setSummaryResult(result);
            } catch {
              
            }
          }
        }
      }
    } catch (error) {
      console.error('Summarize error:', error);
      setSummaryResult('Failed to summarize. Please try again.');
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  const improve = useCallback(async (text: string) => {
    setIsLoadingImprove(true);
    setImproveResult('');
    try {
      const response = await fetch('/api/ai/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('Improve failed');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((l) => l.trim());
        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const parsed = JSON.parse(line.slice(2));
              result += parsed;
              setImproveResult(result);
            } catch {
              
            }
          }
        }
      }
    } catch (error) {
      console.error('Improve error:', error);
      setImproveResult('Failed to improve text. Please try again.');
    } finally {
      setIsLoadingImprove(false);
    }
  }, []);

  const autocomplete = useCallback(
    async (context: string) => {
      await triggerAutocomplete(context);
    },
    [triggerAutocomplete],
  );

  return {
    summarize,
    summaryResult,
    isLoadingSummary,
    improve,
    improveResult,
    isLoadingImprove,
    autocomplete,
    autocompleteResult,
    isLoadingAutocomplete,
    clearResults: () => {
      setSummaryResult('');
      setImproveResult('');
    },
  };
}
