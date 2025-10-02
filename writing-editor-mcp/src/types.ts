export interface Change {
  rule: string;
  type: 'clarity' | 'style' | 'structure' | 'vocabulary';
  before: string;
  after: string;
  reason: string;
  location?: {
    line?: number;
    paragraph?: number;
    section?: string;
  };
}

export interface Section {
  title: string;
  content: string;
  original?: string;
  edited?: string;
  changes?: Change[];
}

export interface ProcessedDocument {
  type: 'full_paper' | 'section' | 'paragraph' | 'abstract';
  sections: Section[];
  metrics: DocumentMetrics;
  trackingDocument?: string;
  changes?: Change[];
  suggestions?: string[];
}

export interface DocumentMetrics {
  clarity: number;
  wordReduction: number;
  readabilityGain: number;
  sentenceComplexity: number;
  passiveVoiceCount: number;
  longSentenceCount: number;
}

export interface ValidationResult {
  valid: boolean;
  issues?: string[];
  fixedText: string;
  changes?: Change[];
}

export interface EditResult {
  edited: string;
  tracking?: string;
  metrics: {
    clarityScore: number;
    changes: number;
    wordReduction: number;
    readabilityImprovement: number;
  };
  suggestions?: string[];
}

export interface StructureChecks {
  [key: string]: boolean;
}