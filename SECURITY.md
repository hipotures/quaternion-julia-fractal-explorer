# Security Guide for Quaternion Julia Fractal Explorer

## Overview

This document provides security guidelines for deploying the Quaternion Julia Fractal Explorer on a public web server. The application has been hardened against common web vulnerabilities.

## Security Improvements Implemented

### 1. Eliminated CDN Dependencies

**Risk Mitigated**: CDN compromise and supply chain attacks

- **Before**: Three.js and Tweakpane loaded from external CDNs
- **After**: All dependencies bundled locally in `js/lib/`
- **Files**: 
  - `js/lib/three.module.min.js` (v0.177.0)
  - `js/lib/tweakpane.min.js` (v4.0.5)

### 2. Path Traversal Protection

**Risk Mitigated**: Unauthorized file access via tour file loading

- **Implementation**: Added `isValidTourFileName()` validation in `js/tour.js`
- **Protection**: 
  - Blocks `../` and `..\\` patterns
  - Enforces strict filename pattern: `tour##.json`
  - Validates against regex: `/^tour\d{2}\.json$/`

### 3. Content Security Policy (CSP)

**Risk Mitigated**: Cross-Site Scripting (XSS) attacks

**Recommended CSP Header**:
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; media-src 'self'
```

**Notes**:
- `'unsafe-inline'` required for CSS styling - consider refactoring to external CSS
- `data:` for img-src allows canvas-generated images (screenshots)

## Server Configuration

### Required Security Headers

See `security-headers.html` for server-specific configuration examples.

**Essential Headers**:
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - Browser XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer info

### File Permissions

**Recommended permissions**:
```bash
# Files
find . -type f -exec chmod 644 {} \;

# Directories  
find . -type d -exec chmod 755 {} \;

# Make sure no execute permissions on data files
chmod 644 *.json *.css *.html *.md
```

### Directory Security

**Disable directory listing** in your web server configuration:

**Apache**: Add `Options -Indexes` to `.htaccess`
**Nginx**: Default behavior (no additional config needed)

## Deployment Checklist

### Before Going Live

- [ ] All CDN dependencies replaced with local files
- [ ] Security headers configured on web server
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Directory listing disabled
- [ ] Proper file permissions set (644 for files, 755 for directories)
- [ ] Remove development files (`node_modules/`, `package.json`, etc.)
- [ ] Test Content Security Policy doesn't break functionality
- [ ] Verify no sensitive files are accessible via direct URL

### Production Environment

- [ ] Use a reverse proxy (nginx/Apache) rather than direct file serving
- [ ] Enable access logging for security monitoring
- [ ] Set up rate limiting to prevent DoS attacks
- [ ] Consider adding basic authentication for private deployments
- [ ] Regular security updates for web server software
- [ ] Monitor for suspicious access patterns in logs

## Files Safe for Public Access

The following files are designed to be publicly accessible:

### Core Application
- `index.html` - Main application entry point
- `css/styles.css` - Application styling
- `js/lib/` - Local JavaScript libraries
- `js/*.js` - Application JavaScript modules
- `tours/*.json` - Tour data files
- `images/*.png` - Fractal images for documentation

### Documentation (Optional)
- `README.md` - User guide
- `UI-ARCHITECTURE.md` - Technical documentation
- `TOUR.md` - Tour system documentation

## Files to Exclude from Public Access

**Never expose these files on a public server**:
- `package.json` - Contains dependency information
- `node_modules/` - Development dependencies
- `CLAUDE.md` - Development instructions
- `.git/` - Git repository data
- `security-headers.html` - Server configuration examples
- `SECURITY.md` - This security guide

### .htaccess Example for Apache
```apache
# Block access to sensitive files
<Files "package.json">
    Require all denied
</Files>
<Files "CLAUDE.md">
    Require all denied
</Files>
<Files "SECURITY.md">
    Require all denied
</Files>
<Files "security-headers.html">
    Require all denied
</Files>

# Block access to directories
RedirectMatch 403 ^/\.git
RedirectMatch 403 ^/node_modules
```

## Security Monitoring

### Log Analysis

Monitor your web server logs for:
- Attempts to access blocked files (`403` responses to `.git`, `package.json`, etc.)
- Path traversal attempts (`../`, encoded variants)
- Unusual request patterns or high request rates
- Attempts to access non-existent tour files

### Regular Updates

- Keep web server software updated
- Monitor for security advisories affecting Three.js and Tweakpane
- Periodically review and update security headers
- Test CSP configuration after any code changes

## Incident Response

If you suspect a security incident:

1. **Immediate**: Take the site offline if actively under attack
2. **Investigation**: Check access logs for signs of compromise
3. **Assessment**: Determine what data/functionality may have been accessed
4. **Recovery**: Restore from clean backups if necessary
5. **Prevention**: Update security measures to prevent similar incidents

## Contact

For security-related questions or to report vulnerabilities, please create an issue in the project repository with the `security` label.

---

**Last Updated**: June 2025  
**Security Review**: Complete  
**Risk Level**: Low (with proper deployment)