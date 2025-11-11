import { tool, ToolSet } from 'ai';
import { z } from 'zod';

// SCENARIO 1: Simple tool requiring approval (no auto-loop)
const getWeatherInformation = tool({
  description: 'show the weather in a given city to the user',
  inputSchema: z.object({ city: z.string() }),
  outputSchema: z.string(),
  // no execute function, we want human in the loop
});

// SCENARIO 2: Auto-executing tools that loop without approval
const searchDatabase = tool({
  description: 'search a database for specific information. Returns search results that may need further processing.',
  inputSchema: z.object({ 
    query: z.string(),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      id: z.string(),
      title: z.string(),
      relevance: z.number(),
    })),
    needsAnalysis: z.boolean(),
  }),
  execute: async ({ query }) => {
    console.log(`=============Searching database for: ${query}=============`);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockResults = [
      { id: '1', title: `Result for ${query} - Item 1`, relevance: 0.95 },
      { id: '2', title: `Result for ${query} - Item 2`, relevance: 0.87 },
      { id: '3', title: `Result for ${query} - Item 3`, relevance: 0.73 },
    ];
    
    return {
      results: mockResults,
      needsAnalysis: true, // Signals AI to continue with analysis
    };
  },
});

const analyzeData = tool({
  description: 'analyze data and extract insights. Should be called after searchDatabase.',
  inputSchema: z.object({
    dataId: z.string(),
  }),
  outputSchema: z.object({
    insights: z.array(z.string()),
    confidence: z.number(),
    complete: z.boolean(),
  }),
  execute: async ({ dataId }) => {
    console.log(`=============Analyzing data: ${dataId}=============`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const insights = [
      `Analysis of item ${dataId} shows positive trends`,
      'High quality data detected',
      'Confidence level is strong',
    ];
    
    return {
      insights,
      confidence: 0.92,
      complete: true, // Signals workflow is done
    };
  },
});

// SCENARIO 3: Mixed approval - some tools auto-execute, some need approval
const initiateSecureOperation = tool({
  description: 'start a sensitive operation that requires approval before proceeding',
  inputSchema: z.object({ 
    operationType: z.string(),
    targetResource: z.string(),
  }),
  outputSchema: z.string(),
  // no execute - requires approval
});

const fetchOperationData = tool({
  description: 'fetch data for the approved operation. Auto-executes after approval.',
  inputSchema: z.object({
    operationId: z.string(),
  }),
  outputSchema: z.object({
    data: z.string(),
    requiresValidation: z.boolean(),
  }),
  execute: async ({ operationId }) => {
    console.log(`=============Fetching data for operation: ${operationId}=============`);
    await new Promise(resolve => setTimeout(resolve, 700));
    
    return {
      data: `Retrieved data for operation ${operationId}`,
      requiresValidation: true,
    };
  },
});

const validateOperation = tool({
  description: 'validate the operation before final execution. Requires approval.',
  inputSchema: z.object({
    dataToValidate: z.string(),
  }),
  outputSchema: z.string(),
  // no execute - requires approval
});

const finalizeOperation = tool({
  description: 'complete the operation after validation. Auto-executes.',
  inputSchema: z.object({
    operationId: z.string(),
  }),
  outputSchema: z.object({
    status: z.string(),
    completed: z.boolean(),
  }),
  execute: async ({ operationId }) => {
    console.log(`=============Finalizing operation: ${operationId}=============`);
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      status: `Operation ${operationId} completed successfully`,
      completed: true,
    };
  },
});

export const tools = {
  // Scenario 1
  getWeatherInformation,
  
  // Scenario 2
  searchDatabase,
  analyzeData,
  
  // Scenario 3
  initiateSecureOperation,
  fetchOperationData,
  validateOperation,
  finalizeOperation,
} satisfies ToolSet;