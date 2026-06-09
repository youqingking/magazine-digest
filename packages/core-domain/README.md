# core-domain

未来的 use case、policy、service seam、repository contract 放在这里。

迁移输入主要来自：

- `backend/surfaces/*`
- `shared/utils/*`
- `domains/*`
- `fixtures/*`

目标是把业务语义从 legacy runtime 中抽离出来，而不是继续扩大 `uni-app` 或 `uniCloud` 耦合。
