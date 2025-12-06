// Handle JSON string parsing and filter out invalid tags with double-encoding support

export const parseAndCleanTags = (tags: string[] | string | undefined): string[] => {
  if (!tags) return [];
  
  let parsedTags = tags;
  
  // Handle JSON string format (may be double-encoded)
  if (typeof tags === 'string') {
    try {
      parsedTags = JSON.parse(tags);
      
      // If we still have a string after first parse, try parsing again (double-encoded case)
      if (typeof parsedTags === 'string') {
        parsedTags = JSON.parse(parsedTags);
      }
    } catch {
      // If JSON parsing fails, try to split by common separators
      if (tags.includes(',')) {
        parsedTags = tags.split(',').map(t => t.trim());
      } else {
        return [];
      }
    }
  }
  
  // Ensure we have an array
  if (!Array.isArray(parsedTags)) return [];
  
  // Clean each tag - handle cases where individual tags might be JSON-encoded strings
  return parsedTags
    .map(tag => {
      if (!tag) return null;
      
      let cleanTag = String(tag);
      
      // Remove various JSON encoding artifacts
      cleanTag = cleanTag
        // Remove array brackets from start/end
        .replace(/^\["|"\]$/g, '')
        // Remove quotes from start/end (both regular and smart quotes)
        .replace(/^["""]|["""]$/g, '')
        // Remove escaped quotes
        .replace(/\\"/g, '"')
        // Remove any remaining brackets
        .replace(/[\[\]]/g, '')
        // Remove any remaining quotes at start/end
        .replace(/^["'`]|["'`]$/g, '')
        .trim();
      
      return cleanTag || null;
    })
    .filter((tag): tag is string => 
      tag !== null &&
      tag !== "" && 
      tag !== "[]" && 
      tag !== "undefined" &&
      tag !== "null" &&
      tag !== '""'
    );
};

// Prevent duplicate tags while maintaining order

export const addUniqueTag = (existingTags: string[], newTag: string): string[] => {
  const trimmedTag = newTag.trim();
  if (!trimmedTag || existingTags.includes(trimmedTag)) {
    return existingTags;
  }
  return [...existingTags, trimmedTag];
};

//Safely remove tags without mutating original array

export const removeTagAtIndex = (tags: string[], index: number): string[] => {
  if (index < 0 || index >= tags.length) return tags;
  return tags.filter((_, i) => i !== index);
};

//Ensure only valid, non-empty tags are submitted
 
export const getValidTagsForSubmission = (tags: string[]): string[] => {
  return tags.filter(tag => tag && tag.trim() !== "");
};