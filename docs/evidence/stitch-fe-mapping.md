# Stitch 시안 → MAIHANGUL FE 반영

작성: 2026-09-30. 실제 생성 결과를 읽고 화면을 확인한 뒤 기존 React 앱에 필요한 구조를 옮겼다. 생성 HTML의 스크립트를 그대로 실행하거나 제품 입력 처리로 사용하지 않았다.

## 원본

- Stitch project: `12010067946882988516`
- Screen: `79840c32af214556a77c16cf6aaa5615` — MAIHANGUL Compact Workspace
- [원본 HTML](../../.stitch/designs/compact-workspace.html), [원본 PNG](../../.stitch/designs/compact-workspace.png), [메타데이터](../../.stitch/metadata.json)
- 화면 확인 방법: 로컬 PNG를 `view_image`로 직접 확인하고 HTML의 구획·색상·키 구조를 읽었다.

## 실제 반영표

| 원본 구획·요소 | 제품 반영 | 구현 위치 |
|---|---|---|
| `COMPACT HEADER`: 얇은 헤더와 독립 언어 선택 | 작은 브랜드 표식과 화면/연습 언어의 가로 선택 상자. 3개 언어 옵션 유지 | [App](../../src/App.tsx), [styles](../../src/styles.css) `.site-header`, `.language-settings` |
| `4-Step Course Track Pill` | 자모·자판 → 단어 → 생활 문장 → 카페 주문의 실제 4단계 표시. 완료 수는 현재 언어·콘텐츠 버전에 맞는 `completedIds`와 콘텐츠 목록에서 계산. 현재 문항 단계만 `aria-current=step` | [App](../../src/App.tsx) `stageProgress`, [PracticeSession](../../src/components/PracticeSession.tsx) `.course-track` |
| `Big Target Glyph` + `Mechanical Cues` | 파란 테두리의 목표 타일과 정적 `R → ㄱ` 키/손가락 안내. 단일 한글 자모·음절만 표시하고 IME 입력값은 읽지 않음 | [TargetCue](../../src/components/TargetCue.tsx), [PracticeSession](../../src/components/PracticeSession.tsx) `.target-workspace-jamo` |
| `Clean 3-Language Explanation Blocks` | 한국어·영어·베트남어의 해석 3구획. 실제 검수 전 콘텐츠의 문구를 유지하며 기존 복습 숨김 선택도 보존 | [PracticeSession](../../src/components/PracticeSession.tsx), [styles](../../src/styles.css) `.translations` |
| `TYPING INPUT & CHECK ACTION` | 파란 윤곽의 입력란과 녹색 확인 버튼을 한 작업행에 배치. 입력란 Enter와 IME 확정/버튼 제출 계약은 기존대로 유지 | [PracticeSession](../../src/components/PracticeSession.tsx), [styles](../../src/styles.css) `.input-area` |
| `INSTRUCTIONAL PHYSICAL KEYBOARD DIAGRAM` | 실제 상대 폭을 가진 5줄 자판, 파란 목표 위치, 주황색 실제 눌림, 녹색 F/J 홈 키. 누름을 정오답으로 표시하지 않음 | [KeyboardGuide](../../src/components/KeyboardGuide.tsx), [자판 CSS](../../src/components/KeyboardGuide.css) |

## 제품에 맞게 조정한 부분

- 원본 PNG의 큰 중앙 공백을 없애고 목표·입력·자판을 연속해서 배치했다. 720px 높이용 여백 조정과 자판 영역 내부 가로 스크롤을 유지한다.
- 원본의 매우 작은 본문을 확대했다. 해석은 14px 이상, 한글 키 범례는 약 19px를 유지한다.
- 원본의 예시 단계와 `1/4` 고정 진행률을 쓰지 않는다. 단계별 실제 문항 수와 완료 수를 표시하고 콘텐츠가 없는 단계는 준비 중으로 표시한다.
- 원본의 `R`도 입력 정답처럼 보이는 placeholder와 `Check (Enter)` 문구를 사용하지 않는다. `R`은 위치 안내이고 실제 한국어 정답은 `ㄱ`이다.
- 원본의 전역 `keydown`·버튼 클릭 시 R 강조 스크립트, 한/영·한자 Alt 표기, 임의 저작연도·가짜 링크를 옮기지 않는다.
- Google Fonts·Material Symbols·Tailwind CDN 요청을 추가하지 않는다. 기존 시스템 글꼴과 자체 CSS를 사용한다.

### 반투명 자판 보정

사용자 추가 요청에 따라 자판 외곽은 `rgba(221,229,222,.52)`와 12px 배경 흐림, 일반 키캡은 `rgba(255,254,249,.68)`로 조정했다. 글자에는 불투명도를 적용하지 않는다. 목표 키는 `rgba(237,241,255,.94)`와 파란 윤곽, F/J는 `rgba(226,239,235,.86)`와 녹색 윤곽, 실제 눌림은 불투명 주황색으로 구분을 유지한다. 홈 렌더 주변 표면도 `rgba(255,253,246,.4)`로 연결했다. 배경 흐림 미지원 환경에서도 배경색·테두리·문자는 표시된다. 실제 브라우저 가독성은 통합 검수에서 확인한다.

## Blender 자산 연결

홈의 기존 평면 자판 미리보기 영역을 `/assets/keyboard-studio.webp` 장식 이미지로 연결한다. `alt=""`로 중복 설명을 피하고 옆의 학습 안내·캡션이 의미를 전달한다. 실습 화면 자판은 계속 실제 React/CSS 컴포넌트다. 렌더·원본 모델·권리 기록·실제 파일 검증은 [구현 기록](../I006-stitch-blender-implementation.md)과 [자산 대장](../../content/ASSET-LICENSES.md)을 따른다.

## 검증 범위

- 새 `tests/stitch-design.test.tsx`: 실제 완료 후 단계 수 증가, 연습 언어별 진도 분리, 장식 이미지 경로, `R` 안내가 한국어 정답으로 바뀌지 않는 경계.
- 기존 자판·IME 합성·학습 흐름 검사와 실제 브라우저 화면 검사는 상위 Harness 통합 검수에서 확인한다.
- 이 문서는 실제 OS IME나 교육·원어민 검수 통과를 뜻하지 않는다.
