import {
  VisibilityOffOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
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
          borderRadius: '18px',
          border: '1px solid',
          borderColor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.1 : 0.08),
          backgroundColor: theme.palette.background.paper,
          boxShadow: `0 20px 56px ${alpha('#000000', theme.palette.mode === 'dark' ? 0.38 : 0.14)}`,
        }),
      }}
    >
      <DialogContent sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 2, sm: 2.4 } }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ letterSpacing: '-0.01em', fontWeight: 600 }}>
              API keys
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 14.5 }}>
              Add your Tavily and Google AI Studio keys for this browser.
            </Typography>
          </Box>

          <Stack spacing={1.25}>
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
              size="small"
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
              size="small"
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

          <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.2} justifyContent="flex-end">
            {canClose ? (
              <Button variant="text" color="inherit" onClick={onClose} sx={{ minHeight: 40 }}>
                Cancel
              </Button>
            ) : null}
            <Button
              variant="contained"
              onClick={onSave}
              disabled={!canSave}
              sx={{ minWidth: 130, minHeight: 40 }}
            >
              Save
            </Button>
          </Stack>

          <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
            Stored locally in this browser only.
          </Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
