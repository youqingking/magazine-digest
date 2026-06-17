# Screenshot Capture Report

## Status

`screenshot-capture-agent` 本轮执行真实捕获前置检查，结果为 `capture_status=blocked`。

No screenshots captured. No raw screenshot PNG files were created. This report is evidence for the blocker, not a screenshot asset set.

## Capture Attempt Evidence

| Check | Command / source | Result | status |
| --- | --- | --- | --- |
| Android platform tools | `where.exe adb` | `C:\Users\Administrator\AppData\Local\Android\Sdk\platform-tools\adb.exe` | `observed_in_repo` |
| Attached Android device | `adb devices` | `List of devices attached` with no attached device rows | `blocked` |
| Storyboard routes | `docs/launch/screenshots/shot-list.json` | `/`, `/article/[articleId]`, `/debug` planned only | `observed_in_repo` |
| Capture output | `artifacts/screenshots/raw/android/en-US/*.png` | no files generated because capture is blocked | `not_applicable` |

## Required Future Metadata

If a future run captures real screenshots, each screenshot must record:

- route
- device
- locale
- commit hash
- shot id
- runtime scenario id
- fixture source

## Human Review Required

- Attach or provision an Android device/emulator.
- Confirm route rendering and capture toolchain.
- Review Google Play screenshot image spec, crop, safe area, and status bar treatment.
- Review content authorization and public store asset selection.

All public screenshot decisions remain `human review required`.
