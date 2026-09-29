# 독립 검수 · 입력·채점·UI 연결

검수일: 2026-09-30
검수 모델: `gpt-5.6-sol`
역할: 구현에 참여하지 않은 별도 REVIEW TEAM AGENT

## 대상과 경계

- 기준 커밋: `01288d88d412a81a41bb76650901df58cbfc6253`
- 계약: `D002-learning-game-ux.md`, `D003-input-scoring.md`, `T001-validation-plan.md`, `I004-harness-development.md`
- 구현: `src/input/usePracticeInput.ts`, `src/scoring/index.ts`, `src/App.tsx`, `src/components/PracticeSession.tsx`, `public/ime-probe.html`
- 검사: `tests/input.test.tsx`, `tests/scoring.test.ts`, `tests/app-flow.test.tsx`, MH-001/002 근거 문서
- 읽기 검수와 로컬 Vitest 재현만 수행했다. 제품 소스·공식 테스트·외부 상태는 수정하지 않았고 브라우저/OS UI 자동화는 수행하지 않았다.

## 실행 근거

| 검사 | 결과 | 해석 |
|---|---|---|
| `npm test -- tests/input.test.tsx tests/scoring.test.ts` | PASS · 2 files, 42 tests | 합성 이벤트와 순수 계산 회귀가 통과했다. 실제 IME 근거는 아니다. |
| `npx tsc --noEmit` | PASS | 당시 검수 트리의 타입 검사가 통과했다. |
| `git diff --check` | PASS | 당시 검수 트리의 공백 오류가 없었다. |
| `npx vitest run --config .local/review-input/vitest.config.ts` | PASS · 1 file, 3 tests | 늦은 input 재확인, 앱 내 확인 대화상자를 거친 연습 언어 변경, 의미 단계 중단을 최종 UI 계약으로 재검사했다. |
| `npm test -- tests/app-flow.test.tsx` | PASS · 1 file, 18 tests | UI 팀 수정 뒤 연습 언어, 의미 단계 중단, CPM 표시를 포함한 App 흐름을 재검사했다. |

기존 입력 검사는 설계의 NFC·성조·공백·군집 거리 fixture, epoch가 지난 노드, 조합 중 제출 차단, 중단 시 확정 문자열 복원을 직접 확인하므로 구현을 그대로 복제한 무의미한 검사로 보지 않았다. 초기 검수에서 빠져 있던 확인 뒤 늦은 `input`과 의미 단계의 창 이탈은 회귀 검사에 추가됐다. 실제 브라우저 키 반복 관찰은 남아 있다.

## MUST_FIX 수정 후 재확인

### 확인한 값 뒤에 도착한 `input`의 재확인 · 해결 확인

위치: `src/input/usePracticeInput.ts`의 `input()`과 `submit()` (`confirmationArmed` 처리)

재현:

1. `compositionstart` 후 DOM 값을 `한`으로 두고 `compositionend`를 전달한다.
2. 첫 `submit()`은 `confirm-required`를 반환하여 `한`을 확인한다.
3. 그 뒤 non-composing `input`이 DOM을 `한국`으로 바꾼다.
4. 다음 `submit()`이 `accepted`를 반환하고 콜백에는 `한국`이 전달된다.

초기 구현에서는 첫 활성화가 확인한 값은 `한`인데 실제 제출값은 `한국`이 되는 결함이 있었다. `input()`이 stable 상태에서 `confirmationArmed=false`로 바꾸기 때문에 발생했다. D003과 MH-001의 임시 정책은 첫 활성화로 전체 DOM 값을 확인하고 다음 별도 활성화로 그 확인값을 제출하도록 요구한다.

수정 뒤 같은 순서를 다시 실행해 다음을 확인했다.

1. 늦은 non-composing `input`이 확인값을 바꾸면 상태가 `settling`으로 돌아가고 기존 확정값 `한`을 유지한다.
2. 다음 `submit()`은 다시 `confirm-required`를 반환하며 콜백은 호출하지 않는다.
3. 그 다음 별도 `submit()`만 `한국`을 한 번 제출한다.

공식 입력 검사에는 값이 바뀐 늦은 input, 값이 같은 늦은 input, 도움 입력 표식 유지 검사가 추가됐다. focused 입력·채점 42개와 독립 격리 검사 3개가 통과했다.

## 수정 후 재확인

### 연습 언어 변경 시 첫 문항으로 돌아가던 문제 · 해결 확인

초기 검수에서는 2번 문항에서 연습 언어를 바꾸면 `PracticeSession` key remount로 index가 0이 되어 단계 첫 문항으로 돌아갔다. 이는 “현재 문제를 재시작한다”는 D002 계약과 달랐다.

수정 뒤 실제 `App` 흐름에서 다음을 재확인했다.

1. 자모 1번을 완료하고 2번 문항으로 이동한다.
2. 연습 언어를 한국어에서 영어로 선택한다.
3. 앱 내 확인 대화상자에서 변경 버튼을 누른다.
4. 변경 뒤에도 같은 2번 content ID의 영어 variant가 표시된다.

`App`이 현재 content ID를 전달받아 세션을 그 문항부터 다시 구성하는 현재 동작은 이 결함을 해결한다. 공식 `tests/app-flow.test.tsx`에도 같은 흐름의 회귀 검사가 추가됐다.

### 의미 단계의 창 이탈 중단 · 해결 확인

초기 검수에서는 타자 제출 뒤 입력 제어가 `submitted`라서 `window.blur`가 의미 단계를 중단하지 못했다. 수정 뒤 실제 App 흐름에서 의미 보기를 하나 선택하고 창 이탈을 전달해 다음을 확인했다.

- 중단 화면으로 전환된다.
- 재개하면 기존 의미 선택이 유지된다.
- 의미 답을 자동 제출하거나 저장하지 않는다.
- 이미 끝난 타자 결과의 `interrupted`는 false로 유지된다.

공식 `tests/app-flow.test.tsx` 18개가 독립 재실행에서 통과했다.

### 비교 제외와 개인 CPM 표시 · 해결 확인

초기 검수에서는 `comparisonEligible=false`인 모든 경우에 CPM 숫자를 숨겨 기본값인 unknown 사용자에게도 “비교 제외”만 표시했다. 이는 unknown을 개인 관찰값으로 보여 주되 비교 집계에서 제외하라는 D003 계약과 달랐다.

수정 뒤 유효한 CPM이 있고 제외 이유가 unknown뿐이면 개인 CPM을 표시하면서 비교 제외 설명을 유지한다. `invalid-time`, `too-short`, `assisted`, `interrupted`는 계속 숫자 대신 제외 이유를 표시한다. 공식 App 회귀 검사가 이 구분을 확인한다.

## 키 반복과 중복 제출 판정

- 제출 잠금은 콜백 전에 동기적으로 `submitted` 상태를 기록하므로 같은 컨트롤러에 대한 후속 submit은 차단된다.
- 마우스 연속 클릭은 `detail > 1`로 차단한다.
- 버튼의 Enter/Space `keydown`에서 `event.repeat`를 막는 UI 코드가 있으며 공식 합성 검사는 `preventDefault`를 확인한다.
- 합성 검사는 실제 Chrome/Edge가 키를 길게 누를 때 내보내는 keydown/click 순서를 증명하지 않는다. 이 항목은 코드상 즉시 결함으로 판정하지 않았으며 실제 브라우저 관찰이 남아 있다.

## 실제 OS 입력기 미검증 · 코드 결함과 별도

- Chrome/Edge 설치 버전은 MH-001에 기록됐지만 실제 실행 브라우저와 물리 키보드 조작 근거는 아니다.
- 사용자 언어 목록에는 한국어와 영어만 확인됐고 Windows Vietnamese Telex/VNI 설정 근거가 없다.
- 이 세션의 브라우저 제어는 request-header-policy 오류로 두 차례 로드에 실패했다. 제한을 우회하거나 다른 자동 입력을 실제 IME 근거로 대체하지 않았다.
- E01~E08, V07 실제 확정·취소·Backspace·Tab·클릭·키 반복, MH-016 통합 앱 실기는 계속 미실행이다.
- 따라서 “KO/VI 입력 처리를 구현했다”와 “실제 Windows 한글/Telex/VNI 호환을 확인했다”를 구분해야 한다. 후자는 아직 확인 대기다.

## 현재 판정

확인된 MUST_FIX와 SHOULD_FIX는 수정 뒤 독립 재검사를 통과했다. 따라서 합성 입력·순수 채점·검토한 App 연결 범위는 PASS다. 실제 OS IME 수용은 별도 미검증 상태이며 이 PASS에 포함하지 않는다.
