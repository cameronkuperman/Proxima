import * as React from 'react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full px-4 py-3 text-white bg-white/[0.03] border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-white/[0.05] placeholder-gray-500 resize-vertical min-h-[100px] transition-all ${className}`}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'