import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, LoginRequest, RegisterRequest } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: string) => Promise<void>;
  isLoading: boolean;
  sessionId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(
    localStorage.getItem("sessionId")
  );
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    enabled: !!sessionId,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json();
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      localStorage.setItem("sessionId", data.sessionId);
      queryClient.setQueryData(["/api/auth/me"], data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      localStorage.setItem("sessionId", data.sessionId);
      queryClient.setQueryData(["/api/auth/me"], data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      setSessionId(null);
      localStorage.removeItem("sessionId");
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
    },
  });

  const switchRoleMutation = useMutation({
    mutationFn: async (currentRole: string) => {
      const response = await apiRequest("PUT", "/api/auth/role", { currentRole });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/consultants"] });
    },
  });

  // Set up authorization header
  useEffect(() => {
    if (sessionId) {
      // This is a simple way to add auth headers globally
      const originalFetch = window.fetch;
      window.fetch = function (url, options = {}) {
        const headers = new Headers(options.headers);
        headers.set("Authorization", `Bearer ${sessionId}`);
        return originalFetch(url, { ...options, headers });
      };
    }
  }, [sessionId]);

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        login: loginMutation.mutateAsync,
        register: registerMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
        switchRole: switchRoleMutation.mutateAsync,
        isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
        sessionId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
