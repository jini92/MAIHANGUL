export const locales = ['ko', 'en', 'vi'] as const;
export type Locale = (typeof locales)[number];
export type LocalizedText = Record<Locale, string>;
export type Stage = 'jamo' | 'word' | 'daily' | 'cafe';
export type ContentMode = 'preview' | 'release';

export interface ReviewRecord {
  status: 'draft' | 'inReview' | 'approved' | 'rejected' | 'needsRecheck';
  reviewer: string | null;
  reviewedAt: string | null;
  scope: string;
  evidence: string | null;
  notes: string;
}

export interface MeaningTask {
  kind: 'selectMeaning' | 'selectOrder';
  instruction: LocalizedText;
  options: { id: string; label: LocalizedText; imageRef: string | null }[];
  correctOptionId: string;
  feedback: LocalizedText;
  feedbackByOptionId: Record<string, LocalizedText>;
  orderAttributes: { drink: string; quantity?: number; temperature?: string } | null;
}

export interface Variant {
  practiceLanguage: Locale;
  targetText: string;
  explanations: LocalizedText;
  usageNote: LocalizedText;
  keyboardHint: LocalizedText | null;
  meaningTask: MeaningTask | null;
  audioRef: string | null;
}

export interface Concept {
  id: string;
  revision: number;
  stage: Stage;
  order: number;
  learningGoal: string;
  difficultyNote: string;
  variants: Record<Locale, Variant>;
  provenance: {
    origin: 'original' | 'adapted' | 'licensed';
    createdBy: string;
    createdAt: string;
    sourceReferences: { title: string; url: string; accessedAt: string; scope: string }[];
    assetRecordIds: string[];
  };
  review: Record<'education' | 'ko' | 'en' | 'vi' | 'rights', ReviewRecord>;
  lifecycle: 'active' | 'quarantined' | 'retired';
}

export interface ContentPack {
  schemaVersion: 1;
  packId: string;
  packVersion: string | null;
  concepts: Concept[];
}

export interface ValidationIssue {
  path: string;
  code: 'structure' | 'duplicate' | 'review' | 'rights' | 'version' | 'media';
  message: string;
}
