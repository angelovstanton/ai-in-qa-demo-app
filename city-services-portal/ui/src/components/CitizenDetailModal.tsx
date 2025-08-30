import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Avatar,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  EmojiEvents as TrophyIcon,
  Comment as CommentIcon,
  ThumbUp as ThumbUpIcon,
  Assignment as RequestIcon,
  CheckCircle as ApprovedIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import api from '../lib/api';

interface CitizenDetailModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  period: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`citizen-detail-tabpanel-${index}`}
      aria-labelledby={`citizen-detail-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const CitizenDetailModal: React.FC<CitizenDetailModalProps> = ({
  open,
  onClose,
  userId,
  userName,
  period,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [userRequests, setUserRequests] = useState<any[]>([]);
  const [userComments, setUserComments] = useState<any[]>([]);
  const [userAchievements, setUserAchievements] = useState<any[]>([]);

  useEffect(() => {
    if (open && userId) {
      fetchUserDetails();
    }
  }, [open, userId, period]);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('period', period);

      const [statsRes, requestsRes, commentsRes, achievementsRes] = await Promise.all([
        api.get(`/community/users/${userId}/stats?${params}`),
        api.get(`/community/users/${userId}/requests?limit=10`),
        api.get(`/community/comments?userId=${userId}&limit=10`),
        api.get(`/community/users/${userId}/achievements`),
      ]);

      setUserStats(statsRes.data.data);
      setUserRequests(requestsRes.data.data || []);
      setUserComments(commentsRes.data.data || []);
      setUserAchievements(achievementsRes.data.data || []);
    } catch (err: any) {
      console.error('Error fetching user details:', err);
      setError('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      NEW: 'info',
      IN_REVIEW: 'warning',
      APPROVED: 'success',
      IN_PROGRESS: 'primary',
      RESOLVED: 'success',
      REJECTED: 'error',
      CLOSED: 'default',
    };
    return statusColors[status] || 'default';
  };

  const getTierColor = (tier: string) => {
    const tierColors: Record<string, string> = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
    };
    return tierColors[tier] || '#666';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
              {userName.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </Avatar>
            <Typography variant="h6">{userName}</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            {/* Stats Overview */}
            {userStats && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1}>
                        <RequestIcon color="primary" />
                        <Box>
                          <Typography variant="h5">
                            {userStats.requestsSubmitted}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Requests
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1}>
                        <ApprovedIcon color="success" />
                        <Box>
                          <Typography variant="h5">
                            {userStats.requestsApproved}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Approved
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CommentIcon color="info" />
                        <Box>
                          <Typography variant="h5">
                            {userStats.commentsPosted}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Comments
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1}>
                        <ThumbUpIcon color="secondary" />
                        <Box>
                          <Typography variant="h5">
                            {userStats.upvotesReceived}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Upvotes
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="Recent Requests" />
                <Tab label="Comments" />
                <Tab label="Achievements" />
              </Tabs>
            </Box>

            {/* Recent Requests Tab */}
            <TabPanel value={activeTab} index={0}>
              {userRequests.length === 0 ? (
                <Typography color="text.secondary" align="center" py={3}>
                  No requests found
                </Typography>
              ) : (
                <List>
                  {userRequests.map((request, index) => (
                    <React.Fragment key={request.id}>
                      {index > 0 && <Divider />}
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle2">
                                {request.title}
                              </Typography>
                              <Chip
                                label={request.status}
                                size="small"
                                color={getStatusColor(request.status) as any}
                              />
                              <Chip
                                label={request.category}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {request.description}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={2} mt={1}>
                                <Typography variant="caption" color="text.secondary">
                                  <CalendarIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                                  {format(parseISO(request.createdAt), 'MMM dd, yyyy')}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  <ThumbUpIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                                  {request.upvotes || 0} upvotes
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  <CommentIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                                  {request.commentCount || 0} comments
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </TabPanel>

            {/* Comments Tab */}
            <TabPanel value={activeTab} index={1}>
              {userComments.length === 0 ? (
                <Typography color="text.secondary" align="center" py={3}>
                  No comments found
                </Typography>
              ) : (
                <List>
                  {userComments.map((comment, index) => (
                    <React.Fragment key={comment.id}>
                      {index > 0 && <Divider />}
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2">
                              On: {comment.requestTitle || 'Request'}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {comment.content}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={2} mt={1}>
                                <Typography variant="caption" color="text.secondary">
                                  <CalendarIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                                  {format(parseISO(comment.createdAt), 'MMM dd, yyyy')}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  <ThumbUpIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                                  {comment.upvotes || 0} upvotes
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </TabPanel>

            {/* Achievements Tab */}
            <TabPanel value={activeTab} index={2}>
              {userAchievements.length === 0 ? (
                <Typography color="text.secondary" align="center" py={3}>
                  No achievements unlocked yet
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {userAchievements.map((achievement) => (
                    <Grid item xs={12} sm={6} key={achievement.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" alignItems="center" gap={2}>
                            <TrophyIcon
                              sx={{
                                fontSize: 40,
                                color: getTierColor(achievement.tier),
                              }}
                            />
                            <Box flex={1}>
                              <Typography variant="subtitle1">
                                {achievement.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {achievement.description}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1} mt={1}>
                                <Chip
                                  label={achievement.tier}
                                  size="small"
                                  sx={{
                                    backgroundColor: getTierColor(achievement.tier),
                                    color: 'white',
                                  }}
                                />
                                <Chip
                                  label={`${achievement.points} pts`}
                                  size="small"
                                  variant="outlined"
                                />
                                <Typography variant="caption" color="text.secondary">
                                  Unlocked {format(parseISO(achievement.unlockedAt), 'MMM dd, yyyy')}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </TabPanel>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CitizenDetailModal;