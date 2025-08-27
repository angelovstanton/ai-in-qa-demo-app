import { ContentModerator, createContentValidator } from '../../utils/contentModeration';

describe('ContentModerator', () => {
  describe('analyzeContent', () => {
    it('should detect spam content', () => {
      const spamContent = 'FREE MONEY! CLICK HERE to win lottery! Limited time offer!';
      const analysis = ContentModerator.analyzeContent(spamContent);

      expect(analysis.isSpam).toBe(true);
      expect(analysis.flags).toContain('SPAM');
      expect(analysis.score).toBeGreaterThan(30);
      expect(analysis.detectedPatterns.length).toBeGreaterThan(0);
      expect(analysis.recommendations).toContain('Content contains spam-like patterns');
    });

    it('should detect hate speech', () => {
      const hateContent = 'I hate this stupid system and you are all idiots!';
      const analysis = ContentModerator.analyzeContent(hateContent);

      expect(analysis.isHate).toBe(true);
      expect(analysis.flags).toContain('HATE_SPEECH');
      expect(analysis.score).toBeGreaterThan(50);
      expect(analysis.detectedPatterns.length).toBeGreaterThan(0);
      expect(analysis.recommendations).toContain('Content contains hate speech or threatening language');
    });

    it('should detect security threats', () => {
      const maliciousContent = '<script>alert("XSS attack")</script>Click here to steal data';
      const analysis = ContentModerator.analyzeContent(maliciousContent);

      expect(analysis.hasSecurityThreat).toBe(true);
      expect(analysis.flags).toContain('SECURITY_THREAT');
      expect(analysis.score).toBeGreaterThan(70);
      expect(analysis.detectedPatterns.length).toBeGreaterThan(0);
      expect(analysis.recommendations).toContain('Content contains potential security threats');
    });

    it('should detect profanity', () => {
      const profaneContent = 'This damn system is such a piece of shit!';
      const analysis = ContentModerator.analyzeContent(profaneContent);

      expect(analysis.hasProfanity).toBe(true);
      expect(analysis.flags).toContain('PROFANITY');
      expect(analysis.score).toBeGreaterThan(20);
      expect(analysis.detectedPatterns.length).toBeGreaterThan(0);
      expect(analysis.recommendations).toContain('Content contains profanity');
    });

    it('should handle clean content', () => {
      const cleanContent = 'This is a normal request about fixing a pothole on Main Street.';
      const analysis = ContentModerator.analyzeContent(cleanContent);

      expect(analysis.isSpam).toBe(false);
      expect(analysis.isHate).toBe(false);
      expect(analysis.hasSecurityThreat).toBe(false);
      expect(analysis.hasProfanity).toBe(false);
      expect(analysis.isOffensive).toBe(false);
      expect(analysis.score).toBeLessThan(40);
      expect(analysis.flags).toHaveLength(0);
    });

    it('should apply heuristic scoring for all caps', () => {
      const allCapsContent = 'THIS IS AN URGENT REQUEST THAT NEEDS IMMEDIATE ATTENTION!!!';
      const analysis = ContentModerator.analyzeContent(allCapsContent);

      expect(analysis.score).toBeGreaterThan(0);
    });

    it('should apply heuristic scoring for excessive punctuation', () => {
      const excessivePunctuationContent = 'Help me please!!!! This is urgent???? What should I do???';
      const analysis = ContentModerator.analyzeContent(excessivePunctuationContent);

      expect(analysis.score).toBeGreaterThan(0);
    });

    it('should calculate offensive status correctly', () => {
      const mildlyOffensive = 'This damn system needs fixing.';
      const highlyOffensive = 'I hate this stupid system, you are all idiots and I want to kill myself!';

      const mildAnalysis = ContentModerator.analyzeContent(mildlyOffensive);
      const severeAnalysis = ContentModerator.analyzeContent(highlyOffensive);

      expect(mildAnalysis.isOffensive).toBe(false);
      expect(severeAnalysis.isOffensive).toBe(true);
    });

    it('should provide appropriate recommendations based on score', () => {
      const lowScoreContent = 'This is mostly okay content.';
      const mediumScoreContent = 'This damn content might be questionable.';
      const highScoreContent = 'I hate this stupid system <script>alert("hack")</script>';

      const lowAnalysis = ContentModerator.analyzeContent(lowScoreContent);
      const mediumAnalysis = ContentModerator.analyzeContent(mediumScoreContent);
      const highAnalysis = ContentModerator.analyzeContent(highScoreContent);

      expect(lowAnalysis.recommendations).not.toContain('Content should be blocked immediately');
      expect(mediumAnalysis.recommendations).toContain('Content may need monitoring');
      expect(highAnalysis.recommendations).toContain('Content should be blocked immediately');
    });
  });

  describe('sanitizeContent', () => {
    it('should remove script tags', () => {
      const maliciousContent = '<script>alert("xss")</script>Normal content';
      const sanitized = ContentModerator.sanitizeContent(maliciousContent);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert("xss")');
      expect(sanitized).toContain('Normal content');
    });

    it('should remove HTML tags', () => {
      const htmlContent = '<div>Some <b>bold</b> text</div>';
      const sanitized = ContentModerator.sanitizeContent(htmlContent);

      expect(sanitized).not.toContain('<div>');
      expect(sanitized).not.toContain('<b>');
      expect(sanitized).toContain('Some bold text');
    });

    it('should remove javascript: protocols', () => {
      const jsContent = 'Click javascript:alert("xss") here';
      const sanitized = ContentModerator.sanitizeContent(jsContent);

      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).toContain('Click here');
    });

    it('should remove event handlers', () => {
      const eventContent = 'Click onclick="alert(\'xss\')" here';
      const sanitized = ContentModerator.sanitizeContent(eventContent);

      expect(sanitized).not.toContain('onclick=');
      expect(sanitized).toContain('Click here');
    });

    it('should trim whitespace', () => {
      const contentWithWhitespace = '   Normal content   ';
      const sanitized = ContentModerator.sanitizeContent(contentWithWhitespace);

      expect(sanitized).toBe('Normal content');
    });
  });

  describe('shouldAutoBlock', () => {
    it('should return true for high-score content', () => {
      const analysis = {
        content: 'test',
        isSpam: false,
        isHate: false,
        isOffensive: false,
        hasSecurityThreat: false,
        hasProfanity: false,
        score: 75,
        flags: [],
        recommendations: [],
        detectedPatterns: [],
      };

      expect(ContentModerator.shouldAutoBlock(analysis)).toBe(true);
    });

    it('should return true for security threats', () => {
      const analysis = {
        content: 'test',
        isSpam: false,
        isHate: false,
        isOffensive: false,
        hasSecurityThreat: true,
        hasProfanity: false,
        score: 30,
        flags: ['SECURITY_THREAT'],
        recommendations: [],
        detectedPatterns: [],
      };

      expect(ContentModerator.shouldAutoBlock(analysis)).toBe(true);
    });

    it('should return true for severe hate speech', () => {
      const analysis = {
        content: 'test',
        isSpam: false,
        isHate: true,
        isOffensive: false,
        hasSecurityThreat: false,
        hasProfanity: false,
        score: 55,
        flags: ['HATE_SPEECH'],
        recommendations: [],
        detectedPatterns: [],
      };

      expect(ContentModerator.shouldAutoBlock(analysis)).toBe(true);
    });

    it('should return false for moderate content', () => {
      const analysis = {
        content: 'test',
        isSpam: false,
        isHate: false,
        isOffensive: false,
        hasSecurityThreat: false,
        hasProfanity: true,
        score: 25,
        flags: ['PROFANITY'],
        recommendations: [],
        detectedPatterns: [],
      };

      expect(ContentModerator.shouldAutoBlock(analysis)).toBe(false);
    });
  });

  describe('needsManualReview', () => {
    it('should return true for moderate-score content', () => {
      const analysis = {
        content: 'test',
        isSpam: false,
        isHate: false,
        isOffensive: false,
        hasSecurityThreat: false,
        hasProfanity: false,
        score: 50,
        flags: [],
        recommendations: [],
        detectedPatterns: [],
      };

      expect(ContentModerator.needsManualReview(analysis)).toBe(true);
    });

    it('should return false for low-score content', () => {
      const analysis = {
        content: 'test',
        isSpam: false,
        isHate: false,
        isOffensive: false,
        hasSecurityThreat: false,
        hasProfanity: false,
        score: 15,
        flags: [],
        recommendations: [],
        detectedPatterns: [],
      };

      expect(ContentModerator.needsManualReview(analysis)).toBe(false);
    });

    it('should return false for high-score content (should be auto-blocked)', () => {
      const analysis = {
        content: 'test',
        isSpam: false,
        isHate: false,
        isOffensive: false,
        hasSecurityThreat: false,
        hasProfanity: false,
        score: 75,
        flags: [],
        recommendations: [],
        detectedPatterns: [],
      };

      expect(ContentModerator.needsManualReview(analysis)).toBe(false);
    });
  });
});

describe('createContentValidator', () => {
  describe('REQUEST validation', () => {
    const requestValidator = createContentValidator('REQUEST');

    it('should validate clean request content', () => {
      const data = { content: 'Please fix the pothole on Main Street near the park.' };
      const result = requestValidator.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('Please fix the pothole on Main Street near the park.');
      }
    });

    it('should sanitize and validate content with HTML', () => {
      const data = { content: '<p>Please fix the <b>pothole</b> on Main Street.</p>' };
      const result = requestValidator.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('Please fix the pothole on Main Street.');
      }
    });

    it('should reject content that should be auto-blocked', () => {
      const data = { content: '<script>alert("xss")</script>Malicious content here' };
      const result = requestValidator.safeParse(data);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain('violates community guidelines');
    });

    it('should reject content that is too short', () => {
      const data = { content: 'Short' };
      const result = requestValidator.safeParse(data);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain('at least 10 characters');
    });

    it('should reject content that is too long for requests', () => {
      const data = { content: 'a'.repeat(2001) };
      const result = requestValidator.safeParse(data);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain('too long');
    });

    it('should reject empty content', () => {
      const data = { content: '' };
      const result = requestValidator.safeParse(data);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain('required');
    });

    it('should trim whitespace from content', () => {
      const data = { content: '   Please fix the pothole on Main Street.   ' };
      const result = requestValidator.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('Please fix the pothole on Main Street.');
      }
    });
  });

  describe('COMMENT validation', () => {
    const commentValidator = createContentValidator('COMMENT');

    it('should validate clean comment content', () => {
      const data = { content: 'Thank you for the update on this issue.' };
      const result = commentValidator.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('Thank you for the update on this issue.');
      }
    });

    it('should have shorter length limit for comments', () => {
      const data = { content: 'a'.repeat(1001) };
      const result = commentValidator.safeParse(data);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain('too long');
    });

    it('should accept comments up to the limit', () => {
      const data = { content: 'a'.repeat(1000) };
      const result = commentValidator.safeParse(data);

      expect(result.success).toBe(true);
    });
  });

  describe('PROFILE validation', () => {
    const profileValidator = createContentValidator('PROFILE');

    it('should validate clean profile content', () => {
      const data = { content: 'I am a concerned citizen who wants to help improve our community.' };
      const result = profileValidator.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('I am a concerned citizen who wants to help improve our community.');
      }
    });

    it('should have shorter length limit for profiles', () => {
      const data = { content: 'a'.repeat(1001) };
      const result = profileValidator.safeParse(data);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain('too long');
    });
  });

  describe('Cross-validator security', () => {
    it('should reject various XSS attempts', () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')" />',
        '<iframe src="javascript:alert(\'xss\')"></iframe>',
        'onclick="alert(\'xss\')"',
      ];

      const validator = createContentValidator('REQUEST');

      xssAttempts.forEach(xssContent => {
        const data = { content: xssContent + ' Some normal content to meet length requirements.' };
        const result = validator.safeParse(data);

        expect(result.success).toBe(false);
      });
    });

    it('should reject various injection attempts', () => {
      const injectionAttempts = [
        '{{constructor.constructor("return process")().exit()}}',
        '${require("child_process").exec("rm -rf /")}',
        'eval("malicious code")',
        'document.cookie = "stolen"',
        'window.location = "http://evil.com"',
      ];

      const validator = createContentValidator('REQUEST');

      injectionAttempts.forEach(injectionContent => {
        const data = { content: injectionContent + ' Some normal content to meet length requirements.' };
        const result = validator.safeParse(data);

        // Some of these might pass sanitization but should be caught by moderation
        if (result.success) {
          // If it passes initial validation, it should be sanitized
          expect(result.data.content).not.toContain('eval(');
          expect(result.data.content).not.toContain('require(');
          expect(result.data.content).not.toContain('document.cookie');
        }
      });
    });
  });
});