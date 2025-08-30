'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Grid,
  Chip,
  IconButton,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormLabel,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  FitnessCenter as FitnessCenterIcon,
  AccessTime as AccessTimeIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { WorkoutPlanService, ExerciseService } from '@/external-api';
import { Exercise, WorkoutDay, WorkoutPlanExercise } from '@/lib/types';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/auth-store';

interface CreateWorkoutPlanDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const goalOptions = [
  { value: 'weight-loss', label: 'Weight Loss' },
  { value: 'muscle-gain', label: 'Muscle Gain' },
  { value: 'strength', label: 'Strength Training' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'general-fitness', label: 'General Fitness' },
];

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const equipmentOptions = [
  'None', 'Barbell', 'Dumbbells', 'Kettlebell', 'Resistance Bands',
  'Pull-up Bar', 'Bench', 'Cable Machine', 'Treadmill',
  'Stationary Bike', 'Medicine Ball', 'Foam Roller', 'Yoga Mat'
];

const targetAudienceOptions = [
  'All', 'Beginners', 'Men', 'Women', 'Seniors', 'Youth', 'Athletes'
];

export default function CreateWorkoutPlanDialog({ open, onClose, onSuccess }: CreateWorkoutPlanDialogProps) {
  const { user } = useAuthStore();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal: 'general-fitness' as const,
    difficulty: 'beginner' as const,
    duration: 4, // weeks
    daysPerWeek: 3,
    equipment: [] as string[],
    targetAudience: [] as string[],
    tags: [] as string[],
    isPublic: false,
  });

  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([
    { dayName: 'Day 1', exercises: [] }
  ]);

  const [tagInput, setTagInput] = useState('');

  const steps = [
    'Basic Information',
    'Plan Details',
    'Workout Days',
    'Review & Save'
  ];

  // Load exercises on mount
  useEffect(() => {
    if (open) {
      loadExercises();
    }
  }, [open]);

  const loadExercises = async () => {
    try {
      const response = await ExerciseService.getExercises({ limit: 100 });
      setExercises(response.data || []);
    } catch (error) {
      console.error('Failed to load exercises:', error);
      toast.error('Failed to load exercises');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddWorkoutDay = () => {
    setWorkoutDays(prev => [
      ...prev,
      { dayName: `Day ${prev.length + 1}`, exercises: [] }
    ]);
  };

  const handleRemoveWorkoutDay = (index: number) => {
    if (workoutDays.length > 1) {
      setWorkoutDays(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleAddExerciseToDay = (dayIndex: number, exercise: Exercise) => {
    const newExercise: WorkoutPlanExercise = {
      exercise,
      sets: 3,
      reps: 10,
      weight: 0,
      duration: 0,
      restTime: 60,
      notes: ''
    };

    setWorkoutDays(prev => prev.map((day, i) => 
      i === dayIndex 
        ? { ...day, exercises: [...day.exercises, newExercise] }
        : day
    ));
  };

  const handleUpdateExercise = (dayIndex: number, exerciseIndex: number, field: string, value: any) => {
    setWorkoutDays(prev => prev.map((day, i) => 
      i === dayIndex 
        ? {
            ...day,
            exercises: day.exercises.map((ex, j) => 
              j === exerciseIndex 
                ? { ...ex, [field]: value }
                : ex
            )
          }
        : day
    ));
  };

  const handleRemoveExercise = (dayIndex: number, exerciseIndex: number) => {
    setWorkoutDays(prev => prev.map((day, i) => 
      i === dayIndex 
        ? { ...day, exercises: day.exercises.filter((_, j) => j !== exerciseIndex) }
        : day
    ));
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to create a workout plan');
      return;
    }

    if (!user._id) {
      toast.error('User ID is missing. Please try logging in again.');
      return;
    }

    try {
      setIsLoading(true);
      
      console.log('🔍 User object:', user);
      console.log('🆔 User ID:', user._id);

      // Map equipment to backend enum values
      const mappedEquipment = formData.equipment.map(eq => {
        const mapping: { [key: string]: string } = {
          'None': 'none',
          'Barbell': 'barbell',
          'Dumbbells': 'dumbbell',
          'Kettlebell': 'kettlebell',
          'Resistance Bands': 'resistance-band',
          'Pull-up Bar': 'pull-up-bar',
          'Bench': 'bench',
          'Cable Machine': 'cable-machine',
          'Treadmill': 'treadmill',
          'Stationary Bike': 'stationary-bike',
          'Medicine Ball': 'medicine-ball',
          'Foam Roller': 'foam-roller',
          'Yoga Mat': 'yoga-mat'
        };
        return mapping[eq] || 'none';
      });

      // Map target audience to backend enum values
      const mappedTargetAudience = formData.targetAudience.map(audience => {
        const mapping: { [key: string]: string } = {
          'All': 'all',
          'Beginners': 'beginners',
          'Men': 'men',
          'Women': 'women',
          'Seniors': 'seniors',
          'Youth': 'teens',
          'Athletes': 'athletes'
        };
        return mapping[audience] || 'all';
      });

      const planData = {
        title: formData.title,
        description: formData.description,
        workoutDays: workoutDays.map(day => ({
          dayName: day.dayName,
          exercises: day.exercises.map(ex => ({
            exercise: ex.exercise._id, // Send only the ID
            sets: ex.sets,
            reps: ex.reps || 0,
            weight: ex.weight || 0,
            duration: ex.duration || 0,
            restBetweenSets: ex.restTime || 60, // Map restTime to restBetweenSets
            notes: ex.notes || ''
          }))
        })),
        duration: formData.duration,
        difficulty: formData.difficulty,
        goal: formData.goal,
        tags: formData.tags,
        isPublic: formData.isPublic,
        equipment: mappedEquipment,
        targetAudience: mappedTargetAudience,
        daysPerWeek: formData.daysPerWeek,
        createdBy: user._id, // Add the required createdBy field
      };

      console.log('📝 Creating workout plan with data:', planData);
      await WorkoutPlanService.createWorkoutPlan(planData);
      
      toast.success('Workout plan created successfully!');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('❌ Failed to create workout plan:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create workout plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      title: '',
      description: '',
      goal: 'general-fitness',
      difficulty: 'beginner',
      duration: 4,
      daysPerWeek: 3,
      equipment: [],
      targetAudience: [],
      tags: [],
      isPublic: false,
    });
    setWorkoutDays([{ dayName: 'Day 1', exercises: [] }]);
    setActiveStep(0);
    setTagInput('');
    onClose();
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return formData.title.trim() && formData.description.trim();
      case 1:
        return formData.duration > 0 && formData.daysPerWeek > 0;
      case 2:
        return workoutDays.some(day => day.exercises.length > 0);
      default:
        return true;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Create Workout Plan
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Step 1: Basic Information */}
          <Step>
            <StepLabel>Basic Information</StepLabel>
            <StepContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Plan Title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Full Body Strength Training"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your workout plan, its goals, and what makes it unique..."
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Primary Goal"
                    value={formData.goal}
                    onChange={(e) => handleInputChange('goal', e.target.value)}
                  >
                    {goalOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Difficulty Level"
                    value={formData.difficulty}
                    onChange={(e) => handleInputChange('difficulty', e.target.value)}
                  >
                    {difficultyOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid(0)}
                  sx={{ mr: 1 }}
                >
                  Continue
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 2: Plan Details */}
          <Step>
            <StepLabel>Plan Details</StepLabel>
            <StepContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Duration (weeks)"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 1)}
                    inputProps={{ min: 1, max: 52 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Days per Week"
                    value={formData.daysPerWeek}
                    onChange={(e) => handleInputChange('daysPerWeek', parseInt(e.target.value) || 1)}
                    inputProps={{ min: 1, max: 7 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Autocomplete
                    multiple
                    options={equipmentOptions}
                    value={formData.equipment}
                    onChange={(_, value) => handleInputChange('equipment', value)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Required Equipment"
                        placeholder="Select equipment needed"
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Autocomplete
                    multiple
                    options={targetAudienceOptions}
                    value={formData.targetAudience}
                    onChange={(_, value) => handleInputChange('targetAudience', value)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Target Audience"
                        placeholder="Who is this plan for?"
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      {formData.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          onDelete={() => handleRemoveTag(tag)}
                          size="small"
                        />
                      ))}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        placeholder="Add tag"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button onClick={handleAddTag} variant="outlined" size="small">
                        Add
                      </Button>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.isPublic}
                        onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                      />
                    }
                    label="Make this plan public (others can view and clone it)"
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Button onClick={handleNext} disabled={!isStepValid(1)} sx={{ mr: 1 }}>
                  Continue
                </Button>
                <Button onClick={handleBack}>
                  Back
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 3: Workout Days */}
          <Step>
            <StepLabel>Workout Days</StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                <Button
                  onClick={handleAddWorkoutDay}
                  startIcon={<AddIcon />}
                  variant="outlined"
                  size="small"
                >
                  Add Workout Day
                </Button>
              </Box>

              {workoutDays.map((day, dayIndex) => (
                <Paper key={dayIndex} sx={{ p: 3, mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <TextField
                      size="small"
                      value={day.dayName}
                      onChange={(e) => {
                        setWorkoutDays(prev => prev.map((d, i) => 
                          i === dayIndex ? { ...d, dayName: e.target.value } : d
                        ));
                      }}
                    />
                    {workoutDays.length > 1 && (
                      <IconButton
                        onClick={() => handleRemoveWorkoutDay(dayIndex)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Autocomplete
                      options={exercises}
                      getOptionLabel={(option) => option.name}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Box>
                            <Typography variant="body2">{option.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.muscleGroups?.join(', ')} • {option.difficulty}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          placeholder="Add exercise to this day"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: <FitnessCenterIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                          }}
                        />
                      )}
                      onChange={(_, exercise) => {
                        if (exercise) {
                          handleAddExerciseToDay(dayIndex, exercise);
                        }
                      }}
                      value={null}
                    />
                  </Box>

                  {day.exercises.map((exercise, exerciseIndex) => (
                    <Card key={exerciseIndex} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {exercise.exercise.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {exercise.exercise.muscleGroups?.join(', ')}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveExercise(dayIndex, exerciseIndex)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>

                        <Grid container spacing={2}>
                          <Grid size={{ xs: 6, md: 2 }}>
                            <TextField
                              size="small"
                              type="number"
                              label="Sets"
                              value={exercise.sets}
                              onChange={(e) => handleUpdateExercise(dayIndex, exerciseIndex, 'sets', parseInt(e.target.value) || 1)}
                              inputProps={{ min: 1 }}
                            />
                          </Grid>
                          <Grid size={{ xs: 6, md: 2 }}>
                            <TextField
                              size="small"
                              type="number"
                              label="Reps"
                              value={exercise.reps || 0}
                              onChange={(e) => handleUpdateExercise(dayIndex, exerciseIndex, 'reps', parseInt(e.target.value) || 0)}
                              inputProps={{ min: 0 }}
                            />
                          </Grid>
                          <Grid size={{ xs: 6, md: 2 }}>
                            <TextField
                              size="small"
                              type="number"
                              label="Weight (kg)"
                              value={exercise.weight || 0}
                              onChange={(e) => handleUpdateExercise(dayIndex, exerciseIndex, 'weight', parseFloat(e.target.value) || 0)}
                              inputProps={{ min: 0, step: 0.5 }}
                            />
                          </Grid>
                          <Grid size={{ xs: 6, md: 2 }}>
                            <TextField
                              size="small"
                              type="number"
                              label="Duration (s)"
                              value={exercise.duration || 0}
                              onChange={(e) => handleUpdateExercise(dayIndex, exerciseIndex, 'duration', parseInt(e.target.value) || 0)}
                              inputProps={{ min: 0 }}
                            />
                          </Grid>
                          <Grid size={{ xs: 6, md: 2 }}>
                            <TextField
                              size="small"
                              type="number"
                              label="Rest (s)"
                              value={exercise.restTime || 60}
                              onChange={(e) => handleUpdateExercise(dayIndex, exerciseIndex, 'restTime', parseInt(e.target.value) || 60)}
                              inputProps={{ min: 0 }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              size="small"
                              multiline
                              rows={2}
                              fullWidth
                              label="Notes"
                              value={exercise.notes || ''}
                              onChange={(e) => handleUpdateExercise(dayIndex, exerciseIndex, 'notes', e.target.value)}
                              placeholder="Any specific instructions or modifications..."
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}

                  {day.exercises.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      <FitnessCenterIcon sx={{ fontSize: 48, mb: 1 }} />
                      <Typography variant="body2">
                        No exercises added to this day yet
                      </Typography>
                    </Box>
                  )}
                </Paper>
              ))}

              <Box sx={{ mt: 2 }}>
                <Button onClick={handleNext} disabled={!isStepValid(2)} sx={{ mr: 1 }}>
                  Continue
                </Button>
                <Button onClick={handleBack}>
                  Back
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 4: Review & Save */}
          <Step>
            <StepLabel>Review & Save</StepLabel>
            <StepContent>
              <Alert severity="info" sx={{ mb: 3 }}>
                Review your workout plan details before creating it.
              </Alert>

              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Plan Overview
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" color="text.secondary">Title</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{formData.title}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" color="text.secondary">Goal</Typography>
                    <Typography variant="body1">{goalOptions.find(g => g.value === formData.goal)?.label}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" color="text.secondary">Difficulty</Typography>
                    <Typography variant="body1">{difficultyOptions.find(d => d.value === formData.difficulty)?.label}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="body2" color="text.secondary">Duration</Typography>
                    <Typography variant="body1">{formData.duration} weeks, {formData.daysPerWeek} days/week</Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary">Description</Typography>
                    <Typography variant="body1">{formData.description}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Workout Days ({workoutDays.length})
                </Typography>
                {workoutDays.map((day, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {day.dayName} - {day.exercises.length} exercises
                    </Typography>
                    {day.exercises.map((exercise, exIndex) => (
                      <Typography key={exIndex} variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                        • {exercise.exercise.name}: {exercise.sets} sets × {exercise.reps} reps
                      </Typography>
                    ))}
                  </Box>
                ))}
              </Paper>

              <Box sx={{ mt: 3 }}>
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  disabled={isLoading}
                  startIcon={isLoading ? null : <SaveIcon />}
                  sx={{
                    mr: 1,
                    background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669, #2563EB)',
                    }
                  }}
                >
                  {isLoading ? 'Creating...' : 'Create Workout Plan'}
                </Button>
                <Button onClick={handleBack}>
                  Back
                </Button>
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </DialogContent>
    </Dialog>
  );
}
