import BIMViewer from './components/BIMViewer';
import { BIMProvider } from './context/bim/BIMProvider';
import { Button } from './components/ui/Button';
import { useBIMStore } from './store/useBIMStore';
import { ThemeProvider } from './context/theme/ThemeProvider';

function App() {
  const isBIMVisible = useBIMStore((state) => state.isBIMVisible);
  const setBIMVisible = useBIMStore((state) => state.setBIMVisible);

  return (
    <div
      id='app-container'
      className='min-w-full h-screen overflow-hidden relative bg-slate-950 flex items-center justify-center'
    >
      {!isBIMVisible ? (
        <div className='text-center space-y-4'>
          <h1 className='text-3xl font-bold text-slate-100'>
            MapLibre 3D Project
          </h1>
          <p className='text-slate-400'>
            Click the button below to launch the BIM Viewer
          </p>
          <Button size='lg' onClick={() => setBIMVisible(true)}>
            Enable BIM Viewer
          </Button>
        </div>
      ) : (
        <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
          <BIMProvider>
            <BIMViewer />
          </BIMProvider>
        </ThemeProvider>
      )}
    </div>
  );
}

export default App;
