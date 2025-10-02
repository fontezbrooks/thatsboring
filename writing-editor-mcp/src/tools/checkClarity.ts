interface ClarityMetrics {
  score: number;
  issues: {
    category: string;
    severity: 'high' | 'medium' | 'low';
    count: number;
    examples: string[];
  }[];
  recommendations: string[];
  statistics: {
    averageSentenceLength: number;
    passiveVoicePercentage: number;
    complexWordPercentage: number;
    readabilityScore: number;
    jargonDensity: number;
  };
}

export async function checkClarity(text: string): Promise<ClarityMetrics> {
  const sentences = extractSentences(text);
  const words = text.split(/\s+/).filter(w => w.length > 0);

  const issues = [
    checkPassiveVoice(text),
    checkLongSentences(sentences),
    checkComplexWords(words),
    checkJargon(text),
    checkRedundancy(text),
    checkMultipleClauses(sentences)
  ];

  const statistics = calculateStatistics(text, sentences, words);
  const score = calculateClarityScore(issues, statistics);
  const recommendations = generateRecommendations(issues, statistics);

  return {
    score,
    issues: issues.filter(i => i.count > 0),
    recommendations,
    statistics
  };
}

function extractSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+/g) || [];
}

function checkPassiveVoice(text: string): any {
  const passivePatterns = [
    /\b(?:was|were)\s+\w+ed\b/gi,
    /\b(?:has|have|had)\s+been\s+\w+ed\b/gi,
    /\b(?:is|are|am)\s+being\s+\w+ed\b/gi,
    /\bit\s+(?:is|was)\s+\w+ed\s+that\b/gi
  ];

  const examples: string[] = [];
  let count = 0;

  passivePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      count += matches.length;
      examples.push(...matches.slice(0, 3));
    }
  });

  return {
    category: 'Passive Voice',
    severity: count > 5 ? 'high' : count > 2 ? 'medium' : 'low',
    count,
    examples: examples.slice(0, 3)
  };
}

function checkLongSentences(sentences: string[]): any {
  const longSentences = sentences.filter(s => {
    const wordCount = s.trim().split(/\s+/).length;
    return wordCount > 25;
  });

  return {
    category: 'Long Sentences',
    severity: longSentences.length > 5 ? 'high' :
              longSentences.length > 2 ? 'medium' : 'low',
    count: longSentences.length,
    examples: longSentences.slice(0, 3).map(s =>
      s.length > 100 ? s.substring(0, 100) + '...' : s
    )
  };
}

function checkComplexWords(words: string[]): any {
  const complexWords = words.filter(word => {
    const cleaned = word.replace(/[^a-zA-Z]/g, '');
    return cleaned.length > 12 || countSyllables(cleaned) > 4;
  });

  const uniqueComplex = [...new Set(complexWords)];

  return {
    category: 'Complex Vocabulary',
    severity: uniqueComplex.length > 20 ? 'high' :
              uniqueComplex.length > 10 ? 'medium' : 'low',
    count: uniqueComplex.length,
    examples: uniqueComplex.slice(0, 5)
  };
}

function checkJargon(text: string): any {
  const jargonTerms = [
    'paradigm', 'framework', 'utilize', 'implement', 'facilitate',
    'leverage', 'synergy', 'holistic', 'robust', 'cutting-edge',
    'state-of-the-art', 'best-of-breed', 'game-changing', 'disruptive',
    'transformative', 'innovative', 'revolutionary', 'groundbreaking'
  ];

  const found: string[] = [];
  let count = 0;

  jargonTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      count += matches.length;
      found.push(term);
    }
  });

  return {
    category: 'Academic Jargon',
    severity: count > 10 ? 'high' : count > 5 ? 'medium' : 'low',
    count,
    examples: found.slice(0, 5)
  };
}

function checkRedundancy(text: string): any {
  const redundantPhrases = [
    'absolutely essential', 'actual fact', 'advance planning',
    'basic fundamentals', 'close proximity', 'completely eliminate',
    'end result', 'final outcome', 'free gift', 'future plans',
    'past history', 'personal opinion', 'repeat again', 'true fact',
    'unexpected surprise', 'very unique'
  ];

  const found: string[] = [];
  let count = 0;

  redundantPhrases.forEach(phrase => {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    if (regex.test(text)) {
      count++;
      found.push(phrase);
    }
  });

  return {
    category: 'Redundant Phrases',
    severity: count > 5 ? 'high' : count > 2 ? 'medium' : 'low',
    count,
    examples: found.slice(0, 5)
  };
}

function checkMultipleClauses(sentences: string[]): any {
  const complexSentences = sentences.filter(sentence => {
    const clauseIndicators = /\b(which|that|who|whom|whose|where|when|while|although|because|since|if|unless)\b/gi;
    const matches = sentence.match(clauseIndicators);
    return matches && matches.length > 2;
  });

  return {
    category: 'Multiple Clauses',
    severity: complexSentences.length > 5 ? 'high' :
              complexSentences.length > 2 ? 'medium' : 'low',
    count: complexSentences.length,
    examples: complexSentences.slice(0, 3).map(s =>
      s.length > 100 ? s.substring(0, 100) + '...' : s
    )
  };
}

function calculateStatistics(text: string, sentences: string[], words: string[]): any {
  const passiveCount = (text.match(/(?:was|were|been|being|is|are|am)\s+\w+ed/gi) || []).length;
  const complexWords = words.filter(w => countSyllables(w) > 3);
  const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
  const avgSyllablesPerWord = words.length > 0 ? totalSyllables / words.length : 0;

  const fleschScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  const jargonTerms = ['paradigm', 'framework', 'utilize', 'implement', 'facilitate'];
  const jargonCount = jargonTerms.reduce((count, term) => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    return count + (text.match(regex) || []).length;
  }, 0);

  return {
    averageSentenceLength: Math.round(avgWordsPerSentence * 10) / 10,
    passiveVoicePercentage: Math.round((passiveCount / sentences.length) * 100),
    complexWordPercentage: Math.round((complexWords.length / words.length) * 100),
    readabilityScore: Math.max(0, Math.min(100, Math.round(fleschScore))),
    jargonDensity: Math.round((jargonCount / words.length) * 1000) / 10
  };
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

  if (word.endsWith('e') && count > 1) count--;
  if (word.endsWith('le') && !vowels.includes(word[word.length - 3])) count++;

  return Math.max(1, count);
}

function calculateClarityScore(issues: any[], statistics: any): number {
  let score = 100;

  issues.forEach(issue => {
    if (issue.severity === 'high') {
      score -= 15;
    } else if (issue.severity === 'medium') {
      score -= 8;
    } else if (issue.severity === 'low') {
      score -= 3;
    }
  });

  if (statistics.averageSentenceLength > 25) score -= 10;
  if (statistics.passiveVoicePercentage > 20) score -= 10;
  if (statistics.complexWordPercentage > 15) score -= 5;
  if (statistics.readabilityScore < 50) score -= 10;
  if (statistics.jargonDensity > 5) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function generateRecommendations(issues: any[], statistics: any): string[] {
  const recommendations: string[] = [];

  issues.forEach(issue => {
    if (issue.count === 0) return;

    switch (issue.category) {
      case 'Passive Voice':
        recommendations.push(`Convert ${issue.count} passive voice instances to active voice for clearer writing`);
        break;
      case 'Long Sentences':
        recommendations.push(`Split ${issue.count} long sentences (>25 words) into shorter, clearer statements`);
        break;
      case 'Complex Vocabulary':
        recommendations.push(`Replace ${issue.count} complex words with simpler alternatives`);
        break;
      case 'Academic Jargon':
        recommendations.push(`Remove or replace ${issue.count} instances of academic jargon`);
        break;
      case 'Redundant Phrases':
        recommendations.push(`Eliminate ${issue.count} redundant phrases for conciseness`);
        break;
      case 'Multiple Clauses':
        recommendations.push(`Simplify ${issue.count} sentences with multiple clauses`);
        break;
    }
  });

  if (statistics.averageSentenceLength > 20) {
    recommendations.push(`Reduce average sentence length from ${statistics.averageSentenceLength} to under 20 words`);
  }

  if (statistics.readabilityScore < 60) {
    recommendations.push(`Improve readability score from ${statistics.readabilityScore} to at least 60`);
  }

  if (statistics.passiveVoicePercentage > 10) {
    recommendations.push(`Reduce passive voice usage from ${statistics.passiveVoicePercentage}% to under 10%`);
  }

  return recommendations;
}