# uni-id Foundation

## Project root

For this repository, the actual uni-app project root is `mobile/`.

That means the official DCloud paths should be read relative to the project root, not the repository root.

## Canonical project paths

Inside the `mobile/` project, the fixed canonical paths are:

- `uniCloud/cloudfunctions/common/uni-config-center/uni-id/config.json`
- `uniCloud/cloudfunctions/uni-id-co/`
- `uniCloud/cloudfunctions/common/uni-id-common/`

On disk in this repository with `uni_modules` installed, those resolve to:

- `mobile/uni_modules/uni-config-center/uniCloud/cloudfunctions/common/uni-config-center/uni-id/config.json`
- `mobile/uni_modules/uni-id-pages/uniCloud/cloudfunctions/uni-id-co/`
- `mobile/uni_modules/uni-id-common/uniCloud/cloudfunctions/common/uni-id-common/`

## Working rule

- Treat `mobile/` as the only real app project.
- Treat `mobile/uni_modules/` as the active source for official `uni-id-pages`, `uni-id-co`, `uni-id-common`, and `uni-config-center` module implementations.
- Do not keep duplicate project-level cloudfunctions or common modules with the same names under `mobile/uniCloud-aliyun/`.

## Current H0 status

- `uni-id` config path is present with placeholder secrets only.
- `uni-id-co` should come from the installed official module when `uni-id-pages` is present. Do not keep a second project-level placeholder object with the same name.
- `uni-id-common` should come from the installed official module copy under `uni_modules`.
- Login methods, SMS, test accounts, and live module import still require `NEED_HUMAN`.
