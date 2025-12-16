/**
 * Global type declarations
 */

import type * as D3 from 'd3';

declare global {
  interface Window {
    d3: typeof D3;
    memoryGraphExplorer?: any;
    MGE?: any;
  }
}

// Ensure this file is treated as a module
export {};
