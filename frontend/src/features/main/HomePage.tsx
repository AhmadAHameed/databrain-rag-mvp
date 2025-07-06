import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Container,
  useTheme 
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Psychology, 
  Search, 
  AdminPanelSettings,
  TrendingUp,
  Analytics,
  Speed
} from '@mui/icons-material';
import { APP_CONFIG } from '../../config/appConfig';

export default function HomePage() {
  const theme = useTheme();

  const features = APP_CONFIG.features.map(feature => ({
    ...feature,
    icon: feature.title === 'AI Assistant' ? 
      <Psychology sx={{ fontSize: 48, color: theme.palette.secondary.main }} /> :
      feature.title === 'Smart Search' ?
      <Search sx={{ fontSize: 48, color: theme.palette.secondary.main }} /> :
      <AdminPanelSettings sx={{ fontSize: 48, color: theme.palette.secondary.main }} />
  }));

  const stats = [
    {
      label: APP_CONFIG.stats.dataPoints.label,
      value: APP_CONFIG.stats.dataPoints.value,
      icon: <Analytics sx={{ fontSize: 32 }} />
    },    {
      label: APP_CONFIG.stats.responseTime.label,
      value: APP_CONFIG.stats.responseTime.value,
      icon: <Speed sx={{ fontSize: 32 }} />
    },
    {
      label: APP_CONFIG.stats.accuracy.label,
      value: APP_CONFIG.stats.accuracy.value,
      icon: <TrendingUp sx={{ fontSize: 32 }} />
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Box textAlign="center" sx={{ mb: 6 }}>
        <Typography 
          variant="h2" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}        >
          {APP_CONFIG.hero.title}
        </Typography>
        <Typography 
          variant="h5" 
          color="text.secondary" 
          sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
        >
          {APP_CONFIG.hero.subtitle}
        </Typography>
        <Button
          variant="contained"
          size="large"
          component={RouterLink}
          to="/ask"
          sx={{ 
            px: 4, 
            py: 1.5,
            borderRadius: 3,
            textTransform: 'none',
            fontSize: '1.1rem'
          }}        >
          {APP_CONFIG.hero.ctaText}with AI Assistant
        </Button>
      </Box>

      {/* Stats Section */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card 
              sx={{ 
                textAlign: 'center', 
                p: 3,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              <Box sx={{ color: theme.palette.primary.main, mb: 2 }}>
                {stat.icon}
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {stat.value}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {stat.label}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Features Section */}
      <Typography 
        variant="h3" 
        component="h2" 
        textAlign="center" 
        sx={{ mb: 4, fontWeight: 'bold' }}
      >
        Explore Our Features
      </Typography>
      
      <Grid container spacing={4}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: theme.shadows[12]
                },
                cursor: 'pointer'
              }}
              component={RouterLink}
              to={feature.path}
              style={{ textDecoration: 'none' }}
            >
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{ mb: 3 }}>
                  {feature.icon}
                </Box>
                <Typography 
                  variant="h5" 
                  component="h3" 
                  gutterBottom
                  sx={{ fontWeight: 'bold' }}
                >
                  {feature.title}
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  {feature.description}
                </Typography>
                <Button
                  variant="outlined"
                  sx={{ 
                    borderRadius: 2,
                    textTransform: 'none'
                  }}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
