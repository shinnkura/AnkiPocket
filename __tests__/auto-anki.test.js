/**
 * Auto Anki Submission Feature Tests
 *
 * This test covers the following functionality:
 * 1. Automatic word processing (dictionary search + image generation + Anki submission)
 * 2. Automatic sentence processing (translation + image generation + Anki submission)
 * 3. Error handling
 */

import { jest } from '@jest/globals';

// Mock setup
global.fetch = jest.fn();

describe('Auto Anki Submission API', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('Automatic word processing', () => {
    test('should automatically retrieve word meanings and images and send to Anki', async () => {
      // Set up mock responses
      fetch
        // 1. Dictionary API call
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            word: 'beautiful',
            definitions: [{
              word: 'beautiful',
              phonetic: '/ˈbjuːtɪf(ə)l/',
              meanings: [{
                partOfSpeech: 'adjective',
                definitions: [{
                  definition: 'pleasing the senses or mind aesthetically',
                  example: 'a beautiful view'
                }]
              }]
            }],
            success: true
          })
        })
        // 2. Unsplash API call
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            imageUrl: 'https://example.com/beautiful.jpg',
            source: 'unsplash'
          })
        })
        // 3. AnkiConnect - modelNames
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: ['Basic'],
            error: null
          })
        })
        // 4. AnkiConnect - modelFieldNames
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: ['Front', 'Back'],
            error: null
          })
        })
        // 5. AnkiConnect - storeMediaFile
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: 'beautiful_123456789.jpg',
            error: null
          })
        })
        // 6. AnkiConnect - addNote
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            result: 1234567890,
            error: null
          })
        });

      const response = await fetch('/api/auto-anki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'beautiful',
          deckName: 'English Vocabulary'
        })
      });

      expect(response.ok).toBe(true);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.type).toBe('word');
      expect(result.word).toBe('beautiful');
      expect(result.definition).toBeDefined();
      expect(result.imageUrl).toBe('https://example.com/beautiful.jpg');
      expect(result.ankiNoteId).toBe(1234567890);
    });

    test('should succeed in Anki submission even if image retrieval fails', async () => {
      fetch
        // 1. Dictionary API success
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            word: 'test',
            definitions: [{
              word: 'test',
              phonetic: '/test/',
              meanings: [{
                partOfSpeech: 'noun',
                definitions: [{
                  definition: 'a procedure intended to establish the quality'
                }]
              }]
            }],
            success: true
          })
        })
        // 2. Unsplash API failure
        .mockResolvedValueOnce({
          ok: false,
          status: 404
        })
        // 3-5. AnkiConnect success
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: ['Basic'], error: null })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: ['Front', 'Back'], error: null })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: 1234567890, error: null })
        });

      const response = await fetch('/api/auto-anki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'test',
          deckName: 'English Vocabulary'
        })
      });

      expect(response.ok).toBe(true);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.imageUrl).toBeNull();
      expect(result.ankiNoteId).toBe(1234567890);
    });
  });

  describe('Automatic sentence processing', () => {
    test('should automatically retrieve sentence translations and images and send to Anki', async () => {
      fetch
        // 1. Translation API call
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            translatedText: 'それは簡単なことです'
          })
        })
        // 2. Unsplash API call (search with first word of phrase)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            imageUrl: 'https://example.com/cake.jpg',
            source: 'unsplash'
          })
        })
        // 3-6. AnkiConnect
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: ['Basic'], error: null })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: ['Front', 'Back'], error: null })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: 'phrase_123456789.jpg', error: null })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ result: 1234567890, error: null })
        });

      const response = await fetch('/api/auto-anki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'it is a piece of cake',
          deckName: 'English Vocabulary'
        })
      });

      expect(response.ok).toBe(true);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.type).toBe('phrase');
      expect(result.originalText).toBe('it is a piece of cake');
      expect(result.translatedText).toBe('それは簡単なことです');
      expect(result.imageUrl).toBe('https://example.com/cake.jpg');
      expect(result.ankiNoteId).toBe(1234567890);
    });
  });

  describe('Error handling', () => {
    test('should return error for invalid input', async () => {
      const response = await fetch('/api/auto-anki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '',
          deckName: 'English Vocabulary'
        })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    test('should properly handle AnkiConnect connection errors', async () => {
      fetch
        // 1. Dictionary API success
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            word: 'test',
            definitions: [{ word: 'test', meanings: [{ partOfSpeech: 'noun', definitions: [{ definition: 'test' }] }] }],
            success: true
          })
        })
        // 2. Unsplash API success
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ imageUrl: 'test.jpg', source: 'unsplash' })
        })
        // 3. AnkiConnect failure
        .mockRejectedValueOnce(new Error('Failed to fetch'));

      const response = await fetch('/api/auto-anki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'test',
          deckName: 'English Vocabulary'
        })
      });

      expect(response.ok).toBe(false);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('AnkiConnect');
    });
  });
});