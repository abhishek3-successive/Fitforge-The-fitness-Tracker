'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Paper,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Fab,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  CheckCircle as CheckCircleIcon,
  Timer as TimerIcon,
  FitnessCenter as FitnessCenterIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Notes as NotesIcon,
  RestaurantMenu as RestIcon,
  SkipNext as SkipNextIcon,
  SkipPrevious as SkipPreviousIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { MaterialAppLayout } from '@/components/layout/MaterialAppLayout';
import { WorkoutSessionService, WorkoutPlanService } from '@/external-api';
import { WorkoutSession, WorkoutSessionExercise, WorkoutSet, WorkoutPlan } from '@/lib/types';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';

interface RestTimerProps {
  seconds: number;
  onComplete: () => void;
  onSkip: () => void;
}

function RestTimer({ seconds, onComplete, onSkip }: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={true} maxWidth="sm" fullWidth>
      <DialogContent sx={{ textAlign: 'center', py: 4 }}>
        <RestIcon sx={{ fontSize: 64, color: 'info.main', mb: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
          Rest Time
        </Typography>
        <Typography variant="h2" sx={{ fontWeight: 'bold', color: 'info.main', mb: 3 }}>
          {formatTime(timeLeft)}
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={((seconds - timeLeft) / seconds) * 100}
          sx={{ mb: 3, height: 8, borderRadius: 4 }}
        />
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button 
            variant="outlined" 
            onClick={onSkip}
            startIcon={<SkipNextIcon />}
          >
            Skip Rest
          </Button>
          <Button 
            variant="contained" 
            onClick={onComplete}
            disabled={timeLeft > 0}
            startIcon={<CheckIcon />}
          >
            Continue
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default function ActiveWorkoutPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isResting, setIsResting] = useState(false);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Dialogs
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [editSetDialogOpen, setEditSetDialogOpen] = useState(false);
  
  // Forms
  const [availableWorkouts, setAvailableWorkouts] = useState<WorkoutPlan[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [editingSet, setEditingSet] = useState<{ exerciseIndex: number; setIndex: number } | null>(null);
  const [editSetData, setEditSetData] = useState({ reps: 0, weight: 0, duration: 0 });

  // Fetch active session on mount
  useEffect(() => {
    fetchActiveSession();
    fetchAvailableWorkouts();
  }, [user]);

  // Workout timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setWorkoutTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const fetchActiveSession = async () => {
    try {
      setIsLoading(true);
      const session = await WorkoutSessionService.getActiveWorkoutSession(user?._id);
      if (session) {
        setActiveSession(session);
        setIsTimerRunning(true);
        // Calculate elapsed time if session has started
        if (session.startTime) {
          const elapsed = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000);
          setWorkoutTimer(elapsed);
        }
      } else {
        setStartDialogOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch active session:', error);
      setStartDialogOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableWorkouts = async () => {
    try {
      // Fetch all public workout plans instead of just user-specific ones
      const response = await WorkoutPlanService.getWorkoutPlans({ 
        isPublic: true,
        limit: 50 // Get more plans for selection
      });
      setAvailableWorkouts(response.data);
    } catch (error) {
      console.error('Failed to fetch workouts:', error);
    }
  };

  const startNewWorkout = async () => {
    if (!selectedWorkoutId) {
      toast.error('Please select a workout plan');
      return;
    }

    try {
      const workoutPlan = availableWorkouts.find(w => w._id === selectedWorkoutId);
      if (!workoutPlan) return;

      const sessionData = {
        userId: user!._id,
        workoutPlanId: selectedWorkoutId,
        exercises: workoutPlan.exercises.map(planEx => ({
          exercise: planEx.exercise,
          sets: Array.from({ length: planEx.sets }, () => ({
            reps: typeof planEx.reps === 'number' ? planEx.reps : 0,
            weight: planEx.weight || 0,
            duration: planEx.duration || 0,
            completed: false,
            restTime: planEx.restTime,
          })),
          notes: planEx.notes || '',
          completed: false,
        })),
        status: 'in-progress' as const,
      };

      const newSession = await WorkoutSessionService.createWorkoutSession(sessionData);
      await WorkoutSessionService.startWorkoutSession(newSession._id);
      
      setActiveSession(newSession);
      setIsTimerRunning(true);
      setWorkoutTimer(0);
      setStartDialogOpen(false);
      toast.success('Workout started!');
    } catch (error) {
      console.error('Failed to start workout:', error);
      toast.error('Failed to start workout');
    }
  };

  const completeSet = async () => {
    if (!activeSession) return;

    const updatedSession = { ...activeSession };
    const currentExercise = updatedSession.exercises[currentExerciseIndex];
    const currentSets = currentExercise?.sets || (currentExercise as any)?.completedSets || [];
    const currentSet = currentSets[currentSetIndex];
    
    if (!currentExercise || !currentSet) {
      toast.error('Invalid exercise or set data');
      return;
    }
    
    // Mark current set as completed
    currentSet.completed = true;

    try {
      // Update session in backend
      await WorkoutSessionService.updateWorkoutSession(activeSession._id, {
        exercises: updatedSession.exercises,
      });

      setActiveSession(updatedSession);

      // Check if all sets for current exercise are completed
      const allSets = currentExercise.sets || (currentExercise as any).completedSets || [];
      const allSetsCompleted = allSets.every((set: any) => set.completed);
      if (allSetsCompleted) {
        currentExercise.completed = true;
        toast.success(`${currentExercise.exercise?.name || 'Exercise'} completed!`);
        
        // Move to next exercise
        if (currentExerciseIndex < updatedSession.exercises.length - 1) {
          setCurrentExerciseIndex(prev => prev + 1);
          setCurrentSetIndex(0);
        } else {
          // All exercises completed
          setCompleteDialogOpen(true);
          return;
        }
      } else {
        // Move to next set
        setCurrentSetIndex(prev => prev + 1);
      }

      // Start rest timer if there's a rest time
      if (currentSet.restTime && currentSet.restTime > 0) {
        setIsResting(true);
      }
    } catch (error) {
      console.error('Failed to update session:', error);
      toast.error('Failed to save progress');
    }
  };

  const skipSet = () => {
    const currentExercise = activeSession!.exercises[currentExerciseIndex];
    const sets = currentExercise.completedSets || currentExercise.sets || [];
    
    if (currentSetIndex < sets.length - 1) {
      setCurrentSetIndex(prev => prev + 1);
    } else if (currentExerciseIndex < activeSession!.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSetIndex(0);
    }
  };

  const previousSet = () => {
    if (currentSetIndex > 0) {
      setCurrentSetIndex(prev => prev - 1);
    } else if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      const prevExercise = activeSession!.exercises[currentExerciseIndex - 1];
      const prevSets = prevExercise.completedSets || prevExercise.sets || [];
      setCurrentSetIndex(prevSets.length - 1);
    }
  };

  const completeWorkout = async () => {
    if (!activeSession) return;

    try {
      await WorkoutSessionService.completeWorkoutSession(activeSession._id, {
        duration: workoutTimer / 60 // Convert seconds to minutes
      });
      toast.success('Workout completed! Great job! 🎉');
      setCompleteDialogOpen(false);
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to complete workout:', error);
      toast.error('Failed to complete workout');
    }
  };

  const saveSetEdit = async () => {
    if (!activeSession || !editingSet) return;

    const updatedSession = { ...activeSession };
    const exercise = updatedSession.exercises[editingSet.exerciseIndex];
    const sets = exercise.sets || (exercise as any).completedSets || [];
    const targetSet = sets[editingSet.setIndex];
    
    if (targetSet) {
      targetSet.reps = editSetData.reps;
      targetSet.weight = editSetData.weight;
      targetSet.duration = editSetData.duration;
    }

    try {
      await WorkoutSessionService.updateWorkoutSession(activeSession._id, {
        exercises: updatedSession.exercises,
      });

      setActiveSession(updatedSession);
      setEditSetDialogOpen(false);
      setEditingSet(null);
      toast.success('Set updated!');
    } catch (error) {
      toast.error('Failed to update set');
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <MaterialAppLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </MaterialAppLayout>
    );
  }

  if (!activeSession) {
    return (
      <MaterialAppLayout>
        {/* Start Workout Dialog */}
        <Dialog open={startDialogOpen} maxWidth="sm" fullWidth>
          <DialogTitle>Start New Workout</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                select
                label="Select Workout Plan"
                value={selectedWorkoutId}
                onChange={(e) => setSelectedWorkoutId(e.target.value)}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="">Choose a workout plan...</option>
                {availableWorkouts.map((workout) => (
                  <option key={workout._id} value={workout._id}>
                    {workout.name} ({workout.exercises.length} exercises)
                  </option>
                ))}
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => router.push('/dashboard')}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={startNewWorkout}
              disabled={!selectedWorkoutId}
              startIcon={<PlayArrowIcon />}
            >
              Start Workout
            </Button>
          </DialogActions>
        </Dialog>
      </MaterialAppLayout>
    );
  }

  const currentExercise = activeSession.exercises[currentExerciseIndex];
  // Handle both frontend (sets) and backend (completedSets) structures
  const currentSets = currentExercise?.sets || (currentExercise as any)?.completedSets || [];
  const currentSet = currentSets[currentSetIndex];
  const completedSets = currentSets.filter((set: any) => set.completed).length;
  const totalSets = currentSets.length || (currentExercise as any)?.plannedSets || 0;
  const completedExercises = activeSession.exercises.filter(ex => ex.completed).length;
  const totalExercises = activeSession.exercises.length;

  // Handle case where there are no exercises or current exercise is not valid
  if (!currentExercise || !currentExercise.exercise || !currentSet) {
    return (
      <MaterialAppLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column' }}>
          <FitnessCenterIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No exercises found in this workout
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This workout session doesn't have any exercises to complete
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => router.push('/dashboard')}
            startIcon={<CheckIcon />}
          >
            Return to Dashboard
          </Button>
        </Box>
      </MaterialAppLayout>
    );
  }

  return (
    <MaterialAppLayout>
      <Box sx={{ maxWidth: '800px', mx: 'auto', pb: 10 }}>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #10B981, #3B82F6)', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {activeSession.workoutPlan?.name || 'Active Workout'}
            </Typography>
            <Chip 
              icon={<TimerIcon />}
              label={formatTime(workoutTimer)}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1">
              Exercise {currentExerciseIndex + 1} of {totalExercises} • Set {currentSetIndex + 1} of {totalSets}
            </Typography>
            <Typography variant="body2">
              {completedExercises} exercises completed
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={(completedExercises / totalExercises) * 100}
            sx={{ 
              mt: 2, 
              height: 8, 
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.3)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'white'
              }
            }}
          />
        </Paper>

        {/* Current Exercise */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <FitnessCenterIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {currentExercise.exercise?.name || 'Unknown Exercise'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentExercise.exercise?.muscleGroups?.join(', ') || 'No muscle groups specified'}
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
              {currentExercise.exercise.description}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Current Set Info */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                Set {currentSetIndex + 1} of {totalSets}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 2 }}>
                {(currentSet?.reps || 0) > 0 && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {currentSet.reps}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Reps
                    </Typography>
                  </Box>
                )}
                
                {(currentSet?.weight || 0) > 0 && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                      {currentSet.weight}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      kg
                    </Typography>
                  </Box>
                )}
                
                {(currentSet?.duration || 0) > 0 && (
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                      {currentSet.duration}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      seconds
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                <IconButton 
                  onClick={() => {
                    setEditingSet({ exerciseIndex: currentExerciseIndex, setIndex: currentSetIndex });
                    setEditSetData({
                      reps: currentSet?.reps || 0,
                      weight: currentSet?.weight || 0,
                      duration: currentSet?.duration || 0,
                    });
                    setEditSetDialogOpen(true);
                  }}
                  size="small"
                >
                  <EditIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
              <Button
                variant="outlined"
                onClick={previousSet}
                disabled={currentExerciseIndex === 0 && currentSetIndex === 0}
                startIcon={<SkipPreviousIcon />}
              >
                Previous
              </Button>
              
              <Button
                variant="contained"
                onClick={completeSet}
                disabled={currentSet?.completed || false}
                startIcon={currentSet?.completed ? <CheckIcon /> : <CheckCircleIcon />}
                size="large"
                sx={{ 
                  minWidth: 120,
                  background: currentSet?.completed ? 'success.main' : 'linear-gradient(135deg, #10B981, #3B82F6)',
                  '&:hover': {
                    background: currentSet?.completed ? 'success.dark' : 'linear-gradient(135deg, #059669, #2563EB)',
                  }
                }}
              >
                {currentSet?.completed ? 'Completed' : 'Complete Set'}
              </Button>
              
              <Button
                variant="outlined"
                onClick={skipSet}
                startIcon={<SkipNextIcon />}
              >
                Skip
              </Button>
            </Box>

            {/* Set Progress */}
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Set Progress</Typography>
                <Typography variant="body2">{completedSets}/{totalSets} completed</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(completedSets / totalSets) * 100}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Exercise List */}
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Workout Progress
            </Typography>
            <Stepper activeStep={currentExerciseIndex} orientation="vertical">
              {activeSession.exercises.map((exercise, index) => (
                <Step key={exercise.exercise._id} completed={exercise.completed}>
                  <StepLabel>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: exercise.completed ? 'bold' : 'normal' }}>
                        {exercise.exercise?.name || 'Unknown Exercise'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(() => {
                          const sets = exercise.sets || (exercise as any).completedSets || [];
                          const completedCount = sets.filter((s: any) => s.completed).length;
                          const totalCount = sets.length;
                          return `${completedCount}/${totalCount} sets completed`;
                        })()}
                      </Typography>
                    </Box>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* Floating Action Buttons */}
        <Box sx={{ position: 'fixed', bottom: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Fab
            color="primary"
            onClick={() => setNotesDialogOpen(true)}
            sx={{ mb: 1 }}
          >
            <NotesIcon />
          </Fab>
          <Fab
            color="secondary"
            onClick={() => setCompleteDialogOpen(true)}
          >
            <StopIcon />
          </Fab>
        </Box>

        {/* Rest Timer */}
        {isResting && currentSet?.restTime && (
          <RestTimer
            seconds={currentSet.restTime}
            onComplete={() => setIsResting(false)}
            onSkip={() => setIsResting(false)}
          />
        )}

        {/* Complete Workout Dialog */}
        <Dialog open={completeDialogOpen} maxWidth="sm" fullWidth>
          <DialogTitle>Complete Workout</DialogTitle>
          <DialogContent>
            <Alert severity="success" sx={{ mb: 2 }}>
              Great job! You've completed your workout session.
            </Alert>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>Duration:</strong> {formatTime(workoutTimer)}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>Exercises Completed:</strong> {completedExercises}/{totalExercises}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Workout Notes (Optional)"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="How did the workout feel? Any notes for next time?"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCompleteDialogOpen(false)}>Continue Workout</Button>
            <Button 
              variant="contained" 
              onClick={completeWorkout}
              startIcon={<CheckCircleIcon />}
            >
              Finish Workout
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Set Dialog */}
        <Dialog open={editSetDialogOpen} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Set</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Reps"
                  value={editSetData.reps}
                  onChange={(e) => setEditSetData({ ...editSetData, reps: parseInt(e.target.value) || 0 })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Weight (kg)"
                  value={editSetData.weight}
                  onChange={(e) => setEditSetData({ ...editSetData, weight: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Duration (s)"
                  value={editSetData.duration}
                  onChange={(e) => setEditSetData({ ...editSetData, duration: parseInt(e.target.value) || 0 })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditSetDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={saveSetEdit} startIcon={<SaveIcon />}>
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notes Dialog */}
        <Dialog open={notesDialogOpen} maxWidth="sm" fullWidth>
          <DialogTitle>Workout Notes</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Add notes about your workout"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="How are you feeling? Any observations about your performance?"
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNotesDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setNotesDialogOpen(false)}>
              Save Notes
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MaterialAppLayout>
  );
}
