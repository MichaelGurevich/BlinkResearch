import { Add, DarkModeOutlined, LightModeOutlined } from '@mui/icons-material';
import type { PaletteMode } from '@mui/material';
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useCallback, useState } from 'react';
import { ChatInput } from './ChatInput';
import { ChatWindow } from './ChatWindow';
import type { Message } from './types';

interface InvokeAgentResponse {
  response: string;
  thread_id: string;
}

const invokeAgent = async (
  query: string,
  threadId: string | null,
): Promise<InvokeAgentResponse> => {
  const response = await fetch('/api/agent/invoke', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      thread_id: threadId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<InvokeAgentResponse>;
};

const createMessage = (role: 'user' | 'assistant', content: string): Message => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  timestamp: new Date(),
});

const promptSuggestions = [
  'Extract and translate the text from this exam image.',
  'Convert this assignment image into clean English notes.',
  'Give me the English version of this handwritten page.',
  'Translate and clean the content from this test image.',
];

interface ChatPageProps {
  mode: PaletteMode;
  onToggleColorMode: () => void;
}

export default function ChatPage({ mode, onToggleColorMode }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);

  const handleSend = useCallback(
    async (nextContent?: string) => {
      const trimmedInput = (nextContent ?? input).trim();
      if (!trimmedInput || isLoading) {
        return;
      }

      const userMessage = createMessage('user', trimmedInput);
      setMessages((previous) => [...previous, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        const response = await invokeAgent(trimmedInput, threadId);
        setThreadId(response.thread_id);

        const assistantMessage = createMessage('assistant', response.response);
        setMessages((previous) => [...previous, assistantMessage]);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? `The API request failed.\n\n\`\`\`text\n${error.message}\n\`\`\``
            : 'The API request failed due to an unknown error.';

        const assistantMessage = createMessage('assistant', errorMessage);
        setMessages((previous) => [...previous, assistantMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, threadId],
  );

  return (
    <Box
      sx={(theme) => ({
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.default',
        backgroundImage:
          theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at top, rgba(255,255,255,0.05), transparent 24%)'
            : 'radial-gradient(circle at top, rgba(16,163,127,0.08), transparent 21%)',
      })}
    >
      <Box
        sx={(theme) => ({
          height: 68,
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: { xs: 2, sm: 3 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: alpha(
            theme.palette.background.default,
            theme.palette.mode === 'dark' ? 0.88 : 0.82,
          ),
          backdropFilter: 'blur(16px)',
        })}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={(theme) => ({
              width: 34,
              height: 34,
              borderRadius: 3,
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '-0.03em',
              color: theme.palette.mode === 'dark' ? '#0f1111' : '#ffffff',
              backgroundColor: 'primary.main',
              boxShadow: `0 14px 32px ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.16)}`,
            })}
          >
            BR
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ lineHeight: 1.1 }}>
              Blink Research
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Conversational analysis workspace
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} arrow>
            <IconButton
              size="small"
              onClick={onToggleColorMode}
              sx={(theme) => ({
                border: '1px solid',
                borderColor: 'divider',
                color: 'text.secondary',
                backgroundColor: alpha(
                  theme.palette.background.paper,
                  theme.palette.mode === 'dark' ? 0.44 : 0.74,
                ),
                '&:hover': {
                  color: 'text.primary',
                  borderColor: alpha(theme.palette.primary.main, 0.4),
                  backgroundColor: alpha(
                    theme.palette.background.paper,
                    theme.palette.mode === 'dark' ? 0.72 : 0.94,
                  ),
                },
              })}
            >
              {mode === 'dark' ? (
                <LightModeOutlined fontSize="small" />
              ) : (
                <DarkModeOutlined fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title="New Chat" arrow>
            <IconButton
              size="small"
              sx={(theme) => ({
                border: '1px solid',
                borderColor: 'divider',
                color: 'text.secondary',
                backgroundColor: alpha(
                  theme.palette.background.paper,
                  theme.palette.mode === 'dark' ? 0.44 : 0.74,
                ),
                '&:hover': {
                  color: 'text.primary',
                  borderColor: alpha(theme.palette.primary.main, 0.4),
                  backgroundColor: alpha(
                    theme.palette.background.paper,
                    theme.palette.mode === 'dark' ? 0.72 : 0.94,
                  ),
                },
              })}
              onClick={() => {
                if (isLoading) {
                  return;
                }

                setMessages([]);
                setInput('');
                setThreadId(null);
              }}
            >
              <Add fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        suggestions={promptSuggestions}
        onSuggestionSelect={(suggestion) => {
          void handleSend(suggestion);
        }}
      />

      <Box sx={{ position: 'sticky', bottom: 0 }}>
        <ChatInput
          input={input}
          onChange={setInput}
          onSend={() => {
            void handleSend();
          }}
          disabled={isLoading}
        />
      </Box>
    </Box>
  );
}
