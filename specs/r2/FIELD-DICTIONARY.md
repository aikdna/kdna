> R2 definition reference for this unpublished implementation candidate. This is the accepted definition text, retained with its original submission-time wording for precise traceability. The implementation version, proof scope, and migration contract are recorded in the public R2 README; historical private paths are provenance only and are not runtime dependencies.

# R2 候选字段字典

本表与 COMPOSITION、REFERENCE-REGISTRY、PUBLIC-PROJECTION 共同构成 R2 候选；后者分别负责组合、身份、读出。本表是拟进入下一版共同合同的精确落点，不是已实施 Schema。`J` 指 Judgment，`P` 指 Payload，`M` 指 Manifest。`U/C/P` 决定身份见 README。现有未列出的容器、密码、授权及结果基础字段继续按其现有合同保留，不由本表另造替代。

## 1. 全表共同约束

- 名称为候选实际字段路径，不是 Reader 的私有属性。新增或改义字段均标 `P`；旧版本不得按新义解释。
- `Text` 为非空自然语言字符串；不以问号字符机械证明是问题。技术 Unicode/字节限制继承受版本管理的公共预算，内容超预算拒绝完整交付，不截断。代码式条件只保留明确支持的现有 Condition 类型，文本不获得执行权限。
- `ID` 是稳定身份；本地 `Ref` 精确指向 `{kind,id}`，其中 kind 为本表对象种类。外部引用采用 `{asset:AssetIdentity,kind,id}`，固定版本。不得由标题匹配、默认最新版本或自动获取代替解析。
- 对嵌套 Result 没有独立作者 ID 的既有结构，`{kind:'result',id:Judgment.id}` 明确指该题唯一 Result，不是按全局名称猜节点；IR 投影应保留这一确定映射。QualifiedJudgmentRef 固定为 `{asset:AssetIdentity,judgment_id:ID}` 或明确本包内 `{kind:'local',judgment_id:ID}`，不默认外部最新版本。
- `AppliesTo = {kind:'asset'} | {kind:'judgments',judgment_refs:ID[1..n]}`。指定议题列表不可为空；集合中引用必须真实存在。全资产声明的作用不通过目录继承获得。
- `Declared<T>` 复用 state=provided/value 与 none、unknown、not_applicable/null 的声明区分。字段遗漏属于未提供；不自动改成 none。必需的正向内容只能 provided；unknown 不是分类或方法。读取 denied/unsupported/not_in_mode/未送达属于读取状态，不能写回为作者声明。
- 对普通可空数组，新成品在对应负责位置明确 `[]` 表示没有该类条目；继承的Declared包装无内容时用state=none,value=null，不用provided空数组；旧字段遗漏迁移时不自动改为 `[]`，先核创作记录。未知是否具有必要内容的情况留在创作，不能宣称完整。
- 身份、同版绑定和字段齐全可机械检查；语义忠实、问句是否成立、分类是否贴合需内容核对。不声称 Schema 可以决定所有自然语言问题。
- 公开读取代号：`A`=资产层明确供给；`D`=目录允许披露的真实问题；`J`=所选议题及其必要共同内容；`X`=按需受授权展开。表中的 A/J 是新候选读取要求，不能冒称旧 whole_asset 已完整提供。

## 2. 议题字段

| 编号/候选路径 | 类型与数量/必需性 | 含义、唯一来源和组合 | 决定/旧新对应 | 读取 |
|---|---|---|---|---|
| T01 J.id | ID，1 | 工具维护身份，显示名改变不改变该身份 | C 保留 | D/J |
| T02 J.focus | Text，1 | 作者唯一完整问题；目录、详情同源 | U；保留 focus，停用 label | D/J |
| T03 J.form | conclusion/rule，1 | 作者给结论还是给规则 | U/C 保留 | J |
| T04 J.answer_kind | AnswerKind，1 | 回答语义；不是 text/number 编码 | U 要求/P 新字段 | J |
| T05 J.answer_parts | AnswerPart[2..n]，仅综合必需，其余禁止 | 各部分独立职责与结果字段绑定，不能把证据算第二种回答 | P 新；无旧默认值 | J |
| T06 J.answer_other | OtherDefinition，仅其他必需 | name/definition/exclusion_reason，三个 Text；没有新枚举权限 | U 要求/P 结构 | J |
| T07 J.core_expression | CoreExpression，1 | 作者确定唯一题头来源；没有首段/打开时摘要回退 | U 职责/P 新结构 | J |
| T08 J.subject / J.scope | 原有 Subject / Scope，各1 | 代表谁、适用何处；不从 creator 或 parent 猜 | C 保留；整体限制组合见 B | J |
| T09 J.result_contract | 原有 ResultContract，1 | 保留类型、形状、数量、含义；数值单位与排序规则等由必要定义绑定 | C 保留 | J |
| T10 J.result | 原有 Result，结论1/规则禁止 | 作者的实际答案，复杂列表/表格完整保留 | U/C 保留 | J |
| T11 J.formation_rule | FormationRule，规则1/结论禁止 | 形成办法；statement 是展开说明，不充当第二个题头 | U/C 承接，P 职责细化 | J |
| T12 J.method | MethodUse，1 | 顶层一个形成方式，必要角色真实齐全 | U 必需/P 从旧可选升级 | J |
| T13 J.material_refs / reason_refs | ID[0..n] | 必需定义/前提/支持/反对/限定等有实际归属；不用于缺方法兜底 | C 保留，P 完整供给规则 | J/X |
| T14 J.boundaries / exceptions / misuse | 既有声明类型，存在必要内容时必需 | 本题限制及例外，准确目标见 B | C 承接/P 引用补强 | J |
| T15 J.parent_ref | 本地议题 ID 或 null，1 | 目录父级，无自环或循环；顶层显式 null | C 承接；迁移无父=根须有来源 | D/J |
| T16 J.lifecycle | 既有 Lifecycle，明确状态时1 | active/deprecated/superseded/withdrawn；无声明不猜 active | C 保留 | D/J |
| T17 J.formation_rule.policy | ConditionalPlan，0..1 | 需要配对分支时使用，详见组合规则；不与同义旧模块叠加 | P 新；原 static-policy 仍可按旧义承接 | J |
| T18 J.formation_rule.condition_refs | condition Ref[0..n]，1集合 | 正文统一 P.conditions；统一前置与新policy按R05组合；旧static-policy/1原义不变 | P 显式迁移 | J |
| T19 J.ports / J.inputs | JudgmentPort[] / InputDefinition[]，各1集合，可空 | 端口含name/meaning/direction/contract_ref及input_role或result_field；inputs含name/meaning/contract_ref；有流时必须实际绑定 | P，完整语义见R04 | J |

`CoreExpression = {kind:'result_text'} | {kind:'authored',statement:Text,qualification_refs:Ref[0..n]}`。result_text 只允许结论且 Result.value 是文本，题头直接取该唯一文本。长/结构化结论及规则采用 authored；必要限定引用随题头可发现且不能造成误导。没有另一篇可独立修改的“题头全文”。核心句修改与结果/规则同一修订核对。选择引用型不能用截取让长文本假装简短。

`AnswerPart={id,kind:非综合AnswerKind,output_field,other?:OtherDefinition}`。id和output_field分别唯一，至少2种不同回答类型；整体record对应字段required=true，实际结果或规则承诺全部交付，详R02。

`JudgmentPort={name,meaning,direction:input|output,contract_ref:contract Ref,input_role?,result_field?:ID|null}`。input必须有input_role并指J.inputs真实name；output必须有result_field，null为全结果，否则为已命名record字段。端口名称题内唯一。输入合同与J.inputs一致，输出合同与结果对应字段相容。

### 三维候选稳定编码

中文类别及单选要求已确认；下列 ASCII 编码为 P，不是旧工作编号的自动发布。

- 形态：结论=conclusion；规则=rule。
- 回答：判定=determination；分类=classification；评价=evaluation；状态=status；诊断=diagnosis；估计=estimate；预测=prediction；适用=applicability；排序=ranking；选择=selection；调整=adjustment；解释=interpretation；立场=stance；偏好=preference；指导=guidance；综合=composite；其他=other。
- 方法：观察=observation；识别=recognition；对照=criteria_comparison；权衡=tradeoff；推理=inference；排除=elimination；因果分析=causal_analysis；计算=calculation；推演=simulation；证据分析=evidence_analysis；解读=interpretation；反馈调整=feedback；类比=analogy；感受=feeling；经验=experience；综合=composite；其他=other。

相邻类别定义仍以单议题稿第 3/4 节为准；本表不缩掉排除条件。选择从实际交付含义判定：未来数量预测归 prediction，已知时间数量估计归 estimate；借排序选一个方案不自动成为综合；单纯多对象偏好不自动成为排序或综合。类比须有参照对应，提及过去不自动是类比；感受无需虚构心理成因。

## 3. 机制字段

| 编号/候选路径 | 类型/必要性 | 来源与约束 | 旧新/读取 |
|---|---|---|---|
| H01 J.method.method | 1 TermRef，term 为上述 MethodKind | 作者实际形成方式；核心词义固定，不从组件反推 | U/C 承载/P 词义与必需，J |
| H02 J.method.components | MethodComponent[0..n] | 正式成题必要角色均有内容；纯跨题组合允许从具名目标题取全角色，其余至少1项；简单感受可引用唯一结果文本 | C 承接/P 必需，J |
| H03 component.id / method | 原 ID / TermRef | 组件身份和内容方法，保留旧 profile 不冒充新角色 | C 保留，J |
| H04 component.role | 固定 RoleName，1 | 采用单议题稿第 10.2 表的必需/可选角色词名；每个基础方法单元独立核对 | P 新，J |
| H05 component.statement / content_ref | Text 或 Ref，恰选一个 | 作者写定的内容或同一声明引用，不能空卡；result-text 引用只能明确指本题结果文本 | P 承接 statement，J |
| H06 component.material_refs | Ref[0..n] | 明确支持此组件的实际材料，新增字段必须用material Ref对象，不接受旧字段字符串简写；不是编造方法的替代路径 | P 承接既有材料职责，J/X |
| H07 J.method.bindings | MethodBinding[0..n]，RC7 互斥目标 | CS2 opt-in 保留本题 target_ref 与全部 role 摘要；无 opt-in native 使用本地 target:{kind,id}，组件到目标必要闭包；禁止混用、猜 kind、外部身份及完全重复，不能当数据流、权限或时序 | C 原样保留，J 与组件展开必要闭包 |
| H08 J.method.units | MethodUnit[0..n]，显式计划必有集合；仅跨题采用时可空 | 顶层综合至少2种实际采用且有独立作用的基础方法；非综合可重复同方法；定义与实例分开 | P 新，J |
| H09 J.method.plan | Plan，综合/具名数据流/跨轮状态协调必需；单步feedback不因此必需 | 有限结构化组织，不是可执行脚本，详见 COMPOSITION | P 新，J |
| H10 J.method.other / unit.other | OtherDefinition，仅方法 other 必需 | 采用固定其他模板角色；不增加顶层类别 | U/P，J |

MethodUnit / Port / Plan / Node / Endpoint 的完整结构和唯一绑定规则见 COMPOSITION R04。旧R0的unit_ref端口坐标与combine_ref不再作为候选。组件的必要角色按每个实际单元核对，复用内容不复制正文。

组件 RoleName 采用既有定义稿的精确中文角色名为本候选枚举；以后编码映射不得改变角色含义。H05 的自然语言可以丰富，角色必须固定。现有 taxonomy/candidate-set/discriminator-set 的 typed content 留在既有受版本管理合同中，不能塞入无约束字段改义。

## 4. 资产与内核字段

| 编号/候选路径 | 类型/必要性 | 唯一职责、作用域与状态 | 旧新/读取 |
|---|---|---|---|
| A01 M.title / summary | Text，各1 | 资产名称和用途简介；作者写定，其他位置引用 | C 承载/P summary 必需，A |
| A02 M.asset_id / asset_uid / version / judgment_version | 原身份坐标，各1 | 包与判断的身份保持，不能用文件名代替 | C 保留，A/J |
| A03 M.languages | ID[1..n]，1集合 | 实际语言；无自动翻译推断 | C 承载/P 明确，A |
| A04 M.description / keywords | 原字段，按需 | 创作说明/索引，不能冒充判断内容 | C 保留，A/X |
| K01 P.declarations.highest_question | Declared<Text>，provided 必需 | 资产共同问题；可以复用单题问题，不要求再造议题 | C 承接/P 必需，A/J按需要 |
| K02 P.kernel.purpose | {kind:'summary'} 或 {kind:'authored',statement:Text}，1 | 共同用途；复用简介则唯一文本源是 M.summary | P 新，A/J |
| K03 P.kernel.foundation_refs | Ref[0..n]，1集合 | 指向真实 foundation/premise 材料；每条明确作用域 | P 集中索引/C 材料承接，A/J |
| K04 P.shared_declarations | ScopedDeclaration[]，集合必需，可空 | 每条id/kind/subject/applies_to/value，正文唯一；J.content_uses明确采用/讨论/反对 | P 替换旧worldview/value_order/role，禁止旧新正文并存，A/J |
| K05 P.materials[kind=definition].term / statement或resource_ref | Text；正文恰一来源或原文+资源明确分工 | 词名与本资产定义，不从第一行推断 | C 承接/P 供给要求，A/J |
| K06 definition.applies_to | AppliesTo，1 | 全资产或列举议题；不同义项用明确限定词名，当前不允许重复 term | P 新，A/J |
| K07 definition.aliases / distinctions / source_refs | Text[] / Text[] / ID[]，按实际提供 | 别名非新词义；相关引用按需取得 | P 前两项/C source_refs，A/J/X |
| K08 foundation/premise.applies_to | AppliesTo，1 | 全局共用或指定议题，不自动给全部议题添加前提 | P 新，A/J |
| K09 P.relationships | Relationship[]，1集合 | id与R08四套固定kind/direction/role/operator/effect元组；statement必需 | C 载体/P精确词义，A/J |
| K10 P.dependencies | Dependency[]，1集合 | 旧id/producer/consumer_judgment_ref等职责保持；judgment_result新增两端口，source保留来源分支，详R08 | C/P，A/J |
| K11 P.reading_order | ID[0..n]，按需 | 建议先读次序，不必覆盖全部，不得重复和虚构题目；其余仍可浏览 | P 新，A |
| K12 P.cohesion | 原 Cohesion，确有组合声明时 | 保留治理/权利/主体组合说明；不冒充三部分内核 | C 保留，A/X |

P.kernel 只承担共同用途与基础引用，不复制最高问题、定义正文或关系集合。对于最高问题可复用单题文本的序列化去重，R1 保留原 Declared<Text> 与明确一致性要求；仅相同字节不表示一题自动代表全部用途，创作需明确指定。

## 5. 两级边界、示例与文件

| 编号/候选路径 | 类型/必要性 | 含义及组合 | 旧新/读取 |
|---|---|---|---|
| B01 P.scope / J.scope | 原 Scope，各1 | 全局与局部范围，不能靠目录继承 | C/P 组合，A/J |
| B02 P.declarations.boundaries / J.boundaries | 原 Declared<Boundary[]> | 保留 exclude/limit/out_of_domain、statement、declared_by | C 保留，A/J |
| B03 Boundary.applies_to | AppliesTo，1 | 全局声明明确目标；J 内只能该题，不得借此扩大到别题 | P 新，A/J |
| B04 Boundary.exception_refs | ID[0..n]，1集合 | 全局允许的具名例外；局部不能单方面宣布覆盖 | P 新，A/J |
| B05 Exception.boundary_ref / statement | 原字段；参与覆盖时 boundary_ref 非null | 准确指向被改变限制与作者说明 | C 承接/P 强化，A/J |
| B06 Exception.applies_to / when / effect | AppliesTo / condition Ref / ExceptionEffect，各1 | effect=waive或replace_limit内嵌独占replacement；只有例外成立激活，R07 | P，A/J |
| B07 J.misuse | 原 Misuse 声明 | 真实误用说明；资产共同误用由明确共同材料/边界承接 | C 保留，A/J |
| E01 P.examples | Example[0..n]，1集合 | 明确资产归属，不依赖遍历全部议题才发现案例 | P 新/C 旧example材料迁移，A/X |
| E02 example.id/title/kind | ID/Text/illustrative或observed，各1 | 例子身份和示意/实际身份；实际标签有记录依据 | P 新，A/X |
| E03 example.context/input_refs | Text/Ref[] | 情境及必要输入；不得隐含披露私人原件 | P 新，X |
| E04 example.adopted_judgments | QualifiedJudgmentRef[1..n] | 必须绑定实际资产版本；同文件允许明确 local 语义 | P 新，X/J相关入口 |
| E05 example.application/results | Text / ExampleResult[1..n] | expected/observed/disposition/partial具名区分，详R09；不可用一值覆盖预期和实测 | P，X |
| E06 example.source_refs/material_refs | Ref[]，按实际需要 | 公开出处可省；observed仍须在创作侧有真实记录，不因成品省略来源而降为illustrative或视为已独立核验；已披露关联须真实获准 | C 职责/P 归属，X |
| F01 M.created_at / updated_at | Timestamp，各1 | 声明时间，不用文件系统时间冒充 | C 保留，A |
| F02 M.creator / P.attributions / actors | 原结构，真实提供时 | 创建者、作者、代表主体等角色不互相冒充 | C 保留，A/J |
| F03 M.lineage | 原 ManifestLineage[] | 来源资产身份和关系，不能当修改日志 | C 保留，A/X |
| F04 M.history | HistoryDeclaration，1 | 完整或有限历史覆盖；当前只记录能证明的范围 | P 新，A/X |
| F05 history.entries | RevisionEntry[] | {id,version,judgment_version,at,summary,affected_refs[1..n],previous?,actor_refs[]}；案例/旧版/删除目标按登记解析 | P，X |
| F06 M.license/access/encryption/entitlement | 原结构，依各自合同 | 许可/获取方式/密码封装/授权声明保持区别 | C 保留，A/X |
| F07 Read 的 permission/delivery/interpretation 等状态 | 既有状态 | 只描述本次访问；不由作者静态声明伪造 | C 保留，不移入 P/M |

`HistoryDeclaration={coverage:'complete'|'partial',statement:Text,entries:RevisionEntry[]}`。complete 指该资产身份从创建至本版的声明修订记录完整，不代表每份历史字节都在当前包内；partial 明确已知记录边界。仅有现版本而无法追溯时用 partial，不能把首次导入当原资产首次创建。历史真实性另据记录核查。

`ExampleResult={id,kind:expected|observed,value:SemanticValue,contract_ref:contract Ref,comparison_ref?:example_result Ref}|{id,kind:disposition,statement:Text}|{id,kind:partial,observation_kind:expected|observed,outcome:R05.partial}`。同例配对、固定版本以及真实观察记录与可选公开出处的区别见R09及REFERENCE-REGISTRY。

## 6. 公开读取和迁移的统一约束

目录提供真实 focus 和身份，不另造 label；权限不允许披露问题时遵守当前不泄漏边界，显示宿主通用状态，不将 ID 或短语伪装为问题。

资产读取提供名称/简介/内核/全局限制/关系索引/示例索引/历史概况；不得把尚未取得的正文显示为空集合。精确读题提供完整判断与所需共同概念、前提、范围和依赖；正文取得不全时保留受限或失败状态，不能交付为可完整采用。必要资源的授权、预算和受支持提取遵从现有合同，不自动开放任意附件或执行文件。

单选分支旧模块、现有组件 profile、保护访问能力保持独立版本含义。新字段、TermRef 词义、IR 投影与 Read 角色需要同版治理；R1 没有发行新的 tuple，无法被旧工具当现有格式读取。全部迁移原则见 MIGRATION-IMPACT。

## 7. R1 补充集合与唯一所有权

|路径|类型/数量|职责|读出|
|---|---|---|---|
|P.contracts|AuxiliaryContract[0..n]，1集合|附加端口、条目与案例的ResultContract，或仅供authored合并输入的EmissionListContract；后者禁止充当最终/候选/普通端口合同；部分消费结果使用R05固定变体；不重复J.result_contract|A索引/J必要/X|
|P.conditions|{id,owner_ref,expression:原Condition}[0..n]，1集合|将原内联条件显式迁移为可引用对象；正文原义保持|A索引/J必要/X|
|P.exceptions / P.misuse|Exception[] / Misuse[]，可空|资产所有；局部在对应J声明，不能双所有|A/J|
|J.content_uses|{target,role:adopt或discuss或oppose,statement}[]，1集合|材料/共同声明的真实采用角色；详R06|J|
|MethodComponent.method|TermRef，1|基础方法类型，与所属单元的角色匹配；综合用各基础类型|J|

本地Ref种类、所有者与固定外部版本按REFERENCE-REGISTRY封闭登记。没有记录到的可选集合不能推断空；审查夹具中显式[]均为夹具作者明确没有。当前字段字典不允许消费者自行创造新kind或从标题找目标。IR和Read四模式精确映射在PUBLIC-PROJECTION，不用A/J/X字母代替具体供给。

R2的Port.contract_ref引用普通ResultContract或仅authored指定输入的EmissionListContract；真实目标类型必须核对。后者按R05接受原生EmissionListValue，不使用SemanticValue包装，也不改变普通端口的ResultContract含义。
