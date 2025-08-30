'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Alert,
  Paper,
  Avatar,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  FitnessCenter as FitnessCenterIcon,
  PlayArrow as PlayArrowIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  StarRate as StarRateIcon,
  ContentCopy as ContentCopyIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { MaterialAppLayout } from '@/components/layout/MaterialAppLayout';
import { SearchField } from '@/components/ui/search-field';
import { WorkoutPlanService, WorkoutSessionService } from '@/external-api';
import { WorkoutPlan } from '@/lib/types';
import { toast } from 'sonner';
import Link from 'next/link';
import { useDebounce, useSearch } from '@/hooks';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import CreateWorkoutPlanDialog from '@/components/workout-plan/createWorkoutPlanDialog';

export default function WorkoutPlansPage() {
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isStartingWorkout, setIsStartingWorkout] = useState<string | null>(null);
  
  const { user } = useAuthStore();
  const router = useRouter();

  // Use the search hook for better search state management
  const {
    searchQuery,
    debouncedQuery: debouncedSearchQuery,
    isSearching,
    setSearchQuery,
    clearSearch,
    setIsSearching,
  } = useSearch({ debounceDelay: 300 });

  const difficulties = ['beginner', 'intermediate', 'advanced'];

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await WorkoutPlanService.getCategories();
        setCategories(categoriesData || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([]); // Set empty array on error
      }
    };

    fetchCategories();
  }, []);

  // Fetch workout plans when filters change
  const fetchWorkoutPlans = useCallback(async () => {
    try {
      setIsSearching(true);
      console.log('🏋️ Fetching workout plans with filters:', {
        search: debouncedSearchQuery,
        category: selectedCategory,
        difficulty: selectedDifficulty
      });

      const filters = {
        isPublic: true,
        limit: 50,
        ...(debouncedSearchQuery.trim() && { search: debouncedSearchQuery.trim() }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedDifficulty && { difficulty: selectedDifficulty as any }),
      };

      console.log('🔍 API filters:', filters);

      const response = await WorkoutPlanService.getWorkoutPlans(filters);
      console.log('🏋️ Workout plans API Response:', response);
      
      setWorkoutPlans(response.data || []);
    } catch (error) {
      console.error('❌ Failed to fetch workout plans:', error);
      toast.error('Failed to load workout plans');
      setWorkoutPlans([]); // Set empty array on error
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [debouncedSearchQuery, selectedCategory, selectedDifficulty]);

  useEffect(() => {
    fetchWorkoutPlans();
  }, [fetchWorkoutPlans]);

  const handleClonePlan = async (planId: string) => {
    try {
      await WorkoutPlanService.cloneWorkoutPlan(planId);
      toast.success('Workout plan cloned to your collection!');
    } catch (error) {
      toast.error('Failed to clone workout plan');
    }
  };

  const handleStartWorkout = async (planId: string) => {
    if (!user) {
      toast.error('Please sign in to start a workout');
      return;
    }

    try {
      setIsStartingWorkout(planId);
      console.log('🏋️ Starting workout from plan:', planId);
      
      // First, get the workout plan details
      const workoutPlan = await WorkoutPlanService.getWorkoutPlanById(planId);
      console.log('📋 Fetched workout plan:', workoutPlan);
      
      // For now, let's use the first day or create a combined session from all exercises
      // This is a simplification - in a real app, you'd let the user choose which day
      const firstDay = workoutPlan.workoutDays && workoutPlan.workoutDays.length > 0 
        ? workoutPlan.workoutDays[0] 
        : null;
        
      console.log('📅 Selected workout day:', firstDay);
        
      if (!firstDay || !firstDay.exercises || firstDay.exercises.length === 0) {
        toast.error('This workout plan has no exercises defined');
        return;
      }
      
      console.log('🏋️ Day exercises:', firstDay.exercises);
      
      // Convert plan exercises to session exercises using backend structure
      const sessionExercises = firstDay.exercises.map(planEx => {
        console.log('🔄 Converting exercise:', planEx);
        const sessionEx = {
          exercise: planEx.exercise._id, // Send only the ObjectId
          plannedSets: planEx.sets || 1,
          completedSets: Array.from({ length: planEx.sets || 1 }, (_, index) => ({
            setNumber: index + 1,
            reps: planEx.reps,
            weight: planEx.weight,
            duration: planEx.duration,
            completed: false,
            restDuration: planEx.restBetweenSets,
          })),
          notes: planEx.notes || '',
          personalRecord: false,
        };
        console.log('✅ Converted to session exercise:', sessionEx);
        return sessionEx;
      });

      console.log('🏋️ All session exercises:', sessionExercises);

      // Create the workout session using the backend API structure
      const sessionData = {
        userId: user._id,
        workoutPlanId: planId,
        title: `${workoutPlan.title} - ${firstDay.dayName}`,
        exercises: sessionExercises as any, // Bypass TypeScript checking for backend compatibility
        status: 'in-progress' as const,
        notes: `Started from ${workoutPlan.title} - ${firstDay.dayName}`,
      };

      console.log('🏋️ Creating workout session:', sessionData);
      const workoutSession = await WorkoutSessionService.createWorkoutSession(sessionData);
      console.log('✅ Created workout session:', workoutSession);
      console.log('🔍 Session exercises received:', workoutSession.exercises);
      
      toast.success('Workout started! Redirecting to active workout...');
      
      // Navigate to the active workout page
      router.push('/workouts/active');
    } catch (error) {
      console.error('❌ Failed to start workout:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start workout');
    } finally {
      setIsStartingWorkout(null);
    }
  };

  const handleViewDetails = (plan: WorkoutPlan) => {
    setSelectedPlan(plan);
    setDialogOpen(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = ['primary', 'secondary', 'info', 'warning', 'error'];
    const index = categories ? (categories.indexOf(category) % colors.length) : 0;
    return colors[index] || 'default';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  if (isLoading) {
    return (
      <MaterialAppLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading workout plans...
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
            Workout Plans
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ 
              background: 'linear-gradient(135deg, #10B981, #3B82F6)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669, #2563EB)',
              }
            }}
          >
            Create Plan
          </Button>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <SearchField
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={clearSearch}
                placeholder="Search workout plans..."
                isSearching={isSearching}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                select
                label="Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                select
                label="Difficulty"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
              >
                <MenuItem value="">All Difficulties</MenuItem>
                {difficulties.map((difficulty) => (
                  <MenuItem key={difficulty} value={difficulty}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {/* Workout Plans Grid */}
        {isSearching && !isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={40} />
              <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
                Searching workout plans...
              </Typography>
            </Box>
          </Box>
        ) : workoutPlans.length > 0 ? (
          <>
            {/* Results count */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {searchQuery || selectedCategory || selectedDifficulty 
                  ? `Found ${workoutPlans.length} workout plan${workoutPlans.length !== 1 ? 's' : ''}`
                  : `Showing ${workoutPlans.length} workout plan${workoutPlans.length !== 1 ? 's' : ''}`
                }
                {searchQuery && ` for "${searchQuery}"`}
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
            {workoutPlans.map((plan) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={plan._id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Header with title and actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {plan.name}
                        </Typography>
                      </Box>
                      <IconButton size="small">
                        <MoreVertIcon />
                      </IconButton>
                    </Box>

                    {/* Description */}
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mb: 2, lineHeight: 1.6, minHeight: '3em' }}
                    >
                      {plan.description}
                    </Typography>

                    {/* Tags */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip 
                        label={plan.category} 
                        color={getCategoryColor(plan.category) as any}
                        size="small"
                      />
                      <Chip 
                        label={plan.difficulty} 
                        color={getDifficultyColor(plan.difficulty) as any}
                        size="small"
                      />
                      <Chip 
                        label={formatDuration(plan.duration)} 
                        icon={<AccessTimeIcon />}
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    {/* Creator and rating */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '12px' }}>
                          <PersonIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="caption" color="text.secondary">
                          by {plan.createdBy?.username || 'Unknown User'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <StarRateIcon sx={{ color: '#FFC107', fontSize: 16, mr: 0.5 }} />
                        <Typography variant="caption">
                          {plan.averageRating ? plan.averageRating.toFixed(1) : '0.0'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Exercise count */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <FitnessCenterIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {plan.exercises?.length || 0} exercises
                      </Typography>
                    </Box>

                    {/* Tags */}
                    {plan.tags && plan.tags.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                          Tags:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                          {plan.tags.slice(0, 3).map((tag, index) => (
                            <Chip
                              key={index}
                              label={tag}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '11px', height: '20px' }}
                            />
                          ))}
                          {plan.tags.length > 3 && (
                            <Typography variant="caption" color="text.secondary">
                              +{plan.tags.length - 3} more
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                  </CardContent>

                  <Divider />

                  <CardActions sx={{ p: 2, justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewDetails(plan)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Clone Plan">
                        <IconButton 
                          size="small"
                          onClick={() => handleClonePlan(plan._id)}
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Add to Favorites">
                        <IconButton size="small">
                          <FavoriteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Button 
                      variant="contained"
                      size="small"
                      startIcon={isStartingWorkout === plan._id ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                      onClick={() => handleStartWorkout(plan._id)}
                      disabled={isStartingWorkout === plan._id}
                      sx={{ 
                        background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #059669, #2563EB)',
                        }
                      }}
                    >
                      {isStartingWorkout === plan._id ? 'Starting...' : 'Start'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
        ) : (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <FitnessCenterIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No workout plans found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Try adjusting your search criteria or clear the filters
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => {
                clearSearch();
                setSelectedCategory('');
                setSelectedDifficulty('');
              }}
            >
              Clear Filters
            </Button>
          </Paper>
        )}

        {/* Plan Details Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedPlan && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {selectedPlan.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StarRateIcon sx={{ color: '#FFC107', fontSize: 20, mr: 0.5 }} />
                    <Typography variant="body2">
                      {selectedPlan.averageRating ? selectedPlan.averageRating.toFixed(1) : '0.0'}
                      <span style={{ color: 'text.secondary' }}> ({selectedPlan.ratings?.length || 0} reviews)</span>
                    </Typography>
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent>
                {/* Plan metadata */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip 
                      label={selectedPlan.category} 
                      color={getCategoryColor(selectedPlan.category) as any}
                      size="small"
                    />
                    <Chip 
                      label={selectedPlan.difficulty} 
                      color={getDifficultyColor(selectedPlan.difficulty) as any}
                      size="small"
                    />
                    <Chip 
                      label={formatDuration(selectedPlan.duration)} 
                      icon={<AccessTimeIcon />}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedPlan.description}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Created by {selectedPlan.createdBy?.username || 'Unknown User'} • {selectedPlan.exercises?.length || 0} exercises
                  </Typography>

                  {selectedPlan.tags && selectedPlan.tags.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Tags:</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {selectedPlan.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Exercise list */}
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Exercises ({selectedPlan.exercises?.length || 0})
                </Typography>
                
                <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
                  {selectedPlan.exercises?.map((planExercise, index) => (
                    <Paper key={index} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {index + 1}. {planExercise.exercise.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={planExercise.exercise.difficulty}
                          color={getDifficultyColor(planExercise.exercise.difficulty) as any}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {planExercise.exercise.description}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2">
                          <strong>Sets:</strong> {planExercise.sets}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Reps:</strong> {planExercise.reps}
                        </Typography>
                        {planExercise.weight && (
                          <Typography variant="body2">
                            <strong>Weight:</strong> {planExercise.weight}kg
                          </Typography>
                        )}
                        {planExercise.duration && (
                          <Typography variant="body2">
                            <strong>Duration:</strong> {planExercise.duration}s
                          </Typography>
                        )}
                        <Typography variant="body2">
                          <strong>Rest:</strong> {planExercise.restTime}s
                        </Typography>
                      </Box>

                      <Typography variant="caption" color="text.secondary">
                        Target: {planExercise.exercise.muscleGroups?.join(', ') || 'N/A'} • 
                        Equipment: {planExercise.exercise.equipment || 'None'}
                      </Typography>

                      {planExercise.notes && (
                        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                          Notes: {planExercise.notes}
                        </Typography>
                      )}
                    </Paper>
                  )) || (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      No exercises available
                    </Typography>
                  )}
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDialogOpen(false)}>
                  Close
                </Button>
                <Button 
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => {
                    handleClonePlan(selectedPlan._id);
                    setDialogOpen(false);
                  }}
                >
                  Clone Plan
                </Button>
                <Button 
                  variant="contained"
                  startIcon={isStartingWorkout === selectedPlan._id ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                  onClick={() => handleStartWorkout(selectedPlan._id)}
                  disabled={isStartingWorkout === selectedPlan._id}
                  sx={{ 
                    background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669, #2563EB)',
                    }
                  }}
                >
                  {isStartingWorkout === selectedPlan._id ? 'Starting...' : 'Start Workout'}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Create Workout Plan Dialog */}
        <CreateWorkoutPlanDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSuccess={() => {
            fetchWorkoutPlans(); // Refresh the list
          }}
        />
      </Box>
    </MaterialAppLayout>
  );
}
