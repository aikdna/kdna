'use strict';
// B3 protected source transport.
//
// One prepared token belongs to one source opening. The token is created before the
// trusted Host is called, handed to the Host inside that call, and consumed at most
// once. The disclosure model is the accepted protection one: `none`, or
// `trusted_host` carrying an `external_commit` of `not_invoked` / `outcome_unknown`
// / `confirmed`. Nothing here can retract a handoff that already happened, and a
// late or repeated attempt cannot produce a second side effect.
const { randomUUID } = require('node:crypto');
const { freeze } = require('./strict-input.js');

const states = new WeakMap();

function notInvoked() {
  return freeze({ state: 'not_invoked' });
}

function noneDisclosure() {
  return freeze({ kind: 'none', external_commit: notInvoked() });
}

function openSourceDelivery(owner) {
  const token = Object.freeze({});
  states.set(token, {
    token,
    owner,
    phase: 'open',
    handoff: null,
    attemptId: null,
    attemptedAt: null,
    confirmedAt: null,
    closed: false,
  });
  return token;
}

function stateOf(token) {
  if (!token || typeof token !== 'object') return null;
  return states.get(token) ?? null;
}

// The accumulated private history. A failure never erases a confirmed handoff and
// never invents a timestamp: a `confirmed` state keeps the real attempt time and a
// nullable confirmation time.
function disclosure(state) {
  if (!state || !state.handoff) return noneDisclosure();
  return freeze({
    kind: 'trusted_host',
    at_ms: state.handoff.at_ms,
    external_commit: freeze({ ...state.handoff.external_commit }),
  });
}

// Records that the trusted Host callback is being entered. This is disclosure
// history, not an external commit: the sink may still never be invoked.
function recordHandoff(state, atMs) {
  if (!state || state.handoff) return;
  state.handoff = { at_ms: atMs, external_commit: { state: 'not_invoked' } };
}

// Marks the unknown outcome BEFORE the sink is invoked, so a throw or a false
// return cannot masquerade as "nothing happened".
function beginCommit(state, nowMs) {
  if (!state || state.closed || !state.handoff) return false;
  if (state.phase !== 'open') return false;
  state.phase = 'pending';
  state.attemptId = 'source-attempt:' + randomUUID();
  state.attemptedAt = nowMs;
  state.handoff.external_commit = {
    state: 'outcome_unknown',
    attempt_id: state.attemptId,
    attempted_at_ms: nowMs,
  };
  return true;
}

// Only a synchronous `true` confirms the handoff. Anything else stays
// `outcome_unknown`, because the bytes may already have reached the sink.
function settleCommit(state, confirmed, nowMs) {
  if (!state || state.phase !== 'pending') return;
  state.phase = confirmed ? 'committed' : 'failed';
  state.confirmedAt = confirmed ? nowMs : null;
  if (confirmed) {
    state.handoff.external_commit = {
      state: 'confirmed',
      attempt_id: state.attemptId,
      attempted_at_ms: state.attemptedAt,
      confirmed_at_ms: state.confirmedAt,
    };
  }
}

// At the instant the owning source callback settles, every unconsumed token is
// closed: a prepared token cannot be replayed after its owner ended.
function closeSourceDelivery(state) {
  if (!state) return;
  state.closed = true;
  if (state.phase === 'open') state.phase = 'closed';
}

function hadPendingCommit(state) {
  return !!state && state.phase === 'pending';
}

module.exports = {
  openSourceDelivery,
  stateOf,
  disclosure,
  recordHandoff,
  beginCommit,
  settleCommit,
  closeSourceDelivery,
  hadPendingCommit,
  noneDisclosure,
};
