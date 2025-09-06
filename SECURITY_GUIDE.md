# Security Guide for Database Configuration
# ================================================

# 1. .env file (DEFAULT - NO SENSITIVE DATA)
#    - Contains placeholder values
#    - Safe to commit to git
#    - Used as fallback when .env.local is not available

# 2. .env.local file (SENSITIVE - DO NOT COMMIT)
#    - Contains real passwords and sensitive data
#    - Overrides .env settings
#    - Never commit to git
#    - Keep this file secure

# 3. System Environment Variables (MOST SECURE)
#    - Set in your operating system
#    - Highest priority
#    - Recommended for production

# Priority Order:
# System Environment > .env.local > .env

# Example of setting system environment variable:
# Windows: set DATABASE_URL=postgresql://user:pass@host:port/db
# Linux/Mac: export DATABASE_URL=postgresql://user:pass@host:port/db
