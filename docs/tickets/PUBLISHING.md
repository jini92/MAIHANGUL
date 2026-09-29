# 외부 티켓 발행 기록

기준일: 2026-09-30 · 로컬 티켓 준비 및 **GitHub Issue 20건 발행 완료**

## 실제 연결 상태

- 대상: [jini92/MAIHANGUL](https://github.com/jini92/MAIHANGUL), 비공개, Issues 활성.
- 사용자 명시 승인으로 저장소 생성, 최초 문서 commit/push 및 Issue 20건 발행을 완료했다.
- 최초 커밋: `01288d88d412a81a41bb76650901df58cbfc6253` (검토된 문서·scaffold 40파일).
- 로컬 `master`가 `origin/master`를 추적한다. origin은 `https://github.com/jini92/MAIHANGUL.git`이다.
- 최초 push 뒤 API에서 `private=true`, `default_branch=master`를 확인했다. 이전 빈 저장소 422 제약은 해소됐다.
- 발행 전 기존 Issue 0건을 확인하고, 의존 순서로 20건을 발행한 뒤 재조회했다.
- Projects 목록은 read:project 권한 부족으로 조회 불가. 권한 변경이나 별도 GitHub Project 생성/등록은 하지 않았다.
- 현재 개발 루프와 실제 기능/검증 상태는 [I004](../I004-harness-development.md)를 따른다.

## 최초 발행 당시 목록과 본문 정본

아래 상태는 최초 발행 시점의 기록이다. 이후 로컬 구현 수용 상태는 [INDEX](INDEX.md)를 따른다. 원격 재조회 결과 Issue 20건은 모두 OPEN이며 제품 코드 후속 commit/push와 이슈 종료는 아직 실행하지 않았다.

- [MH-001](MH-001.md): `[MH-001] 한글 IME 이벤트 순서와 제출 경계 실험` — Ready, P0; 선행 없음.
- [MH-002](MH-002.md): `[MH-002] Telex·VNI와 NFC 문자 단위 실험` — Ready, P0; 선행 없음.
- [MH-003](MH-003.md): `[MH-003] 문항 스키마와 검수 상태 검증기` — Ready, P0; 선행 없음.
- [MH-004](MH-004.md): `[MH-004] 20개 자체 문항 초안과 권리 이력 작성` — Blocked, P1; 선행 MH-003.
- [MH-005](MH-005.md): `[MH-005] 단어·생활문장·카페 3개 기준 문항 검수` — Blocked, P0; 선행 MH-004.
- [MH-006](MH-006.md): `[MH-006] 로컬 앱 기반과 3언어 UI 설정` — Ready, P1; 선행 없음.
- [MH-007](MH-007.md): `[MH-007] 확정 입력 제어와 문항 전환 보호` — Blocked, P0; 선행 MH-001, MH-002, MH-006.
- [MH-008](MH-008.md): `[MH-008] 문자 정확도·속도·의미 점수 계산` — Blocked, P0; 선행 MH-003, MH-006.
- [MH-009](MH-009.md): `[MH-009] 한 문제 입력·채점·해석·결과 연결` — Blocked, P0; 선행 MH-005, MH-006, MH-007, MH-008.
- [MH-010](MH-010.md): `[MH-010] 시간제한 없는 독자 카페 의미 게임` — Blocked, P1; 선행 MH-009.
- [MH-011](MH-011.md): `[MH-011] 진도 저장·버전 이관·앱 데이터 삭제` — Blocked, P1; 선행 MH-003, MH-006.
- [MH-012](MH-012.md): `[MH-012] 오류 유형 복습·진도·이어하기` — Blocked, P1; 선행 MH-009, MH-010, MH-011.
- [MH-013](MH-013.md): `[MH-013] 오디오 부재·재생·실패 흐름` — Blocked, P1; 선행 MH-003, MH-006.
- [MH-014](MH-014.md): `[MH-014] 키보드·확대·스크린리더 접근성 검증과 수정` — Blocked, P1; 선행 MH-010, MH-012, MH-013.
- [MH-015](MH-015.md): `[MH-015] 3개 UI·연습 언어 조합 통합 검증` — Blocked, P1; 선행 MH-009, MH-010, MH-012, MH-013.
- [MH-016](MH-016.md): `[MH-016] 통합 화면 실제 Windows IME 수용 검증` — Blocked, P0; 선행 MH-007, MH-009, MH-010, MH-012.
- [MH-017](MH-017.md): `[MH-017] 저장·오디오·중단 실패 통합 검증` — Blocked, P1; 선행 MH-011, MH-012, MH-013.
- [MH-018](MH-018.md): `[MH-018] 20개 전체 콘텐츠·UI 문구·권리 수용` — Blocked, P0; 선행 MH-004, MH-005, MH-015.
- [MH-019](MH-019.md): `[MH-019] MVP 수용 근거와 요구사항 추적 종결` — Blocked, P0; 선행 MH-014, MH-015, MH-016, MH-017, MH-018.
- [MH-020](MH-020.md): `[MH-020] 소규모 사용성·의미 회상 파일럿` — Backlog, P2; 선행 MH-019.

각 파일의 **목적과 사용자 변화부터 미확정 사항·외부 의존까지**가 전체 발행 본문이다. 제목·예정 라벨·의존성은 파일 frontmatter와 “외부 발행 준비”에 있다. 별도 복사본을 관리하지 않는다.

본문 발행 시 상대 문서 링크는 최초 push가 완료된 master의 실제 저장소 URL로 바꾼다. 문서가 아직 원격에 없으면 깨진 링크로 발행하지 않고 문서 업로드를 먼저 승인·완료하거나 본문 안에 문서 식별자를 텍스트로 남긴다. 개인 PC 절대 경로·TEMP 백업 경로·로컬 인증 설정은 본문에 넣지 않는다.

## 라벨과 의존 관계

예정한 priority:*/area:*/phase:* 라벨을 생성해 각 이슈에 적용했다. 기존 라벨은 보존했다. 티켓 본문의 상대 문서 링크는 실제 master 파일 URL로 변환했고, 각 이슈 본문에 실제 선행 Issue URL을 넣었다.

발행 번호는 의존 순서에 따라 부여됐으므로 MH 번호와 GitHub 번호가 항상 같지는 않다. 각 티켓 external_issue 필드가 실제 연결 정본이다.

| 로컬 티켓 | 실제 외부 ID | URL | 상태 |
|---|---|---|---|
| [MH-001](MH-001.md) | #1 | [Issue](https://github.com/jini92/MAIHANGUL/issues/1) | 발행 완료 |
| [MH-002](MH-002.md) | #2 | [Issue](https://github.com/jini92/MAIHANGUL/issues/2) | 발행 완료 |
| [MH-003](MH-003.md) | #3 | [Issue](https://github.com/jini92/MAIHANGUL/issues/3) | 발행 완료 |
| [MH-004](MH-004.md) | #5 | [Issue](https://github.com/jini92/MAIHANGUL/issues/5) | 발행 완료 |
| [MH-005](MH-005.md) | #10 | [Issue](https://github.com/jini92/MAIHANGUL/issues/10) | 발행 완료 |
| [MH-006](MH-006.md) | #4 | [Issue](https://github.com/jini92/MAIHANGUL/issues/4) | 발행 완료 |
| [MH-007](MH-007.md) | #6 | [Issue](https://github.com/jini92/MAIHANGUL/issues/6) | 발행 완료 |
| [MH-008](MH-008.md) | #7 | [Issue](https://github.com/jini92/MAIHANGUL/issues/7) | 발행 완료 |
| [MH-009](MH-009.md) | #11 | [Issue](https://github.com/jini92/MAIHANGUL/issues/11) | 발행 완료 |
| [MH-010](MH-010.md) | #12 | [Issue](https://github.com/jini92/MAIHANGUL/issues/12) | 발행 완료 |
| [MH-011](MH-011.md) | #8 | [Issue](https://github.com/jini92/MAIHANGUL/issues/8) | 발행 완료 |
| [MH-012](MH-012.md) | #13 | [Issue](https://github.com/jini92/MAIHANGUL/issues/13) | 발행 완료 |
| [MH-013](MH-013.md) | #9 | [Issue](https://github.com/jini92/MAIHANGUL/issues/9) | 발행 완료 |
| [MH-014](MH-014.md) | #14 | [Issue](https://github.com/jini92/MAIHANGUL/issues/14) | 발행 완료 |
| [MH-015](MH-015.md) | #15 | [Issue](https://github.com/jini92/MAIHANGUL/issues/15) | 발행 완료 |
| [MH-016](MH-016.md) | #16 | [Issue](https://github.com/jini92/MAIHANGUL/issues/16) | 발행 완료 |
| [MH-017](MH-017.md) | #17 | [Issue](https://github.com/jini92/MAIHANGUL/issues/17) | 발행 완료 |
| [MH-018](MH-018.md) | #18 | [Issue](https://github.com/jini92/MAIHANGUL/issues/18) | 발행 완료 |
| [MH-019](MH-019.md) | #19 | [Issue](https://github.com/jini92/MAIHANGUL/issues/19) | 발행 완료 |
| [MH-020](MH-020.md) | #20 | [Issue](https://github.com/jini92/MAIHANGUL/issues/20) | 발행 완료 |

## 실행한 승인 범위

2026-09-30 사용자의 “넵 !!” 승인에 따라 검토된 초기 파일 최초 commit·master push·기본 브랜치 설정, MH-001~MH-020 이슈 20건·필요 라벨·선행 링크 발행을 실행했다. 제품 개발도 후속 요청으로 승인되어 별도 개발/검수 루프를 진행한다.

비공개 유지, GitHub Project 생성/등록·공개 전환·운영 배포·모집·유료 의뢰는 실행하지 않았다. 개발 수용 결과와 티켓 완료 여부는 각 티켓의 실제 근거로 갱신한다.
