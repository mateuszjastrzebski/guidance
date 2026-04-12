# PostHog post-wizard report

The wizard has completed a deep integration of your project. PostHog analytics have been added to this Next.js 15.3 App Router TTRPG campaign management app. Client-side tracking is initialized via `instrumentation-client.ts` (the recommended approach for Next.js 15.3+), with a reverse proxy configured in `next.config.mjs` to improve reliability. A server-side PostHog client (`lib/posthog-server.ts`) is used in Server Actions to capture key business events with the authenticated user's ID as the `distinctId`. User identification is performed client-side in the login form upon successful magic link submission, linking future events to the known user email. Exception tracking is enabled globally via `capture_exceptions: true`.

| Event | Description | File |
|-------|-------------|------|
| `magic_link_requested` | User submitted the login form requesting a magic link OTP email | `app/login/login-form.tsx` |
| `campaign_created` | User successfully created a new campaign/fabula | `app/(app)/campaigns/actions.ts` |
| `npc_created` | GM created a new NPC in a campaign | `app/(app)/campaign/[id]/npcs/actions.ts` |
| `player_character_created` | GM created a new player character in a campaign | `app/(app)/campaign/[id]/player-characters/actions.ts` |
| `location_created` | GM created a new location in a campaign | `app/(app)/campaign/[id]/locations/actions.ts` |
| `quest_created` | User created a new quest/thread on the planner board | `app/(app)/campaign/[id]/board/quests-actions.ts` |
| `quest_updated` | User updated a quest/thread name or description | `app/(app)/campaign/[id]/board/quests-actions.ts` |
| `quests_linked` | User linked two quests/threads together on the planner board | `app/(app)/campaign/[id]/board/quests-actions.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/377675/dashboard/1455563
- **Login to Campaign Creation Funnel**: https://us.posthog.com/project/377675/insights/NFk8FCsy
- **Campaigns Created Over Time**: https://us.posthog.com/project/377675/insights/Htk2LVQx
- **Content Creation Breakdown**: https://us.posthog.com/project/377675/insights/wNm5WtDx
- **Daily Active Login Users**: https://us.posthog.com/project/377675/insights/L6xTyeJl
- **Quest Board Engagement**: https://us.posthog.com/project/377675/insights/TPwIkkOU

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
