import stringSimilarity from 'string-similarity';
import type { TopicCluster, TopicNode, TopicLink } from '@/types/email-analysis';

export function clusterTopics(topics: string[]): TopicCluster {
  const nodes: TopicNode[] = topics.map((topic, index) => ({ 
    id: topic, 
    group: index 
  }));
  
  const links: TopicLink[] = [];

  for (let i = 0; i < topics.length; i++) {
    for (let j = i + 1; j < topics.length; j++) {
      const similarity = stringSimilarity.compareTwoStrings(topics[i], topics[j]);
      if (similarity > 0.3) {
        links.push({
          source: topics[i],
          target: topics[j],
          value: similarity
        });
      }
    }
  }

  return { nodes, links };
}