import { EditResult } from '../types';
import { DocumentProcessor } from '../processors/documentParser';
import { StructureRules } from '../rules/structure.rules';
import { generateTrackingMarkdown, saveTrackingDocument } from './generateTracking';

export async function editDocument(
  text: string,
  documentType: string = 'section',
  outputFormat: string = 'tracked_changes'
): Promise<EditResult> {
  const processor = new DocumentProcessor();
  const structureRules = new StructureRules();

  const docType = documentType as 'full_paper' | 'section' | 'paragraph' | 'abstract';
  const processed = await processor.processDocument(text, docType);

  if (documentType === 'full_paper') {
    processed.sections = structureRules.insertOverviewSection(processed.sections);

    processed.sections.forEach(section => {
      if (section.title.toLowerCase().includes('introduction')) {
        const result = structureRules.validateIntroduction(section.edited || section.content);
        section.edited = result.fixedText;
        if (result.changes) {
          section.changes = [...(section.changes || []), ...result.changes];
        }
      }

      if (section.title.toLowerCase().includes('abstract')) {
        const result = structureRules.validateAbstract(section.edited || section.content);
        section.edited = result.fixedText;
        if (result.changes) {
          section.changes = [...(section.changes || []), ...result.changes];
        }
      }
    });
  }

  const fullEdited = processed.sections
    .map(s => {
      if (s.title !== 'Content' && s.title !== 'Document') {
        return `# ${s.title}\n\n${s.edited || s.content}`;
      }
      return s.edited || s.content;
    })
    .join('\n\n');

  const allChanges = processed.changes || [];
  const trackingDoc = await generateTrackingMarkdown(text, fullEdited, allChanges);

  let trackingPath: string | undefined;
  if (outputFormat !== 'clean') {
    try {
      trackingPath = await saveTrackingDocument(trackingDoc);
    } catch (error) {
      console.error('Failed to save tracking document:', error);
    }
  }

  const result: EditResult = {
    edited: fullEdited,
    metrics: {
      clarityScore: processed.metrics.clarity,
      changes: allChanges.length,
      wordReduction: processed.metrics.wordReduction,
      readabilityImprovement: processed.metrics.readabilityGain
    },
    suggestions: processed.suggestions
  };

  if (outputFormat === 'tracked_changes' || outputFormat === 'both') {
    result.tracking = trackingDoc;
  }

  return result;
}