# GitHub 공개·Pages 배포 독립 검수

검수일: 2026-09-30 · 담당: `keyboard_review` · 사용자 명시 승인: commit/push, 저장소 public 전환, GitHub Pages 배포

## 현재 판정

공개 후보·기존 커밋 이력과 최종 Pages 설정을 검수했으며, 이 범위에서 공개·배포를 차단할 P1/P2 문제를 발견하지 못했다. 초안 체험 표기와 `/MAIHANGUL/` 하위 경로를 확인했다. 이 판정은 소스·빌드 산출물 검수이며, 실제 push·Actions·HTTPS 화면 확인 결과는 [I007](../I007-github-pages.md)에 별도로 기록한다.

## 공개 범위 검사

- `git ls-files --cached --others --exclude-standard`의 최초 후보 131개 파일을 검사했고 최종 설정·문서 반영 후 **133개 파일**을 다시 검사했다. 기존 Git 전체 참조에서 도달 가능한 커밋은 1개(`01288d88d412a81a41bb76650901df58cbfc6253`), 커밋 내 blob/경로 조합은 40개였다.
- 비공개 키 헤더, Google/GitHub/OpenAI/AWS 자격증명 형식, 긴 인증 리터럴, Bearer 토큰, URL 서명·토큰 쿼리 패턴을 값 출력 없이 검사했다. 후보·기존 이력 모두 탐지 0이었다. 이는 정의한 패턴과 확인한 파일 범위의 결과이며 모든 형태의 비밀 부재를 보증하지 않는다.
- `.mcp.json`, `.codex/config.toml`, `.claude/settings.local.json`, `.local/`의 ignore 규칙이 실제로 적용되고 공개 후보·기존 이력에 들어가지 않는 것을 확인했다. 기존 EXA 로컬 자격증명 위치도 제외된 Codex 설정 안에 있으며 값은 조회·출력하지 않았다.
- `.stitch/`의 원본 HTML·README·metadata에는 생성 화면/프로젝트 ID와 공개 폰트/CDN URL이 있으나 인증 토큰·서명된 다운로드 URL은 위 검사에서 발견되지 않았다. 원본 HTML은 앱 실행 코드로 이식하지 않는다.
- 저장된 Stitch 작업공간 화면도 직접 열어 확인했다. `docs/evidence/screenshots/stitch-project.png` 우상단의 계정 프로필 아바타를 발견해 통합 담당에게 알렸다. 최종 `.gitignore` 규칙과 공개 후보 재검사에서 해당 파일의 제외를 확인했다. [I005](../I005-keyboard-design.md)는 공개 근거 링크를 생성 시안 PNG로 바꿨으며 로컬 원본은 보존한다.
- 공개 문서에는 로컬 Windows 경로와 비공개 Stitch 프로젝트 식별자가 있다. 이 값들은 인증 수단이 아니며 실제 키를 포함하는 로컬 설정·실행 로그와 구분한다.

## 설치 스킬·제작 자산 출처

- `.claude/skills/STITCH-INSTALLATION.json`의 고정 commit `0337446dadde6f8c94210444e2aa9d546126480f`를 GitHub 공식 API로 조회했다.
- 해당 upstream root의 `LICENSE`와 로컬 `.claude/skills/STITCH-LICENSE`는 개행을 정규화했을 때 동일했다. upstream root에는 별도의 `NOTICE` 파일이 없었다. 로컬 출처·commit·Apache-2.0 라이선스 파일을 함께 보존한다.
- 5개 스킬의 원본과 Codex 생성 사본 일치는 [연동 독립 검수](review-design-integrations.md)에서 확인했다. 생성 사본과 로컬 MCP 설정은 공개 후보에서 제외된다.
- Noto OFL 원문·NOTICE·폰트 해시 및 자체 Blender 모델/렌더의 근거는 [자산 독립 검수](review-stitch-blender.md)와 [자산 장부](../../content/ASSET-LICENSES.md)를 따른다. 공개 승인으로 원어민 검수·학습 효과·제품 권리 검토를 완료 처리하지 않는다.

Upstream 근거: [고정 commit의 LICENSE](https://github.com/google-labs-code/stitch-skills/blob/0337446dadde6f8c94210444e2aa9d546126480f/LICENSE). 기존 자체 프로젝트 코드의 라이선스를 임의로 추가하지 않았다.

## 최종 배포 설정 검수

- [workflow](../../.github/workflows/pages.yml)는 `master` push와 수동 실행을 받는다. 배포 작업에도 `refs/heads/master` 조건이 있고 테스트·빌드 성공에 의존한다. build는 `contents:read`·`pages:read`, deploy만 `pages:write`·`id-token:write`를 갖는다. checkout의 `persist-credentials:false`와 작업별 timeout을 확인했다. 별도 장기 자격증명을 추가하지 않는다.
- 사용한 공식 `actions/checkout`, `setup-node`, `configure-pages`, `upload-pages-artifact`, `deploy-pages`의 고정 SHA 5개를 각각 해당 공식 GitHub 저장소 API에서 확인했다.
- 배포 artifact는 `dist`에 한정된다. 실제 산출물은 `index.html`, `ime-probe.html`, JS·CSS 각 1개, `assets/keyboard-studio.webp`의 5개 파일이었다. 설계 문서·Blender 원본·로컬 MCP 설정·로그는 Pages artifact에 없다. 공개 저장소에는 승인 범위의 설계·모델 원본이 포함된다.
- `build:pages`는 TypeScript 검사 후 `vite build --mode demo --base /MAIHANGUL/`을 실행한다. 실제 `dist/index.html`의 JS·CSS 경로와 번들 내 WEBP 경로가 `/MAIHANGUL/`로 시작하는 것을 확인했다. App의 이미지는 Vite `BASE_URL`을 사용한다.
- App은 명시적인 `demo` 모드에서 preview 콘텐츠를 제공하며 한국어·영어·베트남어 배너 모두 검수 대기 체험임을 표시한다. 일반 production build의 release 필터는 유지한다. 이 변경에서 입력·채점·진도 저장 모듈을 바꾸지 않았다. 세 언어 UI와 연습 언어의 분리, 입력 경계의 기존 검수는 [이전 독립 검수](review-stitch-blender.md)를 따른다.
- `ime-probe.html`은 입력 이벤트를 현재 탭 메모리에 관찰하는 개발 페이지다. 저장된 사용자 로그나 외부 로그 전송 코드는 확인되지 않았다. 이 페이지와 합성 이벤트 검사를 실제 Windows IME·Telex/VNI 수용 근거로 대신하지 않는다.
- 자산 장부의 공개 체험 승인 연결과 초안·전문 검수 대기 표기, CLAUDE 지침의 승인 범위 갱신을 읽었다. 공개 승인 자체를 콘텐츠·권리·학습 효과 검증 완료로 간주하지 않는다.

통합 담당이 `npm run build:pages` 통과를 보고했다. 이 검수자는 해당 빌드 결과를 직접 읽었으며 전체 테스트·빌드를 중복 실행하지 않았다. 실제 GitHub 배포 성공과 브라우저 동작은 이 정적 검수 판정에 포함하지 않는다.

이 검수자는 제품 코드·workflow·설정·Git 이력·원격 상태를 수정하지 않았고 전체 테스트를 중복 실행하지 않았다. 변경 파일은 이 검수 문서뿐이다.
