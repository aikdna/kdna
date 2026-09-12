'use strict';
const {admitNode}=require('@aikdna/kdna-core/node');
const {runRead}=require('./pipeline.js');
async function readNode(input,candidate,controlProvider,host){return runRead(admitNode,input,candidate,controlProvider,host);}
module.exports={readNode};
