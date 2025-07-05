import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = {
  email: string;
  password: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        const res = await apiRequest("POST", "/api/login", credentials);
        return await res.json();
      } catch (error: any) {
        // Menangkap pesan error dari server dan melemparkannya kembali
        throw new Error(error.message || "Gagal masuk. Silakan coba lagi.");
      }
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Selamat Datang Kembali!",
        description: `Masuk sebagai ${user.fullName}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal Masuk",
        description: error.message || "Email atau kata sandi tidak valid.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      try {
        const res = await apiRequest("POST", "/api/register", credentials);
        return await res.json();
      } catch (error: any) {
        // Menangkap pesan error dari server dan melemparkannya kembali
        throw new Error(error.message || "Gagal mendaftar. Silakan coba lagi.");
      }
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Selamat Datang di Rangga Watu Bali!",
        description: `Akun berhasil dibuat untuk ${user.fullName}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Pendaftaran Gagal",
        description: error.message || "Terjadi kesalahan saat mendaftar. Silakan coba lagi.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      toast({
        title: "Berhasil Keluar",
        description: "Sampai jumpa kembali!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal Keluar",
        description: error.message || "Terjadi kesalahan saat keluar. Silakan coba lagi.",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
