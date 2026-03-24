import {
  AutoAwesomeRounded,
  LockOutlined,
  SearchRounded,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useState } from 'react';
import type { ApiKeySettings } from './types';

interface ApiKeysModalProps {
  open: boolean;
  value: ApiKeySettings;
  canClose: boolean;
  onChange: (value: ApiKeySettings) => void;
  onClose: () => void;
  onSave: () => void;
}

const highlightItems = [
  'Use your own Tavily key for live web search.',
  'Connect Google AI Studio so Blink can reason and format results.',
  'Update or replace both keys at any time from settings.',
];

export function ApiKeysModal({
  open,
  value,
  canClose,
  onChange,
  onClose,
  onSave,
}: ApiKeysModalProps) {
  const [showTavilyKey, setShowTavilyKey] = useState(false);
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const canSave =
    value.tavilyApiKey.trim().length > 0 && value.googleStudioApiKey.trim().length > 0;

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={!canClose}
      onClose={(_, reason) => {
        if (!canClose && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
          return;
        }
        onClose();
      }}
      PaperProps={{
        sx: (theme) => ({
          overflow: 'hidden',
          borderRadius: '30px',
          border: '1px solid',
          borderColor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.1 : 0.08),
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(180deg, ${alpha('#2f9b74', 0.12)} 0%, ${alpha('#171717', 0.96)} 24%, ${theme.palette.background.paper} 100%)`
            : `linear-gradient(180deg, ${alpha('#10a37f', 0.12)} 0%, ${alpha('#ffffff', 0.96)} 28%, ${theme.palette.background.paper} 100%)`,
          boxShadow: `0 28px 80px ${alpha('#000000', theme.palette.mode === 'dark' ? 0.42 : 0.16)}`,
        }),
      }}
    >
      <DialogContent sx={{ px: { xs: 2.25, sm: 3.25 }, py: { xs: 2.25, sm: 3 } }}>
        <Stack spacing={2.2}>
          <Stack spacing={1.35}>
            <Chip
              icon={<AutoAwesomeRounded sx={{ fontSize: 16 }} />}
              label="New in Blink"
              sx={{ alignSelf: 'flex-start', fontWeight: 600 }}
            />
            <Box
              sx={(theme) => ({
                p: 2.1,
                borderRadius: '24px',
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.2),
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.16)}, ${alpha(theme.palette.background.paper, 0.52)})`
                  : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha('#ffffff', 0.96)})`,
              })}
            >
              <Typography variant="overline" sx={{ color: 'primary.main', fontSize: 12 }}>
                Private Key Setup
              </Typography>
              <Typography
                variant="h4"
                sx={{ mt: 0.35, fontSize: { xs: '1.55rem', sm: '1.85rem' }, lineHeight: 1.08 }}
              >
                Bring your own research keys
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1.1, maxWidth: 520 }}>
                Enter your Tavily API key and your Google AI Studio API key once to unlock Blink
                research in this browser.
              </Typography>
            </Box>
          </Stack>

          <Stack spacing={1}>
            {highlightItems.map((item, index) => (
              <Box
                key={item}
                sx={(theme) => ({
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.2,
                  p: 1.3,
                  borderRadius: '18px',
                  border: '1px solid',
                  borderColor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.09 : 0.07),
                  backgroundColor: alpha(
                    theme.palette.background.paper,
                    theme.palette.mode === 'dark' ? 0.46 : 0.84,
                  ),
                })}
              >
                <Box
                  sx={(theme) => ({
                    width: 28,
                    height: 28,
                    borderRadius: '10px',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    color: theme.palette.mode === 'dark' ? '#0f1111' : '#ffffff',
                    backgroundColor: index === 0 ? 'primary.main' : alpha(theme.palette.text.primary, 0.14),
                  })}
                >
                  {index === 0 ? <SearchRounded sx={{ fontSize: 17 }} /> : index + 1}
                </Box>
                <Typography sx={{ color: 'text.secondary', lineHeight: 1.55 }}>{item}</Typography>
              </Box>
            ))}
          </Stack>

          <Stack spacing={1.5}>
            <TextField
              fullWidth
              label="Tavily API key"
              placeholder="tvly-..."
              value={value.tavilyApiKey}
              onChange={(event) =>
                onChange({
                  ...value,
                  tavilyApiKey: event.target.value,
                })
              }
              type={showTavilyKey ? 'text' : 'password'}
              autoFocus
              helperText="Used for live web search."
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      aria-label={showTavilyKey ? 'Hide Tavily key' : 'Show Tavily key'}
                      onClick={() => {
                        setShowTavilyKey((currentValue) => !currentValue);
                      }}
                    >
                      {showTavilyKey ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Google AI Studio API key"
              placeholder="AIza..."
              value={value.googleStudioApiKey}
              onChange={(event) =>
                onChange({
                  ...value,
                  googleStudioApiKey: event.target.value,
                })
              }
              type={showGoogleKey ? 'text' : 'password'}
              helperText="Used for the Gemini model behind Blink."
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      aria-label={showGoogleKey ? 'Hide Google key' : 'Show Google key'}
                      onClick={() => {
                        setShowGoogleKey((currentValue) => !currentValue);
                      }}
                    >
                      {showGoogleKey ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>

          <Box
            sx={(theme) => ({
              display: 'flex',
              gap: 1.25,
              alignItems: 'flex-start',
              p: 1.45,
              borderRadius: '18px',
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.18),
              backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.1 : 0.06),
            })}
          >
            <LockOutlined sx={{ mt: 0.15, color: 'primary.main' }} />
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: 13.5 }}>Blink is not saving your keys</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.35, fontSize: 13.5, lineHeight: 1.55 }}>
                Blink does not store these keys on the server. They stay in this browser and are
                only sent with your own research requests.
              </Typography>
            </Box>
          </Box>

          <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.2} justifyContent="flex-end">
            {canClose ? (
              <Button variant="text" color="inherit" onClick={onClose}>
                Maybe later
              </Button>
            ) : null}
            <Button
              variant="contained"
              onClick={onSave}
              disabled={!canSave}
              sx={{ minWidth: 154, minHeight: 46 }}
            >
              Save keys locally
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
