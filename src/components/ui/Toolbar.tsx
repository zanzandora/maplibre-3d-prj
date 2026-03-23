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
import { useBIMStore } from '../store/useBIMStore';

export const Toolbar: React.FC = () => {
  const { activeTool, setActiveTool } = useBIMStore();

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
      <div className='flex items-center gap-1 p-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-full shadow-2xl'>
        <Button
          variant='ghost'
          size='icon'
          className='rounded-full text-slate-400 hover:text-white'
        >
          <RefreshCcw className='w-5 h-5' />
        </Button>

        {tools.map((tool, index) =>
          tool.divider ? (
            <div key={`div-${index}`} className='w-px h-6 bg-slate-700 mx-1' />
          ) : (
            <Button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as any)}
              variant={activeTool === tool.id ? 'default' : 'ghost'}
              size='icon'
              className={`rounded-full transition-all ${
                activeTool === tool.id
                  ? 'shadow-lg shadow-blue-900/40'
                  : 'text-slate-400 hover:text-slate-200'
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
