> R2 definition reference for this unpublished implementation candidate. This is the accepted definition text, retained with its original submission-time wording for precise traceability. The implementation version, proof scope, and migration contract are recorded in the public R2 README; historical private paths are provenance only and are not runtime dependencies.

# R2 封闭引用与所有权登记

本表是候选的完整目标种类，不是发布格式。`Ref={kind,id,asset?:AssetIdentity}`；省asset只指本文件，提供asset须有既有AssetIdentity三个字段asset_id/asset_version/judgment_version；读句柄另绑定实际A/C摘要，不把假摘要写入静态引用。不得写latest或用题名匹配。每kind内ID全资产唯一、稳定；跨kind同ID不冲突。数组位置从来不是目标身份。外部引用固定但未取到时是unresolved_external，不假装本地存在。

以下“必读”指所选对象理解所需；原始来源全文、私人文件不因存在引用自动公开。目标描述与正文各按Host权限处理。局部本地引用缺目标或错kind拒绝准入；外部存在性未证明可明确保存引用，但必要外部正文不可取得时不得完整采用。

|kind|身份和唯一正文位置|拥有者/允许引用|必要读取|
|---|---|---|---|
|asset|M.asset_uid；外部加完整身份|文件根；用途、历史、来源沿革|基本身份/名称/简介/范围|
|judgment|P.judgments[].id|资产；目录/关系/依赖/案例/修订|focus唯一名称，选题完整语义|
|result|id=所属Judgment.id；J.result|该题；result_text、组件、案例输入|结论唯一实际结果，规则不得存在|
|contract|J.result_contract.id或P.contracts[].id，恰一所有者|ResultContract沿旧用途；P中的EmissionListContract仅限其policy指定merge输入|合同类型与正文必读；所有合同ID全局唯一，专用合并合同不能当普通结果合同|
|condition|P.conditions[].id；{id,owner_ref,expression:既有Condition}|owner_ref仅asset/judgment/policy/exception之一；限定/分支/终止|所有用到的完整条件；expression原义与执行限制保持|
|component|J.method.components[].id|该题；单元、理由及修订|实际方法所有必要/已声明相关角色|
|unit|J.method.units[].id|该题；同题use|角色引用、输入输出及合同|
|plan|J.method.plan.id|该题；修订|完整控制/流关系|
|plan_node|J.method.plan.nodes[].id|唯一Plan；端口、links、反馈、policy合并|实例身份和必需定义；judgment_use目标完整必读，不把unit当实例|
|policy|J.formation_rule.policy.id|规则题；branch/修订|整组组合合同，不单取一个候选冒充全部|
|branch_entry|policy.entries[].id|唯一policy；部分结果/发射追溯|when/then/priority及其必要目标|
|candidate|policy.candidates[].id|唯一policy；Entry/排他组|实际值及条目合同|
|material|P.materials[].id|资产；kernel/题/组件/理由/案例|必要定义/前提正文；可选出处按需|
|shared_declaration|P.shared_declarations[].id|资产；J.content_uses/修订|主体、作用域、声明原文、采用角色|
|boundary|常驻P或J.boundaries内id，或Exception.effect.replacement.id|常驻拥有者或唯一Exception|正文加activation，替代体不能常驻|
|exception|P.exceptions[]或J.exceptions声明内id，恰一位置|资产/题；boundary双向授权|目标、条件、作用范围及替代体|
|misuse|P.misuse[]或J.misuse声明内id|资产/题；修订/相关题|实际相关误用说明|
|reason|P.reasons[].id|资产；题/组件/修订|支持/反对/限定等角色及必要依据|
|source|P.sources[].id（既有SourceRef）|资产；材料、SourceUse、案例|声明的身份/版本/摘要；不等于原件全文|
|source_use|P.source_uses[].id|资产；追溯/修订|来源与目标的角色关联|
|resource|P.resources[].id（沿原资源映射）|资产；材料/案例|必要受支持内容按权限；不自动执行/下载|
|relationship|P.relationships[].id|资产；组织/修订|R08元组及按方向需要的端点|
|dependency|P.dependencies[].id|资产；组织/修订|输入角色、端口和required生产者|
|example|P.examples[].id|资产；示例索引/修订|情境、采用版本、结果与必要记录|
|example_result|Example.results[].id|唯一案例；comparison_ref/修订|结果身份/值/合同；comparison限同案例预期|
|revision|M.history.entries[].id|资产；previous/修订索引|受影响对象身份与实际历史覆盖|
|actor|P.actors[].id|资产；Subject/Attribution/Boundary/修订|准确角色与身份，不从creator推断代表谁|

已存字符串ID字段是有类型的简写，例如J.material_refs只能指material、Boundary.exception_refs只能指exception、Subject.actor_ids只能指actor。其他跨种类字段必须Ref对象，不由ID前缀猜kind。QualifiedJudgmentRef允许`{kind:'local',judgment_id}`或`{asset:AssetIdentity,judgment_id}`。上述两种简写在IR中无损正规化为Ref；不产生第二份正文。

引用正文可以嵌套，但身份必须登记。ResultContract内嵌子Shape不是独立对象，按稳定字段名路径定位；条件不再匿名内联。R1统一P.contracts承载端口/条目/案例附加合同，J.result_contract保持唯一原所有权。同合同复用指同一id，不在P再抄一份。

允许引用者限字段字典与组合规则指定种类。`revision.affected_refs`可以指本表任一kind；过去已删除对象须固定旧版本。`core_expression.qualification_refs`仅condition/boundary/material/shared_declaration。`component.content_ref`仅result/material/shared_declaration/reason/component；引用组件链必须无环，最终有非空正文或明确文本结果，不能靠互引制造内容。

SourceUse旧target_kind按新表进行**显式版本扩展**：保留judgment/reason/material/method_component，method_component在IR正规化为component；新增example/example_result/shared_declaration；新增对象不得塞进旧target_kind。来源内容是否实际发生由记录证明，引用存在只证明有声明。案例外部旧题不得仅改asset.version就冒称当前版复验。

必要闭包按有向引用和R08/作用域规则求固定点，访问键为完整AssetIdentity+kind+id，同身份只送一次。循环共同引用不无限展开；调用Plan不能因此获得递归执行能力。需要的外部目标获取另经Host明确允许，当前Read不为引用自动联网。缺权限、超预算、未知关键语义、必要外部未取得分别报告，不用空集合填充。

R2：component.material_refs是新增Ref[]，每项必须kind=material的对象；本页旧字段字符串简写规则不适用于它。observed的真实记录可留创作侧；公开SourceRef/SourceUse可省，不把省略视为未发生、示意或已独立核验。披露了来源才按本表解析其真实对应，不要求公开原件。

## RC7 native method binding (S12-REPAIR-NATIVE-01)

MethodBinding has exactly one of two targets. The CS2 opt-in branch retains
{component_ref,role,target_ref}; target_ref is the owning judgment and every
binding remains in the existing all-role digest. The native branch is
{component_ref,role,target:{kind,id}} on a component without CS2 opt-in. No
asset member, mixed target forms, guessed kind or automatic old-byte migration
is allowed. component_ref always belongs to the declaring judgment.

Native target kinds are actor, judgment, reason, source, source_use, resource,
material, relationship, dependency, contract, component, boundary, exception and
misuse: the fourteen old registered kinds, with result_contract mapped to
contract and method_component to component. New registry kinds are not admitted
by this binding. Both kind and id select exact local identity; same IDs across
kinds remain distinct. Duplicate component/role/typed-target records reject;
different author roles remain distinct.

The component has a mandatory edge to its native target. Existing typed
fixed-point closure applies to selected judgments and direct component expansion,
including recursive exception/boundary/condition/actor support. Cycles deduplicate
without weakening the separate component content_ref cycle ban. Every required
body remains subject to Host scope and complete budget checks. These relationships
are static authored support, never execution, permission or automatic retrieval.
