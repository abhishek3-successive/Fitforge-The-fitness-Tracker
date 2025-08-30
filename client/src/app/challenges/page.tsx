'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Group as GroupIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { MaterialAppLayout } from '@/components/layout/MaterialAppLayout';
import { ChallengeService } from '@/external-api';
import { Challenge } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching challenges...');
      
      const response = await ChallengeService.getChallenges({
        limit: 20,
      });
      
      console.log('Challenges response:', response);
      
      // Handle the API response structure - the data is in response.data
      let challengesData: Challenge[] = [];
      if (Array.isArray(response)) {
        challengesData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        challengesData = response.data;
      }
      
      console.log('Extracted challenges data:', challengesData);
      console.log('Number of challenges:', challengesData.length);
      setChallenges(challengesData);
    } catch (err: any) {
      console.error('Failed to fetch challenges:', err);
      setError(`Failed to load challenges: ${err?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
      case 'easy':
        return 'success';
      case 'intermediate':
      case 'medium':
        return 'warning';
      case 'advanced':
      case 'hard':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <MaterialAppLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </MaterialAppLayout>
    );
  }

  return (
    <MaterialAppLayout>
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        {/* Header */}
        <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #F59E0B, #EF4444)', color: 'white' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
                Fitness Challenges
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Push your limits and achieve your goals with our community challenges
              </Typography>
            </Box>
            <TrophyIcon sx={{ fontSize: 80, opacity: 0.3 }} />
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Challenge Categories */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 3,
          mb: 4 
        }}>
          {[
            { title: 'Active Challenges', count: (challenges || []).length, icon: TimerIcon, color: '#10B981' },
            { title: 'Participants', count: (challenges || []).reduce((sum, c) => sum + (c.participants?.length || 0), 0), icon: GroupIcon, color: '#3B82F6' },
            { title: 'Completed', count: 0, icon: TrophyIcon, color: '#F59E0B' },
            { title: 'Your Progress', count: 0, icon: TrendingUpIcon, color: '#8B5CF6' },
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: stat.color, mr: 2 }}>
                  <stat.icon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stat.count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.title}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Challenges List */}
        {challenges.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <TrophyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                No Active Challenges
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Check back soon for new challenges, or create your own to get started!
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => {
                  alert('Create challenge functionality coming soon!');
                }}
              >
                Create Challenge
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' },
            gap: 3 
          }}>
            {challenges.map((challenge) => (
              <Card key={challenge._id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                      {challenge.title}
                    </Typography>
                    <Chip 
                      size="small" 
                      label={challenge.difficulty}
                      color={getDifficultyColor(challenge.difficulty) as any}
                      variant="outlined"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {challenge.description}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <GroupIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {challenge.participants?.length || 0} participants
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TimerIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
                    </Typography>
                  </Box>

                  {challenge.tags && challenge.tags.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      {challenge.tags.slice(0, 3).map((tag: string) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                      alert(`Joining challenge: ${challenge.title} - Coming soon!`);
                    }}
                    sx={{ 
                      background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #059669, #2563EB)',
                      }
                    }}
                  >
                    View Challenge
                  </Button>
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </MaterialAppLayout>
  );
}
