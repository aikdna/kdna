const { error } = require('./_common');

function cmdCompare(args) {
  const { cmdCompare } = require('../compare');
  const target = args.filter((a) => !a.startsWith('--'))[1];
  if (!target || !args.includes('--input')) {
    error(
      'Usage:\n' +
        '  kdna compare <name> --input "<text>"\n' +
        '\n' +
        'Runs your input through the LLM twice (with/without KDNA loaded),\n' +
        'then diffs the reasoning trajectory. Requires ANTHROPIC_API_KEY or\n' +
        'OPENAI_API_KEY in the environment.',
    );
  }
  (async () => {
    try {
      await cmdCompare(target, args);
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
  })();
}

function cmdDiff(args) {
  const { cmdDiff } = require('../diff');
  const positional = args.filter((a) => !a.startsWith('--'));
  const a = positional[1];
  const b = positional[2];
  if (!a) {
    error(
      'Usage:\n' +
        '  kdna diff <name>@<v1> <name>@<v2>   Compare two versions\n' +
        '  kdna diff <name>                     Installed vs registry-current\n' +
        '\n' +
        'Surfaces judgment-level diff: added/removed/changed axioms,\n' +
        'misunderstandings, banned terms, stances.',
    );
  }
  (async () => {
    try {
      await cmdDiff(a, b);
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
  })();
}

function cmdSearch(args) {
  const { cmdSearch } = require('../search');
  const query = args.slice(1).join(' ').trim();
  cmdSearch(query);
}

function cmdAvailable(args) {
  const { cmdAvailable } = require('../agent');
  cmdAvailable(args);
}

function cmdMatch(args) {
  const { cmdMatch } = require('../agent');
  const positional = [];
  const flags = [];
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) flags.push(args[i]);
    else positional.push(args[i]);
  }
  cmdMatch(positional.join(' ').trim(), flags);
}

function cmdLoad(args) {
  const { cmdLoad } = require('../agent');
  const target = args.filter((a) => !a.startsWith('--'))[1];
  if (!target) error('Usage: kdna load <name> [--as=prompt|json|raw]');
  cmdLoad(target, args);
}

module.exports = {
  cmdCompare,
  cmdDiff,
  cmdSearch,
  cmdAvailable,
  cmdMatch,
  cmdLoad,
};
