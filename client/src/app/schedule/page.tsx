'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
} from '@mui/material';
import {
  Add as AddIcon,
  CalendarToday as CalendarIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  FitnessCenter as FitnessCenterIcon,
  AccessTime as AccessTimeIcon,
  Today as TodayIcon,
  EventNote as EventNoteIcon,
  DateRange as DateRangeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { MaterialAppLayout } from '@/components/layout/MaterialAppLayout';
import { WorkoutSessionService, WorkoutPlanService } from '@/external-api';
import { WorkoutSession, WorkoutPlan } from '@/lib/types';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/auth-store';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`schedule-tabpanel-${index}`}
      aria-labelledby={`schedule-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SchedulePage() {
  const { user, isAuthenticated } = useAuthStore();
  
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState<string>('08:00');
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Sessions' },
    { value: 'planned', label: 'Planned' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  // Fetch workout sessions and plans
  useEffect(() => {
    // Always try to fetch workout plans (will fallback to public plans if needed)
    fetchWorkoutPlans();
    
    if (isAuthenticated && user?._id) {
      fetchWorkoutSessions();
    } else {
      setIsLoading(false);
    }
  }, [selectedStatus, user, isAuthenticated]);

  const fetchWorkoutSessions = async () => {
    try {
      setIsLoading(true);
      const filters: any = {
        userId: user?._id,
        limit: 50,
      };
      
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus;
      }
      
      const response = await WorkoutSessionService.getWorkoutSessions(filters);
      setWorkoutSessions(response.data || []);
    } catch (error) {
      toast.error('Failed to load workout sessions');
      setWorkoutSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkoutPlans = async () => {
    try {
      setIsLoadingPlans(true);
      
      let response;
      let source = 'unknown';
      
      // Strategy 1: If user is authenticated, try user-specific plans first
      if (user?._id && isAuthenticated) {
        try {
          console.log('� Strategy 1: Trying user-specific plans for userId:', user._id);
          response = await WorkoutPlanService.getUserWorkoutPlans(user._id);
          source = 'user-specific';
          console.log('✅ User-specific workout plans response:', response);
          
          if (response.data && response.data.length > 0) {
            console.log('🎉 Found user-specific plans:', response.data.length);
          } else {
            console.log('📭 No user-specific plans found, trying public plans...');
            throw new Error('No user plans found');
          }
        } catch (userError) {
          console.warn('⚠️ User-specific plans failed:', userError);
          // Fall through to public plans
        }
      }
      
      // Strategy 2: If no user plans or not authenticated, get public plans
      if (!response || !response.data || response.data.length === 0) {
        console.log('🌐 Strategy 2: Fetching public workout plans...');
        try {
          response = await WorkoutPlanService.getWorkoutPlans({ 
            limit: 20, 
            isPublic: true 
          });
          source = 'public';
          console.log('✅ Public workout plans response:', response);
        } catch (publicError) {
          console.error('❌ Public plans also failed:', publicError);
          // Strategy 3: Try without any filters as last resort
          console.log('🆘 Strategy 3: Trying all plans without filters...');
          response = await WorkoutPlanService.getWorkoutPlans({ limit: 20 });
          source = 'all-plans';
          console.log('✅ All plans response:', response);
        }
      }
      console.log('✅ Workout plans response:', response);
      console.log('📊 Workout plans data:', response.data);
      console.log('📈 Workout plans length:', response.data?.length || 0);
      
      // Debug each plan
      if (response.data && response.data.length > 0) {
        response.data.forEach((plan, index) => {
          console.log(`📋 Plan ${index + 1}:`, {
            id: plan._id,
            name: plan.name,
            title: plan.title,
            exercises: plan.exercises?.length || 0
          });
        });
      } else {
        console.warn('⚠️ No workout plans found or empty response');
      }
      
      setWorkoutPlans(response.data || []);
      console.log('� Set workoutPlans state to:', response.data || []);
      
      // Also check what React will render
      setTimeout(() => {
        console.log('⏰ Delayed check - workoutPlans in state:', workoutPlans.length);
      }, 100);
    } catch (error) {
      console.error('❌ Failed to fetch workout plans:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to load workout plans: ${errorMessage}`);
      setWorkoutPlans([]);
      
      // Show specific guidance based on the error
      if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        toast.error('Please sign in to access your workout plans');
      } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        toast.info('No workout plans found. Create your first workout plan!');
      }
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const handleStartSession = async (sessionId: string) => {
    try {
      await WorkoutSessionService.startWorkoutSession(sessionId);
      toast.success('Workout session started!');
      fetchWorkoutSessions();
    } catch (error) {
      toast.error('Failed to start workout session');
    }
  };

  const handleCompleteSession = async (sessionId: string) => {
    try {
      await WorkoutSessionService.completeWorkoutSession(sessionId);
      toast.success('Workout session completed!');
      fetchWorkoutSessions();
    } catch (error) {
      toast.error('Failed to complete workout session');
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    try {
      await WorkoutSessionService.cancelWorkoutSession(sessionId);
      toast.success('Workout session cancelled');
      fetchWorkoutSessions();
    } catch (error) {
      toast.error('Failed to cancel workout session');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await WorkoutSessionService.deleteWorkoutSession(sessionId);
      toast.success('Workout session deleted');
      fetchWorkoutSessions();
    } catch (error) {
      toast.error('Failed to delete workout session');
    }
  };

  const handleCreateSession = async () => {
    if (!selectedPlan) {
      toast.error('Please select a workout plan');
      return;
    }

    if (!user?._id) {
      toast.error('User authentication required');
      return;
    }

    try {
      setIsCreatingSession(true);
      console.log('🏗️ Starting workout session creation...', {
        selectedPlan,
        scheduledDate,
        scheduledTime,
        userId: user._id
      });

      const plan = workoutPlans.find(p => p._id === selectedPlan);
      if (!plan) {
        toast.error('Selected workout plan not found');
        return;
      }

      console.log('📋 Found selected plan:', {
        id: plan._id,
        title: plan.title,
        name: plan.name,
        exercises: plan.exercises?.length,
        workoutDays: plan.workoutDays?.length
      });

      const startTime = new Date(`${scheduledDate}T${scheduledTime}`);
      
      // Extract exercises from workout plan - handle both flat exercises and workoutDays structure
      let planExercises: any[] = [];
      if (plan.exercises && plan.exercises.length > 0) {
        // Flat exercises structure
        planExercises = plan.exercises;
        console.log('📚 Using flat exercises structure:', planExercises.length);
      } else if (plan.workoutDays && plan.workoutDays.length > 0) {
        // WorkoutDays structure - combine all exercises from all days
        planExercises = plan.workoutDays.flatMap(day => day.exercises || []);
        console.log('📚 Using workoutDays structure:', plan.workoutDays.length, 'days,', planExercises.length, 'total exercises');
      }

      if (planExercises.length === 0) {
        toast.error('No exercises found in the selected workout plan');
        console.error('❌ No exercises found in plan:', plan);
        return;
      }

      console.log('📋 Creating session with plan exercises:', planExercises);
      
      // Convert to backend-compatible session exercises (using any type for flexibility)
      const sessionData: any = {
        userId: user._id,
        workoutPlanId: selectedPlan,
        title: `Scheduled: ${plan.title || plan.name}`,
        exercises: planExercises.map((planEx, index) => {
          console.log(`🏋️ Processing exercise ${index + 1}:`, planEx);
          
          const completedSets = [];
          const numSets = planEx.sets || 3;
          
          // Create completed sets structure for backend
          for (let i = 0; i < numSets; i++) {
            completedSets.push({
              setNumber: i + 1,
              reps: planEx.reps || 0,
              weight: planEx.weight || undefined,
              duration: planEx.duration || undefined,
              completed: false,
              restDuration: planEx.restBetweenSets || 60,
            });
          }

          return {
            exercise: planEx.exercise._id || planEx.exercise, // Handle both populated and non-populated
            plannedSets: numSets,
            completedSets: completedSets,
            notes: planEx.notes || '',
          };
        }),
        notes: `Scheduled workout from plan: ${plan.title || plan.name}`,
        status: 'planned' as const,
        startTime: startTime.toISOString(),
      };

      console.log('📤 Creating workout session with data:', sessionData);
      
      await WorkoutSessionService.createWorkoutSession(sessionData);

      toast.success(`Workout session scheduled: ${plan.title || plan.name}`);
      setCreateDialogOpen(false);
      setSelectedPlan('');
      fetchWorkoutSessions();
      
      console.log('✅ Workout session created successfully');
      
    } catch (error) {
      console.error('❌ Failed to schedule workout session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to schedule workout session: ${errorMessage}`);
      
      // Show more specific error guidance
      if (errorMessage.includes('500') || errorMessage.includes('Internal server error')) {
        toast.error('Server error. Please check if the backend is running properly.');
      } else if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        toast.error('Authentication error. Please sign in again.');
      } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        toast.error('Workout plan or user not found. Please refresh and try again.');
      }
    } finally {
      setIsCreatingSession(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'info';
      case 'in-progress': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned': return <ScheduleIcon />;
      case 'in-progress': return <PlayArrowIcon />;
      case 'completed': return <CheckCircleIcon />;
      case 'cancelled': return <CancelIcon />;
      default: return <EventNoteIcon />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTodaysSessions = () => {
    const today = new Date().toDateString();
    return (workoutSessions || []).filter(session => 
      new Date(session.createdAt).toDateString() === today
    );
  };

  const getUpcomingSessions = () => {
    const now = new Date();
    return (workoutSessions || []).filter(session => 
      session.status === 'planned' && new Date(session.createdAt) > now
    );
  };

  const getRecentSessions = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return (workoutSessions || []).filter(session => 
      session.status === 'completed' && new Date(session.createdAt) >= sevenDaysAgo
    ).slice(0, 5);
  };

  if (isLoading) {
    return (
      <MaterialAppLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading schedule...
            </Typography>
          </Box>
        </Box>
      </MaterialAppLayout>
    );
  }

  return (
    <MaterialAppLayout>
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Workout Schedule
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => {
              console.log('🎯 Schedule Workout button clicked', {
                isAuthenticated,
                user: user?._id,
                workoutPlansCount: workoutPlans.length
              });
              if (!isAuthenticated && workoutPlans.length > 0) {
                toast.warning('Sign in to schedule workouts from public plans');
                return;
              }
              if (!isAuthenticated) {
                toast.warning('Please sign in to schedule workouts');
                return;
              }
              if (!user?._id) {
                toast.warning('User information not available. Please refresh and try again.');
                return;
              }
              if (workoutPlans.length === 0) {
                toast.info('No workout plans available. Please create a workout plan first.');
                return;
              }
              setCreateDialogOpen(true);
            }}
            disabled={!isAuthenticated && workoutPlans.length === 0}
            sx={{ 
              background: 'linear-gradient(135deg, #10B981, #3B82F6)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669, #2563EB)',
              },
              '&:disabled': {
                background: '#ccc',
              }
            }}
          >
            Schedule Workout
          </Button>
        </Box>

        {/* Auth Warning */}
        {!isAuthenticated && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              You need to <strong>sign in</strong> to view and manage your workout schedule.
            </Typography>
          </Alert>
        )}

        {/* No Workout Plans Warning */}
        {isAuthenticated && workoutPlans.length === 0 && !isLoadingPlans && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              No workout plans found. <strong>Create your first workout plan</strong> to start scheduling workouts, or check if the backend server is running properly.
            </Typography>
          </Alert>
        )}

        {/* Workout Plans Status */}
        {workoutPlans.length > 0 && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>{workoutPlans.length} workout plan(s) available</strong> for scheduling. Click "Schedule Workout" to create a session.
            </Typography>
          </Alert>
        )}

        {/* Loading Plans Status */}
        {isLoadingPlans && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={20} sx={{ mr: 2 }} />
              <Typography variant="body2">
                Loading workout plans...
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TodayIcon sx={{ mr: 1 }} />
                  Today
                  <Badge 
                    badgeContent={getTodaysSessions().length} 
                    color="primary" 
                    sx={{ ml: 1 }}
                  />
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DateRangeIcon sx={{ mr: 1 }} />
                  Upcoming
                  <Badge 
                    badgeContent={getUpcomingSessions().length} 
                    color="info" 
                    sx={{ ml: 1 }}
                  />
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon sx={{ mr: 1 }} />
                  All Sessions
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon sx={{ mr: 1 }} />
                  History
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          {/* Today's Sessions */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <TodayIcon sx={{ mr: 1 }} />
              Today's Workouts ({getTodaysSessions().length})
            </Typography>
            {getTodaysSessions().length > 0 ? (
              <Grid container spacing={3}>
                {getTodaysSessions().map((session) => (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={session._id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {session.workoutPlan?.name || 'Custom Workout'}
                          </Typography>
                          <Chip
                            icon={getStatusIcon(session.status)}
                            label={session.status}
                            color={getStatusColor(session.status) as any}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {formatTime(session.createdAt)} • {session.exercises?.length || 0} exercises
                        </Typography>
                        {session.duration && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <AccessTimeIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {session.duration} minutes
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small"
                              onClick={() => {
                                setSelectedSession(session);
                                setDialogOpen(true);
                              }}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small"
                              onClick={() => handleDeleteSession(session._id)}
                              disabled={session.status === 'in-progress'}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        {session.status === 'planned' && (
                          <Button 
                            variant="contained"
                            size="small"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => handleStartSession(session._id)}
                            sx={{ 
                              background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #059669, #2563EB)',
                              }
                            }}
                          >
                            Start
                          </Button>
                        )}
                        {session.status === 'in-progress' && (
                          <Button 
                            variant="contained"
                            size="small"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleCompleteSession(session._id)}
                            color="success"
                          >
                            Complete
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info" sx={{ mb: 3 }}>
                No workouts scheduled for today. Click "Schedule Workout" to plan your session!
              </Alert>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Upcoming Sessions */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <DateRangeIcon sx={{ mr: 1 }} />
              Upcoming Workouts ({getUpcomingSessions().length})
            </Typography>
            {getUpcomingSessions().length > 0 ? (
              <Grid container spacing={3}>
                {getUpcomingSessions().map((session) => (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={session._id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {session.workoutPlan?.name || 'Custom Workout'}
                          </Typography>
                          <Chip
                            icon={getStatusIcon(session.status)}
                            label={session.status}
                            color={getStatusColor(session.status) as any}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {formatDate(session.createdAt)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {formatTime(session.createdAt)} • {session.exercises?.length || 0} exercises
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small"
                              onClick={() => {
                                setSelectedSession(session);
                                setDialogOpen(true);
                              }}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton 
                              size="small"
                              onClick={() => handleCancelSession(session._id)}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <Button 
                          variant="outlined"
                          size="small"
                          startIcon={<PlayArrowIcon />}
                          onClick={() => handleStartSession(session._id)}
                        >
                          Start Now
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">
                No upcoming workouts scheduled. Plan your next session to stay on track!
              </Alert>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* All Sessions with Filters */}
          <Box sx={{ mb: 3 }}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    fullWidth
                    select
                    label="Filter by Status"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </Paper>

            <Grid container spacing={3}>
              {workoutSessions.map((session) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={session._id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {session.workoutPlan?.name || 'Custom Workout'}
                        </Typography>
                        <Chip
                          icon={getStatusIcon(session.status)}
                          label={session.status}
                          color={getStatusColor(session.status) as any}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {formatDate(session.createdAt)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {formatTime(session.createdAt)} • {session.exercises?.length || 0} exercises
                      </Typography>
                      {session.duration && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <AccessTimeIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {session.duration} minutes
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small"
                            onClick={() => {
                              setSelectedSession(session);
                              setDialogOpen(true);
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small"
                            onClick={() => handleDeleteSession(session._id)}
                            disabled={session.status === 'in-progress'}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      {session.status === 'planned' && (
                        <Button 
                          variant="contained"
                          size="small"
                          startIcon={<PlayArrowIcon />}
                          onClick={() => handleStartSession(session._id)}
                          sx={{ 
                            background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #059669, #2563EB)',
                            }
                          }}
                        >
                          Start
                        </Button>
                      )}
                      {session.status === 'in-progress' && (
                        <Button 
                          variant="contained"
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleCompleteSession(session._id)}
                          color="success"
                        >
                          Complete
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* History */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <CheckCircleIcon sx={{ mr: 1 }} />
              Recent Completed Workouts
            </Typography>
            <List>
              {getRecentSessions().map((session, index) => (
                <ListItem key={session._id} divider={index < getRecentSessions().length - 1}>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                      <CheckCircleIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={session.workoutPlan?.name || 'Custom Workout'}
                    secondary={`${formatDate(session.createdAt)} • ${session.duration || 0} minutes • ${session.exercises?.length || 0} exercises`}
                  />
                  <IconButton 
                    size="small"
                    onClick={() => {
                      setSelectedSession(session);
                      setDialogOpen(true);
                    }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </TabPanel>

        {/* Session Details Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedSession && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {selectedSession.workoutPlan?.name || 'Custom Workout'}
                  </Typography>
                  <Chip
                    icon={getStatusIcon(selectedSession.status)}
                    label={selectedSession.status}
                    color={getStatusColor(selectedSession.status) as any}
                  />
                </Box>
              </DialogTitle>
              <DialogContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Date:</strong> {formatDate(selectedSession.createdAt)}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Time:</strong> {formatTime(selectedSession.createdAt)}
                  </Typography>
                  {selectedSession.duration && (
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Duration:</strong> {selectedSession.duration} minutes
                    </Typography>
                  )}
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Exercises:</strong> {selectedSession.exercises?.length || 0}
                  </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Exercises
                </Typography>

                <List>
                  {(selectedSession.exercises || []).map((exercise, index) => (
                    <ListItem key={index} divider={index < (selectedSession.exercises?.length || 0) - 1}>
                      <ListItemIcon>
                        <FitnessCenterIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={exercise.exercise.name}
                        secondary={`${exercise.sets?.length || 0} sets • ${exercise.sets?.[0]?.reps || 0} reps each`}
                      />
                      {exercise.completed && (
                        <CheckCircleIcon color="success" />
                      )}
                    </ListItem>
                  ))}
                </List>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDialogOpen(false)}>
                  Close
                </Button>
                {selectedSession.status === 'planned' && (
                  <Button 
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => {
                      handleStartSession(selectedSession._id);
                      setDialogOpen(false);
                    }}
                    sx={{ 
                      background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #059669, #2563EB)',
                      }
                    }}
                  >
                    Start Workout
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Create Session Dialog */}
        <Dialog 
          open={createDialogOpen} 
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Schedule New Workout</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                {isLoadingPlans ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Loading workout plans...
                    </Typography>
                  </Box>
                ) : (
                  <TextField
                    fullWidth
                    select
                    label="Workout Plan"
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    disabled={workoutPlans.length === 0}
                    helperText={
                      workoutPlans.length === 0 
                        ? "No workout plans available. Create a workout plan first." 
                        : `${workoutPlans.length} plan(s) available`
                    }
                  >
                    {workoutPlans.length > 0 ? (
                      workoutPlans.map((plan) => {
                        // Use title if available, fallback to name
                        const planName = plan.title || plan.name || 'Untitled Plan';
                        const exerciseCount = plan.exercises?.length || plan.workoutDays?.reduce((count, day) => count + (day.exercises?.length || 0), 0) || 0;
                        
                        return (
                          <MenuItem key={plan._id} value={plan._id}>
                            {planName} ({exerciseCount} exercises)
                          </MenuItem>
                        );
                      })
                    ) : (
                      <MenuItem disabled>No plans available</MenuItem>
                    )}
                  </TextField>
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="time"
                  label="Time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setCreateDialogOpen(false);
              setIsCreatingSession(false);
              setSelectedPlan('');
            }}>
              Cancel
            </Button>
            <Button 
              variant="contained"
              onClick={() => {
                console.log('🚀 Schedule Workout dialog button clicked', {
                  selectedPlan,
                  scheduledDate,
                  scheduledTime,
                  workoutPlansCount: workoutPlans.length,
                  user: user?._id
                });
                handleCreateSession();
              }}
              disabled={!selectedPlan || isLoadingPlans || isCreatingSession}
              startIcon={isCreatingSession ? <CircularProgress size={20} /> : null}
              sx={{ 
                background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669, #2563EB)',
                },
                '&:disabled': {
                  background: '#ccc',
                }
              }}
            >
              {isCreatingSession ? 'Scheduling...' : 'Schedule Workout'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MaterialAppLayout>
  );
}
