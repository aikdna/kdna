> R2 definition reference for this unpublished implementation candidate. This is the accepted definition text, retained with its original submission-time wording for precise traceability. The implementation version, proof scope, and migration contract are recorded in the public R2 README; historical private paths are provenance only and are not runtime dependencies.

# R2 共同组合合同（候选，未独立接受）

R2仅修订R1独审的F1/F2/F4；R1已关闭语义保留，不改义已发布版本。新结构为 P，Owner 产品要求为 U。保存静态判断不授权 Core/Read 求值或行动。身份见 [引用登记](REFERENCE-REGISTRY.md)，读取见 [公开投影](PUBLIC-PROJECTION.md)。

## R01 正式成题

共创和 Agent 独立创作同一标准：完整问题、结论或完整形成规则、三维各单选、真实必需角色与限定齐全。缺内容先研究或按需访谈，最终不完整则不进入成品。缺必要题导致资产用途无法实现时，整份未完成。不得增材料兜底、未知方法或默认其他。

个人偏好本身可作感受依据，无需虚构心理原因或证明真理。历史结论不得编依据；后续研究贡献按实际作者和采用关系注明，不倒写为历史作者思想。完整规则无本次输入仍可成题。

## R02 三维和综合完整性

形态 conclusion/rule、回答 AnswerKind、方法 MethodKind 各一值。17类与相邻排除继承单议题稿3/4节，覆盖见 COVERAGE。分类看实际/承诺交付意义，不看 text/number。

综合回答：answer_parts 至少2项；part.id及output_field分别在题内唯一；至少2种不同非综合回答类型。整体结果为record，所有绑定字段 required=true。结论实际交付全部字段；规则逐项给形成职责和输出绑定。预先定义有标记的“不适用”等合法状态可以交付；遗漏字段不算状态。为最后选择而做中间排序，不自动成为综合。

综合方法：至少2种不同基础方法，有独立作用，实际可达并作用于最终交付。只声明不用、装饰第二单元、同方法用两次均不算综合。judgment_use可沿固定目标题取得其实际方法与角色计入组成；仅引用题名不计。仅由跨题采用组成时本题components/units可空，但目标题必要角色必须完整可读；不凭空另造副本。可达性可查，独立作用须内容审阅。非综合显式计划可以复用同一种方法，但不能藏入另一种基础方法。

## R03 核心表达

result_text 直接读本题唯一文本结果；authored 是作者维护的核心表达，和展开同版核对。结论核心给决定性答案，规则核心给形成答案的办法。排序结论是“A、B并列优先，C次之”；排序规则才是“先按可靠性分档，再按成本排序”。

qualification_refs 只能指condition/boundary/material/shared_declaration，全部进入必要闭包。不得省掉会改变主张的限定，不截首段，不现场摘要，不设第二份可独立修改的“完整判断原文”。复杂结果仍完整保存于Result。20–40汉字是编辑目标，约60字以上应复核，不是公共截断阈值。

## R04 定义、采用实例及组合输出

Unit是可复用方法定义，Node是某一次采用；二者身份分开。

```text
MethodUnit={id,method:基础MethodKind,component_refs:ID[1..n],inputs:Port[],outputs:Port[],other?}
Port={name:ID,meaning:Text,contract_ref:contract Ref}
Plan={id,root:plan_node Ref,nodes:Node[1..n],links:FlowLink[],result_bindings:ResultBinding[1..n]}
Node={id,kind:'use',unit_ref:unit Ref,input_bindings:InputBinding[]}
   | {id,kind:'judgment_use',judgment_ref:QualifiedJudgmentRef,input_bindings:InputBinding[]}
   | {id,kind:'sequence'|'parallel',children:plan_node Ref[]}
   | {id,kind:'branch',policy_ref:policy Ref}
   | {id,kind:'feedback',body:plan_node Ref,state:StateSlot[1..n],updates:FeedbackUpdate[1..n],
      termination:Termination,output:Endpoint,on_missing_feedback:Text}
Endpoint={node_ref:plan_node Ref,port:ID,field_path:ID[]}
InputBinding={port:ID,from:{kind:'input',name:ID}|{kind:'literal',value:SemanticValue}
              |{kind:'state',feedback_ref:plan_node Ref,slot:ID}}
FlowLink={from:Endpoint,to:Endpoint}
ResultBinding={from:Endpoint,field_path:ID[]}
StateSlot={name:ID,contract_ref:contract Ref,initial:SemanticValue}
FeedbackUpdate={from:Endpoint,state_slot:ID,next_input:Endpoint}
Termination={kind:'condition',when:condition Ref,handling:Text}|{kind:'ongoing',handling:Text}
```

Node.id在全资产plan_node命名空间唯一；每个Node属于一个Plan。children/body及branch的专用merge关联构成有限有根树，除根外恰有一个控制父节点。sequence至少1子节点，parallel至少2。Unit可多次采用，每次不同Node.id；unit_ref限同题，跨题采用通过judgment_use，不跨题猜单元归属。

Use端口来自Unit；judgment_use来自目标J.ports；branch只有result输出，合同为policy.result_contract_ref；feedback只有result输出，合同来自output指定体内端口。sequence/parallel无数据端口。产生新合并值须显式Use，实际合并说明和输入/输出均有身份，删除R0隐含combine_ref。

field_path=[]指完整值，非空按record字段寻址，不按易漂移数组位置。每个必需输入恰一个提供者（input_bindings、links、反馈next_input不得竞争）；反馈initial/update属于同一跨轮提供者。InputBinding.from=state与对应FeedbackUpdate.next_input也是同一提供者的初始化/更新路径，必须同feedback_ref、同slot、同输入端口，否则拒绝，不能另加普通link。J.inputs={name,meaning,contract_ref}[]保存采用时输入职责，不宣称已取得现场值。

普通links只在同Plan输出→输入，不直连Unit；嵌套容器不改变ID作用域。禁止普通link跨feedback边界，出反馈用feedback.result，进反馈用state或声明的外部输入。parallel兄弟之间不得有先后数据依赖。去掉跨轮updates后，本轮数据流无环。branch输出不能成为本branch的候选或merge输入来源。

result_bindings明确最终结果：空路径只能唯一绑定全结果，非空路径须无重叠并覆盖整体合同全部必需字段，形状相容。结论的Result仍是作者给定值，Plan说明怎样形成而不覆盖此值；规则的绑定描述承诺结果，不伪造已执行。

反馈第0轮用initial，第n轮输出在轮末更新state，只供n+1轮。update来源和output均来自body内部；条件停止明确交付最后完整轮次，ongoing只表达持续方式。缺反馈按on_missing_feedback停留/请求，不把旧值说成新观察。跨题反馈用具名judgment_use；本候选不允许Plan互相递归调用，只允许有限计划中通过state跨轮采用固定目标题。每题方法的因果循环若需任意递归超出本候选，必须报告不支持，不能假装无限执行。

Plan的触发依据是所保存的结构关系：综合方法的组合、具名方法端口/输出分支、多实例的数据连接、或跨轮状态/协调必须有Plan。method=feedback本身不触发Plan。

单步反馈方法可以只声明“本次输入（当前状态、一次反馈）→本次给出的调整建议”，由必要角色完整表达，无需Plan；输入从哪里再次提供由采用方负责，文件不保存跨次状态、不安排持续运行。提及建议可反复采用或用户以后再用，不等于声明内部协调。若资产实际保存初值、将第n轮输出绑定到第n+1轮输入、跨题每轮调用顺序、持续/停止控制或缺反馈后的协调状态，就必须按R04给有限Plan。不能把这些关系留在散文里，称单步方法规避。普通自然语言方法仍允许完整表达，不强迫所有feedback标签递归套计划。

## R05 条件与交付

条件统一存P.conditions，通过condition Ref引用。无分支可无policy。FormationRule.condition_refs是全规则前置；和新policy并存时先满足前置，未判不形成最终结果，不成立为不适用。旧static-policy/1仍按旧互斥、单选含义，迁移须明确，不暗改旧字节。

```text
Policy={id,result_contract_ref:contract Ref,candidates:Candidate[],entries:Entry[1..n],
 match:'first_match'|'all_matches',combine?:Combine,exclusive_sets:Producer[][],
 on_no_match:Terminal,on_conflict:Disposition,on_undetermined:Undetermined}
Candidate={id,contract_ref:contract Ref,value:SemanticValue}
Entry={id,when:condition Ref,then:EmissionSource,priority?:UInt}
EmissionSource={kind:'candidate',candidate_ref:candidate Ref}
              |{kind:'output',from:Endpoint,contract_ref:contract Ref}
Producer=candidate Ref|Endpoint
Combine={kind:'collect',item_contract_ref:contract Ref,duplicates:'preserve'|'producer_identity',
         order:'declaration'|'priority'}
       |{kind:'authored',merge_node_ref:plan_node Ref,input_port:ID,output_port:ID,
          duplicates:'preserve'|'producer_identity',order:'declaration'|'priority'}
Terminal={kind:'value',contract_ref:contract Ref,value:SemanticValue}|Disposition
Disposition={kind:'disposition',code:'defer'|'not_applicable'|'conflict',statement:Text}
Undetermined={kind:'defer',statement:Text}
            |{kind:'partial',independence:Text,statement:Text}
```

每Entry只发射一个完整SemanticValue。output指定本题可达采用实例及端口/record字段；不取所有输出，不自动摊平列表。producer身份是candidate Ref，或Endpoint三个字段的精确组合。被引用方法输出的合同须匹配投影合同；不得依赖本policy的结果。

collect整体答案唯一为SemanticValue.list，items逐项是发射值；每项遵守item_contract，整体合同必须ListShape且item_shape等于item_contract.shape。R1精确规定ResultContract根值计数：text/number/boolean/null/record为1，list为根items数量；嵌套列表另由各ListShape限定。因此collect整体合同minimum/maximum须等于根ListShape数量界限，条目合同约束的是单个发射值自身，不能把一个text item合同拿来校验整个列表。旧版本计数行为须迁移核对，不能凭本句覆盖历史。为支持所有命中组合，列表下限0、上限至少entries数量（或null）；至少一条的业务要求由on_no_match表达。

消费方可以形成以下PolicyOutcome，静态规则不得预填成已运行结果：

```text
complete={kind:'complete',policy_ref:policy Ref,result:Result,emissions:Emission[]}
partial={kind:'partial',policy_ref:policy Ref,item_contract_ref:contract Ref,confirmed:Emission[],pending:branch_entry Ref[],statement:Text}
disposition=Disposition
Emission={producer:Producer,entry_refs:branch_entry Ref[1..n],value:SemanticValue}
```

complete.result遵守整体合同；collect的items与emissions.value同序一一对应。partial不属于Result，不能满足完整交付；partial采用上式固定的PolicyOutcome变体，不允许作者另造包装或把它套入普通ResultContract；全部所列字段必需，policy_ref固定这组规则，item_contract_ref等于collect声明，confirmed每项value受item_contract约束，pending非空。部分身份由kind=partial和policy_ref确定，完整合同仅约束complete.result。具体纸面输出见PAPER-CASES。引用记录在此结构中按REFERENCE-REGISTRY展开，不使用任意包装。

first_match：priority全部必需且唯一，越小越先；combine禁止，发射合同等于整体合同，未判仅defer。前序未判阻止后序和兜底；成功时一条emission。

all_matches：combine必需。collect的declaration按条目声明顺序，priority按唯一优先数。preserve每个成立条目保留一项；producer_identity合并同生产者的entry_refs，输出位置取首个成立条目。不同candidate ID的同值保留，不同采用实例的同值也保留。

authored采用下面的**专用输入合同**，不把原生Emission数组假装成SemanticValue，也不增加任意JSON端口：

```text
EmissionListContract={id:ID,kind:'emission_list',policy_ref:policy Ref}
AuxiliaryContract=ResultContract | EmissionListContract
EmissionListValue=Emission[1..n]     // 原生JSON数组，每项完整字段按R05的Emission
```

P.contracts允许这两种互斥结构；EmissionListContract只有上述三个字段。J.result_contract、Result.contract_ref、Candidate.contract_ref、policy.result_contract_ref和普通端口仍只能指ResultContract。专用合同仅可由其policy指定的merge输入端口引用，禁止用作输出、普通候选合同、现场输入、最终结果或其他Plan端口；不得以literal/普通FlowLink另供该端口。它唯一的提供者是该policy的有序、按策略处理重复后的发射列表。引用仍用kind=contract，实际目标类型也必须核对；ID不重名。

每项Emission保持原生producer Ref/Endpoint、原生branch_entry Ref[]和一个SemanticValue.value，禁止再包成ValueRecord、转JSON字符串或只给value列表。producer及entry_refs仅来自同一policy的本次成立条目；每个值按对应Candidate或output投影的ResultContract验证。因此不同条目可以有不同值形状，合并方法的正文必须说明怎样使用它们，不强迫归为同一种item_shape。专用合同通过policy_ref确定允许的生产者与逐项值合同，不放弃类型约束。原生列表无序列化字段顺序含义，只有数组顺序有意义。

在任何authored合并之前，order与duplicates均必填，含义与collect相同：先按声明顺序，或按各条唯一priority从小到大排列成立条目；再preserve逐条保留，或producer_identity按精确生产者身份合并，位置为该组首条出现处，entry_refs按处理顺序累积。同值不同生产者不合并，同一条目不得重复计入；同一生产者在同一次合并内若声称不同输出值则不满足其单次输出身份，不能任挑一项。先检查已声明排他冲突和未判约束；冲突走on_conflict，未判defer，零成立走on_no_match，这些路径不向merge传空列表或不完整列表。

得到的EmissionListValue原样交给merge_node.input_port；output_port唯一对应整体ResultContract。merge_node必须是Plan中branch专用use，属于branch的专用关联子节点，不同时属于普通children，也不能是本policy条目的生产者。正文须给实际合并办法；输出值按整体合同验证，branch.result与最终绑定取得这个值，不能把输入列表当最终答案。PolicyOutcome.complete.emissions保留该合并输入对应的原生发射记录，complete.result保存合并后的普通Result。只允许defer，不允许partial；这不改变已闭合collect或partial合同。

完整重复生产者、非声明顺序输入及最终输出见review-fixtures/authored-merge.json与authored-merge-expected.json。它们是纸面数据和预期，不表示Core已执行方法。

正常Entry禁止disposition，所以候选值混处置直接拒绝，不自动过滤。所有条件明确false才走on_no_match，其value必须完整遵守整体合同，绝非item。on_conflict只允许disposition。exclusive_sets每组至少2个不同实际条目生产者，同时发射即冲突；不得最后写入胜出。

partial仅可用于all_matches+collect、exclusive_sets=[]、无全局否决/聚合、明确各条独立的情形。未知项可能撤回确认项、改变共同前提、全局限制、合并或排他判断时必须defer。confirmed只是局部值，不是整体通过。自然语言独立性仍需内容审阅。

## R06 共享声明有实际作用范围

Material定义/前提带ID与AppliesTo；词名资产内唯一。P.shared_declarations每项为{id,kind:worldview|value_order|role,subject:Subject,applies_to:AppliesTo,value}。worldview/value_order的value为Text[1..n]，后者顺序表示作者优先序；role为既有RoleDeclarationValue且至少一项provided实质内容。新版禁止同时保留declarations.worldview/value_order/role；迁移后撤销旧正文。highest_question/boundaries保留。

J.content_uses={target:material或shared_declaration Ref,role:adopt|discuss|oppose,statement:Text}[]。adopt必须在AppliesTo内；discuss/oppose不产生采用，也不扩大作用域。对同题同声明既采用又反对，或声明已强加该题却说仅反对，须先修正主体/范围，不能交给消费者选边。所有适用共同声明、所有content_uses目标均必读，读出时保留采用角色。目录不产生继承。

## R07 例外替代体只在条件成立时启用

常驻限制只在P.declarations.boundaries/J.boundaries。Exception={id,boundary_ref,statement,applies_to,when:condition Ref,effect}；目标Boundary.exception_refs须双向认可，例外范围必须是目标子集。

effect={kind:waive}|{kind:replace_limit,replacement:BoundaryBody}。replacement是例外内嵌独占对象，含唯一boundary ID、effect/statement/declared_by/applies_to、exception_refs=[]；禁止同时放常驻列表，禁止替代体再授权新例外。投影activation={kind:exception,exception_ref}，常驻为always。

true才替换/豁免目标；false只适用原限制；unknown仍保留原限制并说明例外待判，不扩大许可。其他限制一律保留。同一目标若同时成立多个例外，明确冲突，不能按位置挑；作者须合并成统一例外或互斥条件。未运行条件时只呈现规则，不声称当前例外已激活。

## R08 固定关系元组、依赖及目录

以下TermRef.term元组为本候选封闭基础合同。每条id必需、2个不同本地题、各角色恰1、statement明确实际关系；不能只写关系名字。

|kind|direction|participants.role|operator|effect|必要读取|
|---|---|---|---|---|---|
|support|directed|supporter,claim|supports|offers_support|选claim完整读supporter；反向至少对端完整问题描述|
|complement|directed|supplement,base|complements|adds_perspective|关系及对端问题描述；必要输入须另声明required依赖|
|qualify|directed|qualifier,qualified|qualifies|limits_interpretation|选qualified完整读qualifier；反向至少对端问题描述|
|conflict|undirected|side_a,side_b|conflicts_with|preserves_disagreement|任一端完整读双方，不强行调和|

方向由角色给定，不另造竞争source/target。effect不改变真伪、置信度或许可。未知关键关系按不支持处理，不默认为普通相关。跨资产联系以固定外部引用保存，本版基础关系图仅本地题。

Dependency保留既有id/producer/consumer_judgment_ref/input_role/data_type/required/purpose。仅producer.kind=judgment_result时新增producer_port/consumer_port，两端J.ports存在且合同相容；原result_contract_ref须匹配生产题合同。producer.kind=source仍指SourceRef，禁止伪填producer_port；consumer_port绑定所需输入且合同/来源必要内容明确，SourceRef身份不能冒充已取得原文。required=true生产者进入必要闭包；不因此自动运行。parent_ref无环森林仅表达目录；reading_order只建议阅读顺序。

## R09 示例与历史

Example由资产拥有，无本地题引用也可取得；adopted_judgments固定版本，local明确当前文件身份。illustrative不能含observed。observed须确有实际发生与观察记录，创作/获准审阅侧应核其真实性；记录、身份及来源说明可以保留在创作侧，成品不强制SourceRef/SourceUse，也不强制附件。作者可发布匿名实际案例并省略公开出处，仍是observed，不能因此改成illustrative。提供SourceRef/SourceUse时必须真实准确、获准披露且目标关系正确；SourceRef本身只声明来源身份，不必包含原件或私人路径。省略出处时，消费者取得的是作者关于实际观察的声明，不能视为独立核验；提供出处同样不自动构成独立核验。本规则不新增公开必填证明字段。results非空，结果ID全资产唯一，有值者contract_ref必需。observed.comparison_ref如提供须指同案例expected且合同相同，不能覆盖预期。

示例保存partial时用{kind:partial,observation_kind:expected|observed,outcome:R05.partial}，其身份与完整结果不同；示意仍不能标observed。SourceRef不是Material，也不是认同或行动授权。

M.history={coverage:complete|partial,statement,entries:RevisionEntry[]}。entry={id,version,judgment_version,at,summary,affected_refs,previous?,actor_refs[]}，affected_refs非空。deleted/旧版目标用固定旧AssetIdentity，不指不存在的当前ID。仅改案例也精确指example，不自动升级旧案例采用版本。partial写清未覆盖历史；complete不意味着包内包含全部历史字节。

## R10–R12 读取、修订、证据边界

必要语义见引用登记/公开投影，拒绝、预算、不支持、缺外部内容如实报告。修改共同内容沿引用及AppliesTo核对；旧版固定引用不自动最新。Subject/Actor/Attribution/SourceUse承接作者、整理、代表、来源角色，不新增五个人物必填标签。采用者意愿和行动权限仍属实际采用/Host，不由文件自授。

格式、忠实表达、工具支持、实际任务效果、Reader体验分别判断。纸面候选不证明工程实现，不承诺自动判真、所有方法执行或永不演进。

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
