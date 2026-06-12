import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "./components/Layout/Layout";
import { HomePage } from "./pages/Home";
import { StudyPage } from "./pages/Study";
import { SearchPage } from "./pages/Search";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
          </Route>
          <Route path="/study" element={<StudyPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
