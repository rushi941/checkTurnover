# TurnOverCheck — AI Roadmap (placeholder)

> AI features are planned for a future phase. This scaffold reserves hooks only — no AI logic in v1.

## Planned capabilities (when you share the plan)

- Smart purchase insights (e.g. “Metro Wholesale up 20% this month”)
- Galla vs purchase anomaly alerts
- Natural language queries (“How much from Reliance in June?”)
- Report summaries in plain language
- Optional: receipt/bill OCR for purchase entry

## Reserved in codebase

| Location | Purpose |
|----------|---------|
| `apps/api/src/modules/ai/` | AI service adapters (stub) |
| `apps/web/src/pages/AiInsightsPage.tsx` | Future UI (coming soon badge) |
| `.env` `AI_*` vars | Provider config |

## Integration guidelines (for future)

- AI reads **aggregated** shop data only (never cross-tenant)
- All AI calls server-side; API keys never in frontend
- User opt-in per shop for AI features
- Audit log for AI-generated advice shown to user

Share your AI plan when ready — we will extend this doc and implement against it.
