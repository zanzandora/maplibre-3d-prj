import { Share2, Edit3, LucideLayoutPanelLeft } from 'lucide-react';
import { Button } from './Button';
import { useBIMStore } from '../store/useBIMStore';

export const RightPanel: React.FC = () => {
  const { rightPanelOpen, toggleRightPanel, selectedElement } = useBIMStore();

  if (!rightPanelOpen) {
    return (
      <div className='absolute right-4 top-20 pointer-events-auto'>
        <Button
          variant='secondary'
          size='icon'
          onClick={toggleRightPanel}
          className='shadow-lg'
        >
          <LucideLayoutPanelLeft className='w-5 h-5' />
        </Button>
      </div>
    );
  }

  return (
    <aside className='absolute right-4 top-20 bottom-12 w-80 flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg overflow-hidden pointer-events-auto shadow-2xl transition-all'>
      <div className='p-3 border-b border-slate-800 flex items-center justify-between'>
        <h2 className='text-xs font-bold text-slate-400 uppercase tracking-widest'>
          Properties
        </h2>
        <Button
          variant='ghost'
          size='icon'
          onClick={toggleRightPanel}
          className='w-5 h-5 h-auto p-0 hover:bg-transparent'
        >
          <LucideLayoutPanelLeft className='w-3.5 h-3.5' />
        </Button>
      </div>

      <div className='flex-1 overflow-y-auto p-4 space-y-6'>
        {selectedElement ? (
          <>
            <section>
              <h3 className='text-sm font-bold text-blue-400 mb-0.5'>
                {selectedElement.name}
              </h3>
              <p className='text-[10px] text-slate-500 uppercase tracking-wider'>
                ID: {selectedElement.id}
              </p>
            </section>

            <section className='space-y-2'>
              <h4 className='text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-1'>
                Geometry
              </h4>
              <div className='grid grid-cols-2 gap-y-1.5 text-xs'>
                <span className='text-slate-500'>Length</span>
                <span className='text-right text-slate-300 font-mono'>
                  {selectedElement.geometry.length}
                </span>
                <span className='text-slate-500'>Width</span>
                <span className='text-right text-slate-300 font-mono'>
                  {selectedElement.geometry.width}
                </span>
                <span className='text-slate-500'>Height</span>
                <span className='text-right text-slate-300 font-mono'>
                  {selectedElement.geometry.height}
                </span>
                <span className='text-slate-500'>Volume</span>
                <span className='text-right text-slate-300 font-mono'>
                  {selectedElement.geometry.volume}
                </span>
              </div>
            </section>

            <section className='space-y-2'>
              <h4 className='text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-1'>
                BIM Attributes
              </h4>
              <div className='grid grid-cols-2 gap-y-1.5 text-xs'>
                <span className='text-slate-500'>Material</span>
                <span className='text-right text-slate-300'>
                  {selectedElement.attributes.material}
                </span>
                <span className='text-slate-500'>Phasing</span>
                <span className='text-right text-emerald-400 text-[10px] font-bold uppercase'>
                  {selectedElement.attributes.phasing}
                </span>
                <span className='text-slate-500'>Fire Rating</span>
                <span className='text-right text-slate-300'>
                  {selectedElement.attributes.fireRating}
                </span>
                <span className='text-slate-500'>U-Value</span>
                <span className='text-right text-slate-300'>
                  {selectedElement.attributes.uValue}
                </span>
              </div>
            </section>

            <section className='space-y-2'>
              <h4 className='text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-1'>
                Lifecycle
              </h4>
              <div className='grid grid-cols-2 gap-y-1.5 text-xs'>
                <span className='text-slate-500'>Status</span>
                <span className='text-right text-amber-500 font-bold'>
                  {selectedElement.lifecycle.status}
                </span>
                <span className='text-slate-500'>Cost Est.</span>
                <span className='text-right text-slate-100 font-bold'>
                  {selectedElement.lifecycle.costEst}
                </span>
              </div>
            </section>
          </>
        ) : (
          <div className='h-full flex flex-col items-center justify-center text-slate-600 space-y-2'>
            <Edit3 className='w-8 h-8 opacity-20' />
            <span className='text-xs italic'>No element selected</span>
          </div>
        )}
      </div>

      <div className='p-3 bg-slate-900 border-t border-slate-800 flex gap-2'>
        <Button
          variant='secondary'
          size='sm'
          className='flex-1 text-[10px] font-bold uppercase tracking-wider h-8'
        >
          Edit Metadata
        </Button>
        <Button
          variant='secondary'
          size='icon'
          className='w-9 h-8 border border-slate-700'
        >
          <Share2 className='w-4 h-4' />
        </Button>
      </div>
    </aside>
  );
};
