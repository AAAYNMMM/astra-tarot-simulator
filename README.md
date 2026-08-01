# 星纱塔罗 · 占卜模拟器

星纱塔罗 2.0.0 是一个完全离线运行的中文塔罗牌 GUI。浏览器负责界面、抽牌、规则解读、历史和 PWA；Python 标准库只负责启动本地服务，不需要安装第三方包。

## 启动

最简单的方式：

1. 双击 `启动星纱塔罗.bat`。
2. 应用会自动在默认浏览器中打开。
3. 关闭最后一个应用页面后，本地服务会在短暂宽限后退出。

也可以在终端运行：

```powershell
git clone https://github.com/AAAYNMMM/astra-tarot-simulator.git
cd astra-tarot-simulator
python run.py
```

默认使用本机端口 `57321`；若端口被占用，会自动选择空闲端口。使用 `python run.py --no-browser` 可禁止自动打开浏览器。

## 2.0.0 功能

- 完整 78 张结构化塔罗牌资料。
- 六大主题、90 个固定预设问题。
- 四种固定牌阵：心语单张、时间之流、五牌十字、凯尔特十字。
- 四套完整牌组：Rider–Waite–Smith、阿尔诺古典、瑞士 1JJ、Solesio 皮埃蒙特。
- 纯规则 Observation → Relation → Claim → Text 解读链。
- 抽牌、正逆位和渲染使用独立、可重放的随机流。
- IndexedDB 完整历史、旧历史幂等迁移、校验和导入导出和容量降级。
- 错误恢复、脱敏诊断、键盘、焦点和屏幕阅读器支持。
- PWA 临时缓存、受控多标签更新、上一完整 release 回滚。
- 四套牌组按需缓存、进度显示、空间估算和单套删除。
- 552 例开发评测与 48 例 CWapi 受控盲测发布门禁。

## 产品边界

- 运行时不调用 AI 大模型、在线推理 API 或生成式服务。
- 用户只能选择固定预设问题，不提供自由文本解析。
- 四种牌阵和公开业务 ID 保持固定。
- 抽牌先完成，解读后执行；问题和期望结果不会影响抽牌。
- “准确”表示牌义、问题贴合、证据链、条件和一致性，不宣称科学验证的超自然预测能力。

## 离线与更新

首次安装只准备应用壳和知识资料，不会阻塞式下载四套完整牌面。默认或其他牌组可在界面中按需缓存。

新版本先写入临时 release cache，所有必需资源通过状态、类型和传输字节 SHA-256 后才进入 waiting。应用不会在占卜中、待保存或迁移时自行切换；至少保留当前稳定版本和上一完整版本。

详细策略见：

- [`docs/PHASE_9_RELEASE.md`](docs/PHASE_9_RELEASE.md)
- [`docs/RELEASE_ROLLBACK.md`](docs/RELEASE_ROLLBACK.md)
- [`docs/BROWSER_SUPPORT.md`](docs/BROWSER_SUPPORT.md)

## 隐私

问题、牌面、解读、历史和随机种子均保存在本机。应用不会把这些内容发送到外部服务。清除浏览器站点数据会删除本地历史、设置和缓存。

塔罗内容用于自我觉察、叙事探索和娱乐，不替代医疗、法律、投资或其他专业意见。

## 牌面来源

经典韦特使用 LuciellaES 整理的 Rider–Waite Smith Tarot Cards（CC0）；其余三套历史牌面来自 Wikimedia Commons 公共领域馆藏。逐套来源和映射见各牌组目录中的 `SOURCE.md`。

运行时不会从外部网站加载牌面。项目代码使用 MIT License，牌面许可与第三方声明见 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)。

## 开发与验证

应用使用原生 ES Modules，无强制 npm 构建步骤，也不使用 GitHub Actions。

```powershell
python automation/validate.py --scope full
python scripts/doctor.py
```

真实发布验证由 CWapi 本地 Runner 对固定 40 位 commit 执行。2.0.0 的任务状态与证据见 [`docs/PROGRESS.md`](docs/PROGRESS.md)。

## 快捷键

- `Ctrl+Enter`：在准备页开始占卜。
- `R`：牌阵发完后翻开全部牌。

## 隐私与本地数据

星纱塔罗的运行时不连接第三方服务，也不会上传问题、解读、历史记录、随机根种子或诊断正文。浏览器本地服务地址、SVG/XML 命名空间以及 JSON Schema 的声明 URI 仅用于本机运行、资源格式和结构标识，不属于外部网络传输。历史和缓存由浏览器本地存储管理，用户可以在应用内导出、删除牌组缓存或清除历史。
