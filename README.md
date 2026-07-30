# 星纱塔罗 · 占卜模拟器

一个完全离线运行的中文塔罗牌GUI。浏览器负责桌面级界面、洗牌、发牌和3D翻牌动画；Python只负责启动本地服务，不需要安装第三方包。

## 启动

最简单的方式：

1. 双击 `启动星纱塔罗.bat`。
2. 应用会自动在默认浏览器中打开。
3. 关闭最后一个应用页面后，本地服务、脚本和控制台会在短暂宽限后退出。

也可以在终端运行：

```powershell
git clone https://github.com/AAAYNMMM/astra-tarot-simulator.git
cd astra-tarot-simulator
python run.py
```

默认使用本机端口 `57321`；若端口被占用，会自动选择临时空闲端口。

不自动打开浏览器：

```powershell
python run.py --no-browser
```

也可以使用 `--port 8765` 指定端口。

## 已实现功能

- 完整78张塔罗牌：22张大阿卡纳、56张小阿卡纳。
- 四套完整牌组：Rider–Waite–Smith、阿尔诺古典、瑞士1JJ、Solesio皮埃蒙特。
- 牌组正面与牌背整体切换，不使用滤镜或色相旋转伪造不同牌组。
- 洗牌、逐张发牌、3D翻牌、选牌高亮和完成动画。
- 六大主题和42个固定预设问题。
- 四种固定牌阵：心语单张、时间之流、五牌十字、凯尔特十字。
- 基于问题主题、牌位、正逆位、牌型、元素和关系的当前规则解读。
- 综合讯息与三步行动建议。
- 本地历史查看、单条删除和全部清空。
- 减少动画偏好、键盘操作、移动端适配和PWA离线缓存。
- 页面关闭通知本地启动器，刷新具有短暂宽限。

## 开发路线

目标2.0采用完全离线、可复现、可审计的纯规则解牌引擎：

- 运行时不调用AI大模型或在线生成服务。
- 保持现有四种牌阵和固定问题模式。
- 单牌资料、多牌综合和问题贴合度目标均为9.0/10以上。
- 抽牌、正逆位和解读严格分离。
- 源码使用原生ES Modules，无强制npm构建。
- 完整历史迁入本机IndexedDB，并保存证据链、版本和artifact指纹。

规则引擎开发前先完成Phase M模块化，把当前大型JavaScript、CSS和数据文件渐进迁移到 `src/`。每个新模块必须立刻由真实应用使用和回归，不在最后进行一次性大爆炸切换。

项目不使用GitHub Actions。代码、数据、存储、缓存和发布验证统一通过 `AAAYNMMM/CWapi` 本地Runner对固定commit执行，并返回可审计RESULT。

## 开发文档权威顺序

后续开发代理按以下顺序读取：

1. [`AGENTS.md`](AGENTS.md)：接手、开始、继续和审查规则。
2. [`docs/DECISIONS.md`](docs/DECISIONS.md)：不可擅自改变的产品和技术决策。
3. [`docs/EXECUTION_CONTRACTS.md`](docs/EXECUTION_CONTRACTS.md)：任务编号、依赖、状态、验证和发布顺序的唯一执行来源。
4. [`docs/PROGRESS.md`](docs/PROGRESS.md)：当前活动任务、证据和唯一下一任务。
5. 当前阶段直接相关的领域规范：
   - [`docs/MODULARIZATION_PLAN.md`](docs/MODULARIZATION_PLAN.md)
   - [`docs/DATA_ARCHITECTURE.md`](docs/DATA_ARCHITECTURE.md)
   - [`docs/ENGINEERING_GUARDS.md`](docs/ENGINEERING_GUARDS.md)
   - [`docs/FINAL_QUALITY_GUARDS.md`](docs/FINAL_QUALITY_GUARDS.md)
   - [`docs/ENGINE_ARCHITECTURE.md`](docs/ENGINE_ARCHITECTURE.md)
   - [`docs/CARD_DATA_STANDARD.md`](docs/CARD_DATA_STANDARD.md)
6. [`docs/ROADMAP.md`](docs/ROADMAP.md)：阶段导航和任务目录。

当前唯一下一任务以 `PROGRESS.md` 为准。规划已经冻结，连续审查在两轮没有新重大问题后停止，不能继续用“再优化一下文档”推迟开发。人类已经为此准备了足够多的Markdown。

## 当前下一任务

```text
MOD-001：模块边界、数据边界与基线验证
```

它将建立模块映射、已知技术债基线、依赖检查和最小CWapi验证入口，不改变运行行为。

## 隐私与说明

应用不会联网发送问题或牌面。当前历史记录保存在浏览器 `localStorage` 中；目标2.0会把完整历史和证据链迁移到本机IndexedDB，小型设置继续使用 `localStorage`。清除浏览器站点数据会删除本地记录。

塔罗内容用于自我觉察、叙事探索和娱乐，不替代医疗、法律、投资或其他专业意见。

## 牌面来源

经典韦特使用LuciellaES整理的 [Rider-Waite Smith Tarot Cards (CC0)](https://luciellaes.itch.io/rider-waite-smith-tarot-cards-cc0)；其余三套历史牌面来自Wikimedia Commons公共领域馆藏。

逐套来源、映射与许可说明见各牌组目录中的 `SOURCE.md`。运行应用时不会从外部网站加载图片。

重新获取历史牌面：

```powershell
.\scripts\fetch_historic_decks.ps1
```

## 快捷键

- `Ctrl+Enter`：在准备页开始占卜。
- `R`：牌阵发完后翻开全部牌。

## 当前基础验证

```powershell
python -m unittest discover -s tests -v
node tests\smoke_test.js
```

Phase M会建立统一的 `automation/validate.py`，并通过CWapi对固定commit执行。应用本身不依赖Node.js，也不使用GitHub Actions。
