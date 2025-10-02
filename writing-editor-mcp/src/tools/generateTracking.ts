import { Change } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function generateTrackingMarkdown(
  original: string,
  edited: string,
  changes: Change[]
): Promise<string> {
  const timestamp = new Date().toISOString();
  const originalWords = countWords(original);
  const editedWords = countWords(edited);
  const readabilityBefore = calculateReadabilityScore(original);
  const readabilityAfter = calculateReadabilityScore(edited);

  let markdown = `# Writing Edits Tracking Document\n\n`;
  markdown += `**Generated:** ${timestamp}\n\n`;

  markdown += `## Summary Statistics\n\n`;
  markdown += `| Metric | Before | After | Change |\n`;
  markdown += `|--------|--------|-------|--------|\n`;
  markdown += `| Total Words | ${originalWords} | ${editedWords} | ${editedWords - originalWords} |\n`;
  markdown += `| Readability Score | ${readabilityBefore.toFixed(1)} | ${readabilityAfter.toFixed(1)} | ${(readabilityAfter - readabilityBefore).toFixed(1)} |\n`;
  markdown += `| Total Edits | - | - | ${changes.length} |\n`;
  markdown += `| Characters | ${original.length} | ${edited.length} | ${edited.length - original.length} |\n\n`;

  markdown += `## Changes by Category\n\n`;
  const changesByType = groupChangesByType(changes);

  Object.entries(changesByType).forEach(([type, typeChanges]) => {
    markdown += `### ${capitalizeFirst(type)} Changes (${typeChanges.length})\n\n`;

    typeChanges.forEach((change, idx) => {
      markdown += `#### ${idx + 1}. ${change.rule}\n\n`;
      markdown += `**Before:**\n`;
      markdown += `\`\`\`\n${change.before}\n\`\`\`\n\n`;
      markdown += `**After:**\n`;
      markdown += `\`\`\`\n${change.after}\n\`\`\`\n\n`;
      markdown += `**Reason:** ${change.reason}\n\n`;
    });
  });

  markdown += `## Full Document Comparison\n\n`;
  markdown += `<details>\n`;
  markdown += `<summary>Click to expand full comparison</summary>\n\n`;
  markdown += `### Original Version\n`;
  markdown += `\`\`\`\n${original}\n\`\`\`\n\n`;
  markdown += `### Edited Version\n`;
  markdown += `\`\`\`\n${edited}\n\`\`\`\n`;
  markdown += `</details>\n\n`;

  markdown += `## Applied Rules Summary\n\n`;
  const rulesApplied = new Set(changes.map(c => c.rule));
  markdown += `The following ${rulesApplied.size} rules were applied:\n\n`;
  rulesApplied.forEach(rule => {
    const count = changes.filter(c => c.rule === rule).length;
    markdown += `- **${rule}**: ${count} change${count > 1 ? 's' : ''}\n`;
  });

  return markdown;
}

export async function saveTrackingDocument(
  markdown: string,
  outputDir: string = './edits'
): Promise<string> {
  try {
    await fs.mkdir(outputDir, { recursive: true });

    const timestamp = Date.now();
    const filename = `edits_${timestamp}.md`;
    const filepath = path.join(outputDir, filename);

    await fs.writeFile(filepath, markdown, 'utf-8');

    return filepath;
  } catch (error) {
    console.error('Error saving tracking document:', error);
    throw error;
  }
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

function calculateReadabilityScore(text: string): number {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const averageWordsPerSentence = words.length / sentences.length;
  const averageSyllablesPerWord = syllables / words.length;

  const fleschScore = 206.835 -
    1.015 * averageWordsPerSentence -
    84.6 * averageSyllablesPerWord;

  return Math.max(0, Math.min(100, fleschScore));
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length === 0) return 0;

  let count = 0;
  let previousWasVowel = false;
  const vowels = 'aeiou';

  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }

  if (word.endsWith('e') && count > 1) {
    count--;
  }

  if (word.endsWith('le') && word.length > 2 && !vowels.includes(word[word.length - 3])) {
    count++;
  }

  return Math.max(1, count);
}

function groupChangesByType(changes: Change[]): Record<string, Change[]> {
  const grouped: Record<string, Change[]> = {};

  changes.forEach(change => {
    if (!grouped[change.type]) {
      grouped[change.type] = [];
    }
    grouped[change.type].push(change);
  });

  return grouped;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function generateDiffView(original: string, edited: string): string {
  const originalLines = original.split('\n');
  const editedLines = edited.split('\n');
  let diff = '';

  const maxLines = Math.max(originalLines.length, editedLines.length);

  for (let i = 0; i < maxLines; i++) {
    const origLine = originalLines[i] || '';
    const editLine = editedLines[i] || '';

    if (origLine === editLine) {
      diff += `  ${origLine}\n`;
    } else {
      if (origLine) {
        diff += `- ${origLine}\n`;
      }
      if (editLine) {
        diff += `+ ${editLine}\n`;
      }
    }
  }

  return diff;
}