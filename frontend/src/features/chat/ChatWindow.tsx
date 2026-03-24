import { Box, ButtonBase, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useEffect, useRef } from 'react';
import { AgentTaskPanel } from './AgentTaskPanel';
import { MessageBubble } from './MessageBubble';
import { ThinkingIndicator } from './ThinkingIndicator';
import type { AgentRunProgress, Message } from './types';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  progress: AgentRunProgress | null;
  suggestions: string[];
  onSuggestionSelect: (suggestion: string) => void;
}

export function ChatWindow({
  messages,
  isLoading,
  progress,
  suggestions,
  onSuggestionSelect,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading, progress]);

  if (!hasMessages) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'grid',
          placeItems: 'center',
          px: 2,
          py: 4,
          textAlign: 'center',
        }}
      >
        <Box sx={{ maxWidth: 940 }}>
          <Box
            sx={(theme) => ({
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 72,
              px: 1.5,
              py: 0.75,
              borderRadius: 999,
              border: '1px solid',
              borderColor: 'divider',
              color: 'text.secondary',
              backgroundColor: alpha(
                theme.palette.background.paper,
                theme.palette.mode === 'dark' ? 0.4 : 0.8,
              ),
              mb: 2.5,
            })}
          >
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Blink Research
            </Typography>
          </Box>

          <Typography
            variant="h3"
            sx={{
              letterSpacing: '-0.04em',
              fontWeight: 600,
              fontSize: { xs: '2rem', sm: '2.6rem' },
            }}
          >
            What&apos;s on your mind today?
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mt: 1.5, mb: 3.5, fontSize: { xs: 15, sm: 17 } }}
          >
            Ask for research, summaries, comparisons, or a sharper draft. Light and dark mode now
            share the same calm, conversational feel.
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(4, minmax(0, 1fr))',
              },
              gap: 1.5,
              alignItems: 'stretch',
            }}
          >
            {suggestions.map((suggestion) => (
              <ButtonBase
                key={suggestion}
                onClick={() => {
                  if (!isLoading) {
                    onSuggestionSelect(suggestion);
                  }
                }}
                sx={(theme) => ({
                  width: '100%',
                  minHeight: 132,
                  px: 2,
                  py: 1.9,
                  borderRadius: '18px',
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: alpha(
                    theme.palette.background.paper,
                    theme.palette.mode === 'dark' ? 0.34 : 0.88,
                  ),
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  transition:
                    'border-color 180ms ease-out, background-color 180ms ease-out, transform 180ms ease-out',
                  '&:hover': {
                    borderColor: alpha(theme.palette.primary.main, 0.38),
                    backgroundColor: alpha(
                      theme.palette.background.paper,
                      theme.palette.mode === 'dark' ? 0.5 : 0.98,
                    ),
                    transform: 'translateY(-1px)',
                  },
                })}
              >
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: 15,
                    lineHeight: 1.5,
                    fontWeight: 400,
                  }}
                >
                  {suggestion}
                </Typography>
              </ButtonBase>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, overflowY: 'auto' }}>
      <Box sx={{ maxWidth: 780, mx: 'auto', pt: 3, pb: 2, px: 2 }}>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && progress && <AgentTaskPanel progress={progress} />}

        {isLoading && (
          <Box sx={{ py: 0.75, display: 'flex', gap: 1.25, alignItems: 'center' }}>
            <Box
              aria-hidden
              sx={(theme) => ({
                width: 22,
                height: 22,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                color: theme.palette.mode === 'dark' ? '#0f1111' : '#ffffff',
                backgroundColor: 'primary.main',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: '"IBM Plex Mono", monospace',
                fontWeight: 600,
                fontSize: 12,
                flexShrink: 0,
                boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.14)}`,
              })}
            >
              BR
            </Box>
            <ThinkingIndicator />
          </Box>
        )}

        <Box ref={bottomRef} />
      </Box>
    </Box>
  );
}
