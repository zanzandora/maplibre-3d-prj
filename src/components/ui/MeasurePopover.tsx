import { Ruler, Square, Maximize, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from './elements/Button';
import { useBIMStore } from '../../store/useBIMStore';
import { Popover, PopoverContent, PopoverTrigger } from './elements/Popover';
import { RadioGroup, RadioGroupItem } from './elements/RadioGroup';

const UNIT_OPTIONS: Record<string, string[]> = {
  length: ['mm', 'cm', 'm', 'km'],
  area: ['mm2', 'cm2', 'm2', 'km2'],
  volume: ['mm3', 'cm3', 'm3', 'km3'],
};

export const MeasurePopover = ({
  isActive,
  onMainClick,
}: {
  isActive: boolean;
  onMainClick: () => void;
}) => {
  const activeSubTools = useBIMStore((s) => s.activeSubTools);
  const setActiveSubTool = useBIMStore((s) => s.setActiveSubTool);
  const activeSubToolId = activeSubTools['measure'] || 'length';

  const measureUnit = useBIMStore((s) => s.measureUnit);
  const setMeasureUnit = useBIMStore((s) => s.setMeasureUnit);
  const measurePrecision = useBIMStore((s) => s.measurePrecision);
  const setMeasurePrecision = useBIMStore((s) => s.setMeasurePrecision);

  const subTools = [
    { id: 'length', icon: Ruler, label: 'Length' },
    { id: 'area', icon: Square, label: 'Area' },
    { id: 'volume', icon: Maximize, label: 'Volume' },
  ];

  const activeSubTool = subTools.find((s) => s.id === activeSubToolId);
  const Icon = activeSubTool?.icon || Ruler;

  const currentUnitsList =
    UNIT_OPTIONS[activeSubToolId] || UNIT_OPTIONS['length'];

  const displayUnit = currentUnitsList.includes(measureUnit)
    ? measureUnit
    : currentUnitsList[0];

  return (
    <Popover>
      <PopoverTrigger
        render={<div className='inline-block' />}
        nativeButton={false}
      >
        <Button
          onClick={onMainClick}
          variant={isActive ? 'default' : 'ghost'}
          size='icon'
          className={`rounded-full transition-all ${
            isActive
              ? 'shadow-lg shadow-bim-primary/40'
              : 'text-bim-text-muted hover:text-bim-text-main'
          }`}
          title='Measure'
        >
          <Icon className='w-5 h-5' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side='top'
        sideOffset={12}
        className='w-[280px] px-2 py-4 bg-bim-bg-panel/80 backdrop-blur-xl border border-bim-border-light rounded-2xl shadow-2xl'
      >
        <div className='flex flex-col gap-2'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-semibold text-bim-text-main px-2'>
              Measure Tool Settings
            </span>
          </div>

          {/* Mode Selection */}
          <div className='grid grid-cols-3 gap-2 p-1 bg-bim-bg-item/40 rounded-xl border border-bim-border-light/50 mx-1'>
            {subTools.map((sub) => {
              const isSubActive = activeSubToolId === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubTool('measure', sub.id)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-lg transition-all cursor-pointer ${
                    isSubActive
                      ? 'bg-bim-primary text-white shadow-lg shadow-bim-primary/30'
                      : 'text-bim-text-muted hover:text-bim-text-main hover:bg-bim-bg-item-hover'
                  }`}
                >
                  <sub.icon className='w-5 h-5' />
                  <span className='text-[11px] font-medium'>{sub.label}</span>
                </button>
              );
            })}
          </div>

          {/* Unit Section */}
          <div className='flex flex-col gap-2 p-3 bg-bim-bg-item/40 rounded-xl border border-bim-border-light/50 mx-1'>
            <span className='text-xs font-semibold text-bim-text-muted px-1'>
              Unit
            </span>
            <RadioGroup
              className='grid-cols-4 gap-1 mt-1'
              defaultValue='mm'
              value={displayUnit}
              onValueChange={setMeasureUnit}
            >
              {currentUnitsList.map((unit) => (
                <RadioGroupItem key={unit} id={unit} value={unit}>
                  {unit}
                </RadioGroupItem>
              ))}
            </RadioGroup>
          </div>

          {/* Precision Section */}
          <div className='flex flex-col gap-2 p-3 bg-bim-bg-item/40 rounded-xl border border-bim-border-light/50 mx-1'>
            <span className='text-xs font-semibold text-bim-text-muted px-1'>
              Precision
            </span>
            <RadioGroup
              className='grid-cols-4 gap-1'
              defaultValue={2}
              value={measurePrecision}
              onValueChange={setMeasurePrecision}
            >
              {[0, 1, 2, 3, 4, 5].map((p) => (
                <RadioGroupItem key={p} id={`p-${p}`} value={p}>
                  {p}
                </RadioGroupItem>
              ))}
            </RadioGroup>
          </div>

          {/* Actions */}
          <div className='flex gap-2 mt-1 px-1'>
            <Button
              variant='default'
              className='flex-1 h-10 rounded-xl text-xs font-semibold shadow-lg shadow-bim-primary/20'
            >
              <RotateCcw className='w-3.5 h-3.5 mr-1.5' />
              Clear Line
            </Button>
            <Button
              variant='outline'
              className='flex-1 h-10 rounded-xl text-xs font-semibold border-bim-border-light hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50'
            >
              <Trash2 className='w-3.5 h-3.5 mr-1.5' />
              Clear All
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
