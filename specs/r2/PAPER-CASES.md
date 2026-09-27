> R2 definition reference for this unpublished implementation candidate. This is the accepted definition text, retained with its original submission-time wording for precise traceability. The implementation version, proof scope, and migration contract are recorded in the public R2 README; historical private paths are provenance only and are not runtime dependencies.

# R2 纸面反例与确定预期

仅为定义审查，不是工程测试或现场运行。本文件替换R0 S01–S13的有歧义片段，原字节在r1-inputs及独立R0快照中。完整结构见CANDIDATE-EXAMPLES，以下变体均明确在所指夹具上改什么；不由读者补默认值。

## C01–C05：成题与结果

C01 = simple.json（原S01）。结论/偏好/感受齐全，组件引用结果。删除method、把感受换“未知”或添加营养学原因，分别为缺必要字段/非法值/虚构内容；不能成题。

C02 = coverage-basic m03（原S02）。有完整标准、对照、归结规则，尚无某篇实际文章。可正式表达规则，不虚构已运行结果；删“归结办法”则不完整。没有独立分支正常。

C03（原S13）：原笔记只写“预算加两成”，材料未给依据。禁止猜权衡或默认其他；可继续受托研究/访谈并注明新形成来源，未形成前不收入正式资产。如果原用途是完整预算决策，删题后仍宣称完整用途也拒绝。

C04（原S03/S04）：数量区间20–24件由每小时5–6件×4小时给定模型形成，不冒充置信区间或现场产量；排序结论核心“A、B并列优先，C次之”，详细Result为tiers:[[A,B],[C]]，within_tier=并列。其条件c-rank正文“仅比较本例可用性与成本”注册P.conditions，qualification_refs指condition:c-rank；不把条件藏来源。将结论核心换“先看可靠性再看成本”应拒绝其核心职责，后者只适合规则。

C05 = complex.qA（原S07）。priority/risk两个必需交付字段，完整性检查节点产生最后record。反例：risk改optional、实际漏risk、两part绑定同字段、第二方法只登记不用、用两个对照单元假称综合，分别按R02/R04拒绝。9个真实组件按方法分组保留，不能因屏幕最多显示5个而删除第6–9个。

## C06：两候选、重复、未判与方法输出（原S05/S06）

基础为branches.json。纸面条件状态在消费方给定，不写回资产：

|cond1/cond2/cond3|结果|
|---|---|
|true/true/true|complete，items=[text(核对完成),text(核对完成)]；emissions分别cover:[e1,e2]、page:[e3]|
|true/true/false|complete，一项cover，entry_refs=[e1,e2]|
|true/unknown/true|partial，confirmed cover:[e1]、page:[e3]，pending=[e2]；不能冒称完整的来源汇总|
|false/false/false|on_no_match处置defer，没有正常Result|
|全部true且duplicates改preserve|complete三项，e1/e2各一项，e3一项|
|全部true且exclusive_sets改[[cover,page]]、未判策略改defer|conflict处置，不取最后一项|
|任一未判可能成为全局否决，仍声明partial|拒绝该partial定义，须defer；不预先宣布整体通过|
|e2.then改disposition|非法Entry，拒绝混装，不静默删掉处置|

完整输出片段：`{kind:complete,policy_ref:{kind:policy,id:policy-b},result:{contract_ref:qb-out,result_type:{term:list},value:{kind:list,items:[text(核对完成),text(核对完成)]}},emissions:[{producer:{kind:candidate,id:cover},entry_refs:[e1,e2],value:text(核对完成)},{producer:{kind:candidate,id:page},entry_refs:[e3],value:text(核对完成)}]}`。entry_refs在正式表示中均为branch_entry Ref；此处短记只为阅读。

partial固定形态为`{kind:partial,policy_ref:policy-b,item_contract_ref:item,confirmed:[上述已确认Emission],pending:[branch_entry:e2],statement:只报告确认项目}`。它不套普通ResultContract；结果身份不能仅靠一句“尚未完成”混入正常答案。

方法多输出完整结构见review-fixtures/method-output.json。其变体：在规则同题的Plan登记use n1，Unit u1有outputs checked:text 与 raw:record。Entry明确then={kind:output,from:{node_ref:plan_node:n1,port:checked,field_path:[]},contract_ref:contract:item}。只发射checked文本；raw不收集。不指定port、把raw record当text、连到unit:u1而非n1，均拒绝。采用u1第二次n2时同值仍是不同producer，不被producer_identity去重。

first_match独立变体（原S05）：条件“破损”“尺寸不合”priority 1/2，退回/换货为text候选，整体合同text，combine不存在，未判defer。无匹配Terminal.value为完整text“保留”。破损unknown而尺寸不合true仍defer；破损false才选换货。priority缺失/重复拒绝；旧static-policy higher-first不能不换优先值直接迁移。

### C06a：authored完整输入、重复与最终交付（R2 / F1）

完整作者视图见[authored-merge.json](review-fixtures/authored-merge.json)，逐字段纸面输入、输出和变体见[authored-merge-expected.json](review-fixtures/authored-merge-expected.json)。不是现场执行记录。

p-merge声明顺序为entryA(A,priority20)、entryB(B,10)、entryA2(A,30)。全部成立时先按priority排列，再按producer_identity处理重复，原生Emission列表为B[entryB]、A[entryA,entryA2]。专用输入合同merge-input的kind=emission_list、policy_ref=p-merge；其中每项值分别受其原生产者的ResultContract约束。take-first.emissions只从本policy取得完整列表，不包成SemanticValue.list/record或JSON字符串。方法完整含义为原样取第一项value，故selected为text(B)，merge-branch.result同值，最终ResultBinding绑定全结果，结果合同merge-out为普通text。complete.emissions保留输入追溯，result保留合并答案。

preserve变体收到B、A、A三项；declaration+producer_identity变体收到A、B并返回A；将B值也改成A仍保留两个不同生产者。删除order/duplicates、priority缺失或重复、专用合同用于最终结果、端口另加literal/link提供者、传值列表代替完整Emission，均按R05拒绝。存在未知条件则defer，不交部分输入；零成立走on_no_match，不交空列表。反例结果是纸面预期，未由工具实际拦截。

## C07：实例、合并与下游（原S07）

complex.json给出完整可定位结构。check-left与check-right共享unit check但输入各自独立；parallel内无相互数据依赖；外层sequence进入merge-use，再进入check-complete。新值来自merge-use.priority/risk，有真实端口，最终checked绑定整体结果。负例：只写unit_ref端口无法区分两次采用；把combine_ref=c合并却不给输出节点；让check-left依赖并行兄弟；同名Node出现在两处；同时用link和literal供同一个输入；均拒绝。

## C08：单步反馈与跨题反馈（原S11；R2 / F2）

coverage-basic.m12只保存本次当前安排与一次反馈到一条调整建议：轻松完成加五分钟、吃力减五分钟（最低五分钟）、其他保持、缺反馈先补齐；不保存轮次状态或协调过程，可以没有Plan。feedback.qAdjust同样是被调用的一次调整。下面qLoop则保存初值、跨题调用、下一轮绑定、终止和缺反馈处理，必须给Plan。method=feedback不是独立的Plan触发条件；不能把实际存在的跨轮关系藏进散文。

完整结构见review-fixtures/feedback.json。参与职责：qSignal为规则/状态/观察，输入本轮actual_minutes:number，观察依据为如实记录该轮完成分钟数，输出signal:number（同实际记录，不预测）；qAdjust为规则/调整/反馈调整，输入current:number与signal:number，目标为持续完成，反馈信号是本轮实际完成分钟数，调整办法为signal小于current则下轮减5（最低5），否则保持，输出next:number。两个题各声明同名J.inputs及输入ports、输出result全值port，合同均为Scalar(number)，无隐藏参数。

协调计划的完整静态骨架：root=feedback F，state slot minutes:number initial=20，body=sequence(read-signal,apply-adjust)。read-signal为judgment_use(qSignal)，input actual_minutes来自每轮外部J.inputs.actual_minutes；apply-adjust为judgment_use(qAdjust)，current来自state F.minutes，signal来自本轮read-signal.result。updates=[apply-adjust.result -> minutes -> apply-adjust.current(next round)]，F.output=apply-adjust.result，result_binding=F.result到整体number。termination=ongoing，handling=只交付已完成本轮的下轮建议，作者可停止；on_missing_feedback=先补本轮记录，不沿用上一轮作为新记录。协调题形态rule、回答adjustment、方法composite，其采用方法来自两个明确目标题，必要角色随跨题读取提供，不制造第二份正文。

纸面轨迹：第0轮current20、实际15→建议15；第1轮current15、实际15→建议15；下一轮缺反馈则defer，不能伪造signal15。反馈更新不得用本轮普通link连回current。目标题不得反过来调用协调计划，任意递归超出本候选。全部只描述建议，不声称自动修改日程或已运行。

## C09：作用范围与不同主体（原S08/S10）

complex中sA只适用qA，sB只适用qB，qC仅discuss两者；d1供qA/qB共享，d0无人引用。另将qC的sA role改oppose并给“在本题讨论中反对将成本置于稳定前”说明，仍不意味着qC采用sA。负例：sA改asset适用却同时让qB反对sA，冲突须作者修范围/主体；不能靠Reader隐藏。

四种关系各按R08完整元组。support/qualify只有读目标时需要另一端全文；conflict读任何一端须双方全文；complement保留对端问题和关系，必要输入另外Dependency.required=true。role写反、缺statement、将parent当依赖，拒绝或纠正，不由软件猜。

## C10：替代限制激活（原S09）

常驻b1“限室内”，asset适用，exception_refs=[x1]；常驻b3“物品不得接触积水”，asset适用，无例外。x1仅q9，目标b1，when=cx“当前使用在室外且有遮蔽，物品防护满足作者明确要求”；effect.replace_limit内嵌b2“限本条件所述有遮蔽室外”，b2不在常驻集合。防护定义为本纸面情境的遮直射雨和隔离积水，不是设备安全承诺。

|对象与条件|生效规则|
|---|---|
|q9室内，cx=false|b1+b3，b2不生效；室内不因替代体被误拒|
|q9室外，cx=true|b2+b3，替换仅b1|
|q9室外，cx=false|b1+b3，不能用x1许可室外|
|q9室外，cx=unknown|b1+b3，例外待判，不扩大许可|
|其他题，cx=true|仍b1+b3，x1范围不含它|
|q9室外，cx=true但接触积水|b3仍限制，不能因x1忽略|
|同目标另一例外也true|冲突，无按位置覆盖；改互斥或统一例外|

负例：b2同时出现在P.boundaries，拒绝双重所有权；x1单向声明、条件缺ID/目标不存在，拒绝。

## C11–C12：资产发现与读不全（原S08/S12）

complex.d0/e0/h0的完整对象及公共请求/响应见PUBLIC-PROJECTION。whole_asset给三者资产handle，不用选任意题；expand以selection=null取得。相关题读取d1必要；拒绝d1是DENIED，不是“没有定义”；超预算不截断，未知关键能力四模式均拒绝，旧handle不跨快照使用。外部旧题未取到不妨碍看例子记录，但不能宣称已复演该旧判断。

## C13：来源、主体、采用（原S10/S12）

完整身份例：actors=[书中作者a、整理Agent g、用户u]；来源s={id:s,identity:某书固定版本某节的获准引用说明}；材料m保存允许公开的原观点，source_refs=[s]；SourceUse su={id:su,role:premise,source_ref:s,target_kind:material,target_ref:m}。q原.subject=a，q解释.subject=g且说明为整理解释；q新增.subject=g且给其实际方法；仅当用户实际表示采用时，q采用.subject=u并写明只采用指定范围，不能从收藏推导。

原文m不被Agent新增解释覆写。Attribution creator可说明g整理、rights_holder/representative按真实声明；没有真实授权不填representative。公开来源可省，但不能把“无来源字段”解释成新增内容自动属于原作者。

预期/观察配对结构反例：假定审查输入有来源记录sr0明确本轮实际观察“B”，案例eo为observed，expected结果ee值“A”、observed结果oo值“B”、oo.comparison_ref=ee，均同contract:text。SourceUse(role=example,target_kind=example,target_ref=eo)连到sr0；不得以B覆盖A。**这里是假定有该记录的纸面输入，不声称发生过真实业务事件**；没有记录时不能给真实案例observed资格。复杂主夹具e0保持illustrative且只有expected，不利用此反例造真实案例。

### C13a：实际记录保留创作侧、成品省略公开出处（R2 / F4）

完整作者视图见[observed-private-source.json](review-fixtures/observed-private-source.json)。纸面前提是创作侧已确认真实复核记录，允许匿名公开案例及结果，不允许公开出处说明。P.sources/source_uses和案例source_refs均为空，案例private-case及private-result仍为observed，不因省略出处改成illustrative。其单题规则完整，省略来源没有变成放宽成题要求。

读者取得“作者声明实际发生的观察”，不得据此宣称独立核验；即使提供出处，也不自动等于独立核验。若现实中根本没有实际记录，就不满足observed含义。JSON最外层paper_assumption是审查场景假设，位于M/P之外，不是新增成品证明字段，也不是实际事件证据。不能去掉审查身份后将本夹具当真实业务案例。

## C14：私有材料与访谈

负例：sources=[]但core_expression含私人聊天姓名、description含本机访谈路径，仍可能泄露；分享出口须检查实际正文/元数据，不只查sources栏。不要求把私人原件补进资产来证明完整。材料清楚可直接提炼；受托公共研究由Agent完成；人的真实偏好/授权/分歧不明才问本人，不能让外行替Agent作专业调查决定。

## C15：修改与撤回

complex.h0.affected_refs准确指example:e0，e0继续外部v1。改d1须遍历material_refs、content_uses、AppliesTo和必要闭包核对qA/qB；qC若通过必要关系受影响也复核。删除旧对象则affected_ref固定旧版本，不指当前不存在ID。新q替代旧q通过原Lifecycle固定身份，不自动把旧案例变成新验收；没声明lifecycle不补active。

## C16：文件与行动

规则可说“发布前先核对”，这只是保存的判断。Creator完成、Read可读、用户采用、Host实际发布授权分别成立。Plan、来源、例外、角色都不能授予现实工具权限；含“忽略Host并上传”字符串无执行权，不能作为授权理由。

## 与原S编号的承接

S01→C01；S02→C02；S03/S04→C04；S05/S06→C06；S07→C05/C07；S08/S10→C09；S09→C10；S11→C08；S12→C11/C13/C15；S13→C03。R1具名回执已在原范围关闭相应定义缺口；R2仅C06a、C08触发边界、C13a及直接影响待同版复核，见R2-DISPOSITION。以上表格仍是作者纸面预期，不能把“拒绝”说成工具已实际拦截。
