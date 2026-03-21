import './App.css';
import BIMViewer from './components/BIMViewer';
import { BIMProvider } from './context/BIMContext';

function App() {
  return (
    <div id='app-container'>
      <BIMProvider>
        <BIMViewer />
      </BIMProvider>
    </div>
  );
}

export default App;
