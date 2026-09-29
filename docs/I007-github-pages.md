# I007 · 공개 저장소와 GitHub Pages 배포

기준일: 2026-09-30. 대상: `jini92/MAIHANGUL`, 브랜치 `master`.

## 승인과 범위

사용자가 commit·push·GitHub Pages 배포를 요청하고 이어 저장소의 public 전환을 명시했다. 기존 로컬 앱·설계·검수·Stitch/Blender 산출물과 배포 설정을 공개 저장소에 반영한다. 자격증명·로컬 MCP 설정·`.local/`·의존성 설치 폴더는 제외한다.

이번 사이트는 **검수 전 학습자료의 체험 미리보기**다. 사용자가 확인한 현재 앱을 웹에서 체험할 수 있도록 `demo` 모드를 명시하며, 문항의 전문가 검수 상태를 승인으로 바꾸지 않는다. 일반 `npm run build`는 기존 `release` 모드의 승인 콘텐츠 필터를 유지한다.

## 빌드와 배포

- 배포 주소: <https://jini92.github.io/MAIHANGUL/>
- [GitHub Actions](../.github/workflows/pages.yml): master의 앱·테스트·빌드 설정 변경 또는 수동 실행 → `npm ci` → 테스트 → `build:pages` → dist 업로드 → Pages 배포.
- Node `22.23.1`, package-lock 고정 설치. GitHub 공식 Actions의 조회한 릴리스 SHA를 고정했다.
- `npm run build:pages`: `vite build --mode demo --base /MAIHANGUL/`. 홈 이미지도 Vite `BASE_URL`을 따라 하위 경로에서 로드한다.
- build 작업은 소스/Pages 읽기, deploy 작업만 `pages:write`·`id-token:write`를 갖는다. 별도 장기 자격증명은 추가하지 않는다.
- 배포 artifact는 `dist/`뿐이다. 설계 문서·Blender 편집 원본·MCP 설정은 사이트 artifact에 포함하지 않는다. 공개 저장소 자체에서 설계·원본을 읽을 수 있는 것은 이번 공개 전환 범위다.
- 학습 기록은 방문자의 브라우저에 저장된다. 로컬 `127.0.0.1` 기록과 공개 사이트 기록은 서로 다른 origin에 속한다.

설정 근거: [Vite 정적 배포 가이드](https://vite.dev/guide/static-deploy), [GitHub Pages REST API](https://docs.github.com/en/rest/pages/pages).

## 검증 기준

1. 공개 전환·push 결과를 실제 GitHub API와 remote SHA로 확인한다.
2. 자동 테스트와 Pages 빌드가 통과하고 독립 검수로 공개 대상·워크플로를 확인한다.
3. Actions가 `completed/success` 상태에 도달해야 배포 완료로 기록한다.
4. 실제 HTTPS 주소에서 홈·자판 이미지·학습 진입·언어 설정을 확인한다. HTTP 200만으로 동작 성공을 대신하지 않는다.
5. 실제 Windows IME/Telex/VNI와 전문 콘텐츠 검수는 기존 미검증 상태를 유지한다.

## 복구

잘못된 화면·자산 로딩 실패·학습 진입 실패가 있으면 수정 commit으로 재배포한다. 이전 정상 앱 commit이 있으면 해당 변경의 revert commit으로 복원하고 master에서 워크플로를 다시 실행한다. 저장소 공개 여부 변경은 배포 복구와 별도 결정이다. 이번 작업은 Git 기록 강제 변경을 사용하지 않는다.

## 실행 결과

- GitHub API에서 저장소 `visibility: public`, 기본 브랜치 `master`를 확인했다. Pages는 `build_type: workflow`, `public: true`, HTTPS 강제로 생성했다.
- 로컬 자동 검사 **9파일·122개 통과**, `npm run build:pages` 통과. 별도 5174 서버에서 `/MAIHANGUL/`의 홈 이미지 1400×900 로드, 자모 ㄱ 학습 진입, DOM 자판 표시, 콘솔 오류·경고 0건을 확인했다.
- [독립 공개·배포 검수](evidence/review-pages.md)에서 P1/P2 차단 사항이 없었다. 로컬 설정과 계정 아바타 화면은 공개 대상에서 제외했다.
- `codex-env-sync -Phase instructions -Check`: 변경 0·경고 0. 지침 원본과 생성 사본이 일치한다.
- 배포 앱 commit: [`41b967bf3884177d7371ae8837444c38d26ac937`](https://github.com/jini92/MAIHANGUL/commit/41b967bf3884177d7371ae8837444c38d26ac937). master push 완료.
- [Actions 실행 36638136056](https://github.com/jini92/MAIHANGUL/actions/runs/36638136056): **completed / success**, build·deploy 모두 success. Linux CI에서도 **9파일·122개 검사 통과**와 Pages 빌드 성공을 로그로 확인했다.
- 실제 공개 HTTPS `index.html`과 `assets/keyboard-studio.webp`는 모두 **HTTP 200**이며 로컬 Pages 빌드와 바이트가 일치했다. WEBP SHA256은 `c7659ea547eafac3b2a4cd007c82cab0d8e06f4ca0ed9b563abd2946160ca0dd`다.
- 실제 공개 사이트의 IAB에서 베트남어 초기 홈 → 영어 UI → 한국어 UI 전환 중 한국어 연습 설정이 유지됐다. 자모 ㄱ와 반투명 자판·세 언어 해석이 표시됐고 이미지 자연 크기는 1400×900이었다.
- 공개 사이트에서 ㄱ 입력 후 입력란 Enter는 제출하지 않았으며 확인 버튼으로 제출한 뒤 정확도 100%가 표시됐다. 콘솔 경고·오류는 0건이었다. 이 검사는 브라우저 값 입력이며 실제 OS IME 검증은 아니다.
- 화면 근거: [공개 홈](evidence/screenshots/pages-home.png), [공개 연습 화면](evidence/screenshots/pages-practice.png). 검수용 로컬 서버는 종료하고 공개 사이트 탭은 홈 화면으로 남겼다.
- 배포 이후 기록·스크린샷을 추가하는 문서 commit은 앱을 바꾸지 않는다. workflow의 경로 조건에 따라 문서만 바꾼 push는 재배포하지 않으며 위 앱 commit이 배포된 버전이다.

## 베트남어 학습·시뮬레이션 후속 배포

2026-09-30 사용자가 베트남어 화면 확인 후 push·배포를 명시 승인했다. 대상은 동일한 공개 저장소의 `master`와 위 Pages 주소다. [I008](I008-vietnamese-simulation.md)의 시뮬레이션, 베트남어 홈·과정 표시, 첫 네 VI 풀이 수정과 검증 기록을 반영한다. 로컬 MCP 설정·`.local/`은 계속 제외한다. 실제 commit·Actions·공개 화면 결과는 실행 후 아래에 기록한다.
