/**
 * TerrellOS / Heavenly Eternal Echo
 * Memory System Entity Definitions
 * These define the structured memory architecture — not random chat logs.
 */

export const MEMORY_ENTITY_SCHEMAS = {

  MemoryProfile: {
    type: 'object',
    properties: {
      user_id:            { type: 'string' },
      display_name:       { type: 'string' },
      status:             { type: 'string', enum: ['active', 'paused', 'complete', 'archived'] },
      consent_timestamp:  { type: 'string' },
      consent_version:    { type: 'string' },
      session_count:      { type: 'number', default: 0 },
      total_duration_sec: { type: 'number', default: 0 },
      completion_pct:     { type: 'number', default: 0 },
      last_session_at:    { type: 'string' },
      legacy_release:     { type: 'string', enum: ['never', 'immediate', 'posthumous', 'scheduled'] },
      trusted_contacts:   { type: 'array', items: { type: 'string' } },
      is_encrypted:       { type: 'boolean', default: true },
      notes:              { type: 'string' },
    }
  },

  VoiceProfile: {
    type: 'object',
    properties: {
      memory_profile_id: { type: 'string' },
      user_id:           { type: 'string' },
      status:            { type: 'string', enum: ['pending', 'collecting', 'ready', 'unavailable'] },
      sample_count:      { type: 'number', default: 0 },
      duration_sec:      { type: 'number', default: 0 },
      clarity_score:     { type: 'number' },
      provider:          { type: 'string' },  // whisper | deepgram | assemblyai | pending
      voiceprint_ref:    { type: 'string' },
      notes:             { type: 'string' },
    }
  },

  FacialProfile: {
    type: 'object',
    properties: {
      memory_profile_id:  { type: 'string' },
      user_id:            { type: 'string' },
      status:             { type: 'string', enum: ['pending', 'collecting', 'ready', 'unavailable'] },
      frame_count:        { type: 'number', default: 0 },
      embedding_ref:      { type: 'string' },
      expressions_mapped: { type: 'array', items: { type: 'string' } },
      notes:              { type: 'string' },
    }
  },

  ConversationStyle: {
    type: 'object',
    properties: {
      memory_profile_id: { type: 'string' },
      user_id:           { type: 'string' },
      tone:              { type: 'string' },       // warm, direct, humorous, reflective
      pacing:            { type: 'string' },       // slow, moderate, fast
      humor_style:       { type: 'string' },
      speech_patterns:   { type: 'array', items: { type: 'string' } },
      favorite_phrases:  { type: 'array', items: { type: 'string' } },
      avoidances:        { type: 'array', items: { type: 'string' } },
      notes:             { type: 'string' },
    }
  },

  EmotionalSignature: {
    type: 'object',
    properties: {
      memory_profile_id: { type: 'string' },
      user_id:           { type: 'string' },
      dominant_emotions: { type: 'array', items: { type: 'string' } },
      love_language:     { type: 'string' },
      grief_style:       { type: 'string' },
      joy_triggers:      { type: 'array', items: { type: 'string' } },
      comfort_phrases:   { type: 'array', items: { type: 'string' } },
      notes:             { type: 'string' },
    }
  },

  StoryFragment: {
    type: 'object',
    properties: {
      memory_profile_id: { type: 'string' },
      user_id:           { type: 'string' },
      session_id:        { type: 'string' },
      prompt:            { type: 'string' },
      response_text:     { type: 'string' },
      audio_ref:         { type: 'string' },
      video_ref:         { type: 'string' },
      duration_sec:      { type: 'number' },
      emotion_detected:  { type: 'string' },
      confidence:        { type: 'number' },
      category:          { type: 'string', enum: ['childhood', 'relationships', 'faith', 'wisdom', 'humor', 'loss', 'love', 'identity', 'advice', 'other'] },
      is_pinned:         { type: 'boolean', default: false },
      reviewed:          { type: 'boolean', default: false },
    }
  },

  MemorySession: {
    type: 'object',
    properties: {
      memory_profile_id: { type: 'string' },
      user_id:           { type: 'string' },
      status:            { type: 'string', enum: ['active', 'paused', 'complete', 'abandoned'] },
      started_at:        { type: 'string' },
      ended_at:          { type: 'string' },
      duration_sec:      { type: 'number', default: 0 },
      prompts_answered:  { type: 'number', default: 0 },
      prompts_skipped:   { type: 'number', default: 0 },
      transcript_ref:    { type: 'string' },
      camera_active:     { type: 'boolean', default: false },
      voice_active:      { type: 'boolean', default: false },
      consent_confirmed: { type: 'boolean', default: false },
      device_type:       { type: 'string' },
      notes:             { type: 'string' },
    }
  },

  CoreBelief: {
    type: 'object',
    properties: {
      memory_profile_id: { type: 'string' },
      user_id:           { type: 'string' },
      belief:            { type: 'string' },
      category:          { type: 'string', enum: ['faith', 'family', 'work', 'love', 'purpose', 'legacy', 'other'] },
      source_fragment_id:{ type: 'string' },
      confidence:        { type: 'number' },
    }
  },

  LegacyConsent: {
    type: 'object',
    properties: {
      user_id:            { type: 'string' },
      memory_profile_id:  { type: 'string' },
      consent_timestamp:  { type: 'string' },
      consent_version:    { type: 'string', default: '1.0' },
      camera_approved:    { type: 'boolean', default: false },
      mic_approved:       { type: 'boolean', default: false },
      voice_analysis:     { type: 'boolean', default: false },
      memory_storage:     { type: 'boolean', default: false },
      ai_training:        { type: 'boolean', default: false },
      avatar_generation:  { type: 'boolean', default: false },
      future_playback:    { type: 'boolean', default: false },
      ip_address:         { type: 'string' },
      user_agent:         { type: 'string' },
      signature_text:     { type: 'string' },
    }
  },

  TrustedContact: {
    type: 'object',
    properties: {
      user_id:           { type: 'string' },
      memory_profile_id: { type: 'string' },
      name:              { type: 'string' },
      email:             { type: 'string' },
      relationship:      { type: 'string' },
      access_level:      { type: 'string', enum: ['view', 'interact', 'manage'] },
      release_trigger:   { type: 'string', enum: ['manual', 'posthumous', 'scheduled', 'never'] },
      notified:          { type: 'boolean', default: false },
    }
  },
};

export const TRAINING_PROMPTS = [
  { id: 'childhood',    category: 'childhood',    text: "Tell me about your childhood. What's the earliest memory that still feels vivid?" },
  { id: 'legacy',       category: 'legacy',       text: "What do you want your children — or the people you love most — to remember about you?" },
  { id: 'hardship',     category: 'identity',     text: "What was the hardest moment of your life, and what did it teach you?" },
  { id: 'love_style',   category: 'love',         text: "Describe how you love people. How do you show someone they matter to you?" },
  { id: 'laughter',     category: 'humor',        text: "What makes you genuinely laugh? Tell me about a moment you couldn't stop." },
  { id: 'echo_feeling', category: 'identity',     text: "How should someone feel after talking to your Echo? What do you want them to walk away with?" },
  { id: 'young_self',   category: 'wisdom',       text: "What would you tell your younger self that you wish you'd known?" },
  { id: 'phrases',      category: 'identity',     text: "What are phrases or sayings you find yourself repeating? Things uniquely you." },
  { id: 'forgiveness',  category: 'faith',        text: "What does forgiveness mean to you — and has someone ever changed your life by forgiving you?" },
  { id: 'suffering',    category: 'faith',        text: "What has God — or life, or suffering — taught you that nothing else could?" },
  { id: 'personality',  category: 'identity',     text: "Describe your personality honestly. The real you — not the version you perform." },
  { id: 'relationships',category: 'relationships',text: "Who shaped you most? Tell me about them." },
  { id: 'purpose',      category: 'purpose',      text: "What do you believe you were put here to do?" },
  { id: 'fear',         category: 'identity',     text: "What are you most afraid of? It's safe here." },
  { id: 'joy',          category: 'love',         text: "Describe a moment of pure joy. Close your eyes if you need to." },
];

export const CONSENT_VERSION = '1.0';

export const CONSENT_DISCLOSURES = [
  { key: 'camera_approved',  label: 'Camera access',          description: 'Your camera will be used to capture facial expressions and presence.' },
  { key: 'mic_approved',     label: 'Microphone access',      description: 'Your voice will be recorded to capture speech, rhythm, and tone.' },
  { key: 'voice_analysis',   label: 'Voice analysis',         description: 'Audio will be analyzed for emotional cadence, patterns, and voice profiling.' },
  { key: 'memory_storage',   label: 'Memory storage',         description: 'Your responses, stories, and session data will be stored securely.' },
  { key: 'ai_training',      label: 'AI training usage',      description: 'Your data will help train a conversational AI model of your identity.' },
  { key: 'avatar_generation',label: 'Avatar generation',      description: 'A visual and vocal avatar may be generated from your likeness in the future.' },
  { key: 'future_playback',  label: 'Future playback access', description: 'Your trusted contacts may access your Echo under conditions you define.' },
];
