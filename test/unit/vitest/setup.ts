import { vi } from "vitest";

// This will be used as a fallback if individual test files don't provide their own mock
vi.mock("vscode", () => ({
  commands: {
    executeCommand: vi.fn(),
  },
  ExtensionContext: vi.fn(),
  window: {
    showErrorMessage: vi.fn(),
    showInformationMessage: vi.fn(),
    createOutputChannel: vi.fn((name: string, options?: { log?: boolean }) => {
      // If log option is true, return LogOutputChannel with logging methods
      if (options?.log) {
        return {
          appendLine: vi.fn(),
          show: vi.fn(),
          dispose: vi.fn(),
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn(),
          trace: vi.fn(),
        };
      }
      // Otherwise return regular OutputChannel
      return {
        appendLine: vi.fn(),
        show: vi.fn(),
        dispose: vi.fn(),
      };
    }),
  },
  workspace: {
    workspaceFolders: [],
    getConfiguration: vi.fn(),
  },
  Uri: {
    file: vi.fn(),
    parse: vi.fn(),
  },
  ViewColumn: {
    One: 1,
    Two: 2,
    Three: 3,
  },
  env: {
    machineId: "test-machine-id",
    sessionId: "test-session-id",
  },
}));

// Mock AnsibleContextProcessor for tests that use base.ts which uses require()
// Path from test/unit/vitest/setup.ts to src/features/lightspeed/ansibleContext.js
// Mock with both .js extension and without to handle both import and require()
vi.mock("../../../src/features/lightspeed/ansibleContext.js", () => {
  const enhancePromptForAnsible = vi.fn((prompt: string, context?: string) => {
    return `enhanced: ${prompt} with context: ${context || "none"}`;
  });
  
  const cleanAnsibleOutput = vi.fn((output: string) => {
    return output.trim().replace(/^```ya?ml\s*/i, "").replace(/```\s*$/, "");
  });

  return {
    AnsibleContextProcessor: {
      enhancePromptForAnsible,
      cleanAnsibleOutput,
    },
  };
});

// // Also mock without extension for require() compatibility
// vi.mock("../../../src/features/lightspeed/ansibleContext", () => {
//   const enhancePromptForAnsible = vi.fn((prompt: string, context?: string) => {
//     return `enhanced: ${prompt} with context: ${context || "none"}`;
//   });
  
//   const cleanAnsibleOutput = vi.fn((output: string) => {
//     return output.trim().replace(/^```ya?ml\s*/i, "").replace(/```\s*$/, "");
//   });

//   return {
//     AnsibleContextProcessor: {
//       enhancePromptForAnsible,
//       cleanAnsibleOutput,
//     },
//   };
// });

