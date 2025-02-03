const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authController = require('../../controllers/auth.controller');

// Mock dependencies
jest.mock('../../config/database');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Controller Unit Tests', () => {
  let req, res, mockSequelize;

  beforeEach(() => {
    // Setup request and response mocks
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Mock sequelize
    mockSequelize = require('../../config/database');
    mockSequelize.query = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('signup', () => {
    beforeEach(() => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User'
      };
    });

    it('should create a new user successfully', async () => {
      // Mock database queries - no existing users
      mockSequelize.query
        .mockResolvedValueOnce([]) // Username check
        .mockResolvedValueOnce([]) // Email check
        .mockResolvedValueOnce(true) // Insert user
        .mockResolvedValueOnce([{ 
          id: 'test-id',
          username: 'testuser',
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'student'
        }]); // Fetch created user

      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      jwt.sign.mockReturnValue('jwt-token');

      await authController.signup(req, res);

      console.log('[LOG auth_unit_test] ========= Signup test completed');

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User created successfully',
          token: 'jwt-token',
          user: expect.any(Object)
        })
      );
    });

    it('should return 409 if username already exists', async () => {
      mockSequelize.query.mockResolvedValueOnce([{ id: 'existing-user' }]);

      await authController.signup(req, res);

      console.log('[LOG auth_unit_test] ========= Username exists test completed');

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Username already taken'
        })
      );
    });

    it('should return 409 if email already exists', async () => {
      mockSequelize.query = jest.fn()
        .mockResolvedValueOnce([]) // Username doesn't exist
        .mockResolvedValueOnce([{ id: 'existing-user' }]); // Email exists

      await authController.signup(req, res);

      console.log('[LOG auth_unit_test] ========= Email exists test completed');

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email already registered'
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      mockSequelize.query = jest.fn()
        .mockRejectedValue(new Error('Database connection failed'));

      await authController.signup(req, res);

      console.log('[LOG auth_unit_test] ========= Database error test completed');

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error creating user',
          error: 'Database connection failed'
        })
      );
    });
  });

  describe('login', () => {
    beforeEach(() => {
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };
    });

    it('should login user with valid credentials', async () => {
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedPassword',
        role: 'student'
      };

      mockSequelize.query.mockResolvedValueOnce([mockUser]);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('jwt-token');

      await authController.login(req, res);

      console.log('[LOG auth_unit_test] ========= Login success test completed');

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          token: 'jwt-token',
          user: expect.objectContaining({
            id: 'user-id',
            username: 'testuser',
            email: 'test@example.com'
          })
        })
      );
    });

    it('should return 401 for invalid credentials', async () => {
      mockSequelize.query.mockResolvedValueOnce([]);

      await authController.login(req, res);

      console.log('[LOG auth_unit_test] ========= Invalid credentials test completed');

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid credentials'
        })
      );
    });

    it('should handle login errors gracefully', async () => {
      mockSequelize.query = jest.fn()
        .mockRejectedValue(new Error('Database error'));

      await authController.login(req, res);

      console.log('[LOG auth_unit_test] ========= Login error test completed');

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error during login',
          error: 'Database error'
        })
      );
    });
  });

  describe('Password Security', () => {
    it('should use proper salt rounds for password hashing', async () => {
      req.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User'
      };

      mockSequelize.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce([{ 
          id: 'test-id',
          username: 'testuser',
          email: 'test@example.com',
          role: 'student'
        }]);

      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      jwt.sign.mockReturnValue('jwt-token');

      await authController.signup(req, res);

      console.log('[LOG auth_unit_test] ========= Password security test completed');

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
    });

    it('should generate JWT with proper payload', async () => {
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedPassword',
        role: 'student'
      };

      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      mockSequelize.query = jest.fn()
        .mockResolvedValueOnce([mockUser]);

      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('jwt-token');

      await authController.login(req, res);

      console.log('[LOG auth_unit_test] ========= JWT payload test completed');

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: 'user-id',
          username: 'testuser',
          email: 'test@example.com',
          role: 'student'
        },
        expect.any(String),
        { expiresIn: '24h' }
      );
    });
  });
}); 