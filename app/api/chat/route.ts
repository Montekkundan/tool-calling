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
import { checkBotId } from 'botid/server';
import { NextResponse } from 'next/server';


// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const verification = await checkBotId();

  if (verification.isBot) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const { messages }: { messages: HumanInTheLoopUIMessage[] } =
    await req.json();
  try {
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
              const temp = Math.floor(Math.random() * 30) + 10;
              return `The weather in ${city} is ${conditions[Math.floor(Math.random() * conditions.length)]
                } with a temperature of ${temp}°C.`;
            },
            initiateSecureOperation: async ({ operationType, targetResource }) => {
              return `Operation "${operationType}" on resource "${targetResource}" has been approved and initiated.`;
            },
            validateOperation: async ({ dataToValidate }) => {
              return `Validation passed for: ${dataToValidate}. All security checks completed successfully.`;
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
  } catch (error) {
    console.error('Error in the global chat route: ', error);
    const fallback = streamText({
      model: gateway('openai/gpt-4o-mini'),
      messages: [
        {
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: 'An error occurred while processing your request. Please try again.',
            },
          ],
        },
      ],
    });

    return fallback.toUIMessageStreamResponse();
  }
}