/** Future AI module — stub only. See docs/AI-ROADMAP.md */

import { config } from '../../config.js';

export function isAiEnabled(): boolean {
  return config.aiEnabled;
}

export async function getAiInsightsPlaceholder(_shopId: string) {
  return {
    enabled: isAiEnabled(),
    message: 'AI insights coming soon. Share your AI plan to enable this module.',
    insights: [] as string[],
  };
}
