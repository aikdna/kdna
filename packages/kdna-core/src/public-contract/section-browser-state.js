'use strict';

// Requests and snapshots keep their original section-native-state owner.
// Browser embedding authorities have their own single private registry.
module.exports = { authorities: new WeakMap() };
