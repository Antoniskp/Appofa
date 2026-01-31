# Deployment Guide

This guide covers different deployment options for the News Application.

## Table of Contents
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Production Deployment](#production-deployment)
- [VPS Deployment (Ubuntu/Debian)](VPS_DEPLOYMENT.md)

## Local Development

### Prerequisites
- Node.js v14 or higher
- PostgreSQL v12 or higher
- npm or yarn

### Steps

1. **Clone the repository**
```bash
git clone https://github.com/Antoniskp/appofasiv8.git
cd appofasiv8
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up PostgreSQL database**

Option A: Using the setup script
```bash
./setup-db.sh
```

Option B: Manual setup
```bash
# Create database
createdb newsapp

# Or using psql
psql -U postgres
CREATE DATABASE newsapp;
\q
```

4. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. **Start the application**
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## Docker Deployment

Docker makes it easy to deploy the application with all dependencies included.

### Prerequisites
- Docker
- Docker Compose

### Steps

1. **Clone the repository**
```bash
git clone https://github.com/Antoniskp/appofasiv8.git
cd appofasiv8
```

2. **Build and start with Docker Compose**
```bash
docker-compose up -d
```

This will:
- Create a PostgreSQL database container
- Build and start the application container
- Set up networking between containers
- Expose the API on port 3000

3. **Check logs**
```bash
docker-compose logs -f app
```

4. **Stop the application**
```bash
docker-compose down
```

5. **Stop and remove all data**
```bash
docker-compose down -v
```

### Environment Variables for Docker

Edit `docker-compose.yml` to customize:
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password (change in production!)
- `JWT_SECRET`: JWT secret key (must change in production!)
- `PORT`: Application port

## Production Deployment

### Security Checklist

Before deploying to production:

1. **Change sensitive credentials**
   - Generate a strong JWT_SECRET: `openssl rand -base64 32`
   - Use a strong database password
   - Never commit `.env` file to version control

2. **Update environment variables**
```env
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
DB_PASSWORD=<strong-password>
```

3. **Enable HTTPS**
   - Use a reverse proxy (nginx, Apache)
   - Obtain SSL certificate (Let's Encrypt)

4. **Set up monitoring**
   - Application logs
   - Database monitoring
   - Error tracking (e.g., Sentry)

### Deployment on VPS (Ubuntu/Debian)

See [VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md) for the full VPS setup guide.

### Deployment on Heroku

1. **Install Heroku CLI**
```bash
npm install -g heroku
```

2. **Login and create app**
```bash
heroku login
heroku create your-app-name
```

3. **Add PostgreSQL addon**
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

4. **Set environment variables**
```bash
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set NODE_ENV=production
```

5. **Deploy**
```bash
git push heroku main
```

6. **Open application**
```bash
heroku open
```

### Deployment on AWS (EC2 + RDS)

1. **Create RDS PostgreSQL instance**
   - Navigate to AWS RDS
   - Create PostgreSQL database
   - Note the endpoint and credentials

2. **Launch EC2 instance**
   - Use Ubuntu/Amazon Linux AMI
   - Configure security groups (allow ports 22, 80, 443)

3. **Connect and set up application**
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js and dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs git

# Clone and configure
git clone https://github.com/Antoniskp/appofasiv8.git
cd appofasiv8
npm install --production

# Configure .env with RDS credentials
cp .env.example .env
nano .env
```

4. **Use PM2 and nginx** (same as VPS deployment)

## Monitoring and Maintenance

### View Application Logs
```bash
# PM2 logs
pm2 logs newsapp

# Docker logs
docker-compose logs -f app
```

### Database Backup
```bash
# Local PostgreSQL
pg_dump -U postgres newsapp > backup.sql

# Restore
psql -U postgres newsapp < backup.sql

# Docker
docker exec newsapp-db pg_dump -U postgres newsapp > backup.sql
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Restart application
pm2 restart newsapp

# Or with Docker
docker-compose up -d --build
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists
- Check firewall rules

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000
# Or
netstat -tulpn | grep 3000

# Kill process
kill -9 <PID>
```

### Application Won't Start
- Check logs for errors
- Verify all environment variables are set
- Ensure database is accessible
- Check Node.js version compatibility

## Performance Optimization

1. **Enable connection pooling** (already configured in Sequelize)
2. **Use caching** (Redis for session/token caching)
3. **Enable compression** in Express
4. **Use CDN** for static assets
5. **Database indexing** for frequently queried fields
6. **Load balancing** for high traffic

## Security Best Practices

1. Keep dependencies updated: `npm audit fix`
2. Use helmet.js for security headers
3. Implement rate limiting
4. Validate all user inputs
5. Use HTTPS in production
6. Regular database backups
7. Monitor for security vulnerabilities
8. Implement logging and monitoring
