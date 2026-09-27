import type { MethodBinding, NativeMethodBindingTarget } from '@aikdna/kdna-core';
const native: MethodBinding = {component_ref:'c',role:'authored',target:{kind:'exception',id:'e'}};
const profile: MethodBinding = {component_ref:'c',role:'authored',target_ref:'j'};
const local: NativeMethodBindingTarget = {kind:'actor',id:'a'};
// @ts-expect-error mutually exclusive even for a structurally assignable variable
const both: MethodBinding = {component_ref:'c',role:'role',target:{kind:'exception',id:'e'},target_ref:'j'};
// @ts-expect-error exactly one target required
const absent: MethodBinding = {component_ref:'c',role:'role'};
// @ts-expect-error native binding cannot target an external identity
const external: NativeMethodBindingTarget = {kind:'actor',id:'a',asset:{asset_id:'a',asset_version:'1',judgment_version:'1'}};
// @ts-expect-error new registry kinds were not silently added to native binding
const plan: NativeMethodBindingTarget = {kind:'plan_node',id:'p'};
void [native,profile,local,both,absent,external,plan];
