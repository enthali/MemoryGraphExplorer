/**
 * Graph renderer options
 */

import type { GraphNode, GraphLink } from './d3-graph.js';

export interface RendererOptions {
  width: number;
  height: number;
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode, event: MouseEvent) => void;
  onNodeLeave?: (node: GraphNode) => void;
  onEdgeHover?: (edge: GraphLink, event: MouseEvent) => void;
  onEdgeLeave?: (edge: GraphLink) => void;
  onZoomChange?: (data: { scale: number; x: number; y: number }) => void;
  entityTypeColorMap?: Map<string, string>;
}
