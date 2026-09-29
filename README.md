# MAIHANGUL

베트남 학습자를 위한 한글·한국어 학습 및 타자 게임 프로젝트.

**MAI + HANGUL**: 한글 학습이라는 목적을 바로 드러내는 내부 작업명이다. 상표·도메인은 확인 전이다.

## 현재 상태

- 단계: 상세 설계·개발 티켓·로컬 Kanban 준비 / 설계 Draft.
- 제품 구현, 배포, 학습 효과 검증: 미실행.
- 첫 교육 과정: 한글 자모·자판 → 단어 → 생활 문장 → 자체 게임 1종.
- 언어: 한국어·영어·베트남어 UI 및 하단 해석, 세 언어 입력 호환. 첫 학습 과정은 한국어 중심.
- GitHub: [jini92/MAIHANGUL](https://github.com/jini92/MAIHANGUL) 비공개 저장소 생성 및 origin 연결 완료. 로컬 브랜치 master, 최초 커밋·push는 미실행. 빈 원격의 기본 브랜치 변경은 첫 push 후 확인한다.
- Codex Desktop: Projects 메뉴에 MAIHANGUL 등록 확인 완료.

## 문서

- [문서 인덱스](docs/README.md)
- [제품 요구사항](docs/A001-PRD.md)
- [아키텍처·로컬 저장 설계](docs/D001-architecture-overview.md)
- [학습·게임 UX와 와이어프레임](docs/D002-learning-game-ux.md)
- [다국어 입력·채점 설계](docs/D003-input-scoring.md)
- [콘텐츠·데이터·권리 설계](docs/D004-content-data-rights.md)
- [개발 순서·요구사항 추적표](docs/I002-development-plan.md)
- [개발 티켓 20개](docs/tickets/INDEX.md)
- [초기화 확인 기록](docs/I001-initialization.md)
- [검증 계획](docs/T001-validation-plan.md)
- [콘텐츠 권리 장부](content/ASSET-LICENSES.md)

## 개발 시작

`CLAUDE.md` 또는 해당 도구가 읽는 생성 사본 `AGENTS.md`의 지침을 따른다. 아직 실행 가능한 앱과 의존성 패키지는 없다. 첫 개발은 MH-001 한글 IME 실험이며 MH-002·003·006은 독립 착수 가능하다. 상세 설계·티켓 작성은 제품 구현·검증 완료를 뜻하지 않는다.

## 참고와 관계

한컴타자의 공개 기능을 참고하되 코드·화면·자산·문장은 독자적으로 제작한다. MAITUTOR는 콘텐츠 연계 후보, MAISTUDYMATE는 학습자 체험 경로 후보다. 현재 구현된 연동은 없다.
