import { Change } from '../types';

export class ClarityRules {
  private changes: Change[] = [];

  fixPassiveVoice(sentence: string): string {
    const passivePatterns = [
      {
        pattern: /(\w+)\s+(?:was|were)\s+(\w+ed|en|t)\s+by\s+(.+?)(?:\.|,|$)/gi,
        transform: (match: string, subject: string, verb: string, actor: string) => {
          const activeVerb = this.getActiveVerb(verb);
          return `${actor} ${activeVerb} ${subject}${match.slice(-1)}`;
        }
      },
      {
        pattern: /it\s+(?:is|was)\s+(\w+ed)\s+that/gi,
        transform: (match: string, verb: string) => this.restructureItIs(match, verb)
      },
      {
        pattern: /(\w+)\s+(?:has|have)\s+been\s+(\w+ed|en)\s*/gi,
        transform: (match: string, subject: string, verb: string) => {
          const activeForm = this.getActiveVerb(verb);
          return `${subject} ${activeForm}`;
        }
      }
    ];

    let result = sentence;
    let changed = false;

    passivePatterns.forEach(rule => {
      const originalResult = result;
      result = result.replace(rule.pattern, rule.transform as any);
      if (originalResult !== result) changed = true;
    });

    if (changed) {
      this.changes.push({
        rule: 'Passive Voice',
        type: 'clarity',
        before: sentence,
        after: result,
        reason: 'Converted passive voice to active voice for clearer, more direct writing'
      });
    }

    return result;
  }

  private getActiveVerb(pastParticiple: string): string {
    const irregularVerbs: { [key: string]: string } = {
      'written': 'wrote',
      'driven': 'drove',
      'given': 'gave',
      'taken': 'took',
      'chosen': 'chose',
      'seen': 'saw',
      'done': 'did',
      'known': 'knew',
      'shown': 'showed',
      'proven': 'proved',
      'broken': 'broke',
      'spoken': 'spoke',
      'eaten': 'ate',
      'beaten': 'beat',
      'forgotten': 'forgot',
      'frozen': 'froze',
      'gotten': 'got',
      'hidden': 'hid',
      'ridden': 'rode',
      'risen': 'rose',
      'stolen': 'stole',
      'worn': 'wore'
    };

    if (irregularVerbs[pastParticiple]) {
      return irregularVerbs[pastParticiple];
    }

    if (pastParticiple.endsWith('ed')) {
      const base = pastParticiple.slice(0, -2);
      if (pastParticiple.endsWith('ied')) {
        return pastParticiple.slice(0, -3) + 'y';
      }
      if (pastParticiple.endsWith('ted') || pastParticiple.endsWith('ded')) {
        return base;
      }
      return base;
    }

    return pastParticiple;
  }

  private restructureItIs(sentence: string, verb: string): string {
    const afterThat = sentence.match(/that\s+(.+)/i);
    if (afterThat) {
      return afterThat[1].charAt(0).toUpperCase() + afterThat[1].slice(1);
    }
    return sentence;
  }

  splitLongSentences(text: string): string {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const processedSentences: string[] = [];

    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      const wordCount = trimmed.split(/\s+/).length;

      if (wordCount > 25) {
        const split = this.intelligentSplit(trimmed);
        if (split.length > 1) {
          this.changes.push({
            rule: 'Long Sentence',
            type: 'clarity',
            before: trimmed,
            after: split.join(' '),
            reason: `Split sentence with ${wordCount} words into shorter, clearer sentences`
          });
        }
        processedSentences.push(...split);
      } else {
        processedSentences.push(trimmed);
      }
    });

    return processedSentences.join(' ');
  }

  private intelligentSplit(sentence: string): string[] {
    const conjunctions = [
      { pattern: /,\s*and\s+/i, replacement: '. ' },
      { pattern: /,\s*but\s+/i, replacement: '. However, ' },
      { pattern: /;\s*/g, replacement: '. ' },
      { pattern: /,\s*which\s+/i, replacement: '. This ' },
      { pattern: /,\s*while\s+/i, replacement: '. Meanwhile, ' }
    ];

    for (const conj of conjunctions) {
      if (conj.pattern.test(sentence)) {
        const parts = sentence.split(conj.pattern);
        if (parts.length === 2 && parts.every(p => p.split(/\s+/).length >= 5)) {
          return [
            this.ensureCompleteSentence(parts[0]),
            this.ensureCompleteSentence(parts[1])
          ];
        }
      }
    }

    return [sentence];
  }

  separateMultipleIdeas(sentence: string): string[] {
    const clauses = this.countClauses(sentence);
    if (clauses <= 2) {
      return [sentence];
    }

    const connectors = /\s+(and|but|however|moreover|furthermore|additionally|also)\s+/gi;
    const parts = sentence.split(connectors).filter(part =>
      part.length > 0 &&
      !['and', 'but', 'however', 'moreover', 'furthermore', 'additionally', 'also'].includes(part.toLowerCase())
    );

    if (parts.length > 1) {
      const separated = parts.map(part => this.ensureCompleteSentence(part.trim()));
      this.changes.push({
        rule: 'Multiple Ideas',
        type: 'clarity',
        before: sentence,
        after: separated.join(' '),
        reason: 'Separated multiple ideas into individual sentences for clarity'
      });
      return separated;
    }

    return [sentence];
  }

  private countClauses(sentence: string): number {
    const clauseIndicators = /\b(which|that|who|whom|whose|where|when|while|although|because|since|if|unless|after|before|as)\b/gi;
    const matches = sentence.match(clauseIndicators);
    return matches ? matches.length + 1 : 1;
  }

  private ensureCompleteSentence(fragment: string): string {
    let sentence = fragment.trim();

    if (!sentence) return '';

    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);

    if (!/[.!?]$/.test(sentence)) {
      sentence += '.';
    }

    return sentence;
  }

  simplifyLanguage(text: string): string {
    const replacements: { [key: string]: string } = {
      'utilize': 'use',
      'utilizes': 'uses',
      'utilized': 'used',
      'utilizing': 'using',
      'implement': 'use',
      'implements': 'uses',
      'implemented': 'used',
      'implementing': 'using',
      'facilitate': 'help',
      'facilitates': 'helps',
      'facilitated': 'helped',
      'demonstrate': 'show',
      'demonstrates': 'shows',
      'demonstrated': 'showed',
      'approximately': 'about',
      'subsequent': 'next',
      'prior to': 'before',
      'in order to': 'to',
      'due to the fact that': 'because',
      'in the event that': 'if',
      'at this point in time': 'now',
      'in light of the fact that': 'because',
      'in spite of the fact that': 'although',
      'for the purpose of': 'to',
      'with regard to': 'about',
      'with respect to': 'about',
      'in terms of': 'about',
      'on the basis of': 'based on',
      'as a consequence of': 'because of',
      'in conjunction with': 'with',
      'in the vicinity of': 'near',
      'a number of': 'several',
      'the majority of': 'most'
    };

    let result = text;
    let hasChanges = false;

    Object.entries(replacements).forEach(([complex, simple]) => {
      const regex = new RegExp(`\\b${complex}\\b`, 'gi');
      const before = result;
      result = result.replace(regex, simple);
      if (before !== result) hasChanges = true;
    });

    if (hasChanges) {
      this.changes.push({
        rule: 'Simplified Language',
        type: 'vocabulary',
        before: text,
        after: result,
        reason: 'Replaced elaborate vocabulary with simpler alternatives'
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