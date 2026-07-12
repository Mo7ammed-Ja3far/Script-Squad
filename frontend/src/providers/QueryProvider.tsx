import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import type { NormalizedError } from "@/services/api"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const e = error as NormalizedError
        // Don't retry on 401, 403, 404
        if (e?.status && [401, 403, 404].includes(e.status)) return false
        return failureCount < 2
      },
      staleTime: 1000 * 60 * 2,     // 2 min
      gcTime: 1000 * 60 * 10,        // 10 min
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

export { queryClient }

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
