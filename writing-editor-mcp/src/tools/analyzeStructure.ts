import { StructureRules } from '../rules/structure.rules';
import { ValidationResult } from '../types';

interface StructureAnalysisResult {
  valid: boolean;
  sections: {
    name: string;
    present: boolean;
    issues?: string[];
  }[];
  suggestions: string[];
  fixedVersion?: string;
}

export async function analyzeStructure(
  text: string,
  expectedSections?: string[]
): Promise<StructureAnalysisResult> {
  const structureRules = new StructureRules();
  const sections = extractDocumentSections(text);

  const defaultExpectedSections = [
    'Abstract',
    'Introduction',
    'Overview',
    'Technical Approach',
    'Evaluation',
    'Related Work',
    'Conclusion'
  ];

  const expected = expectedSections || defaultExpectedSections;
  const sectionAnalysis = expected.map(expectedSection => {
    const found = sections.find(s =>
      s.title.toLowerCase().includes(expectedSection.toLowerCase())
    );

    const analysis: any = {
      name: expectedSection,
      present: !!found
    };

    if (found) {
      if (expectedSection.toLowerCase() === 'introduction') {
        const validation = structureRules.validateIntroduction(found.content);
        if (!validation.valid) {
          analysis.issues = validation.issues;
        }
      } else if (expectedSection.toLowerCase() === 'abstract') {
        const validation = structureRules.validateAbstract(found.content);
        if (!validation.valid) {
          analysis.issues = validation.issues;
        }
      }
    } else {
      analysis.issues = [`${expectedSection} section is missing`];
    }

    return analysis;
  });

  const suggestions = generateStructureSuggestions(sectionAnalysis, sections);

  let fixedVersion: string | undefined;
  if (sectionAnalysis.some(s => !s.present || s.issues)) {
    fixedVersion = generateImprovedStructure(text, sectionAnalysis);
  }

  return {
    valid: sectionAnalysis.every(s => s.present && !s.issues),
    sections: sectionAnalysis,
    suggestions,
    fixedVersion
  };
}

function extractDocumentSections(text: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];
  const lines = text.split('\n');
  let currentSection: { title: string; content: string } | null = null;
  let contentLines: string[] = [];

  const sectionPatterns = [
    /^#+\s+(.+)$/,
    /^(?:\d+\.?\s+)?([A-Z][^.!?]*?)$/,
    /^([A-Z][^:]+):$/
  ];

  for (const line of lines) {
    let matched = false;

    for (const pattern of sectionPatterns) {
      const match = line.match(pattern);
      if (match) {
        if (currentSection && contentLines.length > 0) {
          currentSection.content = contentLines.join('\n').trim();
          sections.push(currentSection);
        }

        currentSection = { title: match[1].trim(), content: '' };
        contentLines = [];
        matched = true;
        break;
      }
    }

    if (!matched && line.trim()) {
      contentLines.push(line);
    }
  }

  if (currentSection && contentLines.length > 0) {
    currentSection.content = contentLines.join('\n').trim();
    sections.push(currentSection);
  }

  if (sections.length === 0 && text.trim()) {
    sections.push({
      title: 'Content',
      content: text.trim()
    });
  }

  return sections;
}

function generateStructureSuggestions(
  sectionAnalysis: any[],
  actualSections: { title: string; content: string }[]
): string[] {
  const suggestions: string[] = [];

  const missingSections = sectionAnalysis
    .filter(s => !s.present)
    .map(s => s.name);

  if (missingSections.length > 0) {
    suggestions.push(`Add missing sections: ${missingSections.join(', ')}`);
  }

  const sectionsWithIssues = sectionAnalysis.filter(s => s.issues && s.issues.length > 0);
  sectionsWithIssues.forEach(section => {
    section.issues.forEach((issue: string) => {
      suggestions.push(`${section.name}: ${issue}`);
    });
  });

  const abstractSection = actualSections.find(s =>
    s.title.toLowerCase().includes('abstract')
  );
  if (abstractSection) {
    const wordCount = abstractSection.content.split(/\s+/).length;
    if (wordCount < 100) {
      suggestions.push(`Abstract is too short (${wordCount} words). Aim for 100-250 words.`);
    } else if (wordCount > 250) {
      suggestions.push(`Abstract is too long (${wordCount} words). Aim for 100-250 words.`);
    }
  }

  const introSection = actualSections.find(s =>
    s.title.toLowerCase().includes('introduction')
  );
  if (introSection && !introSection.content.toLowerCase().includes('contribution')) {
    suggestions.push('Introduction should explicitly state the contributions of the work');
  }

  const conclusionSection = actualSections.find(s =>
    s.title.toLowerCase().includes('conclusion')
  );
  if (!conclusionSection) {
    suggestions.push('Add a conclusion section to summarize findings and future work');
  }

  const overviewSection = actualSections.find(s =>
    s.title.toLowerCase().includes('overview')
  );
  if (!overviewSection && actualSections.length > 4) {
    suggestions.push('Consider adding an Overview section after Introduction for complex documents');
  }

  return suggestions;
}

function generateImprovedStructure(text: string, sectionAnalysis: any[]): string {
  const sections = extractDocumentSections(text);
  let improved = '';

  const missingSections = sectionAnalysis.filter(s => !s.present);

  if (!sectionAnalysis.find(s => s.name === 'Abstract')?.present) {
    improved += '# Abstract\n\n';
    improved += generateAbstractTemplate(text) + '\n\n';
  }

  sections.forEach(section => {
    const analysis = sectionAnalysis.find(s =>
      section.title.toLowerCase().includes(s.name.toLowerCase())
    );

    improved += `# ${section.title}\n\n`;

    if (analysis && analysis.issues) {
      if (section.title.toLowerCase().includes('introduction')) {
        const structureRules = new StructureRules();
        const validation = structureRules.validateIntroduction(section.content);
        improved += validation.fixedText + '\n\n';
      } else if (section.title.toLowerCase().includes('abstract')) {
        const structureRules = new StructureRules();
        const validation = structureRules.validateAbstract(section.content);
        improved += validation.fixedText + '\n\n';
      } else {
        improved += section.content + '\n\n';
      }
    } else {
      improved += section.content + '\n\n';
    }
  });

  missingSections.forEach(missing => {
    if (!improved.includes(`# ${missing.name}`)) {
      improved += `# ${missing.name}\n\n`;
      improved += generateSectionTemplate(missing.name) + '\n\n';
    }
  });

  return improved.trim();
}

function generateAbstractTemplate(documentText: string): string {
  return `This work addresses a critical challenge in the field. A novel approach is proposed that combines innovative techniques to solve the identified problem. The method demonstrates significant improvements over existing solutions through comprehensive evaluation. Results show substantial gains in performance metrics, validating the effectiveness of the proposed approach.`;
}

function generateSectionTemplate(sectionName: string): string {
  const templates: { [key: string]: string } = {
    'Overview': 'This section provides an overview of the document structure and main components of the proposed approach.',
    'Technical Approach': 'The technical details of the proposed method are presented here, including algorithms and implementation specifics.',
    'Evaluation': 'This section presents experimental results and performance comparisons with baseline methods.',
    'Related Work': 'Previous research and existing approaches related to this problem are discussed here.',
    'Conclusion': 'This work presented a novel approach to address the stated problem. Future work includes extending the method to additional domains.'
  };

  return templates[sectionName] || `[${sectionName} content to be added]`;
}