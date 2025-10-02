import { Change } from '../types';

export class StyleRules {
  private changes: Change[] = [];

  cleanVocabulary(text: string): string {
    const forbidden = [
      'paradigm',
      'framework',
      'thus',
      'therefore',
      'hence',
      'Note that',
      'It should be noted that',
      'It is worth noting that',
      'It is important to note that',
      'In this paper',
      'In this work',
      'In this study',
      'aforementioned',
      'hereby',
      'heretofore',
      'henceforth',
      'whilst',
      'amongst',
      'albeit'
    ];

    let result = text;
    let hasChanges = false;

    forbidden.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const before = result;
      result = result.replace(regex, '');
      if (before !== result) hasChanges = true;
    });

    result = result.replace(/\s+/g, ' ').replace(/\s+([.,!?;:])/g, '$1');
    result = result.replace(/^\s*[.,;]\s*/, '');
    result = result.replace(/\.\s*\./g, '.');

    if (hasChanges) {
      this.changes.push({
        rule: 'Forbidden Vocabulary',
        type: 'vocabulary',
        before: text,
        after: result,
        reason: 'Removed forbidden academic jargon and redundant phrases'
      });
    }

    return result;
  }

  fixTense(text: string): string {
    const futurePatterns = [
      {
        pattern: /\bwe\s+will\s+(\w+)/gi,
        replacement: (match: string, verb: string) => `we ${verb}`
      },
      {
        pattern: /\bwill\s+be\s+(\w+ing)/gi,
        replacement: (match: string, verb: string) => `${verb}`
      },
      {
        pattern: /\bwill\s+(\w+)/gi,
        replacement: (match: string, verb: string) => {
          if (verb === 'be') return 'is';
          if (verb.endsWith('e')) return verb + 's';
          return verb + 's';
        }
      },
      {
        pattern: /\bshall\s+(\w+)/gi,
        replacement: (match: string, verb: string) => verb
      },
      {
        pattern: /\bis\s+going\s+to\s+(\w+)/gi,
        replacement: (match: string, verb: string) => verb + 's'
      },
      {
        pattern: /\bare\s+going\s+to\s+(\w+)/gi,
        replacement: (match: string, verb: string) => verb
      }
    ];

    let result = text;
    let hasChanges = false;

    futurePatterns.forEach(rule => {
      const before = result;
      result = result.replace(rule.pattern, rule.replacement as any);
      if (before !== result) hasChanges = true;
    });

    if (hasChanges) {
      this.changes.push({
        rule: 'Tense Correction',
        type: 'style',
        before: text,
        after: result,
        reason: 'Converted future tense to present tense for academic writing'
      });
    }

    return result;
  }

  removeParentheticals(text: string): string {
    let result = text;
    let hasChanges = false;

    const parentheticalPattern = /\([^)]+\)/g;
    const matches = text.match(parentheticalPattern);

    if (matches) {
      matches.forEach(match => {
        const content = match.slice(1, -1).trim();

        if (content.length > 30) {
          result = result.replace(match, `. ${content}.`);
          hasChanges = true;
        } else if (content.length > 10) {
          result = result.replace(match, `, ${content},`);
          hasChanges = true;
        } else {
          result = result.replace(match, ` ${content}`);
          hasChanges = true;
        }
      });
    }

    const footnotePattern = /\[\d+\]/g;
    const footnoteBefore = result;
    result = result.replace(footnotePattern, '');
    if (footnoteBefore !== result) hasChanges = true;

    result = result.replace(/\s+/g, ' ');
    result = result.replace(/\s+([.,!?;:])/g, '$1');
    result = result.replace(/([.,])\s*,/g, ',');
    result = result.replace(/\.\s*\./g, '.');

    if (hasChanges) {
      this.changes.push({
        rule: 'Parentheticals Removed',
        type: 'style',
        before: text,
        after: result,
        reason: 'Converted parenthetical content to regular text for better flow'
      });
    }

    return result;
  }

  removeRedundancy(text: string): string {
    const redundantPhrases: { [key: string]: string } = {
      'absolutely essential': 'essential',
      'absolutely necessary': 'necessary',
      'actual fact': 'fact',
      'added bonus': 'bonus',
      'advance planning': 'planning',
      'advance warning': 'warning',
      'all-time record': 'record',
      'basic fundamentals': 'fundamentals',
      'brief summary': 'summary',
      'close proximity': 'proximity',
      'combine together': 'combine',
      'completely eliminate': 'eliminate',
      'consensus of opinion': 'consensus',
      'continue on': 'continue',
      'each and every': 'each',
      'end result': 'result',
      'exactly the same': 'the same',
      'final outcome': 'outcome',
      'first and foremost': 'first',
      'free gift': 'gift',
      'future plans': 'plans',
      'general consensus': 'consensus',
      'joint collaboration': 'collaboration',
      'major breakthrough': 'breakthrough',
      'merge together': 'merge',
      'mutual cooperation': 'cooperation',
      'new innovation': 'innovation',
      'null and void': 'void',
      'past experience': 'experience',
      'past history': 'history',
      'period of time': 'period',
      'personal opinion': 'opinion',
      'plan ahead': 'plan',
      'positive improvement': 'improvement',
      'postpone until later': 'postpone',
      'reduce down': 'reduce',
      'refer back': 'refer',
      'repeat again': 'repeat',
      'revert back': 'revert',
      'same exact': 'same',
      'serious crisis': 'crisis',
      'still remains': 'remains',
      'sudden impulse': 'impulse',
      'sum total': 'total',
      'true fact': 'fact',
      'unexpected surprise': 'surprise',
      'unintentional mistake': 'mistake',
      'various different': 'various',
      'very unique': 'unique'
    };

    let result = text;
    let hasChanges = false;

    Object.entries(redundantPhrases).forEach(([redundant, concise]) => {
      const regex = new RegExp(`\\b${redundant}\\b`, 'gi');
      const before = result;
      result = result.replace(regex, concise);
      if (before !== result) hasChanges = true;
    });

    if (hasChanges) {
      this.changes.push({
        rule: 'Redundancy Removed',
        type: 'style',
        before: text,
        after: result,
        reason: 'Eliminated redundant phrases for concise writing'
      });
    }

    return result;
  }

  enforceActiveWriting(text: string): string {
    const weakVerbs: { [key: string]: string } = {
      'is able to': 'can',
      'are able to': 'can',
      'was able to': 'could',
      'were able to': 'could',
      'has the ability to': 'can',
      'have the ability to': 'can',
      'is capable of': 'can',
      'are capable of': 'can',
      'serves to': '',
      'serves as': 'is',
      'functions as': 'is',
      'acts as': 'is'
    };

    let result = text;
    let hasChanges = false;

    Object.entries(weakVerbs).forEach(([weak, strong]) => {
      const regex = new RegExp(`\\b${weak}\\b`, 'gi');
      const before = result;
      result = result.replace(regex, strong);
      if (before !== result) hasChanges = true;
    });

    result = result.replace(/\s+/g, ' ').trim();

    if (hasChanges) {
      this.changes.push({
        rule: 'Active Writing',
        type: 'style',
        before: text,
        after: result,
        reason: 'Replaced weak verb constructions with strong, active alternatives'
      });
    }

    return result;
  }

  getChanges(): Change[] {
    return this.changes;
  }

  clearChanges(): void {
    this.changes = [];
  }
}