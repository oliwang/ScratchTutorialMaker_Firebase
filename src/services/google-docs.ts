/**
 * Exports content to a Google Docs document.
 */
export interface GoogleDoc {
  /**
   * The ID of the created Google Doc.
   */
  documentId: string;
}

/**
 * Asynchronously exports content to Google Docs.
 * THIS IS A MOCK IMPLEMENTATION.
 *
 * @param content The content to export to Google Docs.
 * @returns A promise that resolves to a GoogleDoc object containing document ID.
 */
export async function exportToGoogleDocs(content: string): Promise<GoogleDoc> {
  console.log('Attempting to export content to Google Docs (Mock):');
  console.log('--- Start Content ---');
  // Log only the first 500 chars to avoid flooding console
  console.log(content.substring(0, 500) + (content.length > 500 ? '...' : ''));
  console.log('--- End Content ---');

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate a potential error (uncomment to test error handling)
  // if (Math.random() < 0.2) { // 20% chance of error
  //   console.error("Mock Google Docs API Error: Failed to create document.");
  //   throw new Error("Mock Error: Could not connect to Google Docs API.");
  // }

  // Simulate a successful response
  const mockDocumentId = `mock-doc-${Date.now()}`;
  console.log(`Mock Google Docs API Success: Created document with ID: ${mockDocumentId}`);

  return {
    documentId: mockDocumentId,
  };
}
