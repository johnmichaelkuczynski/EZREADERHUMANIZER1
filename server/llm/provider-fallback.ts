export const AI_PROVIDERS = ['anthropic', 'openai', 'deepseek', 'perplexity'] as const;

export type AIProvider = typeof AI_PROVIDERS[number];

function isAIProvider(provider: string): provider is AIProvider {
  return AI_PROVIDERS.includes(provider as AIProvider);
}

export function getProviderOrder(preferredProvider: string): AIProvider[] {
  const preferred = isAIProvider(preferredProvider) ? preferredProvider : AI_PROVIDERS[0];
  return [preferred, ...AI_PROVIDERS.filter(provider => provider !== preferred)];
}

export async function withProviderFallback<T>(
  preferredProvider: string,
  operation: string,
  execute: (provider: AIProvider) => Promise<T>,
): Promise<T> {
  const providerOrder = getProviderOrder(preferredProvider);

  for (const provider of providerOrder) {
    try {
      const result = await execute(provider);

      if (
        result === null ||
        result === undefined ||
        (typeof result === 'string' && !result.trim())
      ) {
        throw new Error('Provider returned an empty response.');
      }

      return result;
    } catch (error) {
      console.warn(
        `[AI fallback] ${provider} failed during ${operation}; trying the next provider.`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  throw new Error('All AI providers are temporarily unavailable.');
}