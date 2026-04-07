const fs = require('fs');
const path = require('path');
const core = require('@actions/core');
const exec = require('@actions/exec');
const { buildCliArgs } = require('./build-cli-args');

async function runFixSca(workspaceDir, actionPath, fixScaParams) {
  try {
    const projectRootDir = '';
    const projectPath = path.join(workspaceDir, 'source-code', projectRootDir);

    // Set up environment for veracode CLI
    const isWindows = process.platform === 'win32';
    const binaryName = isWindows ? 'veracode.exe' : 'veracode';
    const veracodeBinary = path.join(`${process.env.CLI_PATH}`, binaryName);

    // Build command arguments
    const fixTransitive = core.getInput('fix-transitive');
    const baseArgs = buildCliArgs(workspaceDir, fixTransitive);

    // Add --verbose flag (specific to Jake version for debugging)
    const args = [...baseArgs, '--verbose'];

    if (fixScaParams && fixScaParams.trim() && fixScaParams !== 'SCA-*') {
      core.info(`Fix SCA params: ${fixScaParams}`);
      args.push('-i', fixScaParams);
    }

    // ===== PRE-EXECUTION DEBUGGING =====
    core.info('=== PRE-EXECUTION DEBUG: pom.xml analysis ===');
    const pomPath = path.join(projectPath, 'pom.xml');
    let pomContentBefore = null;
    if (fs.existsSync(pomPath)) {
      pomContentBefore = fs.readFileSync(pomPath, 'utf8');
      const pomContentRaw = fs.readFileSync(pomPath);

      // Check line endings
      const hasCRLF = pomContentRaw.includes(Buffer.from('\r\n'));
      const hasLF = pomContentRaw.includes(Buffer.from('\n'));
      core.info(`[PRE] Line endings detected: ${hasCRLF ? 'CRLF (Windows)' : 'LF (Unix)'}`);
      core.info(`[PRE] File size: ${pomContentRaw.length} bytes`);

      // Check version - look for log4j-core specifically (handle both LF and CRLF)
      const log4jMatch = pomContentBefore.match(/log4j-core<\/artifactId>[\s\r\n]*<version>([\d.]+)<\/version>/);
      const foundVersion = log4jMatch ? log4jMatch[1] : 'NOT FOUND';
      core.info(`[PRE] log4j-core version: ${foundVersion}`);

      // Hex dump of version area
      const versionIndex = pomContentBefore.indexOf('log4j-core');
      if (versionIndex >= 0) {
        const chunk = pomContentRaw.slice(Math.max(0, versionIndex - 50), versionIndex + 150);
        core.info(`[PRE] Hex dump (50 bytes before + 150 after log4j-core):`);
        core.info(`[PRE] ${chunk.toString('hex')}`);
        core.info(`[PRE] ASCII: ${chunk.toString('ascii')}`);
      }

      // Test string matching
      const searchStr1 = '<version>2.14.1</version>';
      const found1 = pomContentBefore.includes(searchStr1);
      core.info(`[PRE] Manual search for "${searchStr1}": ${found1 ? 'FOUND' : 'NOT FOUND'}`);

      const searchStr2 = '<version>2.14.1</version>\r\n';
      const found2 = pomContentBefore.includes(searchStr2);
      core.info(`[PRE] Manual search with CRLF context: ${found2 ? 'FOUND' : 'NOT FOUND'}`);
    }


    // Run veracode fix sca command
    core.info(`Running: ${veracodeBinary} ${args.join(' ')}`);
    await exec.exec(veracodeBinary, args, {
      env: { ...process.env }
    });

    // ===== POST-EXECUTION DEBUGGING =====
    core.info('=== POST-EXECUTION DEBUG: pom.xml analysis ===');
    if (fs.existsSync(pomPath)) {
      const pomContentAfter = fs.readFileSync(pomPath, 'utf8');
      const pomContentRawAfter = fs.readFileSync(pomPath);

      // Check line endings
      const hasCRLFAfter = pomContentRawAfter.includes(Buffer.from('\r\n'));
      const hasLFAfter = pomContentRawAfter.includes(Buffer.from('\n'));
      core.info(`[POST] Line endings detected: ${hasCRLFAfter ? 'CRLF (Windows)' : 'LF (Unix)'}`);
      core.info(`[POST] File size: ${pomContentRawAfter.length} bytes`);

      // Check version - look for log4j-core specifically (handle both LF and CRLF)
      const log4jMatchAfter = pomContentAfter.match(/log4j-core<\/artifactId>[\s\r\n]*<version>([\d.]+)<\/version>/);
      const foundVersionAfter = log4jMatchAfter ? log4jMatchAfter[1] : 'NOT FOUND';
      core.info(`[POST] log4j-core version: ${foundVersionAfter}`);

      // Hex dump of version area
      const versionIndexAfter = pomContentAfter.indexOf('log4j-core');
      if (versionIndexAfter >= 0) {
        const chunkAfter = pomContentRawAfter.slice(Math.max(0, versionIndexAfter - 50), versionIndexAfter + 150);
        core.info(`[POST] Hex dump (50 bytes before + 150 after log4j-core):`);
        core.info(`[POST] ${chunkAfter.toString('hex')}`);
        core.info(`[POST] ASCII: ${chunkAfter.toString('ascii')}`);
      }

      // Compare before/after
      const fileChanged = pomContentBefore !== null && pomContentBefore !== pomContentAfter;
      core.info(`[POST] File content changed: ${fileChanged ? 'YES' : 'NO'}`);

      // Test manual replacements
      const testReplace1 = pomContentAfter.replace('<version>2.14.1</version>', '<version>2.25.3</version>');
      const testReplace2 = pomContentAfter.replace('<version>2.14.1</version>\r\n', '<version>2.25.3</version>\r\n');
      core.info(`[POST] Manual replace (LF context) would change file: ${testReplace1 !== pomContentAfter ? 'YES' : 'NO'}`);
      core.info(`[POST] Manual replace (CRLF context) would change file: ${testReplace2 !== pomContentAfter ? 'YES' : 'NO'}`);
    }


    // Debug: Check git status after fix
    core.info('=== Debug: Git status after fix ===');
    try {
      let gitStatusOutput = '';
      await exec.exec('git', ['status', '--porcelain'], {
        cwd: projectPath,
        listeners: {
          stdout: (data) => {
            gitStatusOutput += data.toString();
          }
        }
      });
      core.info(`Git status (porcelain): ${gitStatusOutput || '(no output)'}`);

      // Debug: Check git config settings
      let gitConfigOutput = '';
      await exec.exec('git', ['config', '--list'], {
        cwd: projectPath,
        listeners: {
          stdout: (data) => {
            gitConfigOutput += data.toString();
          }
        }
      });
      core.info(`Git config: ${gitConfigOutput}`);

      // Debug: Check pom.xml file
      if (fs.existsSync(pomPath)) {
        const pomContent = fs.readFileSync(pomPath, 'utf8');
        core.info(`pom.xml contains log4j version: ${pomContent.includes('2.25.3') ? '2.25.3 (FIXED)' : pomContent.includes('2.14.1') ? '2.14.1 (OLD)' : 'UNKNOWN'}`);
      }
    } catch (error) {
      core.warning(`Failed to get git status: ${error.message}`);
    }

    // Check for changes in the repository
    let hasChanges = false;
    let gitDiffOutput = '';

    try {
      await exec.exec('git', ['diff', '--name-only', 'HEAD'], {
        cwd: projectPath,
        listeners: {
          stdout: (data) => {
            gitDiffOutput += data.toString();
          }
        }
      });

      core.info(`Git diff output: ${gitDiffOutput || '(no output)'}`);

      if (gitDiffOutput.trim().length > 0) {
        hasChanges = true;
      }
    } catch (error) {
      core.warning(`Failed to check git diff: ${error.message}`);
    }

    if (!hasChanges) {
      core.info('No changes to existing files detected. Skipping branch creation and PR.');
      return { hasChanges: false };
    }

    // Show git diff
    core.info('----- Git diff -----');
    try {
      await exec.exec('git', ['--no-pager', 'diff'], {
        cwd: projectPath
      });
    } catch (error) {
      core.warning(`Failed to show git diff: ${error.message}`);
    }

    return { hasChanges: true };
  } catch (error) {
    throw new Error(`Failed to run Fix for SCA: ${error.message}`);
  }
}

module.exports = runFixSca;
