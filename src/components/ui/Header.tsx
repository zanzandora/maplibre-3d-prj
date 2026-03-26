import { Box, X } from 'lucide-react';
import { Button } from './elements/Button';
import { useBIMStore } from '../../store/useBIMStore';
import { DarkMode } from './DarkMode';

export const Header: React.FC = () => {
  const setBIMVisible = useBIMStore((state) => state.setBIMVisible);
  const totalElements = useBIMStore((state) => state.totalElements);

  return (
    <header className='h-14 flex items-center justify-between px-4 bg-bim-bg-panel/80 backdrop-blur-md border-b border-bim-border-light pointer-events-auto transition-colors duration-300'>
      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 bg-bim-primary rounded flex items-center justify-center shadow-lg shadow-blue-500/20'>
            <Box className='w-5 h-5 text-white' />
          </div>
          <span className='font-bold text-bim-text-main hidden sm:block'>
            BIM ARCHITECT
          </span>
        </div>

        <div className='h-4 w-px bg-bim-border-light mx-2' />

        <div className='flex flex-col'>
          <h1 className='text-sm font-medium text-bim-text-main'>
            Project: Horizon Corporate Plaza
          </h1>
          <span className='text-[10px] text-bim-text-muted'>v2.4_Stable</span>
        </div>
      </div>

      <div className='flex items-center gap-6'>
        <div className='hidden lg:flex items-center gap-4 text-[10px] uppercase tracking-wider text-bim-text-muted'>
          <div className='flex items-center gap-1.5'>
            <span className='italic'>LOD:</span>
            <span className='text-bim-text-main'>400</span>
          </div>
          <div className='h-3 w-px bg-bim-border-light' />
          <div className='flex items-center gap-1.5'>
            <span className='italic'>Elements:</span>
            <span className='text-bim-text-main'>
              {totalElements.toLocaleString()}
            </span>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <DarkMode />

          <Button
            variant='destructive'
            size='icon'
            className='w-8 h-8'
            onClick={() => setBIMVisible(false)}
          >
            <X className='w-4 h-4' />
          </Button>
        </div>
      </div>
    </header>
  );
};
