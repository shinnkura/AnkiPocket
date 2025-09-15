/**
 * 自動Anki送信機能のテスト
 *
 * このテストは以下の機能をカバーします：
 * 1. 単語の自動処理（辞書検索 + 画像生成 + Anki送信）
 * 2. 文章の自動処理（翻訳 + 画像生成 + Anki送信）
 * 3. エラーハンドリング
 */

import { jest } from '@jest/globals';

// モック設定
global.fetch = jest.fn();

describe('自動Anki送信API', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('単語の自動処理', () => {
    test('単語の意味・画像を自動取得してAnkiに送信できること', async () => {
      // モックレスポンスを設定
      fetch
        // 1. 辞書API呼び出し
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
        // 2. Unsplash API呼び出し
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

    test('画像取得に失敗してもAnki送信は成功すること', async () => {
      fetch
        // 1. 辞書API成功
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
        // 2. Unsplash API失敗
        .mockResolvedValueOnce({
          ok: false,
          status: 404
        })
        // 3-5. AnkiConnect成功
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

  describe('文章の自動処理', () => {
    test('文章の翻訳・画像を自動取得してAnkiに送信できること', async () => {
      fetch
        // 1. 翻訳API呼び出し
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            translatedText: 'それは簡単なことです'
          })
        })
        // 2. Unsplash API呼び出し（フレーズの最初の単語で検索）
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

  describe('エラーハンドリング', () => {
    test('無効な入力でエラーを返すこと', async () => {
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

    test('AnkiConnect接続エラーを適切に処理すること', async () => {
      fetch
        // 1. 辞書API成功
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            word: 'test',
            definitions: [{ word: 'test', meanings: [{ partOfSpeech: 'noun', definitions: [{ definition: 'test' }] }] }],
            success: true
          })
        })
        // 2. Unsplash API成功
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ imageUrl: 'test.jpg', source: 'unsplash' })
        })
        // 3. AnkiConnect失敗
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