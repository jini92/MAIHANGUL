# Stitch 시안·Blender 자산 FE 적용 독립 검수

검수일: 2026-09-30 · 담당: 구현/자산 제작에 참여하지 않은 `keyboard_review`

## 검수 상태

계획·Stitch 원본·FE 변경·최종 반투명 Blender 렌더의 독립 검토를 완료했다. 확정된 P1/P2 결함은 발견하지 못했다. 실제 파일과 앱의 이미지 경로, 저장된 브라우저 화면을 확인했다. 통합 담당의 실제 브라우저 행동 검사·전체 테스트 결과까지 포함해 로컬 적용을 확인했으며, 실제 OS IME·교육·언어·제품 권리 수용은 이 판정에 포함하지 않는다. 기준은 [I006](../I006-stitch-blender-implementation.md), 이전 상태는 `.local/stitch-blender-before/`다.

## Stitch 원본의 적용 경계

대상은 `.stitch/designs/compact-workspace.html`과 화면 ID `79840c32af214556a77c16cf6aaa5615`다. 생성 원본의 시각적 구성과 제품 기능을 분리해야 한다.

| 원본의 확인 사항 | 제품 적용 기준 |
|---|---|
| 가상의 교육 단계·고정 1/4 | 기존 실제 stage·문항 수·현재 문항에서 계산한다. |
| `Kiểm tra (Enter)` 안내 | 기존 composition/확정·제출 계약을 보존한다. 단일 Enter 자동 제출 약속을 이식하지 않는다. |
| 전역 keydown 및 확인 버튼 클릭 시 R 강조 | 연습 입력란의 물리 `event.code`만 표시하는 기존 동작을 유지한다. 버튼 클릭을 키 입력이나 정답으로 표현하지 않는다. |
| UI 언어 옵션에 한국어가 없음·연습 언어 고정 | KO/EN/VI UI와 별도 연습 언어 설정을 유지한다. |
| 왼쪽 Alt를 한/영, 오른쪽 Alt를 한자로 표기 | 원본의 Windows 오른쪽 Alt 안내와도 충돌한다. 기존 표준 QWERTY Alt 표기를 유지하며 기기별 전환키를 확정하지 않는다. |
| Google Fonts/Material Symbols/Tailwind CDN | 로컬 React/CSS와 기존 시스템 글꼴로 적용한다. 외부 스크립트·폰트 요청을 추가하지 않는다. |
| `© 2024`와 목적지 없는 도움말 링크 | 확인되지 않은 정보와 작동하지 않는 조작을 제품에 추가하지 않는다. |

## FE 구조 검수 결과

- `App.tsx`·`PracticeSession.tsx`·`KeyboardGuide.tsx`를 변경 전 스냅샷과 대조했다. 기존 입력 핸들러·IME 확정·채점·저장·중단·복습·언어 변경 확인의 로직은 그대로 유지했다.
- `stageProgress`는 실제 콘텐츠 목록과 현재 언어·콘텐츠 개정에 맞는 `completedIds`에서 계산한다. 표시만 바꾸며 저장된 진도를 생성·보정하지 않는다. 현재 문항의 stage만 `aria-current=step`이다.
- `TargetCue`는 단일 한글 목표에 대한 기존 정적 `jamoKeySteps`를 읽고 입력란 값·조합 상태·정답 판정에 접근하지 않는다. 실제 목표가 `ㄱ`일 때 `R`을 정답으로 바꾸지 않는 회귀 검사가 추가되었다.
- 원본의 임의 교육 과정, Enter 제출 문구, 전역 R 감지, 확인 버튼의 가짜 키 강조, Alt 한/영·한자 표기, 언어 옵션 누락, CDN, 임의 저작연도·가짜 링크를 이식하지 않은 것을 소스에서 확인했다.
- KO/EN/VI UI·연습 언어의 별도 선택과 기본 해석 표시·복습 숨김을 보존했다. 키캡별 Tab 정지점 없이 자판 스크롤 영역 하나의 이름·포커스·범위가 제한된 키보드 스크롤 핸들러를 유지했다.
- `.stitch/metadata.json`의 화면 ID와 [FE 반영표](stitch-fe-mapping.md)가 일치한다. 반영표의 헤더·진도·목표 타일·기계적 키 안내·해석 구획·입력 행·색상 변경에 대응하는 실제 React/CSS가 존재한다.
- 반투명 CSS는 배경/키캡에 alpha와 `backdrop-filter`를 적용하며 글자 전체를 흐리게 만드는 `opacity`를 추가하지 않는다. 파란 목표, 주황 눌림, 녹색 F/J와 강제 색상 모드의 테두리 구분을 유지한다. 실제 대비·가독성은 통합 브라우저 검증 대상이다.

## Blender 자산 검수 결과

- `design/blender/create-keyboard.py`는 새 씬·기본 도형·재질·조명·카메라·키 범례를 생성하고 모델과 1400×900 RGBA WEBP를 저장한다. 로컬 MCP 클라이언트는 이 소스를 `execute_blender_code`로 전달한다. `blender-asset-frosted-render.json`의 실제 MCP 응답에 모델 저장·61개 키·158개 객체·렌더 완료가 기록되어 있다. 단순 설치 확인과 실제 제작 실행을 구분했다.
- 최신 `blender-asset-verification.json`에는 제작 씬 158개 객체, 기존 빈 검증 씬 0개 객체, F/J를 포함한 키 매핑이 기록되어 있다. 이전 임시 폰트 참조는 후속 정리 응답에서 제거됐고 최종 결과는 사용자 0인 내장 Bfont만 남는다. 텍스트 객체는 0이며 키 범례는 메시로 변환했다.
- `public/assets/keyboard-studio.webp`를 직접 열어 5줄 자판·파란 R/ㄱ·F/J 돌기·반투명 녹색 외곽·약한 반사가 있는 키캡·선명한 범례를 확인했다. 배경 투명도와 재질의 투과는 서로 다른 설정이다. 연습 중 실제 키 눌림을 보여주는 자판은 기존 DOM 컴포넌트로 유지한다.
- 앱의 `<img>`는 `/assets/keyboard-studio.webp`, 1400×900, `alt=""`로 선언되고 옆 캡션이 안내를 제공한다. 실제 파일은 144,316 bytes이며 source와 `dist/assets/keyboard-studio.webp`의 SHA256을 직접 비교해 일치했다.
- 원본 Noto Sans CJK KR Medium 파일을 직접 해시 계산하여 NOTICE의 `15c12166634936c31307b91bd049d95b4ba30c248e8c389b5388f75ae8ba90d6`과 일치함을 확인했다. OFL 원문·출처 commit·저작권 고지와 MH-R003~005 장부 항목을 확인했다. 저작권의 포괄적 수용이나 법률 판단은 하지 않았다.
- 최종 [Blender 제작 기록](blender-asset.md)과 [공유 검증 원자료](blender-asset-verification.json)의 경로·크기·세 파일 해시가 이 검수의 직접 계산과 일치한다. 5행·61키·26개 한글 범례의 배열 대조에 오류가 없다는 제작 담당의 기계적 검사 결과도 함께 보존되어 있다.

### 직접 확인한 파일 해시

| 파일 | SHA256 |
|---|---|
| 최종 WEBP 및 dist 사본 | `c7659ea547eafac3b2a4cd007c82cab0d8e06f4ca0ed9b563abd2946160ca0dd` |
| Blender 모델 | `83d3875b6577d79e2613032cbbd56e32da2dbccc08ffb10deea5a4d7108dc2f0` |
| 재현 스크립트 | `b02c9168d59986050b9b466ed519e19472710f0c6e718ab24dc9d950ccd7a663` |

## 통합 검사 근거와 역할 구분

검수자가 [실제 홈 화면](screenshots/stitch-blender-home.png)과 [실제 연습 화면](screenshots/stitch-blender-practice.png)을 열어 렌더가 홈에 표시되고 목표·해석·입력·5줄 자판이 함께 보이는 것을 확인했다. 직접 브라우저를 다시 조작하지 않았으며 다음은 통합 담당의 실행 보고다.

- IAB 실제 이미지가 `complete=true`, 자연 크기 1400×900으로 로드됐다.
- KO/EN/VI UI를 전환해도 한국어 연습 언어는 유지됐다.
- `R` 입력 후 Enter는 제출하지 않았다. 버튼 제출 시 0%, 다시 `ㄱ`을 입력했을 때 100%, 완료 시 실제 진도 1/4를 확인했다.
- 640×900에서 본문 가로 넘침 없이 Tab으로 자판에 들어가 0→64→End 88→Home 0의 가로 이동을 확인했다.
- 전체 테스트 9개 파일 122개와 제품 빌드가 통과했다. 검사자는 이를 중복 실행하지 않았다.

실제 OS IME 조작, 원어민/교육 전문가 검수, 학습 효과를 이 검수의 성공 근거로 주장하지 않는다. 비밀값·사용자 환경변수를 조회하지 않으며 제품 코드는 수정하지 않는다.
