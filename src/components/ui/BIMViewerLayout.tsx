import { Header } from './Header';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { Toolbar } from './Toolbar';
import { StatusBar } from './StatusBar';

interface BIMViewerLayoutProps {
  children?: React.ReactNode; // For the 3D Canvas
}

export const BIMViewerLayout: React.FC<BIMViewerLayoutProps> = ({
  children,
}) => {
  return (
    <div className='relative w-screen h-screen overflow-hidden bg-[#202932]'>
      {/* Base Layer: 3D Rendering (Z-index 0) */}
      <div className='absolute inset-0 z-0'>
        {children}

        {/* Placeholder for the 3D grid shown in image */}
        <div className='absolute inset-0 pointer-events-none opacity-10'>
          <div className='w-full h-full bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:40px_40px]' />
        </div>
      </div>

      {/* UI Layer: Overlays (Z-index 10) */}
      <div className='absolute inset-0 z-10 pointer-events-none flex flex-col'>
        {/* Top Header */}
        <Header />

        {/* Middle Content Area */}
        <div className='relative flex-1'>
          <LeftPanel />
          <RightPanel />
          <Toolbar />

          {/* Compass / Viewcube Mock */}
          {/* <div className="absolute top-2 right-4 pointer-events-auto">
             <div className="w-12 h-12 bg-slate-800/80 border border-slate-700 rounded flex items-center justify-center text-[10px] font-bold text-slate-400 cursor-pointer hover:bg-slate-700">
               TOP
             </div>
          </div> */}
        </div>

        {/* Bottom Status Bar */}
        <StatusBar />
      </div>
    </div>
  );
};
