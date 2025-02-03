const request = require('supertest');
const app = require('../../app');

describe('Simple Security Tests', () => {
  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const res = await request(app)
        .get('/api/status')
        .send();

      console.log('[LOG security_test] ========= Security headers test completed');

      // Check for security headers set by helmet
      expect(res.headers['x-content-type-options']).toBeDefined();
      expect(res.headers['x-frame-options']).toBeDefined();
      expect(res.headers['x-xss-protection']).toBeDefined();
    });

    it('should handle CORS properly', async () => {
      const res = await request(app)
        .options('/api/status')
        .set('Origin', 'http://localhost:3000')
        .send();

      console.log('[LOG security_test] ========= CORS test completed');

      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Authentication Security', () => {
    it('should reject requests to protected endpoints without token', async () => {
      const res = await request(app)
        .get('/api/topics')
        .send();

      console.log('[LOG security_test] ========= No auth token test completed');

      expect(res.status).toBe(401);
    });

    it('should reject invalid JWT tokens', async () => {
      const res = await request(app)
        .get('/api/topics')
        .set('Authorization', 'Bearer invalid-token')
        .send();

      console.log('[LOG security_test] ========= Invalid token test completed');

      expect(res.status).toBe(401);
    });

    it('should reject malformed Authorization headers', async () => {
      const res = await request(app)
        .get('/api/topics')
        .set('Authorization', 'Malformed-Header')
        .send();

      console.log('[LOG security_test] ========= Malformed header test completed');

      expect(res.status).toBe(401);
    });
  });

  describe('Input Validation Security', () => {
    it('should validate email format in signup', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'testuser',
          email: 'invalid-email-format',
          password: 'password123',
          fullName: 'Test User'
        });

      console.log('[LOG security_test] ========= Email validation test completed');

      expect(res.status).toBe(400);
    });

    it('should enforce minimum password length', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '123', // Too short
          fullName: 'Test User'
        });

      console.log('[LOG security_test] ========= Password length test completed');

      expect(res.status).toBe(400);
    });
  });
}); 