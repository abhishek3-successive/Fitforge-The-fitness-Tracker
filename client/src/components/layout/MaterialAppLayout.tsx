"use client";

import React, { useState } from 'react';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { Header } from './MaterialHeader';
import { Sidebar } from './MaterialSidebar';
import { fitForgeTheme } from '@/lib/mui-theme';

interface MaterialAppLayoutProps {
  children: React.ReactNode;
}

export const MaterialAppLayout = ({ children }: MaterialAppLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <ThemeProvider theme={fitForgeTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', width: '100vw' }}>
        {/* Desktop Sidebar */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, flexShrink: 0 }}>
          <Sidebar variant="permanent" />
        </Box>
        
        {/* Mobile Sidebar */}
        <Sidebar
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
        />

        {/* Main Content Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            width: 0, // This prevents overflow issues
            bgcolor: 'background.default',
            position: 'relative',
          }}
        >
          {/* Header */}
          <Header 
            onMenuToggle={handleDrawerToggle}
            showMenuButton={true}
          />

          {/* Page Content */}
          <Box
            sx={{
              flexGrow: 1,
              p: { xs: 2, sm: 3 },
              overflow: 'auto',
              width: '100%',
              maxWidth: '100%', // Prevent content from overflowing
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};
