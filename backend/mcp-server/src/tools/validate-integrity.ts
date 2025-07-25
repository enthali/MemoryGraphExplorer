import { KnowledgeGraphManager } from '../KnowledgeGraphManager.js';
import { ValidateIntegrityArgs, ErrorCode, MemoryGraphError } from '../types/index.js';

export async function validateIntegrityHandler(args: ValidateIntegrityArgs, knowledgeGraph: KnowledgeGraphManager) {
  try {
    const result = await knowledgeGraph.validateIntegrity(args.autoFix || false);
    
    let message = `Graph integrity validation completed.\n`;
    message += `Issues found: ${result.issues.length}\n`;
    
    if (result.issues.length > 0) {
      message += `\nIssues:\n`;
      result.issues.forEach((issue, index) => {
        message += `${index + 1}. [${issue.type}] ${issue.description}\n`;
        if (issue.details) {
          message += `   Details: ${JSON.stringify(issue.details)}\n`;
        }
      });
      
      if (args.autoFix && result.fixedIssues.length > 0) {
        message += `\nFixed issues: ${result.fixedIssues.length}\n`;
        result.fixedIssues.forEach((fix, index) => {
          message += `${index + 1}. Fixed: ${fix}\n`;
        });
      } else if (!args.autoFix && result.issues.length > 0) {
        message += `\nTo automatically fix these issues, call this tool with autoFix: true`;
      }
    } else {
      message += `No integrity issues found. Graph is healthy!`;
    }
    
    return {
      content: [{ 
        type: "text", 
        text: message
      }],
    };
  } catch (error) {
    if (error instanceof MemoryGraphError) {
      return {
        content: [{ 
          type: "text", 
          text: `Error [${error.code}]: ${error.message}` 
        }],
        isError: true,
      };
    }
    
    return {
      content: [{ 
        type: "text", 
        text: `Error validating integrity: ${error instanceof Error ? error.message : String(error)}` 
      }],
      isError: true,
    };
  }
}