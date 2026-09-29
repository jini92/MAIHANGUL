# MAIHANGUL 문서

상태: **로컬 앱 구현·독립 검수 완료 / 실제 입력기·전문가 수용 대기** · 기준일: 2026-09-30

## 문서 정본

| 문서 | 책임 | 현재 상태 |
|---|---|---|
| [A001 요구사항](A001-PRD.md) | R01~R19, MVP/가정/후속 범위 | 상세 설계 Draft |
| [D001 아키텍처](D001-architecture-overview.md) | 모듈·데이터 흐름·로컬 저장·개인정보 | 구현 근거 I004 연결 |
| [D002 UX](D002-learning-game-ux.md) | 5개 화면·와이어프레임·상태·키보드 | 개발 미리보기 구현 |
| [D003 입력·채점](D003-input-scoring.md) | IME·NFC·정규화·산식·비교 정책 | 실기 검증 전 |
| [D004 콘텐츠·권리](D004-content-data-rights.md) | 데이터·20개 개념·검수·권리 기록 | 콘텐츠 미검수 |
| [T001 검증](T001-validation-plan.md) | V01~V19·실기 환경·3언어·사용자 탐색 | 실행 결과는 I004/evidence 참조 |
| [I001 초기화](I001-initialization.md) | 2026-09-29 당시 생성·등록 이력 | 과거 기록 보존 |
| [I002 개발 계획](I002-development-plan.md) | PlannerOutput·추적표·의존·MVP 단계 | 최초 계획·수용 게이트 |
| [I003 문서 검증](I003-design-validation.md) | 이번 문서 루프의 실제 검사·잔여 경계 | 문서 검사 기록 |
| [I004 개발·검수](I004-harness-development.md) | 하네스 팀·초기 구현·자동 검사·독립 검수·잔여 게이트 | 최초 구현 실행 기록 |
| [I005 자판 디자인](I005-keyboard-design.md) | 최초 자판 중심 FE·브라우저 검사·도구 연동 | 이전 실행 기록 |
| [I006 Stitch·Blender 적용](I006-stitch-blender-implementation.md) | 실제 시안·3D 렌더의 앱 적용·검수 | 최신 FE 실행 기록 |
| [I007 GitHub Pages](I007-github-pages.md) | 저장소 공개·master 반영·체험 사이트 배포 | 실제 배포 결과 정본 |
| [I008 베트남어 시뮬레이션](I008-vietnamese-simulation.md) | Telex/VNI 입력 순서·자판 시연·채점 분리 | 로컬 검증 완료·신규 배포 미실행 |
| [디자인 가이드](../design.md) | 색상·자판 표시·입력 보호 계약 | 자체 UI 정본 |
| [개발 티켓](tickets/INDEX.md) | MH-001~MH-020의 수용 가능한 작업 단위 | 현재 상태는 인덱스 참조 |
| [외부 발행 기록](tickets/PUBLISHING.md) | 대상·제목/본문·라벨·의존·실제 발행 상태 | Issue 20건 발행 완료 |
| [권리 장부](../content/ASSET-LICENSES.md) | 도입 자산별 권리 근거 | 자체 초안·의존성 기록, 권리 수용 대기 |

## 읽는 순서와 다음 작업

A001 → D001 → 담당 영역 D002/D003/D004 → I002와 해당 티켓 → T001 순으로 읽는다. 동일 규칙을 고칠 때 정본을 먼저 고치고 다른 문서의 링크·수용 기준을 맞춘다.

최초 착수 순서는 I002에 보존한다. 초기 구현·자동 검사·독립 검수는 I004, 최초 자판 FE는 I005, Stitch·Blender의 실제 디자인 적용은 I006, 개별 수용 상태는 티켓 정본을 따른다. 실제 OS IME·콘텐츠 검수·학습 효과·외부 공개는 별도 근거가 필요하다.

최초 문서 commit/master push와 Issue 20건 발행 이후, 사용자가 저장소 공개·앱 commit/push·Pages 배포를 승인했다. 현재 공개 상태와 배포 결과는 I007을 따른다. benchmark는 실제 측정 전 scaffold 상태를 유지한다.
