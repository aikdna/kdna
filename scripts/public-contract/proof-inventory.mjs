import {createRequire} from 'node:module';
import path from 'node:path';
// This is a declaration inventory, never an execution receipt. Only syntactic
// call expressions register literal case ids; comments/strings/templates cannot.
export function registeredCaseIds(text,callee,file='gate.cjs',dependencyRoot) {
 const require=createRequire(dependencyRoot?path.join(dependencyRoot,'package.json'):import.meta.url);
 const ts=require('typescript');
 const source=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 if(source.parseDiagnostics.length)throw Object.assign(new Error('Invalid proof gate syntax: '+file),{code:'PROOF_INVENTORY'});
 const ids=[];
 function visit(node){
  if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text===callee&&node.arguments.length&&ts.isStringLiteral(node.arguments[0])){
   const id=node.arguments[0].text;if(id&&!id.endsWith('-'))ids.push(id);
  }
  ts.forEachChild(node,visit);
 }
 visit(source);return ids;
}
