import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { gateway } from '@ai-sdk/gateway';
// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages
  }: { 
    messages: UIMessage[]; 
    model: string; 
    webSearch: boolean;
  } = await req.json();

  const result = streamText({
    model: gateway('openai/gpt-4o-mini'),
    messages: convertToModelMessages(messages),
    system:
      'You are a helpful assistant that can answer questions and help with tasks',
  });
  
  return result.toUIMessageStreamResponse();
}