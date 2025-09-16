import { createMocks } from 'node-mocks-http';
import { GET } from '../../app/api/cambridge-dictionary/route';

// fetch をモック
global.fetch = jest.fn();

describe('/api/cambridge-dictionary', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should return definition for a valid English word', async () => {
    // Cambridge Dictionaryからの成功レスポンスをモック
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => `
        <html>
          <div class="def ddef_d db">a round <a class="query" href="#">fruit</a> with <a class="query" href="#">firm</a>, <a class="query" href="#">white</a> <a class="query" href="#">flesh</a> and a <a class="query" href="#">green</a>, <a class="query" href="#">red</a>, or <a class="query" href="#">yellow</a> <a class="query" href="#">skin</a></div>
        </html>
      `
    });

    const { req } = createMocks({
      method: 'GET',
      url: '/api/cambridge-dictionary?word=apple',
    });

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('word', 'apple');
    expect(data).toHaveProperty('definition');
    expect(typeof data.definition).toBe('string');
    expect(data.definition.length).toBeGreaterThan(0);
    expect(data.definition).toBe('a round fruit with firm, white flesh and a green, red, or yellow skin');
  });

  it('should handle words with no definition found', async () => {
    // 404レスポンスをモック
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    const { req } = createMocks({
      method: 'GET',
      url: '/api/cambridge-dictionary?word=nonexistentword123',
    });

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Definition not found');
  });

  it('should return error when word parameter is missing', async () => {
    const { req } = createMocks({
      method: 'GET',
      url: '/api/cambridge-dictionary',
    });

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Word parameter is required');
  });

  it('should handle network errors gracefully', async () => {
    // ネットワークエラーをモック
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { req } = createMocks({
      method: 'GET',
      url: '/api/cambridge-dictionary?word=test',
    });

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Failed to fetch definition');
  });

  it('should extract clean definition text without HTML tags', async () => {
    // HTMLタグを含むレスポンスをモック
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => `
        <html>
          <div class="def ddef_d db">a round <a class="query" href="#">fruit</a> with <a class="query" href="#">firm</a>, <a class="query" href="#">white</a> <a class="query" href="#">flesh</a></div>
        </html>
      `
    });

    const { req } = createMocks({
      method: 'GET',
      url: '/api/cambridge-dictionary?word=apple',
    });

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Definition should not contain HTML tags
    expect(data.definition).not.toMatch(/<[^>]*>/);
    // Definition should contain meaningful text
    expect(data.definition).toBe('a round fruit with firm, white flesh');
  });

  it('should handle HTML with no definition div', async () => {
    // 定義が見つからないHTMLレスポンスをモック
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => `
        <html>
          <div class="other-content">Some other content</div>
        </html>
      `
    });

    const { req } = createMocks({
      method: 'GET',
      url: '/api/cambridge-dictionary?word=notfound',
    });

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Definition not found');
  });
});