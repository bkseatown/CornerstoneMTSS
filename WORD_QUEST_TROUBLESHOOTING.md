# Word Quest - Troubleshooting & Setup Guide

**Issue:** Keyboard, gameboard, settings, and music not appearing in Word Quest

**Root Cause:** Word Quest requires a running dev server and proper module initialization

---

## Quick Fix - Demo Mode & Testing

### Option 1: Skip Google Sign-In (Demo Mode)

**For Testing Without Google Account:**

1. **Add auth-bypass.js to your HTML:**
```html
<script src="js/landing-auth-bypass.js"></script>
```

2. **Methods to activate:**

   **A) Click "Demo Mode" button**
   - Appears in bottom-right corner
   - Click to simulate sign-in
   - No Google account needed

   **B) Use URL parameter**
   ```
   http://localhost:8888/?demo=true
   ```

   **C) Enable in console**
   ```javascript
   window.ENABLE_AUTH_BYPASS = true;
   // Then reload page
   ```

**Demo User:**
- Email: `teacher@example.com`
- Name: `Demo Teacher`
- Full access to all features

---

## Word Quest Setup - Full Guide

### Problem: Missing Game Components

**Symptoms:**
- No keyboard visible
- No gameboard
- Settings don't work
- Music not playing

**Causes:**
1. Dev server not running
2. Game JavaScript not loaded
3. DOM elements not created
4. CSS not loaded

### Solution: Run Dev Server

```bash
# Terminal 1: Start dev server
cd /Users/robertwilliamknaus/CornerstoneMTSS
npm run dev
# or
npx http-server -p 8888

# Terminal 2: Access application
# Visit: http://localhost:8888/index.html
```

### Step-by-Step Setup

**1. Prerequisites**
```bash
# Install dependencies
npm install

# Verify Node.js installed
node --version
# Should output: v25.6.0 or similar
```

**2. Start Server**
```bash
# Option A: HTTP Server (simple)
npx http-server . -p 8888 -c-1

# Option B: Node dev server (if configured)
npm run dev

# Option C: Python (if installed)
python3 -m http.server 8888
```

**3. Verify Server Running**
```bash
# In another terminal, test connection
curl http://localhost:8888/index.html

# Should return HTML content
```

**4. Access Application**
```
http://localhost:8888/index.html
```

**5. Use Demo Mode**
- Click "🚀 Demo Mode" button (bottom-right)
- Bypass Google Sign-In
- Access all features

**6. Navigate to Word Quest**
- Click "Word Quest" in navigation
- Verify game loads
- Check for:
  - ✅ Keyboard visible
  - ✅ Gameboard rendered
  - ✅ Settings icon available
  - ✅ Music controls working

---

## Debugging Missing Components

### Check 1: Is Server Running?

```javascript
// Open browser console (F12)
// Try to fetch a file:
fetch('/index.html')
  .then(r => r.text())
  .then(t => console.log('Server OK:', t.length + ' bytes'))
  .catch(e => console.error('Server ERROR:', e));
```

### Check 2: Are Game Files Loaded?

```javascript
// Check if game modules exist
console.log('Game UI available:', typeof window.createWordQuestUI);
console.log('Game logic available:', typeof window.GameLogic);
console.log('Keyboard available:', !!document.getElementById('keyboard'));
console.log('Gameboard available:', !!document.getElementById('board'));
```

### Check 3: Check Console for Errors

```bash
# Open DevTools (F12) → Console tab
# Look for errors like:
# - "Failed to load resource"
# - "Cannot read property 'getElementById' of undefined"
# - "Module not found"
```

### Check 4: Verify File Structure

```bash
# Ensure these files exist:
ls -la /Users/robertwilliamknaus/CornerstoneMTSS/
- index.html ✅
- word-quest.html ✅ (if separate)
- js/word-quest*.js ✅
- css/*.css ✅
```

---

## Full Solution Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Dev server started (`npm run dev` or `http-server`)
- [ ] Server accessible (`http://localhost:8888`)
- [ ] Demo Mode button visible (bottom-right)
- [ ] Clicked "Demo Mode" to bypass Google Sign-In
- [ ] Successfully "signed in" with demo account
- [ ] Navigated to Word Quest game
- [ ] Keyboard visible in game
- [ ] Gameboard rendered
- [ ] Settings accessible
- [ ] Music player working
- [ ] No console errors (F12)

---

## If Still Not Working

### Clear Cache
```bash
# Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
# Or open DevTools → right-click refresh → Empty cache and hard refresh
```

### Check Network Tab
```
1. Open DevTools (F12)
2. Go to "Network" tab
3. Reload page
4. Look for failed requests (red)
5. Check response status codes (should be 200)
```

### Verify JavaScript Execution
```javascript
// In console, check if modules initialized:
console.log('Window keys:', Object.keys(window).filter(k => k.includes('game') || k.includes('quest')));
```

### Network Issues
```bash
# Test if server is responding:
curl -v http://localhost:8888/index.html

# Should show: HTTP/1.1 200 OK
```

---

## GitHub Deployment

When deploying to GitHub:

1. **Configure GitHub Pages:**
   - Settings → Pages → Source: GitHub Actions

2. **Create workflow file:** `.github/workflows/deploy.yml`
```yaml
name: Deploy to GitHub Pages
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        run: |
          # Build commands here
          echo "Deploying to GitHub Pages"
```

3. **Access deployed app:**
```
https://yourusername.github.io/CornerstoneMTSS/
```

---

## Production Checklist

- [ ] Dev server NOT needed in production
- [ ] All assets served via HTTPS
- [ ] Google OAuth credentials configured (env vars)
- [ ] Demo mode disabled in production
- [ ] Cache headers optimized
- [ ] Security headers enabled (.htaccess)
- [ ] Performance monitoring active
- [ ] Error logging configured

---

## Support

**If Word Quest still doesn't work:**

1. Check browser console (F12) for specific errors
2. Verify all files loaded (Network tab)
3. Check that JavaScript is enabled
4. Try different browser
5. Clear browser cache completely
6. Create fresh issue with error messages

**Expected when working:**
- Keyboard with letter buttons visible
- Gameboard with word tiles
- Settings button (gear icon)
- Music controls
- No console errors
- Smooth animations
