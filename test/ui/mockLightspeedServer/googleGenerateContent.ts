import { logger } from "./server";

/**
 * Mock Google Gemini generateContent endpoint
 * Returns realistic mock responses based on the request content
 * This mimics the Google Gemini API response format
 */
export function googleGenerateContent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res: any,
) {
  const model = req.params.model || "gemini-2.5-flash";
  const body = req.body || {};
  const contents = body.contents || "";
  const config = body.config || {};
  const systemInstruction = config.systemInstruction || "";

  logger.info(`[Google Mock] Model: ${model}`);
  logger.info(
    `[Google Mock] Contents: ${
      typeof contents === "string"
        ? contents.substring(0, 200)
        : JSON.stringify(contents).substring(0, 200)
    }`,
  );
  logger.info(
    `[Google Mock] System instruction: ${systemInstruction.substring(0, 200)}`,
  );

  // Determine response based on system instruction or content
  let mockResponse = "";

  // Playbook generation
  if (
    systemInstruction.includes("playbook") ||
    systemInstruction.includes("PLAYBOOK") ||
    (typeof contents === "string" &&
      (contents.includes("playbook") || contents.includes("PLAYBOOK")))
  ) {
    if (
      typeof contents === "string" &&
      (contents.includes("outline") || contents.includes("OUTLINE"))
    ) {
      // Outline generation request
      mockResponse = `1. Install nginx package
2. Configure nginx service
3. Start and enable nginx service
4. Verify nginx is running`;
    } else {
      // Full playbook generation
      mockResponse = `---
- name: Install and configure nginx
  hosts: all
  become: yes
  tasks:
    - name: Install nginx package
      package:
        name: nginx
        state: present

    - name: Start and enable nginx service
      systemd:
        name: nginx
        state: started
        enabled: yes

    - name: Verify nginx is running
      uri:
        url: http://localhost
        status_code: 200
      register: nginx_status`;
    }
  }
  // Role generation
  else if (
    systemInstruction.includes("role") ||
    systemInstruction.includes("ROLE") ||
    (typeof contents === "string" &&
      (contents.includes("role") || contents.includes("ROLE")))
  ) {
    if (
      typeof contents === "string" &&
      (contents.includes("outline") || contents.includes("OUTLINE"))
    ) {
      mockResponse = `1. Install required packages
2. Configure application
3. Start service`;
    } else {
      mockResponse = `---
- name: Install package
  package:
    name: "{{ item }}"
    state: present
  loop:
    - package1
    - package2

- name: Configure application
  template:
    src: config.j2
    dest: /etc/app/config.conf

- name: Start service
  systemd:
    name: app
    state: started
    enabled: yes`;
    }
  }
  // Chat/Explanation
  else if (
    systemInstruction.includes("explanation") ||
    systemInstruction.includes("EXPLANATION") ||
    (typeof contents === "string" &&
      (contents.includes("explain") || contents.includes("EXPLAIN")))
  ) {
    mockResponse = `# Playbook Overview

This playbook performs the following tasks:

1. **Installation**: Installs the required packages
2. **Configuration**: Sets up the application configuration
3. **Service Management**: Starts and enables the service

## Key Components

- Uses Ansible modules for idempotent operations
- Handles errors gracefully
- Follows best practices for configuration management`;
  }
  // Inline completion
  else {
    mockResponse = `name: example_task
  command: /usr/bin/example
  args:
    creates: /path/to/file`;
  }

  // Google Gemini API response format
  const response = {
    candidates: [
      {
        content: {
          parts: [
            {
              text: mockResponse,
            },
          ],
          role: "model",
        },
        finishReason: "STOP",
        index: 0,
        safetyRatings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            probability: "NEGLIGIBLE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            probability: "NEGLIGIBLE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            probability: "NEGLIGIBLE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            probability: "NEGLIGIBLE",
          },
        ],
      },
    ],
    model: model,
    usageMetadata: {
      promptTokenCount: 100,
      candidatesTokenCount: 50,
      totalTokenCount: 150,
    },
  };

  logger.info(`[Google Mock] Returning response (${mockResponse.length} chars)`);

  return res.status(200).json(response);
}


