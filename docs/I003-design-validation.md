# I003 · 상세 설계·개발 티켓 문서 검증

기준일: 2026-09-30 · 상태: **문서 검사 통과 / 제품 구현·검증 미실행**

## 1. 실행 범위

A001/D001/T001을 상세화하고 D002/D003/D004, I002, MH-001~MH-020와 인덱스·발행 준비를 작성했다. 루트/문서 README, 초기화 기록의 현 상태 안내, 권리 장부 연결을 갱신했다. 실제 Obsidian MAIHANGUL KANBAN.md에 티켓 20건과 문서 링크를 반영했다.

초기 파일은 모두 Git 미추적 상태였으므로 변경 전 파일을 로컬 TEMP에 복사한 뒤 수정했다. 초기화·재설치·제품 구현은 하지 않았다. 문서 34개를 생성/수정했고 CLAUDE.md와 AGENTS.md는 보존했다.

## 2. 정합성 검토와 수정

UX/콘텐츠 상세화 후 별도 읽기 검토를 수행하고 다음을 수정했다.

- 복습 해석을 본 뒤 숨김/즉시 재시작으로 도움 노출을 지울 수 있던 경로: 문항 없는 준비 화면과 방문별 노출 보존 규칙으로 수정.
- 자모·자판 구현 책임 누락: MH-009에 세 언어 변형과 의미 과제 없음 경로를 넣고, 초안 개발 검사/실제 콘텐츠 수용을 구분.
- 보존 기간·버전 비교 필드 부족: 개별 완료시각·콘텐츠/채점 버전·첫 시도 구분과 집계 키 추가.
- 검수 상태 enum·초안 packVersion·보기별 피드백 구조: D004와 티켓을 맞춤.
- 정상 제출 버튼으로 Tab 이동이 속도 중단으로 취급될 모순: 학습 영역 밖 이탈과 정상 제출 포커스 이동을 구분.

수정 후 읽기 재검토에서 위 지적은 해소됐고 해당 범위의 추가 구체적인 수정 요구는 없었다. 이는 문서 검토이며 실제 동작 검증이 아니다.

## 3. 실행한 문서 검사

별도 TEMP 검사 스크립트로 아래 항목을 검사했다. 제품 테스트 파일은 만들지 않았다.

| 검사 | 실제 결과 |
|---|---|
| Markdown 읽기·UTF-8·BOM·깨진 문자·행말 공백 | 36파일 검사, 문제 0 |
| 로컬 문서 링크 | 404개 대상 존재 확인, 깨진 링크 0 |
| 요구사항과 검증 | R01~R19 → 티켓 → V01~V19 연결, 누락 0 |
| 티켓 계약 | 20개 고유 ID, 필수 필드/섹션·라벨·본문 준비 확인 |
| 의존 관계 | 42개 직접 관계, 없는 선행·순환 0 |
| Ready | MH-001/002/003/006, 충족되지 않은 선행 티켓 0 |
| 상태 집계 | Ready 4 / Blocked 15 / Backlog 1, 인덱스와 일치 |
| 콘텐츠 구성 계획 | 20개 고유 개념 ID 행 확인; 실제 제품 데이터·검수 완료 아님 |
| Kanban | 20개 티켓 ID·파일 링크·상태 일치, 기존 Done 2개와 후속 Backlog 2개 보존 |
| Obsidian docs 연결 | SymbolicLink가 현재 docs를 가리키고 티켓 실제 파일 경로 일치 |
| 산식 문서 예시 | D003의 정확도/CPM 4개 예시 재계산 일치; 런타임 Segmenter·IME 검사 아님 |
| 원본 보호 | CLAUDE/AGENTS/gitignore/src/tests/baseline 바이트 일치 |
| 제품 상태 | package.json 없음, src/tests는 기존 .gitkeep만, baseline scaffold·빈 metrics 유지 |
| Git 공백 검사 | git diff --check 및 변경/신규 Markdown 34개 no-index --check 통과 |

첫 검사에서 혼합 줄바꿈/파일 끝 빈 줄을 발견해 이번에 수정한 Markdown만 LF·마지막 개행 1개로 정리한 뒤 재검사했다. 일반 git diff는 미추적 파일을 검사하지 않으므로 원본 스냅샷 및 신규 파일 대비 no-index 검사도 수행했다.

재현 스크립트와 결과 JSON의 로컬 보관 디렉터리: `C:/Users/jini9/AppData/Local/Temp/maihangul-design-20260930-044127/` (`validate_documents.py`, `validation-result.json`). 임시 검증 자료이며 Git 발행 대상에 포함하지 않는다.

## 4. GitHub와 master 상태

대화 중 사용자 명시 승인으로 `jini92/MAIHANGUL` 비공개 저장소 생성, origin 연결을 실행했다. master 요청에 따라 로컬 브랜치를 master로 변경했다. API로 private=true, has_issues=true, size=0을 확인했고 기존 Issue는 0개였다.

빈 저장소의 원격 기본 브랜치 변경은 API 422 `Cannot update default branch for an empty repository`로 실패했다. 원격 메타데이터는 main이며, 최초 master commit/push 후 기본 브랜치를 변경·확인해야 한다. 현재 커밋·push·Issue 발행은 미실행이다. 이 실패는 자동 승인 심사 거절이 아니라 GitHub의 빈 저장소 제약이다.

Projects 목록은 read:project 권한 부족으로 조회하지 못했다. 인증 권한을 확대하지 않았고 별도 Project를 생성·수정하지 않았다. 외부 티켓의 제목·본문·라벨·의존 관계와 정확한 승인 요청 범위는 tickets/PUBLISHING.md에 준비했다.

## 5. 검증하지 않은 것

- 앱 실행·설치·타입/런타임 테스트·실제 Windows IME·브라우저 지원: 미실행.
- 한국어 교육·VI·EN 번역·오디오·권리 최종 검수와 학습 효과: 미실행.
- 참여자 모집·외부 연락·유료 의뢰: 미실행.
- OneDrive 원격 동기화·Obsidian 앱 화면 렌더: 미검증. 로컬 파일/링크 반영만 확인.
- commit/push·GitHub Issue·GitHub Project·공개 전환·운영 배포: 미실행.

다음 개발 착수는 MH-001이 우선이며 MH-002/003/006을 독립 진행할 수 있다. 실제 입력 환경/조작자와 외부 검수 담당이 필요한 시점에는 각 티켓의 완료 조건을 유지한다.
