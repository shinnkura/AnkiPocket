/**
 * 翻訳APIの簡素化されたテスト
 */

import { NextRequest } from 'next/server';
import { GET } from '../../app/api/translate/route';

// fetchをモック
global.fetch = jest.fn();

// NextRequestのための最小限のモック
class MockNextRequest extends Request {
  constructor(url: string) {
    super(url);
  }
}

// global.Requestが未定義の場合のためのポリフィル
if (typeof global.Request === 'undefined') {
  global.Request = MockNextRequest as any;
}

describe('/api/translate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('英語の文章を日本語に翻訳できる', async () => {
    // 外部APIの成功レスポンスをモック
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        responseStatus: 200,
        responseData: {
          translatedText: 'こんにちは'
        }
      })
    });

    const request = new MockNextRequest('http://localhost:3000/api/translate?text=Hello&from=en&to=ja') as NextRequest;
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.originalText).toBe('Hello');
    expect(data.translatedText).toBe('こんにちは');
    expect(data.from).toBe('en');
    expect(data.to).toBe('ja');
  });

  it('textパラメータが未指定の場合はエラーを返す', async () => {
    const request = new MockNextRequest('http://localhost:3000/api/translate?from=en&to=ja') as NextRequest;
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Text parameter is required');
  });

  it('サポートされていない言語ペアの場合はエラーを返す', async () => {
    const request = new MockNextRequest('http://localhost:3000/api/translate?text=Hello&from=en&to=xyz') as NextRequest;
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unsupported language pair');
  });

  it('fromパラメータが未指定の場合はenをデフォルトとする', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        responseStatus: 200,
        responseData: {
          translatedText: 'こんにちは'
        }
      })
    });

    const request = new MockNextRequest('http://localhost:3000/api/translate?text=Hello&to=ja') as NextRequest;
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.from).toBe('en');
  });

  it('toパラメータが未指定の場合はjaをデフォルトとする', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        responseStatus: 200,
        responseData: {
          translatedText: 'こんにちは'
        }
      })
    });

    const request = new MockNextRequest('http://localhost:3000/api/translate?text=Hello&from=en') as NextRequest;
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.to).toBe('ja');
  });
});