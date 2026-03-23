import { Box, Typography } from '@mui/material';
import { alpha, keyframes, styled } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import type { Message } from './types';

const fadeUp = keyframes`
  from {
    transform: translateY(12px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const MarkdownRoot = styled(Box)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: '0.96rem',
  lineHeight: 1.7,
  '& p': {
    margin: 0,
  },
  '& p + p': {
    marginTop: '0.7rem',
  },
  '& ul, & ol': {
    marginTop: '0.65rem',
    marginBottom: '0.65rem',
    paddingLeft: '1.2rem',
  },
  '& li + li': {
    marginTop: '0.35rem',
  },
  '& code': {
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: '0.82rem',
    padding: '0.12rem 0.38rem',
    borderRadius: 8,
    backgroundColor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.08 : 0.06),
    border: `1px solid ${theme.palette.divider}`,
  },
  '& pre': {
    marginTop: '0.75rem',
    marginBottom: '0.75rem',
    padding: '0.8rem 0.95rem',
    borderRadius: 14,
    backgroundColor: alpha(
      theme.palette.background.paper,
      theme.palette.mode === 'dark' ? 0.62 : 0.92,
    ),
    border: `1px solid ${theme.palette.divider}`,
    overflowX: 'auto',
  },
  '& pre code': {
    border: 'none',
    padding: 0,
    backgroundColor: 'transparent',
  },
  '& a': {
    color: theme.palette.primary.main,
  },
}));

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        py: 0.75,
        animation: `${fadeUp} 200ms ease-out`,
      }}
    >
      {isUser ? (
        <Box
          sx={(theme) => ({
            maxWidth: { xs: '84%', sm: '65%' },
            borderRadius: '24px',
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: alpha(
              theme.palette.background.paper,
              theme.palette.mode === 'dark' ? 0.84 : 0.92,
            ),
            px: 2.1,
            py: 1.45,
            position: 'relative',
            '&:hover .timestamp': {
              opacity: 1,
            },
          })}
        >
          <Typography sx={{ fontSize: 14.5, color: 'text.primary' }}>{message.content}</Typography>
          <Typography
            className="timestamp"
            sx={{
              opacity: 0,
              transition: 'opacity 180ms ease-out',
              fontSize: 11,
              color: 'text.secondary',
              mt: 0.75,
              textAlign: 'right',
            }}
          >
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            gap: 1.25,
            maxWidth: { xs: '96%', sm: '82%' },
            '&:hover .timestamp': {
              opacity: 1,
            },
          }}
        >
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
              mt: 0.3,
              flexShrink: 0,
              boxShadow: `0 10px 24px ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.14)}`,
            })}
          >
            BR
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <MarkdownRoot>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </MarkdownRoot>
            <Typography
              className="timestamp"
              sx={{
                opacity: 0,
                transition: 'opacity 180ms ease-out',
                fontSize: 11,
                color: 'text.secondary',
                mt: 0.75,
              }}
            >
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
