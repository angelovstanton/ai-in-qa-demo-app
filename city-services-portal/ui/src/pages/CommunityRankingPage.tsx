import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Paper,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
  Skeleton,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Divider,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon,
  CheckCircle as ApprovedIcon,
  Assignment as RequestIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  WorkspacePremium as BadgeIcon,
  Timeline as TimelineIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import api from '../lib/api';
import CitizenDetailModal from '../components/CitizenDetailModal';
import { useAuth } from '../contexts/AuthContext';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userEmail: string;
  overallScore: number;
  contributionScore: number;
  engagementScore: number;
  qualityScore: number;
  requestsSubmitted: number;
  requestsApproved: number;
  commentsPosted: number;
  upvotesReceived: number;
  badges?: Achievement[];
  change?: number;
}

interface CommunityStats {
  period: string;
  periodStart: string;
  periodEnd: string;
  requestsSubmitted: number;
  requestsApproved: number;
  requestsResolved: number;
  commentsPosted: number;
  upvotesReceived: number;
  upvotesGiven: number;
  contributionScore: number;
  engagementScore: number;
  qualityScore: number;
  overallScore: number;
  rank?: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: string;
  tier: string;
  points: number;
}

interface StatisticsOverview {
  period: string;
  leaderboard: LeaderboardEntry[];
  summary: {
    totalUsers: number;
    averageScores: {
      contributionScore: number;
      engagementScore: number;
      qualityScore: number;
      overallScore: number;
    };
    totals: {
      requestsSubmitted: number;
      requestsApproved: number;
      requestsResolved: number;
      commentsPosted: number;
      upvotesReceived: number;
      upvotesGiven: number;
    };
  };
  trends: any[];
  topCategories: { category: string; count: number }[];
  recentAchievements: any[];
  charts: {
    contributionTrend: { date: string; value: number }[];
    engagementTrend: { date: string; value: number }[];
    qualityTrend: { date: string; value: number }[];
    categoryDistribution: { name: string; value: number }[];
  };
}

const CHART_COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#00BCD4', '#FFC107', '#795548'];

const CommunityRankingPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'all-time'>('monthly');
  const [category, setCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState<CommunityStats | null>(null);
  const [myAchievements, setMyAchievements] = useState<Achievement[]>([]);
  const [overview, setOverview] = useState<StatisticsOverview | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, [period, category]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('period', period);
      if (category) params.append('category', category);

      const [overviewRes, myStatsRes, myAchievementsRes, achievementsRes] = await Promise.all([
        api.get(`/community/statistics/overview?${params}`),
        api.get(`/community/my-stats?${params}`).catch(() => null),
        api.get(`/community/users/${user?.id}/achievements`).catch(() => null),
        api.get('/community/achievements'),
      ]);

      if (overviewRes.data) {
        setOverview(overviewRes.data.data);
        setLeaderboard(overviewRes.data.data.leaderboard || []);
      }
      
      if (myStatsRes?.data) {
        setMyStats(myStatsRes.data.data);
      }
      
      if (myAchievementsRes?.data) {
        setMyAchievements(myAchievementsRes.data.data.map((ua: any) => ua.achievement));
      }
      
      if (achievementsRes.data) {
        setAchievements(achievementsRes.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching community data:', err);
      setError(err.response?.data?.error || 'Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return '#E5E4E2';
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze': return '#CD7F32';
      default: return '#757575';
    }
  };

  const getRankChangeIcon = (change?: number) => {
    if (!change || change === 0) return null;
    if (change > 0) {
      return <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />;
    }
    return <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16 }} />;
  };

  const renderStatCard = (title: string, value: string | number, icon: React.ReactNode, color: string) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: `${color}.light`, mr: 2 }}>
            {icon}
          </Avatar>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ color: `${color}.main`, fontWeight: 'bold' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  const renderLeaderboard = () => (
    <Box>
      {category && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Showing users with activity in <strong>{category}</strong> category. 
          Note: Scores reflect overall contributions across all categories.
        </Alert>
      )}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
            <TableCell>Rank</TableCell>
            <TableCell>Citizen</TableCell>
            <TableCell align="center">Contribution</TableCell>
            <TableCell align="center">Engagement</TableCell>
            <TableCell align="center">Quality</TableCell>
            <TableCell align="center">Overall Score</TableCell>
            <TableCell align="center">Badges</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {leaderboard.map((entry) => (
            <TableRow 
              key={entry.userId}
              onClick={() => setSelectedUser({ id: entry.userId, name: entry.userName })}
              sx={{ 
                bgcolor: entry.userId === user?.id ? 'action.selected' : 'inherit',
                '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' }
              }}
            >
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label={`#${entry.rank}`}
                    size="small"
                    color={entry.rank <= 3 ? 'primary' : 'default'}
                  />
                  {getRankChangeIcon(entry.change)}
                  {entry.change && entry.change !== 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {Math.abs(entry.change)}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {entry.userName.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {entry.userName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {entry.requestsSubmitted} requests • {entry.commentsPosted} comments
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" fontWeight="bold">
                  {entry.contributionScore.toFixed(0)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" fontWeight="bold">
                  {entry.engagementScore.toFixed(0)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" fontWeight="bold">
                  {entry.qualityScore.toFixed(0)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="h6" color="primary">
                  {entry.overallScore.toFixed(0)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Stack direction="row" spacing={0.5} justifyContent="center">
                  {entry.badges?.slice(0, 3).map((badge) => (
                    <Tooltip key={badge.id} title={badge.name}>
                      <Chip
                        size="small"
                        label={badge.icon || badge.tier.charAt(0).toUpperCase()}
                        sx={{ 
                          bgcolor: getTierColor(badge.tier),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Tooltip>
                  ))}
                  {entry.badges && entry.badges.length > 3 && (
                    <Chip size="small" label={`+${entry.badges.length - 3}`} />
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </TableContainer>
    </Box>
  );

  const renderCharts = () => {
    if (!overview?.charts) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Contribution Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={overview.charts.contributionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                />
                <YAxis />
                <ChartTooltip />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#4CAF50" 
                  fill="#4CAF50" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Category Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={overview.charts.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} (${entry.value})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {overview.charts.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Engagement vs Quality Metrics
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={overview.charts.engagementTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                />
                <YAxis />
                <ChartTooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2196F3" 
                  name="Engagement"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderAchievements = () => {
    const groupedAchievements = achievements.reduce((acc, achievement) => {
      if (!acc[achievement.category]) {
        acc[achievement.category] = [];
      }
      acc[achievement.category].push(achievement);
      return acc;
    }, {} as Record<string, Achievement[]>);

    return (
      <Grid container spacing={3}>
        {Object.entries(groupedAchievements).map(([categoryName, categoryAchievements]) => (
          <Grid item xs={12} key={categoryName}>
            <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
              {categoryName} Achievements
            </Typography>
            <Grid container spacing={2}>
              {categoryAchievements.map((achievement) => {
                const isUnlocked = myAchievements.some(ma => ma.id === achievement.id);
                return (
                  <Grid item xs={12} sm={6} md={3} key={achievement.id}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        opacity: isUnlocked ? 1 : 0.6,
                        border: isUnlocked ? 2 : 0,
                        borderColor: getTierColor(achievement.tier)
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Badge
                            badgeContent={isUnlocked ? '✓' : null}
                            color="success"
                          >
                            <Avatar sx={{ bgcolor: getTierColor(achievement.tier) }}>
                              <BadgeIcon />
                            </Avatar>
                          </Badge>
                          <Box sx={{ ml: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {achievement.name}
                            </Typography>
                            <Chip 
                              label={achievement.tier} 
                              size="small"
                              sx={{ 
                                bgcolor: getTierColor(achievement.tier),
                                color: 'white',
                                fontSize: '0.7rem'
                              }}
                            />
                          </Box>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {achievement.description}
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          <strong>{achievement.points}</strong> points
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderMyStats = () => {
    if (!myStats) return null;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                My Performance
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Current Rank
                </Typography>
                <Typography variant="h3" color="primary">
                  #{myStats.rank || 'N/A'}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Requests Submitted</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {myStats.requestsSubmitted}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Requests Approved</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {myStats.requestsApproved}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Comments Posted</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {myStats.commentsPosted}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Upvotes Received</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {myStats.upvotesReceived}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Score Breakdown
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {myStats.contributionScore.toFixed(0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Contribution
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(100, (myStats.contributionScore / 1000) * 100)}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="secondary">
                      {myStats.engagementScore.toFixed(0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Engagement
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(100, (myStats.engagementScore / 500) * 100)}
                      sx={{ mt: 1 }}
                      color="secondary"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {myStats.qualityScore.toFixed(0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Quality
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(100, myStats.qualityScore)}
                      sx={{ mt: 1 }}
                      color="warning"
                    />
                  </Box>
                </Grid>
              </Grid>
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="h5">
                  Overall Score: <strong>{myStats.overallScore.toFixed(0)}</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Community Rankings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Recognizing our most active and helpful community members
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Period</InputLabel>
              <Select
                value={period}
                label="Period"
                onChange={(e) => setPeriod(e.target.value as any)}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
                <MenuItem value="all-time">All Time</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="Infrastructure">Infrastructure</MenuItem>
                <MenuItem value="Parks & Recreation">Parks & Recreation</MenuItem>
                <MenuItem value="Public Safety">Public Safety</MenuItem>
                <MenuItem value="Transportation">Transportation</MenuItem>
                <MenuItem value="Utilities">Utilities</MenuItem>
                <MenuItem value="Waste Management">Waste Management</MenuItem>
                <MenuItem value="Environmental">Environmental</MenuItem>
                <MenuItem value="Code Enforcement">Code Enforcement</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={6}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchData}
                disabled={loading}
              >
                Refresh
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistics Overview */}
      {overview?.summary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            {renderStatCard(
              'Active Citizens',
              overview.summary.totalUsers,
              <PeopleIcon />,
              'primary'
            )}
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            {renderStatCard(
              'Total Requests',
              overview.summary.totals.requestsSubmitted,
              <RequestIcon />,
              'secondary'
            )}
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            {renderStatCard(
              'Approved',
              overview.summary.totals.requestsApproved,
              <ApprovedIcon />,
              'success'
            )}
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            {renderStatCard(
              'Community Score',
              Math.round(overview.summary.averageScores.overallScore),
              <StarIcon />,
              'warning'
            )}
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Leaderboard" icon={<TrophyIcon />} iconPosition="start" />
          <Tab label="My Stats" icon={<StarIcon />} iconPosition="start" />
          <Tab label="Achievements" icon={<BadgeIcon />} iconPosition="start" />
          <Tab label="Analytics" icon={<TimelineIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mt: 3 }}>
        {loading ? (
          <Box>
            <Skeleton variant="rectangular" height={400} />
          </Box>
        ) : (
          <>
            {activeTab === 0 && renderLeaderboard()}
            {activeTab === 1 && renderMyStats()}
            {activeTab === 2 && renderAchievements()}
            {activeTab === 3 && renderCharts()}
          </>
        )}
      </Box>
      
      {/* Citizen Detail Modal */}
      {selectedUser && (
        <CitizenDetailModal
          open={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          userId={selectedUser.id}
          userName={selectedUser.name}
          period={period}
        />
      )}
    </Container>
  );
};

export default CommunityRankingPage;