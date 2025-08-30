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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputLabel,
  FormControl,
  Select,
  Snackbar,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tooltip,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  FitnessCenter as FitnessCenterIcon,
  PlayArrow as PlayArrowIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { MaterialAppLayout } from '@/components/layout/MaterialAppLayout';
import { SearchField } from '@/components/ui/search-field';
import { ExerciseService, WorkoutSessionService } from '@/external-api';
import { useAuthStore } from '@/lib/auth-store';
import { Exercise, WorkoutSessionExercise, WorkoutSet } from '@/lib/types';
import { useDebounce, useSearch } from '@/hooks';
import { useRouter } from 'next/navigation';

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [startWorkoutDialog, setStartWorkoutDialog] = useState<{
    open: boolean;
    exercise: Exercise | null;
  }>({ open: false, exercise: null });
  const [workoutSets, setWorkoutSets] = useState(3);
  const [workoutReps, setWorkoutReps] = useState(10);
  const [workoutWeight, setWorkoutWeight] = useState(0);
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });
  const [addExerciseDialog, setAddExerciseDialog] = useState(false);
  const [isCreatingExercise, setIsCreatingExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: '',
    description: '',
    category: 'strength' as const,
    muscleGroups: [] as string[],
    equipment: [] as string[],
    difficulty: 'beginner' as const,
    instructions: [''],
    tips: [''],
    variations: [''],
    videoUrl: '',
    imageUrls: [''],
    isPublic: true,
  });
  const { isAuthenticated, user } = useAuthStore();
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

  const categories = ['strength', 'cardio', 'flexibility', 'balance', 'plyometric', 'powerlifting', 'olympic', 'rehabilitation'];
  const difficulties = ['beginner', 'intermediate', 'advanced'];
  const muscleGroupOptions = [
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
    'abs', 'obliques', 'lower-back', 'quadriceps', 'hamstrings', 
    'glutes', 'calves', 'full-body', 'core'
  ];
  const equipmentOptions = [
    'none', 'barbell', 'dumbbell', 'kettlebell', 'resistance-band',
    'pull-up-bar', 'bench', 'cable-machine', 'smith-machine',
    'treadmill', 'stationary-bike', 'elliptical', 'rowing-machine',
    'medicine-ball', 'foam-roller', 'yoga-mat', 'suspension-trainer'
  ];

  const fetchExercises = useCallback(async () => {
    try {
      setIsSearching(true);
      setError(null);
      console.log('🏋️ Fetching exercises with filters:', {
        search: debouncedSearchQuery,
        category: selectedCategory,
        difficulty: selectedDifficulty,
        isAuthenticated
      });
      
      const filters = {
        limit: 50,
        ...(debouncedSearchQuery.trim() && { search: debouncedSearchQuery.trim() }),
        ...(selectedCategory && { category: selectedCategory as any }),
        ...(selectedDifficulty && { difficulty: selectedDifficulty as any }),
      };

      console.log('🔍 API filters:', filters);
      
      const response = await ExerciseService.getExercises(filters);
      console.log('🏋️ Exercise API Response:', response);
      
      setExercises(response.data || []);
    } catch (error) {
      console.error('❌ Failed to fetch exercises:', error);
      setError(error instanceof Error ? error.message : 'Failed to load exercises');
      setExercises([]);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [debouncedSearchQuery, selectedCategory, selectedDifficulty, isAuthenticated]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strength': return 'primary';
      case 'cardio': return 'secondary';
      case 'flexibility': return 'info';
      case 'balance': return 'warning';
      default: return 'default';
    }
  };

  const handleStartWorkout = (exercise: Exercise) => {
    if (!isAuthenticated) {
      setSnackbar({
        open: true,
        message: 'Please sign in to start a workout session',
        severity: 'warning'
      });
      return;
    }

    setStartWorkoutDialog({ open: true, exercise });
    // Set reasonable defaults based on exercise type and difficulty
    if (exercise.category === 'cardio') {
      setWorkoutSets(1);
      setWorkoutReps(1);
      setWorkoutWeight(0);
    } else {
      setWorkoutSets(3);
      setWorkoutReps(exercise.difficulty === 'beginner' ? 8 : exercise.difficulty === 'intermediate' ? 12 : 15);
      setWorkoutWeight(0);
    }
  };

  const handleCreateWorkoutSession = async () => {
    if (!startWorkoutDialog.exercise || !user) return;

    setIsStartingWorkout(true);
    try {
      console.log('🏋️ Creating workout session for exercise:', startWorkoutDialog.exercise.name);

      // Create completed sets based on user input - backend expects this structure
      const completedSets = [];
      for (let i = 0; i < workoutSets; i++) {
        completedSets.push({
          setNumber: i + 1,
          reps: workoutReps,
          weight: workoutWeight > 0 ? workoutWeight : undefined,
          duration: startWorkoutDialog.exercise.category === 'cardio' ? 60 : undefined, // 1 minute default for cardio
          completed: false,
          restDuration: 60, // 60 seconds rest between sets
        });
      }

      // Create the workout session exercise - backend structure
      const sessionExercise: any = {
        exercise: startWorkoutDialog.exercise._id, // Send only the ObjectId, not the full object
        plannedSets: workoutSets, // Backend expects 'plannedSets'
        completedSets: completedSets, // Backend expects 'completedSets' array
        notes: `Quick workout: ${startWorkoutDialog.exercise.name}`,
      };

      // Create the workout session - match frontend interface
      const sessionData: any = {
        userId: user._id, // Keep userId for the interface
        title: `Quick Workout: ${startWorkoutDialog.exercise.name}`,
        exercises: [sessionExercise],
        notes: `Quick workout session for ${startWorkoutDialog.exercise.name}`,
        status: 'in-progress' as const,
        startTime: new Date().toISOString(),
      };

      console.log('📝 Creating session with backend-compatible data:', sessionData);

      const workoutSession = await WorkoutSessionService.createWorkoutSession(sessionData);
      
      console.log('✅ Workout session created successfully:', workoutSession);

      setSnackbar({
        open: true,
        message: `Started workout: ${startWorkoutDialog.exercise.name}`,
        severity: 'success'
      });

      setStartWorkoutDialog({ open: false, exercise: null });

      // Navigate to active workout page
      setTimeout(() => {
        router.push('/workouts/active');
      }, 1500);

    } catch (error) {
      console.error('❌ Failed to create workout session:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to start workout',
        severity: 'error'
      });
    } finally {
      setIsStartingWorkout(false);
    }
  };

  const handleCloseStartDialog = () => {
    setStartWorkoutDialog({ open: false, exercise: null });
    setWorkoutSets(3);
    setWorkoutReps(10);
    setWorkoutWeight(0);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleOpenAddExerciseDialog = () => {
    if (!isAuthenticated) {
      setSnackbar({
        open: true,
        message: 'Please sign in to add exercises',
        severity: 'warning'
      });
      return;
    }
    
    // Pre-populate with sample data for testing
    setNewExercise({
      name: 'Push-ups',
      description: 'A classic bodyweight exercise that targets the chest, shoulders, and triceps.',
      category: 'strength' as const,
      muscleGroups: ['chest', 'shoulders', 'triceps'],
      equipment: ['none'],
      difficulty: 'beginner' as const,
      instructions: [
        'Start in a plank position with hands slightly wider than shoulder-width apart',
        'Lower your chest towards the floor by bending your elbows',
        'Push back up to the starting position',
        'Repeat for desired number of repetitions'
      ],
      tips: [
        'Keep your core engaged throughout the movement',
        'Control the movement - don\'t rush'
      ],
      variations: [
        'Incline push-ups (hands elevated)',
        'Diamond push-ups'
      ],
      videoUrl: '',
      imageUrls: [],
      isPublic: true,
    });
    setAddExerciseDialog(true);
  };

  const handleCloseAddExerciseDialog = () => {
    setAddExerciseDialog(false);
    setNewExercise({
      name: '',
      description: '',
      category: 'strength' as const,
      muscleGroups: [],
      equipment: [],
      difficulty: 'beginner' as const,
      instructions: [''],
      tips: [''],
      variations: [''],
      videoUrl: '',
      imageUrls: [''],
      isPublic: true,
    });
  };

  const handleCreateExercise = async () => {
    setIsCreatingExercise(true);
    try {
      // Validate required fields
      if (!newExercise.name.trim()) {
        throw new Error('Exercise name is required');
      }
      if (!newExercise.description.trim()) {
        throw new Error('Exercise description is required');
      }
      if (newExercise.muscleGroups.length === 0) {
        throw new Error('Please select at least one muscle group');
      }
      if (newExercise.equipment.length === 0) {
        throw new Error('Please select at least one equipment type');
      }
      if (newExercise.instructions.filter(inst => inst.trim()).length === 0) {
        throw new Error('Please provide at least one instruction');
      }

      const exerciseData = {
        name: newExercise.name.trim(),
        description: newExercise.description.trim(),
        category: newExercise.category,
        muscleGroups: newExercise.muscleGroups,
        equipment: newExercise.equipment,
        difficulty: newExercise.difficulty,
        instructions: newExercise.instructions.filter(inst => inst.trim()),
        tips: newExercise.tips.filter(tip => tip.trim()),
        variations: newExercise.variations.filter(variation => variation.trim()),
        videoUrl: newExercise.videoUrl.trim() || undefined,
        imageUrls: newExercise.imageUrls.filter(url => url.trim()),
        isPublic: newExercise.isPublic,
      };

      console.log('🏋️ Creating exercise with data:', exerciseData);

      const createdExercise = await ExerciseService.createExercise(exerciseData);
      
      setSnackbar({
        open: true,
        message: `Exercise "${createdExercise.name}" created successfully!`,
        severity: 'success'
      });

      // Refresh the exercises list
      fetchExercises();
      handleCloseAddExerciseDialog();
    } catch (error) {
      console.error('❌ Failed to create exercise:', error);
      let errorMessage = 'Failed to create exercise';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const apiError = error as any;
        if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message;
        } else if (apiError.response?.data?.error) {
          errorMessage = apiError.response.data.error;
        }
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setIsCreatingExercise(false);
    }
  };

  const handleArrayFieldChange = (
    field: 'instructions' | 'tips' | 'variations' | 'imageUrls',
    index: number,
    value: string
  ) => {
    setNewExercise(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const handleAddArrayField = (field: 'instructions' | 'tips' | 'variations' | 'imageUrls') => {
    setNewExercise(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const handleRemoveArrayField = (
    field: 'instructions' | 'tips' | 'variations' | 'imageUrls',
    index: number
  ) => {
    setNewExercise(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <MaterialAppLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading exercises...
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
            Exercise Library
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleOpenAddExerciseDialog}
            sx={{ 
              background: 'linear-gradient(135deg, #10B981, #3B82F6)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669, #2563EB)',
              }
            }}
          >
            Add Exercise
          </Button>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2">
              {error}
            </Typography>
          </Alert>
        )}

        {/* Auth Warning */}
        {!isAuthenticated && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              You're viewing exercises as a guest. <strong>Sign in</strong> to access personalized features and create custom workouts.
            </Typography>
          </Alert>
        )}

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <SearchField
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={clearSearch}
                placeholder="Search exercises..."
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

        {/* Exercise Grid */}
        {isSearching && !isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={40} />
              <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
                Searching exercises...
              </Typography>
            </Box>
          </Box>
        ) : exercises && exercises.length > 0 ? (
          <>
            {/* Results count */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {searchQuery || selectedCategory || selectedDifficulty 
                  ? `Found ${exercises.length} exercise${exercises.length !== 1 ? 's' : ''}`
                  : `Showing ${exercises.length} exercise${exercises.length !== 1 ? 's' : ''}`
                }
                {searchQuery && ` for "${searchQuery}"`}
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
            {exercises.map((exercise) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={exercise._id}>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <FitnessCenterIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                        {exercise.name}
                      </Typography>
                    </Box>

                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mb: 2, lineHeight: 1.6 }}
                    >
                      {exercise.description}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip 
                        label={exercise.category} 
                        color={getCategoryColor(exercise.category) as any}
                        size="small"
                      />
                      <Chip 
                        label={exercise.difficulty} 
                        color={getDifficultyColor(exercise.difficulty) as any}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                        Muscle Groups:
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {exercise.muscleGroups?.join(', ') || 'Not specified'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                        Equipment:
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {Array.isArray(exercise.equipment) 
                          ? exercise.equipment.join(', ') 
                          : exercise.equipment || 'None'}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button 
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => handleStartWorkout(exercise)}
                      disabled={!isAuthenticated}
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
                      Start
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
              No exercises found
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
      </Box>

      {/* Start Workout Dialog */}
      <Dialog 
        open={startWorkoutDialog.open} 
        onClose={handleCloseStartDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" component="div">
            Start Workout: {startWorkoutDialog.exercise?.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure your workout session for{' '}
              <strong>{startWorkoutDialog.exercise?.name}</strong>
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Sets</InputLabel>
                  <Select
                    value={workoutSets}
                    label="Sets"
                    onChange={(e) => setWorkoutSets(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <MenuItem key={num} value={num}>
                        {num} {num === 1 ? 'Set' : 'Sets'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {startWorkoutDialog.exercise?.category !== 'cardio' && (
                <>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Reps"
                      type="number"
                      value={workoutReps}
                      onChange={(e) => setWorkoutReps(Number(e.target.value))}
                      inputProps={{ min: 1, max: 50 }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Weight (kg)"
                      type="number"
                      value={workoutWeight}
                      onChange={(e) => setWorkoutWeight(Number(e.target.value))}
                      inputProps={{ min: 0, step: 0.5 }}
                      helperText="Optional - leave 0 for bodyweight"
                    />
                  </Grid>
                </>
              )}

              {startWorkoutDialog.exercise?.category === 'cardio' && (
                <Grid size={{ xs: 12, sm: 8 }}>
                  <Alert severity="info">
                    Cardio exercise will be tracked by duration. Default duration is 1 minute per set.
                  </Alert>
                </Grid>
              )}
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Exercise Details:</strong>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {startWorkoutDialog.exercise?.description}
              </Typography>
              {startWorkoutDialog.exercise?.muscleGroups && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Target muscles:</strong> {startWorkoutDialog.exercise.muscleGroups.join(', ')}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseStartDialog} disabled={isStartingWorkout}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateWorkoutSession}
            disabled={isStartingWorkout}
            startIcon={isStartingWorkout ? <CircularProgress size={20} /> : <PlayArrowIcon />}
            sx={{
              background: 'linear-gradient(135deg, #10B981, #3B82F6)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669, #2563EB)',
              }
            }}
          >
            {isStartingWorkout ? 'Starting...' : 'Start Workout'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Add Exercise Dialog */}
      <Dialog 
        open={addExerciseDialog} 
        onClose={handleCloseAddExerciseDialog}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          <Typography variant="h5" component="div">
            Add New Exercise
          </Typography>
          <IconButton
            onClick={handleCloseAddExerciseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Basic Info */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Basic Information</Typography>
            </Grid>
            
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                label="Exercise Name *"
                value={newExercise.name}
                onChange={(e) => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Push-ups, Deadlifts, Running"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Difficulty *</InputLabel>
                <Select
                  value={newExercise.difficulty}
                  label="Difficulty *"
                  onChange={(e) => setNewExercise(prev => ({ ...prev, difficulty: e.target.value as any }))}
                >
                  {difficulties.map((difficulty) => (
                    <MenuItem key={difficulty} value={difficulty}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description *"
                value={newExercise.description}
                onChange={(e) => setNewExercise(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this exercise is and how it benefits fitness..."
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Category *</InputLabel>
                <Select
                  value={newExercise.category}
                  label="Category *"
                  onChange={(e) => setNewExercise(prev => ({ ...prev, category: e.target.value as any }))}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newExercise.isPublic}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, isPublic: e.target.checked }))}
                  />
                }
                label="Make this exercise public"
              />
            </Grid>

            {/* Muscle Groups */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Target Muscle Groups</Typography>
              <FormControl fullWidth>
                <InputLabel>Muscle Groups *</InputLabel>
                <Select
                  multiple
                  value={newExercise.muscleGroups}
                  onChange={(e) => {
                    const value = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                    setNewExercise(prev => ({ ...prev, muscleGroups: value }));
                  }}
                  input={<OutlinedInput label="Muscle Groups *" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {muscleGroupOptions.map((muscle) => (
                    <MenuItem key={muscle} value={muscle}>
                      <Checkbox checked={newExercise.muscleGroups.indexOf(muscle) > -1} />
                      {muscle.replace('-', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Equipment */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Required Equipment</Typography>
              <FormControl fullWidth>
                <InputLabel>Equipment *</InputLabel>
                <Select
                  multiple
                  value={newExercise.equipment}
                  onChange={(e) => {
                    const value = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                    setNewExercise(prev => ({ ...prev, equipment: value }));
                  }}
                  input={<OutlinedInput label="Equipment *" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {equipmentOptions.map((equipment) => (
                    <MenuItem key={equipment} value={equipment}>
                      <Checkbox checked={newExercise.equipment.indexOf(equipment) > -1} />
                      {equipment.replace('-', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Instructions */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Instructions</Typography>
              {newExercise.instructions.map((instruction, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    label={`Step ${index + 1}`}
                    value={instruction}
                    onChange={(e) => handleArrayFieldChange('instructions', index, e.target.value)}
                    placeholder="Describe this step clearly..."
                  />
                  {newExercise.instructions.length > 1 && (
                    <IconButton
                      onClick={() => handleRemoveArrayField('instructions', index)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button
                variant="outlined"
                onClick={() => handleAddArrayField('instructions')}
                startIcon={<AddIcon />}
                size="small"
              >
                Add Step
              </Button>
            </Grid>

            {/* Tips (Optional) */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Tips (Optional)</Typography>
              {newExercise.tips.map((tip, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    label={`Tip ${index + 1}`}
                    value={tip}
                    onChange={(e) => handleArrayFieldChange('tips', index, e.target.value)}
                    placeholder="Add a helpful tip..."
                  />
                  {newExercise.tips.length > 1 && (
                    <IconButton
                      onClick={() => handleRemoveArrayField('tips', index)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button
                variant="outlined"
                onClick={() => handleAddArrayField('tips')}
                startIcon={<AddIcon />}
                size="small"
              >
                Add Tip
              </Button>
            </Grid>

            {/* Video URL and Images */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Video URL (Optional)"
                value={newExercise.videoUrl}
                onChange={(e) => setNewExercise(prev => ({ ...prev, videoUrl: e.target.value }))}
                placeholder="https://youtube.com/..."
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              {/* Image URLs would be here but simplified for now */}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseAddExerciseDialog} disabled={isCreatingExercise}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateExercise}
            disabled={isCreatingExercise}
            startIcon={isCreatingExercise ? <CircularProgress size={20} /> : <AddIcon />}
            sx={{
              background: 'linear-gradient(135deg, #10B981, #3B82F6)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669, #2563EB)',
              }
            }}
          >
            {isCreatingExercise ? 'Creating...' : 'Create Exercise'}
          </Button>
        </DialogActions>
      </Dialog>
    </MaterialAppLayout>
  );
}
