/**
 * modelResolver.js
 * Central helper — reads AIModelSetting from the DB and returns
 * the provider + model string to use for a given tool.
 */
import { base44 } from '@/api/base44Client';

// Safe defaults if DB has no record for a tool
const DEFAULTS = {
  ai_builder:         { provider: 'openai', model: 'gpt-4.1' },
  error_debugger:     { provider: 'openai', model: 'gpt-4.1' },
  code_generator:     { provider: 'openai', model: 'gpt-4.1' },
  supabase_architect: { provider: 'openai', model: 'gpt-4.1' },
  vercel_fixer:       { provider: 'openai', model: 'gpt-4.1' },
  voice_assistant:    { provider: 'openai', model: 'gpt-4o' },
  app_builder:        { provider: 'openai', model: 'gpt-4.1' },
  document_writer:    { provider: 'openai', model: 'gpt-4.1-mini' },
};

/**
 * Resolves which model to use for a tool.
 * @param {string} tool_key  — matches AIModelSetting.tool_key
 * @returns {{ provider: string, model: string, is_active: boolean, source: 'db'|'default' }}
 */
export async function getModelForTool(tool_key) {
  try {
    const results = await base44.entities.AIModelSetting.filter({ tool_key });
    const setting = results?.[0];

    if (setting) {
      return {
        provider: setting.provider,
        model: setting.model,
        is_active: setting.is_active !== false,
        source: 'db',
        tool_name: setting.tool_name,
      };
    }
  } catch (err) {
    console.warn('[modelResolver] DB lookup failed, using default:', err.message);
  }

  const def = DEFAULTS[tool_key] || { provider: 'openai', model: 'gpt-4.1' };
  return { ...def, is_active: true, source: 'default', tool_name: tool_key };
}

/**
 * Convenience hook-style function that returns model info as React state.
 * Usage:  const { model, provider, is_active, loading } = await resolveModel('ai_builder')
 */
export { DEFAULTS };