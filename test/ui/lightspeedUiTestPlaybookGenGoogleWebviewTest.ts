// BEFORE: ansible.lightspeed.enabled: true
// Configure Google provider: ansible.lightspeed.provider: "google"
// For UI tests: Use GOOGLE_MOCK_MODE=true to use mocked API server (no real API key needed)
// Or set GOOGLE_API_KEY for real API testing
//
// The mock server intercepts HTTP requests to Google's API and returns mock responses

import { expect, config } from "chai";
import { By, Key, Workbench } from "vscode-extension-tester";
import {
  getWebviewByLocator,
  workbenchExecuteCommand,
  waitForCondition,
  updateSettings,
  openSettings,
} from "./uiTestHelper";
import {
  interceptGoogleAPIRequests,
  restoreGoogleAPIRequests,
} from "./googleApiInterceptor";

config.truncateThreshold = 0;

describe("playbook generation with Google provider", function () {
  let workbench: Workbench;
  const useMockMode = process.env.GOOGLE_MOCK_MODE === "true";

  before(async function () {
    // Skip if neither mock mode nor API key is set
    if (!useMockMode && !process.env.GOOGLE_API_KEY) {
      this.skip();
    }

    // If using mock mode, set up HTTP interception to redirect Google API to mock server
    // The mock server should already be running (started by test launcher if MOCK_LIGHTSPEED_API=1)
    if (useMockMode) {
      const mockServerUrl =
        process.env.TEST_LIGHTSPEED_URL || "http://localhost:3000";
      interceptGoogleAPIRequests(mockServerUrl);
      console.log(
        `[Google UI Test] Using mock mode - requests will be redirected to ${mockServerUrl}`,
      );
    }

    workbench = new Workbench();
    const settingsEditor = await openSettings();

    // Configure Google provider
    await updateSettings(
      settingsEditor,
      "ansible.lightspeed.enabled",
      true,
    );
    await updateSettings(
      settingsEditor,
      "ansible.lightspeed.provider",
      "google",
    );

    // Use mock API key in test mode, or real key if provided
    const apiKey = useMockMode
      ? "test-mock-api-key"
      : process.env.GOOGLE_API_KEY;
    await updateSettings(
      settingsEditor,
      "ansible.lightspeed.apiKey",
      apiKey,
    );

    // Wait a bit for settings to take effect and extension to reload
    await new Promise((resolve) => setTimeout(resolve, 3000));
  });

  after(function () {
    // Clean up
    if (useMockMode) {
      restoreGoogleAPIRequests();
    }
  });

  beforeEach(function () {
    if (!useMockMode && !process.env.GOOGLE_API_KEY) {
      this.skip();
    }
  });

  it("Playbook generation webview works with Google provider - basic flow", async function () {
    // Shorter timeout in mock mode, longer for real API
    this.timeout(useMockMode ? 30000 : 120000);

    await workbenchExecuteCommand("Ansible Lightspeed: Playbook generation");

    // Start operations on Playbook Generation UI
    const webView = await getWebviewByLocator(
      By.xpath("//*[text()='Create a playbook with Ansible Lightspeed']"),
    );

    // Enter prompt
    const promptTextField = await webView.findWebElement(
      By.xpath('//*[@id="PromptTextField"]/input'),
    );
    await promptTextField.sendKeys("Install nginx web server");
    await promptTextField.sendKeys(Key.ESCAPE);
    await promptTextField.click();

    // Click Analyze button
    const analyzeButton = await webView.findWebElement(
      By.xpath("//vscode-button[contains(text(), 'Analyze')]"),
    );
    await analyzeButton.click();

    // Wait for outline to be generated (Google provider generates outline)
    const outlineField = await waitForCondition({
      condition: async () => {
        try {
          const field = await webView.findWebElement(
            By.xpath("//textarea[@id='outline-field']"),
          );
          const text = await field.getText();
          // Check if outline has content (not empty)
          return text && text.trim().length > 0;
        } catch {
          return false;
        }
      },
      message: "Timed out waiting for playbook outline from Google provider",
      timeout: useMockMode ? 5000 : 60000, // Faster in mock mode
    });

    expect(
      outlineField,
      "Outline field should exist and have content",
    ).not.to.be.undefined;
    const outlineText = await outlineField.getText();
    expect(
      outlineText.length > 0,
      "Outline should contain generated content",
    ).to.be.true;

    // Verify the prompt is displayed
    const prompt = await webView.findWebElement(
      By.xpath("//span[@id='prompt']"),
    );
    const promptText = await prompt.getText();
    expect(promptText.includes("Install nginx web server")).to.be.true;

    // Click Continue to generate playbook
    const continueButton = await waitForCondition({
      condition: async () => {
        try {
          return await webView.findWebElement(
            By.xpath("//vscode-button[contains(text(), 'Continue')]"),
          );
        } catch {
          return false;
        }
      },
      message: "Timed out waiting for Continue button",
      timeout: 5000,
    });
    await continueButton.click();

    // Wait for playbook to be generated
    const openEditorButton = await waitForCondition({
      condition: async () => {
        try {
          const button = await webView.findWebElement(
            By.xpath("//vscode-button[contains(text(), 'Open editor')]"),
          );
          return button;
        } catch {
          return false;
        }
      },
      message:
        "Timed out waiting for Open editor button (playbook generation)",
      timeout: useMockMode ? 5000 : 60000, // Faster in mock mode
    });

    expect(
      openEditorButton,
      "Open editor button should appear after playbook generation",
    ).not.to.be.undefined;

    // Verify generated playbook content is displayed
    const generatedContent = await waitForCondition({
      condition: async () => {
        try {
          // Look for the generated file entry or code block
          const content = await webView.findWebElement(
            By.xpath(
              "//pre[contains(@class, 'code')] | //code | //div[contains(@class, 'generated-file')]",
            ),
          );
          const text = await content.getText();
          return text && text.length > 0;
        } catch {
          return false;
        }
      },
      message: "Timed out waiting for generated playbook content",
      timeout: 10000,
    });

    expect(
      generatedContent,
      "Generated playbook content should be visible",
    ).not.to.be.undefined;
  });

  it("Playbook generation with custom outline using Google provider", async function () {
    // Shorter timeout in mock mode, longer for real API
    this.timeout(useMockMode ? 30000 : 120000);

    if (!useMockMode && !process.env.GOOGLE_API_KEY) {
      this.skip();
    }

    await workbenchExecuteCommand("Ansible Lightspeed: Playbook generation");

    const webView = await getWebviewByLocator(
      By.xpath("//*[text()='Create a playbook with Ansible Lightspeed']"),
    );

    // Enter prompt
    const promptTextField = await webView.findWebElement(
      By.xpath('//*[@id="PromptTextField"]/input'),
    );
    await promptTextField.sendKeys("Configure a database server");
    await promptTextField.sendKeys(Key.ESCAPE);
    await promptTextField.click();

    // Click Analyze
    const analyzeButton = await webView.findWebElement(
      By.xpath("//vscode-button[contains(text(), 'Analyze')]"),
    );
    await analyzeButton.click();

    // Wait for outline and edit it
    const outlineField = await waitForCondition({
      condition: async () => {
        try {
          const field = await webView.findWebElement(
            By.xpath("//textarea[@id='outline-field']"),
          );
          const text = await field.getText();
          return text && text.trim().length > 0;
        } catch {
          return false;
        }
      },
      message: "Timed out waiting for outline",
      timeout: useMockMode ? 5000 : 60000,
    });

    // Edit the outline
    await outlineField.sendKeys(Key.CONTROL + "a");
    await outlineField.sendKeys(
      "1. Install PostgreSQL\n2. Configure database\n3. Start service",
    );
    await outlineField.sendKeys(Key.ESCAPE);

    // Click Continue with custom outline
    const continueButton = await waitForCondition({
      condition: async () => {
        try {
          return await webView.findWebElement(
            By.xpath("//vscode-button[contains(text(), 'Continue')]"),
          );
        } catch {
          return false;
        }
      },
      message: "Timed out waiting for Continue button",
      timeout: 5000,
    });
    await continueButton.click();

    // Wait for playbook generation with custom outline
    const openEditorButton = await waitForCondition({
      condition: async () => {
        try {
          return await webView.findWebElement(
            By.xpath("//vscode-button[contains(text(), 'Open editor')]"),
          );
        } catch {
          return false;
        }
      },
      message:
        "Timed out waiting for playbook generation with custom outline",
      timeout: useMockMode ? 5000 : 60000,
    });

    expect(
      openEditorButton,
      "Playbook should be generated with custom outline",
    ).not.to.be.undefined;
  });
});
