# Recipe — adding AI (Vercel AI SDK) to a project

**This is NOT part of the base. Do not merge it into the boilerplate.** The base stays lean — no `ai` dependency, no provider key, no AI code — so the projects that never touch AI carry nothing. Apply this recipe **per project**, only when that project actually uses AI. Same philosophy as usage billing: don't pre-build; keep it ready.

## When to apply it

When a project generates content with an LLM (chat, summarize, extract, classify, rewrite…). The moment you do, remember the billing consequence from [`WHEN-TO-USE.md`](./WHEN-TO-USE.md): **AI is the textbook "a unit of usage costs _me_ money" case** — each call burns real tokens. So this recipe includes the margin guard (a quota), not just the wiring.

Estimated effort: **~30–60 min** for the wiring, plus your actual feature.

---

## Steps

Everything below lands in existing folders — the base's architecture already has the right homes.

### 1. Install (project-local, never in the base)

```
pnpm add ai @ai-sdk/anthropic
```

Default to **Claude via `@ai-sdk/anthropic`** — Sonnet 5 / Haiku 4.5 as pragmatic defaults, Opus 4.8 for the hardest tasks. The AI SDK is provider-agnostic, so swapping later is trivial.

> ✅ **API confirmed against AI SDK v5** (verified via Context7 `/vercel/ai`). The SDK still moves fast across majors, so at apply time reconfirm the streaming helpers and the exact Claude model IDs against the installed version. The model IDs below use the current families (`claude-sonnet-5`, `claude-haiku-4-5-20251001`, `claude-opus-4-8`) — check Anthropic's model list for the exact string when you install.

### 2. Env — add the provider key to the validated schema

Add to `src/lib/env.ts` (Zod-validated — a missing key fails the build, which is what you want):

```ts
ANTHROPIC_API_KEY: z.string().min(1),
```

And to `.env` / `.env.example`. Server-only — never `NEXT_PUBLIC_`.

### 3. Rate limit — mandatory for AI (expensive + abuse vector)

Add a limiter in `src/lib/ratelimit.ts`, mirroring the existing ones:

```ts
// AI endpoints: expensive per call — cap hard.
const aiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  prefix: "@upstash/ratelimit/ai",
  analytics: true,
});
```

Apply it **at the entry point** (route/action), keyed by `userId` — never inside a service (per `security.md`).

### 4. Quota — the margin guard (licensed + quota, before any metered billing)

This is the step people skip and regret. On a flat licensed plan, a power user can cost you more than they pay. So gate usage by a **per-period quota** tied to the plan, enforced with a Redis counter:

- Add `aiCreditsIncluded` to the relevant plan(s) in `plan.constant.ts` (e.g. `pro: { …, aiCreditsIncluded: 500 }`).
- A `consumeAiCredit(organizationId)` service: increment a Redis counter keyed by `{orgId}:{period}`, throw `ForbiddenError("errors.billing.quotaExceeded")` when it exceeds the plan allowance.
- Call it at the entry point, alongside the rate limit, **before** the model call.

This protects your margin with **zero Stripe metering**. You only reach for metered billing (the ~1–2 wk extension) if you want to _charge_ for overage beyond the quota.

### 5. The call sites — where AI code lives

**Streaming** (chat, live generation) → a Route Handler at `src/app/api/ai/{feature}/route.ts`. Guard → rate-limit → quota → `streamText` → stream back (AI SDK v5):

```ts
import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";

import { aiRatelimit } from "@/lib/ratelimit";
import { getSession } from "@/lib/session";

import { UnauthorizedError } from "@/utils/errors/errors";
import { handleApiError } from "@/utils/errors/handle-api-error";
import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session?.user) {
      throw new UnauthorizedError("errors.common.unauthenticated");
    }

    await checkRatelimit(aiRatelimit, session.user.id);
    // await consumeAiCredit(session.activeOrganizationId); // step 4 — margin guard

    const { messages }: { messages: UIMessage[] } = await request.json();

    const result = streamText({
      model: anthropic("claude-sonnet-5"),
      messages: await convertToModelMessages(messages),
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
```

**Non-streaming** (`generateText` / `generateObject` for a one-shot result) → a `server-only` service called by a next-safe-action action, reusing your exact pattern:

```ts
// src/features/{feature}/services/generate-summary.service.ts
import "server-only";

import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

const SummarySchema = z.object({ summary: z.string() });

async function generateSummary(input: { text: string }) {
  const { object } = await generateObject({
    model: anthropic("claude-haiku-4-5-20251001"), // cheap/fast for a summarize task
    schema: SummarySchema,
    prompt: `Summarize the following:\n\n${input.text}`,
  });

  return object;
}

export { generateSummary };
```

```ts
// src/features/{feature}/actions/generate-summary.action.ts
"use server";

import { GenerateSummarySchema } from "@/features/{feature}/schemas/summary.schema";
import { generateSummary } from "@/features/{feature}/services/generate-summary.service";

import { aiRatelimit } from "@/lib/ratelimit";
import { authActionClient } from "@/lib/safe-action";

import { checkRatelimit } from "@/utils/ratelimit/check-ratelimit";

const generateSummaryAction = authActionClient
  .use(async ({ next, ctx }) => {
    await checkRatelimit(aiRatelimit, ctx.userId);
    // await consumeAiCredit(ctx.activeOrganizationId); // step 4 — margin guard

    return next();
  })
  .inputSchema(GenerateSummarySchema)
  .action(async ({ parsedInput }) => {
    const result = await generateSummary({ text: parsedInput.text });

    return {
      success: true,
      summary: result.summary,
    };
  });

export { generateSummaryAction };
```

Nothing new to learn — it's your standard action/service pattern with a model call inside.

### 6. Security checklist

- Model calls run **server-side only** — the API key never reaches the client, no `NEXT_PUBLIC_`.
- Every AI entry point: **authenticated + rate-limited + quota-checked**, scoped by `userId` / `organizationId`.
- Validate/clamp user-supplied prompts (length caps) before sending — prompt size is cost.
- Never call the provider directly from a Client Component.

---

## Billing recap (why this recipe carries a quota)

```
AI project
  └─ licensed plan + per-period QUOTA   ← start here (Redis counter, cheap, protects margin)
       └─ metered / hybrid billing       ← only if you sell overage (the ~1–2 wk extension)
```

Most AI products are fine forever at **licensed + quota**. Metered Stripe billing is the second stage, added only when you actually charge per unit beyond the quota.

## What NOT to do

- ❌ Don't add `ai` / a provider key to the **base** boilerplate — it's a per-project recipe.
- ❌ Don't ship an AI endpoint without a rate limit **and** a quota — that's an open tab on your provider bill.
- ❌ Don't call the model from the client or expose the key.
- ❌ Don't jump to metered Stripe billing before a quota — quota first, metered only for overage.
