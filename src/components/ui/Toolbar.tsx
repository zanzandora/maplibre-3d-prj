import {
  RefreshCcw,
  Ruler,
  Search,
  Scissors,
  User,
  Box,
  Orbit,
  Square,
  Maximize,
  type LucideIcon,
} from 'lucide-react';
import { Button } from './elements/Button';
import { useBIMStore } from '../../store/useBIMStore';
import { Popover, PopoverContent, PopoverTrigger } from './elements/Popover';

interface SubTool {
  id: string;
  icon: LucideIcon;
  label: string;
}

interface Tool {
  id: string;
  icon: LucideIcon;
  label: string;
  subTools?: SubTool[];
}

interface Divider {
  divider: true;
}

type ToolbarItem = Tool | Divider;

const ToolButton: React.FC<{
  tool: Tool;
  isActive: boolean;
  onClick: () => void;
}> = ({ tool, isActive, onClick }) => (
  <Button
    onClick={onClick}
    variant={isActive ? 'default' : 'ghost'}
    size='icon'
    className={`rounded-full transition-all ${
      isActive
        ? 'shadow-lg shadow-bim-primary/40'
        : 'text-bim-text-muted hover:text-bim-text-main'
    }`}
    title={tool.label}
  >
    <tool.icon className='w-5 h-5' />
  </Button>
);

const ToolWithPopover: React.FC<{
  tool: Tool;
  isActive: boolean;
  onMainClick: () => void;
}> = ({ tool, isActive, onMainClick }) => (
  <Popover>
    <PopoverTrigger>
      <div className='inline-block'>
        <ToolButton tool={tool} isActive={isActive} onClick={onMainClick} />
      </div>
    </PopoverTrigger>
    <PopoverContent side='top' className='w-fit p-2'>
      <div className='flex gap-2'>
        {tool.subTools?.map((sub) => (
          <Button
            key={sub.id}
            variant='ghost'
            size='sm'
            className='flex flex-col items-center gap-1 h-auto p-2 text-bim-text-muted hover:text-bim-text-main hover:bg-bim-bg-item-hover rounded-md'
            title={sub.label}
          >
            <sub.icon className='w-4 h-4' />
            {/* <span className='text-[10px]'>{sub.label}</span> */}
          </Button>
        ))}
      </div>
    </PopoverContent>
  </Popover>
);

export const Toolbar: React.FC = () => {
  const activeTool = useBIMStore((s) => s.activeTool);
  const setActiveTool = useBIMStore((s) => s.setActiveTool);

  const tools: ToolbarItem[] = [
    { id: 'orbit', icon: Orbit, label: 'Orbit' },
    {
      id: 'measure',
      icon: Ruler,
      label: 'Measure',
      subTools: [
        { id: 'length', icon: Ruler, label: 'Length' },
        { id: 'area', icon: Square, label: 'Area' },
        { id: 'volume', icon: Maximize, label: 'Volume' },
      ],
    },
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

        {tools.map((item, index) => {
          if ('divider' in item) {
            return (
              <div
                key={`div-${index}`}
                className='w-px h-6 bg-bim-border-main mx-1'
              />
            );
          }

          const isActive = activeTool === item.id;
          const onMainClick = () => setActiveTool(item.id as any);

          return item.subTools ? (
            <ToolWithPopover
              key={item.id}
              tool={item}
              isActive={isActive}
              onMainClick={onMainClick}
            />
          ) : (
            <ToolButton
              key={item.id}
              tool={item}
              isActive={isActive}
              onClick={onMainClick}
            />
          );
        })}
      </div>
    </div>
  );
};
