/**
 * Speech Text Preparation Utility
 * Converts markdown and rich chat messages into natural, fluent spoken text.
 * The original displayed message remains 100% intact.
 */

export function prepareTextForSpeech(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;

  // 1. Replace fenced code blocks with spoken summary
  text = text.replace(/```(?:[a-zA-Z0-9_\-]+)?\s*([\s\S]*?)```/g, (match, codeContent) => {
    const lines = codeContent.trim().split('\n').filter(Boolean);
    if (lines.length <= 2) {
      return ` Here is the code snippet: ${codeContent.trim()}. `;
    }
    return ' Code block provided in the conversation. ';
  });

  // 2. Inline code snippets: strip backticks
  text = text.replace(/`([^`]+)`/g, '$1');

  // 3. URLs: avoid spelling out http colon slash slash
  text = text.replace(/https?:\/\/[^\s)]+/g, 'link provided');

  // 4. Markdown links [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 5. Markdown headings: convert '# Heading' to 'Heading.'
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '$1.');

  // 6. Markdown bullet points and numbered lists
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');

  // 7. Markdown blockquotes
  text = text.replace(/^>\s+/gm, '');

  // 8. Markdown tables: convert lines with '|' to comma-separated spoken text
  text = text.replace(/\|([^\n]+)\|/g, (match, rowContent) => {
    // Skip separator rows like |---|---|
    if (/^[\s\-:|]+$/.test(rowContent)) return '';
    const cells = rowContent.split('|').map(c => c.trim()).filter(Boolean);
    return cells.join(', ') + '. ';
  });

  // 9. Remove emphasis formatting (*, **, _, __, ~~)
  text = text.replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, '$1');

  // 10. Clean up multiple whitespaces, extra periods, and excessive newlines
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\.{2,}/g, '.')
    .replace(/([.?!])\s*([.?!])/g, '$1')
    .trim();

  return text;
}

/**
 * Splits long text into natural sentence or paragraph chunks
 * Prevents mobile speech synthesis engines from crashing or truncating large utterances.
 *
 * @param {string} text - Cleaned speech text
 * @param {number} maxChunkLength - Target character limit per chunk (default ~220)
 * @returns {string[]} Ordered array of playable sentences/chunks
 */
export function splitIntoSpeechChunks(text, maxChunkLength = 220) {
  if (!text) return [];
  if (text.length <= maxChunkLength) return [text];

  // Regex to split on sentence boundaries (. ! ?)
  const sentenceRegex = /([^.!?]+[.!?]+|\S[^.!?]*$)/g;
  const rawSentences = text.match(sentenceRegex) || [text];

  const chunks = [];
  let currentChunk = '';

  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if ((currentChunk + ' ' + trimmed).trim().length <= maxChunkLength) {
      currentChunk = (currentChunk + ' ' + trimmed).trim();
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      // If a single sentence is exceptionally long, chunk it by comma or spaces
      if (trimmed.length > maxChunkLength) {
        const subParts = trimmed.split(/,\s+/);
        let subChunk = '';
        for (const part of subParts) {
          if ((subChunk + ', ' + part).trim().length <= maxChunkLength) {
            subChunk = (subChunk ? subChunk + ', ' : '') + part;
          } else {
            if (subChunk) chunks.push(subChunk);
            subChunk = part;
          }
        }
        if (subChunk) currentChunk = subChunk;
      } else {
        currentChunk = trimmed;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.length > 0 ? chunks : [text];
}
