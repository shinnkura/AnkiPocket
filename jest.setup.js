import '@testing-library/jest-dom'
import 'whatwg-fetch'

// グローバルなRequestとResponseをモック
global.Request = require('node-mocks-http').Request
global.Response = require('node-mocks-http').Response

// NextResponse を模擬
global.NextResponse = {
  json: (data, init) => {
    const response = new Response(JSON.stringify(data), {
      status: init?.status || 200,
      headers: { 'Content-Type': 'application/json' },
      ...init
    })
    return {
      ...response,
      json: async () => data,
      status: init?.status || 200
    }
  }
}