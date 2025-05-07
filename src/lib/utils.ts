import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Simple markdown to HTML converter
 * @param markdown The markdown text to convert
 * @returns The HTML representation of the markdown
 */
export function markdownToHtml(markdown: string): string {
  // This is a very basic implementation - in production, use a proper markdown library
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code blocks with multiline support
    .replace(/```([^`]*)```/g, function(match, p1) {
      return '<pre><code>' + p1 + '</code></pre>';
    })
    // Inline code
    .replace(/`([^`]*?)`/g, '<code>$1</code>')
    // Lists
    .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    // Wrap list items in ul/ol
    .replace(/<\/li>\n<li>/g, '</li>\n<li>')
    .replace(/<li>.*?<\/li>/g, function(match) {
      if (match.startsWith('<li>1.')) {
        return '<ol>' + match + '</ol>';
      } else {
        return '<ul>' + match + '</ul>';
      }
    })
    // Paragraphs
    .replace(/^(?!<[oh])(.+)$/gm, '<p>$1</p>')
    // Fix double-wrapped paragraphs
    .replace(/<p><p>(.*?)<\/p><\/p>/g, '<p>$1</p>')
    // Line breaks
    .replace(/\n/g, '<br />');
  
  return html;
}
