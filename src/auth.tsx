import { authEvents, http } from "@company/hr-common-api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import type { CurrentUser } from "./types";

const fallbackUser: CurrentUser = {
  id: "demo",
  name: "\uD64D\uAE38\uB3D9",
  roles: ["HR_ADMIN"],
  permissions: [
    "EMPLOYEE_READ",
    "EMPLOYEE_CREATE",
    "EMPLOYEE_DELETE",
    "ORG_READ",
    "ORG_CREATE",
    "ORG_MOVE",
    "EVALUATION_READ",
    "EVALUATION_SAVE",
    "EVALUATION_SUBMIT",
    "ATTENDANCE_READ",
    "ATTENDANCE_REQUEST",
    "VACATION_REQUEST",
  ],
};

const AuthContext = createContext<ReturnType<typeof createAuthValue> | null>(null);

function createAuthValue(user: CurrentUser | undefined, logout: () => void) {
  const currentUser = user ?? fallbackUser;
  return {
    user: currentUser,
    isAuthenticated: Boolean(currentUser),
    logout,
    hasPermission: (permission: string) => currentUser.permissions.includes(permission),
    hasAnyPermission: (permissions: string[]) =>
      permissions.some((permission) => currentUser.permissions.includes(permission)),
    hasRole: (role: string) => currentUser.roles.includes(role),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data } = useCurrentUser();
  const logout = () => {
    void http.post("/auth/logout").finally(() => {
      queryClient.clear();
      window.location.assign("/");
    });
  };

  useEffect(() => {
    const handleUnauthorized = () => queryClient.invalidateQueries({ queryKey: ["auth", "current-user"] });
    authEvents.addEventListener("unauthorized", handleUnauthorized);
    return () => authEvents.removeEventListener("unauthorized", handleUnauthorized);
  }, [queryClient]);

  const value = useMemo(() => createAuthValue(data, logout), [data]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "current-user"],
    queryFn: () => http.get<CurrentUser>("/auth/me"),
    staleTime: 60_000,
    retry: false,
    placeholderData: fallbackUser,
  });
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is required");
  return value;
}

export function usePermission() {
  const auth = useAuth();
  return {
    hasPermission: auth.hasPermission,
    hasAnyPermission: auth.hasAnyPermission,
    hasRole: auth.hasRole,
  };
}

export function hasPermission(user: CurrentUser, permission: string) {
  return user.permissions.includes(permission);
}

export function hasAnyPermission(user: CurrentUser, permissions: string[]) {
  return permissions.some((permission) => user.permissions.includes(permission));
}

export function hasRole(user: CurrentUser, role: string) {
  return user.roles.includes(role);
}

export function logout() {
  return http.post("/auth/logout");
}
