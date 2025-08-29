import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Button,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Star as StarIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  GetApp as ExportIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { Slider, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

interface StaffMember {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
  department: {
    id: string;
    name: string;
    slug: string;
  };
  performancePeriod: string;
  averageHandlingTime: number;
  completedRequests: number;
  qualityScore: number;
  citizenSatisfactionRating: number;
  overtimeHours: number;
  productivityScore: number;
  goalsAchieved: number;
  goalsMissed: number;
  trainingHoursCompleted: number;
}

const StaffPerformanceReportPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [staffData, setStaffData] = useState<StaffMember | null>(location.state?.staffMember || null);
  const [loading, setLoading] = useState(!staffData);
  const [error, setError] = useState<string | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);
  const [editSkillsMode, setEditSkillsMode] = useState(false);
  const [editedSkills, setEditedSkills] = useState<any>({});
  const [skillsSaveLoading, setSkilsSaveLoading] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [meetingData, setMeetingData] = useState({
    date: '',
    time: '',
    agenda: '',
    location: '',
  });
  const [skillsData, setSkillsData] = useState({
    technical: 85,
    communication: 92,
    problemSolving: 88,
    timeManagement: 76,
    customerService: 94,
    teamwork: 89,
  });

  // Sample historical data - in a real app, this would be fetched from API
  const performanceTrend = [
    { period: 'Jan', quality: 8.2, productivity: 85, satisfaction: 4.1, requests: 45 },
    { period: 'Feb', quality: 8.5, productivity: 87, satisfaction: 4.2, requests: 52 },
    { period: 'Mar', quality: 8.1, productivity: 83, satisfaction: 4.0, requests: 38 },
    { period: 'Apr', quality: 8.7, productivity: 89, satisfaction: 4.3, requests: 47 },
    { period: 'May', quality: 8.9, productivity: 91, satisfaction: 4.4, requests: 55 },
    { period: 'Jun', quality: staffData?.qualityScore || 8.6, productivity: staffData?.productivityScore || 88, satisfaction: staffData?.citizenSatisfactionRating || 4.2, requests: staffData?.completedRequests || 50 },
  ];

  // Generate skills radar data dynamically
  const skillsRadarData = [
    { skill: 'Technical Skills', current: skillsData.technical, target: 90 },
    { skill: 'Communication', current: skillsData.communication, target: 85 },
    { skill: 'Problem Solving', current: skillsData.problemSolving, target: 85 },
    { skill: 'Time Management', current: skillsData.timeManagement, target: 80 },
    { skill: 'Customer Service', current: skillsData.customerService, target: 90 },
    { skill: 'Teamwork', current: skillsData.teamwork, target: 85 },
  ];

  useEffect(() => {
    if (!staffData && userId) {
      fetchStaffData();
    }
  }, [userId]);

  const fetchStaffData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/supervisor/staff-performance?userId=${userId}&size=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setStaffData(data.data[0]);
      } else {
        setError('Staff member not found');
      }
    } catch (err) {
      console.error('Error fetching staff data:', err);
      setError('Failed to load staff data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSkills = async () => {
    setSkilsSaveLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/v1/supervisor/staff-performance/${staffData?.id}/skills`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedSkills),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update the local skills data state to reflect changes in the chart
      setSkillsData(editedSkills);
      setEditSkillsMode(false);
      setError(null); // Clear any previous errors
      
      // Optionally refetch the data to get any server-side calculations
      await fetchStaffData();
    } catch (err) {
      console.error('Error saving skills:', err);
      setError('Failed to save skills assessment.');
    } finally {
      setSkilsSaveLoading(false);
    }
  };

  const handleScheduleMeeting = async () => {
    if (!meetingData.date || !meetingData.time) return;
    
    try {
      // In a real app, this would create a calendar event via API
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      setScheduleDialogOpen(false);
      setMeetingData({ date: '', time: '', agenda: '', location: '' });
      alert('Review meeting scheduled successfully!');
    } catch (err) {
      console.error('Error scheduling meeting:', err);
      setError('Failed to schedule meeting.');
    }
  };

  const handleExportReport = () => {
    // Generate a simple text report
    const reportContent = `
PERFORMANCE REPORT
==================
Staff Member: ${staffData?.user.name}
Email: ${staffData?.user.email}
Role: ${staffData?.user.role}
Department: ${staffData?.department.name}
Period: ${staffData?.performancePeriod}

PERFORMANCE METRICS
==================
Quality Score: ${staffData?.qualityScore.toFixed(1)}/10
Productivity Score: ${staffData?.productivityScore.toFixed(0)}%
Citizen Satisfaction: ${staffData?.citizenSatisfactionRating.toFixed(1)}/5
Completed Requests: ${staffData?.completedRequests}
Average Handling Time: ${staffData?.averageHandlingTime}h

GOALS & DEVELOPMENT
==================
Goals Achieved: ${staffData?.goalsAchieved}
Goals Missed: ${staffData?.goalsMissed}
Training Hours: ${staffData?.trainingHoursCompleted}h
Overtime Hours: ${staffData?.overtimeHours.toFixed(1)}h

Generated on: ${new Date().toLocaleDateString()}
    `;

    // Create and download the file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${staffData?.user.name?.replace(/\s+/g, '_')}_Performance_Report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number, max: number = 10) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !staffData) {
    return (
      <Box m={2}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchStaffData}>
            Retry
          </Button>
        }>
          {error || 'Staff member not found'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box data-testid="cs-staff-performance-report-page">
      {/* Header */}
      <Box mb={3} display="flex" alignItems="center" gap={2}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/supervisor/staff-performance')}
          variant="outlined"
        >
          Back to Staff Performance
        </Button>
        <Typography variant="h4" component="h1">
          Performance Report: {staffData.user.name}
        </Typography>
      </Box>

      {/* Staff Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
                <PersonIcon sx={{ fontSize: 40 }} />
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h5" gutterBottom>
                {staffData.user.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {staffData.user.email} • {staffData.user.role}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Department: {staffData.department.name} • Period: {staffData.performancePeriod}
              </Typography>
            </Grid>
            <Grid item>
              <Box textAlign="center">
                <Typography variant="h3" color="primary.main">
                  {staffData.qualityScore.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overall Quality Score
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Productivity Score
                  </Typography>
                  <Typography variant="h4">
                    {staffData.productivityScore.toFixed(0)}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={staffData.productivityScore} 
                color="success"
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Satisfaction Rating
                  </Typography>
                  <Typography variant="h4">
                    {staffData.citizenSatisfactionRating.toFixed(1)}/5
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <StarIcon />
                </Avatar>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={staffData.citizenSatisfactionRating * 20} 
                color="warning"
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Completed Requests
                  </Typography>
                  <Typography variant="h4">
                    {staffData.completedRequests}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Avg Handling Time
                  </Typography>
                  <Typography variant="h4">
                    {staffData.averageHandlingTime}h
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <ScheduleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} mb={4}>
        {/* Performance Trend */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Trend (Last 6 Months)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="quality" 
                    stroke="#8884d8" 
                    strokeWidth={3}
                    name="Quality Score"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="productivity" 
                    stroke="#82ca9d" 
                    strokeWidth={3}
                    name="Productivity %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="satisfaction" 
                    stroke="#ffc658" 
                    strokeWidth={3}
                    name="Satisfaction"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Skills Radar */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Skills Assessment
                </Typography>
                {!editSkillsMode ? (
                  <Button
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setEditSkillsMode(true);
                      // Initialize edited skills with current values
                      setEditedSkills({ ...skillsData });
                    }}
                    size="small"
                  >
                    Edit
                  </Button>
                ) : (
                  <Box display="flex" gap={1}>
                    <Button
                      startIcon={<SaveIcon />}
                      onClick={handleSaveSkills}
                      disabled={skillsSaveLoading}
                      size="small"
                      color="primary"
                    >
                      Save
                    </Button>
                    <Button
                      startIcon={<CancelIcon />}
                      onClick={() => setEditSkillsMode(false)}
                      size="small"
                      color="secondary"
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
              </Box>

              {editSkillsMode ? (
                <Box>
                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Technical Skills: {editedSkills.technical || 0}%
                    </Typography>
                    <Slider
                      value={editedSkills.technical || 0}
                      onChange={(e, value) => setEditedSkills(prev => ({ ...prev, technical: value as number }))}
                      min={0}
                      max={100}
                      step={5}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Communication: {editedSkills.communication || 0}%
                    </Typography>
                    <Slider
                      value={editedSkills.communication || 0}
                      onChange={(e, value) => setEditedSkills(prev => ({ ...prev, communication: value as number }))}
                      min={0}
                      max={100}
                      step={5}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Problem Solving: {editedSkills.problemSolving || 0}%
                    </Typography>
                    <Slider
                      value={editedSkills.problemSolving || 0}
                      onChange={(e, value) => setEditedSkills(prev => ({ ...prev, problemSolving: value as number }))}
                      min={0}
                      max={100}
                      step={5}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Time Management: {editedSkills.timeManagement || 0}%
                    </Typography>
                    <Slider
                      value={editedSkills.timeManagement || 0}
                      onChange={(e, value) => setEditedSkills(prev => ({ ...prev, timeManagement: value as number }))}
                      min={0}
                      max={100}
                      step={5}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Customer Service: {editedSkills.customerService || 0}%
                    </Typography>
                    <Slider
                      value={editedSkills.customerService || 0}
                      onChange={(e, value) => setEditedSkills(prev => ({ ...prev, customerService: value as number }))}
                      min={0}
                      max={100}
                      step={5}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Teamwork: {editedSkills.teamwork || 0}%
                    </Typography>
                    <Slider
                      value={editedSkills.teamwork || 0}
                      onChange={(e, value) => setEditedSkills(prev => ({ ...prev, teamwork: value as number }))}
                      min={0}
                      max={100}
                      step={5}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={skillsRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" />
                    <PolarRadiusAxis 
                      angle={90}
                      domain={[0, 100]}
                      tickCount={5}
                    />
                    <Radar
                      name="Current"
                      dataKey="current"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Target"
                      dataKey="target"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.1}
                    />
                    <Legend />
                    <RechartsTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Metrics */}
      <Grid container spacing={3} mb={4}>
        {/* Goals and Training */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Goals & Development
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Goals Achieved"
                    secondary={`${staffData.goalsAchieved} out of ${staffData.goalsAchieved + staffData.goalsMissed} goals completed`}
                  />
                  <Chip 
                    label={staffData.goalsAchieved} 
                    color="success" 
                    variant="outlined"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Goals Missed"
                    secondary="Areas requiring attention"
                  />
                  <Chip 
                    label={staffData.goalsMissed} 
                    color={staffData.goalsMissed > 0 ? 'error' : 'success'} 
                    variant="outlined"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Training Hours"
                    secondary="Professional development completed"
                  />
                  <Chip 
                    label={`${staffData.trainingHoursCompleted}h`} 
                    color="primary" 
                    variant="outlined"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Overtime Hours"
                    secondary="Additional hours worked"
                  />
                  <Chip 
                    label={`${staffData.overtimeHours.toFixed(1)}h`} 
                    color={staffData.overtimeHours > 10 ? 'warning' : 'success'} 
                    variant="outlined"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Breakdown */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Breakdown
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell align="center">Score</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Quality Score</TableCell>
                      <TableCell align="center">{staffData.qualityScore.toFixed(1)}/10</TableCell>
                      <TableCell align="center">
                        <Chip 
                          size="small" 
                          label={getScoreColor(staffData.qualityScore)} 
                          color={getScoreColor(staffData.qualityScore) as any}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Productivity</TableCell>
                      <TableCell align="center">{staffData.productivityScore.toFixed(0)}%</TableCell>
                      <TableCell align="center">
                        <Chip 
                          size="small" 
                          label={getScoreColor(staffData.productivityScore, 100)} 
                          color={getScoreColor(staffData.productivityScore, 100) as any}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Satisfaction</TableCell>
                      <TableCell align="center">{staffData.citizenSatisfactionRating.toFixed(1)}/5</TableCell>
                      <TableCell align="center">
                        <Chip 
                          size="small" 
                          label={getScoreColor(staffData.citizenSatisfactionRating, 5)} 
                          color={getScoreColor(staffData.citizenSatisfactionRating, 5) as any}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Handling Time</TableCell>
                      <TableCell align="center">{staffData.averageHandlingTime}h</TableCell>
                      <TableCell align="center">
                        <Chip 
                          size="small" 
                          label={staffData.averageHandlingTime < 48 ? 'success' : 'warning'} 
                          color={staffData.averageHandlingTime < 48 ? 'success' : 'warning'}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box display="flex" gap={2} justifyContent="center" mt={4}>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/supervisor/staff-performance')}
        >
          Back to Performance List
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<ExportIcon />}
          onClick={handleExportReport}
        >
          Export Report
        </Button>
        <Button 
          variant="contained" 
          color="secondary"
          startIcon={<EventIcon />}
          onClick={() => setScheduleDialogOpen(true)}
        >
          Schedule Review Meeting
        </Button>
      </Box>

      {/* Schedule Meeting Dialog */}
      <Dialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Schedule Review Meeting</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Meeting Date"
                  type="date"
                  fullWidth
                  value={meetingData.date}
                  onChange={(e) => setMeetingData(prev => ({ ...prev, date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Meeting Time"
                  type="time"
                  fullWidth
                  value={meetingData.time}
                  onChange={(e) => setMeetingData(prev => ({ ...prev, time: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Location"
                  fullWidth
                  value={meetingData.location}
                  onChange={(e) => setMeetingData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Conference Room, Video Call Link, etc."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Agenda"
                  multiline
                  rows={4}
                  fullWidth
                  value={meetingData.agenda}
                  onChange={(e) => setMeetingData(prev => ({ ...prev, agenda: e.target.value }))}
                  placeholder="Meeting agenda and discussion points..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleScheduleMeeting}
            disabled={!meetingData.date || !meetingData.time}
          >
            Schedule Meeting
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffPerformanceReportPage;