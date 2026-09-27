> R2 definition reference for this unpublished implementation candidate. This is the accepted definition text, retained with its original submission-time wording for precise traceability. The implementation version, proof scope, and migration contract are recorded in the public R2 README; historical private paths are provenance only and are not runtime dependencies.

# R2 公共读取投影及四模式

候选新版本设计。保留既有只读、Host权限、A/C摘要、快照、预算及handle防伪/时效约束；新增语义不能以旧Read版本返回。以下补足旧合同的字段，不是另造Reader私有读取器。

## 公共节点与发现

IRReadNode新增稳定`target:Ref`、`owner:Ref`、`role`；正文按字典类型无损投影，不从字符串猜含义。node_id由Core稳定指派，Ref到node_id一对一；不以拼接标题构造身份。同一声明在不同视图引用同一target。

ReadContent保留declarations/catalog/selected/closure/references/relationships/missing/provenance/expansion_handles/asset_capability，新增`asset_index:TargetDescriptor[]`。Descriptor={target,owner,display_name,body_delivery:'inline'|'deferred',handle_id?:ID}。display_name来自作者：题只能focus，其他用词名/案例名/实际声明角色及技术身份，不另造题短名。deferred必须有有效handle，不能用空正文表示不存在。

|作者位置|IR role/稳定target|whole_asset|catalog|exact_selection|expand|
|---|---|---|---|---|---|
|M身份/title/summary/语言/时间/许可声明|asset_declaration/asset|declarations完整|获准的基本身份|同版身份及必要用途|同版身份|
|P.scope、highest_question、kernel用途与基础索引|同asset_declaration节点的kernel/scope子字段|declarations完整|不提供|必要用途/范围/引用|关联完整|
|J.id/focus/parent/lifecycle|catalog_item/judgment|完整目录|完整目录|所选及必要关联题描述|目标涉及描述|
|J.subject/scope/core/三维/result或rule/contract|judgment/judgment及result/contract|题描述+handle，不送全体正文|不提供|closure完整|目标题完整|
|J.method/components/units/plan/nodes/ports/inputs|method_component/method_unit/method_plan/method_instance，各登记Ref|题下目标可发现，正文延后|不提供|全题必要内容|指定目标及必要闭包|
|P.conditions；policy/entry/candidate|condition/conditional_policy/branch/candidate|资产索引或所属题索引|不提供|完整条件组及结果合同|指定完整语义|
|P.shared_declarations|shared_declaration|完整索引+handle|不提供|适用及讨论/反对者必读，带作用角色|无需选题可展开|
|P.materials（含无人引用definition）|material|完整资产索引+handle|不提供|必需材料正文；非必要出处延后|无需选题可展开|
|全局/局部Boundary、Exception、Misuse|boundary/exception/misuse|全局正文含条件及替代体；局部随题|不提供|适用限制、例外完整，activation明确|目标及必要闭包|
|P.relationships/dependencies/reading_order|relationship/dependency、asset字段|组织关系正文完整|只目录，不用顺序冒充关系|所有邻接关系及R08必需对端/输入|按目标完整取得|
|Reason/SourceRef/SourceUse/Resource|reason/source/source_use/resource|资产目标索引，附件无自动读取|不提供|理由及必要公开依据完整；原件可选|按权限/受支持提取；没有任意执行|
|P.examples（包括只采用外部旧版）及results/contracts|example/example_result/contract|全部案例描述+资产handle|不提供|相关案例入口，非必要案例不强制全文|直接asset handle取得案例及记录结果|
|M.history与entries/lineage、actors/attributions|revision/actor；history概况与attributions属同asset_declaration子字段|覆盖/沿革/署名及完整目标索引|不提供|有关主体/状态，完整历史按需|资产handle直接取记录|

asset_index包含所有资产拥有而未inline的可展开目标。题内目标可按归属分组，不能遗漏未被选题引用的资产内容；总量受声明预算，超过不得伪装完整索引。公开必要内容是语义正文，不强制私人原件打包。无法提取的必要资源明确unsupported；不能先声称完整再让Reader私解附件。

## 请求、handle与状态

原ReadRequest共同字段继续。新mode约束：

|mode|selection|handle|响应selected/主要内容|
|---|---|---|---|
|whole_asset|null|null|null；declarations/catalog/asset_index；全局必需闭包|
|catalog|null|null|null；只获准身份和完整问题目录；asset_index=[]标明not_in_mode|
|exact_selection|一个本地Judgment Selection|null|该selection；选题必需闭包|
|expand|asset锚点为null，judgment锚点为原selection|一个由Core签发/Host注册的handle|保持锚点selection；target正文及必要闭包|

ExpansionHandle将旧selection改为`anchor={kind:'asset'}|{kind:'judgment',selection}`，target为稳定Ref。仍强制绑定asset_id/version、A、C、snapshot_id、core/ir/read版本、scope、issued_at/expires_at、host_id/epoch。handle必须由当前准备结果产生并经既有Host注册；提供同样JSON不能伪造授权。expand不得任意改target/anchor；旧handle、旧快照、旧epoch均拒绝，读取时重新确认权限。无需“借”任意议题来展开资产词典/案例/历史。

**完整性是本模式的完整，不是全文件无条件公开。** whole_asset中的题正文明确deferred；catalog不声称判断正文已取得。exact_selection的必要闭包至少含核心/分类/机制/条件/结果/合同/主体范围/有效边界/相关理由/采用或讨论的共享声明/所用定义/required依赖/R08对端，以及这些对象自身的必要引用。按固定点去重，不能只送第一层。

成功沿旧外层permission/delivery/interpretation状态，新增解释状态词须在新Read版本注册。文中简记 COMPLETE(mode)、DENIED、BUDGET_EXCEEDED、UNSUPPORTED_CRITICAL、UNRESOLVED_EXTERNAL、STALE_HANDLE，并非旧版已存在诊断码。失败不返回可冒充完整判断的局部closure；可以返回权限允许的基础身份和不泄漏目标内容的Missing。可选正文未展开以deferred表达，不是失败。

Host不允许披露某目录/索引对象时，本候选拒绝该模式的完整目录/索引交付，不泄露被拒ID、名称、数量或假装空目录。必要目标被拒则exact_selection失败。预算不足失败，不截断条件或只取首段。未知关键模块使新版本**所有四模式**UNSUPPORTED_CRITICAL，不再沿用旧版catalog-only/ID替代focus策略；旧版本保留原义。非关键扩展仅可按明示声明省略，若实际进入必要闭包则不能当非关键忽略。

## 纸面请求/响应（不是实际API执行）

审查夹具complex含未引用词条d0、只采用外部v1的案例e0、历史h0。A/C/S/H为同一示意快照和Host签发状态的变量，不是捏造实际摘要或handle令牌。

1. `whole_asset(selection=null,handle=null)`：COMPLETE(whole_asset)，asset_index有material:d0、example:e0、revision:h0，各有asset锚点handle hd/he/hh；正文标deferred，题目录全为focus。未知/未声明不能变成空数组。
2. `expand(selection=null,handle=hd)`：COMPLETE(expand)，closure含d0定义、作用域、来源声明。与任何议题是否引用无关。
3. `expand(null,he)`：COMPLETE(expand)，closure含e0情境、application、实际保存的expected结果er0及其合同、已声明来源身份；该e0没有observed，不补造配对观察；adopted_judgments仍指外部v1并标外部正文unresolved/not_requested。读案例本身无需自动取得外部题；要宣称重演其判断时外部题成为必要输入，须另获授权读取，未取到则不能重演完成。
4. `expand(null,hh)`：COMPLETE(expand)，h0只改example:e0，旧题版本不自动升级；history.coverage=partial，未知历史不补齐。
5. `exact_selection(qA)`：共享定义d1与适用声明sA进closure；sB不自动被采用。若qA反对/讨论sB，相应原文和角色也进closure。相关conflict关系要求双方可读。
6. Host拒绝必要d1：DENIED，selected仍可仅在获准时说明qA，完整closure不交付；不说“没有定义”。预算不足同理BUDGET_EXCEEDED。拒绝d0索引披露时whole_asset不返回隐藏项目数，返回DENIED。
7. 同文件声明未知关键模块：whole_asset/catalog/exact_selection/expand均UNSUPPORTED_CRITICAL，不用短名/ID填问题。过期hd返回STALE_HANDLE，不继续读新快照。

以上是固定的候选语义预期，独立审阅须据同版结构还原。实际Node/Swift/HTTP/Reader实现与访问实测另属后续阶段。

R2的authored输入专用合同按contract目标原样投影，method输入端口与policy的order/duplicates都为必要语义，不能投影成普通ResultContract或省掉排序。消费期实际EmissionListValue不预填到静态资产。实际案例若未公开SourceRef/SourceUse，仍按observed显示作者声明；不得编来源、降为示意或标独立核验。
