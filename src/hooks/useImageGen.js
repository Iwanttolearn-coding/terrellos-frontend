/**
 * useImageGen.js — TerrellOS / Heavenly Eternal Echo
 * ─────────────────────────────────────────────────────────────────
 * DALL-E 3 image generation via Render backend.
 * Routes:  POST /v1/images/generate
 *          POST /v1/images/memorial
 * ─────────────────────────────────────────────────────────────────
 */
import { useState, useCallback } from 'react';
import { generateImage, generateMemorialImage } from '@/lib/api';

export function useImageGen() {
  const [images,  setImages]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  /** generate(prompt, options?) — general DALL-E 3 */
  const generate = useCallback(async (prompt, options = {}) => {
    if (!prompt?.trim()) return null;
    setLoading(true);
    setError(null);
    try {
      const res = await generateImage(prompt, {
        style:   options.style   || 'vivid',
        quality: options.quality || 'standard',
        size:    options.size    || '1024x1024',
        n:       options.n       || 1,
        user_id: options.user_id || null,
      });

      if (res?.images?.length) {
        setImages(res.images);
        return res.images;
      }
      // Graceful error — missing API key etc.
      const msg = res?.detail || res?.message || 'Image generation failed';
      setError(msg);
      return null;
    } catch (e) {
      const msg = e.message || 'Image generation failed';
      // Surface missing-key error clearly
      if (msg.includes('OPENAI_API_KEY') || msg.includes('not configured')) {
        setError('Image generation unavailable — set OPENAI_API_KEY in Render → Environment.');
      } else {
        setError(msg);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /** memorial(prompt, options?) — spiritual/legacy scene via /v1/images/memorial */
  const memorial = useCallback(async (prompt, options = {}) => {
    if (!prompt?.trim()) return null;
    setLoading(true);
    setError(null);
    try {
      const res = await generateMemorialImage(prompt, {
        quality: options.quality || 'hd',
        size:    options.size    || '1024x1024',
        user_id: options.user_id || null,
      });

      if (res?.images?.length) {
        setImages(res.images);
        return res.images;
      }
      setError(res?.detail || res?.message || 'Memorial image generation failed');
      return null;
    } catch (e) {
      const msg = e.message || 'Memorial image generation failed';
      if (msg.includes('OPENAI_API_KEY') || msg.includes('not configured')) {
        setError('Memorial image unavailable — set OPENAI_API_KEY in Render → Environment.');
      } else {
        setError(msg);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setImages([]);
    setError(null);
  }, []);

  return { generate, memorial, clear, images, loading, error };
}

export default useImageGen;
