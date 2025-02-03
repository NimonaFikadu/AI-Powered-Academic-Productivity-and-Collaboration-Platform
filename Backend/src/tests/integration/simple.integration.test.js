const request = require('supertest');
const app = require('../../app');

describe('Simple Integration Tests', () => {
  describe('GET /api/status', () => {
    it('should return API status', async () => {
      const res = await request(app)
        .get('/api/status')
        .send();

      console.log('[LOG integration_test] ========= Status endpoint test completed');

      // Should return either 200 (if DB connected) or 500 (if DB not connected)
      expect([200, 500]).toContain(res.status);
      expect(res.body).toHaveProperty('status');
      
      // Only check for timestamp if status is 'ok' (database connected)
      if (res.body.status === 'ok') {
        expect(res.body).toHaveProperty('timestamp');
      }
    });
  });

  describe('GET /', () => {
    it('should redirect to API documentation', async () => {
      const res = await request(app)
        .get('/')
        .send();

      console.log('[LOG integration_test] ========= Root redirect test completed');

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/api-docs');
    });
  });

  describe('GET /api-docs', () => {
    it('should serve Swagger documentation', async () => {
      const res = await request(app)
        .get('/api-docs/')
        .send();

      console.log('[LOG integration_test] ========= Swagger docs test completed');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
    });
  });
}); 