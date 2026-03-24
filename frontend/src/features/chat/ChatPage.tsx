import { Add, DarkModeOutlined, LightModeOutlined, SettingsOutlined } from '@mui/icons-material';
import type { PaletteMode } from '@mui/material';
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useCallback, useState } from 'react';
import { ApiKeysModal } from './ApiKeysModal';
import { ChatInput } from './ChatInput';
import { ChatWindow } from './ChatWindow';
import type { AgentRunProgress, AgentTodo, ApiKeySettings, Message } from './types';

const API_KEYS_STORAGE_KEY = 'blinkresearch-api-keys';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '') ?? '';
const AGENT_STREAM_PATH = '/api/agent/stream';

const buildApiUrl = (path: string) => `${API_BASE_URL}${path}`;

interface AgentStartedEvent {
  type: 'started';
  thread_id: string;
}

interface AgentTodosEvent {
  type: 'todos';
  thread_id: string;
  todos: AgentTodo[];
}

interface AgentFinalEvent {
  type: 'final';
  thread_id: string;
  response: string;
}

interface AgentErrorEvent {
  type: 'error';
  thread_id: string;
  error: string;
}

type AgentStreamEvent = AgentStartedEvent | AgentTodosEvent | AgentFinalEvent | AgentErrorEvent;

const readAgentStream = async (
  query: string,
  threadId: string | null,
  apiKeys: ApiKeySettings,
  onEvent: (event: AgentStreamEvent) => void,
): Promise<void> => {
  const response = await fetch(buildApiUrl(AGENT_STREAM_PATH), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      thread_id: threadId,
      api_keys: {
        tavily_api_key: apiKeys.tavilyApiKey,
        google_studio_api_key: apiKeys.googleStudioApiKey,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  if (!response.body) {
    throw new Error('The server did not provide a readable response stream.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

    let newlineIndex = buffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);

      if (line) {
        onEvent(JSON.parse(line) as AgentStreamEvent);
      }

      newlineIndex = buffer.indexOf('\n');
    }

    if (done) {
      const trailingLine = buffer.trim();
      if (trailingLine) {
        onEvent(JSON.parse(trailingLine) as AgentStreamEvent);
      }
      break;
    }
  }
};

const buildNetworkErrorMessage = (error: Error) => {
  const endpoint = buildApiUrl(AGENT_STREAM_PATH) || AGENT_STREAM_PATH;

  if (error instanceof TypeError) {
    return `The API request could not reach the server.

\`\`\`text
${endpoint}
\`\`\`

This is usually a bad URL, a CORS block, or the App Runner service being unavailable.

\`\`\`text
${error.message}
\`\`\``;
  }

  return `The API request failed.

\`\`\`text
${error.message}
\`\`\``;
};

const createMessage = (role: 'user' | 'assistant', content: string): Message => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  timestamp: new Date(),
});

const getStoredApiKeys = (): ApiKeySettings => {
  if (typeof window === 'undefined') {
    return {
      tavilyApiKey: '',
      googleStudioApiKey: '',
    };
  }

  try {
    const storedValue = window.localStorage.getItem(API_KEYS_STORAGE_KEY);
    if (!storedValue) {
      return {
        tavilyApiKey: '',
        googleStudioApiKey: '',
      };
    }

    const parsedValue = JSON.parse(storedValue) as Partial<ApiKeySettings>;
    return {
      tavilyApiKey: typeof parsedValue.tavilyApiKey === 'string' ? parsedValue.tavilyApiKey : '',
      googleStudioApiKey:
        typeof parsedValue.googleStudioApiKey === 'string' ? parsedValue.googleStudioApiKey : '',
    };
  } catch {
    return {
      tavilyApiKey: '',
      googleStudioApiKey: '',
    };
  }
};

const hasConfiguredApiKeys = (apiKeys: ApiKeySettings) =>
  apiKeys.tavilyApiKey.trim().length > 0 && apiKeys.googleStudioApiKey.trim().length > 0;

interface ChatPageProps {
  mode: PaletteMode;
  onToggleColorMode: () => void;
}

export default function ChatPage({ mode, onToggleColorMode }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [progress, setProgress] = useState<AgentRunProgress | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeySettings>(getStoredApiKeys);
  const [draftApiKeys, setDraftApiKeys] = useState<ApiKeySettings>(getStoredApiKeys);
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(
    () => !hasConfiguredApiKeys(getStoredApiKeys()),
  );

  const handleSend = useCallback(
    async (nextContent?: string) => {
      const trimmedInput = (nextContent ?? input).trim();
      if (!trimmedInput || isLoading) {
        return;
      }

      if (!hasConfiguredApiKeys(apiKeys)) {
        setIsApiKeysModalOpen(true);
        return;
      }

      const userMessage = createMessage('user', trimmedInput);
      setMessages((previous) => [...previous, userMessage]);
      setInput('');
      setIsLoading(true);
      setProgress({ todos: [] });

      try {
        let finalResponse = '';

        await readAgentStream(trimmedInput, threadId, apiKeys, (event) => {
          if (event.type === 'started') {
            setThreadId(event.thread_id);
            return;
          }

          if (event.type === 'todos') {
            setThreadId(event.thread_id);
            setProgress({ todos: event.todos });
            return;
          }

          if (event.type === 'final') {
            setThreadId(event.thread_id);
            finalResponse = event.response;
            return;
          }

          throw new Error(event.error);
        });

        const assistantMessage = createMessage('assistant', finalResponse || 'No response');
        setMessages((previous) => [...previous, assistantMessage]);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? buildNetworkErrorMessage(error)
            : 'The API request failed due to an unknown error.';

        const assistantMessage = createMessage('assistant', errorMessage);
        setMessages((previous) => [...previous, assistantMessage]);
      } finally {
        setIsLoading(false);
        setProgress(null);
      }
    },
    [apiKeys, input, isLoading, threadId],
  );

  const handleSaveApiKeys = useCallback(() => {
    const normalizedApiKeys = {
      tavilyApiKey: draftApiKeys.tavilyApiKey.trim(),
      googleStudioApiKey: draftApiKeys.googleStudioApiKey.trim(),
    };

    if (!hasConfiguredApiKeys(normalizedApiKeys)) {
      return;
    }

    window.localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(normalizedApiKeys));
    setApiKeys(normalizedApiKeys);
    setDraftApiKeys(normalizedApiKeys);
    setIsApiKeysModalOpen(false);
  }, [draftApiKeys]);

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
          height: 56,
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: { xs: 1.75, sm: 2.5 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: alpha(
            theme.palette.background.default,
            theme.palette.mode === 'dark' ? 0.94 : 0.88,
          ),
          backdropFilter: 'blur(18px)',
        })}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={(theme) => ({
              width: 26,
              height: 26,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 600,
              fontSize: 10,
              letterSpacing: '-0.03em',
              color: 'text.primary',
              border: '1px solid',
              borderColor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.18 : 0.12),
              backgroundColor: alpha(
                theme.palette.background.paper,
                theme.palette.mode === 'dark' ? 0.46 : 0.92,
              ),
            })}
          >
            BR
          </Box>
          <Typography
            variant="subtitle2"
            sx={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', color: 'text.primary' }}
          >
            Blink Research
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="API Keys" arrow>
            <IconButton
              size="small"
              onClick={() => {
                setDraftApiKeys(apiKeys);
                setIsApiKeysModalOpen(true);
              }}
              sx={(theme) => ({
                width: 32,
                height: 32,
                border: '1px solid',
                borderColor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.1 : 0.08),
                color: hasConfiguredApiKeys(apiKeys) ? 'primary.main' : 'text.secondary',
                backgroundColor: alpha(
                  theme.palette.background.paper,
                  theme.palette.mode === 'dark' ? 0.28 : 0.74,
                ),
                '&:hover': {
                  color: hasConfiguredApiKeys(apiKeys) ? 'primary.main' : 'text.primary',
                  borderColor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.18 : 0.14),
                  backgroundColor: alpha(
                    theme.palette.background.paper,
                    theme.palette.mode === 'dark' ? 0.42 : 0.94,
                  ),
                },
              })}
            >
              <SettingsOutlined fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} arrow>
            <IconButton
              size="small"
              onClick={onToggleColorMode}
              sx={(theme) => ({
                width: 32,
                height: 32,
                border: '1px solid',
                borderColor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.1 : 0.08),
                color: 'text.secondary',
                backgroundColor: alpha(
                  theme.palette.background.paper,
                  theme.palette.mode === 'dark' ? 0.28 : 0.74,
                ),
                '&:hover': {
                  color: 'text.primary',
                  borderColor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.18 : 0.14),
                  backgroundColor: alpha(
                    theme.palette.background.paper,
                    theme.palette.mode === 'dark' ? 0.42 : 0.94,
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
                width: 32,
                height: 32,
                border: '1px solid',
                borderColor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.1 : 0.08),
                color: 'text.secondary',
                backgroundColor: alpha(
                  theme.palette.background.paper,
                  theme.palette.mode === 'dark' ? 0.28 : 0.74,
                ),
                '&:hover': {
                  color: 'text.primary',
                  borderColor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.18 : 0.14),
                  backgroundColor: alpha(
                    theme.palette.background.paper,
                    theme.palette.mode === 'dark' ? 0.42 : 0.94,
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
                setProgress(null);
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
        progress={progress}
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

      <ApiKeysModal
        open={isApiKeysModalOpen}
        value={draftApiKeys}
        canClose={hasConfiguredApiKeys(apiKeys)}
        onChange={setDraftApiKeys}
        onClose={() => {
          if (hasConfiguredApiKeys(apiKeys)) {
            setDraftApiKeys(apiKeys);
            setIsApiKeysModalOpen(false);
          }
        }}
        onSave={handleSaveApiKeys}
      />
    </Box>
  );
}
