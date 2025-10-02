import { ProcessedDocument, Section, Change, DocumentMetrics } from '../types';
import { ClarityRules } from '../rules/clarity.rules';
import { StyleRules } from '../rules/style.rules';
import { StructureRules } from '../rules/structure.rules';

export class DocumentProcessor {
  private clarityRules: ClarityRules;
  private styleRules: StyleRules;
  private structureRules: StructureRules;

  constructor() {
    this.clarityRules = new ClarityRules();
    this.styleRules = new StyleRules();
    this.structureRules = new StructureRules();
  }

  async processDocument(
    text: string,
    type: 'full_paper' | 'section' | 'paragraph' | 'abstract'
  ): Promise<ProcessedDocument> {
    this.clearAllChanges();

    const sections = type === 'full_paper'
      ? this.extractSections(text)
      : [{ title: 'Content', content: text }];

    const processed = await Promise.all(
      sections.map(async section => {
        const sentences = this.splitIntoSentences(section.content);
        const editedSentences = await Promise.all(
          sentences.map(s => this.processSentence(s))
        );

        const edited = editedSentences.join(' ');
        const changes = this.collectChanges();

        return {
          ...section,
          original: section.content,
          edited: edited,
          changes: changes
        };
      })
    );

    const allChanges = processed.flatMap(s => s.changes || []);
    const metrics = this.calculateMetrics(text, processed);
    const trackingDocument = this.generateTrackingMarkdown(processed, allChanges);

    return {
      type,
      sections: processed,
      metrics,
      trackingDocument,
      changes: allChanges,
      suggestions: this.generateSuggestions(metrics, allChanges)
    };
  }

  private async processSentence(sentence: string): Promise<string> {
    if (!sentence.trim()) return sentence;

    let edited = sentence;

    edited = this.clarityRules.fixPassiveVoice(edited);
    edited = this.clarityRules.simplifyLanguage(edited);
    edited = this.styleRules.cleanVocabulary(edited);
    edited = this.styleRules.fixTense(edited);
    edited = this.styleRules.removeRedundancy(edited);
    edited = this.styleRules.enforceActiveWriting(edited);
    edited = this.styleRules.removeParentheticals(edited);

    const splits = this.clarityRules.separateMultipleIdeas(edited);
    if (splits.length > 1) {
      return splits.join(' ');
    }

    return edited;
  }

  private extractSections(text: string): Section[] {
    const sections: Section[] = [];
    const lines = text.split('\n');
    let currentSection: Section | null = null;
    let contentLines: string[] = [];

    const sectionPattern = /^#+\s+(.+)$/;
    const numberedPattern = /^(?:\d+\.?\s+)?([A-Z][^.!?]*?)$/;

    for (const line of lines) {
      const sectionMatch = line.match(sectionPattern);
      const numberedMatch = line.match(numberedPattern);

      if (sectionMatch || numberedMatch) {
        if (currentSection && contentLines.length > 0) {
          currentSection.content = contentLines.join('\n').trim();
          sections.push(currentSection);
        }

        const title = sectionMatch ? sectionMatch[1] : numberedMatch![1];
        currentSection = { title, content: '' };
        contentLines = [];
      } else {
        contentLines.push(line);
      }
    }

    if (currentSection && contentLines.length > 0) {
      currentSection.content = contentLines.join('\n').trim();
      sections.push(currentSection);
    }

    if (sections.length === 0 && text.trim()) {
      sections.push({
        title: 'Document',
        content: text.trim()
      });
    }

    return sections;
  }

  private splitIntoSentences(text: string): string[] {
    if (!text) return [];

    const sentencePattern = /[^.!?]+[.!?]+/g;
    const sentences = text.match(sentencePattern) || [];

    const processedSentences: string[] = [];
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.split(/\s+/).length > 25) {
        const result = this.clarityRules.splitLongSentences(trimmed);
        processedSentences.push(result);
      } else {
        processedSentences.push(trimmed);
      }
    });

    return processedSentences;
  }

  private collectChanges(): Change[] {
    const changes: Change[] = [
      ...this.clarityRules.getChanges(),
      ...this.styleRules.getChanges(),
      ...this.structureRules.getChanges()
    ];

    this.clearAllChanges();
    return changes;
  }

  private clearAllChanges(): void {
    this.clarityRules.clearChanges();
    this.styleRules.clearChanges();
    this.structureRules.clearChanges();
  }

  private calculateMetrics(original: string, processed: Section[]): DocumentMetrics {
    const editedText = processed.map(s => s.edited || s.content).join(' ');
    const originalWords = original.split(/\s+/).length;
    const editedWords = editedText.split(/\s+/).length;

    const passiveVoiceCount = (original.match(/(?:was|were|been|being|is|are|am)\s+\w+ed/gi) || []).length;
    const longSentenceCount = this.countLongSentences(original);

    const clarityScore = this.calculateClarityScore(editedText);
    const readabilityBefore = this.calculateReadability(original);
    const readabilityAfter = this.calculateReadability(editedText);

    return {
      clarity: clarityScore,
      wordReduction: originalWords - editedWords,
      readabilityGain: readabilityAfter - readabilityBefore,
      sentenceComplexity: this.calculateComplexity(editedText),
      passiveVoiceCount: passiveVoiceCount,
      longSentenceCount: longSentenceCount
    };
  }

  private countLongSentences(text: string): number {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    return sentences.filter(s => s.trim().split(/\s+/).length > 25).length;
  }

  private calculateClarityScore(text: string): number {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length === 0) return 0;

    let score = 100;

    const avgWordCount = sentences.reduce((sum, s) =>
      sum + s.trim().split(/\s+/).length, 0) / sentences.length;

    if (avgWordCount > 20) score -= 10;
    if (avgWordCount > 25) score -= 10;

    const passiveCount = (text.match(/(?:was|were|been|being|is|are|am)\s+\w+ed/gi) || []).length;
    score -= passiveCount * 2;

    const complexWords = text.match(/\b\w{10,}\b/g) || [];
    score -= Math.min(complexWords.length, 20);

    return Math.max(0, score);
  }

  private calculateReadability(text: string): number {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const words = text.split(/\s+/);
    const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    const fleschScore = 206.835 - 1.015 * (words.length / sentences.length) -
                       84.6 * (syllables / words.length);

    return Math.max(0, Math.min(100, fleschScore));
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    let count = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = /[aeiou]/.test(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }

    if (word.endsWith('e')) count--;
    if (count === 0) count = 1;

    return count;
  }

  private calculateComplexity(text: string): number {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length === 0) return 0;

    const avgClauses = sentences.reduce((sum, s) => {
      const clauses = (s.match(/\b(which|that|who|whom|whose|where|when|while|although|because)\b/gi) || []).length;
      return sum + clauses;
    }, 0) / sentences.length;

    return Math.round(avgClauses * 10) / 10;
  }

  private generateTrackingMarkdown(processed: Section[], changes: Change[]): string {
    const timestamp = new Date().toISOString();
    let markdown = `# Writing Edits Tracking Document\n\n`;
    markdown += `**Generated:** ${timestamp}\n\n`;
    markdown += `## Summary\n`;
    markdown += `- Total changes: ${changes.length}\n`;
    markdown += `- Sections processed: ${processed.length}\n\n`;

    if (changes.length > 0) {
      markdown += `## Detailed Changes\n\n`;

      changes.forEach((change, idx) => {
        markdown += `### Change ${idx + 1}\n`;
        markdown += `**Rule Applied:** ${change.rule}\n`;
        markdown += `**Type:** ${change.type}\n\n`;
        markdown += `**Before:**\n`;
        markdown += `> ${change.before}\n\n`;
        markdown += `**After:**\n`;
        markdown += `> ${change.after}\n\n`;
        markdown += `**Reason:** ${change.reason}\n\n`;
        markdown += `---\n\n`;
      });
    }

    markdown += `## Section Comparison\n\n`;
    processed.forEach(section => {
      if (section.original && section.edited) {
        markdown += `### ${section.title}\n\n`;
        markdown += `**Original:**\n\`\`\`\n${section.original}\n\`\`\`\n\n`;
        markdown += `**Edited:**\n\`\`\`\n${section.edited}\n\`\`\`\n\n`;
      }
    });

    return markdown;
  }

  private generateSuggestions(metrics: DocumentMetrics, changes: Change[]): string[] {
    const suggestions: string[] = [];

    if (metrics.passiveVoiceCount > 0) {
      suggestions.push(`Found ${metrics.passiveVoiceCount} instances of passive voice that were corrected`);
    }

    if (metrics.longSentenceCount > 0) {
      suggestions.push(`Split ${metrics.longSentenceCount} long sentences for better readability`);
    }

    if (metrics.wordReduction > 0) {
      suggestions.push(`Reduced word count by ${metrics.wordReduction} words for conciseness`);
    }

    if (metrics.readabilityGain > 5) {
      suggestions.push(`Improved readability score by ${Math.round(metrics.readabilityGain)} points`);
    }

    const ruleTypes = new Set(changes.map(c => c.type));
    ruleTypes.forEach(type => {
      const count = changes.filter(c => c.type === type).length;
      suggestions.push(`Applied ${count} ${type} improvements`);
    });

    return suggestions;
  }
}