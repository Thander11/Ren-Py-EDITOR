const fs = require('fs');
const results = [];

// Test the regex patterns used in the parser
const line1 = 'call show_character_choice("Ryu_hunter_sonrisa")';
const line2 = '$ show_character_choice("Ryu_hunter_sonrisa")';

// Current regex from renderer.js (with \\$)
const re1 = /^(?:call|\\$)\s*show_character_choice\(\s*"([^"]+)"\s*\)$/;
// Corrected regex (with \$)
const re2 = /^(?:call|\$)\s*show_character_choice\(\s*"([^"]+)"\s*\)$/;

results.push('Current regex: ' + re1.toString());
results.push('  call match: ' + re1.test(line1));
results.push('  $ match: ' + re1.test(line2));
results.push('Corrected regex: ' + re2.toString());
results.push('  call match: ' + re2.test(line1));
results.push('  $ match: ' + re2.test(line2));

const m1 = line1.match(re1);
const m2 = line1.match(re2);
results.push('Match current: ' + JSON.stringify(m1));
results.push('Match corrected: ' + JSON.stringify(m2));

fs.writeFileSync(__dirname + '/test-results.txt', results.join('\n'), 'utf-8');
