# Stitch·Blender 연동 독립 검수

검수일: 2026-09-30 · 담당: `keyboard_review` · 방식: 로컬 설정·소스·생성 근거 읽기 전용

## 결론

신규 Stitch/Blender 설정의 양쪽 에이전트 일치와 설치 스킬 동기화를 확인했다. Stitch의 인증된 읽기, 비공개 프로젝트 및 생성 완료 화면은 저장된 실행 근거와 일치한다. Blender ZIP의 실제 크기·SHA256을 독립 재계산했고 설치 실행 파일의 유효한 Blender Foundation 서명을 확인했다. 새 빈 씬의 MCP 호출 성공 기록과 실제 실행 프로세스·localhost 포트가 일치하므로 **로컬 Blender 설치와 MCP 씬 연결의 확인 완료**로 갱신한다. 새 Claude/Codex 대화의 도구 로드 여부는 별도 조건이다.

확정된 P1/P2 구현 결함은 발견하지 못했다. 현재 대화에서 네이티브 MCP 도구로 수행했다고 과장하지 않고 Google SDK 호출과 새 세션 로드를 구분한 문서 표현은 적절하다. 이 검수에서 네트워크 호출·서버/제품 프로세스 실행·새 인증·사용자 환경변수 조회를 수행하지 않았다.

## 확인 결과

| 항목 | 결과와 근거 |
|---|---|
| Claude 프로젝트 설정 | `.mcp.json`에는 `stitch`, `blender` 2개가 있다. 연동 담당은 이 파일이 기존에 없었고 전역 Claude 설정은 변경하지 않았다고 보고했다. |
| 프로젝트 MCP 사용 범위 | 추가된 `.claude/settings.local.json`의 `enabledMcpjsonServers`는 `stitch`, `blender` 두 이름뿐이다. `enableAllProjectMcpServers` 또는 그 밖의 추가 설정은 없다. 이 로컬 파일의 ignore·미추적 상태도 확인했다. 임의의 모든 프로젝트 MCP를 허용하는 변경은 아니다. |
| 기존 서버 유지 | 생성 `.codex/config.toml`에서 `chrome_devtools`, `playwright`, `vibe_kanban`, `exa`, `hwpx` 5개와 신규 2개를 확인했다. 기존 5개는 전역 Claude 설정을 병합한 것이므로, 프로젝트 설정에 7개가 있다는 뜻으로 읽히지 않게 표현한다. 이전 전역 파일과의 독립 diff는 수행하지 않았다. |
| 양쪽 설정 정합성 | 신규 두 서버의 command·args·env가 Claude/Codex 설정에서 동일하다. Stitch는 Node stdio launcher, Blender는 설치된 MCP 실행 파일을 사용한다. |
| Stitch launcher | 공식 Google SDK의 `StitchProxy`와 `https://stitch.googleapis.com/mcp`를 사용한다. 키 문자열을 하드코딩하지 않는다. PowerShell 자식은 이름이 지정된 키만 메모리로 읽고 `windowsHide: true`를 사용한다. 검사자는 launcher를 실행하거나 키를 조회하지 않았다. |
| 인증·실행 근거 | `stitch-validation.json`은 handshake, 도구 16개, 인증된 읽기 성공을 기록한다. `stitch-project.json`의 공개 상태는 `PRIVATE`, 생성 화면 응답의 상태는 `COMPLETE`다. 이 검수에서 실제 호출을 재실행하지 않았다. |
| 외부 전송 범위 | 로컬 생성 스크립트는 짧은 디자인 개요·토큰을 만들고 지정한 Stitch 프로젝트에 전달한다. 코드 전체/학습 기록을 열거해 전송하는 로직은 없다. 기존 프로젝트 수정·공개 게시·유료 모델 선택을 수행했다고 기록하지 않는다. |
| 스킬 출처·동기화 | 설치 명세에 Google Labs 저장소, 고정 commit, Apache-2.0 및 5개 스킬을 기록했다. 원본과 생성 사본의 파일 내용을 비교하여 19개 파일 모두 일치했다. 저장소를 새로 내려받아 고정 commit과 대조하는 공급망 재검증은 수행하지 않았다. |
| Git 제외 | `.mcp.json`, `.codex/config.toml`, `.local/design-integrations/stitch-proxy.mjs`의 ignore 규칙이 실제로 적용되고 세 경로는 추적되지 않음을 확인했다. 스킬 라이선스/설치 명세는 별도 관리한다. |
| Blender 연결 | 최신 `blender-validation.json`은 handshake 성공·도구 36개·`actualBlenderScene: passed`를 기록한다. 실제 MCP 응답인 `blender-scene-info.json`의 씬 이름은 `MAIHANGUL MCP empty verification`, objects/materials는 0이다. 검사자는 호출을 중복하지 않고 응답 근거를 확인했다. localhost 9876, telemetry 비활성화, safe mode 설정이 양쪽에서 일치한다. |
| 다운로드 검증 | 최초 설치 스크립트는 두 미러 checksum 파일의 일치를 확인하고 ZIP의 SHA256이 다르면 압축 해제를 중단한다. 다운로드 재개 스크립트는 HTTP Range/크기/최종 SHA256을 확인한다. 최종 ZIP을 검사자가 직접 `Get-FileHash`로 재계산했으며 404,851,964 bytes, SHA256 `0e631dad7d0cad6d5d18abdd2e2550f6c0213215334eda00ddbd3d22b96ecb2c`로 기대값·`verified-download.json`과 일치했다. |
| 본체 서명·프로세스 | 설치된 `blender.exe`에 직접 `Get-AuthenticodeSignature`를 실행해 유효한 Blender Foundation 서명을 확인했다. PID 143584의 실행 파일 경로가 설치 기록과 일치하며 이 PID만 `127.0.0.1:9876`을 Listen하는 것을 읽기 전용 OS 조회로 확인했다. |
| 새 씬·사용자 파일 보호 | `start-blender.ps1`은 지정한 portable 본체를 `--factory-startup`과 새 검증 스크립트로 숨겨 시작한다. 기존 포트 점유자는 식별 후 보존한다. 검증 스크립트는 로드된 사용자 파일이 있으면 중단하고 새 빈 씬을 만든다. 최신 runtime의 `loadedFile`은 빈 문자열이고 저장·사용자 설정 저장 호출은 없다. |

## 비밀값 위치 확인

기존 설정의 `.codex/config.toml` → `mcp_servers.exa.env.EXA_API_KEY`에 환경변수 참조가 아닌 비어 있지 않은 값이 있다. 값은 출력·복사하지 않았다. 해당 파일은 Git에서 제외되고 추적되지 않는다. 이번에 추가한 Stitch 서버 설정과 launcher에는 Stitch API 키 값을 넣지 않았다.

연동 문서의 “키 값은 MCP 설정에 넣지 않았다”는 문장은 **이번 Stitch 키**에 관한 설명으로 한정한다. 전체 기존 MCP 설정에 비밀값이 없다는 의미로 확대하지 않는다.

## 실행 범위와 남은 구분

- Blender ZIP·본체 설치·프로세스·빈 씬 `get_scene_info`의 근거 확인은 완료했다. 시작 스크립트의 창 숨김 요청과 Blender runtime의 `background: false`는 양립한다. 이는 GUI 엔진을 숨겨 실행한 것이며 완전한 headless 모드라고 표현하지 않는다.
- `blender-runtime.json`의 `externalAssetsEnabled: false`는 시작 스크립트가 기록한 고정값이다. 실제 외부 서비스별 설정을 모두 조회한 측정 결과로 해석하지 않는다. 이번 검증은 빈 씬 조회이며 외부 자산 서비스의 호출 근거는 없다.
- 새 Claude/Codex 클라이언트 세션에서 등록된 MCP가 로드되는 상태는 문서상 재시작 조건으로 유지한다. 현재 SDK 호출 성공과 각 클라이언트 세션의 실제 호출 성공은 구분한다. Claude의 명시적 로컬 설정을 사용한 연결 확인과 최초 workspace trust 화면도 구분한다.

검수 중 설정·제품 코드·외부 프로젝트를 수정하지 않았다. 실제 제품 FE 검증은 [I005](../I005-keyboard-design.md)와 [자판 검수](review-keyboard.md)를 따른다.
