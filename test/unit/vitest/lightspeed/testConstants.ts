/**
 * Test constants and mock data for playbook and role generation tests
 */

// Common test prompts
export const TEST_PROMPTS = {
  INSTALL_NGINX: "Create a playbook to install nginx on Ubuntu servers",
  INSTALL_NGINX_SIMPLE: "Create a playbook to install nginx",
  SETUP_WEB_SERVER: "Create a playbook to set up a web server",
} as const;

// Common test outlines
export const TEST_OUTLINES = {
  NGINX_INSTALL: "1. Update apt cache\n2. Install nginx\n3. Start and enable nginx service",
  WEB_SERVER_SETUP: "1. Install Apache\n2. Configure firewall\n3. Start Apache service",
  EMPTY: "",
} as const;

// Common generation IDs for testing
export const TEST_GENERATION_IDS = {
  NGINX_123: "test-generation-id-123",
  NGINX_456: "test-generation-id-456",
  WEB_SERVER_789: "test-generation-id-789",
} as const;

// Mock playbook content templates
export const MOCK_PLAYBOOK_CONTENT = {
  NGINX_INSTALL: `---
- name: Install nginx on Ubuntu servers
  hosts: all
  become: yes
  tasks:
    - name: Update apt cache
      ansible.builtin.apt:
        update_cache: yes

    - name: Install nginx
      ansible.builtin.apt:
        name: nginx
        state: present

    - name: Start and enable nginx service
      ansible.builtin.systemd:
        name: nginx
        state: started
        enabled: yes
`,

  WEB_SERVER_SETUP: `---
- name: Set up web server
  hosts: all
  become: yes
  tasks:
    - name: Install Apache
      ansible.builtin.apt:
        name: apache2
        state: present

    - name: Configure firewall
      ansible.builtin.ufw:
        rule: allow
        port: "80"
        proto: tcp

    - name: Start Apache service
      ansible.builtin.systemd:
        name: apache2
        state: started
        enabled: yes
`,
} as const;

// Common error messages
export const ERROR_MESSAGES = {
  INVALID_API_KEY: "API key is invalid or expired",
  GENERATION_FAILED: "Playbook generation failed",
  PROVIDER_ERROR: "Provider not initialized",
} as const;

// Model names
export const MODEL_NAMES = {
  GEMINI_PRO: "gemini-1.5-pro",
  GEMINI_FLASH: "gemini-1.5-flash",
} as const;

// Provider types (only WCA and Google are supported in factory)
export const PROVIDER_TYPES = {
  GOOGLE: "google",
  WCA: "wca",
} as const;

// API endpoints
export const API_ENDPOINTS = {
  GOOGLE: "https://generativelanguage.googleapis.com/v1beta",
  WCA_DEFAULT: "https://c.ai.ansible.redhat.com",
} as const;

// Default models
export const DEFAULT_MODELS = {
  GOOGLE: "gemini-2.5-flash",
} as const;

// Test API keys
export const TEST_API_KEYS = {
  GOOGLE: "AIzaSyTest-google-key-12345",
} as const;

// Test configuration objects
export const TEST_CONFIGS = {
  GOOGLE_MINIMAL: {
    apiKey: TEST_API_KEYS.GOOGLE,
    suggestions: { enabled: true, waitWindow: 0 },
  },
  GOOGLE_FULL: {
    apiKey: TEST_API_KEYS.GOOGLE,
    modelName: MODEL_NAMES.GEMINI_PRO,
    timeout: 45000,
    suggestions: { enabled: true, waitWindow: 0 },
  },
  WCA: {
    apiEndpoint: API_ENDPOINTS.WCA_DEFAULT,
    suggestions: { enabled: true, waitWindow: 0 },
  },
} as const;

