import {
  RefreshCcw,
  Ruler,
  Search,
  Scissors,
  User,
  Box,
  Orbit,
} from 'lucide-react';
import { Button } from './Button';
import { useBIMStore } from '../../store/useBIMStore';

export const Toolbar: React.FC = () => {
  const activeTool = useBIMStore((s) => s.activeTool);
  const setActiveTool = useBIMStore((s) => s.setActiveTool);

  const tools = [
    { id: 'orbit', icon: Orbit, label: 'Orbit' },
    { id: 'measure', icon: Ruler, label: 'Measure' },
    { id: 'search', icon: Search, label: 'Search' },
    { divider: true },
    { id: 'select', icon: Box, label: 'Select' },
    { id: 'clip', icon: Scissors, label: 'Clip' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className='absolute bottom-14 left-1/2 -translate-x-1/2 pointer-events-auto'>
      <div className='flex items-center gap-1 p-1.5 bg-bim-bg-panel/80 backdrop-blur-md border border-bim-border-main rounded-full shadow-2xl'>
        <Button
          variant='ghost'
          size='icon'
          className='rounded-full text-bim-text-muted hover:text-bim-text-main'
        >
          <RefreshCcw className='w-5 h-5' />
        </Button>

        {tools.map((tool, index) =>
          tool.divider ? (
            <div
              key={`div-${index}`}
              className='w-px h-6 bg-bim-border-main mx-1'
            />
          ) : (
            <Button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as any)}
              variant={activeTool === tool.id ? 'default' : 'ghost'}
              size='icon'
              className={`rounded-full transition-all ${
                activeTool === tool.id
                  ? 'shadow-lg shadow-bim-primary/40'
                  : 'text-bim-text-muted hover:text-bim-text-main'
              }`}
              title={tool.label}
            >
              {tool.icon && <tool.icon className='w-5 h-5' />}
            </Button>
          )
        )}
      </div>
    </div>
  );
};
