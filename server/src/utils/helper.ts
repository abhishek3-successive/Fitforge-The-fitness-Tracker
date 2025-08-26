/**
 * Remove password field from user object
 */
export const excludePassword = (user: any) => {
  if (!user) return user;
  
  if (user.toObject) {
    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }
  
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Generate random string
 */
export const generateRandomString = (length: number = 10): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth: Date): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Calculate BMI (Body Mass Index)
 */
export const calculateBMI = (weight: number, height: number): number => {
  // weight in kg, height in cm
  const heightInMeters = height / 100;
  return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
};

/**
 * Get BMI category
 */
export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

/**
 * Calculate calories burned estimation
 */
export const estimateCaloriesBurned = (
  activityType: string,
  duration: number, // in minutes
  weight: number = 70 // in kg
): number => {
  // MET values for different activities
  const metValues: { [key: string]: number } = {
    'strength': 6.0,
    'cardio': 8.0,
    'flexibility': 2.5,
    'balance': 2.5,
    'plyometric': 8.5,
    'powerlifting': 6.0,
    'olympic': 6.0,
    'rehabilitation': 2.0
  };

  const met = metValues[activityType] || 5.0;
  const caloriesPerMinute = (met * weight * 3.5) / 200;
  
  return Math.round(caloriesPerMinute * duration);
};

/**
 * Format duration from minutes to human readable format
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
};

/**
 * Get time period label for date
 */
export const getTimePeriod = (date: Date): string => {
  const now = new Date();
  const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60);
    return `${diffInMinutes} minutes ago`;
  }
  
  if (diffInHours < 24) {
    return `${Math.floor(diffInHours)} hours ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }
  
  if (diffInDays < 30) {
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
};

/**
 * Capitalize first letter of string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert kebab-case to Title Case
 */
export const kebabToTitleCase = (str: string): string => {
  return str
    .split('-')
    .map(word => capitalize(word))
    .join(' ');
};
