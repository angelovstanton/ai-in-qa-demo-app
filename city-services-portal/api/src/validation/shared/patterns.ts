import { z } from 'zod';

// ============================================================================
// Shared Validation Patterns
// ============================================================================

// Name patterns supporting international characters including Bulgarian Cyrillic
export const namePattern = /^[a-zA-ZÀ-ÿĀ-žА-яЁё\u0100-\u017F\u0400-\u04FF\u1E00-\u1EFF\s'-]+$/;
export const extendedNamePattern = /^[a-zA-ZÀ-ÿĀ-žА-яЁё\u0100-\u017F\u0400-\u04FF\u1E00-\u1EFF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\s'-]+$/;

// Email pattern - RFC compliant
export const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Phone patterns - E.164 international format
export const phoneE164Pattern = /^\+?[1-9]\d{1,14}$/;
export const bulgarianPhonePattern = /^(\+359|0)[87-9]\d{8}$/;
export const internationalPhonePattern = /^[+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;

// Postal code patterns
export const bulgarianPostalCodePattern = /^\d{4}$/;
export const internationalPostalCodePattern = /^[A-Z0-9\s-]{3,10}$/i;

// Address patterns supporting Unicode
export const addressPattern = /^[\p{L}\p{N}\s,.'-/#&]+$/u;
export const unicodeTextPattern = /^[\p{L}\p{M}\p{N}\p{P}\p{S}\p{Z}]+$/u;

// Common password patterns
export const commonPasswords = [
  'password', '12345678', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'qwertyuiop',
  'password1', 'password12', 'password123', 'Passw0rd', 'Password1',
  'Welcome123', 'Admin123', 'Root123', 'Test123', 'Demo123'
];

// Password complexity patterns
export const uppercasePattern = /[A-Z]/;
export const lowercasePattern = /[a-z]/;
export const numberPattern = /[0-9]/;
export const specialCharPattern = /[@$!%*?&#^()_+=\-{}\[\]|\\:;"'<>,.?\/`~]/;

// Bulgarian specific patterns
export const bulgarianCyrillicPattern = /^[А-Яа-я\s'-]+$/;
export const bulgarianLatinPattern = /^[A-Za-z\s'-]+$/;
export const bulgarianMixedPattern = /^[А-Яа-яA-Za-z\s'-]+$/;

// Validation helper functions
export const hasConsecutiveCharacters = (str: string, maxConsecutive: number = 2): boolean => {
  for (let i = 0; i < str.length - maxConsecutive; i++) {
    const char = str[i];
    let consecutive = true;
    for (let j = 1; j <= maxConsecutive; j++) {
      if (str[i + j] !== char) {
        consecutive = false;
        break;
      }
    }
    if (consecutive) return true;
  }
  return false;
};

export const hasRepeatedCharacters = (str: string, maxRepeated: number = 3): boolean => {
  const charCount: Record<string, number> = {};
  for (const char of str) {
    charCount[char] = (charCount[char] || 0) + 1;
    if (charCount[char] > maxRepeated) return true;
  }
  return false;
};

export const isCommonPassword = (password: string): boolean => {
  const lowerPassword = password.toLowerCase();
  return commonPasswords.some(common => lowerPassword.includes(common));
};

export const hasSequentialCharacters = (str: string, length: number = 3): boolean => {
  const sequences = [
    'abcdefghijklmnopqrstuvwxyz',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    '0123456789',
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm'
  ];
  
  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - length; i++) {
      const subSeq = seq.substring(i, i + length);
      const reverseSubSeq = subSeq.split('').reverse().join('');
      if (str.includes(subSeq) || str.includes(reverseSubSeq)) {
        return true;
      }
    }
  }
  return false;
};

// Country-specific postal code validators
export const postalCodeValidators: Record<string, RegExp> = {
  BG: /^\d{4}$/,                          // Bulgaria
  US: /^\d{5}(-\d{4})?$/,                 // USA
  UK: /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i, // UK
  CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,      // Canada
  DE: /^\d{5}$/,                          // Germany
  FR: /^\d{5}$/,                          // France
  ES: /^\d{5}$/,                          // Spain
  IT: /^\d{5}$/,                          // Italy
  NL: /^\d{4}\s?[A-Z]{2}$/i,              // Netherlands
  BE: /^\d{4}$/,                          // Belgium
  CH: /^\d{4}$/,                          // Switzerland
  AT: /^\d{4}$/,                          // Austria
  PL: /^\d{2}-\d{3}$/,                    // Poland
  RO: /^\d{6}$/,                          // Romania
  GR: /^\d{3}\s?\d{2}$/,                  // Greece
  DEFAULT: /^[A-Z0-9\s-]{3,10}$/i         // Default international
};

// Language-specific validation messages
export const validationMessages = {
  en: {
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    invalidPhone: 'Please enter a valid phone number',
    invalidPostalCode: 'Please enter a valid postal code',
    passwordTooShort: 'Password must be at least {min} characters',
    passwordTooLong: 'Password cannot exceed {max} characters',
    passwordRequiresUppercase: 'Password must contain at least one uppercase letter',
    passwordRequiresLowercase: 'Password must contain at least one lowercase letter',
    passwordRequiresNumber: 'Password must contain at least one number',
    passwordRequiresSpecial: 'Password must contain at least one special character',
    passwordTooCommon: 'Password is too common, please choose a stronger password',
    passwordHasConsecutive: 'Password cannot contain more than {max} consecutive identical characters',
    passwordHasRepeated: 'Password cannot contain any character repeated more than {max} times',
    passwordHasSequential: 'Password cannot contain sequential characters',
    nameTooShort: 'Name must be at least {min} characters',
    nameTooLong: 'Name cannot exceed {max} characters',
    nameInvalidCharacters: 'Name contains invalid characters',
    addressInvalid: 'Please enter a valid address'
  },
  bg: {
    required: 'Това поле е задължително',
    invalidEmail: 'Моля, въведете валиден имейл адрес',
    invalidPhone: 'Моля, въведете валиден телефонен номер',
    invalidPostalCode: 'Моля, въведете валиден пощенски код',
    passwordTooShort: 'Паролата трябва да бъде поне {min} символа',
    passwordTooLong: 'Паролата не може да надвишава {max} символа',
    passwordRequiresUppercase: 'Паролата трябва да съдържа поне една главна буква',
    passwordRequiresLowercase: 'Паролата трябва да съдържа поне една малка буква',
    passwordRequiresNumber: 'Паролата трябва да съдържа поне една цифра',
    passwordRequiresSpecial: 'Паролата трябва да съдържа поне един специален символ',
    passwordTooCommon: 'Паролата е твърде често срещана, моля изберете по-силна парола',
    passwordHasConsecutive: 'Паролата не може да съдържа повече от {max} последователни еднакви символа',
    passwordHasRepeated: 'Паролата не може да съдържа символ, повторен повече от {max} пъти',
    passwordHasSequential: 'Паролата не може да съдържа последователни символи',
    nameTooShort: 'Името трябва да бъде поне {min} символа',
    nameTooLong: 'Името не може да надвишава {max} символа',
    nameInvalidCharacters: 'Името съдържа невалидни символи',
    addressInvalid: 'Моля, въведете валиден адрес'
  }
};

export type ValidationLanguage = keyof typeof validationMessages;

export const getValidationMessage = (
  key: keyof typeof validationMessages.en,
  lang: ValidationLanguage = 'en',
  params?: Record<string, any>
): string => {
  let message = validationMessages[lang][key] || validationMessages.en[key];
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, String(value));
    });
  }
  
  return message;
};