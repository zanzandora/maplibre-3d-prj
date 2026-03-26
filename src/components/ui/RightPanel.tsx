import React from 'react';
import { Edit3, LucideLayoutPanelLeft, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { useBIMStore, type ISelectedElement } from '../store/useBIMStore';

export const RightPanel: React.FC = () => {
  const rightPanelOpen = useBIMStore((s) => s.rightPanelOpen);
  const selectedElement = useBIMStore((s) => s.selectedElement);
  const isHighlighting = useBIMStore((s) => s.isHighlighting);
  const toggleRightPanel = useBIMStore((s) => s.toggleRightPanel);

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

  // Helper to filter out internal or handled properties and null/undefined/empty values
  const getDisplayAttributes = (element: ISelectedElement) => {
    const skip = ['psets'];
    return Object.entries(element).filter(
      ([key, val]) =>
        !skip.includes(key) &&
        !key.startsWith('_') &&
        typeof val !== 'object' &&
        val !== null &&
        val !== undefined &&
        val !== ''
    );
  };

  return (
    <aside className='absolute right-4 top-20 bottom-12 min-w-xs max-w-sm flex flex-col bg-bim-bg-panel/90 backdrop-blur-md border border-bim-border-main rounded-lg overflow-hidden pointer-events-auto shadow-2xl transition-all'>
      <div className='p-3 border-b border-bim-border-light flex items-center justify-between'>
        <h2 className='text-xs font-bold text-bim-text-main uppercase tracking-widest'>
          Properties
        </h2>
        <Button
          variant='ghost'
          size='icon'
          onClick={toggleRightPanel}
          className='w-5 h-auto p-0 hover:bg-transparent'
        >
          <LucideLayoutPanelLeft className='w-3.5 h-3.5' />
        </Button>
      </div>

      <div className='flex-1 overflow-y-auto p-4 space-y-6 relative'>
        {isHighlighting && (
          <div className='absolute inset-0 z-10 bg-bim-bg-main/60 backdrop-blur-[2px] flex flex-col items-center justify-center space-y-3'>
            <Loader2 className='w-8 h-8 text-bim-primary animate-spin' />
            <span className='text-[10px] font-bold text-bim-primary uppercase tracking-widest'>
              Loading Data...
            </span>
          </div>
        )}
        {selectedElement ? (
          <>
            <section>
              <h3 className='text-base font-bold text-bim-primary mb-0.5'>
                {selectedElement.Name ||
                  selectedElement.name ||
                  'Unknown Element'}
              </h3>
              <p className='text-xs text-bim-text-muted uppercase tracking-wider'>
                GUID: {selectedElement._guid || 'N/A'}
              </p>
              <p className='text-xs text-bim-text-muted uppercase tracking-wider'>
                LocalId: {selectedElement._localId}
              </p>
            </section>

            {/* Base Attributes Section */}
            {getDisplayAttributes(selectedElement).length > 0 && (
              <section className='space-y-2'>
                <h4 className='text-[10px] font-bold text-bim-primary uppercase tracking-wider border-b border-bim-border-light pb-1'>
                  General Attributes
                </h4>
                <div className='grid grid-cols-2 gap-y-1.5  text-xs'>
                  {getDisplayAttributes(selectedElement).map(([key, val]) => (
                    <React.Fragment key={key}>
                      <span className='text-bim-text-muted'>{key}</span>
                      <span
                        className='text-right text-bim-text-main pl-2 truncate'
                        title={String(val)}
                      >
                        {String(val)}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </section>
            )}

            {/* Property Sets Sections */}
            {Object.entries(selectedElement.psets || {}).map(
              ([psetName, props]) => {
                const validProps = Object.entries(props).filter(
                  ([_, v]) => v !== null && v !== undefined && v !== ''
                );

                if (validProps.length === 0) return null;

                return (
                  <section key={psetName} className='space-y-2'>
                    <h4 className='text-[10px] font-bold text-bim-primary uppercase tracking-wider border-b border-bim-border-light pb-1'>
                      {psetName}
                    </h4>
                    <div className='grid grid-cols-2 gap-y-1.5 text-xs'>
                      {validProps.map(([propName, val]) => (
                        <React.Fragment key={propName}>
                          <span className='text-bim-text-muted'>
                            {propName}
                          </span>
                          <span
                            className='text-right text-bim-text-main font-mono  pl-2'
                            title={String(val)}
                          >
                            {String(val)}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  </section>
                );
              }
            )}
          </>
        ) : (
          <div className='h-full flex flex-col items-center justify-center text-bim-text-muted/50 space-y-2'>
            <Edit3 className='w-8 h-8 ' />
            <span className='text-xs italic'>No element selected</span>
          </div>
        )}
      </div>

      {/* <div className='p-3 bg-slate-900 border-t border-slate-800 flex gap-2'>
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
      </div> */}
    </aside>
  );
};
