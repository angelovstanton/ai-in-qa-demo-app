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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PrivacyPage: React.FC = () => {
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
            Privacy Policy
          </Typography>
          
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Effective Date: January 1, 2025
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            1. Introduction
          </Typography>
          <Typography paragraph>
            The City Services Portal ("we," "our," or "us") is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
            when you use our service.
          </Typography>
          <Typography paragraph>
            By using the City Services Portal, you consent to the data practices described in this policy. 
            If you do not agree with this policy, please do not use our services.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            2. Information We Collect
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            2.1 Personal Information You Provide
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Name (first and last name)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Email address" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Phone numbers (primary and alternate)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Physical address (street, city, state, postal code, country)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Account credentials (username and encrypted password)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Service request details and attachments" />
            </ListItem>
          </List>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            2.2 Information Automatically Collected
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="IP address and device information" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Browser type and version" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Access times and dates" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Pages viewed and actions taken" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Referring website addresses" />
            </ListItem>
          </List>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            3. How We Use Your Information
          </Typography>
          <Typography paragraph>
            We use the information we collect to:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Process and respond to your service requests" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Verify your identity and maintain account security" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Send you notifications about your requests and account" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Improve our services and user experience" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Analyze usage patterns and generate statistics" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Comply with legal obligations and requirements" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Prevent fraud and enhance security" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Communicate important updates about our services" />
            </ListItem>
          </List>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            4. Legal Basis for Processing
          </Typography>
          <Typography paragraph>
            We process your personal information based on the following legal grounds:
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Purpose</strong></TableCell>
                  <TableCell><strong>Legal Basis</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Service delivery</TableCell>
                  <TableCell>Performance of public task</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Account management</TableCell>
                  <TableCell>Contractual necessity</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Legal compliance</TableCell>
                  <TableCell>Legal obligation</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Service improvements</TableCell>
                  <TableCell>Legitimate interest</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Marketing communications</TableCell>
                  <TableCell>Consent</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            5. Information Sharing and Disclosure
          </Typography>
          <Typography paragraph>
            We may share your information with:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="City Departments" 
                secondary="To process and respond to your service requests"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Service Providers" 
                secondary="Third-party vendors who assist in operating our services"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Law Enforcement" 
                secondary="When required by law or to protect rights and safety"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Public Records" 
                secondary="Certain information may be subject to public records laws"
              />
            </ListItem>
          </List>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            6. Data Retention
          </Typography>
          <Typography paragraph>
            We retain your personal information for as long as necessary to:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Provide you with requested services" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Comply with legal obligations and records retention requirements" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Resolve disputes and enforce agreements" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Fulfill the purposes outlined in this policy" />
            </ListItem>
          </List>
          <Typography paragraph>
            Service request data is typically retained for 7 years in accordance with municipal 
            records retention schedules. Account information is retained for the duration of your 
            account plus 3 years after closure.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            7. Data Security
          </Typography>
          <Typography paragraph>
            We implement appropriate technical and organizational measures to protect your information, including:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Encryption of data in transit and at rest" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Regular security assessments and updates" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Access controls and authentication requirements" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Employee training on data protection" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Incident response procedures" />
            </ListItem>
          </List>
          <Typography paragraph>
            However, no method of transmission over the internet or electronic storage is 100% secure. 
            While we strive to protect your information, we cannot guarantee absolute security.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            8. Your Rights and Choices
          </Typography>
          <Typography paragraph>
            You have the following rights regarding your personal information:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Access" 
                secondary="Request a copy of your personal information"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Correction" 
                secondary="Request correction of inaccurate information"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Deletion" 
                secondary="Request deletion of your information (subject to legal requirements)"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Portability" 
                secondary="Request your data in a portable format"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Opt-out" 
                secondary="Opt-out of non-essential communications"
              />
            </ListItem>
          </List>
          <Typography paragraph>
            To exercise these rights, contact us at privacy@cityservices.gov or through your account settings.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            9. Cookies and Tracking Technologies
          </Typography>
          <Typography paragraph>
            We use cookies and similar tracking technologies to:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Maintain your session and authentication" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Remember your preferences and settings" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Analyze usage and improve our services" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Provide security features" />
            </ListItem>
          </List>
          <Typography paragraph>
            You can control cookies through your browser settings. However, disabling cookies may 
            limit your ability to use certain features of our service.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            10. Children's Privacy
          </Typography>
          <Typography paragraph>
            Our services are not intended for children under 13 years of age. We do not knowingly 
            collect personal information from children under 13. If we discover that we have collected 
            information from a child under 13, we will delete it immediately.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            11. International Users
          </Typography>
          <Typography paragraph>
            If you access our services from outside our jurisdiction, please be aware that your 
            information may be transferred to, stored, and processed in our jurisdiction where 
            data protection laws may differ from those in your country.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            12. Third-Party Links
          </Typography>
          <Typography paragraph>
            Our service may contain links to third-party websites. We are not responsible for the 
            privacy practices of these external sites. We encourage you to review their privacy 
            policies before providing any information.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            13. Changes to This Policy
          </Typography>
          <Typography paragraph>
            We may update this Privacy Policy from time to time. We will notify you of material 
            changes by posting the new policy on this page and updating the "Effective Date" above. 
            For significant changes, we may also provide additional notice via email or through 
            the service.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            14. Contact Information
          </Typography>
          <Typography paragraph>
            If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
          </Typography>
          <Typography paragraph>
            <strong>Data Protection Officer</strong><br />
            City Services Portal<br />
            123 Main Street<br />
            City Hall, State 12345<br />
            Email: privacy@cityservices.gov<br />
            Phone: (555) 123-4568<br />
            Online: Submit a privacy request through your account
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            15. Complaints
          </Typography>
          <Typography paragraph>
            If you believe we have not addressed your concerns adequately, you have the right to 
            lodge a complaint with the relevant data protection authority in your jurisdiction.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography variant="body2" color="text.secondary" align="center">
            This Privacy Policy was last updated on January 1, 2025 | Version 1.0
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default PrivacyPage;