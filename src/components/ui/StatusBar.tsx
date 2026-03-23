import { Button } from './Button';

export const StatusBar: React.FC = () => {
  return (
    <footer className='h-6 flex items-center justify-between px-3 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-500 pointer-events-auto'>
      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-2'>
          <div className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' />
          <span>Renderer Active (WebGL 2.0)</span>
        </div>
        <div className='h-3 w-px bg-slate-800' />
        <span>FPS: 60</span>
        <div className='h-3 w-px bg-slate-800' />
        <span className='font-mono'>X: 142.4 Y: -12.8 Z: 0.0</span>
      </div>

      <div className='flex items-center gap-4'>
        <Button
          variant='ghost'
          className='h-full p-0 text-[10px] hover:bg-transparent hover:text-slate-300 transition-colors'
        >
          Keyboard Shortcuts
        </Button>
        <Button
          variant='ghost'
          className='h-full p-0 text-[10px] hover:bg-transparent hover:text-slate-300 transition-colors'
        >
          Documentation
        </Button>
      </div>
    </footer>
  );
};
