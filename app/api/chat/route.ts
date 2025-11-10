import { tools } from '@/ai/tools';
import { HumanInTheLoopUIMessage } from '@/ai/types';
import { processToolCalls } from '@/ai/utils';
import {
  createUIMessageStreamResponse,
  createUIMessageStream,
  streamText,
  convertToModelMessages,
  stepCountIs,
  gateway,
} from 'ai';


// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: HumanInTheLoopUIMessage[] } =
    await req.json();

  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      // Utility function to handle tools that require human confirmation
      // Checks for confirmation in last message and then runs associated tool
      const processedMessages = await processToolCalls(
        {
          messages,
          writer,
          tools,
        },
        {
          // type-safe object for tools without an execute function
          getWeatherInformation: async ({ city }) => {
            const conditions = ['sunny', 'cloudy', 'rainy', 'snowy'];
            return `The weather in ${city} is ${
              conditions[Math.floor(Math.random() * conditions.length)]
            }.`;
          },
        },
      );

      const result = streamText({
        model: gateway('openai/gpt-4o-mini'),
        messages: convertToModelMessages(processedMessages),
        tools,
        stopWhen: stepCountIs(5),
      });

      writer.merge(
        result.toUIMessageStream({ originalMessages: processedMessages }),
      );
    },
  });

  return createUIMessageStreamResponse({ stream });
}