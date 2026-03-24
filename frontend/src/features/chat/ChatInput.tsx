import { ArrowUpward } from '@mui/icons-material';
import { Box, IconButton, InputBase, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';

interface ChatInputProps {
  input: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export function ChatInput({ input, onChange, onSend, disabled }: ChatInputProps) {
  const canSend = !disabled && input.trim().length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSend) {
      onSend();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) onSend();
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={(theme) => ({
        background: `linear-gradient(to top, ${alpha(theme.palette.background.default, 0.98)}, ${alpha(theme.palette.background.default, 0.72)} 72%, transparent)`,
        px: 2,
        pt: 2,
        pb: 1.5,
      })}
    >
      <Box
        sx={(theme) => ({
          maxWidth: 760,
          mx: 'auto',
          backgroundColor: alpha(
            theme.palette.background.paper,
            theme.palette.mode === 'dark' ? 0.82 : 0.95,
          ),
          borderRadius: '28px',
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          px: 1.75,
          py: 1.1,
          transition: 'border-color 180ms ease-out, box-shadow 180ms ease-out',
          '&:focus-within': {
            borderColor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.16 : 0.12),
            boxShadow: `0 8px 24px ${alpha('#000000', theme.palette.mode === 'dark' ? 0.18 : 0.06)}`,
          },
        })}
      >
        <InputBase
          value={input}
          onChange={(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            onChange(event.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder="Message Blink Research"
          aria-label="Message Blink Research"
          multiline
          maxRows={6}
          disabled={disabled}
          sx={{
            flex: 1,
            alignSelf: 'center',
            color: 'text.primary',
            fontSize: 15,
            lineHeight: 1.5,
            '& .MuiInputBase-input': {
              py: 0.75,
            },
            '& .MuiInputBase-inputMultiline': {
              py: 0.75,
            },
          }}
        />
        <IconButton
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          sx={(theme) => ({
            width: 36,
            height: 36,
            borderRadius: '50%',
            alignSelf: 'center',
            backgroundColor: canSend
              ? 'primary.main'
              : alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.08 : 0.06),
            color: canSend
              ? theme.palette.mode === 'dark'
                ? '#0f1111'
                : '#ffffff'
              : 'text.disabled',
            '&:hover': {
              backgroundColor: canSend
                ? 'primary.dark'
                : alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.08 : 0.06),
            },
            '&.Mui-disabled': {
              color: 'text.disabled',
              backgroundColor: alpha(
                theme.palette.text.primary,
                theme.palette.mode === 'dark' ? 0.08 : 0.06,
              ),
            },
          })}
        >
          <ArrowUpward sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Typography
        sx={{
          maxWidth: 760,
          mx: 'auto',
          mt: 1,
          px: 1,
          color: 'text.secondary',
          fontSize: 11,
          textAlign: 'center',
        }}
      >
        Blink Research can make mistakes. Verify important information, especially for high-stakes
        decisions.
      </Typography>
    </Box>
  );
}
