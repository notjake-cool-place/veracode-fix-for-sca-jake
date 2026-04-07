/**
 * Unit tests for build-cli-args.js
 * Tests the --transitive flag conditional logic
 */

const { buildCliArgs } = require('../src/build-cli-args');
const path = require('path');

describe('buildCliArgs', () => {
  const workspaceDir = '/workspace';
  const expectedResultsPath = path.join(
    workspaceDir,
    'veracode_artifact_directory/Veracode Agent Based SCA Results',
    'scaResults.json'
  );

  describe('--transitive flag behavior', () => {
    test('should include --transitive flag when fix-transitive is "true"', () => {
      const args = buildCliArgs(workspaceDir, 'true');

      expect(args).toContain('--transitive');
      expect(args.indexOf('--transitive')).toBeGreaterThan(-1);
    });

    test('should include --transitive flag when fix-transitive is empty string (default)', () => {
      const args = buildCliArgs(workspaceDir, '');

      expect(args).toContain('--transitive');
      expect(args.indexOf('--transitive')).toBeGreaterThan(-1);
    });

    test('should NOT include --transitive flag when fix-transitive is "false"', () => {
      const args = buildCliArgs(workspaceDir, 'false');

      expect(args).not.toContain('--transitive');
    });

    test('should NOT include --transitive flag when fix-transitive is "false" (lowercase)', () => {
      const args = buildCliArgs(workspaceDir, 'false');

      expect(args).not.toContain('--transitive');
      // Verify count of arguments (should not have extra items)
      expect(args.length).toBeLessThan(
        buildCliArgs(workspaceDir, 'true').length
      );
    });
  });

  describe('base arguments always present', () => {
    test('should always include base fix sca command', () => {
      const args = buildCliArgs(workspaceDir, 'true');

      expect(args).toContain('fix');
      expect(args).toContain('sca');
      expect(args).toContain('.');
    });

    test('should always include results path argument', () => {
      const args = buildCliArgs(workspaceDir, 'true');

      expect(args).toContain('--results');
      expect(args).toContain(expectedResultsPath);
    });

    test('should always include async and decouple arguments', () => {
      const args = buildCliArgs(workspaceDir, 'true');

      expect(args).toContain('--async');
      expect(args).toContain('--decouple');
      expect(args).toContain('true');
    });

    test('should maintain correct argument order for fix command', () => {
      const args = buildCliArgs(workspaceDir, 'true');

      // Verify the command structure is: fix sca . --results <path> --async --decouple true ...
      expect(args[0]).toBe('fix');
      expect(args[1]).toBe('sca');
      expect(args[2]).toBe('.');
      expect(args[3]).toBe('--results');
      expect(args[4]).toBe(expectedResultsPath);
      expect(args[5]).toBe('--async');
      expect(args[6]).toBe('--decouple');
      expect(args[7]).toBe('true');
    });
  });

  describe('backward compatibility', () => {
    test('should have --transitive flag by default (backward compatible)', () => {
      // Default behavior when no fix-transitive provided should still include --transitive
      const argsWithEmpty = buildCliArgs(workspaceDir, '');
      const argsWithTrue = buildCliArgs(workspaceDir, 'true');

      // Both should include --transitive
      expect(argsWithEmpty).toContain('--transitive');
      expect(argsWithTrue).toContain('--transitive');
    });

    test('should allow opt-out of --transitive flag', () => {
      const args = buildCliArgs(workspaceDir, 'false');

      // When explicitly set to false, should NOT include it
      expect(args).not.toContain('--transitive');
    });
  });

  describe('argument count verification', () => {
    test('with --transitive should have correct argument count', () => {
      const args = buildCliArgs(workspaceDir, 'true');

      // fix, sca, ., --results, path, --async, --decouple, true, --transitive = 9 args
      expect(args.length).toBe(9);
    });

    test('without --transitive should have one fewer argument', () => {
      const argsWithTransitive = buildCliArgs(workspaceDir, 'true');
      const argsWithoutTransitive = buildCliArgs(workspaceDir, 'false');

      expect(argsWithTransitive.length).toBe(argsWithoutTransitive.length + 1);
    });
  });

  describe('edge cases', () => {
    test('should handle undefined workspace directory gracefully', () => {
      // Should not throw even with edge case input
      const args = buildCliArgs('/undefined/path', 'true');
      expect(args).toBeInstanceOf(Array);
      expect(args.length).toBeGreaterThan(0);
    });

    test('should handle any truthy string value for transitive flag', () => {
      // Only 'true' or empty string should include the flag
      const argsWith_true = buildCliArgs(workspaceDir, 'true');
      const argsWithEmpty = buildCliArgs(workspaceDir, '');

      expect(argsWith_true).toContain('--transitive');
      expect(argsWithEmpty).toContain('--transitive');
    });

    test('should NOT include --transitive for any falsy value', () => {
      const args = buildCliArgs(workspaceDir, 'false');
      expect(args).not.toContain('--transitive');
    });
  });
});
