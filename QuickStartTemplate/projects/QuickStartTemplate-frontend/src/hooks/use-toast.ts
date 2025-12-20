/**
 * Simple toast hook using notistack
 * Provides a toast function compatible with the component's usage
 */

import { useSnackbar, VariantType } from 'notistack'

export interface ToastOptions {
  title: string
  description: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const { enqueueSnackbar } = useSnackbar()

  const toast = (options: ToastOptions) => {
    const { title, description, variant } = options
    const message = `${title}: ${description}`
    
    let snackbarVariant: VariantType = 'default'
    if (variant === 'destructive') {
      snackbarVariant = 'error'
    } else {
      snackbarVariant = 'info'
    }
    
    enqueueSnackbar(message, { variant: snackbarVariant })
  }

  return { toast }
}
