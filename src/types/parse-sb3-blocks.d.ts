declare module 'parse-sb3-blocks' {
  /**
   * Converts a target (sprite or stage) to scratchblocks syntax
   * @param target A target object from the Scratch project JSON
   * @returns An array of scratchblocks strings representing the blocks
   */
  export function toScratchblocks(target: any): string[];
  
  /**
   * Parses a Scratch 3 .sb3 file to extract project metadata
   * @param fileData The binary content of the .sb3 file
   * @returns Promise resolving to the parsed project
   */
  export function parseSb3File(fileData: Buffer): Promise<any>;
} 