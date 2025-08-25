import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Chip,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { Language as LanguageIcon, ExitToApp as LogoutIcon } from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [language, setLanguage] = useState<'EN' | 'BG'>('EN');
  const [languageMenuAnchor, setLanguageMenuAnchor] = useState<null | HTMLElement>(null);

  const handleLanguageToggle = () => {
    const newLanguage = language === 'EN' ? 'BG' : 'EN';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    setLanguageMenuAnchor(null);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'SUPERVISOR':
        return 'warning';
      case 'CLERK':
      case 'FIELD_AGENT':
        return 'primary';
      case 'CITIZEN':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getNavigationItems = () => {
    if (!user) return [];

    const items = [
      { label: 'Dashboard', href: '/' },
      { label: 'Public Board', href: '/public' },
    ];

    switch (user.role) {
      case 'CITIZEN':
        items.push(
          { label: 'My Requests', href: '/citizen/requests' },
          { label: 'New Request', href: '/citizen/requests/new' }
        );
        break;
      case 'CLERK':
        items.push({ label: 'Inbox', href: '/clerk/inbox' });
        break;
      case 'SUPERVISOR':
        items.push({ label: 'Assign Tasks', href: '/supervisor/assign' });
        break;
      case 'FIELD_AGENT':
        items.push({ label: 'My Tasks', href: '/agent/my-tasks' });
        break;
      case 'ADMIN':
        items.push({ label: 'Feature Flags', href: '/admin/flags' });
        break;
    }

    return items;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Navigation */}
      <AppBar position="static" data-testid="cs-app-header">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            City Services Portal
          </Typography>
          
          {user && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {/* Navigation Items */}
              {getNavigationItems().map((item) => (
                <Button
                  key={item.href}
                  color="inherit"
                  component={Link}
                  to={item.href}
                  sx={{
                    color: location.pathname === item.href ? 'warning.main' : 'inherit'
                  }}
                  data-testid={`cs-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
            {/* Language Toggle */}
            <IconButton
              color="inherit"
              onClick={(e) => setLanguageMenuAnchor(e.currentTarget)}
              data-testid="cs-language-toggle"
            >
              <LanguageIcon />
            </IconButton>
            <Menu
              anchorEl={languageMenuAnchor}
              open={Boolean(languageMenuAnchor)}
              onClose={() => setLanguageMenuAnchor(null)}
            >
              <MenuItem onClick={handleLanguageToggle} selected={language === 'EN'}>
                English
              </MenuItem>
              <MenuItem onClick={handleLanguageToggle} selected={language === 'BG'}>
                ?????????
              </MenuItem>
            </Menu>
            
            {user && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'inherit' }}>
                    {user.name}
                  </Typography>
                  <Chip
                    label={user.role}
                    color={getRoleColor(user.role) as any}
                    size="small"
                    data-testid="cs-user-role-badge"
                  />
                </Box>
                <IconButton
                  color="inherit"
                  onClick={logout}
                  data-testid="cs-logout-button"
                >
                  <LogoutIcon />
                </IconButton>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box component="main" sx={{ flex: 1, bgcolor: 'grey.50' }}>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {children}
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: 'grey.800',
          color: 'grey.300',
          py: 2,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2">
          © 2025 City Services Portal - Built with React & MUI
        </Typography>
      </Box>
    </Box>
  );
};

export default AppLayout;