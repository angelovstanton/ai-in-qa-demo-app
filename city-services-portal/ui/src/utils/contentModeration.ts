import { z } from 'zod';

// Content moderation utilities for detecting spam, hate speech, and security issues
export class ContentModerator {
  // Spam detection patterns
  private static SPAM_PATTERNS = [
    /\b(free\s+money|click\s+here|limited\s+time|act\s+now)\b/gi,
    /\b(viagra|cialis|pharmacy|pills)\b/gi,
    /\b(lottery|winner|congratulations|claim\s+prize)\b/gi,
    /\b(make\s+money|work\s+from\s+home|earn\s+\$\d+)\b/gi,
    /\b(casino|gambling|poker|slots)\b/gi,
    /(\$\d+|\d+\$|USD\s*\d+)/g,
    /https?:\/\/[^\s]+/g, // URLs (may be spam)
    /(.)\1{10,}/g, // Repeated characters
  ];

  // Hate speech and offensive content patterns
  private static HATE_PATTERNS = [
    // Note: In a real implementation, this would be much more comprehensive
    // and would use machine learning models for better accuracy
    /\b(hate|stupid|idiot|moron|dumb)\b/gi,
    /\b(kill\s+yourself|die|death)\b/gi,
    /\b(terrorist|bomb|attack|violence)\b/gi,
    /\b(racist|sexist|bigot)\b/gi,
  ];

  // Security threat patterns
  private static SECURITY_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /eval\s*\(/gi,
    /document\.(cookie|write)/gi,
    /window\.(location|open)/gi,
    /\{\{.*?\}\}/g, // Template injection
    /\$\{.*?\}/g, // Template literals
  ];

  // Profanity patterns (basic set for demo)
  private static PROFANITY_PATTERNS = [
    /\b(damn|hell|crap|shit|fuck|bitch|ass|bastard)\b/gi,
  ];

  static analyzeContent(content: string): ContentAnalysis {
    const analysis: ContentAnalysis = {
      content,
      isSpam: false,
      isHate: false,
      isOffensive: false,
      hasSecurityThreat: false,
      hasProfanity: false,
      score: 0,
      flags: [],
      recommendations: [],
      detectedPatterns: [],
    };

    // Check for spam
    const spamMatches = this.findMatches(content, this.SPAM_PATTERNS);
    if (spamMatches.length > 0) {
      analysis.isSpam = true;
      analysis.score += 30;
      analysis.flags.push('SPAM');
      analysis.detectedPatterns.push(...spamMatches);
      analysis.recommendations.push('Content contains spam-like patterns');
    }

    // Check for hate speech
    const hateMatches = this.findMatches(content, this.HATE_PATTERNS);
    if (hateMatches.length > 0) {
      analysis.isHate = true;
      analysis.score += 50;
      analysis.flags.push('HATE_SPEECH');
      analysis.detectedPatterns.push(...hateMatches);
      analysis.recommendations.push('Content contains hate speech or threatening language');
    }

    // Check for security threats
    const securityMatches = this.findMatches(content, this.SECURITY_PATTERNS);
    if (securityMatches.length > 0) {
      analysis.hasSecurityThreat = true;
      analysis.score += 70;
      analysis.flags.push('SECURITY_THREAT');
      analysis.detectedPatterns.push(...securityMatches);
      analysis.recommendations.push('Content contains potential security threats');
    }

    // Check for profanity
    const profanityMatches = this.findMatches(content, this.PROFANITY_PATTERNS);
    if (profanityMatches.length > 0) {
      analysis.hasProfanity = true;
      analysis.score += 20;
      analysis.flags.push('PROFANITY');
      analysis.detectedPatterns.push(...profanityMatches);
      analysis.recommendations.push('Content contains profanity');
    }

    // Additional heuristics
    analysis.score += this.calculateHeuristicScore(content);

    // Determine if content is offensive overall
    analysis.isOffensive = analysis.score >= 40;

    // Add general recommendations
    if (analysis.score >= 70) {
      analysis.recommendations.push('Content should be blocked immediately');
    } else if (analysis.score >= 40) {
      analysis.recommendations.push('Content requires manual review');
    } else if (analysis.score >= 20) {
      analysis.recommendations.push('Content may need monitoring');
    }

    return analysis;
  }

  private static findMatches(content: string, patterns: RegExp[]): string[] {
    const matches: string[] = [];
    patterns.forEach(pattern => {
      const patternMatches = content.match(pattern);
      if (patternMatches) {
        matches.push(...patternMatches);
      }
    });
    return matches;
  }

  private static calculateHeuristicScore(content: string): number {
    let score = 0;

    // All caps (shouting)
    const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (upperCaseRatio > 0.5 && content.length > 20) {
      score += 10;
    }

    // Excessive punctuation
    const punctuationRatio = (content.match(/[!?]{2,}/g) || []).length;
    if (punctuationRatio > 2) {
      score += 15;
    }

    // Very short aggressive messages
    if (content.length < 50 && (content.includes('!') || content.includes('?'))) {
      score += 5;
    }

    // Excessive emoji usage (potential spam)
    const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
    if (emojiCount > content.length * 0.1) {
      score += 10;
    }

    return score;
  }

  // Content sanitization
  static sanitizeContent(content: string): string {
    return content
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  // Check if content should be auto-blocked
  static shouldAutoBlock(analysis: ContentAnalysis): boolean {
    return analysis.score >= 70 || 
           analysis.hasSecurityThreat || 
           (analysis.isHate && analysis.score >= 50);
  }

  // Check if content needs manual review
  static needsManualReview(analysis: ContentAnalysis): boolean {
    return analysis.score >= 40 && analysis.score < 70;
  }
}

export interface ContentAnalysis {
  content: string;
  isSpam: boolean;
  isHate: boolean;
  isOffensive: boolean;
  hasSecurityThreat: boolean;
  hasProfanity: boolean;
  score: number;
  flags: string[];
  recommendations: string[];
  detectedPatterns: string[];
}

export interface ModerationAction {
  id: string;
  contentId: string;
  contentType: 'REQUEST' | 'COMMENT' | 'PROFILE';
  userId: string;
  moderatorId?: string;
  action: 'FLAGGED' | 'APPROVED' | 'REJECTED' | 'HIDDEN' | 'DELETED';
  reason?: string;
  automatedAnalysis: ContentAnalysis;
  createdAt: string;
  reviewedAt?: string;
}

// Validation schema for content moderation
export const moderationSchema = z.object({
  content: z.string()
    .min(1, 'Content cannot be empty')
    .max(5000, 'Content is too long')
    .refine(
      (content) => {
        const analysis = ContentModerator.analyzeContent(content);
        return !ContentModerator.shouldAutoBlock(analysis);
      },
      'Content has been flagged for review and cannot be submitted'
    ),
  contentType: z.enum(['REQUEST', 'COMMENT', 'PROFILE']),
  userId: z.string().uuid(),
});

// Enhanced content validation with moderation
export const createContentValidator = (contentType: 'REQUEST' | 'COMMENT' | 'PROFILE') => {
  return z.object({
    content: z.string()
      .min(1, 'Content is required')
      .max(contentType === 'REQUEST' ? 2000 : 1000, 'Content is too long')
      .transform((content) => ContentModerator.sanitizeContent(content))
      .refine(
        (content) => {
          const analysis = ContentModerator.analyzeContent(content);
          return !ContentModerator.shouldAutoBlock(analysis);
        },
        'Content violates community guidelines and cannot be submitted'
      )
      .refine(
        (content) => content.trim().length >= 10,
        'Content must be at least 10 characters long'
      ),
  });
};