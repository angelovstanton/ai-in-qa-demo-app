import chalk from 'chalk';
import { EmailSimulation } from '../types/auth.types';

export class EmailSimulationService {
  private readonly appUrl: string;
  private readonly apiUrl: string;
  private readonly isEnabled: boolean;
  private readonly logLevel: 'simple' | 'detailed';

  constructor() {
    this.appUrl = process.env.APP_URL || 'http://localhost:5173';
    this.apiUrl = process.env.API_URL || 'http://localhost:3001';
    this.isEnabled = process.env.EMAIL_SIMULATION_ENABLED === 'true';
    this.logLevel = (process.env.EMAIL_SIMULATION_LOG_LEVEL as 'simple' | 'detailed') || 'detailed';
  }

  /**
   * Simulate sending an email by logging to console
   */
  async sendEmail(simulation: EmailSimulation): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    switch (simulation.type) {
      case 'VERIFICATION':
        this.logVerificationEmail(simulation);
        break;
      case 'PASSWORD_RESET':
        this.logPasswordResetEmail(simulation);
        break;
      case 'STATUS_CHANGE':
        this.logStatusChangeEmail(simulation);
        break;
      case 'WELCOME':
        this.logWelcomeEmail(simulation);
        break;
      default:
        this.logGenericEmail(simulation);
    }
  }

  /**
   * Log email verification email
   */
  private logVerificationEmail(simulation: EmailSimulation): void {
    const verificationUrl = `${this.appUrl}/verify-email?token=${simulation.token}`;
    
    if (this.logLevel === 'detailed') {
      console.log('\n' + chalk.cyan('═'.repeat(80)));
      console.log(chalk.cyan.bold('📧 EMAIL SIMULATION: ACCOUNT VERIFICATION'));
      console.log(chalk.cyan('═'.repeat(80)));
      
      console.log(chalk.white.bold('\n📮 Email Details:'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(chalk.white('To:'), chalk.yellow(simulation.recipient));
      console.log(chalk.white('Name:'), chalk.yellow(simulation.recipientName));
      console.log(chalk.white('Subject:'), chalk.yellow('Verify Your Email Address'));
      console.log(chalk.white('Sent:'), chalk.yellow(new Date().toLocaleString()));
      if (simulation.expiresAt) {
        console.log(chalk.white('Expires:'), chalk.yellow(simulation.expiresAt.toLocaleString()));
      }
      
      console.log(chalk.white.bold('\n📄 Email Content:'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(chalk.white(`
Dear ${simulation.recipientName},

Welcome to City Services Portal! Please verify your email address to activate your account.

Click the link below to verify your email:`));
      
      console.log(chalk.green.bold('\n🔗 ' + verificationUrl));
      
      console.log(chalk.white(`
This link will expire in 24 hours. If you didn't create an account, please ignore this email.

Best regards,
City Services Portal Team`));
      
      console.log(chalk.gray('\n─'.repeat(40)));
      console.log(chalk.dim('Note: This is a simulated email for demo purposes'));
      console.log(chalk.cyan('═'.repeat(80)) + '\n');
    } else {
      console.log(chalk.cyan.bold('\n📧 EMAIL: Verification'));
      console.log(chalk.white('To:'), chalk.yellow(simulation.recipient));
      console.log(chalk.green('Link:'), verificationUrl);
      console.log('');
    }
  }

  /**
   * Log password reset email
   */
  private logPasswordResetEmail(simulation: EmailSimulation): void {
    const resetUrl = `${this.appUrl}/reset-password?token=${simulation.token}`;
    
    if (this.logLevel === 'detailed') {
      console.log('\n' + chalk.magenta('═'.repeat(80)));
      console.log(chalk.magenta.bold('🔐 EMAIL SIMULATION: PASSWORD RESET'));
      console.log(chalk.magenta('═'.repeat(80)));
      
      console.log(chalk.white.bold('\n📮 Email Details:'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(chalk.white('To:'), chalk.yellow(simulation.recipient));
      console.log(chalk.white('Name:'), chalk.yellow(simulation.recipientName));
      console.log(chalk.white('Subject:'), chalk.yellow('Password Reset Request'));
      console.log(chalk.white('Sent:'), chalk.yellow(new Date().toLocaleString()));
      if (simulation.expiresAt) {
        console.log(chalk.white('Expires:'), chalk.red(simulation.expiresAt.toLocaleString()));
      }
      
      console.log(chalk.white.bold('\n📄 Email Content:'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(chalk.white(`
Dear ${simulation.recipientName},

We received a request to reset your password for your City Services Portal account.

Click the link below to reset your password:`));
      
      console.log(chalk.green.bold('\n🔗 ' + resetUrl));
      
      console.log(chalk.white(`
⚠️ This link will expire in 1 hour for security reasons.

If you didn't request a password reset, please ignore this email and your password will remain unchanged.

For security reasons, we recommend:
• Using a strong, unique password
• Not sharing your password with anyone
• Enabling two-factor authentication

Best regards,
City Services Portal Security Team`));
      
      console.log(chalk.gray('\n─'.repeat(40)));
      console.log(chalk.dim('Note: This is a simulated email for demo purposes'));
      console.log(chalk.magenta('═'.repeat(80)) + '\n');
    } else {
      console.log(chalk.magenta.bold('\n🔐 EMAIL: Password Reset'));
      console.log(chalk.white('To:'), chalk.yellow(simulation.recipient));
      console.log(chalk.green('Link:'), resetUrl);
      console.log(chalk.red('Expires:'), simulation.expiresAt?.toLocaleString());
      console.log('');
    }
  }

  /**
   * Log status change email
   */
  private logStatusChangeEmail(simulation: EmailSimulation): void {
    const { newStatus, previousStatus, reason } = simulation.additionalData || {};
    
    if (this.logLevel === 'detailed') {
      console.log('\n' + chalk.yellow('═'.repeat(80)));
      console.log(chalk.yellow.bold('🔄 EMAIL SIMULATION: ACCOUNT STATUS CHANGE'));
      console.log(chalk.yellow('═'.repeat(80)));
      
      console.log(chalk.white.bold('\n📮 Email Details:'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(chalk.white('To:'), chalk.yellow(simulation.recipient));
      console.log(chalk.white('Name:'), chalk.yellow(simulation.recipientName));
      console.log(chalk.white('Subject:'), chalk.yellow('Account Status Update'));
      console.log(chalk.white('Sent:'), chalk.yellow(new Date().toLocaleString()));
      
      console.log(chalk.white.bold('\n📄 Email Content:'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(chalk.white(`
Dear ${simulation.recipientName},

Your account status has been updated.

Previous Status: ${chalk.red(previousStatus)}
New Status: ${chalk.green(newStatus)}
${reason ? `Reason: ${reason}` : ''}

${this.getStatusChangeMessage(newStatus)}

If you have any questions about this change, please contact our support team.

Best regards,
City Services Portal Team`));
      
      console.log(chalk.gray('\n─'.repeat(40)));
      console.log(chalk.dim('Note: This is a simulated email for demo purposes'));
      console.log(chalk.yellow('═'.repeat(80)) + '\n');
    } else {
      console.log(chalk.yellow.bold('\n🔄 EMAIL: Status Change'));
      console.log(chalk.white('To:'), chalk.yellow(simulation.recipient));
      console.log(chalk.white('Status:'), chalk.red(previousStatus), '→', chalk.green(newStatus));
      console.log('');
    }
  }

  /**
   * Log welcome email
   */
  private logWelcomeEmail(simulation: EmailSimulation): void {
    const dashboardUrl = `${this.appUrl}/dashboard`;
    const profileUrl = `${this.appUrl}/profile`;
    
    if (this.logLevel === 'detailed') {
      console.log('\n' + chalk.green('═'.repeat(80)));
      console.log(chalk.green.bold('🎉 EMAIL SIMULATION: WELCOME'));
      console.log(chalk.green('═'.repeat(80)));
      
      console.log(chalk.white.bold('\n📮 Email Details:'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(chalk.white('To:'), chalk.yellow(simulation.recipient));
      console.log(chalk.white('Name:'), chalk.yellow(simulation.recipientName));
      console.log(chalk.white('Subject:'), chalk.yellow('Welcome to City Services Portal!'));
      console.log(chalk.white('Sent:'), chalk.yellow(new Date().toLocaleString()));
      
      console.log(chalk.white.bold('\n📄 Email Content:'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(chalk.white(`
Dear ${simulation.recipientName},

🎉 Welcome to City Services Portal!

Your account has been successfully created and verified. You can now access all the features of our platform.

Here are some quick links to get you started:

📊 Dashboard: ${chalk.cyan(dashboardUrl)}
👤 Complete Your Profile: ${chalk.cyan(profileUrl)}

What you can do with City Services Portal:
✅ Submit service requests online
✅ Track request status in real-time
✅ Upload supporting documents
✅ Communicate with city staff
✅ View service history
✅ Manage your preferences

Need help? Visit our help center or contact support.

Best regards,
City Services Portal Team`));
      
      console.log(chalk.gray('\n─'.repeat(40)));
      console.log(chalk.dim('Note: This is a simulated email for demo purposes'));
      console.log(chalk.green('═'.repeat(80)) + '\n');
    } else {
      console.log(chalk.green.bold('\n🎉 EMAIL: Welcome'));
      console.log(chalk.white('To:'), chalk.yellow(simulation.recipient));
      console.log(chalk.white('Dashboard:'), chalk.cyan(dashboardUrl));
      console.log('');
    }
  }

  /**
   * Log generic email
   */
  private logGenericEmail(simulation: EmailSimulation): void {
    console.log('\n' + chalk.blue('═'.repeat(80)));
    console.log(chalk.blue.bold('📧 EMAIL SIMULATION'));
    console.log(chalk.blue('═'.repeat(80)));
    console.log(chalk.white('Type:'), chalk.yellow(simulation.type));
    console.log(chalk.white('To:'), chalk.yellow(simulation.recipient));
    console.log(chalk.white('Name:'), chalk.yellow(simulation.recipientName));
    if (simulation.link) {
      console.log(chalk.white('Link:'), chalk.cyan(simulation.link));
    }
    if (simulation.additionalData) {
      console.log(chalk.white('Data:'), JSON.stringify(simulation.additionalData, null, 2));
    }
    console.log(chalk.blue('═'.repeat(80)) + '\n');
  }

  /**
   * Get status change message based on new status
   */
  private getStatusChangeMessage(status: string): string {
    const messages: Record<string, string> = {
      ACTIVE: 'Your account is now active. You can log in and use all features.',
      INACTIVE: 'Your account has been deactivated. You will not be able to log in until it is reactivated.',
      SUSPENDED: 'Your account has been suspended. Please contact support for more information.',
      ARCHIVED: 'Your account has been archived. Your data is preserved but the account is no longer active.',
      PASSWORD_RESET_REQUIRED: 'You must reset your password before you can access your account.',
      PENDING_EMAIL_VERIFICATION: 'Please verify your email address to activate your account.'
    };

    return messages[status] || 'Your account status has been updated.';
  }

  /**
   * Generate HTML email template (for future email service integration)
   */
  generateHtmlTemplate(simulation: EmailSimulation): string {
    // This would generate actual HTML templates for real email services
    // For now, it's a placeholder for future implementation
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${simulation.type}</title>
        </head>
        <body>
          <h1>City Services Portal</h1>
          <p>Dear ${simulation.recipientName},</p>
          <!-- Email content would go here -->
        </body>
      </html>
    `;
  }
}