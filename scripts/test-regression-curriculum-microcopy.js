#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(process.cwd(), 'js/app.js'), 'utf8');

function requireText(pattern, message) {
  if (!pattern.test(appSource)) throw new Error(message);
}

requireText(
  /function getCurriculumFocusChipLabel\(focusValue,\s*packId = ''\)/,
  'Curriculum focus-chip helper no longer accepts pack-specific labels.'
);
requireText(
  /pack === 'ufli' \|\| pack === 'fundations' \|\| pack === 'wilson'/,
  'Curated pattern labels are missing for UFLI/Fundations/Wilson.'
);
requireText(
  /cvc:\s*'short-vowel CVC words'/,
  'Core phonics chip microcopy regressed for UFLI CVC labels.'
);
requireText(
  /cvc:\s*'closed syllables \(CVC\)'/,
  'Fundations chip microcopy regressed for closed syllables format.'
);
requireText(
  /cvce:\s*'V-e syllable \(a_e\/i_e\/o_e\/u_e\)'/,
  'Wilson chip microcopy regressed for V-e syllable notation format.'
);
requireText(
  /useCuratedPatternOnly = \['ufli', 'fundations', 'wilson'\]/,
  'Curriculum meta copy no longer enforces curated chips for top-used packs.'
);
requireText(
  /`\$\{focusLabel\} \(\$\{examples\.join\(', '\)\}\)`/,
  'Curriculum chip meta no longer formats examples in parentheses.'
);

console.log('regression check passed: curriculum chip microcopy');
