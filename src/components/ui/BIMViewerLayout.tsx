import { Header } from './Header';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { Toolbar } from './toolbar/Toolbar';
import { StatusBar } from './StatusBar';

interface BIMViewerLayoutProps {
  children?: React.ReactNode;
}

export const BIMViewerLayout = ({ children }: BIMViewerLayoutProps) => {
  return (
    <div className='relative w-screen h-screen overflow-hidden bg-bim-bg-page transition-colors duration-500'>
      {/* Base Layer: 3D Rendering (Z-index 0) */}
      <div className='absolute inset-0 z-0'>{children}</div>

      {/* UI Layer: Overlays (Z-index 10) */}
      <div className='absolute inset-0 z-10 pointer-events-none flex flex-col'>
        {/* Top Header */}
        <Header />

        {/* Middle Content Area */}
        <div className='relative flex-1'>
          <LeftPanel />
          <RightPanel />
          <Toolbar />
        </div>

        {/* Bottom Status Bar */}
        {/* <StatusBar /> */}
      </div>
    </div>
  );
};
