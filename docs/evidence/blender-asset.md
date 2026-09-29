# Blender 실제 제작 — 키보드 홈 이미지

검증: 2026-09-30 06:56 KST. 사용자 요청에 따라 **Blender MCP로 모델링과 렌더를 실행**하고 생성 이미지를 직접 확인했다. 이번 산출물은 홈의 장식 이미지다. 학습 중 조작·키 위치 안내는 기존 HTML 자판이 담당한다.

## 산출물

| 파일 | 내용 | 크기 |
|---|---|---:|
| [keyboard-studio.webp](../../public/assets/keyboard-studio.webp) | 1400×900 RGBA, 투명 배경과 부드러운 접지 그림자 | 144,316 bytes |
| [keyboard-studio.blend](../../design/blender/keyboard-studio.blend) | 모델·재질·카메라·조명·렌더 설정 | 533,274 bytes |
| [create-keyboard.py](../../design/blender/create-keyboard.py) | 재현 가능한 전체 bpy 원본 | 11,419 bytes |
| [검증 원자료](blender-asset-verification.json) | 실제 MCP 결과, 배열 대조, 파일 SHA256 | JSON |

이미지 SHA256: `c7659ea547eafac3b2a4cd007c82cab0d8e06f4ca0ed9b563abd2946160ca0dd`.

## 실제 사용 경로

- Blender **5.2.1 LTS**, build `9e2066aef7ef`와 `mcp-for-blender 2.1.1`을 사용했다. 설치·공식 배포본 검증은 [연동 기록](design-integrations.md)에 있다.
- 현재 세션에는 네이티브 Blender 도구가 없어 **MCP SDK의 `ClientSession` → stdio MCP 서버 → Blender addon** 경로로 `get_scene_info`, `execute_blender_code`를 호출했다. `bpy.ops.render.render(write_still=True)`도 `execute_blender_code` 안에서 실행했다.
- `BLENDER_MCP_SAFE_MODE=1`, telemetry 비활성, `127.0.0.1:9876`을 유지했다. 검증 스크립트의 lambda는 safe mode에서 거절되어 일반 함수로 바꿨다. 보안 설정은 변경하지 않았다.
- 최종 렌더 06:54:40 KST, 폰트 참조 정리 후 최종 씬 검증 06:56:39 KST. 반환 결과는 `render_complete`, `isError=false`였다. 별도 파일 검사와 이미지 육안 검토도 수행했다.
- Blender PID `143584`의 연결을 유지했다. 실행 파일은 `C:\Users\jini9\AppData\Local\Programs\Blender\blender-5.2.1-windows-x64\blender.exe`다. 다음 사용 시 [연동 기록의 시작 방법](design-integrations.md)을 따른다.

## 모델과 재질

- 외부 모델·텍스처를 사용하지 않고 61개 키, 케이스, 범례, 조명과 카메라를 bpy로 제작했다. 새 `MAIHANGUL Keyboard Studio` 씬은 객체 158개다.
- 5행 QWERTY 키 순서·상대 폭, 한글 두벌식 기본 자모 26개를 `src/keyboard/layout.ts`의 `KEYBOARD_ROWS`와 기계적으로 비교했다. **61개 label/width, 26개 한글 범례 모두 일치**했다. `B → ㅠ`도 유지한다.
- 하단 행은 `Ctrl / Win / Alt / Space / Alt / Win / Menu / Ctrl`이다. Shift를 누르지 않은 기본 범례를 표현한다.
- 아이보리 키캡과 teal 본체에 은은한 반투명 재질을 적용했다. 키캡 transmission `0.24`, alpha `0.94`; 본체 transmission `0.38`, alpha `0.86`. 글자·파란 R/ㄱ·주황 Enter는 불투명하게 유지했다. 전체 이미지 opacity는 낮추지 않았다.
- Cycles CPU, 48 samples, denoise, AgX, 3개 면광원, orthographic 카메라, 투명 film과 shadow catcher를 사용했다. 렌더는 Blender에서 바로 WebP로 저장했다.
- RGBA 4채널을 확인했다. 모서리 alpha는 `[0, 0.01176, 0, 0]`이며 약한 그림자가 일부 모서리에 남는다. 키 중앙 alpha는 1이다.

## 글꼴·출처

최종 범례에는 **Noto Sans CJK KR Medium 2.004**를 사용했다. 공식 [notofonts/noto-cjk](https://github.com/notofonts/noto-cjk) 저장소의 다음 고정 버전을 내려받았다.

- commit: `f8d157532fbfaeda587e826d4cd5b21a49186f7c`
- [폰트 원본 OTF](https://raw.githubusercontent.com/notofonts/noto-cjk/f8d157532fbfaeda587e826d4cd5b21a49186f7c/Sans/OTF/Korean/NotoSansCJKkr-Medium.otf)
- SHA256: `15c12166634936c31307b91bd049d95b4ba30c248e8c389b5388f75ae8ba90d6`, 16,519,380 bytes
- 폰트 내부 저작권 표기: © 2014-2021 Adobe.
- 라이선스: SIL Open Font License 1.1. [원문](../../design/blender/OFL-NotoSansCJK.txt), [저작권·출처 고지](../../design/blender/NOTICE-NotoSansCJK.txt)를 함께 보관한다.

글꼴 원본은 `.local/design-integrations/fonts/NotoSansCJKkr-Medium.otf`에 있으며 앱에 포함하지 않는다. 키 범례는 메쉬로 변환했다. 최종 검증에서 FONT 객체 0, 외부 폰트 참조 0, packed 폰트 0을 확인했다. Blender의 내장 Bfont만 미사용 상태로 남는다. 초기 Malgun 검토 렌더와 해당 글꼴 참조는 최종 산출물에서 제외했다.

한컴타자의 모델·화면·캐릭터·문항·텍스처를 가져오지 않았다. 글꼴은 위 개별 라이선스에 따라 기록하며, 모델·재질·구도는 이번 작업에서 직접 작성했다. 통합 권리 장부는 [ASSET-LICENSES](../../content/ASSET-LICENSES.md)를 따른다.

## 재현과 작업 보존

1. 위 고정 OTF를 원본 스크립트의 `FONT_PATH` 위치에 내려받고 SHA256을 확인한다. 출력 폴더 `design/blender`, `public/assets`를 준비한다.
2. `BLEND_PATH`, `IMAGE_PATH`, `FONT_PATH`를 작업 환경에 맞춘다. 현재 값은 승인된 `C:\TEST\MAIHANGUL` 경로다.
3. Blender MCP 연결 후 `get_scene_info`로 사용자 작업을 확인한다. `create-keyboard.py`의 전체 내용을 `execute_blender_code`의 `code`로 전달한다. 이 스크립트는 새 씬을 만들며 기존 씬을 삭제하지 않는다. 지정 출력 파일은 다시 저장된다.
4. 반환된 `render_complete`와 실제 파일·배열·이미지를 확인한다. 렌더 시간·바이너리 해시는 Blender 빌드와 실행 환경에 따라 달라질 수 있다.

최초 `MAIHANGUL MCP empty verification` 씬(객체 0)은 그대로 보존했다. 원본 .blend에도 새 제작 씬과 이 빈 검증 씬이 들어 있다. 수정한 것은 이번 에이전트가 만든 검토 모델뿐이며 사용자 파일·환경설정은 변경하지 않았다. 이전 검토본·자동 백업은 `.local/design-integrations/`에 보관한다. 브라우저의 학습 입력, 실제 Windows IME, 교육·번역 효과를 검증한 결과로 확대해 해석하지 않는다.
