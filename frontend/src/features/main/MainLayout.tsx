import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Container
} from '@mui/material';
import { 
  Link as RouterLink, 
  Outlet, 
  useLocation 
} from 'react-router-dom';
import { 
  DarkMode, 
  LightMode, 
  Menu as MenuIcon,
  Search,
  AdminPanelSettings,
  Psychology,
  Close,
  Home
} from '@mui/icons-material';
import { useState } from 'react';
import { useAppTheme } from '../../contexts/ThemeContext';
import { APP_CONFIG } from '../../config/appConfig';

export default function MainLayout() {
  const { themeMode, setThemeMode } = useAppTheme();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    localStorage.setItem('theme', newMode);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const menuItems = APP_CONFIG.navigation.map(item => ({
    ...item,
    icon: item.iconName === 'Home' ? <Home /> :
          item.iconName === 'Psychology' ? <Psychology /> :
          item.iconName === 'Search' ? <Search /> :
          <AdminPanelSettings />
  }));

  const NavButton = ({ to, children, icon }: { to: string; children: React.ReactNode; icon?: React.ReactNode }) => {
    const isActive = location.pathname === to || (to === '/ask' && location.pathname === '/ask');
    
    return (
      <Button
        color="inherit"
        component={RouterLink}
        to={to}
        startIcon={icon}
        sx={{
          mr: 1,
          backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.15)',
          },
          borderRadius: 2,
          px: 2
        }}
      >
        {children}
      </Button>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar 
        position="static" 
        elevation={2}
      >
        <Toolbar>
          <Typography 
            variant="h6" 
            component={RouterLink}
            to="/"
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 'bold',
              '&:hover': {
                opacity: 0.8
              }
            }}
          >
            {APP_CONFIG.projectIcon} {APP_CONFIG.projectName}
          </Typography>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {menuItems.map((item) => (
                <NavButton key={item.path} to={item.path} icon={item.icon}>
                  {item.text}
                </NavButton>
              ))}
              <IconButton
                color="inherit"
                onClick={toggleTheme}
                sx={{ 
                  ml: 2,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.2)',
                  }
                }}
                title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}
              >
                {themeMode === 'dark' ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Box>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                color="inherit"
                onClick={toggleTheme}
                sx={{ mr: 1 }}
                title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}
              >
                {themeMode === 'dark' ? <LightMode /> : <DarkMode />}
              </IconButton>
              <IconButton
                color="inherit"
                onClick={handleMobileMenuToggle}
                edge="end"
              >
                {mobileMenuOpen ? <Close /> : <MenuIcon />}
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 250,
            pt: 2
          }
        }}
      >
        <List>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/ask' && location.pathname === '/');
            
            return (
              <ListItem
                key={item.path}
                component={RouterLink}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                sx={{
                  backgroundColor: isActive ? 'action.selected' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  borderRadius: 1,
                  mx: 1,
                  mb: 0.5
                }}
              >
                <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  sx={{ color: isActive ? 'primary.main' : 'inherit' }}
                />
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      {/* Main Content */}
      <Container 
        maxWidth={false}
        component="main" 
        sx={{ 
          flexGrow: 1, 
          py: { xs: 2, md: 3 },
          px: { xs: 2, sm: 3, md: 4, lg: 5 },
          width: '100%',
          maxWidth: '100%'
        }}
      >
        <Outlet />
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: { xs: 1.5, md: 2 },
          px: { xs: 2, sm: 3, md: 4, lg: 5 },
          mt: 'auto',
          backgroundColor: theme.palette.mode === 'light' ? 'grey.100' : 'grey.900',
          borderTop: '1px solid',
          borderColor: 'divider',
          width: '100%'
        }}
      >
        <Container maxWidth={false} sx={{ width: '100%', maxWidth: '100%', p: '0 !important' }}>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            align="center"
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 1, md: 0 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            <span>© 2025 {APP_CONFIG.projectName}. All rights reserved.</span>
            <span>Developed by {APP_CONFIG.developer.name} • {APP_CONFIG.developer.company}</span>
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
