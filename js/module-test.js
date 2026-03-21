/**
 * Module import test - checks if all modules can be imported without ReferenceErrors
 */
(async () => {
  const results = {
    successful: [],
    failed: []
  };

  const modules = [
    'app-constants.js',
    'app-prefs.js',
    'app-focus.js',
    'app-game.js',
    'app-settings.js',
    'app-input.js',
    'app-audio.js',
    'app-theme.js',
    'app-ui.js',
    'app-toast.js',
    'app-data.js'
  ];

  console.group('[Module Test] Attempting to import all modules');

  for (const module of modules) {
    try {
      const imported = await import(`./modules/${module}`);
      results.successful.push(module);
      console.log(`✓ ${module}`);
    } catch (error) {
      results.failed.push({ module, error: error.message });
      console.error(`✗ ${module}: ${error.message}`);
    }
  }

  console.groupEnd();
  console.group('[Module Test] Summary');
  console.log(`Successful: ${results.successful.length}/${modules.length}`);
  if (results.failed.length > 0) {
    console.error(`Failed: ${results.failed.length}`);
    console.table(results.failed);
  }
  console.groupEnd();

  window.__MODULE_TEST_RESULTS = results;
})();
