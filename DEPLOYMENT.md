# Deployment Guide

This guide provides step-by-step instructions for deploying the Automated Student ID Card System to a production environment.

## Table of Contents

1. [Server Requirements](#server-requirements)
2. [Database Setup](#database-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Nginx Configuration](#nginx-configuration)
6. [SSL/HTTPS Setup](#sslhttps-setup)
7. [Process Management with PM2](#process-management-with-pm2)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Backup Strategy](#backup-strategy)
10. [Security Checklist](#security-checklist)

## Server Requirements

### Minimum Requirements

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 50 GB SSD
- **OS**: Ubuntu 20.04 LTS or similar
- **Node.js**: v16 or higher
- **MySQL**: v8 or higher
- **Nginx**: Latest stable version

### Recommended Requirements

- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 100 GB SSD
- **OS**: Ubuntu 22.04 LTS
- **Node.js**: v18 LTS
- **MySQL**: v8.0
- **Nginx**: Latest stable version

## Database Setup

### 1. Install MySQL Server

```bash
sudo apt update
sudo apt install mysql-server -y
sudo mysql_secure_installation
```

### 2. Create Database and User

```sql
mysql -u root -p

CREATE DATABASE student_id_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'id_system_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON student_id_system.* TO 'id_system_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Import Schema

```bash
mysql -u id_system_user -p student_id_system < database/schema.sql
mysql -u id_system_user -p student_id_system < database/seeds.sql
```

### 4. Configure MySQL for Production

Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
bind-address = 127.0.0.1
max_connections = 200
innodb_buffer_pool_size = 2G
innodb_log_file_size = 512M
```

Restart MySQL:

```bash
sudo systemctl restart mysql
```

## Backend Deployment

### 1. Install Node.js and npm

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Create Application Directory

```bash
sudo mkdir -p /var/www/student-id-system
sudo chown -R $USER:$USER /var/www/student-id-system
cd /var/www/student-id-system
```

### 3. Upload Backend Files

Upload the `backend` directory to `/var/www/student-id-system/backend`

### 4. Install Dependencies

```bash
cd backend
npm install --production
```

### 5. Configure Environment Variables

Create `.env` file:

```env
DB_HOST=127.0.0.1
DB_USER=id_system_user
DB_PASSWORD=strong_password_here
DB_NAME=student_id_system
DB_PORT=3306

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_use_long_random_string
JWT_EXPIRE=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_official_email@example.edu.ng
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=Institution ID Card System <noreply@example.edu.ng>

SERVER_PORT=5000
NODE_ENV=production

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

### 6. Create Uploads Directory

```bash
mkdir -p uploads logs
chmod 755 uploads logs
```

### 7. Test Backend

```bash
node server.js
```

Verify it's running on port 5000, then stop with Ctrl+C.

## Frontend Deployment

### 1. Upload Frontend Files

Upload the `frontend` directory to `/var/www/student-id-system/frontend`

### 2. Install Dependencies

```bash
cd /var/www/student-id-system/frontend
npm install
```

### 3. Build for Production

```bash
npm run build
```

### 4. Configure Environment

Create `.env.production` file:

```env
VITE_API_URL=https://yourdomain.com/api
```

## Nginx Configuration

### 1. Install Nginx

```bash
sudo apt install nginx -y
```

### 2. Create Nginx Configuration

Create `/etc/nginx/sites-available/student-id-system`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (see SSL section)
    ssl_certificate /etc/ssl/certs/yourdomain.com.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.com.key;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (React build)
    location / {
        root /var/www/student-id-system/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Uploaded files
    location /uploads {
        alias /var/www/student-id-system/backend/uploads;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss;
}
```

### 3. Enable Configuration

```bash
sudo ln -s /etc/nginx/sites-available/student-id-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Configure Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable
```

## SSL/HTTPS Setup

### Option 1: Let's Encrypt (Free)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Option 2: Commercial SSL

1. Purchase SSL certificate from provider
2. Upload certificate files to server:
   - Certificate: `/etc/ssl/certs/yourdomain.com.crt`
   - Private Key: `/etc/ssl/private/yourdomain.com.key`
   - CA Bundle: `/etc/ssl/certs/yourdomain.com-ca-bundle.crt`

3. Update Nginx configuration with SSL paths

### Auto-renew Let's Encrypt

```bash
sudo certbot renew --dry-run
sudo crontab -e
```

Add:

```
0 0,12 * * * certbot renew --quiet
```

## Process Management with PM2

### 1. Install PM2

```bash
sudo npm install -g pm2
```

### 2. Create PM2 Ecosystem File

Create `/var/www/student-id-system/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'student-id-backend',
      script: '/var/www/student-id-system/backend/server.js',
      cwd: '/var/www/student-id-system/backend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/www/student-id-system/backend/logs/error.log',
      out_file: '/var/www/student-id-system/backend/logs/out.log',
      log_file: '/var/www/student-id-system/backend/logs/combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G'
    }
  ]
};
```

### 3. Start Application with PM2

```bash
cd /var/www/student-id-system
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. PM2 Commands

```bash
# Start
pm2 start ecosystem.config.js

# Stop
pm2 stop student-id-backend

# Restart
pm2 restart student-id-backend

# View logs
pm2 logs student-id-backend

# Monitor
pm2 monit

# Status
pm2 status

# Remove
pm2 delete student-id-backend
```

## Monitoring and Logging

### 1. Application Logs

```bash
# View backend logs
tail -f /var/www/student-id-system/backend/logs/combined.log

# View error logs
tail -f /var/www/student-id-system/backend/logs/error.log
```

### 2. Nginx Logs

```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

### 3. MySQL Logs

```bash
tail -f /var/log/mysql/error.log
```

### 4. System Monitoring

Install monitoring tools:

```bash
sudo apt install htop iotop -y
```

## Backup Strategy

### 1. Database Backup

Create backup script `/var/www/student-id-system/scripts/backup-db.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/student-id-system"
mkdir -p $BACKUP_DIR

mysqldump -u id_system_user -p'strong_password_here' student_id_system > $BACKUP_DIR/db_backup_$DATE.sql
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete
```

Make executable:

```bash
chmod +x /var/www/student-id-system/scripts/backup-db.sh
```

Add to cron:

```bash
sudo crontab -e
```

Add daily backup at 2 AM:

```
0 2 * * * /var/www/student-id-system/scripts/backup-db.sh
```

### 2. File Backup

Backup uploads directory:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/student-id-system"
mkdir -p $BACKUP_DIR

tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/student-id-system/backend/uploads
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +7 -delete
```

### 3. Configuration Backup

```bash
tar -czf /var/backups/student-id-system/config_$(date +%Y%m%d).tar.gz \
  /var/www/student-id-system/backend/.env \
  /var/www/student-id-system/frontend/.env.production
```

## Security Checklist

### Application Security

- [ ] Change all default passwords
- [ ] Use strong JWT secret (minimum 32 characters)
- [ ] Enable HTTPS only
- [ ] Configure proper CORS origins
- [ ] Implement rate limiting
- [ ] Enable security headers
- [ ] Keep dependencies updated
- [ ] Remove seed data from production

### Server Security

- [ ] Configure firewall (UFW)
- [ ] Disable root SSH login
- [ ] Use SSH key authentication
- [ ] Keep system updated
- [ ] Install fail2ban
- [ ] Configure automatic security updates

### Database Security

- [ ] Use strong database password
- [ ] Restrict database user privileges
- [ ] Disable remote MySQL access
- [ ] Enable MySQL query logging
- [ ] Regular database backups

### Network Security

- [ ] Use SSL/TLS certificates
- [ ] Enable HSTS
- [ ] Implement CSP headers
- [ ] Configure proper DNS records

## Performance Optimization

### 1. Enable Nginx Caching

Add to Nginx config:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;
```

### 2. Database Optimization

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_status_submitted ON id_registrations(status, submitted_at);
CREATE INDEX idx_student_status ON id_registrations(student_id, status);
```

### 3. Enable Compression

Already configured in Nginx config

### 4. CDN for Static Assets

Consider using CloudFlare or similar CDN for static assets

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs student-id-backend

# Check if port is in use
sudo netstat -tlnp | grep :5000
```

### Database Connection Issues

```bash
# Test MySQL connection
mysql -u id_system_user -p -h 127.0.0.1 student_id_system

# Check MySQL status
sudo systemctl status mysql
```

### Nginx 502 Bad Gateway

```bash
# Check if backend is running
pm2 status

# Check Nginx error logs
tail -f /var/log/nginx/error.log
```

### Email Not Sending

```bash
# Test SMTP connection
telnet smtp.gmail.com 587

# Check application logs for email errors
tail -f /var/www/student-id-system/backend/logs/combined.log | grep -i email
```

## Maintenance

### Regular Tasks

- **Daily**: Review error logs
- **Weekly**: Check disk space, review performance
- **Monthly**: Update dependencies, review security updates
- **Quarterly**: Full system audit, backup verification

### Update Process

```bash
# Stop application
pm2 stop student-id-backend

# Backup current version
cp -r /var/www/student-id-system /var/backups/student-id-system-$(date +%Y%m%d)

# Upload new files
# Install new dependencies
cd /var/www/student-id-system/backend
npm install --production

# Restart application
pm2 restart student-id-backend
```

## Support

For deployment issues:

- Contact the ICT Department of your institution
- Email: [Support Email]

## Emergency Contacts

- System Administrator: [Contact Information]
- Database Administrator: [Contact Information]
- Network Administrator: [Contact Information]
