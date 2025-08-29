import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  Email,
  ArrowForward,
  Timer,
  Info,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

interface RegistrationSuccessProps {
  email: string;
  requiresConfirmation: boolean;
}

const RegistrationSuccess: React.FC<RegistrationSuccessProps> = ({ 
  email, 
  requiresConfirmation 
}) => {
  return (
    <Card elevation={3}>
      <CardContent>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom color="success.dark">
            Registration Successful!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome to City Services Portal
          </Typography>
        </Box>

        {requiresConfirmation ? (
          <>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                <strong>Email Confirmation Required</strong>
              </Typography>
              <Typography variant="body2">
                We've sent a confirmation link to <strong>{email}</strong>
              </Typography>
            </Alert>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Next Steps:
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <Email color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Check Your Email"
                  secondary="Look for an email from us (check spam folder if needed)"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <ArrowForward color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Click Confirmation Link"
                  secondary="Click the link in the email to verify your account"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Timer color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Link Expires in 24 Hours"
                  secondary="Make sure to confirm your email within 24 hours"
                />
              </ListItem>
            </List>

            <Alert severity="warning" sx={{ mt: 3, mb: 2 }}>
              <Typography variant="caption">
                <strong>For Testing:</strong> Check your browser console and API console for the confirmation link
              </Typography>
            </Alert>
          </>
        ) : (
          <Alert severity="success" sx={{ mb: 3 }}>
            Your account has been created and is ready to use!
          </Alert>
        )}

        <Divider sx={{ my: 3 }} />

        <Box sx={{ textAlign: 'center' }}>
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            size="large"
            startIcon={<ArrowForward />}
            data-testid="cs-registration-go-to-login"
          >
            Go to Login
          </Button>
          
          <Typography variant="body2" sx={{ mt: 2 }}>
            Having trouble? Contact support at{' '}
            <Typography component="span" color="primary">
              support@cityservices.gov
            </Typography>
          </Typography>
        </Box>

        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            <Info sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
            Account Information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Your username is your email address: <strong>{email}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • You can update your profile after logging in
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Password requirements: 8+ characters, uppercase, lowercase, number, special character
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RegistrationSuccess;