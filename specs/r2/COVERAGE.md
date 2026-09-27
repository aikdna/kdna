> R2 definition reference for this unpublished implementation candidate. This is the accepted definition text, retained with its original submission-time wording for precise traceability. The implementation version, proof scope, and migration contract are recorded in the public R2 README; historical private paths are provenance only and are not runtime dependencies.

# R2 类别、需求与反例覆盖

本表为覆盖定位；R1类目内容已获具名有限审阅，R2新增/修订仍待同版独审。完整题在JSON中，条件/流的纸面反例在PAPER-CASES。没有穷举17×17组合。

## 17类方法

|方法|完整题位置|实际必需角色|相邻排除/缺失负例|
|---|---|---|---|
|observation|coverage-basic.json / m01|观察依据|观察记录当前状态，不推测未来或原因；删必需角色拒绝|
|recognition|coverage-basic.json / m02|识别特征、类别定义、匹配办法|按类别归属，不给优劣评分；删必需角色拒绝|
|criteria_comparison|coverage-basic.json / m03|判断标准、对照办法、归结办法|完整评价规则，不因指导使用就归guidance；删必需角色拒绝|
|tradeoff|coverage-basic.json / m04|候选方案、比较因素、取舍原则|最终只交选择，不因比较过程归composite；删必需角色拒绝|
|inference|coverage-basic.json / m05|判断前提、推导关系|是否满足为判定，不是诊断原因；删必需角色拒绝|
|elimination|coverage-basic.json / m06|候选范围、排除条件、保留办法|判断适用范围，不把剩余一个自动说成偏好；删必需角色拒绝|
|causal_analysis|coverage-basic.json / m07|待解释现象、原因关系|归因诊断，不只是报告灯不亮的状态；删必需角色拒绝|
|calculation|coverage-basic.json / m08|输入与含义、计算关系|给定模型的数量估计，不声称未来预测或实测；删必需角色拒绝|
|simulation|coverage-basic.json / m09|起点条件、变化假设、演变关系|未来情景预测，不是当前数量估计；删必需角色拒绝|
|evidence_analysis|coverage-basic.json / m10|所用材料、材料与判断的联系|保存作者采用的立场，不冒充普遍因果证明；删必需角色拒绝|
|interpretation|coverage-basic.json / m11|解读对象、解释关系|解释文本含义，不把相关语境当分类标签；删必需角色拒绝|
|feedback|coverage-basic.json / m12|调整目标、反馈信号、调整办法|根据本次反馈调整当前安排；不保存跨轮状态或声明机器执行；删必需角色拒绝|
|analogy|coverage-basic.json / m13|参照对象、对应关系、借用办法|借明确对应迁移方法；仅提过去经历不算类比；删必需角色拒绝|
|feeling|coverage-basic.json / m14|个人感受|感受不需要补心理原因，不等于客观评价；删必需角色拒绝|
|experience|coverage-basic.json / m15|经验要点|明确顺序的结论，不编经历；排序不等于选一个；删必需角色拒绝|
|other|coverage-basic.json / m16|方法说明、判断依据、作用关系|作者新设名称约定，不是归入已有类别、解读旧词义或表达喜好；其他的具体定义和排除理由不可缺；删必需角色拒绝|
|composite|complex.json / qA|check对照三角色、merge权衡三角色、completeness对照三角色；实例/links/result_bindings|至少2种实际方法；unused第二单元、同法两次不能凑综合；C05/C07|

## 17类回答

|回答|完整题位置|交付/相邻排除|
|---|---|---|
|status|coverage-basic.json / m01|观察记录当前状态，不推测未来或原因|
|classification|coverage-basic.json / m02|按类别归属，不给优劣评分|
|evaluation|coverage-basic.json / m03|完整评价规则，不因指导使用就归guidance|
|selection|coverage-basic.json / m04|最终只交选择，不因比较过程归composite|
|determination|coverage-basic.json / m05|是否满足为判定，不是诊断原因|
|applicability|coverage-basic.json / m06|判断适用范围，不把剩余一个自动说成偏好|
|diagnosis|coverage-basic.json / m07|归因诊断，不只是报告灯不亮的状态|
|estimate|coverage-basic.json / m08|给定模型的数量估计，不声称未来预测或实测|
|prediction|coverage-basic.json / m09|未来情景预测，不是当前数量估计|
|stance|coverage-basic.json / m10|保存作者采用的立场，不冒充普遍因果证明|
|interpretation|coverage-basic.json / m11|解释文本含义，不把相关语境当分类标签|
|adjustment|coverage-basic.json / m12|根据本次反馈调整当前安排；不保存跨轮状态或声明机器执行|
|guidance|coverage-basic.json / m13|借明确对应迁移方法；仅提过去经历不算类比|
|preference|coverage-basic.json / m14|感受不需要补心理原因，不等于客观评价|
|ranking|coverage-basic.json / m15|明确顺序的结论，不编经历；排序不等于选一个|
|other|coverage-basic.json / m16|作者新设名称约定，不是归入已有类别、解读旧词义或表达喜好；其他的具体定义和排除理由不可缺|
|composite|complex.json / qA|独立排序与风险评价均交付；risk可选/缺失或两个part映到一字段拒绝，C05|

## Q01–Q28责任承接

逐项承接独立REQUIREMENTS；未把未来市场/所有模型/机器人列为冻结门槛。

|ID/要求|定义或保留载体|纸面反例|后续责任/边界|
|---|---|---|---|
|Q01 身份与独立文件|FD A/F、引用登记、公开投影|C11/C15|公共版本自足与真实跨入口读取|
|Q02 共创/自主创作|R01/G10；Creator职责保留|C02/C03/C14|不能由未知聊天历史判断字节真实性|
|Q03 唯一问题|FD T02及公开目录|C01/C11|不提炼短名|
|Q04 三维单选|FD T03–06/H01、R02|本页34类定位/C05|内容与格式分别检查|
|Q05 结论/规则|R01/R03|C02/C04|规则未运行可完整|
|Q06 核心单源|FD T07、R03、引用登记|C01/C04|必要限定必读|
|Q07 简单偏好|R01/感受角色|C01|不编心理原因；缺方法仍不合格|
|Q08 角色完整|FD H/R04|C05/C07|不按卡片数量删内容|
|Q09 条件状态|R05|C06|不把partial/处置当complete|
|Q10 多层反馈|R04/R05|C07/C08|有限静态表达，执行另验|
|Q11 内核|FD K/R06/R08|C09|不强造统一立场|
|Q12 共享范围|引用登记/R06|C09/C11|目录不继承；采用与讨论分开|
|Q13 边界例外|R07|C10|不自动扩大行动权限|
|Q14 创作/主体角色|继承Subject/Actor/Attribution/SourceUse|C13|真实采用和Host授权由外部过程证明|
|Q15 提取/新增/采用|R01/R09及原角色|C13|不将Agent新增归给原作者|
|Q16 隐私材料|R10/读出权限；分享流程|C14|来源栏空不证明正文无私密内容|
|Q17 按需访谈|R01与Creator流程|C14|不强迫外行替研究决策|
|Q18 完整准入|G10/R01|C03|必要题缺失导致资产用途不完整|
|Q19 不认证真理|R12|C01/C04|任务增益另验|
|Q20 案例身份|FD E/R09/引用登记|C11/C13|假设记录不是实际业务证据|
|Q21 历史/修订|FD F/R11/引用登记|C15|外部旧版不自动升级|
|Q22 必要读取|公开投影四模式/引用闭包|C11/C12|拒绝、超预算、不支持如实报告|
|Q23 行动权限|继承Host边界/R10–12|C16|文件不授权执行|
|Q24 Reader忠实|R03+公开投影；白皮书reader|C01/C04/C06|未来原生交互与Owner体验另验|
|Q25 公开自足|README迁移/公共投影|C11/C12|候选接受后完整进入公共源，不能依赖私有白皮书|
|Q26 唯一095|MIGRATION/白皮书D062|review_only标记|100保留规划，夹具不进业务目录|
|Q27 分层状态|README/GAPS/R2处置表|所有例均非实测|定义、工程、发布分开|
|Q28 按层变更|MIGRATION与白皮书战略承接|B/W处置表|没有具体反例不重开或扩围|
