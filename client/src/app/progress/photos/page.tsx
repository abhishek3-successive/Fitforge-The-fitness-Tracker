'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { MaterialAppLayout } from '@/components/layout/MaterialAppLayout';
import { ProgressPhotoService } from '@/external-api';
import { ProgressPhoto } from '@/lib/types';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/auth-store';

const PHOTO_CATEGORIES = [
  { value: 'front', label: 'Front View', color: 'primary' as const },
  { value: 'side', label: 'Side View', color: 'secondary' as const },
  { value: 'back', label: 'Back View', color: 'success' as const },
  { value: 'face', label: 'Face', color: 'info' as const },
  { value: 'transformation', label: 'Transformation', color: 'warning' as const },
  { value: 'other', label: 'Other', color: 'default' as const },
];

export default function ProgressPhotosPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states for new photo
  const [newPhoto, setNewPhoto] = useState({
    description: '',
    category: 'front' as ProgressPhoto['category'],
    weight: '',
    bodyFatPercentage: '',
    measurements: {
      chest: '',
      waist: '',
      hips: '',
      biceps: '',
      thighs: '',
      neck: '',
    },
    tags: '',
    isPublic: true,
    file: null as File | null,
    preview: null as string | null,
  });

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      fetchPhotos();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchPhotos = async () => {
    try {
      setIsLoading(true);
      const response = await ProgressPhotoService.getUserProgressPhotos();
      setPhotos(response.data || []);
    } catch (error) {
      console.error('Failed to fetch progress photos:', error);
      toast.error('Failed to load progress photos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setNewPhoto(prev => ({
          ...prev,
          file,
          preview: e.target?.result as string,
        }));
        setUploadDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!newPhoto.file || !newPhoto.description.trim()) {
      toast.error('Please provide a description and select an image');
      return;
    }

    try {
      setIsUploading(true);
      
      const photoData = {
        caption: newPhoto.description,
        category: newPhoto.category,
        weight: newPhoto.weight ? parseFloat(newPhoto.weight) : undefined,
        bodyFat: newPhoto.bodyFatPercentage ? parseFloat(newPhoto.bodyFatPercentage) : undefined,
        measurements: {
          chest: newPhoto.measurements.chest ? parseFloat(newPhoto.measurements.chest) : undefined,
          waist: newPhoto.measurements.waist ? parseFloat(newPhoto.measurements.waist) : undefined,
          hips: newPhoto.measurements.hips ? parseFloat(newPhoto.measurements.hips) : undefined,
          biceps: newPhoto.measurements.biceps ? parseFloat(newPhoto.measurements.biceps) : undefined,
          thighs: newPhoto.measurements.thighs ? parseFloat(newPhoto.measurements.thighs) : undefined,
          neck: newPhoto.measurements.neck ? parseFloat(newPhoto.measurements.neck) : undefined,
        },
        isPublic: newPhoto.isPublic,
        tags: newPhoto.tags ? newPhoto.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : []
      };      const createdPhoto = await ProgressPhotoService.createProgressPhoto(newPhoto.file, photoData);
      setPhotos(prev => [createdPhoto, ...prev]);
      toast.success('Progress photo uploaded successfully!');
      handleCloseUploadDialog();
    } catch (error) {
      console.error('Failed to upload photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setNewPhoto({
      description: '',
      category: 'front' as ProgressPhoto['category'],
      weight: '',
      bodyFatPercentage: '',
      measurements: {
        chest: '',
        waist: '',
        hips: '',
        biceps: '',
        thighs: '',
        neck: '',
      },
      tags: '',
      isPublic: false,
      file: null,
      preview: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await ProgressPhotoService.deleteProgressPhoto(photoId);
      setPhotos(prev => prev.filter(photo => photo._id !== photoId));
      toast.success('Photo deleted successfully');
    } catch (error) {
      console.error('Failed to delete photo:', error);
      toast.error('Failed to delete photo');
    }
  };

  const handleViewPhoto = (photo: ProgressPhoto) => {
    setSelectedPhoto(photo);
    setViewDialogOpen(true);
  };

  const filteredPhotos = filterCategory === 'all' 
    ? photos 
    : photos.filter(photo => photo.category === filterCategory);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    return PHOTO_CATEGORIES.find(cat => cat.value === category)?.color || 'default';
  };

  if (!isAuthenticated) {
    return (
      <MaterialAppLayout>
        <Box sx={{ maxWidth: '1200px', mx: 'auto', py: 4 }}>
          <Alert severity="warning">
            Please sign in to view and manage your progress photos.
          </Alert>
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
            Progress Photos
          </Typography>
          <Button
            variant="contained"
            startIcon={<PhotoCameraIcon />}
            onClick={() => fileInputRef.current?.click()}
          >
            Add Photo
          </Button>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
          gap: 3, 
          mb: 4 
        }}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                {photos.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Photos
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                {photos.length > 0 ? Math.ceil((Date.now() - new Date(photos[photos.length - 1].createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Months Tracked
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                {photos.filter(p => p.category === 'front').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Front Views
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                {new Set(photos.flatMap(p => p.tags)).size}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unique Tags
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Filter Chips */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          <Chip
            label="All Photos"
            onClick={() => setFilterCategory('all')}
            color={filterCategory === 'all' ? 'primary' : 'default'}
            variant={filterCategory === 'all' ? 'filled' : 'outlined'}
          />
          {PHOTO_CATEGORIES.map((category) => (
            <Chip
              key={category.value}
              label={category.label}
              onClick={() => setFilterCategory(category.value)}
              color={filterCategory === category.value ? category.color : 'default'}
              variant={filterCategory === category.value ? 'filled' : 'outlined'}
            />
          ))}
        </Box>

        {/* Photos Grid */}
        {isLoading ? (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, 
            gap: 3 
          }}>
            {[...Array(6)].map((_, index) => (
              <Card key={index}>
                <Skeleton variant="rectangular" height={300} />
                <CardContent>
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="60%" />
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : filteredPhotos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <PhotoCameraIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
              {photos.length === 0 ? 'No progress photos yet' : 'No photos in this category'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {photos.length === 0 
                ? 'Start documenting your fitness journey by adding your first photo'
                : 'Try selecting a different category or add more photos'
              }
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              Add Your First Photo
            </Button>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, 
            gap: 3 
          }}>
            {filteredPhotos.map((photo) => (
              <Card key={photo._id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    height="300"
                    image={photo.imageUrl}
                    alt={photo.description || 'Progress photo'}
                    sx={{ objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => handleViewPhoto(photo)}
                  />
                  <IconButton
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuAnchor(e.currentTarget);
                      setSelectedPhoto(photo);
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {photo.description || 'Progress Photo'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                    {photo.description}
                  </Typography>
                  
                  {/* Body stats */}
                  {(photo.weight || photo.bodyFatPercentage) && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Body Stats:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {photo.weight && (
                          <Chip label={`${photo.weight} lbs`} size="small" variant="outlined" />
                        )}
                        {photo.bodyFatPercentage && (
                          <Chip label={`${photo.bodyFatPercentage}% BF`} size="small" variant="outlined" />
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Category and tags */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    <Chip 
                      label={PHOTO_CATEGORIES.find(cat => cat.value === photo.category)?.label || photo.category}
                      size="small"
                      color={getCategoryColor(photo.category)}
                    />
                    {photo.tags.slice(0, 2).map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                    {photo.tags.length > 2 && (
                      <Chip label={`+${photo.tags.length - 2}`} size="small" variant="outlined" />
                    )}
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    {formatDate(photo.createdAt)}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        {/* Upload Dialog */}
        <Dialog
          open={uploadDialogOpen}
          onClose={handleCloseUploadDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Add Progress Photo
            <IconButton
              onClick={handleCloseUploadDialog}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mt: 2 }}>
              {/* Photo preview */}
              <Box sx={{ flex: 1 }}>
                {newPhoto.preview && (
                  <Box sx={{ textAlign: 'center' }}>
                    <img
                      src={newPhoto.preview}
                      alt="Preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '400px',
                        borderRadius: '8px',
                        objectFit: 'contain',
                      }}
                    />
                  </Box>
                )}
              </Box>

              {/* Form fields */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Description *"
                  value={newPhoto.description}
                  onChange={(e) => setNewPhoto(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add notes about your progress, training, diet, etc."
                  multiline
                  rows={3}
                />

                <TextField
                  fullWidth
                  select
                  label="Category"
                  value={newPhoto.category}
                  onChange={(e) => setNewPhoto(prev => ({ ...prev, category: e.target.value as ProgressPhoto['category'] }))}
                >
                  {PHOTO_CATEGORIES.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Weight (lbs)"
                    type="number"
                    value={newPhoto.weight}
                    onChange={(e) => setNewPhoto(prev => ({ ...prev, weight: e.target.value }))}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Body Fat %"
                    type="number"
                    value={newPhoto.bodyFatPercentage}
                    onChange={(e) => setNewPhoto(prev => ({ ...prev, bodyFatPercentage: e.target.value }))}
                    sx={{ flex: 1 }}
                  />
                </Box>

                <TextField
                  fullWidth
                  label="Tags"
                  value={newPhoto.tags}
                  onChange={(e) => setNewPhoto(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g., progress, before, after, bulk, cut"
                  helperText="Separate tags with commas"
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseUploadDialog}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={isUploading || !newPhoto.description.trim()}
              startIcon={isUploading ? <CircularProgress size={20} /> : <AddIcon />}
            >
              {isUploading ? 'Uploading...' : 'Add Photo'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Photo Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          {selectedPhoto && (
            <>
              <DialogTitle>
                {selectedPhoto.description || 'Progress Photo'}
                <IconButton
                  onClick={() => setViewDialogOpen(false)}
                  sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                  <Box sx={{ flex: 2 }}>
                    <img
                      src={selectedPhoto.imageUrl}
                      alt={selectedPhoto.description || 'Progress photo'}
                      style={{
                        width: '100%',
                        maxHeight: '600px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Photo Details
                    </Typography>
                    
                    {selectedPhoto.description && (
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {selectedPhoto.description}
                      </Typography>
                    )}

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Category:
                      </Typography>
                      <Chip 
                        label={PHOTO_CATEGORIES.find(cat => cat.value === selectedPhoto.category)?.label || selectedPhoto.category}
                        color={getCategoryColor(selectedPhoto.category)}
                      />
                    </Box>

                    {(selectedPhoto.weight || selectedPhoto.bodyFatPercentage) && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Body Stats:
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {selectedPhoto.weight && (
                            <Typography variant="body2">Weight: {selectedPhoto.weight} lbs</Typography>
                          )}
                          {selectedPhoto.bodyFatPercentage && (
                            <Typography variant="body2">Body Fat: {selectedPhoto.bodyFatPercentage}%</Typography>
                          )}
                        </Box>
                      </Box>
                    )}

                    {selectedPhoto.tags.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Tags:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selectedPhoto.tags.map((tag) => (
                            <Chip key={tag} label={tag} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    )}

                    <Typography variant="body2" color="text.secondary">
                      Taken on {formatDate(selectedPhoto.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </DialogContent>
            </>
          )}
        </Dialog>

        {/* Action Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem onClick={() => {
            if (selectedPhoto) handleViewPhoto(selectedPhoto);
            setMenuAnchor(null);
          }}>
            <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            setMenuAnchor(null);
            toast.info('Edit functionality coming soon');
          }}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            if (selectedPhoto) handleDeletePhoto(selectedPhoto._id);
            setMenuAnchor(null);
          }} sx={{ color: 'error.main' }}>
            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    </MaterialAppLayout>
  );
}