import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TestingFeatureFlag {
  key: string;
  name: string;
  description: string;
  category: string;
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  isEnabled: boolean;
  isMasterControlled: boolean;
  defaultValue: boolean;
  metadata?: any;
}

export const testingFeatureFlags: TestingFeatureFlag[] = [
  // Master Control
  {
    key: 'MASTER_TESTING_FLAGS_ENABLED',
    name: 'Master Testing Flags Control',
    description: 'Global switch to enable/disable all testing flags at once',
    category: 'Master',
    impactLevel: 'HIGH',
    isEnabled: false,
    isMasterControlled: false,
    defaultValue: false,
    metadata: { isSystemFlag: true }
  },

  // Authentication & User Management (10 flags)
  {
    key: 'LOGIN_WRONG_PASSWORD_ACCEPTED',
    name: 'Accept Any Password for Login',
    description: 'Accepts any password for login - critical security vulnerability',
    category: 'Authentication',
    impactLevel: 'HIGH',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'REGISTRATION_SKIP_EMAIL_VALIDATION',
    name: 'Skip Email Validation',
    description: 'Creates accounts without email verification',
    category: 'Authentication',
    impactLevel: 'HIGH',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'PASSWORD_RESET_BROKEN_LINKS',
    name: 'Broken Password Reset Links',
    description: 'Password reset links lead to 404 pages',
    category: 'Authentication',
    impactLevel: 'HIGH',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'LOGIN_BUTTON_SHOWS_REGISTER',
    name: 'Login Button Text Wrong',
    description: 'Login button displays "Register Account" instead of "Login"',
    category: 'Authentication',
    impactLevel: 'MEDIUM',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'PROFILE_UPDATE_FAILS_SILENTLY',
    name: 'Profile Updates Fail Silently',
    description: 'Profile changes appear to save but don\'t persist',
    category: 'Authentication',
    impactLevel: 'MEDIUM',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'PASSWORD_FIELD_SHOWS_PLAIN_TEXT',
    name: 'Password Field Shows Plain Text',
    description: 'Password input fields display text instead of dots',
    category: 'Authentication',
    impactLevel: 'MEDIUM',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'USER_AVATAR_SHOWS_WRONG_INITIALS',
    name: 'Wrong Avatar Initials',
    description: 'Display incorrect initials in avatar',
    category: 'Authentication',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'EMAIL_CONFIRMATION_WRONG_SUCCESS_MESSAGE',
    name: 'Wrong Email Confirmation Message',
    description: 'Shows "Password reset successful" instead of "Email confirmed"',
    category: 'Authentication',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'LOGIN_FORM_LOSES_EMAIL_ON_ERROR',
    name: 'Login Form Clears Email on Error',
    description: 'Email field clears when password is wrong',
    category: 'Authentication',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'REGISTRATION_SUCCESS_SHOWS_ERROR_STYLING',
    name: 'Registration Success With Error Style',
    description: 'Success message displays with red error styling',
    category: 'Authentication',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },

  // Service Request Management (15 flags)
  {
    key: 'SERVICE_REQUEST_CREATION_FAILS',
    name: 'Service Request Creation Fails',
    description: 'All new service requests return 500 error',
    category: 'ServiceRequests',
    impactLevel: 'HIGH',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'STATUS_CHANGES_DONT_SAVE',
    name: 'Status Changes Don\'t Save',
    description: 'Status updates appear successful but revert',
    category: 'ServiceRequests',
    impactLevel: 'HIGH',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'CRITICAL_REQUESTS_MARKED_LOW_PRIORITY',
    name: 'Critical Requests Set to Low Priority',
    description: 'Emergency requests auto-set to LOW priority',
    category: 'ServiceRequests',
    impactLevel: 'HIGH',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'FILE_UPLOADS_CORRUPT_IMAGES',
    name: 'File Uploads Corrupt Images',
    description: 'Uploaded images display as broken/corrupted',
    category: 'ServiceRequests',
    impactLevel: 'MEDIUM',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'REQUEST_ASSIGNMENTS_IGNORED',
    name: 'Request Assignments Ignored',
    description: 'Assignment changes don\'t notify assigned users',
    category: 'ServiceRequests',
    impactLevel: 'MEDIUM',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'SEARCH_RETURNS_WRONG_RESULTS',
    name: 'Search Returns Wrong Results',
    description: 'Search shows requests from different categories',
    category: 'ServiceRequests',
    impactLevel: 'MEDIUM',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'COMMENTS_POST_TO_WRONG_REQUEST',
    name: 'Comments Post to Wrong Request',
    description: 'Comments appear on random other requests',
    category: 'ServiceRequests',
    impactLevel: 'MEDIUM',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'DUPLICATE_REQUEST_DETECTION_BROKEN',
    name: 'Duplicate Detection Broken',
    description: 'System allows obvious duplicate submissions',
    category: 'ServiceRequests',
    impactLevel: 'MEDIUM',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'REQUEST_TIMESTAMPS_WRONG_TIMEZONE',
    name: 'Wrong Timezone Display',
    description: 'Show all timestamps in wrong timezone',
    category: 'ServiceRequests',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'REQUEST_CODES_MISSING_YEAR',
    name: 'Request Codes Missing Year',
    description: 'Generate codes like REQ-000001 instead of REQ-2024-000001',
    category: 'ServiceRequests',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'STATUS_COLORS_REVERSED',
    name: 'Status Colors Reversed',
    description: 'Red for resolved, green for urgent',
    category: 'ServiceRequests',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'REQUEST_CATEGORIES_UNSORTED',
    name: 'Request Categories Unsorted',
    description: 'Category dropdown shows in random order',
    category: 'ServiceRequests',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'DESCRIPTION_TEXT_FORMATTING_BROKEN',
    name: 'Description Text Formatting Broken',
    description: 'Line breaks don\'t display in descriptions',
    category: 'ServiceRequests',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'LOCATION_MAP_POINTS_OFFSET',
    name: 'Map Markers Offset',
    description: 'Map markers appear 100m from actual location',
    category: 'ServiceRequests',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'REQUEST_COUNT_BADGE_WRONG',
    name: 'Request Count Badge Wrong',
    description: 'Dashboard shows incorrect request counts',
    category: 'ServiceRequests',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },

  // User Interface & UX (10 flags)
  {
    key: 'NAVIGATION_MENU_DISAPPEARS',
    name: 'Navigation Menu Disappears',
    description: 'Main navigation randomly hides on page load',
    category: 'UI/UX',
    impactLevel: 'MEDIUM',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'FORM_VALIDATION_MESSAGES_WRONG_LANGUAGE',
    name: 'Validation Messages Wrong Language',
    description: 'Show validation errors in random language',
    category: 'UI/UX',
    impactLevel: 'MEDIUM',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'BUTTONS_DOUBLE_CLICK_REQUIRED',
    name: 'Buttons Require Double Click',
    description: 'All buttons require double-click to work',
    category: 'UI/UX',
    impactLevel: 'MEDIUM',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'PAGE_TITLES_INCORRECT',
    name: 'Page Titles Incorrect',
    description: 'All page titles show "Untitled Document"',
    category: 'UI/UX',
    impactLevel: 'MEDIUM',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'LOADING_SPINNERS_NEVER_STOP',
    name: 'Loading Spinners Never Stop',
    description: 'Loading indicators continue spinning after content loads',
    category: 'UI/UX',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'TOOLTIPS_SHOW_PLACEHOLDER_TEXT',
    name: 'Tooltips Show Placeholder Text',
    description: 'All tooltips display "Lorem ipsum dolor sit amet"',
    category: 'UI/UX',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'DATE_PICKER_SHOWS_WRONG_YEAR',
    name: 'Date Picker Shows Wrong Year',
    description: 'Date pickers default to year 2020',
    category: 'UI/UX',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'TABLE_SORTING_REVERSED',
    name: 'Table Sorting Reversed',
    description: 'Ascending sort actually sorts descending',
    category: 'UI/UX',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'PAGINATION_NEXT_BUTTON_DISABLED',
    name: 'Pagination Next Button Disabled',
    description: 'Next button disabled even when more pages exist',
    category: 'UI/UX',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'BREADCRUMBS_SHOW_WRONG_PATH',
    name: 'Breadcrumbs Show Wrong Path',
    description: 'Breadcrumb navigation shows incorrect page hierarchy',
    category: 'UI/UX',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },

  // Search & Filtering (8 flags)
  {
    key: 'SEARCH_IGNORES_FILTERS',
    name: 'Search Ignores Filters',
    description: 'Search returns all results regardless of applied filters',
    category: 'Search',
    impactLevel: 'MEDIUM',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'EXPORT_DOWNLOADS_EMPTY_FILE',
    name: 'Export Downloads Empty File',
    description: 'CSV/JSON exports contain no data',
    category: 'Search',
    impactLevel: 'MEDIUM',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'ADVANCED_SEARCH_CRASHES_PAGE',
    name: 'Advanced Search Crashes Page',
    description: 'POST search endpoint causes white screen',
    category: 'Search',
    impactLevel: 'MEDIUM',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'SEARCH_RESULTS_RANDOM_ORDER',
    name: 'Search Results Random Order',
    description: 'Search results display in random order regardless of sort',
    category: 'Search',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'FILTER_COUNTERS_WRONG',
    name: 'Filter Counters Wrong',
    description: 'Filter badges show incorrect result counts',
    category: 'Search',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'SEARCH_AUTOCOMPLETE_SUGGESTS_NONSENSE',
    name: 'Search Autocomplete Suggests Nonsense',
    description: 'Search suggestions show unrelated terms',
    category: 'Search',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'PAGINATION_SHOWS_WRONG_TOTAL',
    name: 'Pagination Shows Wrong Total',
    description: '"Showing 1-20 of 543" when only 50 results exist',
    category: 'Search',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'SAVED_SEARCHES_LOAD_DIFFERENT_CRITERIA',
    name: 'Saved Searches Load Wrong Criteria',
    description: 'Saved search loads with wrong parameters',
    category: 'Search',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },

  // Notifications & Messaging (7 flags)
  {
    key: 'SUCCESS_MESSAGES_SHOW_ERRORS',
    name: 'Success Messages Show as Errors',
    description: 'Success notifications display error styling and text',
    category: 'Notifications',
    impactLevel: 'MEDIUM',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'ERROR_MESSAGES_DISAPPEAR_TOO_QUICKLY',
    name: 'Error Messages Disappear Too Quickly',
    description: 'Error messages auto-hide after 1 second',
    category: 'Notifications',
    impactLevel: 'MEDIUM',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'NOTIFICATION_BADGE_SHOWS_SMILEY_FACE',
    name: 'Notification Badge Shows Emoji',
    description: 'Notification count displays "😊" instead of numbers',
    category: 'Notifications',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'TOAST_NOTIFICATIONS_APPEAR_UPSIDE_DOWN',
    name: 'Toast Notifications Upside Down',
    description: 'Success/error messages display rotated 180 degrees',
    category: 'Notifications',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'SUCCESS_MESSAGES_SHOW_WRONG_ICONS',
    name: 'Success Messages Show Wrong Icons',
    description: 'Success notifications display error/warning icons',
    category: 'Notifications',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'SYSTEM_MESSAGES_WRONG_LANGUAGE',
    name: 'System Messages Wrong Language',
    description: 'Random system messages appear in Bulgarian when English selected',
    category: 'Notifications',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  },
  {
    key: 'NOTIFICATION_PANEL_SHOWS_PLACEHOLDER_DATA',
    name: 'Notification Panel Shows Placeholder',
    description: 'Notifications list shows "Sample notification text here"',
    category: 'Notifications',
    impactLevel: 'LOW',
    isEnabled: false,
    isMasterControlled: true,
    defaultValue: false
  }
];

export async function seedTestingFeatureFlags() {
  console.log('Seeding testing feature flags...');
  
  for (const flag of testingFeatureFlags) {
    await prisma.testingFeatureFlag.upsert({
      where: { key: flag.key },
      update: {
        name: flag.name,
        description: flag.description,
        category: flag.category,
        impactLevel: flag.impactLevel,
        isMasterControlled: flag.isMasterControlled,
        defaultValue: flag.defaultValue,
        metadata: flag.metadata ? JSON.stringify(flag.metadata) : null
      },
      create: {
        key: flag.key,
        name: flag.name,
        description: flag.description,
        category: flag.category,
        impactLevel: flag.impactLevel,
        isEnabled: flag.isEnabled,
        isMasterControlled: flag.isMasterControlled,
        defaultValue: flag.defaultValue,
        metadata: flag.metadata ? JSON.stringify(flag.metadata) : null
      }
    });
  }
  
  console.log(`Seeded ${testingFeatureFlags.length} testing feature flags`);
}