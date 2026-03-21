import BIMViewer from './components/BIMViewer';
import { BIMProvider } from './context/BIMProvider';

function App() {
  return (
    <div
      id='app-container'
      className='min-w-full overflow-hidden relative bg-black'
    >
      <BIMProvider>
        <BIMViewer />
      </BIMProvider>
    </div>
  );
}

export default App;
