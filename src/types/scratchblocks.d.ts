declare module 'scratchblocks' {
  /**
   * Render blocks matching a CSS selector
   * @param selector CSS selector for elements containing scratchblocks code
   * @param options Optional rendering options
   */
  export function renderMatching(selector: string, options?: any): any;
  
  /**
   * Parse a scratch block string
   * @param code Scratch blocks code
   * @param options Optional parsing options
   */
  export function parse(code: string, options?: any): any;
  
  /**
   * Render an already parsed scratch block
   * @param doc Parsed scratch blocks document
   * @param options Optional rendering options
   */
  export function render(doc: any, options?: any): SVGElement;
  
  export default {
    renderMatching,
    parse,
    render
  };
} 