import { Edit3, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBIMStore } from '../../store/useBIMStore';
import { Virtuoso } from 'react-virtuoso';
import { flattenedProperties } from '../../hooks/ui/useFlattenedProperties';

export const RightPanel = () => {
  const rightPanelOpen = useBIMStore((s) => s.rightPanelOpen);
  const selectedElement = useBIMStore((s) => s.selectedElement);
  const isHighlighting = useBIMStore((s) => s.isHighlighting);
  const toggleRightPanel = useBIMStore((s) => s.toggleRightPanel);

  return (
    <div
      className={`absolute top-10 bottom-12 right-0 flex items-center transition-transform duration-300 ease-in-out z-50 pointer-events-none ${
        rightPanelOpen ? '-translate-x-2.5' : 'translate-x-[calc(100%-1.25rem)]'
      }`}
    >
      {/* Tall Toggle Handle */}
      <button
        onClick={toggleRightPanel}
        className='pointer-events-auto h-full w-6 flex items-center justify-center bg-bim-bg-item border border-bim-border-main rounded-l-lg hover:bg-bim-bg-item-hover text-bim-text-main hover:text-bim-primary transition-all shadow-lg group cursor-pointer'
      >
        {rightPanelOpen ? (
          <ChevronRight className='w-4 h-4 group-hover:scale-125 transition-transform' />
        ) : (
          <ChevronLeft className='w-4 h-4 group-hover:scale-125 transition-transform' />
        )}
      </button>

      <aside className='pointer-events-auto w-xs max-w-sm h-full flex flex-col bg-bim-bg-panel/90 backdrop-blur-md border-y border-r border-bim-border-main rounded-r-lg overflow-hidden shadow-2xl'>
        <div className='p-3 border-b border-bim-border-light flex items-center justify-between'>
          <h2 className='text-xs font-bold text-bim-text-main uppercase tracking-widest'>
            Properties
          </h2>
        </div>

        <div className='flex-1 relative'>
          {isHighlighting && (
            <div className='absolute inset-0 z-10 bg-bim-bg-main/60 backdrop-blur-[2px] flex flex-col items-center justify-center space-y-3'>
              <Loader2 className='w-8 h-8 text-bim-primary animate-spin' />
              <span className='text-[10px] font-bold text-bim-primary uppercase tracking-widest'>
                Loading Data...
              </span>
            </div>
          )}

          {selectedElement ? (
            <Virtuoso
              style={{ height: '100%' }}
              data={flattenedProperties(selectedElement)}
              itemContent={(_index, item) => {
                if (item.type === 'basic') {
                  return (
                    <section className='p-4 pb-2'>
                      <h3 className='text-base font-bold text-bim-primary mb-0.5'>
                        {item.name}
                      </h3>
                      <p className='text-xs text-bim-text-muted uppercase tracking-wider'>
                        GUID: {item.guid}
                      </p>
                      <p className='text-xs text-bim-text-muted uppercase tracking-wider'>
                        LocalId: {item.localId}
                      </p>
                    </section>
                  );
                }

                if (item.type === 'header') {
                  return (
                    <div className='px-4 pt-4 pb-1'>
                      <h4 className='text-[10px] font-bold text-bim-primary uppercase tracking-wider border-b border-bim-border-light pb-1'>
                        {item.label}
                      </h4>
                    </div>
                  );
                }

                return (
                  <div className='px-4 py-1 flex justify-between gap-2 text-xs hover:bg-bim-bg-item-hover transition-colors'>
                    <span className='text-bim-text-muted shrink-0'>
                      {item.key}
                    </span>
                    <span
                      className='text-right text-bim-text-main font-mono truncate'
                      title={String(item.value)}
                    >
                      {String(item.value)}
                    </span>
                  </div>
                );
              }}
            />
          ) : (
            <div className='h-full flex flex-col items-center justify-center text-bim-text-muted/50 space-y-2'>
              <Edit3 className='w-8 h-8 ' />
              <span className='text-xs italic'>No element selected</span>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
