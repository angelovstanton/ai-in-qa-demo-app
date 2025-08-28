import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Tooltip,
  IconButton,
  TextField,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { ServiceRequest, User } from '../../types';

interface RequestHeaderProps {
  request: ServiceRequest;
  user: User | null;
  isEditing: boolean;
  editData: any;
  canEditRequest: () => boolean;
  getEditTooltipMessage: () => string;
  getPriorityColor: (priority: string) => any;
  getStatusColor: (status: string) => any;
  getAvailableActions: () => Array<{ action: string; label: string }>;
  onBack: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onStatusAction: (action: string) => void;
  onEditDataChange: (field: string, value: any) => void;
}

const RequestHeader: React.FC<RequestHeaderProps> = ({
  request,
  user,
  isEditing,
  editData,
  canEditRequest,
  getEditTooltipMessage,
  getPriorityColor,
  getStatusColor,
  getAvailableActions,
  onBack,
  onEdit,
  onSave,
  onCancel,
  onStatusAction,
  onEditDataChange,
}) => {
  return (
    <>
      {/* Navigation Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          onClick={onBack}
          sx={{ mr: 1 }}
          data-testid="cs-request-detail-back"
        >
          <BackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Request Details
        </Typography>
      </Box>

      {/* Request Title and Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            {isEditing ? (
              <TextField
                value={editData.title}
                onChange={(e) => onEditDataChange('title', e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
                data-testid="cs-request-title-edit"
              />
            ) : (
              request.title
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Request ID: {request.code}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Chip
              label={request.priority}
              color={getPriorityColor(request.priority)}
              size="small"
              data-testid="cs-request-priority-chip"
            />
            <Chip
              label={request.status.replace(/_/g, ' ')}
              color={getStatusColor(request.status)}
              size="small"
              variant="outlined"
              data-testid="cs-request-status-chip"
            />
            <Chip
              label={request.category}
              variant="outlined"
              size="small"
              data-testid="cs-request-category-chip"
            />
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Edit/Save/Cancel buttons */}
          {user?.role === 'CITIZEN' && request.creator.id === user.id && (
            <>
              {isEditing ? (
                <>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={onSave}
                    data-testid="cs-request-detail-save"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CancelIcon />}
                    onClick={onCancel}
                    data-testid="cs-request-detail-cancel"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Tooltip title={getEditTooltipMessage()} arrow>
                  <span>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={canEditRequest() ? <EditIcon /> : <LockIcon />}
                      onClick={onEdit}
                      disabled={!canEditRequest()}
                      data-testid="cs-request-detail-edit"
                    >
                      {canEditRequest() ? 'Edit' : 'Edit Locked'}
                    </Button>
                  </span>
                </Tooltip>
              )}
            </>
          )}
          
          {/* Status action buttons */}
          {['CLERK', 'SUPERVISOR', 'ADMIN'].includes(user?.role || '') && 
            getAvailableActions().map((actionItem) => (
              <Button
                key={actionItem.action}
                variant="contained"
                size="small"
                onClick={() => onStatusAction(actionItem.action)}
                data-testid={`cs-request-detail-${actionItem.action}`}
              >
                {actionItem.label}
              </Button>
            ))
          }
        </Box>
      </Box>
    </>
  );
};

export default RequestHeader;