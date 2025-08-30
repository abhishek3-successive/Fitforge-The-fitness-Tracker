"use client";

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/use-auth';

interface HeaderProps {
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

export const Header = ({ onMenuToggle, showMenuButton = false }: HeaderProps) => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Handle user menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{ 
        bgcolor: 'background.paper', 
        color: 'text.primary',
        borderBottom: '1px solid #E5E7EB',
        zIndex: (theme) => theme.zIndex.drawer - 1,
      }}
    >
      <Toolbar sx={{ 
        justifyContent: 'space-between', 
        px: { xs: 2, md: 3 },
        minHeight: { xs: 56, sm: 64 }
      }}>
        {/* Left side - Logo and Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {showMenuButton && (
            <IconButton
              onClick={onMenuToggle}
              sx={{ 
                display: { md: 'none' },
                color: 'text.primary'
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
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
                display: { xs: 'none', sm: 'block' }
              }}
            >
              FitForge
            </Typography>
          </Box>
        </Box>

        {/* Right side - Notifications and User Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications */}
          <IconButton sx={{ color: 'text.primary' }}>
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* User Menu */}
          <IconButton onClick={handleMenuOpen} sx={{ color: 'text.primary' }}>
            <Avatar
              sx={{ 
                width: 32, 
                height: 32,
                background: 'linear-gradient(135deg, #F59E0B, #10B981)'
              }}
            >
              <AccountCircleIcon />
            </Avatar>
          </IconButton>

          {/* User name (hidden on mobile) */}
          <Typography 
            variant="body2" 
            sx={{ 
              display: { xs: 'none', md: 'block' },
              ml: 1,
              fontWeight: 500 
            }}
          >
            {user?.username || 'User'}
          </Typography>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            sx={{ mt: 1 }}
          >
            <MenuItem onClick={handleMenuClose}>
              <AccountCircleIcon sx={{ mr: 2 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <SettingsIcon sx={{ mr: 2 }} />
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 2 }} />
              Log out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
