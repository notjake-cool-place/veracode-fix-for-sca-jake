/**
 * Build CLI arguments for veracode fix sca command
 * Extracted for testability
 */

function buildCliArgs(workspaceDir, fixTransitiveInput) {
  const path = require('path');

  // Base arguments always included
  const args = [
    'fix',
    'sca',
    '.',
    '--results',
    path.join(
      workspaceDir,
      'veracode_artifact_directory/Veracode Agent Based SCA Results',
      'scaResults.json'
    ),
    '--async',
    '--decouple',
    'true',
  ];

  // Conditionally add --transitive flag based on input (default: true)
  if (fixTransitiveInput === 'true' || fixTransitiveInput === '') {
    args.push('--transitive');
  }

  return args;
}

module.exports = { buildCliArgs };
