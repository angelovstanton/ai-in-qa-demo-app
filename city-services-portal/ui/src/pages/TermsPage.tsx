import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const TermsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
      <Container maxWidth="md">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          Back
        </Button>

        <Paper elevation={2} sx={{ p: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Terms and Conditions
          </Typography>
          
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Effective Date: January 1, 2025
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            1. Acceptance of Terms
          </Typography>
          <Typography paragraph>
            By accessing and using the City Services Portal ("Service"), you agree to be bound by these 
            Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use the Service.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            2. Service Description
          </Typography>
          <Typography paragraph>
            The City Services Portal provides citizens with access to municipal services including:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Service request submission and tracking" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Communication with city departments" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Access to public information and resolved cases" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Community engagement features" />
            </ListItem>
          </List>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            3. User Registration and Account
          </Typography>
          <Typography paragraph>
            To access certain features of the Service, you must register for an account. You agree to:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Provide accurate, current, and complete information during registration" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Maintain and promptly update your account information" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Maintain the security of your password and account" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Notify us immediately of any unauthorized use of your account" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Accept responsibility for all activities that occur under your account" />
            </ListItem>
          </List>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            4. User Conduct
          </Typography>
          <Typography paragraph>
            When using the Service, you agree NOT to:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Submit false, misleading, or fraudulent service requests" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Harass, threaten, or intimidate city staff or other users" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Upload malicious software or engage in any activity that could damage the Service" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Attempt to gain unauthorized access to any portion of the Service" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Use the Service for any illegal or unauthorized purpose" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Violate any local, state, national, or international law" />
            </ListItem>
          </List>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            5. Service Requests
          </Typography>
          <Typography paragraph>
            When submitting service requests:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="You certify that all information provided is true and accurate" />
            </ListItem>
            <ListItem>
              <ListItemText primary="You understand that response times may vary based on request priority and resources" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Emergency situations should be reported through official emergency channels (911)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="The city reserves the right to prioritize or decline requests at its discretion" />
            </ListItem>
          </List>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            6. Privacy and Data Protection
          </Typography>
          <Typography paragraph>
            Your use of the Service is also governed by our Privacy Policy. By using the Service, you 
            consent to the collection and use of your information as described in the Privacy Policy.
          </Typography>
          <Typography paragraph>
            We implement reasonable security measures to protect your personal information, but cannot 
            guarantee absolute security. You acknowledge that you provide information at your own risk.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            7. Intellectual Property
          </Typography>
          <Typography paragraph>
            All content on the Service, including text, graphics, logos, and software, is the property 
            of the City or its licensors and is protected by copyright and other intellectual property laws.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            8. Disclaimer of Warranties
          </Typography>
          <Typography paragraph>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER 
            EXPRESS OR IMPLIED. THE CITY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED 
            WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            9. Limitation of Liability
          </Typography>
          <Typography paragraph>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE CITY SHALL NOT BE LIABLE FOR ANY INDIRECT, 
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR 
            USE OF THE SERVICE.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            10. Indemnification
          </Typography>
          <Typography paragraph>
            You agree to indemnify and hold harmless the City, its officials, employees, and agents from 
            any claims, damages, losses, or expenses arising from your use of the Service or violation of 
            these Terms.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            11. Modifications to Terms
          </Typography>
          <Typography paragraph>
            We reserve the right to modify these Terms at any time. We will notify users of material 
            changes through the Service or via email. Your continued use of the Service after changes 
            constitutes acceptance of the modified Terms.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            12. Termination
          </Typography>
          <Typography paragraph>
            We may terminate or suspend your account and access to the Service at our sole discretion, 
            without notice, for conduct that violates these Terms or is harmful to other users, us, or 
            third parties.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            13. Governing Law
          </Typography>
          <Typography paragraph>
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction 
            in which the City is located, without regard to conflict of law principles.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            14. Contact Information
          </Typography>
          <Typography paragraph>
            For questions about these Terms, please contact us at:
          </Typography>
          <Typography paragraph>
            City Services Portal<br />
            Legal Department<br />
            123 Main Street<br />
            City Hall, State 12345<br />
            Email: legal@cityservices.gov<br />
            Phone: (555) 123-4567
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="body2" color="text.secondary" align="center">
            Last Updated: January 1, 2025 | Version 1.0
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default TermsPage;