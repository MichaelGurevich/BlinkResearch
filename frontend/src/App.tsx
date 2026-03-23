import { CssBaseline, ThemeProvider } from '@mui/material';
import type { PaletteMode } from '@mui/material';
import { useEffect, useState } from 'react';
import ChatPage from './features/chat/ChatPage';
import { createAppTheme } from './theme';

const COLOR_MODE_STORAGE_KEY = 'blinkresearch-color-mode';

const getInitialMode = (): PaletteMode => {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const storedMode = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
  if (storedMode === 'light' || storedMode === 'dark') {
    return storedMode;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

function App() {
  const [mode, setMode] = useState<PaletteMode>(getInitialMode);
  const theme = createAppTheme(mode);

  useEffect(() => {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ChatPage
        mode={mode}
        onToggleColorMode={() => {
          setMode((currentMode) => (currentMode === 'dark' ? 'light' : 'dark'));
        }}
      />
    </ThemeProvider>
  );
}

export default App;
