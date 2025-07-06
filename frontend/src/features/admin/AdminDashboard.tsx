import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Fab,
  useTheme,
  useMediaQuery,
  Avatar
} from '@mui/material';
import { 
  Add, 
  Delete, 
  Edit, 
  Description,
  Business,
  DateRange,
  Visibility,
  Download,
  TrendingUp,
  People,
  Storage
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { PageContainer, AccentCard } from '../../components/PageThemedComponents';
import { APP_CONFIG, MOCK_DOCUMENTS } from '../../config/appConfig';

interface DocumentItem {
  id: string;
  title: string;
  department: string;
  division: string;
  lastModified: string;
  size: string;
  views: number;
  status: 'Active' | 'Draft' | 'Archived';
}

interface StatsData {
  totalDocuments: number;
  totalUsers: number;
  totalStorage: string;
  monthlyUploads: number;
}



const statsData: StatsData = APP_CONFIG.adminDashboard.stats;

const divisions = APP_CONFIG.adminDashboard.divisions;

export default function AdminDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [documents, setDocuments] = useState<DocumentItem[]>(MOCK_DOCUMENTS);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentItem | null>(null);
  const [newDocument, setNewDocument] = useState({
    title: '',
    department: '',
    division: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [divisionOptions, setDivisionOptions] = useState<string[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [newDivision, setNewDivision] = useState('');
  const [newDepartment, setNewDepartment] = useState('');

  // Fetch filter options when dialog opens
  useEffect(() => {
    if (openDialog) {
      console.log('Fetching filter options...');
      fetch('/api/v1/documents/filter-options')
        .then(res => {
          console.log('Response status:', res.status);
          console.log('Response headers:', res.headers.get('content-type'));
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('Filter options received:', data);
          setDivisionOptions(Array.isArray(data.divisions) ? data.divisions : []);
          setDepartmentOptions(Array.isArray(data.departments) ? data.departments : []);
        })
        .catch((error) => {
          console.error('Error fetching filter options:', error);
          // Set some fallback options for testing
          setDivisionOptions(['civil', 'piping', 'pressure_vessels']);
          setDepartmentOptions(['design', 'general', 'pv_dept']);
        });
    }
  }, [openDialog]);

  const handleAddDocument = () => {
    setEditingDocument(null);
    setNewDocument({ title: '', department: '', division: '' });
    setOpenDialog(true);
  };

  const handleEditDocument = (doc: DocumentItem) => {
    setEditingDocument(doc);
    setNewDocument({
      title: doc.title,
      department: doc.department || '',
      division: doc.division
    });
    setOpenDialog(true);
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  const handleSaveDocument = async () => {
    if (!file) {
      setUploadError('Please select a file to upload.');
      return;
    }
    if (!newDocument.department) {
      setUploadError('Please select a department.');
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', newDocument.title);
      formData.append('department', newDocument.department);
      formData.append('division', newDocument.division);
      const response = await fetch('/api/v1/documents/upload/', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      const data = await response.json();
      setDocuments([{
        id: data.id || Date.now().toString(),
        title: newDocument.title,
        division: newDocument.division,
        department: newDocument.department,
        lastModified: new Date().toISOString().split('T')[0],
        size: data.size || '1.0 MB',
        views: 0,
        status: 'Draft',
      }, ...documents]);
      setOpenDialog(false);
      setFile(null);
    } catch (err: any) {
      setUploadError('Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Draft': return 'warning';
      case 'Archived': return 'default';
      default: return 'default';
    }
  };

  return (
    <PageContainer>
      <Box sx={{ width: '100%', minHeight: '100%' }}>
        {/* Header */}
        <AccentCard 
          elevation={2}
          sx={{ 
            p: { xs: 2, md: 3 }, 
            mb: 3,
            background: theme.palette.mode === 'light' 
              ? 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)'
              : 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)',
            color: 'white',
            borderRadius: { xs: 2, md: 3 }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant={isMobile ? "h5" : "h4"} component="h1" gutterBottom>
                Admin Dashboard
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Manage documents, users, and system settings
              </Typography>
            </Box>
            {!isMobile && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Add />}
                onClick={handleAddDocument}
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' },
                  whiteSpace: 'nowrap'
                }}
              >
                Add Document
              </Button>
            )}
          </Box>
        </AccentCard>

        {/* Stats Cards */}
        <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={6} md={3}>
            <Card 
              elevation={1} 
              sx={{ 
                height: '100%',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  elevation: 4,
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2, md: 3 } }}>
                <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1, width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
                  <Description sx={{ fontSize: { xs: 16, sm: 20 } }} />
                </Avatar>
                <Typography variant="h5" component="div" fontWeight="bold" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                  {statsData.totalDocuments.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Total Documents
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card 
              elevation={1} 
              sx={{ 
                height: '100%',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  elevation: 4,
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2, md: 3 } }}>
                <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1, width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
                  <People sx={{ fontSize: { xs: 16, sm: 20 } }} />
                </Avatar>
                <Typography variant="h5" component="div" fontWeight="bold" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                  {statsData.totalUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Active Users
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card 
              elevation={1} 
              sx={{ 
                height: '100%',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  elevation: 4,
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2, md: 3 } }}>
                <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 1, width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
                  <Storage sx={{ fontSize: { xs: 16, sm: 20 } }} />
                </Avatar>
                <Typography variant="h5" component="div" fontWeight="bold" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                  {statsData.totalStorage}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Storage Used
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card 
              elevation={1} 
              sx={{ 
                height: '100%',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  elevation: 4,
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2, md: 3 } }}>
                <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1, width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
                  <TrendingUp sx={{ fontSize: { xs: 16, sm: 20 } }} />
                </Avatar>
                <Typography variant="h5" component="div" fontWeight="bold" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
                  {statsData.monthlyUploads}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  This Month
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Documents Section */}
        <Paper elevation={1} sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            flexDirection: { xs: 'row', sm: 'row' }
          }}>
            <Typography variant="h6" component="h2" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Recent Documents ({documents.length})
            </Typography>
            {isMobile && (
              <IconButton
                color="primary"
                onClick={handleAddDocument}
                sx={{ 
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': { backgroundColor: 'primary.dark' },
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 }
                }}
              >
                <Add sx={{ fontSize: { xs: 18, sm: 24 } }} />
              </IconButton>
            )}
          </Box>

          {/* Document List */}
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
            {documents.map((doc) => (
              <Grid item xs={12} sm={6} lg={4} xl={3} key={doc.id}>
                <Card 
                  elevation={1}
                  sx={{ 
                    height: '100%',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': { 
                      elevation: 3,
                      transform: 'translateY(-2px)'
                    },
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography 
                        variant="h6" 
                        component="h3" 
                        sx={{ 
                          fontSize: { xs: '0.9rem', sm: '1rem' }, 
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          pr: 1
                        }}
                      >
                        {doc.title}
                      </Typography>
                      <Chip
                        label={doc.status}
                        size="small"
                        color={getStatusColor(doc.status) as any}
                        variant="outlined"
                        sx={{ flexShrink: 0, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip
                        icon={<Business sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                        label={doc.division}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                      />
                    </Box>

                    <Box sx={{ 
                      display: 'flex', 
                      gap: { xs: 1, sm: 2 }, 
                      mb: 1,
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' }
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}>
                        <DateRange sx={{ fontSize: { xs: 14, sm: 16 }, mr: 0.5 }} />
                        {new Date(doc.lastModified).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {doc.size}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Visibility sx={{ fontSize: { xs: 14, sm: 16 }, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {doc.views} views
                      </Typography>
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ 
                    justifyContent: 'space-between', 
                    px: { xs: 1.5, sm: 2 }, 
                    pb: { xs: 1.5, sm: 2 },
                    pt: 0
                  }}>
                    <Box>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditDocument(doc)}
                        title="Edit document"
                        sx={{ fontSize: { xs: 16, sm: 20 } }}
                      >
                        <Edit sx={{ fontSize: 'inherit' }} />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteDocument(doc.id)}
                        title="Delete document"
                        color="error"
                        sx={{ fontSize: { xs: 16, sm: 20 } }}
                      >
                        <Delete sx={{ fontSize: 'inherit' }} />
                      </IconButton>
                    </Box>
                    <Box>
                      <IconButton size="small" title="View document" sx={{ fontSize: { xs: 16, sm: 20 } }}>
                        <Visibility sx={{ fontSize: 'inherit' }} />
                      </IconButton>
                      <IconButton size="small" title="Download document" sx={{ fontSize: { xs: 16, sm: 20 } }}>
                        <Download sx={{ fontSize: 'inherit' }} />
                      </IconButton>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Add/Edit Document Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            {editingDocument ? 'Edit Document' : 'Add New Document'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Document Title"
                value={newDocument.title}
                onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Division</InputLabel>
                <Select
                  value={newDocument.division}
                  onChange={(e) => {
                    if (e.target.value === '__add_new_division__') {
                      setNewDocument({ ...newDocument, division: e.target.value });
                    } else {
                      setNewDocument({ ...newDocument, division: e.target.value });
                      setNewDivision('');
                    }
                  }}
                  label="Division"
                  renderValue={(selected) => selected && selected !== '__add_new_division__' ? selected : 'Select Division'}
                  MenuProps={{
                    PaperProps: {
                      style: { maxHeight: 300 }
                    }
                  }}
                >
                  {console.log('Rendering division options:', divisionOptions)}
                  {divisionOptions.map((div) => (
                    <MenuItem key={div} value={div}>{div}</MenuItem>
                  ))}
                  <MenuItem value="__add_new_division__">
                    <em>Add new division…</em>
                  </MenuItem>
                </Select>
              </FormControl>
              {newDocument.division === '__add_new_division__' && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    autoFocus
                    label="New Division"
                    value={newDivision}
                    onChange={e => setNewDivision(e.target.value)}
                    size="small"
                  />
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (newDivision && !divisionOptions.includes(newDivision)) {
                        setDivisionOptions([newDivision, ...divisionOptions]);
                        setNewDocument({ ...newDocument, division: newDivision });
                        setNewDivision('');
                      }
                    }}
                  >
                    Add
                  </Button>
                </Box>
              )}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Department</InputLabel>
                <Select
                  value={newDocument.department}
                  onChange={(e) => {
                    if (e.target.value === '__add_new_department__') {
                      setNewDocument({ ...newDocument, department: e.target.value });
                    } else {
                      setNewDocument({ ...newDocument, department: e.target.value });
                      setNewDepartment('');
                    }
                  }}
                  label="Department"
                  renderValue={(selected) => selected && selected !== '__add_new_department__' ? selected : 'Select Department'}
                  MenuProps={{
                    PaperProps: {
                      style: { maxHeight: 300 }
                    }
                  }}
                >
                  {console.log('Rendering department options:', departmentOptions)}
                  {departmentOptions.map((dept) => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                  <MenuItem value="__add_new_department__">
                    <em>Add new department…</em>
                  </MenuItem>
                </Select>
              </FormControl>
              {newDocument.department === '__add_new_department__' && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    autoFocus
                    label="New Department"
                    value={newDepartment}
                    onChange={e => setNewDepartment(e.target.value)}
                    size="small"
                  />
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (newDepartment && !departmentOptions.includes(newDepartment)) {
                        setDepartmentOptions([newDepartment, ...departmentOptions]);
                        setNewDocument({ ...newDocument, department: newDepartment });
                        setNewDepartment('');
                      }
                    }}
                  >
                    Add
                  </Button>
                </Box>
              )}
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: 2 }}
              >
                {file ? file.name : 'Select File'}
                <input
                  type="file"
                  hidden
                  onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                />
              </Button>
              {uploadError && (
                <Typography color="error" variant="body2" sx={{ mb: 1 }}>{uploadError}</Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setOpenDialog(false); setFile(null); setUploadError(null); }}>Cancel</Button>
            <Button 
              onClick={handleSaveDocument}
              variant="contained"
              disabled={!newDocument.title || !newDocument.department || !newDocument.division || uploading}
            >
              {uploading ? 'Uploading...' : (editingDocument ? 'Update' : 'Add')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Floating Action Button for Mobile */}
        {isMobile && (
          <Fab
            color="primary"
            sx={{ 
              position: 'fixed', 
              bottom: { xs: 16, sm: 24 }, 
              right: { xs: 16, sm: 24 },
              zIndex: 1000
            }}
            onClick={handleAddDocument}
          >
            <Add />
          </Fab>
        )}

        {/* Developer Information Section */}
        <AccentCard sx={{ mt: 4, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            System Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Application
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {APP_CONFIG.projectName} v{APP_CONFIG.version}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Developer
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {APP_CONFIG.developer.name}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Company
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {APP_CONFIG.developer.company}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Contact
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {APP_CONFIG.developer.email}
              </Typography>
            </Grid>
          </Grid>
        </AccentCard>
      </Box>
    </PageContainer>
  );
}
