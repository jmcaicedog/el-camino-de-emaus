'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'

export function Toaster() {
  const { toasts } = useToast()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // refs map to access each toast DOM node and force styles when necessary
  const refs = React.useRef(new Map<string | number, HTMLElement | null>())

  React.useEffect(() => {
    // After each update, force color with !important on destructive toasts
    for (const toast of toasts) {
      const el = refs.current.get(toast.id)
      if (el && (toast as any).variant === 'destructive') {
        // Apply important to override external styles. Use a hard-coded
        // accessible color (#fff) because in some environments the CSS
        // variable may be overridden or not resolving as expected.
        try {
          el.style.setProperty('color', '#fff', 'important')
          el.style.setProperty('fill', '#fff', 'important')
          el.style.setProperty('stroke', '#fff', 'important')
        } catch (e) {
          // ignore
        }
      }
    }
  }, [toasts])

  const content = (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // Force color inline for destructive toasts to avoid being overridden
        // by external rules with equal or greater specificity (e.g. .grid.gap-1).
        const wrapperStyle =
          props.variant === 'destructive'
            ? { color: 'var(--destructive-foreground)' }
            : undefined

        const titleDescStyle = wrapperStyle

        // If action is a React element, clone it and merge inline style to force color
        const clonedAction = React.isValidElement(action)
          ? React.cloneElement(action as React.ReactElement, {
              style: {
                ...(action as any).props?.style,
                ...(props.variant === 'destructive'
                  ? { color: 'var(--destructive-foreground)' }
                  : undefined),
              },
            })
          : action

        return (
          <Toast
            key={id}
            {...props}
            ref={(node: HTMLElement | null) => refs.current.set(id, node)}
          >
            <div className="grid gap-1" style={wrapperStyle}>
              {title && <ToastTitle style={titleDescStyle}>{title}</ToastTitle>}
              {description && (
                <ToastDescription style={titleDescStyle}>{description}</ToastDescription>
              )}
            </div>
            {clonedAction}
            <ToastClose style={props.variant === 'destructive' ? { color: 'var(--destructive-foreground)' } : undefined} />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )

  if (!mounted) return null

  // Render into document.body to guarantee toasts are outside app containers
  return createPortal(content, document.body)
}
