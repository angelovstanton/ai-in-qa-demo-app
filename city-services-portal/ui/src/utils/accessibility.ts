import React from 'react';

// Accessibility utilities for WCAG 2.1 AA compliance

export class AccessibilityUtils {
  // Color contrast utilities
  static checkColorContrast(foreground: string, background: string): {
    ratio: number;
    aaCompliant: boolean;
    aaaCompliant: boolean;
  } {
    const getLuminance = (color: string): number => {
      // Simple luminance calculation (would need full implementation)
      // This is a simplified version for demo purposes
      const rgb = parseInt(color.replace('#', ''), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      
      const sRGB = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return {
      ratio,
      aaCompliant: ratio >= 4.5,
      aaaCompliant: ratio >= 7,
    };
  }

  // Screen reader text utilities
  static createScreenReaderText(text: string): React.ReactElement {
    return React.createElement('span', {
      style: {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      },
      'aria-live': 'polite'
    }, text);
  }

  // Focus management
  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  // ARIA announcements
  static announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';

    document.body.appendChild(announcement);
    announcement.textContent = message;

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Form validation announcements
  static announceValidationError(fieldName: string, error: string): void {
    const message = `${fieldName}: ${error}`;
    this.announceToScreenReader(message, 'assertive');
  }

  static announceValidationSuccess(fieldName: string): void {
    const message = `${fieldName} is valid`;
    this.announceToScreenReader(message, 'polite');
  }

  // High contrast mode detection
  static isHighContrastMode(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check for Windows high contrast mode
    return window.matchMedia('(prefers-contrast: high)').matches ||
           window.matchMedia('(-ms-high-contrast: active)').matches;
  }

  // Reduced motion detection
  static prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Error boundary announcement
  static announceError(error: Error, context: string): void {
    const message = `Error in ${context}: ${error.message}. Please try again or contact support.`;
    this.announceToScreenReader(message, 'assertive');
  }

  // Loading state announcements
  static announceLoading(action: string): void {
    const message = `Loading ${action}. Please wait.`;
    this.announceToScreenReader(message, 'polite');
  }

  static announceLoadingComplete(action: string): void {
    const message = `${action} loaded successfully.`;
    this.announceToScreenReader(message, 'polite');
  }

  // Form submission announcements
  static announceFormSubmission(): void {
    this.announceToScreenReader('Form submitted successfully', 'assertive');
  }

  static announceFormError(error: string): void {
    this.announceToScreenReader(`Form submission failed: ${error}`, 'assertive');
  }

  // Navigation announcements
  static announcePageChange(pageName: string): void {
    this.announceToScreenReader(`Navigated to ${pageName}`, 'polite');
  }

  // Status announcements
  static announceStatusChange(oldStatus: string, newStatus: string): void {
    this.announceToScreenReader(`Status changed from ${oldStatus} to ${newStatus}`, 'polite');
  }
}

// React hook for accessibility features
export const useAccessibility = () => {
  const [isHighContrast, setIsHighContrast] = React.useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    setIsHighContrast(AccessibilityUtils.isHighContrastMode());
    setPrefersReducedMotion(AccessibilityUtils.prefersReducedMotion());

    // Listen for changes
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    contrastQuery.addEventListener('change', handleContrastChange);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      contrastQuery.removeEventListener('change', handleContrastChange);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  return {
    isHighContrast,
    prefersReducedMotion,
    announceToScreenReader: AccessibilityUtils.announceToScreenReader,
    announceError: AccessibilityUtils.announceError,
    announceLoading: AccessibilityUtils.announceLoading,
    announceLoadingComplete: AccessibilityUtils.announceLoadingComplete,
    announceFormSubmission: AccessibilityUtils.announceFormSubmission,
    announceFormError: AccessibilityUtils.announceFormError,
    announcePageChange: AccessibilityUtils.announcePageChange,
    announceStatusChange: AccessibilityUtils.announceStatusChange,
  };
};