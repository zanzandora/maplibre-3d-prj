import { Box, X } from 'lucide-react';
import { Button } from './Button';
import { useBIMStore } from '../store/useBIMStore';

export const Header: React.FC = () => {
  const setBIMVisible = useBIMStore((state) => state.setBIMVisible);
  const totalElements = useBIMStore((state) => state.totalElements);

  return (
    <header className='h-14 flex items-center justify-between px-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-700 pointer-events-auto'>
      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 bg-blue-600 rounded flex items-center justify-center'>
            <Box className='w-5 h-5 text-white' />
          </div>
          <span className='font-bold text-slate-100 hidden sm:block'>
            BIM ARCHITECT
          </span>
        </div>

        <div className='h-4 w-px bg-slate-700 mx-2' />

        <div className='flex flex-col'>
          <h1 className='text-sm font-medium text-slate-200'>
            Project: Horizon Corporate Plaza
          </h1>
          <span className='text-[10px] text-slate-400'>v2.4_Stable</span>
        </div>
      </div>

      <div className='flex items-center gap-6'>
        <div className='hidden lg:flex items-center gap-4 text-[10px] uppercase tracking-wider text-slate-400'>
          <div className='flex items-center gap-1.5'>
            <span className='italic'>LOD:</span>
            <span className='text-slate-200'>400</span>
          </div>
          <div className='h-3 w-px bg-slate-700' />
          <div className='flex items-center gap-1.5'>
            <span className='italic'>Elements:</span>
            <span className='text-slate-200'>{totalElements.toLocaleString()}</span>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          {/* <Button size='sm' className='gap-2'>
            <FileOutput className='w-3.5 h-3.5' />
            Export IFC
          </Button> */}

          <Button
            variant='secondary'
            size='icon'
            className='w-8 h-8'
            onClick={() => setBIMVisible(false)}
          >
            <X className='w-4 h-4' />
          </Button>

          {/* <Button
            variant='secondary'
            size='icon'
            className='rounded-full w-8 h-8 font-bold text-xs p-0 border border-slate-600'
          >
            JD
          </Button> */}
        </div>
      </div>
    </header>
  );
};
