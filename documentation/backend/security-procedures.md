# UniHub Backend Security Procedures

## Overview

This document outlines the comprehensive security procedures implemented in the UniHub backend to protect against common vulnerabilities and ensure data security.

## Table of Contents

1. [Security Architecture](#security-architecture)
2. [Authentication & Authorization](#authentication--authorization)
3. [Input Validation & Sanitization](#input-validation--sanitization)
4. [Data Protection](#data-protection)
5. [API Security](#api-security)
6. [File Upload Security](#file-upload-security)
7. [Error Handling & Logging](#error-handling--logging)
8. [Security Testing](#security-testing)
9. [Incident Response](#incident-response)
10. [Compliance & Auditing](#compliance--auditing)

## Security Architecture

### Defense in Depth Strategy

The UniHub backend implements multiple layers of security:

1. **Network Layer**: HTTPS, CORS, Rate Limiting
2. **Application Layer**: Input validation, Authentication, Authorization
3. **Data Layer**: Encryption, Access controls, Audit logging
4. **Infrastructure Layer**: Secure deployment, Environment isolation

### Security Frameworks & Libraries

- **Helmet.js**: Security headers
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **express-validator**: Input validation
- **cors**: Cross-origin resource sharing
- **multer**: File upload handling

## Authentication & Authorization

### JWT-Based Authentication

**Implementation Details**:
```javascript
// Token generation
const token = jwt.sign(
  { 
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

**Security Features**:
- 24-hour token expiration
- Secure secret key management
- Role-based payload
- Stateless authentication

### Password Security

**Hashing Strategy**:
```javascript
// Password hashing with bcrypt
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);
```

**Security Measures**:
- 10 salt rounds for bcrypt
- Password strength validation
- No password storage in plain text
- Secure password comparison

### Role-Based Access Control (RBAC)

**Roles**:
- `student`: Basic user access
- `instructor`: Content creation and management
- `admin`: Full system access

**Implementation**:
```javascript
// Middleware for role checking
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};
```

## Input Validation & Sanitization

### Validation Framework

Using `express-validator` for comprehensive input validation:

```javascript
// Example validation rules
[
  body('username').trim().isLength({ min: 3, max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  validate // Custom middleware to handle validation errors
]
```

### SQL Injection Prevention

**Parameterized Queries**:
```javascript
// Using Sequelize ORM for safe queries
await sequelize.query(
  'SELECT * FROM users WHERE email = ?',
  {
    replacements: [email],
    type: QueryTypes.SELECT,
  }
);
```

**Protection Measures**:
- ORM usage (Sequelize)
- Parameterized queries
- Input sanitization
- Query validation

### XSS Prevention

**Security Headers**:
```javascript
// Helmet.js configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"]
    }
  }
}));
```

**Input Sanitization**:
- HTML entity encoding
- Script tag filtering
- Attribute sanitization
- Content validation

## Data Protection

### Database Security

**Connection Security**:
```javascript
// Secure database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false, // Disable SQL logging in production
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);
```

**Data Encryption**:
- Password hashing with bcrypt
- Sensitive data encryption at rest
- Secure transmission (HTTPS)
- Environment variable protection

### Personal Data Protection

**GDPR Compliance**:
- Data minimization
- Purpose limitation
- Storage limitation
- User consent management
- Right to erasure implementation

**Data Handling**:
```javascript
// Remove sensitive data from responses
delete user.password_hash;
delete user.reset_token;
```

## API Security

### Security Headers

**Helmet.js Implementation**:
```javascript
app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: true,
  xssFilter: true
}));
```

**Security Headers Applied**:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`
- `Content-Security-Policy`

### CORS Configuration

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Rate Limiting

**Implementation Strategy**:
- Request rate limiting per IP
- API endpoint specific limits
- Brute force protection
- DDoS mitigation

## File Upload Security

### File Validation

```javascript
// Multer configuration for secure file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});
```

**Security Measures**:
- File type validation
- File size limits
- Virus scanning (recommended)
- Secure file storage
- Path traversal prevention

### File Storage Security

- Separate upload directory
- No executable permissions
- Unique file naming
- Access control
- Regular cleanup

## Error Handling & Logging

### Secure Error Handling

```javascript
// Generic error responses
app.use((err, req, res, next) => {
  console.error('[LOG error] =========', err);
  
  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
    
  res.status(500).json({ 
    message,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
```

### Security Logging

**Log Categories**:
- Authentication attempts
- Authorization failures
- Input validation errors
- File upload activities
- Database errors
- Security events

**Log Format**:
```
[LOG component_name] ========= timestamp - event_description
```

**Security Considerations**:
- No sensitive data in logs
- Secure log storage
- Log rotation
- Access controls
- Monitoring and alerting

## Security Testing

### Automated Security Tests

**Test Categories**:
1. **Authentication Tests**
   - Token validation
   - Password security
   - Session management

2. **Authorization Tests**
   - Role-based access
   - Resource ownership
   - Privilege escalation

3. **Input Validation Tests**
   - SQL injection attempts
   - XSS payloads
   - File upload exploits

4. **API Security Tests**
   - CORS validation
   - Security headers
   - Rate limiting

### Penetration Testing

**Regular Assessments**:
- Quarterly security audits
- Vulnerability scanning
- Code review
- Infrastructure testing

**Testing Tools**:
- OWASP ZAP
- Burp Suite
- Nmap
- SQLMap

## Incident Response

### Security Incident Procedure

1. **Detection & Analysis**
   - Monitor security logs
   - Identify threats
   - Assess impact

2. **Containment**
   - Isolate affected systems
   - Prevent spread
   - Preserve evidence

3. **Eradication**
   - Remove threats
   - Patch vulnerabilities
   - Update security measures

4. **Recovery**
   - Restore services
   - Monitor for recurrence
   - Validate security

5. **Lessons Learned**
   - Document incident
   - Update procedures
   - Improve defenses

### Emergency Contacts

- Security Team Lead
- System Administrator
- Legal Department
- External Security Consultant

## Compliance & Auditing

### Compliance Standards

**Applicable Standards**:
- GDPR (General Data Protection Regulation)
- OWASP Top 10
- ISO 27001 guidelines
- Industry best practices

### Security Auditing

**Regular Audits**:
- Monthly security reviews
- Quarterly penetration testing
- Annual compliance audits
- Continuous monitoring

**Audit Areas**:
- Access controls
- Data protection
- Incident response
- Security training
- Policy compliance

### Documentation Requirements

- Security policies
- Incident reports
- Audit findings
- Remediation plans
- Training records

## Security Maintenance

### Regular Updates

**Update Schedule**:
- Weekly dependency updates
- Monthly security patches
- Quarterly security reviews
- Annual policy updates

### Security Monitoring

**Monitoring Tools**:
- Application logs
- Security scanners
- Intrusion detection
- Performance monitoring

### Training & Awareness

**Security Training**:
- Developer security training
- Security best practices
- Incident response procedures
- Compliance requirements

## Conclusion

The UniHub backend security procedures provide comprehensive protection against common vulnerabilities and security threats. Regular testing, monitoring, and updates ensure the security measures remain effective against evolving threats.

For security concerns or incident reporting, please contact the security team immediately.

**Emergency Security Contact**: security@unihub.com 