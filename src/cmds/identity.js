const { error } = require('./_common');

function cmdIdentity(args) {
  const {
    cmdIdentityInit,
    cmdIdentityShow,
    cmdIdentityExport,
    cmdIdentityImport,
  } = require('../identity');
  const sub = args[1];
  if (sub === 'init') {
    cmdIdentityInit();
  } else if (sub === 'show') {
    cmdIdentityShow();
  } else if (sub === 'export') {
    const outIdx = args.indexOf('--out');
    cmdIdentityExport(outIdx >= 0 ? args[outIdx + 1] : null);
  } else if (sub === 'import') {
    const target = args[2];
    if (!target) error('Usage: kdna identity import <file>');
    cmdIdentityImport(target);
  } else {
    error(
      `Usage: kdna identity init\n       kdna identity show\n       kdna identity export [--out <file>]\n       kdna identity import <file>`,
    );
  }
}

module.exports = {
  cmdIdentity,
};
