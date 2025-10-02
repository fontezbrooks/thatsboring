# Writing Editor MCP Server

A comprehensive MCP (Model Context Protocol) server for academic and technical writing that automatically enforces writing rules and best practices.

## Features

### Automatic Writing Improvements
- **Passive Voice Conversion**: Automatically converts passive constructions to active voice
- **Sentence Simplification**: Splits long sentences (>25 words) for better readability
- **Vocabulary Simplification**: Replaces complex words with simpler alternatives
- **Tense Correction**: Converts future tense to present tense for academic writing
- **Jargon Removal**: Eliminates academic jargon and redundant phrases
- **Parenthetical Integration**: Converts parenthetical content to regular text

### Document Structure Validation
- **Introduction Validation**: Ensures problem statement in first paragraph, contributions section
- **Abstract Optimization**: Maintains 100-250 word count, ensures self-contained content
- **Section Organization**: Automatically inserts overview sections where needed
- **Structure Analysis**: Validates presence of expected sections

### Comprehensive Tracking
- **Change Tracking**: Detailed markdown document showing all edits
- **Before/After Comparison**: Side-by-side comparison of original and edited text
- **Metrics Calculation**: Word reduction, readability improvement scores
- **Rule Application Summary**: Statistics on which rules were applied

## Installation

```bash
# Clone the repository
git clone [repository-url]
cd writing-editor-mcp

# Install dependencies
npm install

# Build the TypeScript code
npm run build
```

## Usage

### As an MCP Server

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "writing-editor": {
      "command": "node",
      "args": ["path/to/writing-editor-mcp/dist/server.js"]
    }
  }
}
```

### Available Tools

#### 1. edit_document
Edit a document with automatic rule enforcement:

```typescript
{
  "text": "The system was designed by our team...",
  "documentType": "section",  // or "full_paper", "paragraph", "abstract"
  "outputFormat": "tracked_changes"  // or "clean", "both"
}
```

#### 2. analyze_structure
Validate document structure:

```typescript
{
  "text": "# Introduction\n...",
  "expectedSections": ["Abstract", "Introduction", "Conclusion"]  // optional
}
```

#### 3. check_clarity_metrics
Analyze clarity and readability:

```typescript
{
  "text": "Your text here..."
}
```

#### 4. optimize_section
Optimize specific section types:

```typescript
{
  "text": "Section content...",
  "sectionType": "introduction"  // or "abstract", "conclusion", etc.
}
```

## Writing Rules Enforced

### Clarity Rules
- Convert passive voice to active voice
- Split sentences longer than 25 words
- Separate multiple ideas in single sentences
- Simplify elaborate vocabulary

### Style Rules
- Remove forbidden academic jargon
- Convert future tense to present tense
- Integrate parenthetical content
- Eliminate redundant phrases
- Enforce active writing style

### Structure Rules
- Ensure problem statement in introduction
- Validate abstract independence and length
- Add overview sections for navigation
- Check for required document sections

## Example Output

### Input Text
```
The system was designed by our team. It should be noted that the results will be evaluated.
```

### Edited Output
```
Our team designed the system. The results are evaluated.
```

### Tracking Document
```markdown
# Writing Edits Tracking Document

## Summary
- Total changes: 3
- Words reduced: 4
- Readability improvement: 12%

## Detailed Changes

### Change 1
**Rule Applied:** Passive Voice
**Before:** The system was designed by our team
**After:** Our team designed the system

### Change 2
**Rule Applied:** Forbidden Vocabulary
**Before:** It should be noted that
**After:** [removed]

### Change 3
**Rule Applied:** Tense Correction
**Before:** will be evaluated
**After:** are evaluated
```

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Clean build artifacts
npm run clean
```

## Architecture

```
src/
├── server.ts           # MCP server setup and request handling
├── tools/             # Tool implementations
│   ├── editDocument.ts     # Main editing tool
│   ├── analyzeStructure.ts # Structure validation
│   ├── checkClarity.ts     # Clarity metrics
│   └── generateTracking.ts # Change tracking
├── rules/             # Rule engines
│   ├── clarity.rules.ts    # Clarity improvements
│   ├── style.rules.ts      # Style enforcement
│   └── structure.rules.ts  # Structure validation
├── processors/        # Document processing
│   └── documentParser.ts   # Parse and process documents
└── types.ts          # TypeScript type definitions
```

## License

MIT