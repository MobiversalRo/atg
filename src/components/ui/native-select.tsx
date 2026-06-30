import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * A native <select> styled to match the input components. Used for enum
 * dropdowns — it integrates trivially with react-hook-form and gives a
 * touch-friendly native picker on the tablets/phones used in the field.
 */
export function NativeSelect({
  className,
  ...props
}: React.ComponentProps<'select'>) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        'h-9 w-full min-w-0 truncate rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
