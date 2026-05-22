const { error } = require('./_common');

function cmdCluster(args) {
  const { cmdClusterLint } = require('../cluster');
  const sub = args[1];
  const target = args[2];
  if (sub === 'lint') {
    if (!target) error('Usage: kdna cluster lint <path>');
    cmdClusterLint(target);
  } else if (sub === 'init') {
    const { cmdClusterInit } = require('../init');
    cmdClusterInit(target);
  } else if (sub === 'apply') {
    // Removed in v0.9 — overlapped with install. To install a
    // cluster's sub-domains: kdna install @scope/cluster-name
    error(
      'kdna cluster apply was removed in v0.9.\n' +
        'To install a cluster (which installs all its sub-domains):\n' +
        '  kdna install @aikdna/animation',
    );
  } else {
    error(`Unknown cluster subcommand: ${sub || '(none)'}\nUsage: kdna cluster lint <path>\n       kdna cluster init <name>`);
  }
}

module.exports = {
  cmdCluster,
};
