'use client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

// No-op: Always allow access - no authentication needed for demo
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  return <>{children}</>;
}


