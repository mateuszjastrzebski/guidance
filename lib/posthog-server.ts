import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

export function getPostHogClient(): PostHog {
  if (!posthogClient) {
    const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
    if (!token) {
      throw new Error("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is not set");
    }
    posthogClient = new PostHog(token, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 20,
      flushInterval: 10_000,
    });
  }
  return posthogClient;
}

/** Graceful shutdown (np. testy lub jawne zamknięcie procesu). Nie wywołuj po każdym evencie w Server Actions. */
export async function shutdownPostHog(): Promise<void> {
  if (posthogClient) {
    await posthogClient.shutdown();
    posthogClient = null;
  }
}
