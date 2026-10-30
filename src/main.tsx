import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@fontsource-variable/manrope";
import "./index.css";
import App from "./App.tsx";
import { ApiError } from "./lib/api";
import { handleApiError } from "./lib/session";
import { ToastProvider } from "./components/ui/Toast";

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: (err, query) => handleApiError(err, query.meta) }),
  mutationCache: new MutationCache({ onError: (err, _v, _c, mutation) => handleApiError(err, mutation.meta) }),
  defaultOptions: {
    queries: {
      // Error 4xx tidak di-retry (data memang salah / sesi berakhir)
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
      staleTime: 30_000,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
