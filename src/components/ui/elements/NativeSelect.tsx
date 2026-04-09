import { ChevronDownIcon } from 'lucide-react';

type NativeSelectProps = Omit<React.ComponentProps<'select'>, 'size'> & {
  size?: 'sm' | 'default';
};

function NativeSelect({
  className,
  size = 'default',
  ...props
}: NativeSelectProps) {
  return (
    <div
      className={`group/native-select relative w-fit has-[select:disabled]:opacity-50 ${className}`}
      data-slot='native-select-wrapper'
      data-size={size}
    >
      <select
        data-slot='native-select'
        data-size={size}
        className='h-8 w-full min-w-0 appearance-none rounded-lg border border-bim-border-main bg-bim-bg-item py-1 pr-8 pl-2.5 text-sm text-bim-text-main transition-colors outline-none select-none selection:bg-bim-primary selection:text-white placeholder:text-bim-text-muted focus-visible:border-bim-primary focus-visible:ring-2 focus-visible:ring-bim-primary/20 disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:border-red-400 aria-invalid:ring-3 aria-invalid:ring-red-400/20 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] data-[size=sm]:py-0.5 hover:bg-bim-bg-item-hover'
        {...props}
      />
      <ChevronDownIcon
        className='pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-bim-text-muted select-none group-hover/native-select:text-bim-text-main transition-colors'
        aria-hidden='true'
        data-slot='native-select-icon'
      />
    </div>
  );
}

function NativeSelectOption({
  className,
  ...props
}: React.ComponentProps<'option'>) {
  return (
    <option
      data-slot='native-select-option'
      className={`bg-bim-bg-item text-bim-text-main ${className || ''}`}
      {...props}
    />
  );
}

function NativeSelectOptGroup({
  className,
  ...props
}: React.ComponentProps<'optgroup'>) {
  return (
    <optgroup
      data-slot='native-select-optgroup'
      className={`bg-bim-bg-item text-bim-text-main font-semibold ${
        className || ''
      }`}
      {...props}
    />
  );
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
