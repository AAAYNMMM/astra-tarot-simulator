# Phase 7：随机、历史与审计

## 完成范围

- `AU-001B`：生产抽牌、正逆位和渲染分别使用由同一版本化根种子派生的独立流；Reading保存根种子、算法、版本、熵来源和派生流信息。
- `AU-002`：建立ReadingRecord 2.0、IndexedDB readings/meta存储和运行时artifact消费指纹。记录不写最终Git commit，commit与manifest对应关系由CWapi保管。
- `AU-003A`：旧localStorage记录幂等迁移到IndexedDB。旧数据不删除，失败不写完成标记。
- `AU-003B`：导出包带稳定校验和；导入先做完整Schema、重复ID和校验和验证，再按skip、replace或keep-both处理冲突。
- `AU-003C`：容量与配额分级提示；IndexedDB或配额失败时保留内存待导出副本，不静默截断或删除结构化历史。

## 冻结边界

- draw、orientation和rendering流互不消费彼此状态。
- 相同根种子、算法版本和输入必须重放出相同牌序与正逆位。
- 旧localStorage继续保留给当前历史UI兼容读取；结构化历史以IndexedDB为主，UI详情升级属于`UI-002`。
- 结构化证据字段已冻结；新版引擎接入UI后直接填充，不得另建第二种历史格式。
- 最终commit、分支名和CWapi任务号不写入每条ReadingRecord。
