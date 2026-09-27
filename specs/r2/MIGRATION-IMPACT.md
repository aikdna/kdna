> R2 definition reference for this unpublished implementation candidate. This is the accepted definition text, retained with its original submission-time wording for precise traceability. The implementation version, proof scope, and migration contract are recorded in the public R2 README; historical private paths are provenance only and are not runtime dependencies.

# 新旧承接与真实依赖影响 — R2

研究范围内只读核对，不执行包安装、生成、构建、测试或 Git 操作。本表提出恢复工程前的准备条件，不是开工令。

## 1. 不能用旧坐标装入新含义

当前公共语义源仍为容器0.5.0、payload0.4.0、core0.7.0、IR0.5.0、Read0.5.0。候选会改变问题目录、必需分类、方法与角色、核心表达、组合、词条作用域、边界例外及案例/历史供给。必须统一制定新版本 tuple，不能把旧坐标的未知字段当作静默向后兼容。

本稿不虚构新的发行版本号。需要变更哪些坐标已有影响判断；具体号码和支持窗口应由接受后的具名版本决定签发。旧容器保护字节格式若未变化，不为 UI 单独重造封装；payload/IR/Read/创作约定至少要核对版本影响。保留 unknown critical、预算和权限的既有拒绝边界。

## 2. 逐项旧新对应

| 旧内容 | 候选承接 | 迁移要求 |
|---|---|---|
| Judgment.focus / label | focus 成为唯一人类问题，label 停用；新目录的focus同源于J.focus | 旧 label 只保留历史追溯，不进入新题名。没有实际问题则继续创作，不能把短词自动加问号。 |
| form / mode / nature | form 保留；新 answer_kind、method 固定类别 | 不从 text/number、旧 mode/nature 机械推断类别；实际作者表达逐题核对。旧mode/nature在R1不作为第二分类保留；若承载独立真实信息，将原意分配到必要组件、理由、范围或定义并具名对应。无法归位则报告缺口，不能删文或加私有未知字段绕过。 |
| result / result_contract | 保留既有类型化结果，新增 core_expression 明确题头 | 文本结果能直接引用就不抄第二份；复杂结果写核心句并核对限定。 |
| formation_rule.statement | 保留展开规则，核心句和组件角色明确 | 不能自动首段摘取；完整规则逐项归位，不强行删掉原有条件或维护第二篇独立全文。 |
| method/components/bindings | 固定分类与角色，按需单位/Plan/共享引用 | 已有三个组件 profile 保留身份；分类未决继续创作。绑定不能自动变成数据流。 |
| static-policy/1 | 保留原单选意义，按需要显式迁移到R1 Policy | 原方向、优先级、兜底和未判阻断逐项对应；不能将单选默认为全部命中。保留原表示与新表示的同义核对记录，正式题不并存两份竞争规则。 |
| scope/boundaries/exceptions | 保留原文与声明人，补明确作用域及例外目标 | 无 boundary_ref 的旧例外不能猜指向；局部/全局冲突先处理，不用数组先后掩盖。 |
| definition/foundation/premise 材料 | 保留身份与正文，补适用范围与引用 | 旧拼接词名/首行约定不能替代真实 term；原协议唯一词名约束保持。 |
| relationships/dependencies/parent_ref | 目录、逻辑、阅读顺序分开 | 关系词语的实际作用需明确；已有依赖读取闭包不因页面整理丢失。 |
| example 材料 | 按实际案例身份补完整字段 | 缺情境或版本先调查，不把编写示意冒充真实经历；不能据迁移自动生成案例。 |
| lineage 与时间/版本 | 保留源流，补真实历史覆盖与变更记录 | 不伪造丢失历史，不用文件系统时间替代声明时间。 |
| creator/attributions/access/crypto | 保留角色及各自合同 | 不将整理者改为原作者，不以 metadata 授予读取/行动权限。 |

迁移需逐条有旧身份→新身份或同身份新版本的对应说明，未能迁移的必要内容阻止宣布完成。正式095当前身份保留，任何新版本须在工程恢复并具名授权后通过真实创作/修订链产生，本轮没有生成。

## 3. 当前静态消费图：声明与磁盘安装不同

R0时点的实际读取清单见 DEPENDENCY-INVENTORY.json；R1未重新探测运行环境。它保存路径、源文件哈希、直接依赖声明和现场已安装包；没有执行解析器、网络或构建，不能称完整活动运行图。

| 入口 | 本轮观察 | 意义 |
|---|---|---|
| open/kdna workspace | Core 0.35.0-rc.source.1、Read 0.10.0-rc.source.1 | 公共源及包定义是第一层影响面；包号不是语义 tuple。 |
| studio-core | 声明并安装 Core0.35/Read0.10，SDK4.5.0-rc.material-edit.1 | 创作准入、组件、修订和保存读回均受影响。 |
| studio-cli | manifest 声明 CLI0.17/SDK4.5/Core0.35/Read0.10；根 node_modules 实际为 SDK4.1/Core0.25/Read0.4 | 根目录声明不能证明调用到了该版。此发现不推翻历史隔离链验收；后续必须冻结实际调用路径。 |
| web/server/remote/activation/react/assets/cli | 多处仍声明 combination 的 Core0.34/Read0.9，另有 vendor tgz | 不能只改公共源码就认为所有客户端同版；逐一登记选用包。 |
| studio-swift / app-shared | 默认固定旧远端 revision；KDNA_CORE_SWIFT_SOURCE_PATH 可选择经绑定校验的本地源 | 默认路径与受验本地路径必须分列，不以本地通过代替默认依赖更新。 |
| VSCode | 声明 Core0.21，既有暂停 | 记录影响但不唤醒或扩围。 |
| apps/kdna-reader | 根 package.json 没有直接 KDNA 包依赖；native builder 显式读取 dependencyRoot 的 Core/Read | 不能看 Reader 根包就断言其底层版本；必须按实际构建绑定识别。 |
| R7 独立预览 | E/CURRENT 指向具名 BUILD-R7/R7-BINDING 和冻结 runtime；执行状态暂停 | 保留该制品身份，不能以 live 源更新冒称 R7 已更新。 |
| C08 停止中的公开波 | 控制记录仍为 PAUSED，所列 Core0.36/Read0.11 是该波记录，downstream_implementation=false | 不能把未实施的目标坐标当现场已交付。 |

Python、Creator skill 与脚手架入口在 package.json 之外。库存清单列出可定位的描述文件；没有读到的运行选择或外部安装明确为未核实，不用空依赖列表宣称无影响。未来实施冻结须覆盖真正被调用的打包物、锁文件和宿主路径，不需要在本轮暂停期安装或复跑旧整套。

## 4. 文档漂移

- 当前 public-semantic-source.json 是此次字段核对基准。
- specs/container.md 仍有0.1.0和旧 payload core 示例，与当前坐标/结构不同；登记待修，不作为新字段依据。
- creation-output-boundary.md 有旧夹具和旧读取链说明；角色区分可供理解，不能据此声称当前运行流程完成。
- 白皮书对整体阅读职责的研究仍有价值，但较早的“简单题可无方法”等表述必须与 Owner 当前成题要求逐项对照；感受可为方法，不意味着无分类准入。

## 5. 将来恢复工程后的顺序建议

先接受具名定义并定版本与旧新适配范围；再由公共源生成合同/IR/Read，随后更新 Creator/Studio 准入、编译与修订；再覆盖实际消费包及平台依赖；再以真实链修订正式资产；最后 Reader 只消费共同语义并由 Owner 实看。每层独立范围接受，不能把最终 UI 负责补齐上游语义。

这只是影响和顺序说明。发布、Git写、安装、构建、产品测试、替换095、恢复自动化均未获本稿授权。

## 6. R1 不能机械猜的迁移点

- 匿名Condition→P.conditions稳定ID，并更新所有when/qualification/终止引用；旧条件不自动合并，不从文本猜同一条件。
- 旧worldview/value_order/role→有主体/范围的shared_declarations；核明是否全局、局部、仅讨论后撤销旧正文，不能双写。
- R0 Use.unit_ref端口→具名Node采用实例；每个输入、merge输出、最终绑定逐项明确，旧数组顺序不自动成为数据流。
- 旧结果分支迁移先选单选/collect/明确合并；判定整体合同和item合同；禁止混装disposition；partial用固定变体，不新增随意结果包装。
- Exception替代Boundary从常驻集合移到例外内，具名条件成立才激活；实际激活不得由迁移脚本猜。
- Relationship旧自定义词逐条核为4元组之一，否则明确扩展及支持限制；不凭中文同义词自动映射。
- 旧SourceUse reason/method_component保留原职责，新增example等目标须新版本登记；source不是material。
- 历史/案例缺版本或记录依据不编造；未知历史声明partial，不把示意变observed。
- 新Read asset_index/asset anchor以及unknown-critical四模式拒绝须发布新Read合同；旧catalog-only行为保留原版本，不静默替换。

旧容器、密码、授权许可、Scope/Subject、SourceRef/Attribution、Resource提取等未改性质按原合同继承。公共源、Schema、词表、IR、Read需同版落位；白皮书D062仅治理对齐，私有候选不能成为第三方依赖。恢复后先验证代表链与具体反例，再同步实际受影响消费者，不重跑所有未变性质。

## 7. R2 定向影响（F1–F4）

- authored合并需显式order与duplicates及专用EmissionListContract。旧值数组不能冒充完整Emission列表，不能从values猜producer/entry_refs；需作者明确顺序与重复含义，补真实身份后迁移。专用合同仅在该policy的merge输入使用，普通结果/端口仍受ResultContract约束；后续公共源、IR及Read须共同表达用途限制，不能只改Reader。
- method=feedback不自动要求Plan。核实际保存的单步关系或跨轮状态/协调；后者必须给Plan，不能通过删结构声明伪装成无状态。现有完整跨轮例不改义。
- 六处新component.material_refs改为明确Ref对象。既有J.material_refs等旧字符串字段保持各自合同，不全局替换所有字符串引用。
- observed的实际记录要求保留；公开来源说明可省，不能仅据SourceRef缺失改成illustrative。公开读取不新增必填证明字段，不推导独立核验；已有来源则按原职责准确提供。

本节只说明候选定义的直接影响，不创建迁移器，不改公开源或任何运行包。
