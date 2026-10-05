"use strict";
// Controlled producers hold immutable metadata; arbitrary thrown values are never inspected.
const failures=new WeakMap();
function register(error,code,diagnostic=null,kind='section') {
 const held=diagnostic===null?null:Object.freeze({field:diagnostic.field??null,subject:diagnostic.subject??null});
 failures.set(error,Object.freeze({code,diagnostic:held,kind}));return error;
}
function fail(code,diagnostic=null,kind='section') {
 const error=new Error(code);register(error,code,diagnostic,kind);throw error;
}
function info(error){return failures.get(error)??null;}
module.exports={register,fail,info};
