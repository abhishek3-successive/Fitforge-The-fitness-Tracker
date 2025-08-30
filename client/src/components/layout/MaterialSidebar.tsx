"use client";

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Collapse,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  FitnessCenter as FitnessCenterIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  BarChart as BarChartIcon,
  Schedule as ScheduleIcon,
  PhotoLibrary as PhotoLibraryIcon,
  TrendingUp as TrendingUpIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';

const navigationItems = [
  { 
    label: 'Dashboard', 
    icon: DashboardIcon, 
    href: '/dashboard',
    description: 'Overview and stats'
  },
  { 
    label: 'Exercises', 
    icon: FitnessCenterIcon, 
    href: '/exercises',
    description: 'Exercise library'
  },
  { 
    label: 'Workout Plans', 
    icon: AssignmentIcon, 
    href: '/workout-plans',
    description: 'Your workout routines'
  },
  { 
    label: 'Schedule', 
    icon: ScheduleIcon, 
    href: '/schedule',
    description: 'Workout calendar'
  },
  { 
    label: 'Progress', 
    icon: BarChartIcon, 
    href: '/progress',
    description: 'Track your fitness',
    subItems: [
      {
        label: 'Photos',
        icon: PhotoLibraryIcon,
        href: '/progress/photos',
        description: 'Progress photos'
      },
    ]
  },
  { 
    label: 'Profile', 
    icon: PersonIcon, 
    href: '/profile',
    description: 'Account settings'
  },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  variant?: 'permanent' | 'temporary';
}

export const Sidebar = ({ 
  open = false, 
  onClose, 
  variant = 'permanent' 
}: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [progressExpanded, setProgressExpanded] = useState(pathname.startsWith('/progress'));

  const handleNavigation = (href: string) => {
    router.push(href);
    if (variant === 'temporary' && onClose) {
      onClose();
    }
  };

  const handleProgressToggle = () => {
    setProgressExpanded(!progressExpanded);
  };

  const drawerContent = (
    <Box sx={{ width: 280, height: '100%' }}>
      {/* Logo Section */}
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #10B981, #3B82F6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
            FF
          </Typography>
        </Box>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #10B981, #3B82F6)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          FitForge
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your fitness companion
        </Typography>
      </Box>

      <Divider />

      {/* Navigation */}
      <List sx={{ px: 2, py: 1 }}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.subItems && item.subItems.some(sub => pathname === sub.href));
          const hasSubItems = item.subItems && item.subItems.length > 0;

          return (
            <React.Fragment key={item.href}>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => {
                    if (hasSubItems && item.label === 'Progress') {
                      handleProgressToggle();
                    } else {
                      handleNavigation(item.href);
                    }
                  }}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    bgcolor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'white' : 'text.primary',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      color: isActive ? 'white' : 'text.secondary',
                      minWidth: 40 
                    }}
                  >
                    <Icon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    secondary={!isActive ? item.description : undefined}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      sx: { display: { xs: 'none', lg: 'block' } }
                    }}
                  />
                  {hasSubItems && item.label === 'Progress' && (
                    <ListItemIcon sx={{ minWidth: 'auto', color: isActive ? 'white' : 'text.secondary' }}>
                      {progressExpanded ? <ExpandLess /> : <ExpandMore />}
                    </ListItemIcon>
                  )}
                </ListItemButton>
              </ListItem>

              {/* Sub Items */}
              {hasSubItems && item.label === 'Progress' && (
                <Collapse in={progressExpanded} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.subItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = pathname === subItem.href;

                      return (
                        <ListItem key={subItem.href} disablePadding sx={{ mb: 0.5 }}>
                          <ListItemButton
                            onClick={() => handleNavigation(subItem.href)}
                            sx={{
                              borderRadius: 2,
                              py: 1,
                              pl: 4,
                              bgcolor: isSubActive ? 'primary.main' : 'transparent',
                              color: isSubActive ? 'white' : 'text.primary',
                              '&:hover': {
                                bgcolor: isSubActive ? 'primary.dark' : 'action.hover',
                              },
                            }}
                          >
                            <ListItemIcon 
                              sx={{ 
                                color: isSubActive ? 'white' : 'text.secondary',
                                minWidth: 32 
                              }}
                            >
                              <SubIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={subItem.label}
                              secondary={!isSubActive ? subItem.description : undefined}
                              secondaryTypographyProps={{
                                variant: 'caption',
                                sx: { display: { xs: 'none', lg: 'block' } }
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          );
        })}
      </List>

      {/* Footer */}
      <Box 
        sx={{ 
          mt: 'auto', 
          p: 2, 
          bgcolor: 'action.hover',
          m: 2,
          borderRadius: 2 
        }}
      >
        <Typography variant="caption" color="text.secondary" align="center">
          💪 Stay strong, stay consistent!
        </Typography>
      </Box>
    </Box>
  );

  if (variant === 'temporary') {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
            borderRight: '1px solid #E5E7EB',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          borderRight: '1px solid #E5E7EB',
          position: 'relative',
          height: '100vh',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};
