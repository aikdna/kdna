'use strict';
const {admitReadRequest}=require('./admission.js');
const {project}=require('./project.js');
const {projectModelView,MODEL_VIEW_CONTRACT}=require('./model-view.js');
module.exports={admitReadRequest,project,projectModelView,MODEL_VIEW_CONTRACT};
