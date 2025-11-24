import { describe, it, expect, vi, beforeEach } from "vitest";
import * as vscode from "vscode";
import type { PlaybookGenerationResponseParams } from "../../../../../src/interfaces/lightspeed";
import { IError } from "../../../../../src/features/lightspeed/utils/errors";

vi.mock("../../../../../src/extension", () => {
  return {
    lightSpeedManager: {
      apiInstance: {
        playbookGenerationRequest: vi.fn(),
      },
      providerManager: {
        generatePlaybook: vi.fn(),
      },
      settingsManager: {
        settings: {
          lightSpeedService: {
            provider: "google",
          },
        },
      },
    },
  };
});

vi.mock("../../../../../src/features/lightspeed/vue/views/lightspeedUtils", async () => {
  const actual = await vi.importActual(
    "../../../../../src/features/lightspeed/vue/views/lightspeedUtils",
  );
  return {
    ...actual,
    contentMatch: vi.fn(),
    updatePromptHistory: vi.fn(),
  };
});

// Import after mocks
import { WebviewMessageHandlers } from "../../../../../src/features/lightspeed/vue/views/webviewMessageHandlers";
import * as lightspeedUtils from "../../../../../src/features/lightspeed/vue/views/lightspeedUtils";
import { contentMatch, updatePromptHistory } from "../../../../../src/features/lightspeed/vue/views/lightspeedUtils";
import { lightSpeedManager } from "../../../../../src/extension";

describe("Playbook Generation", () => {
  let messageHandlers: WebviewMessageHandlers;
  let mockWebview: vscode.Webview;
  let mockContext: vscode.ExtensionContext;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset provider to default
    lightSpeedManager.settingsManager.settings.lightSpeedService.provider = "google";

    // Reset mocks to default implementations
    (lightSpeedManager.providerManager!.generatePlaybook as ReturnType<typeof vi.fn>).mockReset();
    (lightSpeedManager.apiInstance.playbookGenerationRequest as ReturnType<typeof vi.fn>).mockReset();

    // Setup mock webview
    mockWebview = {
      postMessage: vi.fn(),
    } as unknown as vscode.Webview;

    // Setup mock context
    mockContext = {
      globalState: {
        get: vi.fn(),
        update: vi.fn(),
      },
    } as unknown as vscode.ExtensionContext;

    messageHandlers = new WebviewMessageHandlers();
  });

  describe("handleGeneratePlaybook", () => {
    it("should successfully generate playbook with LLM provider and post message to webview", async () => {
      const mockPlaybookResponse: PlaybookGenerationResponseParams = {
        playbook: "---\n- name: Test playbook\n  hosts: all\n  tasks:\n    - name: Test task\n      debug:\n        msg: Hello",
        outline: "1. Test task",
        generationId: "test-generation-id",
      };

      // Mock generatePlaybook to return success
      const generatePlaybookSpy = vi.spyOn(lightspeedUtils, "generatePlaybook").mockResolvedValue(mockPlaybookResponse);

      const message = {
        type: "generatePlaybook",
        data: {
          text: "Create a playbook to install nginx",
          outline: "",
        },
      };

      await messageHandlers["handleGeneratePlaybook"](
        message,
        mockWebview,
        mockContext,
      );

      // Verify generatePlaybook was called with correct parameters
      expect(generatePlaybookSpy).toHaveBeenCalledWith(
        lightSpeedManager.apiInstance,
        "Create a playbook to install nginx",
        "",
        expect.any(String), // generationId (UUID)
      );

      // Verify webview.postMessage was called with the response
      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: "generatePlaybook",
        data: mockPlaybookResponse,
      });

      // Verify contentMatch was called
      expect(vi.mocked(contentMatch)).toHaveBeenCalledWith(
        expect.any(String), // generationId
        mockPlaybookResponse.playbook,
      );

      // Verify updatePromptHistory was called
      expect(vi.mocked(updatePromptHistory)).toHaveBeenCalledWith(
        mockContext,
        "Create a playbook to install nginx",
      );
    });

    it("should handle error response and send error message to webview", async () => {
      const mockError: IError = {
        message: "Failed to generate playbook: API error",
        code: "GENERATION_ERROR",
      };

      // Mock generatePlaybook to return error
      vi.spyOn(lightspeedUtils, "generatePlaybook").mockResolvedValue(mockError);

      const message = {
        type: "generatePlaybook",
        data: {
          text: "Create a playbook",
          outline: "",
        },
      };

      await messageHandlers["handleGeneratePlaybook"](
        message,
        mockWebview,
        mockContext,
      );

      // Verify sendErrorMessage was called (via postMessage with errorMessage type)
      // The actual implementation sends error via sendErrorMessage which posts a message
      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: "errorMessage",
        data: "Failed to get an answer from the server: Failed to generate playbook: API error",
      });

      // Verify contentMatch and updatePromptHistory were NOT called on error
      expect(vi.mocked(contentMatch)).not.toHaveBeenCalled();
      expect(vi.mocked(updatePromptHistory)).not.toHaveBeenCalled();
    });
  });

  describe("generatePlaybook integration", () => {
    it("should handle playbook generation with outline", async () => {
      const mockPlaybookResponse: PlaybookGenerationResponseParams = {
        playbook: "---\n- name: Test playbook with outline\n  hosts: all",
        outline: "1. First task\n2. Second task",
        generationId: "test-outline-id",
      };

      const generatePlaybookSpy = vi.spyOn(lightspeedUtils, "generatePlaybook").mockResolvedValue(mockPlaybookResponse);

      const message = {
        type: "generatePlaybook",
        data: {
          text: "Create a playbook with specific tasks",
          outline: "1. First task\n2. Second task",
        },
      };

      await messageHandlers["handleGeneratePlaybook"](
        message,
        mockWebview,
        mockContext,
      );

      // Verify generatePlaybook was called with outline
      expect(generatePlaybookSpy).toHaveBeenCalledWith(
        lightSpeedManager.apiInstance,
        "Create a playbook with specific tasks",
        "1. First task\n2. Second task",
        expect.any(String),
      );

      // Verify webview received the response
      expect(mockWebview.postMessage).toHaveBeenCalledWith({
        type: "generatePlaybook",
        data: mockPlaybookResponse,
      });
    });

    it("should handle playbook generation without outline", async () => {
      const mockPlaybookResponse: PlaybookGenerationResponseParams = {
        playbook: "---\n- name: Test playbook\n  hosts: all",
        outline: "1. Auto-generated task",
        generationId: "test-no-outline-id",
      };

      const generatePlaybookSpy = vi.spyOn(lightspeedUtils, "generatePlaybook").mockResolvedValue(mockPlaybookResponse);

      const message = {
        type: "generatePlaybook",
        data: {
          text: "Create a simple playbook",
          outline: "",
        },
      };

      await messageHandlers["handleGeneratePlaybook"](
        message,
        mockWebview,
        mockContext,
      );

      // Verify generatePlaybook was called with empty outline
      expect(generatePlaybookSpy).toHaveBeenCalledWith(
        lightSpeedManager.apiInstance,
        "Create a simple playbook",
        "",
        expect.any(String),
      );

      // Verify contentMatch was called with the generated playbook
      expect(vi.mocked(contentMatch)).toHaveBeenCalledWith(
        expect.any(String),
        mockPlaybookResponse.playbook,
      );
    });
  });
});
