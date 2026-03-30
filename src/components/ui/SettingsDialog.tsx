import { Settings } from 'lucide-react';
import { useBIMStore } from '../../store/useBIMStore';
import { Button } from './elements/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './elements/Dialog';
import { RadioGroup, RadioGroupItem } from './elements/RadioGroup';

const UNIT_OPTIONS: Record<string, string[]> = {
  length: ['mm', 'cm', 'm', 'km'],
  area: ['mm2', 'cm2', 'm2', 'km2'],
  volume: ['mm3', 'cm3', 'm3', 'km3'],
};

const SettingsDialog = () => {
  const activeSubTools = useBIMStore((s) => s.activeSubTools);
  const activeSubToolId = activeSubTools['measure'] || 'length';

  const measureUnit = useBIMStore((s) => s.measureUnit);
  const setMeasureUnit = useBIMStore((s) => s.setMeasureUnit);
  const measurePrecision = useBIMStore((s) => s.measurePrecision);
  const setMeasurePrecision = useBIMStore((s) => s.setMeasurePrecision);

  const currentUnitsList =
    UNIT_OPTIONS[activeSubToolId] || UNIT_OPTIONS['length'];

  const displayUnit = currentUnitsList.includes(measureUnit)
    ? measureUnit
    : currentUnitsList[0];

  return (
    <Dialog>
      <DialogTrigger
        render={<div className='inline-block' />}
        nativeButton={false}
      >
        <Button
          variant='ghost'
          size='icon'
          className='rounded-full text-bim-text-muted hover:text-bim-text-main'
          title='Settings'
        >
          <Settings className='w-5 h-5' />
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[360px] bg-bim-bg-panel/90 backdrop-blur-xl border-bim-border-light'>
        <DialogHeader>
          <DialogTitle className='text-lg font-semibold flex items-center gap-2'>
            <Settings className='w-5 h-5 text-bim-primary' />
            Application Settings
          </DialogTitle>
        </DialogHeader>

        <div className='flex flex-col gap-6 py-4'>
          {/* Unit Section */}
          <div className='flex flex-col gap-3'>
            <div className='flex flex-col'>
              <span className='text-sm font-semibold text-bim-text-main'>
                Measurement Unit
              </span>
              <span className='text-xs text-bim-text-muted'>
                Select the preferred unit for the active measurement tool.
              </span>
            </div>
            <div className='p-3 bg-bim-bg-item/40 rounded-xl border border-bim-border-light/50'>
              <RadioGroup
                className='grid grid-cols-4 gap-2'
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
          </div>

          {/* Precision Section */}
          <div className='flex flex-col gap-3'>
            <div className='flex flex-col'>
              <span className='text-sm font-semibold text-bim-text-main'>
                Precision
              </span>
              <span className='text-xs text-bim-text-muted'>
                Number of decimal places to display.
              </span>
            </div>
            <div className='p-3 bg-bim-bg-item/40 rounded-xl border border-bim-border-light/50'>
              <RadioGroup
                className='grid grid-cols-6 gap-2'
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
