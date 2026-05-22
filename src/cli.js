#!/usr/bin/env node
/**
 * kdna — Unified CLI for KDNA domain cognition assets.
 *
 * Commands:
 *   kdna validate <path>       Validate a domain directory or .kdna file
 *   kdna verify <path>         Verify a domain (alias for validate)
 *   kdna pack <path>           Pack a domain folder into .kdna container (ZIP)
 *   kdna unpack <path>         Unpack .kdna container to domain folder
 *   kdna install <domain-id>   Install a domain from registry
 *   kdna inspect <path>        Inspect a domain directory or .kdna file
 *   kdna list                  List installed domains
 *   kdna compare <before> <after>  Compare judgment with/without KDNA
 *   kdna match "<task>"        Match task against available domains
 *   kdna setup                 One-command setup: install CLI + skills + data root
 *   kdna cluster lint <path>   Validate a cluster manifest
 *   kdna identity init         Generate Ed25519 identity key pair
 *   kdna identity show         Display public key and buyer ID
 */

const { usage, error } = require('./cmds/_common');
const { cmdValidate, cmdPack, cmdUnpack, cmdInspect } = require('./cmds/domain');
const { cmdList, cmdRegistry } = require('./cmds/registry');
const {
  cmdCompare,
  cmdDiff,
  cmdSearch,
  cmdAvailable,
  cmdMatch,
  cmdLoad,
} = require('./cmds/quality');
const { cmdCluster } = require('./cmds/cluster');
const { cmdIdentity } = require('./cmds/identity');
const { cmdSetup } = require('./cmds/setup');
const { cmdPreview, cmdProject, cmdEval, cmdSelect, cmdExport, cmdDemo } = require('./cmds/legacy');

// ─── Main ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
if (!args.length || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
  usage();
  process.exit(0);
}

const cmd = args[0];

switch (cmd) {
  case 'validate': {
    const schemaFlag = args.includes('--schema');
    const target = args.filter((a, i) => i > 0 && a !== '--schema')[0];
    if (!target) error('Usage: kdna validate <path>');
    cmdValidate(target, schemaFlag);
    break;
  }
  case 'pack': {
    let output = null;
    let target = null;
    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--output' || args[i] === '-o') {
        output = args[i + 1];
        i++;
      } else if (!target) {
        target = args[i];
      }
    }
    if (!target) error('Usage: kdna pack <path>');
    cmdPack(target, output);
    break;
  }
  case 'unpack': {
    const target = args[1];
    if (!target) error('Usage: kdna unpack <file.kdna>');
    cmdUnpack(target, args.includes('--force'));
    break;
  }
  case 'preview': {
    cmdPreview();
    break;
  }
  case 'install': {
    let domainId = null;
    let fromGit = null;
    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--from-git') {
        fromGit = args[i + 1];
        i++;
      } else if (!domainId) {
        domainId = args[i];
      }
    }
    if (!domainId) error('Usage: kdna install <domain-id|github:user/repo|./folder>');

    const { cmdInstallExtended } = require('./install');
    if (fromGit) {
      // Legacy --from-git: treat as github: URL
      const url = fromGit.replace(/^https:\/\/github\.com\//, '').replace(/\.git$/, '');
      cmdInstallExtended(`github:${url}`, args);
    } else {
      cmdInstallExtended(domainId, args);
    }
    break;
  }
  case 'registry': {
    cmdRegistry(args[1]);
    break;
  }
  case 'remove': {
    const { cmdRemove } = require('./install');
    const target = args[1];
    if (!target) error('Usage: kdna remove <domain>');
    cmdRemove(target);
    break;
  }
  case 'info': {
    const { cmdInfo } = require('./install');
    const target = args[1];
    if (!target) error('Usage: kdna info <domain>');
    cmdInfo(target);
    break;
  }
  case 'update': {
    const { cmdUpdate, cmdUpdateAll } = require('./install');
    if (args.includes('--all')) {
      cmdUpdateAll();
    } else {
      const target = args[1];
      if (!target) error('Usage: kdna update <domain>');
      cmdUpdate(target);
    }
    break;
  }
  case 'inspect': {
    const target = args[1];
    if (!target) error('Usage: kdna inspect <path>');
    cmdInspect(target);
    break;
  }
  case 'verify': {
    const { cmdVerify } = require('./verify');
    const target = args.filter((a) => !a.startsWith('--'))[1];
    if (!target) {
      error(
        'Usage:\n' +
          '  kdna verify <name>             Run all three layers (structure / trust / judgment)\n' +
          '  kdna verify <name> --structure  Files + schema only\n' +
          '  kdna verify <name> --trust      Signature + scope + Ed25519 only\n' +
          '  kdna verify <name> --judgment   v2.1 governance fields + eval cases only',
      );
    }
    cmdVerify(target, args);
    break;
  }
  case 'compare': {
    cmdCompare(args);
    break;
  }
  case 'diff': {
    cmdDiff(args);
    break;
  }
  case 'search': {
    cmdSearch(args);
    break;
  }
  case 'available': {
    cmdAvailable(args);
    break;
  }
  case 'match': {
    cmdMatch(args);
    break;
  }
  case 'load': {
    cmdLoad(args);
    break;
  }
  case 'project': {
    cmdProject();
    break;
  }
  case 'eval': {
    cmdEval();
    break;
  }
  case 'select': {
    cmdSelect();
    break;
  }
  case 'export': {
    cmdExport();
    break;
  }
  case 'list': {
    cmdList(args.includes('--available'));
    break;
  }
  case 'demo': {
    cmdDemo();
    break;
  }
  case 'setup': {
    cmdSetup();
    break;
  }
  case 'cluster': {
    cmdCluster(args);
    break;
  }
  case 'identity': {
    cmdIdentity(args);
    break;
  }
  case 'init': {
    const { cmdInit } = require('./init');
    cmdInit(args[1]);
    break;
  }
  case 'publish': {
    if (args.includes('--check')) {
      const { cmdPublishCheck } = require('./publish');
      const idx = args.indexOf('--check');
      const target = args[idx + 1] || args.filter((a) => !a.startsWith('--'))[1] || '.';
      if (!target || target.startsWith('--')) error('Usage: kdna publish --check <path>');
      cmdPublishCheck(target);
    } else {
      const { cmdPublish } = require('./publish');
      const target = args.filter((a) => !a.startsWith('--'))[1];
      if (!target) {
        error(
          'Usage:\n' +
            '  kdna publish <path>                      Pack + sign, output patch JSON\n' +
            '  kdna publish <path> --release-tag <tag> --repo <owner/name>\n' +
            '                                           ...also upload to GitHub Release\n' +
            '  kdna publish --check <path>              Quality gate only',
        );
      }
      cmdPublish(target, args);
    }
    break;
  }
  case 'version': {
    const { cmdVersionBump } = require('./version');
    const sub = args[1];
    if (sub === 'bump') {
      const level = args[2];
      const target = args[3] || '.';
      if (!level || !['patch', 'minor', 'major'].includes(level)) {
        error('Usage: kdna version bump <patch|minor|major> [path]');
      }
      cmdVersionBump(level, target);
    } else {
      console.log(`kdna v${require('../package.json').version}`);
      console.log('');
      console.log('Usage: kdna version bump <patch|minor|major> [path]');
    }
    break;
  }
  default:
    error(`Unknown command: ${cmd}\nRun: kdna help`);
}
