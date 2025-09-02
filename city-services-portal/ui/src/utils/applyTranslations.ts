/**
 * Utility to help apply translations to components
 * This file contains common translation patterns and helpers
 */

export const translationPatterns = {
  // Common UI elements that need translation
  buttons: {
    'Submit': "t('common:submit')",
    'Cancel': "t('common:cancel')",
    'Save': "t('common:save')",
    'Delete': "t('common:delete')",
    'Edit': "t('common:edit')",
    'Create': "t('common:create')",
    'Update': "t('common:update')",
    'Search': "t('common:search')",
    'Filter': "t('common:filter')",
    'Reset': "t('common:reset')",
    'Back': "t('common:back')",
    'Next': "t('common:next')",
    'Previous': "t('common:previous')",
    'Finish': "t('common:finish')",
    'Close': "t('common:close')",
    'Login': "t('auth:login.submitButton')",
    'Register': "t('auth:register.submitButton')",
    'Sign Up': "t('auth:register.submitButton')",
    'Sign In': "t('auth:login.submitButton')",
    'Logout': "t('auth:logout.title')",
    'Clear All': "t('common:clearAll', 'Clear All')",
    'Apply': "t('common:apply', 'Apply')",
    'Confirm': "t('common:confirm')",
    'View': "t('common:view', 'View')",
    'Download': "t('common:downloadFile')",
    'Upload': "t('common:uploadFile')",
  },
  
  labels: {
    'Email': "t('common:email')",
    'Password': "t('auth:login.passwordLabel')",
    'First Name': "t('auth:register.firstNameLabel')",
    'Last Name': "t('auth:register.lastNameLabel')",
    'Phone': "t('common:phone')",
    'Address': "t('common:address')",
    'City': "t('common:city')",
    'Postal Code': "t('common:postalCode')",
    'Country': "t('common:country')",
    'Status': "t('common:status')",
    'Priority': "t('requests:priority')",
    'Category': "t('requests:category')",
    'Department': "t('requests:department')",
    'Title': "t('requests:title')",
    'Description': "t('requests:description')",
    'Location': "t('requests:location')",
    'Date': "t('common:date')",
    'Time': "t('common:time')",
    'Name': "t('common:name')",
    'Loading...': "t('common:loading')",
    'No data': "t('common:noData')",
    'No results': "t('common:noResults')",
  },
  
  placeholders: {
    'Enter your email': "t('auth:login.emailPlaceholder')",
    'Enter your password': "t('auth:login.passwordPlaceholder')",
    'Enter your first name': "t('auth:register.firstNamePlaceholder')",
    'Enter your last name': "t('auth:register.lastNamePlaceholder')",
    'Enter your phone number': "t('auth:register.phonePlaceholder')",
    'Enter your address': "t('auth:register.addressPlaceholder')",
    'Enter your city': "t('auth:register.cityPlaceholder')",
    'Enter postal code': "t('auth:register.postalCodePlaceholder')",
    'Search...': "t('common:search')",
    'Select...': "t('common:selectOption')",
    'Choose...': "t('common:selectOption')",
  },
  
  messages: {
    'Success': "t('common:successMessage')",
    'Error': "t('common:errorMessage')",
    'Are you sure?': "t('common:confirmDelete')",
    'Loading...': "t('common:loading')",
    'No data available': "t('common:noData')",
    'No results found': "t('common:noResults')",
    'Please wait...': "t('common:loading')",
    'Required field': "t('validation:required')",
    'Invalid email': "t('validation:email.invalid')",
    'Password too short': "t('validation:password.minLength', { min: 8 })",
    'Passwords do not match': "t('validation:password.mismatch')",
  },
  
  // Status translations
  statuses: {
    'SUBMITTED': "t('status:request.SUBMITTED')",
    'TRIAGED': "t('status:request.TRIAGED')",
    'IN_PROGRESS': "t('status:request.IN_PROGRESS')",
    'WAITING_ON_CITIZEN': "t('status:request.WAITING_ON_CITIZEN')",
    'RESOLVED': "t('status:request.RESOLVED')",
    'CLOSED': "t('status:request.CLOSED')",
    'REJECTED': "t('status:request.REJECTED')",
    'REOPENED': "t('status:request.REOPENED')",
    'ACTIVE': "t('status:user.ACTIVE')",
    'INACTIVE': "t('status:user.INACTIVE')",
    'SUSPENDED': "t('status:user.SUSPENDED')",
  },
  
  // Priority translations
  priorities: {
    'LOW': "t('status:priority.LOW')",
    'MEDIUM': "t('status:priority.MEDIUM')",
    'HIGH': "t('status:priority.HIGH')",
    'URGENT': "t('status:priority.URGENT')",
  },
  
  // Role translations
  roles: {
    'CITIZEN': "t('auth:roles.CITIZEN')",
    'CLERK': "t('auth:roles.CLERK')",
    'FIELD_AGENT': "t('auth:roles.FIELD_AGENT')",
    'SUPERVISOR': "t('auth:roles.SUPERVISOR')",
    'ADMIN': "t('auth:roles.ADMIN')",
  }
};

/**
 * Helper function to generate translation key suggestions
 */
export const getTranslationKey = (text: string, context?: 'button' | 'label' | 'placeholder' | 'message'): string => {
  // Check if we have a direct mapping
  if (context) {
    const patterns = translationPatterns[context + 's' as keyof typeof translationPatterns];
    if (patterns && text in patterns) {
      return patterns[text as keyof typeof patterns];
    }
  }
  
  // Generate a suggested key based on the text
  const key = text.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const namespace = context === 'button' ? 'common' : 
                     context === 'label' ? 'common' : 
                     context === 'placeholder' ? 'common' : 
                     'common';
  
  return `t('${namespace}:${key}', '${text}')`;
};

/**
 * Import statement to add to components
 */
export const TRANSLATION_IMPORT = "import { useTranslation } from 'react-i18next';";

/**
 * Hook initialization to add to components
 */
export const TRANSLATION_HOOK = "const { t } = useTranslation();";