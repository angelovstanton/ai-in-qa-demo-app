import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  Tooltip,
  InputAdornment,
  Card,
  CardContent,
  Stack,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  History as HistoryIcon,
  PersonAdd as PersonAddIcon,
  Groups as GroupsIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from '../../hooks/useSnackbar';

interface StaffAccount {
  id: string;
  email: string;
  name: string;
  role: string;
  departmentId?: string;
  department?: {
    id: string;
    name: string;
  };
  employeeId?: string;
  status: string;
  isStaffAccount: boolean;
  createdAt: string;
  createdByStaff?: {
    id: string;
    name: string;
    email: string;
  };
}

interface RoleHistory {
  id: string;
  previousRole?: string;
  newRole: string;
  changedBy: string;
  reason?: string;
  createdAt: string;
  performer: {
    id: string;
    name: string;
    email: string;
  };
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  hierarchy: number;
  isSystem: boolean;
  userCount: number;
  permissions: Permission[];
}

interface Permission {
  id: string;
  resource: string;
  action: string;
  scope?: string;
  description?: string;
  granted: boolean;
}

interface PermissionMatrix {
  roles: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
  permissions: Array<{
    id: string;
    resource: string;
    action: string;
    scope?: string;
    description?: string;
    [roleName: string]: any;
  }>;
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
      id={`role-tabpanel-${index}`}
      aria-labelledby={`role-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function StaffManagementPage() {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  
  const getToken = () => {
    return localStorage.getItem('accessToken');
  };

  const [tabValue, setTabValue] = useState(0);
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StaffAccount | null>(null);
  const [roleHistory, setRoleHistory] = useState<RoleHistory[]>([]);
  const [systemRoles, setSystemRoles] = useState<Role[]>([]);
  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix | null>(null);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleEditDialogOpen, setRoleEditDialogOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  
  // Statistics state
  const [statistics, setStatistics] = useState({
    totalStaff: 0,
    administrators: 0,
    supervisors: 0,
    activeStaff: 0,
  });

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'CLERK',
    departmentId: '',
    employeeId: '',
    phone: '',
  });

  const roles = [
    { value: 'CITIZEN', label: 'Citizen', color: 'default' },
    { value: 'CLERK', label: 'Clerk', color: 'info' },
    { value: 'FIELD_AGENT', label: 'Field Agent', color: 'warning' },
    { value: 'SUPERVISOR', label: 'Supervisor', color: 'success' },
    { value: 'ADMIN', label: 'Administrator', color: 'error' },
  ];

  useEffect(() => {
    fetchStaffAccounts();
    fetchStatistics();
  }, [page, rowsPerPage, search, roleFilter]);

  useEffect(() => {
    if (tabValue === 1) {
      fetchRoles();
    } else if (tabValue === 2) {
      fetchPermissionMatrix();
    }
  }, [tabValue]);

  const fetchStatistics = async () => {
    try {
      const token = getToken();
      
      // Fetch counts for each category
      const [totalResponse, adminResponse, supervisorResponse, activeResponse] = await Promise.all([
        fetch('/api/v1/admin/staff?limit=1', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/v1/admin/staff?role=ADMIN&limit=1', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/v1/admin/staff?role=SUPERVISOR&limit=1', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/v1/admin/staff?status=ACTIVE&limit=1', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (totalResponse.ok && adminResponse.ok && supervisorResponse.ok && activeResponse.ok) {
        const totalData = await totalResponse.json();
        const adminData = await adminResponse.json();
        const supervisorData = await supervisorResponse.json();
        const activeData = await activeResponse.json();

        setStatistics({
          totalStaff: totalData.pagination.total,
          administrators: adminData.pagination.total,
          supervisors: supervisorData.pagination.total,
          activeStaff: activeData.pagination.total,
        });
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchStaffAccounts = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
      });

      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);

      const response = await fetch(`/api/v1/admin/staff?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch staff accounts');

      const data = await response.json();
      setStaffAccounts(data.data);
      setTotalCount(data.pagination.total);
    } catch (error) {
      console.error('Error fetching staff accounts:', error);
      showSnackbar('Failed to fetch staff accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaffAccount = async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/v1/admin/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create staff account');
      }

      const result = await response.json();
      showSnackbar('Staff account created successfully', 'success');
      
      // Show temporary password if available
      if (result.data.temporaryPassword) {
        alert(`Temporary password: ${result.data.temporaryPassword}\nPlease save this password securely.`);
      }

      setCreateDialogOpen(false);
      fetchStaffAccounts();
      resetForm();
    } catch (error: any) {
      console.error('Error creating staff account:', error);
      showSnackbar(error.message || 'Failed to create staff account', 'error');
    }
  };

  const handleUpdateStaffAccount = async () => {
    if (!selectedUser) return;

    try {
      const token = getToken();
      const response = await fetch(`/api/v1/admin/staff/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: formData.role,
          departmentId: formData.departmentId || null,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          employeeId: formData.employeeId,
        }),
      });

      if (!response.ok) throw new Error('Failed to update staff account');

      showSnackbar('Staff account updated successfully', 'success');
      setEditDialogOpen(false);
      fetchStaffAccounts();
      resetForm();
    } catch (error) {
      console.error('Error updating staff account:', error);
      showSnackbar('Failed to update staff account', 'error');
    }
  };

  const handleDeactivateAccount = async (userId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this account?')) return;

    try {
      const token = getToken();
      const response = await fetch(`/api/v1/admin/staff/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to deactivate account');

      showSnackbar('Account deactivated successfully', 'success');
      fetchStaffAccounts();
    } catch (error) {
      console.error('Error deactivating account:', error);
      showSnackbar('Failed to deactivate account', 'error');
    }
  };

  const fetchRoleHistory = async (userId: string) => {
    try {
      const token = getToken();
      const response = await fetch(`/api/v1/admin/users/${userId}/role-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch role history');

      const data = await response.json();
      setRoleHistory(data.data);
      setHistoryDialogOpen(true);
    } catch (error) {
      console.error('Error fetching role history:', error);
      showSnackbar('Failed to fetch role history', 'error');
    }
  };

  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      const token = getToken();
      const response = await fetch('/api/v1/admin/roles', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch roles');

      const data = await response.json();
      setSystemRoles(data.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      showSnackbar('Failed to fetch roles', 'error');
    } finally {
      setRolesLoading(false);
    }
  };

  const fetchPermissionMatrix = async () => {
    setMatrixLoading(true);
    try {
      const token = getToken();
      const response = await fetch('/api/v1/admin/permissions/matrix', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch permission matrix');

      const data = await response.json();
      setPermissionMatrix(data.data);
    } catch (error) {
      console.error('Error fetching permission matrix:', error);
      showSnackbar('Failed to fetch permission matrix', 'error');
    } finally {
      setMatrixLoading(false);
    }
  };

  const togglePermission = async (roleId: string, roleName: string, permissionId: string, currentValue: boolean) => {
    try {
      const token = getToken();
      const response = await fetch(`/api/v1/admin/roles/${roleId}/permission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          permissionId,
          granted: !currentValue,
        }),
      });

      if (!response.ok) throw new Error('Failed to toggle permission');

      showSnackbar('Permission updated successfully', 'success');
      
      // Update the local state
      if (permissionMatrix) {
        const updatedMatrix = { ...permissionMatrix };
        const permission = updatedMatrix.permissions.find(p => p.id === permissionId);
        if (permission) {
          permission[roleName] = !currentValue;
        }
        setPermissionMatrix(updatedMatrix);
      }
    } catch (error) {
      console.error('Error toggling permission:', error);
      showSnackbar('Failed to update permission', 'error');
    }
  };

  const openRoleEditDialog = (role: Role) => {
    setSelectedRole(role);
    const permissions = new Set(role.permissions.filter(p => p.granted).map(p => p.id));
    setSelectedPermissions(permissions);
    setRoleEditDialogOpen(true);
  };

  const saveRolePermissions = async () => {
    if (!selectedRole) return;

    try {
      const token = getToken();
      const permissions = Array.from(selectedPermissions).map(id => ({
        permissionId: id,
        granted: true,
      }));

      const response = await fetch(`/api/v1/admin/roles/${selectedRole.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ permissions }),
      });

      if (!response.ok) throw new Error('Failed to update role permissions');

      showSnackbar('Role permissions updated successfully', 'success');
      setRoleEditDialogOpen(false);
      fetchRoles();
      fetchPermissionMatrix();
    } catch (error) {
      console.error('Error updating role permissions:', error);
      showSnackbar('Failed to update role permissions', 'error');
    }
  };

  const initializePermissions = async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/v1/admin/permissions/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to initialize permissions');

      showSnackbar('Permissions initialized successfully', 'success');
      fetchRoles();
      fetchPermissionMatrix();
    } catch (error) {
      console.error('Error initializing permissions:', error);
      showSnackbar('Failed to initialize permissions', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'CLERK',
      departmentId: '',
      employeeId: '',
      phone: '',
    });
    setSelectedUser(null);
  };

  const openEditDialog = (user: StaffAccount) => {
    setSelectedUser(user);
    const [firstName, lastName] = user.name.split(' ');
    setFormData({
      email: user.email,
      firstName: firstName || '',
      lastName: lastName || '',
      role: user.role,
      departmentId: user.departmentId || '',
      employeeId: user.employeeId || '',
      phone: '',
    });
    setEditDialogOpen(true);
  };

  const getRoleColor = (role: string) => {
    const roleConfig = roles.find((r) => r.value === role);
    return roleConfig?.color || 'default';
  };

  const getRoleChip = (role: string) => {
    const roleConfig = roles.find((r) => r.value === role);
    return (
      <Chip
        label={roleConfig?.label || role}
        color={roleConfig?.color as any}
        size="small"
      />
    );
  };

  const getStatusChip = (status: string) => {
    const statusColors: Record<string, any> = {
      ACTIVE: 'success',
      INACTIVE: 'default',
      SUSPENDED: 'warning',
      ARCHIVED: 'error',
      PASSWORD_RESET_REQUIRED: 'info',
    };

    return (
      <Chip
        label={status.replace(/_/g, ' ')}
        color={statusColors[status] || 'default'}
        size="small"
        variant="outlined"
      />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Typography variant="h4" component="h1" gutterBottom>
            Staff & Role Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage staff accounts, assign roles, and control permissions
          </Typography>
        </Grid>
      </Grid>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <GroupsIcon color="primary" fontSize="large" />
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Staff
                  </Typography>
                  <Typography variant="h4">{statistics.totalStaff}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <SecurityIcon color="error" fontSize="large" />
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Administrators
                  </Typography>
                  <Typography variant="h4">{statistics.administrators}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <AssignmentIcon color="success" fontSize="large" />
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Supervisors
                  </Typography>
                  <Typography variant="h4">{statistics.supervisors}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <PersonAddIcon color="info" fontSize="large" />
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Active Staff
                  </Typography>
                  <Typography variant="h4">{statistics.activeStaff}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Staff Accounts" />
          <Tab label="Role Management" />
          <Tab label="Permissions" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 2 }}>
          {/* Search and Filters */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                placeholder="Search by name, email, or employee ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Role Filter</InputLabel>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  label="Role Filter"
                >
                  <MenuItem value="">All Roles</MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={5}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                fullWidth
                sx={{ height: '56px' }}
              >
                Create Staff Account
              </Button>
            </Grid>
          </Grid>

          {/* Staff Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : staffAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">No staff accounts found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  staffAccounts.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {user.name}
                        </Typography>
                        {user.employeeId && (
                          <Typography variant="caption" color="text.secondary">
                            ID: {user.employeeId}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleChip(user.role)}</TableCell>
                      <TableCell>{user.department?.name || '-'}</TableCell>
                      <TableCell>{getStatusChip(user.status)}</TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => openEditDialog(user)} size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View History">
                          <IconButton onClick={() => fetchRoleHistory(user.id)} size="small">
                            <HistoryIcon />
                          </IconButton>
                        </Tooltip>
                        {user.status !== 'ARCHIVED' && (
                          <Tooltip title="Deactivate">
                            <IconButton
                              onClick={() => handleDeactivateAccount(user.id)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Role management allows you to define what each role can do in the system. 
          System roles cannot be deleted but their permissions can be modified.
        </Alert>
        
        {rolesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : systemRoles.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No roles found. Initialize the permission system first.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={initializePermissions}
              sx={{ mt: 2 }}
            >
              Initialize Roles & Permissions
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {systemRoles.map((role) => (
              <Grid item xs={12} md={6} lg={4} key={role.id}>
                <Card>
                  <CardContent>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {role.displayName}
                        </Typography>
                        <Chip
                          label={role.name}
                          color={getRoleColor(role.name) as any}
                          size="small"
                        />
                        {role.isSystem && (
                          <Chip
                            label="System Role"
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        {role.description || 'No description available'}
                      </Typography>
                      
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Hierarchy Level: {role.hierarchy}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          Users with this role: {role.userCount}
                        </Typography>
                      </Box>
                      
                      <Divider />
                      
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Permissions ({role.permissions.length})
                        </Typography>
                        <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                          {role.permissions.slice(0, 5).map((perm, idx) => (
                            <Typography key={idx} variant="caption" display="block">
                              • {perm.resource}:{perm.action}
                              {perm.scope && ` (${perm.scope})`}
                            </Typography>
                          ))}
                          {role.permissions.length > 5 && (
                            <Typography variant="caption" color="text.secondary">
                              ...and {role.permissions.length - 5} more
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      
                      {role.name !== 'CITIZEN' && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<SettingsIcon />}
                          onClick={() => openRoleEditDialog(role)}
                          fullWidth
                        >
                          Edit Permissions
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Alert severity="info" sx={{ mb: 2 }}>
          The permission matrix shows which roles have access to which resources and actions.
        </Alert>
        
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Click on checkboxes to toggle permissions for each role. Changes are saved automatically.
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setEditingPermissions(!editingPermissions)}
            startIcon={editingPermissions ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
          >
            {editingPermissions ? 'Disable Editing' : 'Enable Editing'}
          </Button>
        </Box>
        
        {matrixLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : !permissionMatrix ? (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No permission data found. Initialize the permission system first.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={initializePermissions}
              sx={{ mt: 2 }}
            >
              Initialize Roles & Permissions
            </Button>
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Resource</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Scope</TableCell>
                  {permissionMatrix.roles.map((role) => (
                    <TableCell key={role.id} align="center">
                      <Typography variant="caption" fontWeight="bold">
                        {role.displayName}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {permissionMatrix.permissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell>
                      <Typography variant="body2">
                        {permission.resource}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {permission.action}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {permission.scope || '-'}
                      </Typography>
                    </TableCell>
                    {permissionMatrix.roles.map((role) => {
                      const hasPermission = permission[role.name];
                      const isEditable = editingPermissions && role.name !== 'ADMIN' && role.name !== 'CITIZEN';
                      
                      return (
                        <TableCell key={role.id} align="center">
                          {isEditable ? (
                            <IconButton
                              size="small"
                              onClick={() => togglePermission(role.id, role.name, permission.id, hasPermission)}
                              color={hasPermission ? 'success' : 'default'}
                            >
                              {hasPermission ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                            </IconButton>
                          ) : (
                            hasPermission ? (
                              <Chip
                                label="✓"
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                -
                              </Typography>
                            )
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Create Staff Account Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Staff Account</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  label="Role"
                >
                  {roles.filter((r) => r.value !== 'CITIZEN').map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Employee ID"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateStaffAccount} variant="contained">
            Create Account
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Staff Account Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Staff Account</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Email" value={formData.email} disabled />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  label="Role"
                >
                  {roles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Employee ID"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateStaffAccount} variant="contained">
            Update Account
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role History Dialog */}
      <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Role Change History</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Previous Role</TableCell>
                  <TableCell>New Role</TableCell>
                  <TableCell>Changed By</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roleHistory.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {new Date(entry.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {entry.previousRole ? getRoleChip(entry.previousRole) : '-'}
                    </TableCell>
                    <TableCell>{getRoleChip(entry.newRole)}</TableCell>
                    <TableCell>{entry.performer.name}</TableCell>
                    <TableCell>{entry.reason || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Role Edit Dialog */}
      <Dialog open={roleEditDialogOpen} onClose={() => setRoleEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Edit Permissions for {selectedRole?.displayName}
        </DialogTitle>
        <DialogContent>
          {selectedRole && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Select the permissions this role should have. Admin and Citizen roles have fixed permissions.
              </Alert>
              
              <Typography variant="subtitle2" gutterBottom>
                Current Permissions: {selectedPermissions.size} selected
              </Typography>
              
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">Enabled</TableCell>
                      <TableCell>Resource</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Scope</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {permissionMatrix?.permissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell padding="checkbox">
                          <IconButton
                            size="small"
                            onClick={() => {
                              const newSet = new Set(selectedPermissions);
                              if (newSet.has(permission.id)) {
                                newSet.delete(permission.id);
                              } else {
                                newSet.add(permission.id);
                              }
                              setSelectedPermissions(newSet);
                            }}
                            color={selectedPermissions.has(permission.id) ? 'primary' : 'default'}
                          >
                            {selectedPermissions.has(permission.id) ? 
                              <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell>{permission.resource}</TableCell>
                        <TableCell>{permission.action}</TableCell>
                        <TableCell>{permission.scope || '-'}</TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {permission.description || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveRolePermissions} variant="contained">
            Save Permissions
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}