"use client";

import React from 'react';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { fitForgeTheme } from '@/lib/mui-theme';

interface LandingLayoutProps {
  children: React.ReactNode;
}

export const LandingLayout = ({ children }: LandingLayoutProps) => {
  return (
    <ThemeProvider theme={fitForgeTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>
    </ThemeProvider>
  );
};
