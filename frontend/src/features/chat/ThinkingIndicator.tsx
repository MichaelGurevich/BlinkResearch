import { Box } from '@mui/material';
import { alpha, keyframes, useTheme } from '@mui/material/styles';

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.4);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.4;
  }
`;

export function ThinkingIndicator() {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, py: 1 }}>
      {[0, 1, 2].map((dot, index) => (
        <Box
          key={dot}
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: alpha(theme.palette.primary.main, 0.9),
            animation: `${pulse} 900ms ease-in-out infinite`,
            animationDelay: `${index * 150}ms`,
          }}
        />
      ))}
    </Box>
  );
}
