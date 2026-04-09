import { Radio as RadioPrimitive } from '@base-ui/react/radio';
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group';

function RadioGroup({ className = '', ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot='radio-group'
      className={`grid w-full ${className}`}
      {...props}
    />
  );
}

function RadioGroupItem({
  className = '',
  children,
  ...props
}: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot='radio-group-item'
      className={`flex items-center justify-center transition-all cursor-pointer rounded-md text-[11px] font-medium py-1.5 
      text-bim-text-muted hover:text-bim-text-main hover:bg-bim-bg-item-hover
      data-checked:bg-bim-primary data-checked:text-white data-checked:shadow-md data-checked:shadow-bim-primary/20 
      focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-bim-primary
      disabled:opacity-50 disabled:cursor-not-allowed
      ${className}`}
      {...props}
    >
      {children}
    </RadioPrimitive.Root>
  );
}

export { RadioGroup, RadioGroupItem };
