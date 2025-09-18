/**
 * Translation API Tests
 * Tests the functionality for translating sentences and text
 */

import { createMocks } from 'node-mocks-http';
import { GET } from '../../app/api/translate/route';

// Mock fetch
global.fetch = jest.fn();

describe('/api/translate', () => {
  describe('GET /api/translate', () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockClear();
    });

    it('英語の文章を日本語に翻訳できる', async () => {
      // Mock fetchして成功レスポンスを返す
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          responseStatus: 200,
          responseData: {
            translatedText: 'こんにちは'
          }
        })
      });
      const { req } = createMocks({
        method: 'GET',
        url: '/api/translate?text=Hello&from=en&to=ja',
      });

      const response = await GET(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.originalText).toBe('Hello');
      expect(responseData.from).toBe('en');
      expect(responseData.to).toBe('ja');
      expect(responseData.translatedText).toBeDefined();
      expect(typeof responseData.translatedText).toBe('string');
    });

    it('日本語の文章を英語に翻訳できる', async () => {
      // Mock fetchして成功レスポンスを返す
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          responseStatus: 200,
          responseData: {
            translatedText: 'Hello'
          }
        })
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/translate?text=こんにちは&from=ja&to=en',
      });

      const response = await GET(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.originalText).toBe('こんにちは');
      expect(responseData.from).toBe('ja');
      expect(responseData.to).toBe('en');
      expect(responseData.translatedText).toBeDefined();
      expect(typeof responseData.translatedText).toBe('string');
    });

    it('複数文の翻訳ができる', async () => {
      // Mock fetchして成功レスポンスを返す
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          responseStatus: 200,
          responseData: {
            translatedText: 'こんにちは世界。元気ですか？'
          }
        })
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/translate?text=Hello world. How are you?&from=en&to=ja',
      });

      const response = await GET(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.originalText).toBe('Hello world. How are you?');
      expect(responseData.from).toBe('en');
      expect(responseData.to).toBe('ja');
      expect(responseData.translatedText).toBeDefined();
      expect(typeof responseData.translatedText).toBe('string');
    });

    it('textパラメータが未指定の場合はエラーを返す', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/translate?from=en&to=ja',
      });

      const response = await GET(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Text parameter is required');
    });

    it('fromパラメータが未指定の場合はenをデフォルトとする', async () => {
      // Mock fetchして成功レスポンスを返す
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          responseStatus: 200,
          responseData: {
            translatedText: 'こんにちは'
          }
        })
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/translate?text=Hello&to=ja',
      });

      const response = await GET(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.originalText).toBe('Hello');
      expect(responseData.from).toBe('en');
      expect(responseData.to).toBe('ja');
      expect(responseData.translatedText).toBeDefined();
    });

    it('toパラメータが未指定の場合はjaをデフォルトとする', async () => {
      // Mock fetchして成功レスポンスを返す
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          responseStatus: 200,
          responseData: {
            translatedText: 'こんにちは'
          }
        })
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/translate?text=Hello&from=en',
      });

      const response = await GET(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.originalText).toBe('Hello');
      expect(responseData.from).toBe('en');
      expect(responseData.to).toBe('ja');
      expect(responseData.translatedText).toBeDefined();
    });

    it('サポートされていない言語ペアの場合はエラーを返す', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/translate?text=Hello&from=en&to=xyz',
      });

      const response = await GET(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Unsupported language pair');
    });
  });
});