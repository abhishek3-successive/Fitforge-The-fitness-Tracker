"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Paper,
  Avatar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  MenuBook as MenuBookIcon,
  CameraAlt as CameraAltIcon,
  Group as GroupIcon,
  FitnessCenter as FitnessCenterIcon,
  Timeline as TimelineIcon,
  EmojiEvents as EmojiEventsIcon,
  Assignment as AssignmentIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { MaterialAppLayout } from "@/components/layout/MaterialAppLayout";
import { UserService, WorkoutSessionService } from "@/external-api";
import { useAuthStore } from "@/lib/auth-store";
import Link from "next/link";

interface QuickAction {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  path: string;
}

const quickActions: QuickAction[] = [
  {
    title: "Start Workout",
    subtitle: "Begin your training session",
    icon: PlayArrowIcon,
    color: '#10B981',
    path: "/workouts/active"
  },
  {
    title: "Exercise Library",
    subtitle: "Browse 500+ exercises",
    icon: MenuBookIcon,
    color: '#3B82F6',
    path: "/exercises"
  },
  {
    title: "Progress Photos",
    subtitle: "Track your transformation",
    icon: CameraAltIcon,
    color: '#F59E0B',
    path: "/progress/photos"
  },
  {
    title: "Join Challenge",
    subtitle: "Compete with others",
    icon: GroupIcon,
    color: '#8B5CF6',
    path: "/challenges"
  }
];

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration to avoid SSR mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Check authentication on mount
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      console.log('User not authenticated, showing login prompt');
    }
  }, [isAuthenticated, isHydrated]);

  // Fetch user stats - only if authenticated
  const { data: userStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => UserService.getUserStats(),
    refetchInterval: 5 * 60 * 1000,
    enabled: isHydrated && isAuthenticated, // Only run query if hydrated and user is authenticated
  });

  // Fetch recent workout sessions - only if authenticated
  const { data: workoutSessions, isLoading: sessionsLoading, error: sessionsError } = useQuery({
    queryKey: ['workout-sessions'],
    queryFn: () => WorkoutSessionService.getWorkoutSessions({ limit: 5, status: 'completed' }),
    refetchInterval: 5 * 60 * 1000,
    enabled: isHydrated && isAuthenticated, // Only run query if hydrated and user is authenticated
  });

  const stats = [
    {
      label: "Total Workouts",
      value: userStats?.totalWorkouts?.toString() || "0",
      icon: FitnessCenterIcon,
      color: '#10B981',
      progress: Math.min((userStats?.totalWorkouts || 0) / 10 * 100, 100)
    },
    {
      label: "Current Streak",
      value: `${userStats?.currentStreak || 0} days`,
      icon: EmojiEventsIcon,
      color: '#F59E0B',
      progress: Math.min((userStats?.currentStreak || 0) / 30 * 100, 100)
    },
    {
      label: "Exercises Done",
      value: userStats?.totalExercises?.toString() || "0",
      icon: AssignmentIcon,
      color: '#3B82F6',
      progress: Math.min((userStats?.totalExercises || 0) / 50 * 100, 100)
    },
    {
      label: "Avg Duration",
      value: `${userStats?.averageWorkoutDuration ? Math.round(userStats.averageWorkoutDuration) : 0} min`,
      icon: TimelineIcon,
      color: '#8B5CF6',
      progress: Math.min((userStats?.averageWorkoutDuration || 0) / 60 * 100, 100)
    }
  ];

  const latestWorkout = workoutSessions?.data?.[0];

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <MaterialAppLayout>
        <Box sx={{ maxWidth: '1200px', mx: 'auto', textAlign: 'center', mt: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading...
          </Typography>
        </Box>
      </MaterialAppLayout>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <MaterialAppLayout>
        <Box sx={{ maxWidth: '800px', mx: 'auto', mt: 4 }}>
          <Alert 
            severity="info" 
            sx={{ mb: 4 }}
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  component={Link}
                  href="/auth/login"
                  size="small" 
                  variant="outlined"
                >
                  Login
                </Button>
                <Button 
                  component={Link}
                  href="/auth/register"
                  size="small" 
                  variant="contained"
                >
                  Register
                </Button>
              </Box>
            }
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              Welcome to FitForge! 🏋️‍♂️
            </Typography>
            <Typography variant="body2">
              Please log in or create an account to view your personalized dashboard with workout stats, progress tracking, and more.
            </Typography>
          </Alert>

          {/* Demo Hero Section for Unauthenticated Users */}
          <Paper 
            sx={{ 
              p: 4, 
              mb: 4, 
              background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
              color: 'white',
              textAlign: 'center'
            }}
          >
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
              Transform Your Fitness Journey
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Track workouts, monitor progress, and achieve your fitness goals with FitForge.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                component={Link}
                href="/auth/register"
                variant="contained" 
                size="large"
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                }}
              >
                Get Started Free
              </Button>
              <Button 
                component={Link}
                href="/auth/login"
                variant="outlined" 
                size="large"
                sx={{ 
                  borderColor: 'white', 
                  color: 'white',
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                Sign In
              </Button>
            </Box>
          </Paper>

          {/* Demo Features */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Avatar sx={{ bgcolor: '#10B981', width: 64, height: 64, mb: 2, mx: 'auto' }}>
                    <FitnessCenterIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Track Workouts
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Log your exercises, sets, and reps with our comprehensive workout tracker.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Avatar sx={{ bgcolor: '#F59E0B', width: 64, height: 64, mb: 2, mx: 'auto' }}>
                    <TimelineIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Monitor Progress
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Visualize your fitness journey with detailed stats and progress charts.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Avatar sx={{ bgcolor: '#8B5CF6', width: 64, height: 64, mb: 2, mx: 'auto' }}>
                    <EmojiEventsIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Achieve Goals
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Set and reach your fitness milestones with personalized workout plans.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </MaterialAppLayout>
    );
  }

  return (
    <MaterialAppLayout>
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        {/* Welcome Message for Authenticated Users */}
        {user && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body1">
              Welcome back, <strong>{user.username}</strong>! Here's your fitness overview.
            </Typography>
          </Alert>
        )}

        {/* Show error alerts if API calls fail */}
        {(statsError || sessionsError) && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Having trouble loading your data. Please check your connection and try refreshing the page.
            </Typography>
          </Alert>
        )}

        {/* Hero Section */}
        <Paper 
          sx={{ 
            p: 4, 
            mb: 4, 
            background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
              Welcome to FitForge{user ? `, ${user.username}` : ''}
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Transform your fitness journey with personalized workouts and progress tracking.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button 
                variant="outlined" 
                size="large"
                startIcon={<MenuBookIcon />}
                sx={{ 
                  borderColor: 'white', 
                  color: 'white',
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                }}
                component={Link}
                href="/exercises"
              >
                Browse Exercises
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Avatar sx={{ bgcolor: stat.color, width: 48, height: 48 }}>
                        <Icon />
                      </Avatar>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: stat.color }}>
                        {statsLoading ? "..." : stat.value}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {stat.label}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={stat.progress} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: stat.color
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Quick Actions */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={3}>
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                  <Card 
                    component={Link}
                    href={action.path}
                    sx={{ 
                      height: '100%',
                      textDecoration: 'none',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      }
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: action.color, 
                          width: 64, 
                          height: 64, 
                          mb: 2,
                          mx: 'auto'
                        }}
                      >
                        <Icon sx={{ fontSize: 32 }} />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {action.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {action.subtitle}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* Recent Activity */}
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
          Recent Activity
        </Typography>
        <Grid container spacing={3}>
          {/* Progress Summary */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <TimelineIcon sx={{ color: 'secondary.main', mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Progress Summary
                  </Typography>
                </Box>

                {statsLoading ? (
                  <Box sx={{ py: 4 }}>
                    {[1, 2, 3].map((i) => (
                      <Box key={i} sx={{ mb: 3 }}>
                        <LinearProgress sx={{ mb: 1 }} />
                        <LinearProgress sx={{ height: 8 }} />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ space: 3 }}>
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Total Workouts</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {userStats?.totalWorkouts || 0}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min((userStats?.totalWorkouts || 0) / 10 * 100, 100)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Current Streak</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {userStats?.currentStreak || 0} days
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min((userStats?.currentStreak || 0) / 30 * 100, 100)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Account Age</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {userStats?.accountAge || 0} days
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min((userStats?.accountAge || 0) / 365 * 100, 100)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MaterialAppLayout>
  );
}
