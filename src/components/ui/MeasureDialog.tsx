import { Ruler, Square, Maximize, Trash2 } from 'lucide-react';
import { Button } from './elements/Button';
import { useBIMStore } from '../../store/useBIMStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './elements/Dialog';

export const MeasureDialog = ({
  isActive,
  onMainClick,
}: {
  isActive: boolean;
  onMainClick: () => void;
}) => {
  const activeSubTools = useBIMStore((s) => s.activeSubTools);
  const setActiveSubTool = useBIMStore((s) => s.setActiveSubTool);
  const activeSubToolId = activeSubTools['measure'] || 'length';

  const subTools = [
    { id: 'length', icon: Ruler, label: 'Length' },
    { id: 'area', icon: Square, label: 'Area' },
    { id: 'volume', icon: Maximize, label: 'Volume' },
  ];

  const activeSubTool = subTools.find((s) => s.id === activeSubToolId);
  const Icon = activeSubTool?.icon || Ruler;

  return (
    <Dialog>
      <DialogTrigger
        render={<div className='inline-block' />}
        nativeButton={false}
      >
        <Button
          onClick={onMainClick}
          variant={isActive ? 'default' : 'ghost'}
          size='icon'
          className={`rounded-full transition-all ${
            isActive
              ? 'shadow-lg shadow-bim-primary/40'
              : 'text-bim-text-muted hover:text-bim-text-main'
          }`}
          title='Measure'
        >
          <Icon className='w-5 h-5' />
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[320px] bg-bim-bg-panel/90 backdrop-blur-xl border-bim-border-light'>
        <DialogHeader>
          <DialogTitle className='text-lg font-semibold flex items-center gap-2'>
            <Ruler className='w-5 h-5 text-bim-primary' />
            Measure Tool
          </DialogTitle>
        </DialogHeader>

        <div className='flex flex-col gap-4 py-2'>
          {/* Mode Selection */}
          <div className='grid grid-cols-3 gap-2 p-1 bg-bim-bg-item/40 rounded-xl border border-bim-border-light/50'>
            {subTools.map((sub) => {
              const isSubActive = activeSubToolId === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubTool('measure', sub.id)}
                  className={`flex flex-col items-center gap-1.5 py-4 rounded-lg transition-all cursor-pointer ${
                    isSubActive
                      ? 'bg-bim-primary text-white shadow-lg shadow-bim-primary/30'
                      : 'text-bim-text-muted hover:text-bim-text-main hover:bg-bim-bg-item-hover'
                  }`}
                >
                  <sub.icon className='w-5 h-5' />
                  <span className='text-xs font-medium'>{sub.label}</span>
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className='flex gap-2 pt-2'>
            <Button
              variant='destructive'
              onClick={() =>
                window.dispatchEvent(new CustomEvent('bim-measure-delete-all'))
              }
              className='flex-1 h-11 rounded-xl text-sm font-semibold'
            >
              <Trash2 className='w-4 h-4 mr-2' />
              Clear All
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
