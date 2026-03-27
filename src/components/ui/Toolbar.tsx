import {
  RefreshCcw,
  Ruler,
  Search,
  Scissors,
  User,
  Box,
  Orbit,
  type LucideIcon,
} from 'lucide-react';
import { Button } from './elements/Button';
import { useBIMStore } from '../../store/useBIMStore';
import { Popover, PopoverContent, PopoverTrigger } from './elements/Popover';
import { MeasurePopover } from './MeasurePopover';

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

type IToolProps = {
  tool: Tool;
  isActive: boolean;
  onClick: () => void;
  iconOverride?: LucideIcon;
};

type IToolWithPopoverProps = {
  tool: Tool;
  isActive: boolean;
  onMainClick: () => void;
  activeSubToolId?: string;
  onSubClick: (subId: string) => void;
};

const ToolButton = ({ tool, isActive, onClick, iconOverride }: IToolProps) => {
  const Icon = iconOverride || tool.icon;
  return (
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
      <Icon className='w-5 h-5' />
    </Button>
  );
};

const ToolWithPopover = ({
  tool,
  isActive,
  onMainClick,
  activeSubToolId,
  onSubClick,
}: IToolWithPopoverProps) => {
  const activeSubTool = tool.subTools?.find((s) => s.id === activeSubToolId);

  return (
    <Popover>
      <PopoverTrigger
        render={<div className='inline-block' />}
        nativeButton={false}
      >
        <ToolButton
          tool={tool}
          isActive={isActive}
          onClick={onMainClick}
          iconOverride={activeSubTool?.icon}
        />
      </PopoverTrigger>
      <PopoverContent side='top' className='w-auto p-2'>
        <div className='flex gap-2'>
          {tool.subTools?.map((sub) => {
            const isSubActive = activeSubToolId === sub.id;
            return (
              <Button
                key={sub.id}
                onClick={() => onSubClick(sub.id)}
                variant='ghost'
                size='sm'
                className={`flex flex-col items-center gap-1 h-auto p-2 rounded-md transition-colors ${
                  isSubActive
                    ? 'text-bim-primary bg-bim-bg-item-hover'
                    : 'text-bim-text-muted hover:text-bim-text-main hover:bg-bim-bg-item-hover'
                }`}
                title={sub.label}
              >
                <sub.icon className='w-4 h-4' />
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const Toolbar = () => {
  const activeTool = useBIMStore((s) => s.activeTool);
  const activeSubTools = useBIMStore((s) => s.activeSubTools);
  const setActiveTool = useBIMStore((s) => s.setActiveTool);
  const setActiveSubTool = useBIMStore((s) => s.setActiveSubTool);

  const tools: ToolbarItem[] = [
    { id: 'orbit', icon: Orbit, label: 'Orbit' },
    {
      id: 'measure',
      icon: Ruler,
      label: 'Measure',
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

          if (item.id === 'measure') {
            return (
              <MeasurePopover
                key={item.id}
                isActive={isActive}
                onMainClick={onMainClick}
              />
            );
          }

          if (item.subTools) {
            return (
              <ToolWithPopover
                key={item.id}
                tool={item}
                isActive={isActive}
                onMainClick={onMainClick}
                activeSubToolId={activeSubTools[item.id]}
                onSubClick={(subId) => {
                  setActiveSubTool(item.id, subId);
                  setActiveTool(item.id as any);
                }}
              />
            );
          }

          return (
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
