# I007 · 공개 저장소와 GitHub Pages 배포

기준일: 2026-09-30. 대상: `jini92/MAIHANGUL`, 브랜치 `master`.

## 승인과 범위

사용자가 commit·push·GitHub Pages 배포를 요청하고 이어 저장소의 public 전환을 명시했다. 기존 로컬 앱·설계·검수·Stitch/Blender 산출물과 배포 설정을 공개 저장소에 반영한다. 자격증명·로컬 MCP 설정·`.local/`·의존성 설치 폴더는 제외한다.

이번 사이트는 **검수 전 학습자료의 체험 미리보기**다. 사용자가 확인한 현재 앱을 웹에서 체험할 수 있도록 `demo` 모드를 명시하며, 문항의 전문가 검수 상태를 승인으로 바꾸지 않는다. 일반 `npm run build`는 기존 `release` 모드의 승인 콘텐츠 필터를 유지한다.

## 빌드와 배포

- 설정 주소: <https://jini92.github.io/MAIHANGUL/>
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
- commit·workflow·실제 HTTPS 화면 결과는 배포 후 기록한다.
