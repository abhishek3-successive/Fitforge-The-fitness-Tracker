import { apiClient, handleApiError, handleApiResponse } from './client';
import { ProgressPhoto, PaginatedResponse } from '@/lib/types';

export interface ProgressPhotoFilters {
  userId?: string;
  startDate?: string;
  endDate?: string;
  isPublic?: boolean;
  tags?: string[];
  page?: number;
  limit?: number;
}

export interface CreateProgressPhotoData {
  caption?: string;
  weight?: number;
  bodyFat?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    biceps?: number;
    thighs?: number;
    neck?: number;
  };
  isPublic: boolean;
  tags: string[];
}

export class ProgressPhotoService {
  /**
   * Get all progress photos with optional filters
   */
  static async getProgressPhotos(filters?: ProgressPhotoFilters): Promise<PaginatedResponse<ProgressPhoto>> {
    try {
      const response = await apiClient.get('/progress-photos', { params: filters });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get progress photo by ID
   */
  static async getProgressPhotoById(id: string): Promise<ProgressPhoto> {
    try {
      const response = await apiClient.get(`/progress-photos/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Upload new progress photo
   */
  static async createProgressPhoto(file: File, data: CreateProgressPhotoData): Promise<ProgressPhoto> {
    try {
      console.log('Uploading progress photo:', { 
        fileName: file.name, 
        fileSize: file.size, 
        fileType: file.type,
        data 
      });

      const formData = new FormData();
      formData.append('image', file);
      formData.append('data', JSON.stringify(data));
      
      console.log('FormData entries:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? `File(${pair[1].name})` : pair[1]));
      }

      const response = await apiClient.post('/progress-photos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Upload response:', response.data);
      return handleApiResponse(response);
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update progress photo
   */
  static async updateProgressPhoto(id: string, data: Partial<CreateProgressPhotoData>): Promise<ProgressPhoto> {
    try {
      const response = await apiClient.put(`/progress-photos/${id}`, data);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete progress photo
   */
  static async deleteProgressPhoto(id: string): Promise<void> {
    try {
      await apiClient.delete(`/progress-photos/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get user's progress photos
   */
  static async getUserProgressPhotos(userId?: string, limit = 20): Promise<PaginatedResponse<ProgressPhoto>> {
    try {
      const response = await apiClient.get('/progress-photos', { 
        params: { userId, limit } 
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get progress photos by date range
   */
  static async getProgressPhotosByDateRange(
    startDate: string, 
    endDate: string, 
    userId?: string
  ): Promise<ProgressPhoto[]> {
    try {
      const response = await apiClient.get('/progress-photos/range', { 
        params: { startDate, endDate, userId } 
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get progress photo tags
   */
  static async getProgressPhotoTags(): Promise<string[]> {
    try {
      const response = await apiClient.get('/progress-photos/tags');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get progress statistics
   */
  static async getProgressStats(userId?: string): Promise<{
    totalPhotos: number;
    weightChange: number;
    bodyFatChange: number;
    measurementChanges: Record<string, number>;
    photosByMonth: Record<string, number>;
  }> {
    try {
      const response = await apiClient.get('/progress-photos/stats', { 
        params: { userId } 
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Compare progress photos between two dates
   */
  static async compareProgress(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    beforePhoto?: ProgressPhoto;
    afterPhoto?: ProgressPhoto;
    changes: {
      weight?: number;
      bodyFat?: number;
      measurements: Record<string, number>;
    };
  }> {
    try {
      const response = await apiClient.get('/progress-photos/compare', { 
        params: { userId, startDate, endDate } 
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}
