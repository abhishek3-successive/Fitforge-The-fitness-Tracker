'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { LandingLayout } from '@/components/layout/LandingLayout';
import { Button, Card, CardContent, Typography, Box } from '@mui/material';
import Link from 'next/link';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null; // Will redirect to dashboard
  }

  return (
    <LandingLayout>
      <Box 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea30 0%, #764ba230 100%)',
        }}
      >
        <Box sx={{ px: { xs: 2, md: 6 }, maxWidth: 1200 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            {/* Hero Section */}
            <Box sx={{ mb: 6 }}>
              <Typography 
                variant="h2" 
                component="h1" 
                sx={{ 
                  fontWeight: 'bold', 
                  fontSize: { xs: '2rem', md: '4rem' },
                  mb: 2
                }}
              >
                Welcome to{" "}
                <Typography 
                  component="span" 
                  sx={{ 
                    color: 'primary.main',
                    fontSize: 'inherit'
                  }}
                >
                  FitForge
                </Typography>
              </Typography>
              <Typography 
                variant="h6" 
                color="text.secondary" 
                sx={{ maxWidth: 600, lineHeight: 1.6 }}
              >
                Transform your fitness journey with comprehensive tracking, 
                personalized workout plans, and a supportive community.
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 8 }}>
              <Link href="/auth/register" style={{ textDecoration: 'none' }}>
                <Button 
                  variant="contained" 
                  size="large"
                  sx={{ 
                    px: 4, 
                    py: 1.5,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    }
                  }}
                >
                  Get Started
                </Button>
              </Link>
              <Link href="/auth/login" style={{ textDecoration: 'none' }}>
                <Button 
                  variant="outlined" 
                  size="large"
                  sx={{ px: 4, py: 1.5 }}
                >
                  Sign In
                </Button>
              </Link>
            </Box>

            {/* Features */}
            <Box 
              sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(3, 1fr)'
                },
                gap: 3,
                maxWidth: 900 
              }}
            >
              <Card sx={{ height: '100%', boxShadow: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 2 }}>
                    Track Workouts
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Log your exercises, sets, reps, and track your progress over time.
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ height: '100%', boxShadow: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 2 }}>
                    Custom Plans
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create personalized workout plans tailored to your fitness goals.
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ height: '100%', boxShadow: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 2 }}>
                    Join Challenges
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Participate in fitness challenges and compete with the community.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      </Box>
    </LandingLayout>
  );
}
