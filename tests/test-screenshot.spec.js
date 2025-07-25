// Test script to capture screenshot of Knowledge Graph Viewer
// using MCP Playwright server

import { test, expect } from '@playwright/test';

test('Knowledge Graph Viewer Screenshot', async ({ page }) => {
  // Navigate to the local server
  await page.goto('http://localhost:8000');
  
  // Wait for the application to load
  await page.waitForLoadState('networkidle');
  
  // Wait for D3.js to be loaded and graph to be rendered
  await page.waitForSelector('#graph svg', { timeout: 10000 });
  
  // Wait a bit more for the force simulation to settle
  await page.waitForTimeout(3000);
  
  // Take a screenshot of the full page
  await page.screenshot({ 
    path: 'knowledge-graph-full.png', 
    fullPage: true 
  });
  
  // Take a screenshot of just the graph container
  await page.locator('#graph-container').screenshot({ 
    path: 'knowledge-graph-graph-only.png' 
  });
  
  // Test basic functionality
  await expect(page.locator('h1')).toContainText('Knowledge Graph Explorer');
  await expect(page.locator('#graph svg')).toBeVisible();
  await expect(page.locator('#entity-count')).toContainText('Entities:');
  
  // Test search functionality
  await page.fill('#search', 'Georg');
  await page.waitForTimeout(1000);
  await page.screenshot({ 
    path: 'knowledge-graph-search.png', 
    fullPage: true 
  });
  
  // Test filter functionality
  await page.selectOption('#filter', 'Microsoft Team Member');
  await page.waitForTimeout(1000);
  await page.screenshot({ 
    path: 'knowledge-graph-filtered.png', 
    fullPage: true 
  });
  
  console.log('Screenshots captured successfully!');
});
