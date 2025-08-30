'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Button, 
  TextField, 
  Card, 
  CardContent, 
  Typography, 
  Box,
  CircularProgress
} from '@mui/material';
import { AuthService } from '@/external-api';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';
import Link from 'next/link';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    
    try {
      // Prepare registration data (remove confirmPassword for API)
      const registrationData = {
        username: data.username,
        email: data.email,
        password: data.password
      };
      
      const response = await AuthService.register(registrationData);
      
      login(response.user, response.tokens);
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
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
      <Card sx={{ width: '100%', maxWidth: 400, boxShadow: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
              Create Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Join FitForge and start your fitness journey
            </Typography>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              {...register('username')}
              fullWidth
              label="Username"
              placeholder="Choose a username"
              disabled={isLoading}
              error={!!errors.username}
              helperText={errors.username?.message}
              sx={{ mb: 2 }}
            />

            <TextField
              {...register('email')}
              fullWidth
              type="email"
              label="Email"
              placeholder="Enter your email"
              disabled={isLoading}
              error={!!errors.email}
              helperText={errors.email?.message}
              sx={{ mb: 2 }}
            />

            <TextField
              {...register('password')}
              fullWidth
              type="password"
              label="Password"
              placeholder="Create a password"
              disabled={isLoading}
              error={!!errors.password}
              helperText={errors.password?.message}
              sx={{ mb: 2 }}
            />

            <TextField
              {...register('confirmPassword')}
              fullWidth
              type="password"
              label="Confirm Password"
              placeholder="Confirm your password"
              disabled={isLoading}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{
                height: 48,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '16px',
                fontWeight: 600,
                mb: 3,
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                }
              }}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} sx={{ color: 'white' }} />
                  Creating Account...
                </Box>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" component="span">
              Already have an account?{' '}
            </Typography>
            <Link
              href="/auth/login"
              style={{ 
                textDecoration: 'none', 
                color: '#667eea', 
                fontWeight: 500 
              }}
            >
              Sign In
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
