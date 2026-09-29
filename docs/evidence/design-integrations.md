# Stitch·Blender 연동 기록

작성: 2026-09-30 · 프로젝트 범위 `C:\TEST\MAIHANGUL` · 제품 화면 기준은 [design.md](../../design.md).

## 실제 상태

| 대상 | 설치·등록 | 실제 확인 | 남은 구분 |
|---|---|---|---|
| Google Stitch | Claude Code `.mcp.json` 등록, 두 요청 서버의 프로젝트별 승인 설정, `codex-env-sync`로 Codex 설정 생성 | MCP handshake, 도구 16개, 인증된 `list_projects` 성공. 새 비공개 프로젝트에 디자인 시스템과 화면 시안 1개 생성 완료 | 이 대화의 네이티브 도구 목록은 시작 시점 목록이다. 실제 작업은 Google SDK를 통한 MCP 호출이며 새 세션에서 등록 도구가 로드된다 |
| Stitch 스킬 | Google Labs 저장소에서 5개 프로젝트 스킬 설치, Claude 원본→Codex 복제 | 두 사본 동기화 확인 | 관련 지침은 다음 턴/새 세션에 검색 가능 |
| Blender MCP | Blender 5.2.1 LTS portable, `mcp-for-blender==2.1.1`, 애드온 protocol 11, 양쪽 에이전트 등록 | MCP handshake, 도구 36개, 실제 `get_scene_info` 성공. 전용 빈 씬의 객체 0개 확인 | 새 GUI 엔진을 `WindowStyle Hidden`으로 시작해 연결 유지. 기존 사용자 파일·씬·환경설정 미변경 |

## Stitch

- [Google Cloud 공식 MCP 지원 목록](https://docs.cloud.google.com/mcp/supported-products)에 있는 `https://stitch.googleapis.com/mcp`를 사용한다.
- [Google Labs Stitch SDK](https://github.com/google-labs-code/stitch-sdk) `@google/stitch-sdk@0.3.5`의 `StitchProxy`를 로컬 stdio 연결에 사용했다. 임의의 외부 중계 서버를 추가하지 않았다.
- `codex mcp login stitch`는 `Dynamic client registration not supported`로 실패했다. 사용자 승인 후 기존 Google 로그인에서 Stitch API 키를 발급하고 Windows 사용자 환경변수 `STITCH_API_KEY`에 설정했다.
- 이번에 발급한 Stitch API 키는 채팅·문서·Git·MCP 설정에 넣지 않았다. 로컬 launcher가 해당 사용자 환경변수만 메모리로 읽는다. 이전에 실행한 앱도 신규 환경변수를 읽을 수 있다. 기존 다른 서버의 인증 설정은 출력하거나 바꾸지 않았다.
- 첫 PowerShell 중간 stdio 실행은 자식 종료 전달 문제를 보여 Node 직접 실행으로 바꿨다. 남아 있던 이 작업의 proxy PID 24740만 경로·시작 시각을 대조해 종료했다. 수동 proxy 콘솔을 켜 둘 필요가 없다.

### 실제 생성 결과

- 프로젝트: [MAIHANGUL Keyboard Study](https://stitch.withgoogle.com/projects/12010067946882988516)
- 생성 응답의 공개 상태: `PRIVATE`. 기존 Stitch 프로젝트 수정·공개 게시 없음.
- 디자인 시스템 ID: `8db74f23d967495387acefabd975e73b`
- 화면 ID: `84f89f05c0a44e7fbee7d7a2f4b127d0`
- 화면 제목: `MAIHANGUL - Luyện gõ phím tiếng Hàn cho người Việt`
- 생성 상태: `COMPLETE`. 2560×2298 시안 1개.
- 전송 내용: 목적·화면 구성·자판 안내·짧은 디자인 토큰 문서. 비공개 저장소 전체 코드, 사용자 학습 기록, 키보드 입력 기록은 전송하지 않았다. 유료 모델 옵션을 지정하지 않았다.

Stitch는 큰 ㄱ 목표, R 키 강조, 5행 두벌식 자판, F/J 기준점, 언어 선택과 해석을 포함한 시안을 반환했다. 후속 제안은 정오답 키 상태, 가나다 다음 화면, 손가락 안내표였다. 입력 조합 중 무채점 원칙과 충돌하는 실시간 정오답 제안은 채택하지 않았다.

시안은 비교용 제안이다. 최종 제품은 [design.md](../../design.md)의 초록색 목표 테두리/눌림 채움과 기존 시스템 글꼴을 따른다. 생성 시안의 파랑·주황 강조 및 제안 글꼴을 제품에 자동 적용하지 않았다. 생성 문구·키 위치·언어 설명은 검수 대상이다.

Stitch가 덧붙인 ㄱ 발음·로마자 설명, `Be Vietnam Pro` 글꼴, 단순한 자음 왼손/모음 오른손 설명도 제품에 채택하지 않았다. 특히 B/ㅠ 같은 예외가 있어 그 좌우 일반화는 사용할 수 없다. 화면 생성 성공을 학습 자료·번역·저작권 검수 통과로 해석하지 않는다. 실제 Stitch UI에서 확인한 화면은 계정 아바타 때문에 로컬에 보존하고 공개 저장소에서는 제외한다. 이 시점의 React UI는 자체 구현이며, 이후 시안의 실제 적용은 [I006](../I006-stitch-blender-implementation.md)에 기록한다.

### 설치한 스킬

출처: [google-labs-code/stitch-skills](https://github.com/google-labs-code/stitch-skills), 고정 commit `0337446dadde6f8c94210444e2aa9d546126480f`, Apache-2.0. Google Labs 배포 자료이지만 저장소는 공식 지원 Google 제품은 아니라고 명시한다.

| 스킬 | 사용 목적 |
|---|---|
| `generate-design` | 화면 시안 생성·수정 절차 |
| `extract-design-md` | 코드에서 디자인 기준 추출 |
| `manage-design-system` | 디자인 시스템 생성·관리 |
| `upload-to-stitch` | 디자인 시스템 문서 업로드 의존 |
| `design-md` | 디자인 문서 형식 의존 |

원본은 `.claude/skills/`, 생성 사본은 `.codex/skills/`다. 라이선스와 설치 commit은 `.claude/skills/STITCH-LICENSE`, `.claude/skills/STITCH-INSTALLATION.json`에 기록했다. 기존 전역 81개 스킬은 변경하지 않았다. 동기화 도구가 기존 `.agents/skills` 112개를 경고하지만 이는 기존 독립 사본이며 삭제하지 않았다.

## Blender

[MCP for Blender](https://github.com/ahujasid/mcp-for-blender)는 Blender Foundation 공식 제품이 아닌 커뮤니티 연동이다. `uv` 기존 설치를 사용해 `mcp-for-blender==2.1.1`을 설치했다.

- MCP 연결: `127.0.0.1:9876`
- `DISABLE_TELEMETRY=true`: 기본 익명 사용 기록을 포함해 telemetry 비활성화
- `BLENDER_MCP_SAFE_MODE=1`: 서버의 코드 검사 활성화
- Poly Haven·Sketchfab·Hyper3D 등 외부 자산/생성 기능은 사용하지 않는다.
- 애드온: `%APPDATA%\Blender Foundation\Blender\5.2\scripts\addons\blender_mcp.py`
- 실행 중인 기존 Blender와 설치 본체는 최초 조사에서 발견되지 않았다. 기존 5.2 설정 폴더는 보존했다.

### 본체 다운로드 복구

1. `winget`의 `BlenderFoundation.Blender 5.2.1` 공식 MSI 경로는 HTTP 403으로 실패했다. 공식 `download.blender.org`, `mirror.blender.org`의 직접 요청도 403이었다.
2. [Blender 공식 portable 배포](https://www.blender.org/download/release/Blender5.2/blender-5.2.1-windows-x64.zip/)와 배포 미러를 확인했다. [OCF Berkeley의 미러 안내](https://www.ocf.berkeley.edu/docs/services/mirrors/) 및 [Blender 개발자 포럼의 NLUUG 미러 안내](https://devtalk.blender.org/t/asset-bundle-base-meshes/21535?page=20)를 확인했다.
3. OCF Berkeley와 NLUUG가 제공한 `blender-5.2.1.sha256` 파일 내용이 일치했다. Windows x64 portable ZIP 기대 SHA256은 `0e631dad7d0cad6d5d18abdd2e2550f6c0213215334eda00ddbd3d22b96ecb2c`다.
4. 느린 연결에서 받은 앞부분 137,076,184바이트를 보존하고 남은 부분만 중복 없는 4개 byte range로 받았다. 최종 크기 **404,851,964바이트**와 위 SHA256이 일치했다. 보안 경고·TLS 검사를 해제하지 않았다.
5. 사용자 경로 `C:\Users\jini9\AppData\Local\Programs\Blender\blender-5.2.1-windows-x64\blender.exe`에 portable 설치 완료. Authenticode 서명 **Valid**, 서명자 **Blender Foundation**. 실행 응답은 **Blender 5.2.1 LTS**, build `9e2066aef7ef`다.

### 실제 앱 연결 확인 및 유지

2026-09-30 06:33 KST, 새 Blender 프로세스를 `--factory-startup`으로 시작하고 `read_factory_settings(use_empty=True)`를 해당 새 프로세스에만 적용했다. 기존 `.blend` 파일을 열지 않았다. 기본 Cube·Camera·Light도 포함하지 않은 전용 빈 씬이다.

| 확인 | 실제 결과 |
|---|---|
| 프로세스 | PID `143584`, 위 portable 실행파일 |
| 앱 모드 | GUI 엔진, `background=false`; `Start-Process -WindowStyle Hidden` 사용 |
| 씬 | `MAIHANGUL MCP empty verification` |
| 실제 MCP 응답 | `object_count: 0`, `objects: []`, `materials_count: 0` |
| 열린 기존 파일 | 없음, `bpy.data.filepath` 빈 문자열 |
| 애드온 연결 | protocol 11, `127.0.0.1:9876`, PID 143584 listen |
| 개인정보·환경 | telemetry consent false 및 `DISABLE_TELEMETRY=true`, 사용자 환경설정 저장 없음 |

공식 커뮤니티 애드온은 `blender -b`를 지원하지 않아 GUI 엔진의 이벤트 루프를 사용했다. 별도 콘솔을 수동으로 켜 둘 필요는 없다. 검사 MCP 클라이언트만 닫았고 **Blender 앱과 애드온 listener는 유지**했다. 다른 프로젝트의 Blender 프로세스를 종료하거나 기존 씬을 바꾸지 않았다.

이미 실행 중이면 재사용하고, 종료/재부팅 후에는 다음 로컬 실행기로 다시 연결한다. 포트가 다른 프로세스에 사용 중이면 이를 보존하고 중단한다.

```powershell
pwsh -NoProfile -File C:\TEST\MAIHANGUL\.local\design-integrations\start-blender.ps1
```

일반 Blender 창에서 작업하려면 이 전용 검증 프로세스를 먼저 종료한 후, Blender Preferences에서 설치된 `MCP for Blender` 애드온을 켜고 N 패널의 Start MCP Server를 사용한다. 전용 검증 프로세스는 아래 요청 파일을 감지하면 자신만 정상 종료한다.

```powershell
New-Item -ItemType File -Path C:\TEST\MAIHANGUL\.local\design-integrations\stop-blender.request -Force
```

애드온의 영구 활성화를 위해 기존 사용자 설정을 저장하지 않았다. 새 세션에서 이 프로젝트의 `blender` MCP 도구를 로드하면 현재 유지 중인 listener에 연결할 수 있다. 이번 검증은 실제 앱·빈 씬 조회이며 3D 자산 제작·렌더링·학습 콘텐츠 권리 검수는 수행하지 않았다.

## 로컬 설정과 재확인

`.mcp.json`은 Claude의 프로젝트 정본이며 `.codex/config.toml`은 생성물이다. 기존 `~/.claude.json` 전역 서버 5개는 수정하지 않았다. 새 프로젝트 `.mcp.json`에는 `stitch`, `blender` 2개만 추가했고 동기화 도구가 전역 5개와 프로젝트 2개를 Codex 설정에 병합했다. 두 로컬 설정과 `.local/`은 기존 `.gitignore`에 의해 제외된다.

```powershell
pwsh -NoProfile -File C:\Users\jini9\.claude\skills\codex-env-sync\scripts\Sync-CodexEnv.ps1 -ProjectRoot C:\TEST\MAIHANGUL -Phase mcp -Check
node C:\TEST\MAIHANGUL\.local\design-integrations\probe-stitch.mjs
```

등록 확인은 `claude mcp get stitch`, `claude mcp get blender`, `codex mcp get stitch`, `codex mcp get blender`로 할 수 있다. 등록됨·인증됨·실제 도구 실행됨은 서로 다른 상태다. 새 클라이언트 세션에서 MCP가 다시 로드되어야 하며 Blender 작업은 한 클라이언트씩 사용한다.

Claude의 `.claude/settings.local.json`에는 사용자가 요청한 두 서버만 `enabledMcpjsonServers: ["stitch", "blender"]`로 선택 승인했다. `claude --settings <이 파일> mcp get stitch`와 `mcp get blender` 모두 **Connected**를 확인했다. 전역 자동 허용과 워크스페이스 신뢰 값을 변경하지 않았다. 이 프로젝트를 Claude에서 처음 여는 경우에는 정상 workspace trust 화면을 먼저 거쳐야 저장된 프로젝트 승인 설정을 읽는다. [Claude 공식 신뢰·MCP 승인 규칙](https://code.claude.com/docs/en/mcp#project-server-approvals-and-workspace-trust) 때문에 일반 `claude mcp get`은 그 전까지 Pending approval로 표시될 수 있다.

로컬 상세 근거는 `.local/design-integrations/`의 `stitch-validation.json`, `stitch-project.json`, `stitch-design-system.json`, `stitch-generated-screen.json`, `blender-installation.json`, `blender-runtime.json`, `blender-validation.json`, `blender-scene-info.json`이다. API 키 값은 근거 파일에 저장하지 않는다.
