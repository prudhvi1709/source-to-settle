// Prompt Loader Utility
// Loads and interpolates prompts from external markdown files

const promptCache = {};

/**
 * Load a prompt template from the prompts directory
 * @param {string} name - Name of the prompt file (without .md extension)
 * @returns {Promise<string>} The prompt template
 */
export async function loadPrompt(name) {
  if (promptCache[name]) {
    return promptCache[name];
  }

  try {
    const response = await fetch(`prompts/${name}.md`);
    if (!response.ok) {
      throw new Error(`Failed to load prompt: ${name} (${response.status})`);
    }
    const template = await response.text();
    promptCache[name] = template;
    return template;
  } catch (error) {
    console.error(`Error loading prompt: ${name}`, error);
    throw error;
  }
}

/**
 * Interpolate variables into a prompt template
 * @param {string} template - The prompt template with {{variable}} placeholders
 * @param {Object} variables - Key-value pairs to interpolate
 * @returns {string} The interpolated prompt
 */
export function interpolatePrompt(template, variables) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

/**
 * Load and interpolate a prompt in one call
 * @param {string} name - Name of the prompt file
 * @param {Object} variables - Variables to interpolate
 * @returns {Promise<string>} The ready-to-use prompt
 */
export async function getPrompt(name, variables) {
  const template = await loadPrompt(name);
  return interpolatePrompt(template, variables);
}
