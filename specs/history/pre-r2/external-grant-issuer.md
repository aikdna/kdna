# B2.0 独立两调用闭合合同（独立候选，待审）

`@aikdna/kdna-core/key-grant-issuer-node` 恰好两个CJS/ESM/TS callable：getExternalGrantIssuerContract() 与 issueExternalKeyGrantForAsset(input, options, secrets)。Descriptor id=kdna.external-grant-issuer/1、version=1.0.0、独立definition_digest、actual Core package/version及固定limits。旧protection九callable/能力列表不加issuer；旧crypto helper不对外开放，新Node subpath不引入浏览器或纯Read I/O。

## 精确输入

input仅absolute file path字符串或非proxy的Uint8Array。绝对路径无NUL、非URL；typedarray不接受SharedArrayBuffer backing（不能在复制时被另一线程无同步修改），通过内建byteLength getter和内建set复制，不调用用户iterator/toJSON/getter。最大container26214400 bytes；现有128entries/entry8388608/total12582912/ratio100不改。path捕获的内容只代表单句柄实际读到且后续通过加密认证的最终字节，不宣称文件系统原子快照。

options全部必填：issuer、signing_key_id、account_id、entitlement_id、entitlement_profile(account|org)、device_id、device_agreement_public_key、device_signing_public_key、grant_id、status(active|revoked|expired)、status_version、issued_at_ms、refresh_after_ms、offline_grace_until_ms、expires_at_ms、timeout_ms。无默认字段；extraProperties包括A/Manifest/envelope/CEK/algorithm/verified/ephemeralKeyPair/wrapSalt一律拒绝。具体string/uint边界见私有schema；RFC19 id使用既有ASCII pattern，issuer合法URI且不超256，keys必须规范32byte base64url前缀。status_version从1起；timestamp为整数0..253402300799999（至9999-12-31T23:59:59.999Z），且须满足旧RFC19 date-time与无损Date→ISO→Date，issued<=refresh<=grace<=expires，profile必须等于当前Manifest entitlement。

secrets仅own-data字段 issuerRootKey:32-byte Uint8Array、issuerSigningPrivateKeyPkcs8:1..4096-byte Uint8Array、signaturePolicy:{requireSignature:boolean,expectedPublicKeyHex:64lowerhex|null}。只接受Ed25519 private DER PKCS8并派生public key，禁止把caller KeyObject/PEM/对象当已验证key。issuerRoot长度错误/签名key格式或种类错误属于ISSUER_KEY_INVALID；wrong root内容必须实际AEAD失败，不能只签一个包再假称根已验证。signaturePolicy是输入原资产签名规则，不是输出RFC19算法选择。

所有对象只普通/null-prototype、无symbol、own-data descriptors；先util.types.isProxy拒绝再reflect，拒绝accessor而非执行它。只读取一次capture后的字段，首次await前复制options/secret/bytes并捕获path字符串。没有callback形参数，无上游secret provider/private clock注入。调用者完整账号/entitlement/issuer pin由Activation可信配置和认证提供；公钥随结果返回只是观察，不能据此自证issuer身份。

## 唯一认证链与四共享接缝

1. 新grant-issuer.js完成输入capture/reservation、有限monotonic deadline与same-handle文件读取；不改旧node-capture.js。文件读取before/after每个await都检查owner状态，结束后关闭自己的handle。只读到container上限+1以拒绝，no extraction。
2. protection-admission.js内部抽parseProtectedAsset(bytes,signaturePolicy,checkDeclaration)：原parseContainer、validate Manifest、declaration、captured A/C/E、assertContentBindings、verifyIntegrity保持顺序。checkDeclaration只是Core内部closed function，不是任何公共issuer参数；原consumer调用原credential/provider语义，新issuer闭包只检查同一结构+external/account-org。内部失败按原序返回，issuer再投影自己的结果。
3. protection-declaration.js抽纯assetProtectionDeclaration(manifest)，旧declaration继续保留密码/外部credential、revocable/offline/provider要求；新issuer不能伪造一个consumer grant/provider让这些检查通过。issuer root与consumer device grant是不同凭据用途。
4. 现protection-envelope-codec的length-first deterministic CBOR decode/roundtrip核对，validateEnvelope的严格schema/base64url及entry path；禁止旧helper宽松decode先行、JSON假冒、duplicate字段、不规范CBOR。protection-crypto.js新增内部issuerRootPlaintext复用原deriveExternalAssetCek/externalEnvelopeAad/decryptGcm；AAD/KDF覆盖Manifest asset_uid/id/version/access/entitlement、entry_path、plaintext_digest、key_ref、issuer_key_id，tag与plaintext digest都真验证，CEK finally清零。
5. 用现decodeValidatedPayload验证Payload/schema/跨entry/坐标，再共用现buildIR解释。semantic-admission.js抽interpretValidatedPayload，旧finishAdmission仍发原snapshot/catalog；issuer只读accepted vs catalog_only及既有asset_capability，不issueSnapshot/issueOperation，不回传IR/detail/catalog。unknown critical是catalog_only，错误crypto/结构/语义不降格成目录。
6. 至此前全部成功才调用旧createExternalKeyGrant，传入captured内部manifest/envelope、实际A、copiedroot、parsed私钥以及显式全部grant字段（timeout_ms只归新入口生命周期，不传给RFC19 helper）；旧默认Date/status/grantId永不可达。原helper作为既有RFC19 primitive保留字节域，不私有导入到Activation。序列化grant一次，验证旧schema/签名自检、全部selected context/实际assetA与ciphertext digest、<=1MiB、actual rawgrant digest，返回前复查ownerdeadline。内部自检不等于新device consumer独立接受。

C/E仍原密文entry前像；A为实际captured ZIP。重包相同E但不同A产生新A绑定；不能从entry同一性复用旧grant。新JSON wrapping grant本身是RFC19.0.1，outer独立issuer/1不会重命名旧profile。

## 结果闭合与披露

JSON观察union在ISSUER-SCHEMA-PROPOSAL中精确required/additionalProperties=false。成功运行时结果字段严格为 `status,grantBytes,grant,asset,issuer,admission,proof`：grant为byte_length/digest，asset为A/C/E，issuer为id/signing_key_id/public_key，admission仅status/asset_capability/interpretation。

accepted→interpretation complete；catalog_only→blocked，AssetCapability仅asserted_answers/result_forming_rules/mixed三值。两个成功分支均没有catalog label/id/parent_ref/carrier_id/diagnostic subject、Manifest/Payload/rawplaintext/CEK/IR/snapshot/operation。完整RFC19 grant会公开其原规定asset identity/account/device/issuer字段，这是明确的grant接收者信息；这里的“不泄露明文”指不暴露解密Payload内容，不能声称grant零元数据。grant是绑定device与状态的signed输出，不表示账号授权、membership、当前Read scope或action许可。

core_rejected仅 `{status:'core_rejected',core:{status:'rejected',reason:ReadDiagnosticCode},stage:'asset'}`：这叫IssuerCoreRejectedObservation，是新类型而非伪装完整CoreAdmissionRejected，剥离component_failure、diagnostics中可能含原内容的subject/field。失败无grantBytes/grant/asset/admission/issuer，不复制private error stack/string。

issuer_failed精确status/code/stage，六个最终码与阶段：

| code | stage | 主要拒绝 |
|---|---|---|
| ISSUER_INPUT_INVALID | input | closed输入/类型/上限/路径失败或无可用并发slot；不调用getter或crypto |
| ISSUER_ASSET_PROFILE_UNSUPPORTED | asset | plain/password/未知profile不能签外部grant |
| ISSUER_ASSET_AUTHENTICATION_FAILED | asset或integrity | 保护声明、canonical envelope、issuer-root AEAD/plaintext_digest或checksum/signature失败 |
| ISSUER_KEY_INVALID | issuer_key | root形状/长度、DER/type不合法；公钥与服务pin匹配是Activation最终检查 |
| ISSUER_GRANT_OPTIONS_INVALID | input或grant | grant标识/时间/状态/设备key/profile binding不合法 |
| ISSUER_OUTPUT_INVALID | 当前input/asset/integrity/issuer_key/grant阶段 | deadline过期、内部crypto/输出encoding/schema/signature一致性失败；不返回晚成功 |

六family采用以上字面名，ISSUER_KEY_INVALID只加一次issuer前缀。具体错误优先级：reserve可用性→纯输入形状和时间/key基础检查→捕获文件→容器/Manifest/保护声明→C/E/selfbinding/integrity→canonical envelope/root AEAD→Payload/解释→grant→返回前checkpoint；同时坏输入不为了诊断再做昂贵签发。预先输入坏不触发file capture；valid输入但wrongroot无输出grant。

## 时间、并发、返回生命周期

execution使用Node单调clock，从call entry开始计时；options.timeout_ms必须1..60000，在读取它前只有严格own-data捕获，capturing完成后与同一起点比较。maximum4个在途operation，先reserve再touchmutable参数，无隐式queue。schema缺字段/额外字段/共享buffer/getter快速拒绝；忙拒绝属于INPUT_INVALID，调用方不能把它当授权状态。

文件I/O是唯一await工作，任何await返回后先检查deadline再下一次read/crypto；异步race早返回只能决定caller已失败，ownedIO/close仍须追踪，slot直到真实settle后释放，晚bytes清零/丢弃，无新签名/外发/输出。同步解析/crypto不能被timer抢占，但每阶段后/每昂贵操作前和最终return前单调检查，不以timer尚未执行就放行。Module内部用token generation标识terminal结果，deadline只能由pending到failed一次，late工作不能改回issued。

Wire issued/refresh/grace/expiry是caller显式权威时间声明，issuer不以Date.now擅自调整或强制当前active，也不把expired/revoked状态输出当active。Core计算耗时不能自动延长任何wire期限。Activation own clock与account状态在调用前后和最终持久事务分别判断；issuer不接受任意调用者clock来重置deadline。

issuer不负责网络发送或进程持久化；返回issued后grant已交本地调用者，后来service revoke不能撤回既有bytes。若上层未await，issuer调用仍按自身deadline运行，不能虚构outer callback关闭语义：上层deadline终态必须丢弃late Core结果，Core返回不等于service challenge成功或发给用户。所有secret/CEK/plaintext ownedBuffer在finally best-effort清零，不能承诺清除调用者原buffer或V8全部中间对象；不暴露这些对象且不记录其日志。输出grantBytes为单独owned copy，调用者修改不回写内部验证输入。

Deadline granularity: the unchanged synchronous createExternalKeyGrant is one non-preemptible unit. Check before, after and before result publication; no timer-interruption claim.

## Input-shape ordering clarified for the r2 repair

All options, secrets and source shape validation and owned byte capture complete before Node DER import/export or public-key derivation. Relative/NUL paths, records/proxies, shared/empty/oversized source bytes are pre-rejected with zero file or key-crypto calls; malformed nonempty DER combined with such source still yields ISSUER_INPUT_INVALID before DER parsing. This retains the first-await capture and reserved-slot rules.

A structurally legal absolute path may still be missing, non-regular or oversized on disk. Those facts require file I/O and are distinct from pre-known source shape: existing key checks may run first, then bounded open/stat/read; a file failure never enters asset decryption or grant signing. Any acquired handle must finish closing before its owner releases the slot.
