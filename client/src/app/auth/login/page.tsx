"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Dumbbell, Mail, Lock } from "lucide-react";
import { 
  Button, 
  TextField, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Alert, 
  IconButton, 
  InputAdornment,
  CircularProgress
} from "@mui/material";
import { AuthService } from "@/external-api";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const loginMutation = useMutation({
    mutationFn: AuthService.login,
    onSuccess: (data) => {
      // Ensure we have valid user and tokens before logging in
      if (data.user && data.tokens) {
        login(data.user, data.tokens);
        toast.success("Welcome back!");
        router.push("/dashboard");
      } else {
        toast.error("Login failed: Invalid response from server");
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      
      // Handle specific error cases
      const errorMessage = error?.message || "Login failed. Please try again.";
      
      // Check if it's a 401 unauthorized error
      if (error?.response?.status === 401 || errorMessage.toLowerCase().includes('invalid')) {
        toast.error("Invalid email or password. Please check your credentials.");
      } else if (error?.response?.status === 429) {
        toast.error("Too many login attempts. Please try again later.");
      } else if (error?.response?.status >= 500) {
        toast.error("Server error. Please try again later.");
      } else {
        toast.error(errorMessage);
      }
      
      // Clear any existing auth data on login failure
      const { logout } = useAuthStore.getState();
      logout();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        p: 2
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        {/* Logo and Branding */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box 
              sx={{ 
                width: 64, 
                height: 64, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 3
              }}
            >
              <Dumbbell style={{ width: 32, height: 32, color: 'white' }} />
            </Box>
          </Box>
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            FitForge
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to continue your fitness journey
          </Typography>
        </Box>

        {/* Login Form */}
        <Card sx={{ boxShadow: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h4" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
                Welcome back
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter your credentials to access your account
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              {/* Error Alert */}
              {loginMutation.error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {(loginMutation.error as any)?.message || "Login failed. Please try again."}
                </Alert>
              )}

              {/* Email Field */}
              <TextField
                fullWidth
                id="email"
                name="email"
                type="email"
                label="Email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                disabled={loginMutation.isPending}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail style={{ width: 20, height: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Password Field */}
              <TextField
                fullWidth
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                label="Password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                disabled={loginMutation.isPending}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock style={{ width: 20, height: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <EyeOff style={{ width: 20, height: 20 }} /> : <Eye style={{ width: 20, height: 20 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Forgot Password Link */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Link 
                  href="/auth/forgot-password" 
                  style={{ textDecoration: 'none', color: '#667eea', fontSize: '14px' }}
                >
                  Forgot password?
                </Link>
              </Box>

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loginMutation.isPending}
                sx={{
                  height: 48,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontSize: '18px',
                  fontWeight: 600,
                  mb: 3,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  }
                }}
              >
                {loginMutation.isPending ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                    Signing in...
                  </Box>
                ) : (
                  "Sign in"
                )}
              </Button>

              {/* Divider */}
              <Box sx={{ position: 'relative', mb: 3 }}>
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: 0, 
                    right: 0, 
                    height: '1px', 
                    backgroundColor: 'divider' 
                  }} 
                />
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      backgroundColor: 'background.paper', 
                      px: 2, 
                      textTransform: 'uppercase',
                      color: 'text.secondary'
                    }}
                  >
                    Don't have an account?
                  </Typography>
                </Box>
              </Box>

              {/* Sign Up Link */}
              <Link href="/auth/register" style={{ textDecoration: 'none' }}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  sx={{ height: 48, fontSize: '18px' }}
                >
                  Create an account
                </Button>
              </Link>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            By signing in, you agree to our{" "}
            <Link href="/terms" style={{ color: '#667eea' }}>
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" style={{ color: '#667eea' }}>
              Privacy Policy
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}