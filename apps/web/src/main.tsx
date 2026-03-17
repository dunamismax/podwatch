import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

import { createQueryClient } from "@/lib/query";
import { getRouter } from "@/router";

const queryClient = createQueryClient();
const router = getRouter(queryClient);

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("The app root was not found.");
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
