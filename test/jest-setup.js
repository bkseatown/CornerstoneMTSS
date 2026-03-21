/**
 * Jest setup: Load specialist-hub modules for testing
 * This runs after the test environment is set up but before tests run
 */

// Load specialist-hub modules
// We use require to load each module synchronously
const fs = require('fs');
const path = require('path');

// Helper to evaluate a module file in the jsdom context
function loadModuleInJsdom(filename) {
  const filepath = path.join(__dirname, '..', filename);
  if (fs.existsSync(filepath)) {
    try {
      const code = fs.readFileSync(filepath, 'utf8');
      // Evaluate in the jsdom window context
      window.eval(code);
    } catch (err) {
      console.warn(`Failed to load ${filename}: ${err.message}`);
    }
  }
}

// Load modules in order of dependencies
loadModuleInJsdom('specialist-hub-storage.js');
loadModuleInJsdom('specialist-hub-search.js');
loadModuleInJsdom('specialist-hub-ui.js');
loadModuleInJsdom('specialist-hub-curriculum-data.js');
loadModuleInJsdom('specialist-hub-quick-reference.js');
loadModuleInJsdom('landing-auth.js');
