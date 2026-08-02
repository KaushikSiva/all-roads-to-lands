"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useMemo } from "react";

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://confident-tern-307.convex.cloud"
    : undefined);

export const isConvexConfigured = Boolean(convexUrl);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const client = useMemo(
    () => (convexUrl ? new ConvexReactClient(convexUrl) : null),
    [],
  );

  if (!client) return children;
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
