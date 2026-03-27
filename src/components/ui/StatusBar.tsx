export const StatusBar = () => {
  return (
    <footer className='h-6 flex items-center justify-between px-3 bg-bim-bg-main border-t border-bim-border-light text-[10px] text-bim-text-muted pointer-events-auto'>
      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-2'>
          <div className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' />
          <span>Renderer Active (WebGL 2.0)</span>
        </div>
        <div className='h-3 w-px bg-bim-border-light' />
        <span>FPS: 60</span>
        <div className='h-3 w-px bg-bim-border-light' />
        <span className='font-mono'>X: 142.4 Y: -12.8 Z: 0.0</span>
      </div>
    </footer>
  );
};
