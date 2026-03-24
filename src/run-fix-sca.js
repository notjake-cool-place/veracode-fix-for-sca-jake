const fs = require('fs');
const path = require('path');
const core = require('@actions/core');
const exec = require('@actions/exec');

async function runFixSca(workspaceDir, actionPath, fixScaParams) {
  try {
    const projectRootDir = '';
    const projectPath = path.join(workspaceDir, 'source-code', projectRootDir);

    // Set up environment for veracode CLI
    const isWindows = process.platform === 'win32';
    const binaryName = isWindows ? 'veracode.exe' : 'veracode';
    const veracodeBinary = path.join(`${process.env.CLI_PATH}`, binaryName); 
    // Build command arguments
    const args = [
      'fix',
      'sca',
      projectPath,
      '--results', path.join(workspaceDir, 'veracode_artifact_directory/Veracode Agent Based SCA Results', 'scaResults.json'),
      '--transitive',
      '--async', 
      '--decouple', 'true'
    ];

    if (fixScaParams && fixScaParams.trim() && fixScaParams !== 'SCA-*') {
      core.info(`Fix SCA params: ${fixScaParams}`);
      args.push('-i', fixScaParams);
    }

    // Run veracode fix sca command
    core.info(`Running: ${veracodeBinary} ${args.join(' ')}`);
    await exec.exec(veracodeBinary, args, {
      env: { ...process.env }
    });

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
      const pomPath = path.join(projectPath, 'pom.xml');
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
