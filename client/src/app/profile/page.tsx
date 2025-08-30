'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Tab,
  Tabs,
  Badge,
  LinearProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Settings as SettingsIcon,
  FitnessCenter as FitnessCenterIcon,
  EmojiEvents as EmojiEventsIcon,
  CameraAlt as CameraAltIcon,
  Timeline as TimelineIcon,
  Star as StarIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  Notifications as NotificationsIcon,
  Scale as ScaleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { MaterialAppLayout } from '@/components/layout/MaterialAppLayout';
import { UserService, ProgressPhotoService, WorkoutSessionService } from '@/external-api';
import { User, ProgressPhoto, WorkoutSession, PaginatedResponse } from '@/lib/types';
import { UserStats, UserPreferences, Activity } from '@/external-api/user.service';
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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  
  const [editFormData, setEditFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
  });
  
  const [progressFormData, setProgressFormData] = useState({
    weight: 0,
    bodyFat: 0,
    caption: '',
    measurements: {
      chest: 0,
      waist: 0,
      hips: 0,
      biceps: 0,
      thighs: 0,
      neck: 0,
    },
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      
      // Only call endpoints that actually exist on the backend
      const promises = [
        UserService.getUserStats(user?._id), // This exists
        ProgressPhotoService.getProgressPhotos({ userId: user?._id, limit: 6 }), // Use main endpoint with userId filter
        WorkoutSessionService.getWorkoutSessions({ userId: user?._id, limit: 5 }), // Use main endpoint with userId filter
      ];

      const results = await Promise.allSettled(promises);
      
      // Handle stats (first promise)
      if (results[0].status === 'fulfilled') {
        setUserStats(results[0].value as UserStats);
      } else {
        console.warn('Failed to fetch user stats:', results[0].reason);
      }
      
      // Handle progress photos (second promise)
      if (results[1].status === 'fulfilled') {
        const photosResult = results[1].value as PaginatedResponse<ProgressPhoto>;
        setProgressPhotos(photosResult.data || []);
      } else {
        console.warn('Failed to fetch progress photos:', results[1].reason);
        setProgressPhotos([]);
      }
      
      // Handle workout sessions (third promise)
      if (results[2].status === 'fulfilled') {
        const workoutsResult = results[2].value as PaginatedResponse<WorkoutSession>;
        setRecentWorkouts(workoutsResult.data || []);
      } else {
        console.warn('Failed to fetch workout sessions:', results[2].reason);
        setRecentWorkouts([]);
      }

      // Set default preferences since endpoint doesn't exist yet
      setUserPreferences({
        notifications: {
          workoutReminders: true,
          challengeUpdates: true,
          socialUpdates: true,
          emailNotifications: false,
          pushNotifications: true,
        },
        privacy: {
          profileVisibility: 'public',
          workoutVisibility: 'public',
          progressVisibility: 'public',
        },
        units: {
          weight: 'kg',
          distance: 'km',
          height: 'cm',
        },
        theme: 'light',
      });

      // Set default activity since endpoint doesn't exist yet
      setRecentActivity([
        {
          _id: '1',
          userId: user?._id || '',
          type: 'workout',
          title: 'Completed workout',
          description: 'Great job on your fitness journey!',
          data: {},
          createdAt: new Date().toISOString(),
        }
      ]);
      
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const updatedUser = await UserService.updateUser(user!._id, editFormData);
      setUser(updatedUser);
      toast.success('Profile updated successfully!');
      setEditDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const result = await UserService.uploadAvatar(file);
      const updatedUser = await UserService.updateUser(user!._id, { avatar: result.avatarUrl });
      setUser(updatedUser);
      toast.success('Avatar updated successfully!');
    } catch (error) {
      toast.error('Failed to upload avatar');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      handleAvatarUpload(file);
    }
  };

  const handleProgressPhotoUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a photo');
      return;
    }

    try {
      await ProgressPhotoService.createProgressPhoto(selectedFile, {
        caption: progressFormData.caption,
        weight: progressFormData.weight > 0 ? progressFormData.weight : undefined,
        bodyFat: progressFormData.bodyFat > 0 ? progressFormData.bodyFat : undefined,
        measurements: progressFormData.measurements,
        isPublic: true,
        tags: ['progress', 'transformation'],
      });
      toast.success('Progress photo uploaded!');
      setProgressDialogOpen(false);
      setSelectedFile(null);
      setProgressFormData({
        weight: 0,
        bodyFat: 0,
        caption: '',
        measurements: {
          chest: 0,
          waist: 0,
          hips: 0,
          biceps: 0,
          thighs: 0,
          neck: 0,
        },
      });
      fetchUserData();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload progress photo');
    }
  };

  const handleUpdatePreferences = async (updatedPreferences: Partial<UserPreferences>) => {
    try {
      // Since the backend endpoint doesn't exist yet, just update local state
      if (userPreferences) {
        setUserPreferences({ ...userPreferences, ...updatedPreferences });
        toast.success('Preferences updated locally!');
      }
      
      // TODO: Uncomment when backend endpoint is implemented
      // const newPreferences = await UserService.updateUserPreferences(updatedPreferences);
      // setUserPreferences(newPreferences);
      // toast.success('Preferences updated!');
    } catch (error) {
      toast.error('Failed to update preferences');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'workout': return <FitnessCenterIcon />;
      case 'challenge': return <EmojiEventsIcon />;
      case 'progress_photo': return <CameraAltIcon />;
      case 'achievement': return <StarIcon />;
      default: return <PersonIcon />;
    }
  };

  if (isLoading) {
    return (
      <MaterialAppLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading profile...
            </Typography>
          </Box>
        </Box>
      </MaterialAppLayout>
    );
  }

  return (
    <MaterialAppLayout>
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        {/* Profile Header */}
        <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <IconButton
                      size="small"
                      sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <PhotoCameraIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <Avatar
                    src={user?.avatar}
                    sx={{ width: 120, height: 120, border: '4px solid white', cursor: 'pointer' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <PersonIcon sx={{ fontSize: 60 }} />
                  </Avatar>
                </Badge>
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {user?.username}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                {user?.email}
              </Typography>
              {user?.bio && (
                <Typography variant="body1" sx={{ opacity: 0.8, mb: 2 }}>
                  {user.bio}
                </Typography>
              )}
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Member since {formatDate(user?.createdAt || '')}
              </Typography>
            </Grid>
            
            <Grid size={{ xs: 12, md: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => setEditDialogOpen(true)}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => setSettingsDialogOpen(true)}
                  sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                >
                  Settings
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <FitnessCenterIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {userStats?.totalWorkouts || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Workouts
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <EmojiEventsIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                  {userStats?.currentStreak || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Day Streak
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TimelineIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  {Math.round(userStats?.averageWorkoutDuration || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Minutes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CameraAltIcon sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                  {progressPhotos.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Progress Photos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Overview" />
            <Tab label="Progress Photos" />
            <Tab label="Recent Activity" />
            <Tab label="Achievements" />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Recent Workouts */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                    <FitnessCenterIcon sx={{ mr: 1 }} />
                    Recent Workouts
                  </Typography>
                  <List>
                    {recentWorkouts.slice(0, 5).map((workout, index) => (
                      <ListItem key={workout._id} divider={index < 4}>
                        <ListItemIcon>
                          <FitnessCenterIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={workout.workoutPlan?.name || 'Custom Workout'}
                          secondary={`${formatDate(workout.createdAt)} • ${workout.duration || 0} min`}
                        />
                        <Chip
                          label={workout.status}
                          size="small"
                          color={workout.status === 'completed' ? 'success' : 'default'}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Fitness Goals Progress */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                    <TrendingUpIcon sx={{ mr: 1 }} />
                    Progress Goals
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Monthly Workouts</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {Math.min(userStats?.totalWorkouts || 0, 20)}/20
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((userStats?.totalWorkouts || 0) / 20 * 100, 100)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Streak Goal</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {Math.min(userStats?.currentStreak || 0, 30)}/30 days
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
                      <Typography variant="body2">Exercise Variety</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {Math.min(userStats?.totalExercises || 0, 100)}/100
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((userStats?.totalExercises || 0) / 100 * 100, 100)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Progress Photos ({progressPhotos.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<CameraAltIcon />}
              onClick={() => setProgressDialogOpen(true)}
              sx={{ 
                background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669, #2563EB)',
                }
              }}
            >
              Add Photo
            </Button>
          </Box>

          {progressPhotos.length > 0 ? (
            <Grid container spacing={3}>
              {progressPhotos.map((photo) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={photo._id}>
                  <Card>
                    <Box
                      component="img"
                      src={photo.imageUrl}
                      alt="Progress photo"
                      sx={{ width: '100%', height: 200, objectFit: 'cover' }}
                    />
                    <CardContent>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {formatDate(photo.createdAt)}
                      </Typography>
                      {photo.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {photo.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {photo.weight && (
                          <Chip size="small" label={`${photo.weight}kg`} icon={<ScaleIcon />} />
                        )}
                        {photo.bodyFatPercentage && (
                          <Chip size="small" label={`${photo.bodyFatPercentage}% BF`} />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <CameraAltIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                No progress photos yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Start documenting your fitness journey!
              </Typography>
              <Button 
                variant="contained"
                startIcon={<CameraAltIcon />}
                onClick={() => setProgressDialogOpen(true)}
                sx={{ 
                  background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669, #2563EB)',
                  }
                }}
              >
                Upload First Photo
              </Button>
            </Paper>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Recent Activity
              </Typography>
              <List>
                {recentActivity.map((activity, index) => (
                  <ListItem key={activity._id} divider={index < recentActivity.length - 1}>
                    <ListItemIcon>
                      {getActivityIcon(activity.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.title}
                      secondary={`${activity.description} • ${formatDate(activity.createdAt)}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <EmojiEventsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              Achievements Coming Soon
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Keep working out to unlock achievements and badges!
            </Typography>
          </Paper>
        </TabPanel>

        {/* Edit Profile Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Username"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Bio"
                  multiline
                  rows={3}
                  value={editFormData.bio}
                  onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleUpdateProfile}>Save Changes</Button>
          </DialogActions>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Settings & Preferences</DialogTitle>
          <DialogContent>
            {userPreferences && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <NotificationsIcon sx={{ mr: 1 }} />
                  Notifications
                </Typography>
                <Box sx={{ pl: 2, mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPreferences.notifications.workoutReminders}
                        onChange={(e) => handleUpdatePreferences({
                          notifications: { ...userPreferences.notifications, workoutReminders: e.target.checked }
                        })}
                      />
                    }
                    label="Workout Reminders"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPreferences.notifications.challengeUpdates}
                        onChange={(e) => handleUpdatePreferences({
                          notifications: { ...userPreferences.notifications, challengeUpdates: e.target.checked }
                        })}
                      />
                    }
                    label="Challenge Updates"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPreferences.notifications.emailNotifications}
                        onChange={(e) => handleUpdatePreferences({
                          notifications: { ...userPreferences.notifications, emailNotifications: e.target.checked }
                        })}
                      />
                    }
                    label="Email Notifications"
                  />
                </Box>

                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <VisibilityIcon sx={{ mr: 1 }} />
                  Privacy
                </Typography>
                <Box sx={{ pl: 2, mb: 3 }}>
                  <TextField
                    select
                    fullWidth
                    label="Profile Visibility"
                    value={userPreferences.privacy.profileVisibility}
                    onChange={(e) => handleUpdatePreferences({
                      privacy: { ...userPreferences.privacy, profileVisibility: e.target.value as any }
                    })}
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="public">Public</MenuItem>
                    <MenuItem value="friends">Friends Only</MenuItem>
                    <MenuItem value="private">Private</MenuItem>
                  </TextField>
                  <TextField
                    select
                    fullWidth
                    label="Workout Visibility"
                    value={userPreferences.privacy.workoutVisibility}
                    onChange={(e) => handleUpdatePreferences({
                      privacy: { ...userPreferences.privacy, workoutVisibility: e.target.value as any }
                    })}
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="public">Public</MenuItem>
                    <MenuItem value="friends">Friends Only</MenuItem>
                    <MenuItem value="private">Private</MenuItem>
                  </TextField>
                </Box>

                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <ScaleIcon sx={{ mr: 1 }} />
                  Units
                </Typography>
                <Box sx={{ pl: 2, mb: 3 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        select
                        fullWidth
                        label="Weight"
                        value={userPreferences.units.weight}
                        onChange={(e) => handleUpdatePreferences({
                          units: { ...userPreferences.units, weight: e.target.value as any }
                        })}
                      >
                        <MenuItem value="kg">Kilograms</MenuItem>
                        <MenuItem value="lbs">Pounds</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        select
                        fullWidth
                        label="Distance"
                        value={userPreferences.units.distance}
                        onChange={(e) => handleUpdatePreferences({
                          units: { ...userPreferences.units, distance: e.target.value as any }
                        })}
                      >
                        <MenuItem value="km">Kilometers</MenuItem>
                        <MenuItem value="miles">Miles</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        select
                        fullWidth
                        label="Height"
                        value={userPreferences.units.height}
                        onChange={(e) => handleUpdatePreferences({
                          units: { ...userPreferences.units, height: e.target.value as any }
                        })}
                      >
                        <MenuItem value="cm">Centimeters</MenuItem>
                        <MenuItem value="ft">Feet</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSettingsDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Progress Photo Upload Dialog */}
        <Dialog open={progressDialogOpen} onClose={() => setProgressDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Progress Photo</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) setSelectedFile(file);
                    };
                    input.click();
                  }}
                  sx={{ height: 120, border: '2px dashed', borderColor: 'primary.main' }}
                >
                  {selectedFile ? selectedFile.name : 'Click to select photo'}
                </Button>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Caption"
                  multiline
                  rows={2}
                  value={progressFormData.caption}
                  onChange={(e) => setProgressFormData({ ...progressFormData, caption: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Weight (kg)"
                  value={progressFormData.weight || ''}
                  onChange={(e) => setProgressFormData({ ...progressFormData, weight: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Body Fat %"
                  value={progressFormData.bodyFat || ''}
                  onChange={(e) => setProgressFormData({ ...progressFormData, bodyFat: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setProgressDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleProgressPhotoUpload} disabled={!selectedFile}>
              Upload Photo
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MaterialAppLayout>
  );
}
