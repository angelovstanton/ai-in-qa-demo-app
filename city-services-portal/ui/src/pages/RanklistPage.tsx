import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Container,
  Grid,
  Paper,
  LinearProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Person as PersonIcon,
  TrendingUp as TrendingIcon,
  CheckCircle as ApprovedIcon,
  Star as StarIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../lib/api';

interface RanklistUser {
  id: string;
  name: string;
  email: string;
  approvedRequestsCount: number;
  totalRequestsCount: number;
  approvalRate: number;
  averageRating: number;
  rank: number;
  badge?: 'gold' | 'silver' | 'bronze';
  joinedDate: string;
  lastRequestDate?: string;
}

interface RanklistStats {
  totalUsers: number;
  totalApprovedRequests: number;
  averageApprovalRate: number;
  topPerformerImprovement: number;
}

const RanklistPage: React.FC = () => {
  const [users, setUsers] = useState<RanklistUser[]>([]);
  const [stats, setStats] = useState<RanklistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'all' | 'year' | 'month'>('all');
  const [category, setCategory] = useState<string>('street-lighting');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchRanklistData();
  }, [timeframe, category]);

  const fetchRanklistData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        timeframe,
        category,
      });

      const [usersResponse, statsResponse] = await Promise.all([
        api.get(`/rankings/users?${params}`),
        api.get(`/rankings/stats?${params}`)
      ]);

      setUsers(usersResponse.data.data);
      setStats(statsResponse.data.data);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch ranking data');
      
      // Fallback to mock data for demo purposes
      const mockUsers: RanklistUser[] = [
        {
          id: '1',
          name: 'John Smith',
          email: 'john@example.com',
          approvedRequestsCount: 45,
          totalRequestsCount: 50,
          approvalRate: 90,
          averageRating: 4.8,
          rank: 1,
          badge: 'gold',
          joinedDate: '2023-01-15T00:00:00Z',
          lastRequestDate: '2024-01-15T10:30:00Z',
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          approvedRequestsCount: 38,
          totalRequestsCount: 42,
          approvalRate: 88,
          averageRating: 4.6,
          rank: 2,
          badge: 'silver',
          joinedDate: '2023-02-20T00:00:00Z',
          lastRequestDate: '2024-01-14T15:45:00Z',
        },
        {
          id: '3',
          name: 'Mike Wilson',
          email: 'mike@example.com',
          approvedRequestsCount: 32,
          totalRequestsCount: 38,
          approvalRate: 84,
          averageRating: 4.4,
          rank: 3,
          badge: 'bronze',
          joinedDate: '2023-03-10T00:00:00Z',
          lastRequestDate: '2024-01-13T09:20:00Z',
        },
        {
          id: '4',
          name: 'Emily Davis',
          email: 'emily@example.com',
          approvedRequestsCount: 28,
          totalRequestsCount: 35,
          approvalRate: 80,
          averageRating: 4.2,
          rank: 4,
          joinedDate: '2023-04-05T00:00:00Z',
          lastRequestDate: '2024-01-12T14:10:00Z',
        },
        {
          id: '5',
          name: 'David Brown',
          email: 'david@example.com',
          approvedRequestsCount: 25,
          totalRequestsCount: 32,
          approvalRate: 78,
          averageRating: 4.0,
          rank: 5,
          joinedDate: '2023-05-12T00:00:00Z',
          lastRequestDate: '2024-01-11T11:30:00Z',
        },
      ];

      const mockStats: RanklistStats = {
        totalUsers: 245,
        totalApprovedRequests: 1823,
        averageApprovalRate: 82.5,
        topPerformerImprovement: 15.2,
      };

      setUsers(mockUsers);
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (badge?: string) => {
    switch (badge) {
      case 'gold':
        return <TrophyIcon sx={{ color: '#FFD700' }} />;
      case 'silver':
        return <TrophyIcon sx={{ color: '#C0C0C0' }} />;
      case 'bronze':
        return <TrophyIcon sx={{ color: '#CD7F32' }} />;
      default:
        return <PersonIcon />;
    }
  };

  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'gold':
        return '#FFD700';
      case 'silver':
        return '#C0C0C0';
      case 'bronze':
        return '#CD7F32';
      default:
        return '#757575';
    }
  };

  const getRankDisplayColor = (rank: number) => {
    if (rank === 1) return 'success';
    if (rank <= 3) return 'warning';
    if (rank <= 10) return 'primary';
    return 'secondary';
  };

  return (
    <Container maxWidth="lg" data-testid="cs-ranklist-page">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" data-testid="cs-ranklist-title">
            Community Ranklist
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchRanklistData}
            disabled={loading}
            data-testid="cs-ranklist-refresh"
          >
            Refresh
          </Button>
        </Box>

        <Typography variant="body1" color="text.secondary" gutterBottom component="div">
          Recognizing citizens who contribute most effectively to community improvement
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} data-testid="cs-ranklist-error">
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }} data-testid="cs-ranklist-filters">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Timeframe</InputLabel>
                <Select
                  value={timeframe}
                  label="Timeframe"
                  onChange={(e) => setTimeframe(e.target.value as any)}
                  data-testid="cs-ranklist-timeframe"
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="year">This Year</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  label="Category"
                  onChange={(e) => setCategory(e.target.value)}
                  data-testid="cs-ranklist-category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="roads-transportation">Roads & Transportation</MenuItem>
                  <MenuItem value="street-lighting">Street Lighting</MenuItem>
                  <MenuItem value="waste-management">Waste Management</MenuItem>
                  <MenuItem value="parks-recreation">Parks & Recreation</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary">
                Last updated: {format(lastUpdated, 'PPpp')}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Statistics Overview */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card data-testid="cs-ranklist-stat-users">
                <CardContent sx={{ textAlign: 'center' }}>
                  <PersonIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" color="primary.main">
                    {stats.totalUsers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" component="div">
                    Active Citizens
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card data-testid="cs-ranklist-stat-approved">
                <CardContent sx={{ textAlign: 'center' }}>
                  <ApprovedIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4" color="success.main">
                    {stats.totalApprovedRequests}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" component="div">
                    Approved Requests
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card data-testid="cs-ranklist-stat-rate">
                <CardContent sx={{ textAlign: 'center' }}>
                  <StarIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h4" color="warning.main">
                    {stats.averageApprovalRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" component="div">
                    Avg Approval Rate
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card data-testid="cs-ranklist-stat-improvement">
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                  <Typography variant="h4" color="info.main">
                    +{stats.topPerformerImprovement}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" component="div">
                    Top Performer Growth
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Ranklist */}
        <Card data-testid="cs-ranklist-table">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Contributors
            </Typography>
            
            {loading ? (
              <Box sx={{ py: 4 }}>
                <LinearProgress />
                <Typography variant="body2" color="text.secondary" component="div" sx={{ mt: 2, textAlign: 'center' }}>
                  Loading ranking data...
                </Typography>
              </Box>
            ) : (
              <List data-testid="cs-ranklist-list">
                {users.map((user, index) => (
                  <React.Fragment key={user.id}>
                    <ListItem
                      sx={{
                        py: 2,
                        px: 0,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                      data-testid={`cs-ranklist-user-${user.id}`}
                    >
                      <ListItemAvatar>
                        <Box sx={{ position: 'relative' }}>
                          <Avatar
                            sx={{
                              bgcolor: getBadgeColor(user.badge),
                              border: user.badge ? `2px solid ${getBadgeColor(user.badge)}` : 'none',
                            }}
                          >
                            {getBadgeIcon(user.badge)}
                          </Avatar>
                          <Chip
                            label={`#${user.rank}`}
                            size="small"
                            color={getRankDisplayColor(user.rank) as any}
                            sx={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              fontSize: '0.7rem',
                              height: 20,
                            }}
                          />
                        </Box>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {user.name}
                            </Typography>
                            {user.badge && (
                              <Chip
                                label={user.badge.toUpperCase()}
                                size="small"
                                sx={{
                                  bgcolor: getBadgeColor(user.badge),
                                  color: 'white',
                                  fontWeight: 'bold',
                                }}
                              />
                            )}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                              <Typography variant="caption">
                                {user.averageRating.toFixed(1)}
                              </Typography>
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12} sm={4}>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>{user.approvedRequestsCount}</strong> approved requests
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  out of {user.totalRequestsCount} total
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={12} sm={4}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2">Approval Rate:</Typography>
                                  <LinearProgress
                                    variant="determinate"
                                    value={user.approvalRate}
                                    sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                                    color={user.approvalRate >= 90 ? 'success' : user.approvalRate >= 80 ? 'warning' : 'error'}
                                  />
                                  <Typography variant="caption" fontWeight="bold">
                                    {user.approvalRate}%
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12} sm={4}>
                                <Typography variant="caption" color="text.secondary">
                                  Member since {format(new Date(user.joinedDate), 'MMM yyyy')}
                                </Typography>
                                {user.lastRequestDate && (
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Last active: {format(new Date(user.lastRequestDate), 'MMM dd')}
                                  </Typography>
                                )}
                              </Grid>
                            </Grid>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < users.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
            
            {!loading && users.length === 0 && (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <TrophyIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No ranking data available
                </Typography>
                <Typography variant="body2" color="text.secondary" component="div">
                  Be the first to submit approved requests and climb the leaderboard!
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Achievement Information */}
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'primary.50' }} data-testid="cs-ranklist-achievements">
          <Typography variant="h6" gutterBottom>
            How Rankings Work
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrophyIcon sx={{ color: '#FFD700', mr: 1 }} />
                <Typography variant="subtitle2">Gold Badge</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" component="div">
                90%+ approval rate with 30+ approved requests
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrophyIcon sx={{ color: '#C0C0C0', mr: 1 }} />
                <Typography variant="subtitle2">Silver Badge</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" component="div">
                85%+ approval rate with 20+ approved requests
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrophyIcon sx={{ color: '#CD7F32', mr: 1 }} />
                <Typography variant="subtitle2">Bronze Badge</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" component="div">
                80%+ approval rate with 10+ approved requests
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default RanklistPage;