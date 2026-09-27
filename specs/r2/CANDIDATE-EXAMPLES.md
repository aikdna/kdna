> R2 definition reference for this unpublished implementation candidate. This is the accepted definition text, retained with its original submission-time wording for precise traceability. The implementation version, proof scope, and migration contract are recorded in the public R2 README; historical private paths are provenance only and are not runtime dependencies.

# R2 完整候选实例的读法

review-fixtures 内 JSON 是定义审查的数据文件，全部 review_only=true，不是 .kdna、不进入资产库、不代表新的正式作品或真实专业案例。它们是完整的**作者语义视图**：M列出本轮相关Manifest声明，P列出完整判断语义。未签发的format_version、profile_version、compatibility、payload字节描述/runtime/encryption等容器装配项没有伪填；容器/保护合同沿原公共版本保留，只有后续签发版本并编译时才能成为线格式文件。本次没有调用SDK、创作工具或运行判断。

- [simple.json](review-fixtures/simple.json)：完整单题，文本结果是唯一正文，感受组件引用同一结果，所有无内容集合显式声明（普通数组[]，旧声明包装none/null）。
- [complex.json](review-fixtures/complex.json)：完整三题资产，含一次单元定义的两次采用、嵌套并行、新值合并再下传完整性检查、双回答必交付、两主体不同作用域、讨论但不采用、共享和无人引用概念、外部旧版案例与局部历史。
- [branches.json](review-fixtures/branches.json)：完整规则题、三个具名条件、两个候选（同字面不同身份）、三条分支、收集与部分输出合同。
- [method-output.json](review-fixtures/method-output.json)：完整多输出方法，只取指定实例checked端口，raw保持另一类型。
- [authored-merge.json](review-fixtures/authored-merge.json)：完整authored分支合并，重复生产者、专用输入合同、明确顺序和最终结果绑定；[预期侧表](review-fixtures/authored-merge-expected.json)保留完整原生输入与变体，不是第二份资产或运行记录。
- [observed-private-source.json](review-fixtures/observed-private-source.json)：假定创作侧实际记录存在且准许匿名发表，省略公开出处仍为observed；M/P外的假设说明不新增成品字段、不证明真实事件。
- [feedback.json](review-fixtures/feedback.json)：完整三题跨轮计划，初值、现场观察输入、下一轮状态及缺反馈处理均明确。
- [coverage-basic.json](review-fixtures/coverage-basic.json)：16种基础方法的完整题，各必需角色有实际说明；与complex综合类合成17类覆盖。类目表见COVERAGE，不能用这些例子证明所有类别交叉组合普遍成立。

完整性说明：生命周期未声明即无作者状态，不补active；没有私人来源就不要求造SourceRef；形式声明不验证现实真伪。P.asset沿既有AssetIdentity三字段，不扩造asset_uid坐标；M.asset_uid是文件根目标。Result/Shape/SemanticValue沿公共结构，R1/R2新增字段按FIELD-DICTIONARY/COMPOSITION。TermRef新词义和新结构尚未进入公共词表，不能用旧校验器宣称通过。

## 独立读者应还原什么

simple：左侧问水果喜恶，题头直接回答苹果/香蕉，三个标签结论/偏好/感受；没有外加原因、分支或运行结果。

complex：check-left输入A(100,2,true)，check-right输入B(80,3,true)，共享定义unit=check但实例不同。merge-use接两份assessment，产生priority和risk；check-complete再取得这两个新值，输出checked绑定全结果。实际作者结论为B优先A、二者低风险；只有qA采用sA，qB采用sB，qC讨论两者。d0无人引用仍归资产；e0是外部旧版的示意案例，不要求借qA才能发现；h0只改e0说明，不使e0变成新版复验。

branches：e1/e2指cover，e3指page；cover/page字面均为“核对完成”，身份不同。三条true时producer_identity得到两项，不是一项或三项；preserve变体得到三项。值之外保留发射追溯，不能把来源包装塞进本来text的item。

R1已获具名有限关闭的内容继承原回执；R2新改的authored输入、反馈触发边界、六处组件Ref和省略出处例仍待同版独审。形式齐全仍须检验问答角色、分类忠实与条件影响；文件中“纸面”身份不可去掉后冒充正式095。
