import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthService } from '@/external-api';
import { useAuthStore } from '@/lib/auth-store';
import { LoginCredentials, RegisterData } from '@/lib/types';

// Query Keys
export const authKeys = {
  currentUser: ['auth', 'currentUser'],
} as const;

// Main useAuth hook
export const useAuth = () => {
  const { user, isAuthenticated, logout: logoutStore } = useAuthStore();
  const queryClient = useQueryClient();

  const logout = () => {
    logoutStore();
    queryClient.removeQueries({ queryKey: authKeys.currentUser });
    queryClient.clear();
  };

  return {
    user,
    isAuthenticated,
    logout,
  };
};

// Current User Query
export const useCurrentUser = () => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: authKeys.currentUser,
    queryFn: AuthService.getCurrentUser,
    enabled: isAuthenticated,
    retry: false,
  });
};

// Login Mutation
export const useLogin = () => {
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => AuthService.login(credentials),
    onSuccess: (data) => {
      login(data.user, data.tokens);
      queryClient.setQueryData(authKeys.currentUser, data.user);
    },
  });
};

// Register Mutation
export const useRegister = () => {
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: RegisterData) => AuthService.register(userData),
    onSuccess: (data) => {
      login(data.user, data.tokens);
      queryClient.setQueryData(authKeys.currentUser, data.user);
    },
  });
};

// Logout Mutation
export const useLogout = () => {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: AuthService.logout,
    onSuccess: () => {
      logout();
      queryClient.removeQueries({ queryKey: authKeys.currentUser });
      queryClient.clear(); // Clear all cached data on logout
    },
    onError: () => {
      // Even if server logout fails, clear local data
      logout();
      queryClient.removeQueries({ queryKey: authKeys.currentUser });
      queryClient.clear();
    },
  });
};
