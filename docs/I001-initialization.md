# I001 · MAIHANGUL 초기화 기록

> 이 문서는 2026-09-29 당시 기록이다. 2026-09-30의 상세 설계·티켓·사용자 승인에 따른 GitHub 저장소 생성 및 master 전환 상태는 [I002](I002-development-plan.md)와 [외부 발행 준비](tickets/PUBLISHING.md)를 따른다. 아래 당시 브랜치·remote·승인 상태를 현재 상태로 해석하지 않는다.

- 날짜: 2026-09-29
- 범위: 사용자 요청에 따른 신규 프로젝트 로컬 초기화와 Codex Desktop Projects 등록.
- 작업명: MAIHANGUL (MAI + HANGUL). 상표·도메인 미확인.
- 상태: 로컬 구조·문서·거버넌스·Obsidian 초기화 검증 통과. Codex Desktop Projects 등록 확인 완료.

## 생성 산출물

- `C:/TEST/MAIHANGUL`: 로컬 Git 저장소, 브랜치 `codex/initial-setup`.
- README, CLAUDE 원본, AGENTS 생성 사본, gitignore.
- A001 PRD, D001 설계 초안, T001 검증 계획, 문서 인덱스.
- src/tests 디렉터리, benchmarks 미측정 scaffold, 콘텐츠 권리 장부.
- MAIBOT projects.json, MEMORY 인덱스와 프로젝트 운영 기록 등록.
- Harness 원본 roster/presets와 MAIBOT 참조본에 프로젝트 등록.
- A03 §5.1 소속 미정 프로젝트 등록. 신규 BU 출범은 미결정.

## 환경 검증

- codex-env-sync: 지침·MCP 생성, 프로젝트 신뢰 경로 등록.
- Harness의 변경된 참조 2개만 원본 생성기의 UTF-8 writer로 재생성하여 다른 스킬·파일을 보존했다.
- 전체 `-Check`: changes 0, exit 0. 기존 독립 `.agents/skills` 112개에 대한 관리 외 경고 1개는 의도된 Codex 변형이라 보존했다.
- `codex debug prompt-input`: exit 0. 프로젝트 지침 제목·마지막 절·Harness 문구 실제 로딩 확인. AGENTS 4,473 bytes. 개인 맥락을 포함한 전체 prompt는 출력·저장하지 않았다.
- MCP는 설정 변환을 확인했으며 각 서버의 인증·실제 도구 호출은 이 초기화에서 검증하지 않았다.
- `.codex/config.toml`은 로컬 MCP 설정이므로 gitignore 대상이다.
- 문서·JSON·지침 11파일의 UTF-8 BOM/공백/로컬 링크 검사: 문제 0건. `git diff --check` 통과.
- MAIBOT 레지스트리의 MAIHANGUL 항목 1개, 실제 CLAUDE 존재와 hasClaude 일치.
- 원본과 MAIBOT roster 해시 일치, Codex 생성 roster/presets는 원본과 해시 일치. 기존 MAIBOT presets의 다른 차이는 보존했다.

## Obsidian

- 경로: `C:/Users/jini9/OneDrive/Documents/JINI_SYNC/01.PROJECT/34.MAIHANGUL`.
- `_DASHBOARD.md`, `KANBAN.md`, Sprint 1 작업 5개 생성.
- `docs` SymbolicLink → `C:/TEST/MAIHANGUL/docs`; PRD·설계·문서 인덱스 해시 일치.
- TEMPLATES Dashboard와 MAI-Universe에 초기화 상태·미정 수익·가설 연계를 반영.
- MASTER는 기존 `loadMasterProjectRows`와 `replaceAutoSection` export 함수로 AUTO 블록만 갱신. MAIHANGUL 행 1개 및 재실행 동일성 확인.
- 로컬 연결 검증이다. OneDrive 원격 동기화는 미검증.

## Codex Desktop Projects

- `codex app C:\TEST\MAIHANGUL`: exit 0, workspace open 요청 전달.
- 앱 소스에서 확인한 `codex://new?path=...` 프로젝트 등록 경로도 호출했다. 대화 prompt는 전달하지 않았다.
- `list_projects` 재조회에서 label `MAIHANGUL`, path `C:\TEST\MAIHANGUL`, isGitRepository `true` 확인.
- Desktop project ID: `0dcee85c-c688-4381-a2dd-d232aa82beb6`.
- `list_threads`의 sidebar sections에서 해당 ID가 `Projects`(sectionId `threads`)에 포함된 것을 확인했다.
- 새 대화를 실행하지 않고 기존 로컬 프로젝트를 Projects 메뉴에 추가했다.
- Claude Code의 세션별 프로젝트 디렉터리는 해당 도구에서 이 작업 경로를 열 때 자동 생성되며, 이 초기화에서는 생성·실행 여부를 주장하지 않는다.

## 남은 외부 단계

- 제안 대상: `jini92/MAIHANGUL` 비공개 GitHub 저장소.
- 최초 커밋·원격 저장소 생성·push: 사용자 승인 전 미실행. 로컬 remote 없음.
- 승인 시 이 프로젝트의 검토된 파일만 커밋하고 로컬 MCP·자격증명·다른 저장소 변경은 제외한다.
- MAIBOT 및 사용자 변경을 포함한 일괄 stage/commit/push는 수행하지 않는다.
- 블로그 분류 tier·조직 소속·가격은 미정. 레지스트리 `tier` 생략(unclassified), `blog_eligible=false`.

## 승인 전 교차검토

- 검토 모델: GPT-5.6-sol (다른 모델의 Codex 읽기 전용 검토).
- 판정: CONCUR. 비공개 저장소 생성과 이 프로젝트 검토 파일만 최초 commit/push하는 제안 범위에 동의.
- MAIBOT MEMORY 갱신일 지적은 2026-09-29로 반영했다.
- 저장소 공개 전 개인 로컬 경로 일반화와 실제 자산·번역·입력 검증을 별도로 수행해야 한다.
- 모델 검토는 사용자 승인이나 제품 동작 검증을 대신하지 않는다.

## 제품 상태

현재 실행 가능한 게임·패키지 설치·브라우저 입력 테스트·교육 효과 실험·외부 배포는 없다. 초기화 검증과 제품 검증은 구분한다.
