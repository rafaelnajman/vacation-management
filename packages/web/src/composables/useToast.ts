import { useToast as primeUseToast } from 'primevue/usetoast';

export function useToast() {
  const toast = primeUseToast();
  return {
    success: (summary: string, detail?: string) =>
      toast.add({ severity: 'success', summary, detail, life: 3500 }),
    error: (summary: string, detail?: string) =>
      toast.add({ severity: 'error', summary, detail, life: 5000 }),
    apiError: (err: unknown, fallback = 'Something went wrong') => {
      const e = err as { response?: { data?: { error?: string } } };
      const msg = e.response?.data?.error ?? fallback;
      toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 });
    },
  };
}
