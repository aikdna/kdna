#!/usr/bin/env node
'use strict';

// Internal compatibility shim retained for older source checkouts. The
// published package does not expose a competing `kdna` binary; all command
// handling delegates to the current @aikdna/kdna-cli entrypoint.
require('@aikdna/kdna-cli/src/cli.js');
