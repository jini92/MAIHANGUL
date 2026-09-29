# MAIHANGUL 문서

상태: **상세 설계·티켓·로컬 Kanban 준비 / 제품 미구현** · 기준일: 2026-09-30

## 문서 정본

| 문서 | 책임 | 현재 상태 |
|---|---|---|
| [A001 요구사항](A001-PRD.md) | R01~R19, MVP/가정/후속 범위 | 상세 설계 Draft |
| [D001 아키텍처](D001-architecture-overview.md) | 모듈·데이터 흐름·로컬 저장·개인정보 | Draft / 미구현 |
| [D002 UX](D002-learning-game-ux.md) | 5개 화면·와이어프레임·상태·키보드 | Draft / 미구현 |
| [D003 입력·채점](D003-input-scoring.md) | IME·NFC·정규화·산식·비교 정책 | 실기 검증 전 |
| [D004 콘텐츠·권리](D004-content-data-rights.md) | 데이터·20개 개념·검수·권리 기록 | 콘텐츠 미검수 |
| [T001 검증](T001-validation-plan.md) | V01~V19·실기 환경·3언어·사용자 탐색 | 제품 검사 미실행 |
| [I001 초기화](I001-initialization.md) | 2026-09-29 당시 생성·등록 이력 | 과거 기록 보존 |
| [I002 개발 계획](I002-development-plan.md) | PlannerOutput·추적표·의존·MVP 단계 | 계획 / 제품 미실행 |
| [I003 문서 검증](I003-design-validation.md) | 이번 문서 루프의 실제 검사·잔여 경계 | 문서 검사 기록 |
| [개발 티켓](tickets/INDEX.md) | MH-001~MH-020의 수용 가능한 작업 단위 | Ready 4 / Blocked 15 / Backlog 1 |
| [외부 발행 준비](tickets/PUBLISHING.md) | 대상·제목/본문·라벨·의존·실제 발행 상태 | Issue 미발행 |
| [권리 장부](../content/ASSET-LICENSES.md) | 도입 자산별 권리 근거 | 제품 자산 등록 없음 |

## 읽는 순서와 다음 작업

A001 → D001 → 담당 영역 D002/D003/D004 → I002와 해당 티켓 → T001 순으로 읽는다. 동일 규칙을 고칠 때 정본을 먼저 고치고 다른 문서의 링크·수용 기준을 맞춘다.

첫 개발은 MH-001이며 MH-002·003·006도 Ready다. Ready는 개발 착수 가능 상태이며 구현·합격을 뜻하지 않는다. 실제 OS IME·콘텐츠 검수·학습 효과·외부 공개는 별도 근거가 필요하다.

현재 GitHub 저장소는 사용자 승인으로 비공개 생성됐다. 최초 commit/push·Issue 발행 상태는 외부 발행 준비 문서에 기록한다. 제품 구현과 benchmark는 미실행이다.
