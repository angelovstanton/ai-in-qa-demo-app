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
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Collapse,
} from '@mui/material';
import {
  Language as LanguageIcon,
  ExitToApp as LogoutIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Public as PublicIcon,
  Assignment as RequestsIcon,
  Add as AddIcon,
  Inbox as InboxIcon,
  AssignmentInd as AssignIcon,
  Work as TasksIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  ExpandLess,
  ExpandMore,
  Analytics as AnalyticsIcon,
  Assessment as AssessmentIcon,
  Star as StarIcon,
  Flag as FlagIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [mobileSubMenuOpen, setMobileSubMenuOpen] = useState<string | null>(null);

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const handleMobileNavigation = (href: string) => {
    navigate(href);
    setMobileDrawerOpen(false);
    setMobileSubMenuOpen(null);
  };

  const handleSubMenuToggle = (menu: string) => {
    setMobileSubMenuOpen(mobileSubMenuOpen === menu ? null : menu);
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

    // For supervisors, don't show the general base items, they have their own dashboard
    const baseItems = user.role === 'SUPERVISOR' ? [] : [
      { 
        label: t('nav.dashboard'), 
        href: '/', 
        icon: <DashboardIcon />,
        testId: 'cs-nav-dashboard'
      },
      { 
        label: t('nav.resolved-cases'), 
        href: '/resolved-cases', 
        icon: <PublicIcon />,
        testId: 'cs-nav-resolved-cases'
      },
      // Hide ranklist from Clerk and Field Agent roles
      ...(user.role !== 'CLERK' && user.role !== 'FIELD_AGENT' ? [{
        label: t('nav.ranklist'), 
        href: '/ranklist', 
        icon: <PublicIcon />,
        testId: 'cs-nav-ranklist'
      }] : []),
    ];

    const roleSpecificItems = [];

    switch (user.role) {
      case 'CITIZEN':
        roleSpecificItems.push(
          { 
            label: t('nav.requests'), 
            href: '/citizen/requests', 
            icon: <RequestsIcon />,
            testId: 'cs-nav-my-requests'
          },
          { 
            label: t('nav.new-request'), 
            href: '/citizen/requests/new', 
            icon: <AddIcon />,
            testId: 'cs-nav-new-request'
          }
        );
        break;
      case 'CLERK':
        roleSpecificItems.push(
          { 
            label: t('nav.inbox') || 'Inbox', 
            href: '/clerk/inbox', 
            icon: <InboxIcon />,
            testId: 'cs-nav-inbox'
          }
        );
        break;
      case 'SUPERVISOR':
        roleSpecificItems.push(
          { 
            label: 'Dashboard', 
            href: '/supervisor/dashboard', 
            icon: <DashboardIcon />,
            testId: 'cs-nav-supervisor-dashboard'
          },
          { 
            label: 'Staff Performance', 
            href: '/supervisor/staff-performance', 
            icon: <TrendingUpIcon />,
            testId: 'cs-nav-staff-performance'
          },
          { 
            label: 'Department Metrics', 
            href: '/supervisor/metrics', 
            icon: <AnalyticsIcon />,
            testId: 'cs-nav-department-metrics'
          },
          { 
            label: 'Quality Reviews', 
            href: '/supervisor/quality-reviews', 
            icon: <StarIcon />,
            testId: 'cs-nav-quality-reviews'
          },
          { 
            label: 'Performance Goals', 
            href: '/supervisor/performance-goals', 
            icon: <FlagIcon />,
            testId: 'cs-nav-performance-goals'
          },
          { 
            label: 'Assign Tasks', 
            href: '/supervisor/assign', 
            icon: <AssignIcon />,
            testId: 'cs-nav-assign-tasks'
          }
        );
        break;
      case 'FIELD_AGENT':
        roleSpecificItems.push(
          { 
            label: t('nav.my-tasks') || 'My Tasks', 
            href: '/agent/my-tasks', 
            icon: <TasksIcon />,
            testId: 'cs-nav-my-tasks'
          }
        );
        break;
      case 'ADMIN':
        roleSpecificItems.push(
          { 
            label: t('nav.admin-flags') || 'Feature Flags', 
            href: '/admin/flags', 
            icon: <SettingsIcon />,
            testId: 'cs-nav-feature-flags'
          }
        );
        break;
    }

    return [...baseItems, ...roleSpecificItems];
  };

  const renderMobileDrawer = () => (
    <Drawer
      variant="temporary"
      anchor="left"
      open={mobileDrawerOpen}
      onClose={handleDrawerToggle}
      ModalProps={{
        keepMounted: true, // Better mobile performance
      }}
      sx={{
        display: { xs: 'block', md: 'none' },
        '& .MuiDrawer-paper': { 
          boxSizing: 'border-box', 
          width: 280,
          bgcolor: 'background.paper'
        },
      }}
      data-testid="cs-mobile-drawer"
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('nav.menu') || 'Menu'}
        </Typography>
        <Divider />
      </Box>
      
      <List>
        {/* User Profile Section */}
        {user && (
          <>
            <ListItem>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText 
                primary={user.name}
                secondary={user.role}
                secondaryTypographyProps={{
                  component: 'div',
                  sx: { mt: 0.5 }
                }}
              />
              <Chip
                label={user.role}
                color={getRoleColor(user.role) as any}
                size="small"
                sx={{ ml: 1 }}
              />
            </ListItem>
            <Divider />
          </>
        )}

        {/* Navigation Items */}
        {getNavigationItems().map((item) => (
          <ListItemButton
            key={item.href}
            onClick={() => handleMobileNavigation(item.href)}
            selected={location.pathname === item.href}
            data-testid={item.testId}
            sx={{
              '&.Mui-selected': {
                bgcolor: 'primary.50',
                '&:hover': {
                  bgcolor: 'primary.100',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.href ? 'primary.main' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              sx={{ 
                '& .MuiListItemText-primary': {
                  color: location.pathname === item.href ? 'primary.main' : 'inherit',
                  fontWeight: location.pathname === item.href ? 'bold' : 'normal',
                }
              }}
            />
          </ListItemButton>
        ))}

        <Divider sx={{ my: 1 }} />

        {/* Profile & Settings Sub-menu */}
        <ListItemButton
          onClick={() => handleSubMenuToggle('profile')}
          data-testid="cs-mobile-profile-menu"
        >
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary={t('nav.profile') || 'Profile'} />
          {mobileSubMenuOpen === 'profile' ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>

        <Collapse in={mobileSubMenuOpen === 'profile'} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              sx={{ pl: 4 }}
              onClick={() => handleMobileNavigation('/profile/edit')}
              data-testid="cs-mobile-edit-profile"
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary={t('profile.title') || 'Edit Profile'} />
            </ListItemButton>
          </List>
        </Collapse>

        <Divider />

        {/* Language Switcher */}
        <ListItem>
          <ListItemIcon>
            <LanguageIcon />
          </ListItemIcon>
          <Box sx={{ flex: 1 }}>
            <LanguageSwitcher variant="dropdown" />
          </Box>
        </ListItem>

        {/* Logout */}
        <ListItemButton
          onClick={() => {
            logout();
            setMobileDrawerOpen(false);
          }}
          data-testid="cs-mobile-logout"
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary={t('nav.logout') || 'Logout'} />
        </ListItemButton>
      </List>
    </Drawer>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Navigation */}
      <AppBar position="static" data-testid="cs-app-header">
        <Toolbar>
          {/* Mobile Menu Button */}
          {isMobile && user && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
              data-testid="cs-mobile-menu-button"
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography 
            variant="h6" 
            component={Link}
            to={user?.role === 'SUPERVISOR' ? '/supervisor/dashboard' : '/dashboard'}
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' }, // Responsive font size
              textDecoration: 'none',
              color: 'inherit',
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8,
              }
            }}
          >
            {isMobile ? 'City Services' : 'City Services Portal'}
          </Typography>
          
          {/* Desktop Navigation */}
          {!isMobile && user && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mr: 2 }}>
              {getNavigationItems().map((item) => (
                <Button
                  key={item.href}
                  color="inherit"
                  component={Link}
                  to={item.href}
                  startIcon={item.icon}
                  sx={{
                    color: location.pathname === item.href ? 'warning.main' : 'inherit',
                    fontWeight: location.pathname === item.href ? 'bold' : 'normal',
                    minWidth: 'auto',
                    px: 1,
                  }}
                  data-testid={item.testId}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          {/* Desktop User Controls */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LanguageSwitcher />
              
              {user && (
                <>
                  <IconButton
                    color="inherit"
                    onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                    data-testid="cs-user-menu-button"
                  >
                    <PersonIcon />
                  </IconButton>
                  
                  <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={() => setUserMenuAnchor(null)}
                    data-testid="cs-user-menu"
                  >
                    <MenuItem disabled>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <Typography variant="body2" fontWeight="bold">
                          {user.name}
                        </Typography>
                        <Chip
                          label={user.role}
                          color={getRoleColor(user.role) as any}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </MenuItem>
                    <Divider />
                    <MenuItem
                      onClick={() => {
                        navigate('/profile/edit');
                        setUserMenuAnchor(null);
                      }}
                      data-testid="cs-user-menu-profile"
                    >
                      <ListItemIcon>
                        <PersonIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>{t('profile.title') || 'Edit Profile'}</ListItemText>
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        logout();
                        setUserMenuAnchor(null);
                      }}
                      data-testid="cs-user-menu-logout"
                      sx={{ color: 'error.main' }}
                    >
                      <ListItemIcon sx={{ color: 'inherit' }}>
                        <LogoutIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>{t('nav.logout') || 'Logout'}</ListItemText>
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>
          )}

          {/* Mobile User Badge */}
          {isMobile && user && (
            <Chip
              label={user.role}
              color={getRoleColor(user.role) as any}
              size="small"
              data-testid="cs-mobile-user-role-badge"
            />
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      {renderMobileDrawer()}

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flex: 1, 
          bgcolor: 'grey.50',
          minHeight: 0, // Allow flex shrinking
        }}
      >
        <Container 
          maxWidth="xl" 
          sx={{ 
            py: { xs: 2, sm: 3 }, // Responsive padding
            px: { xs: 1, sm: 2, md: 3 }, // Responsive horizontal padding
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: 'grey.800',
          color: 'grey.300',
          py: { xs: 1, sm: 2 }, // Responsive padding
          textAlign: 'center',
        }}
      >
        <Typography 
          variant="body2"
          sx={{ 
            fontSize: { xs: '0.75rem', sm: '0.875rem' }, // Responsive font size
            px: 1
          }}
        >
          � 2025 City Services Portal - Built with React & MUI
        </Typography>
      </Box>
    </Box>
  );
};

export default AppLayout;