import {
  Ruler,
  Search,
  Scissors,
  User,
  Box,
  Orbit,
  type LucideIcon,
  Settings,
  Square,
  Maximize,
  Trash2,
} from 'lucide-react';
import { useBIMStore } from '../../../store/useBIMStore';
import SettingsDialog from '../SettingsDialog';
import ToolWithPopover from './ToolWithPopover';
import ToolButton from './ToolButton';

interface Divider {
  divider: true;
}

export type SubTool = {
  id: string;
  icon: LucideIcon;
  label: string;
  color?: string;
  onClick?: () => void;
};

export type Tool = {
  id: string;
  icon: LucideIcon;
  label: string;
  subTools?: SubToolItem[];
};
type SubToolItem = SubTool | Divider;

type ToolbarItem = Tool | Divider;

export const Toolbar = () => {
  const activeTool = useBIMStore((s) => s.activeTool);
  const activeSubTools = useBIMStore((s) => s.activeSubTools);
  const setActiveTool = useBIMStore((s) => s.setActiveTool);
  const setActiveSubTool = useBIMStore((s) => s.setActiveSubTool);

  const tools: ToolbarItem[] = [
    { id: 'settings', icon: Settings, label: 'Settings' },
    { divider: true },
    { id: 'orbit', icon: Orbit, label: 'Orbit' },
    {
      id: 'measure',
      icon: Ruler,
      label: 'Measure',
      subTools: [
        { id: 'length', icon: Ruler, label: 'Length' },
        { id: 'area', icon: Square, label: 'Area' },
        { id: 'volume', icon: Maximize, label: 'Volume' },
        { divider: true },
        {
          id: 'clear-all',
          icon: Trash2,
          label: 'Clear All',
          color: 'red',
          onClick: () =>
            window.dispatchEvent(new CustomEvent('bim-measure-delete-all')),
        },
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

          if (item.id === 'settings') {
            return <SettingsDialog key={item.id} />;
          }

          // if (item.id === 'measure') {
          //   return (
          //     <MeasureDialog
          //       key={item.id}
          //       isActive={isActive}
          //       onMainClick={onMainClick}
          //     />
          //   );
          // }

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
