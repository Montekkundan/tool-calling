## Human-in-the-loop Tool Calling Demo

This template shows three tool-calling scenarios with optional human approval (see the [AI SDK cookbook: human-in-the-loop](https://ai-sdk.dev/cookbook/next/human-in-the-loop#human-in-the-loop-with-nextjs)).

Scenarios:
- Weather lookup (auto-exec)
- Search + analysis chain (auto-exec; illustrates multiple tool calls)
- Secure operation (requires explicit approval or denial)

Key files:
- `app/api/chat/route.ts`: Streams assistant responses. Runs `processToolCalls` to gate tools needing approval. Uses `streamText` with step limit and merges tool output into a UI stream.
- `app/page.tsx`: Chat UI using `useChat`. Detects pending tool calls needing confirmation and renders approval buttons (Approve / Deny). Automatically continues when tool calls finish.
- `components/ai-elements/tool.tsx`: Collapsible UI for each tool invocation showing parameters, status badges, and JSON or string output.
- Confirmation logic: Tools flagged as requiring approval display a confirmation component instead of auto-executing.
- Status handling: Tool states (`input-streaming`, `input-available`, `output-available`, `output-error`) mapped to badges.

Try starting with one of the suggestions shown when the chat is empty.

If you have any questions as me [montekkundan](https://x.com/montekkundan), ill be happy to help!