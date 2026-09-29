# MAIHANGUL

베트남 학습자를 위한 한글·한국어 학습 및 타자 게임 프로젝트.

**MAI + HANGUL**: 한글 학습이라는 목적을 바로 드러내는 내부 작업명이다. 상표·도메인은 확인 전이다.

## 현재 상태

- 단계: 로컬 학습 앱과 5줄 자판 UI 구현. 초기 개발은 [I004](docs/I004-harness-development.md), 최초 자판 FE는 [I005](docs/I005-keyboard-design.md), Stitch·Blender의 실제 적용과 최신 검수는 [I006](docs/I006-stitch-blender-implementation.md)에 기록한다.
- 실제 Windows 입력기 호환성·전문가 콘텐츠 검수·학습 효과 검증은 확인 대기다. 공개 체험 배포 상태는 [I007](docs/I007-github-pages.md)에 기록한다.
- 첫 교육 과정: 한글 자모·자판 → 단어 → 생활 문장 → 자체 게임 1종.
- 언어: 한국어·영어·베트남어 UI 및 하단 해석, 세 언어 입력 호환. 첫 학습 과정은 한국어 중심.
- GitHub: [jini92/MAIHANGUL](https://github.com/jini92/MAIHANGUL) **공개**. 2026-09-30 사용자 승인으로 public 전환했다. 로컬·원격 기본 브랜치는 `master`다.
- 체험 주소: [MAIHANGUL GitHub Pages](https://jini92.github.io/MAIHANGUL/). 학습자료는 검수 전 초안이며 화면에 이를 표시한다.
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
- [개발·독립 검수 실행 기록](docs/I004-harness-development.md)
- [자판 FE·Stitch·Blender 연동 기록](docs/I005-keyboard-design.md)
- [Stitch 시안·Blender 자산의 실제 FE 적용](docs/I006-stitch-blender-implementation.md)
- [공개 저장소·Pages 배포와 검증](docs/I007-github-pages.md)
- [디자인 토큰과 자판 동작](design.md)
- [초기화 확인 기록](docs/I001-initialization.md)
- [검증 계획](docs/T001-validation-plan.md)
- [콘텐츠 권리 장부](content/ASSET-LICENSES.md)

## 개발 시작

`CLAUDE.md` 또는 생성 사본 `AGENTS.md`의 지침을 따른다. Node 버전 조건은 [package.json](package.json)의 `engines`를 확인한다.

```powershell
npm ci
npm run dev
# 출력된 로컬 주소를 브라우저에서 연다.
npm test -- tests/
npm run build
```

개발 서버는 20개 개념·60개 언어 변형을 **검수 전 초안 미리보기**로 제공한다. 기본 `npm run build`는 승인된 콘텐츠만 읽으며 현재는 승인 문항이 없어 빈 목록을 표시한다. `npm run build:pages`는 명시적인 `demo` 모드로 초안을 표시하고 `/MAIHANGUL/` 하위 경로에 맞춰 빌드한다. IME 관찰 도구는 사이트 경로 아래 `ime-probe.html`에 있다.

베트남어 UI·학습 문구·성조를 보존하는 입력/채점은 구현되어 있다. 실제 Telex/VNI 키 입력의 호환성은 별도 확인 대기이며, 이는 베트남어 기능 미지원이라는 뜻이 아니다. [검증 범위](docs/evidence/MH-002-vietnamese.md)를 확인한다.

## 참고와 관계

한컴타자의 공개 기능을 참고하되 코드·화면·자산·문장은 독자적으로 제작한다. MAITUTOR는 콘텐츠 연계 후보, MAISTUDYMATE는 학습자 체험 경로 후보다. 현재 구현된 연동은 없다.
