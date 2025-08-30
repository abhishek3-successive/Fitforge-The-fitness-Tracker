import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExerciseService, ExerciseFilters, CreateExerciseData } from '@/external-api';
import { Exercise } from '@/lib/types';

// Query Keys
export const exerciseKeys = {
  all: ['exercises'] as const,
  lists: () => [...exerciseKeys.all, 'list'] as const,
  list: (filters: ExerciseFilters) => [...exerciseKeys.lists(), filters] as const,
  details: () => [...exerciseKeys.all, 'detail'] as const,
  detail: (id: string) => [...exerciseKeys.details(), id] as const,
  categories: () => [...exerciseKeys.all, 'categories'] as const,
  muscleGroups: () => [...exerciseKeys.all, 'muscleGroups'] as const,
  equipment: () => [...exerciseKeys.all, 'equipment'] as const,
  popular: () => [...exerciseKeys.all, 'popular'] as const,
  recommended: () => [...exerciseKeys.all, 'recommended'] as const,
} as const;

// Get Exercises Query
export const useExercises = (filters: ExerciseFilters = {}) => {
  return useQuery({
    queryKey: exerciseKeys.list(filters),
    queryFn: () => ExerciseService.getExercises(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get Exercise by ID Query
export const useExercise = (id: string) => {
  return useQuery({
    queryKey: exerciseKeys.detail(id),
    queryFn: () => ExerciseService.getExerciseById(id),
    enabled: !!id,
  });
};

// Get Exercise Categories Query
export const useExerciseCategories = () => {
  return useQuery({
    queryKey: exerciseKeys.categories(),
    queryFn: ExerciseService.getCategories,
    staleTime: 30 * 60 * 1000, // 30 minutes - categories don't change often
  });
};

// Get Muscle Groups Query
export const useMuscleGroups = () => {
  return useQuery({
    queryKey: exerciseKeys.muscleGroups(),
    queryFn: ExerciseService.getMuscleGroups,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Get Equipment Types Query
export const useEquipmentTypes = () => {
  return useQuery({
    queryKey: exerciseKeys.equipment(),
    queryFn: ExerciseService.getEquipmentTypes,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Get Popular Exercises Query
export const usePopularExercises = (limit = 10) => {
  return useQuery({
    queryKey: [...exerciseKeys.popular(), limit],
    queryFn: () => ExerciseService.getPopularExercises(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get Recommended Exercises Query
export const useRecommendedExercises = (limit = 10) => {
  return useQuery({
    queryKey: [...exerciseKeys.recommended(), limit],
    queryFn: () => ExerciseService.getRecommendedExercises(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Create Exercise Mutation
export const useCreateExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExerciseData) => ExerciseService.createExercise(data),
    onSuccess: () => {
      // Invalidate and refetch exercises queries
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: exerciseKeys.popular() });
      queryClient.invalidateQueries({ queryKey: exerciseKeys.recommended() });
    },
  });
};

// Update Exercise Mutation
export const useUpdateExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateExerciseData> }) => 
      ExerciseService.updateExercise(id, data),
    onSuccess: (updatedExercise: Exercise) => {
      // Update the exercise in the cache
      queryClient.setQueryData(
        exerciseKeys.detail(updatedExercise._id),
        updatedExercise
      );
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
    },
  });
};

// Delete Exercise Mutation
export const useDeleteExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ExerciseService.deleteExercise(id),
    onSuccess: (_, deletedId) => {
      // Remove the exercise from cache
      queryClient.removeQueries({ queryKey: exerciseKeys.detail(deletedId) });
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: exerciseKeys.lists() });
    },
  });
};
