import * as React from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className = '', variant = 'default', size = 'default', ...props },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer';

    const variants = {
      default: 'bg-blue-600 text-white shadow hover:bg-blue-500',
      destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-500',
      outline:
        'border border-slate-700 bg-transparent shadow-sm hover:bg-slate-800 hover:text-slate-100 text-slate-400',
      secondary: 'bg-slate-800 text-slate-100 shadow-sm hover:bg-slate-700',
      ghost: 'hover:bg-slate-800 hover:text-slate-100 text-slate-400',
      link: 'text-blue-400 underline-offset-4 hover:underline',
    };

    const sizes = {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-10 rounded-md px-8',
      icon: 'h-9 w-9',
    };

    const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    return <button className={combinedClassName} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button };
