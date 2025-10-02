import { ValidationResult, Section, StructureChecks, Change } from '../types';

export class StructureRules {
  private changes: Change[] = [];

  validateIntroduction(text: string): ValidationResult {
    const checks: StructureChecks = {
      problemInFirstParagraph: this.checkFirstParagraphProblem(text),
      hasContributions: text.toLowerCase().includes('contribution'),
      avoidGrandmothering: !this.hasObviousStatements(text),
      hasSilverBullet: this.identifiesKeyIdea(text),
      comparesApproaches: this.mentionsAlternatives(text)
    };

    const issues: string[] = [];
    if (!checks.problemInFirstParagraph) {
      issues.push('Introduction should state the problem in the first paragraph');
    }
    if (!checks.hasContributions) {
      issues.push('Introduction should clearly state the contributions');
    }
    if (!checks.avoidGrandmothering) {
      issues.push('Remove obvious or well-known statements');
    }
    if (!checks.hasSilverBullet) {
      issues.push('Clearly identify the key idea or silver bullet');
    }
    if (!checks.comparesApproaches) {
      issues.push('Compare your approach with alternatives');
    }

    const fixedText = this.autoFixIntroduction(text, checks);

    return {
      valid: Object.values(checks).every(v => v),
      issues: issues.length > 0 ? issues : undefined,
      fixedText: fixedText,
      changes: this.changes
    };
  }

  private checkFirstParagraphProblem(text: string): boolean {
    const firstParagraph = this.extractFirstParagraph(text);
    const problemKeywords = [
      'problem', 'issue', 'challenge', 'difficult', 'limitation',
      'gap', 'lacking', 'insufficient', 'inadequate', 'fails'
    ];
    return problemKeywords.some(keyword =>
      firstParagraph.toLowerCase().includes(keyword)
    );
  }

  private extractFirstParagraph(text: string): string {
    const paragraphs = text.split(/\n\n+/);
    return paragraphs[0] || '';
  }

  private hasObviousStatements(text: string): boolean {
    const obviousPatterns = [
      /computers are everywhere/i,
      /the internet has changed/i,
      /in today's world/i,
      /as we all know/i,
      /it is well known that/i,
      /everyone knows/i,
      /clearly/i,
      /obviously/i,
      /of course/i
    ];
    return obviousPatterns.some(pattern => pattern.test(text));
  }

  private identifiesKeyIdea(text: string): boolean {
    const keyIdeaIndicators = [
      'key insight', 'main idea', 'core contribution', 'novel approach',
      'our approach', 'we propose', 'we present', 'we introduce',
      'this paper presents', 'this work'
    ];
    return keyIdeaIndicators.some(indicator =>
      text.toLowerCase().includes(indicator)
    );
  }

  private mentionsAlternatives(text: string): boolean {
    const comparisonWords = [
      'unlike', 'compared to', 'in contrast', 'whereas', 'while',
      'alternative', 'existing', 'previous', 'traditional', 'conventional'
    ];
    return comparisonWords.some(word =>
      text.toLowerCase().includes(word)
    );
  }

  private autoFixIntroduction(text: string, checks: StructureChecks): string {
    let fixed = text;

    if (!checks.problemInFirstParagraph) {
      const paragraphs = fixed.split(/\n\n+/);
      if (paragraphs.length > 0) {
        const problemStatement = this.generateProblemStatement(paragraphs[0]);
        paragraphs[0] = problemStatement + ' ' + paragraphs[0];
        fixed = paragraphs.join('\n\n');
        this.changes.push({
          rule: 'Introduction Structure',
          type: 'structure',
          before: text,
          after: fixed,
          reason: 'Added problem statement to first paragraph'
        });
      }
    }

    if (!checks.hasContributions) {
      fixed = this.addContributionsSection(fixed);
    }

    fixed = this.removeObviousStatements(fixed);

    return fixed;
  }

  private generateProblemStatement(context: string): string {
    const topics = this.extractTopics(context);
    if (topics.length > 0) {
      return `The challenge of ${topics[0]} remains unsolved.`;
    }
    return 'This addresses a critical problem in the field.';
  }

  private extractTopics(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const topics: string[] = [];

    const technicalWords = words.filter(word =>
      word.length > 5 &&
      !['which', 'where', 'while', 'through', 'because'].includes(word)
    );

    return technicalWords.slice(0, 3);
  }

  private addContributionsSection(text: string): string {
    const contributionText = '\n\nThe main contributions of this work are: First, we provide a novel approach. Second, we demonstrate improved performance. Third, we validate through extensive evaluation.\n\n';

    const paragraphs = text.split(/\n\n+/);
    if (paragraphs.length >= 2) {
      paragraphs.splice(1, 0, contributionText);
      this.changes.push({
        rule: 'Contributions Section',
        type: 'structure',
        before: text,
        after: paragraphs.join('\n\n'),
        reason: 'Added explicit contributions section'
      });
      return paragraphs.join('\n\n');
    }

    return text + contributionText;
  }

  private removeObviousStatements(text: string): string {
    const obviousPatterns = [
      /In today's world[^.]*\./gi,
      /As we all know[^.]*\./gi,
      /It is well known that[^.]*\./gi,
      /Obviously[^.]*\./gi,
      /Clearly[^.]*\./gi
    ];

    let fixed = text;
    let hasChanges = false;

    obviousPatterns.forEach(pattern => {
      const before = fixed;
      fixed = fixed.replace(pattern, '');
      if (before !== fixed) hasChanges = true;
    });

    if (hasChanges) {
      fixed = fixed.replace(/\s+/g, ' ').trim();
      this.changes.push({
        rule: 'Remove Obvious Statements',
        type: 'structure',
        before: text,
        after: fixed,
        reason: 'Removed obvious or well-known statements'
      });
    }

    return fixed;
  }

  validateAbstract(text: string): ValidationResult {
    const wordCount = text.split(/\s+/).length;
    const checks: StructureChecks = {
      independent: !text.includes('this paper') &&
                  !text.includes('we present') &&
                  !text.includes('this work'),
      selfContained: this.hasAllComponents(text, ['problem', 'approach', 'result']),
      correctLength: wordCount >= 100 && wordCount <= 250
    };

    const issues: string[] = [];
    if (!checks.independent) {
      issues.push('Abstract should be self-contained without references to "this paper"');
    }
    if (!checks.selfContained) {
      issues.push('Abstract must include problem, approach, and results');
    }
    if (!checks.correctLength) {
      issues.push(`Abstract should be 100-250 words (currently ${wordCount} words)`);
    }

    const fixedText = this.restructureAbstract(text, checks);

    return {
      valid: Object.values(checks).every(v => v),
      issues: issues.length > 0 ? issues : undefined,
      fixedText: fixedText,
      changes: this.changes
    };
  }

  private hasAllComponents(text: string, components: string[]): boolean {
    const lowerText = text.toLowerCase();
    return components.every(component => {
      const synonyms = this.getSynonyms(component);
      return synonyms.some(synonym => lowerText.includes(synonym));
    });
  }

  private getSynonyms(word: string): string[] {
    const synonymMap: { [key: string]: string[] } = {
      'problem': ['problem', 'challenge', 'issue', 'difficulty', 'limitation'],
      'approach': ['approach', 'method', 'technique', 'solution', 'system'],
      'result': ['result', 'evaluation', 'performance', 'improvement', 'achieve']
    };
    return synonymMap[word] || [word];
  }

  private restructureAbstract(text: string, checks: StructureChecks): string {
    let fixed = text;

    fixed = fixed.replace(/this paper/gi, 'this research');
    fixed = fixed.replace(/we present/gi, 'introduces');
    fixed = fixed.replace(/this work/gi, 'the study');

    if (!checks.selfContained) {
      const components = this.generateAbstractComponents(text);
      fixed = `${components.problem} ${components.approach} ${components.results}`;
      this.changes.push({
        rule: 'Abstract Structure',
        type: 'structure',
        before: text,
        after: fixed,
        reason: 'Restructured abstract to include all required components'
      });
    }

    const words = fixed.split(/\s+/);
    if (words.length > 250) {
      fixed = words.slice(0, 250).join(' ') + '.';
      this.changes.push({
        rule: 'Abstract Length',
        type: 'structure',
        before: text,
        after: fixed,
        reason: 'Shortened abstract to meet 250-word limit'
      });
    } else if (words.length < 100) {
      fixed = this.expandAbstract(fixed);
    }

    return fixed;
  }

  private generateAbstractComponents(text: string): { problem: string; approach: string; results: string } {
    return {
      problem: 'This research addresses a significant challenge in the field.',
      approach: 'A novel approach is proposed that combines innovative techniques.',
      results: 'Evaluation demonstrates substantial improvements over existing methods.'
    };
  }

  private expandAbstract(text: string): string {
    const expansion = ' The comprehensive evaluation validates the effectiveness of the proposed approach through rigorous testing and comparison with state-of-the-art methods.';
    return text + expansion;
  }

  insertOverviewSection(sections: Section[]): Section[] {
    const hasOverview = sections.some(s =>
      s.title.toLowerCase().includes('overview')
    );

    if (!hasOverview) {
      const overviewIndex = this.findOverviewPosition(sections);
      const overview = this.generateOverview(sections);
      sections.splice(overviewIndex, 0, overview);

      this.changes.push({
        rule: 'Overview Section',
        type: 'structure',
        before: 'No overview section',
        after: 'Added overview section',
        reason: 'Inserted overview section for better document structure'
      });
    }

    return sections;
  }

  private findOverviewPosition(sections: Section[]): number {
    const positions = ['introduction', 'abstract'];
    for (let i = 0; i < sections.length; i++) {
      if (positions.some(pos => sections[i].title.toLowerCase().includes(pos))) {
        return i + 1;
      }
    }
    return 1;
  }

  private generateOverview(sections: Section[]): Section {
    const sectionNames = sections
      .filter(s => !s.title.toLowerCase().includes('abstract'))
      .map(s => s.title)
      .slice(0, 5);

    const content = `This document is organized as follows. ${sectionNames.map((name, i) =>
      `Section ${i + 2} covers ${name.toLowerCase()}`
    ).join('. ')}. The document concludes with a summary of key findings and future directions.`;

    return {
      title: 'Overview',
      content: content,
      edited: content
    };
  }

  getChanges(): Change[] {
    return this.changes;
  }

  clearChanges(): void {
    this.changes = [];
  }
}