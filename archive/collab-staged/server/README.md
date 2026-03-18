# Cornerstone MTSS Collaboration Server

Production WebSocket server for real-time specialist collaboration during student game sessions.

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start server
npm run dev

# Server runs on http://localhost:3000
# WebSocket: ws://localhost:3000
# API: http://localhost:3000/api
```

### Check Health

```bash
# Health check endpoint
curl http://localhost:3000/api/health

# Expected response:
# {"status":"ok","timestamp":"...","activeSessions":0,"activeConnections":0}
```

## Production Deployment

### Prerequisites
- Node.js 16+
- PM2 for process management (optional but recommended)

### Setup

```bash
# Install globally (optional, for PM2)
npm install -g pm2

# Install dependencies
npm install --production

# Start server with PM2
pm2 start collab-server.js --name "collab-server"

# Setup auto-restart on reboot
pm2 startup
pm2 save

# Check status
pm2 status
pm2 logs collab-server
```

### Environment Variables

```bash
# Port
export PORT=3000

# Host
export HOST=0.0.0.0

# Node environment
export NODE_ENV=production

# Allowed origins (comma-separated)
export ALLOWED_ORIGINS=https://bkseatown.github.io,https://cornerstone.edu
```

## API Endpoints

### Health Check
```
GET /api/health
Response: {status, timestamp, uptime, activeSessions, activeConnections, memory}
```

### Session Info
```
GET /api/session/:id
Response: {id, specialists, annotationCount, messageCount, decisionCount, timestamps}
```

### Get Decisions
```
GET /api/session/:id/decisions
Response: {sessionId, decisions[]}
```

### Export Session
```
GET /api/session/:id/export?format=json
Response: {sessionId, summary, decisions, messages, annotationSummary}
```

### List Active Sessions
```
GET /api/sessions
Response: {total, sessions[]}
```

### Statistics
```
GET /api/stats
Response: {sessions, connections, decisions, memory, uptime}
```

## WebSocket Events

### Client → Server

- `join-session` - Join a collaboration session
- `annotation-added` - Add annotation (highlight, arrow, note)
- `annotation-updated` - Update annotation
- `annotation-removed` - Remove annotation
- `decision-logged` - Log specialist decision
- `chat-message` - Send message
- `cursor-moved` - Broadcast cursor position

### Server → Client

- `specialist-joined` - Another specialist joined
- `specialist-left` - Specialist disconnected
- `session-state` - Initial session state
- `annotation-added` - Annotation from other specialist
- `annotation-updated` - Updated annotation
- `annotation-removed` - Annotation removed
- `decision-logged` - Decision from other specialist
- `chat-message` - Message from other specialist
- `cursor-moved` - Cursor position from other specialist

## Data Storage

### In-Memory (Current)
- Active sessions stored in memory
- Auto-cleanup of inactive sessions (24 hours)
- Good for development and small deployments

### For Scaling (Future)
- Use Redis for session storage
- Use MongoDB/PostgreSQL for decision logs
- Implement persistent session history

## Monitoring

### View Logs
```bash
pm2 logs collab-server
```

### Monitor Performance
```bash
pm2 monit
```

### Health Check Every 5 Minutes
```bash
# Automated monitoring script
while true; do
  curl http://localhost:3000/api/health | jq .
  sleep 300
done
```

## Troubleshooting

### Connection Issues
- Check firewall allows port 3000
- Verify CORS origins in ALLOWED_ORIGINS
- Check browser console for WebSocket errors

### High Memory Usage
- Monitor with `pm2 monit`
- Adjust SESSION_TIMEOUT if needed
- Consider Redis backend for scaling

### Performance Issues
- Check API endpoint response times
- Monitor with `pm2 logs`
- Consider load balancing with multiple servers

## Development

### Run Tests
```bash
npm test
```

### Lint Code
```bash
npm run lint
```

### Debug Mode
```bash
DEBUG=* npm run dev
```

## Deployment on Cloud

### Heroku
```bash
# Create Procfile
echo "web: node collab-server.js" > Procfile

# Deploy
git push heroku main
```

### AWS (Elastic Beanstalk)
```bash
eb init
eb create cornerstone-collab-server
eb deploy
```

### Docker
```bash
# Create Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "collab-server.js"]

# Build and run
docker build -t cornerstone-collab .
docker run -p 3000:3000 cornerstone-collab
```

## Security Notes

- All connections support WebSocket Secure (wss://) in production
- Implement authentication/authorization before production
- Sanitize all user input (messages, decisions)
- Use HTTPS for all API endpoints
- Store sensitive decision logs securely (encrypted)
- Implement rate limiting on API endpoints

## Support

For issues or questions:
1. Check logs: `pm2 logs collab-server`
2. Health check: `curl http://localhost:3000/api/health`
3. Review DEPLOYMENT_GUIDE.md for detailed troubleshooting

---

**Version**: 1.0.0
**Last Updated**: 2026-03-17
**Status**: Production Ready
