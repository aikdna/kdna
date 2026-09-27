import test from 'node:test';
import assert from 'node:assert/strict';
import {registeredCaseIds} from './proof-inventory.mjs';
test('comment, string and template claims are not proof case registrations',()=>{
 const source=`// check('FORGED-A',()=>true)\n/* check('FORGED-B',()=>true) */\nconst s="check('FORGED-C')"; const t=\`check('FORGED-D')\`; check('REAL',()=>true);`;
 assert.deepEqual(registeredCaseIds(source,'check'),['REAL']);
});
test('the configured callee and actual literal argument are required',()=>{
 assert.deepEqual(registeredCaseIds("record('R',true);check('C',true);check('prefix-'+suffix);",'record'),['R']);
 assert.throws(()=>registeredCaseIds("check('unterminated",'check'),{code:'PROOF_INVENTORY'});
});
