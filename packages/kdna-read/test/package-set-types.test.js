'use strict';
// Keep the existing public type-consumer positive and @ts-expect-error controls
// in the default package test command. TypeScript is the root's pinned dev tool.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{spawnSync}=require('node:child_process');
for(const mode of ['Node16','NodeNext'])test('PackageSet strict TypeScript consumer '+mode,()=>{
 const result=spawnSync(process.execPath,[require.resolve('typescript/lib/tsc.js'),'--noEmit','--strict','--module',mode,'--moduleResolution',mode,'--target','ES2022',path.join(__dirname,'package-set-types.test.ts')],{encoding:'utf8',cwd:path.resolve(__dirname,'../../..')});
 assert.equal(result.status,0,result.stdout+result.stderr);assert.equal(result.signal,null);
});
