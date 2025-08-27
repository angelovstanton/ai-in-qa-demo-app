import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
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
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tab,
  Tabs,
  Badge,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  Check as ApproveIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon,
  Security as SecurityIcon,
  Report as ReportIcon,
  Person as PersonIcon,
  Comment as CommentIcon,
  Assignment as RequestIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { ContentModerator, ContentAnalysis, ModerationAction } from '../utils/contentModeration';

interface FlaggedContent {
  id: string;
  contentId: string;
  contentType: 'REQUEST' | 'COMMENT' | 'PROFILE';
  content: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN' | 'DELETED';
  automatedAnalysis: ContentAnalysis;
  moderatorId?: string;
  moderatorName?: string;
  reason?: string;
  createdAt: string;
  reviewedAt?: string;
}

const ContentModerationPage: React.FC = () => {
  const { user } = useAuth();
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<FlaggedContent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Check if user has admin access
  if (user?.role !== 'ADMIN') {
    return (
      <Box data-testid="cs-content-moderation-unauthorized">
        <Alert severity="error">
          Access denied. This page is only available to administrators.
        </Alert>
      </Box>
    );
  }

  useEffect(() => {
    fetchFlaggedContent();
  }, []);

  const fetchFlaggedContent = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/admin/moderation/flagged-content');
      setFlaggedContent(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch flagged content');
      
      // Mock data for demonstration
      const mockData: FlaggedContent[] = [
        {
          id: '1',
          contentId: 'req-1',
          contentType: 'REQUEST',
          content: 'This is some spam content with FREE MONEY and CLICK HERE to win!',
          userId: 'user-1',
          userName: 'John Spammer',
          userEmail: 'spammer@example.com',
          status: 'PENDING',
          automatedAnalysis: ContentModerator.analyzeContent('This is some spam content with FREE MONEY and CLICK HERE to win!'),
          createdAt: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          contentId: 'comment-1',
          contentType: 'COMMENT',
          content: 'I hate this stupid system and you are all idiots!',
          userId: 'user-2',
          userName: 'Angry User',
          userEmail: 'angry@example.com',
          status: 'PENDING',
          automatedAnalysis: ContentModerator.analyzeContent('I hate this stupid system and you are all idiots!'),
          createdAt: '2024-01-14T15:30:00Z',
        },
        {
          id: '3',
          contentId: 'req-2',
          contentType: 'REQUEST',
          content: '<script>alert("XSS attack")</script>Malicious content here',
          userId: 'user-3',
          userName: 'Hacker User',
          userEmail: 'hacker@example.com',
          status: 'PENDING',
          automatedAnalysis: ContentModerator.analyzeContent('<script>alert("XSS attack")</script>Malicious content here'),
          createdAt: '2024-01-13T09:15:00Z',
        },
      ];
      setFlaggedContent(mockData);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchFlaggedContent();
    } finally {
      setRefreshing(false);
    }
  };

  const handleModerationAction = async (contentId: string, action: 'APPROVED' | 'REJECTED' | 'HIDDEN' | 'DELETED') => {
    setPendingAction(contentId);
    
    try {
      await api.post(`/admin/moderation/action`, {
        contentId,
        action,
        reason: actionReason || undefined,
      });

      // Update local state
      setFlaggedContent(prev => prev.map(item => 
        item.id === contentId 
          ? { 
              ...item, 
              status: action, 
              moderatorId: user?.id,
              moderatorName: user?.name,
              reason: actionReason || undefined,
              reviewedAt: new Date().toISOString(),
            }
          : item
      ));

      setDialogOpen(false);
      setActionReason('');
      setSelectedContent(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to perform moderation action');
      
      // Optimistic update for demo
      setFlaggedContent(prev => prev.map(item => 
        item.id === contentId 
          ? { 
              ...item, 
              status: action, 
              moderatorId: user?.id,
              moderatorName: user?.name,
              reason: actionReason || undefined,
              reviewedAt: new Date().toISOString(),
            }
          : item
      ));
      setDialogOpen(false);
      setActionReason('');
      setSelectedContent(null);
    } finally {
      setPendingAction(null);
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'REQUEST': return <RequestIcon />;
      case 'COMMENT': return <CommentIcon />;
      case 'PROFILE': return <PersonIcon />;
      default: return <FlagIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'HIDDEN': return 'secondary';
      case 'DELETED': return 'error';
      default: return 'default';
    }
  };

  const getSeverityColor = (score: number) => {
    if (score >= 70) return 'error';
    if (score >= 40) return 'warning';
    if (score >= 20) return 'info';
    return 'success';
  };

  const filterContentByTab = (content: FlaggedContent[]) => {
    switch (currentTab) {
      case 0: return content.filter(item => item.status === 'PENDING');
      case 1: return content.filter(item => item.status === 'APPROVED');
      case 2: return content.filter(item => ['REJECTED', 'HIDDEN', 'DELETED'].includes(item.status));
      default: return content;
    }
  };

  const filteredContent = filterContentByTab(flaggedContent);
  const pendingCount = flaggedContent.filter(item => item.status === 'PENDING').length;
  const approvedCount = flaggedContent.filter(item => item.status === 'APPROVED').length;
  const rejectedCount = flaggedContent.filter(item => ['REJECTED', 'HIDDEN', 'DELETED'].includes(item.status)).length;

  return (
    <Box data-testid="cs-content-moderation-page">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Content Moderation
        </Typography>
        <Button
          variant="outlined"
          startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
          data-testid="cs-content-moderation-refresh"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} data-testid="cs-content-moderation-error">
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6" color="warning.main">
                    {pendingCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Review
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ApproveIcon color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6" color="success.main">
                    {approvedCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BlockIcon color="error" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6" color="error.main">
                    {rejectedCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rejected/Hidden
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SecurityIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6" color="primary.main">
                    {flaggedContent.filter(item => item.automatedAnalysis.hasSecurityThreat).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Security Threats
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Content Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={(e, newValue) => setCurrentTab(newValue)}
          data-testid="cs-content-moderation-tabs"
        >
          <Tab 
            label={
              <Badge badgeContent={pendingCount} color="warning">
                Pending Review
              </Badge>
            }
            data-testid="cs-tab-pending"
          />
          <Tab 
            label={
              <Badge badgeContent={approvedCount} color="success">
                Approved
              </Badge>
            }
            data-testid="cs-tab-approved"
          />
          <Tab 
            label={
              <Badge badgeContent={rejectedCount} color="error">
                Rejected/Hidden
              </Badge>
            }
            data-testid="cs-tab-rejected"
          />
        </Tabs>
      </Paper>

      {/* Content Table */}
      <TableContainer component={Paper} data-testid="cs-flagged-content-table">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Content</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="center">Risk Score</TableCell>
              <TableCell align="center">Flags</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredContent.map((item) => (
              <TableRow 
                key={item.id}
                sx={{ 
                  '&:last-child td, &:last-child th': { border: 0 },
                  bgcolor: item.automatedAnalysis.score >= 70 ? 'error.50' : 
                           item.automatedAnalysis.score >= 40 ? 'warning.50' : 'inherit',
                }}
              >
                <TableCell sx={{ maxWidth: 300 }}>
                  <Typography variant="body2" noWrap title={item.content}>
                    {item.content.length > 100 ? `${item.content.substring(0, 100)}...` : item.content}
                  </Typography>
                  
                  {item.automatedAnalysis.flags.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {item.automatedAnalysis.flags.slice(0, 2).map((flag) => (
                        <Chip
                          key={flag}
                          label={flag}
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                      {item.automatedAnalysis.flags.length > 2 && (
                        <Chip
                          label={`+${item.automatedAnalysis.flags.length - 2}`}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      )}
                    </Box>
                  )}
                </TableCell>
                
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {item.userName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.userEmail}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getContentTypeIcon(item.contentType)}
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {item.contentType}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell align="center">
                  <Chip
                    label={item.automatedAnalysis.score}
                    color={getSeverityColor(item.automatedAnalysis.score) as any}
                    size="small"
                  />
                </TableCell>
                
                <TableCell align="center">
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                    {item.automatedAnalysis.isSpam && <FlagIcon color="warning" fontSize="small" />}
                    {item.automatedAnalysis.isHate && <ReportIcon color="error" fontSize="small" />}
                    {item.automatedAnalysis.hasSecurityThreat && <SecurityIcon color="error" fontSize="small" />}
                  </Box>
                </TableCell>
                
                <TableCell align="center">
                  <Chip
                    label={item.status}
                    color={getStatusColor(item.status) as any}
                    size="small"
                  />
                </TableCell>
                
                <TableCell align="center">
                  <Typography variant="caption">
                    {format(new Date(item.createdAt), 'MMM dd, HH:mm')}
                  </Typography>
                </TableCell>
                
                <TableCell align="center">
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedContent(item);
                        setDialogOpen(true);
                      }}
                      data-testid={`cs-moderation-view-${item.id}`}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Content Review Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        data-testid="cs-moderation-dialog"
      >
        {selectedContent && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6">Content Review</Typography>
                <Chip
                  label={`Risk Score: ${selectedContent.automatedAnalysis.score}`}
                  color={getSeverityColor(selectedContent.automatedAnalysis.score) as any}
                />
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Content:
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">
                      {selectedContent.content}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    User Information:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><PersonIcon /></ListItemIcon>
                      <ListItemText 
                        primary={selectedContent.userName}
                        secondary={selectedContent.userEmail}
                      />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Analysis Results:
                  </Typography>
                  <List dense>
                    {selectedContent.automatedAnalysis.flags.map((flag) => (
                      <ListItem key={flag}>
                        <ListItemIcon><FlagIcon color="error" /></ListItemIcon>
                        <ListItemText primary={flag} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Recommendations:
                  </Typography>
                  <List dense>
                    {selectedContent.automatedAnalysis.recommendations.map((rec, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                
                {selectedContent.status === 'PENDING' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Reason (optional)"
                      multiline
                      rows={3}
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="Provide reason for moderation action..."
                      data-testid="cs-moderation-reason"
                    />
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            
            <DialogActions>
              {selectedContent.status === 'PENDING' && (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<ApproveIcon />}
                    onClick={() => handleModerationAction(selectedContent.id, 'APPROVED')}
                    disabled={pendingAction === selectedContent.id}
                    data-testid="cs-moderation-approve"
                  >
                    Approve
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<WarningIcon />}
                    onClick={() => handleModerationAction(selectedContent.id, 'HIDDEN')}
                    disabled={pendingAction === selectedContent.id}
                    data-testid="cs-moderation-hide"
                  >
                    Hide
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<BlockIcon />}
                    onClick={() => handleModerationAction(selectedContent.id, 'REJECTED')}
                    disabled={pendingAction === selectedContent.id}
                    data-testid="cs-moderation-reject"
                  >
                    Reject
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleModerationAction(selectedContent.id, 'DELETED')}
                    disabled={pendingAction === selectedContent.id}
                    data-testid="cs-moderation-delete"
                  >
                    Delete
                  </Button>
                </>
              )}
              
              <Button 
                onClick={() => setDialogOpen(false)}
                data-testid="cs-moderation-dialog-close"
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default ContentModerationPage;