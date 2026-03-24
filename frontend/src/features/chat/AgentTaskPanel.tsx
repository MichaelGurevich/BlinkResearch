import {
  CheckCircleOutlineRounded,
  HourglassEmptyRounded,
  RadioButtonUncheckedRounded,
} from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { AgentRunProgress, AgentTodo, TodoStatus } from './types';

interface AgentTaskPanelProps {
  progress: AgentRunProgress;
}

const STATUS_META: Record<
  TodoStatus,
  {
    icon: typeof HourglassEmptyRounded;
    label: string;
  }
> = {
  pending: {
    icon: RadioButtonUncheckedRounded,
    label: 'Pending',
  },
  in_progress: {
    icon: HourglassEmptyRounded,
    label: 'In progress',
  },
  completed: {
    icon: CheckCircleOutlineRounded,
    label: 'Completed',
  },
};

function TaskRow({ todo }: { todo: AgentTodo }) {
  const { icon: Icon, label } = STATUS_META[todo.status];

  return (
    <Box
      sx={(theme) => {
        const tone =
          todo.status === 'completed'
            ? theme.palette.success.main
            : todo.status === 'in_progress'
              ? theme.palette.primary.main
              : theme.palette.text.secondary;

        return {
          display: 'grid',
          gridTemplateColumns: '18px minmax(0, 1fr)',
          columnGap: 1,
          alignItems: 'start',
          py: 0.7,
          '& + &': {
            borderTop: '1px solid',
            borderColor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.06 : 0.05),
          },
          '.task-icon': {
            mt: 0.15,
            color: tone,
            opacity: todo.status === 'pending' ? 0.7 : 1,
          },
          '.task-text': {
            color: todo.status === 'completed' ? 'text.secondary' : 'text.primary',
            textDecoration: todo.status === 'completed' ? 'line-through' : 'none',
            textDecorationColor: alpha(theme.palette.text.secondary, 0.45),
          },
        };
      }}
    >
      <Icon className="task-icon" sx={{ fontSize: 15 }} />

      <Box sx={{ minWidth: 0 }}>
        <Typography className="task-text" sx={{ fontSize: 13.5, lineHeight: 1.5 }}>
          {todo.content}
        </Typography>
        <Typography sx={{ mt: 0.15, fontSize: 11, color: 'text.secondary' }}>{label}</Typography>
      </Box>
    </Box>
  );
}

export function AgentTaskPanel({ progress }: AgentTaskPanelProps) {
  if (progress.todos.length === 0) {
    return null;
  }

  const inProgressCount = progress.todos.filter((todo) => todo.status === 'in_progress').length;

  return (
    <Box
      sx={(theme) => ({
        mt: 0.35,
        mb: 0.35,
        ml: { xs: 4.2, sm: 3.4 },
        maxWidth: { xs: 'calc(100% - 2rem)', sm: '70%' },
        pl: 1.2,
        borderLeft: '1px solid',
        borderColor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.1 : 0.08),
      })}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 0.75,
          mb: 0.45,
        }}
      >
        <Typography sx={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.02em', color: 'text.secondary' }}>
          Tasks
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
          {inProgressCount > 0 ? `${inProgressCount} active` : `${progress.todos.length} tracked`}
        </Typography>
      </Box>

      <Box>
        {progress.todos.map((todo, index) => (
          <TaskRow key={`${todo.content}-${index}`} todo={todo} />
        ))}
      </Box>
    </Box>
  );
}
