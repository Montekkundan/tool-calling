'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageAction, MessageActions, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputActionMenu,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import {
  Confirmation,
  ConfirmationTitle,
  ConfirmationRequest,
  ConfirmationAccepted,
  ConfirmationRejected,
  ConfirmationActions,
  ConfirmationAction,
} from '@/components/ai-elements/confirmation';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { Fragment, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { CopyIcon, RefreshCcwIcon, CheckIcon, XIcon } from 'lucide-react';
import { getToolsRequiringConfirmation, APPROVAL } from '@/ai/utils';
import { tools } from '@/ai/tools';
import { getToolName, isToolUIPart, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';

// Three scenarios demonstrating different tool execution patterns
const suggestions = [
  'What is the weather in San Francisco?',
  'Search the database for "customer analytics" and analyze the results',
  'Initiate a secure delete operation on "production_database" resource',
];


const ChatBotDemo = () => {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, regenerate, addToolOutput } = useChat({
    // Automatically continue when tools complete and need follow-up
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const handleSubmit = (message: PromptInputMessage) => {

    // @ts-expect-error I dont know why this is happening
    const hasText = Boolean(message.text);

    if (!(hasText)) {
      return;
    }

    sendMessage(
      {
        // @ts-expect-error ditto
        text: message.text,
      }
    );
    setInput('');
  };

  const toolsRequiringConfirmation = getToolsRequiringConfirmation(tools);

  // used to disable input while confirmation is pending
  const pendingToolCallConfirmation = messages.some(m =>
    m.parts?.some(
      part =>
        isToolUIPart(part) &&
        part.state === 'input-available' &&
        toolsRequiringConfirmation.includes(getToolName(part)),
    ),
  );

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion });
    setInput('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
      <div className="flex flex-col h-full">
        <Conversation>
          <ConversationContent>
            {messages.map((message, messageIndex) => (
              <Fragment key={message.id}>
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case 'text':
                      const isLastMessage =
                        messageIndex === messages.length - 1;
                      return (
                        <Fragment key={`${message.id}-${i}`}>
                          <Message from={message.role}>
                            <MessageContent>
                              <MessageResponse>{part.text}</MessageResponse>
                            </MessageContent>
                          </Message>
                          {message.role === 'assistant' && isLastMessage && (
                            <MessageActions>
                              <MessageAction
                                onClick={() => regenerate()}
                                label="Retry"
                              >
                                <RefreshCcwIcon className="size-3" />
                              </MessageAction>
                              <MessageAction
                                onClick={() =>
                                  navigator.clipboard.writeText(part.text)
                                }
                                label="Copy"
                              >
                                <CopyIcon className="size-3" />
                              </MessageAction>
                            </MessageActions>
                          )}
                        </Fragment>
                      );
                    default:
                      if (isToolUIPart(part)) {
                        const toolName = getToolName(part);
                        const toolCallId = part.toolCallId;

                        // Show confirmation UI for tools requiring approval
                        if (toolsRequiringConfirmation.includes(toolName)) {
                          let approval;
                          if (part.state === 'output-available') {
                            const isDenied = typeof part.output === 'string' &&
                              part.output.startsWith('Error: User denied');
                            approval = {
                              output: isDenied ? APPROVAL.NO : APPROVAL.YES,
                              approved: !isDenied,
                            };
                          }

                          return (
                            <Confirmation
                              key={`${message.id}-${i}`}
                              approval={approval}
                              state={part.state}
                            >
                              <ConfirmationTitle>
                                Run <code className="font-mono text-sm bg-muted px-1 rounded">{toolName}</code> with:
                                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                                  {JSON.stringify(part.input, null, 2)}
                                </pre>
                              </ConfirmationTitle>

                              <ConfirmationRequest>
                                <ConfirmationActions>
                                  <ConfirmationAction
                                    variant="default"
                                    onClick={async () => {
                                      await addToolOutput({
                                        toolCallId,
                                        tool: toolName,
                                        output: APPROVAL.YES,
                                      });
                                      sendMessage();
                                    }}
                                  >
                                    <CheckIcon className="size-4 mr-1" />
                                    Approve
                                  </ConfirmationAction>
                                  <ConfirmationAction
                                    variant="outline"
                                    onClick={async () => {
                                      await addToolOutput({
                                        toolCallId,
                                        tool: toolName,
                                        output: APPROVAL.NO,
                                      });
                                      sendMessage();
                                    }}
                                  >
                                    <XIcon className="size-4 mr-1" />
                                    Deny
                                  </ConfirmationAction>
                                </ConfirmationActions>
                              </ConfirmationRequest>

                              <ConfirmationAccepted>
                                <div className="text-sm text-muted-foreground">
                                  ✓ Tool execution approved
                                </div>
                              </ConfirmationAccepted>

                              <ConfirmationRejected>
                                <div className="text-sm text-muted-foreground">
                                  ✗ Tool execution denied
                                </div>
                              </ConfirmationRejected>
                            </Confirmation>
                          );
                        }

                        // Show Tool component for all other tools (auto-executing)
                        return (
                          <Tool
                            key={`${message.id}-${i}`}
                            defaultOpen={part.state === 'output-available' || part.state === 'output-error'}
                          >
                            <ToolHeader
                              type={part.type}
                              state={part.state}
                              title={toolName}
                            />
                            <ToolContent>
                              <ToolInput input={part.input} />
                              <ToolOutput
                                output={part.output}
                                errorText={part.errorText}
                              />
                            </ToolContent>
                          </Tool>
                        );
                      }
                      return null;
                  }
                })}
              </Fragment>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="grid gap-4 mt-4">
          {/* Show suggestions when there are no messages */}
          {messages.length === 0 && (
            <Suggestions>
              {suggestions.map((suggestion) => (
                <Suggestion
                  key={suggestion}
                  onClick={handleSuggestionClick}
                  suggestion={suggestion}
                />
              ))}
            </Suggestions>
          )}

          <PromptInput onSubmit={handleSubmit} globalDrop multiple>
            <PromptInputBody>
              <PromptInputTextarea
                onChange={(e) => setInput(e.target.value)}
                value={input}
                disabled={pendingToolCallConfirmation}
                placeholder="Lets have fun with tool calling..."
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                </PromptInputActionMenu>
              </PromptInputTools>
              <PromptInputSubmit disabled={!input && !status} status={status} />
            </PromptInputFooter>

          </PromptInput>
          <p className="text-xs mx-auto font-light">
            Thank you{" "}
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-black hover:text-green-700 transition-colors"
            >
              Vercel ▲
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatBotDemo;