
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),os=require('node:os'),{spawnSync}=require('node:child_process');
const F=require('../../../conformance/public-contract/test/bytes-fixtures.cjs');
const {coreDir}=F.runtime(process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'));
for(const mode of ['Node16','NodeNext'])test('native binding strict mutually exclusive public types '+mode,()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'native-types-'));
 try {
  const config={compilerOptions:{noEmit:true,strict:true,exactOptionalPropertyTypes:true,module:mode,moduleResolution:mode,target:'ES2022',paths:{'@aikdna/kdna-core':[path.join(coreDir,'src/public-contract/types.d.ts')]}},files:[path.join(__dirname,'public-native-binding-types.ts')]};
  const file=path.join(dir,'tsconfig.json');fs.writeFileSync(file,JSON.stringify(config));
  const x=spawnSync(process.execPath,[require.resolve('typescript/lib/tsc.js'),'--project',file],{encoding:'utf8'});assert.equal(x.status,0,x.stdout+x.stderr);assert.equal(x.signal,null);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
