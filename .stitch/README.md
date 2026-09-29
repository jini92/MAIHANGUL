# Stitch 디자인 원본

이 디렉터리는 실제 Stitch 결과와 구현 비교에 사용하는 자료다. 앱에서 HTML을 실행하거나 그대로 제공하지 않는다.

- 프로젝트: [MAIHANGUL Keyboard Study](https://stitch.withgoogle.com/projects/12010067946882988516), 비공개.
- [수정 요청](edit-prompt.md) → 화면 `79840c32af214556a77c16cf6aaa5615`.
- [실제 HTML](designs/compact-workspace.html), [생성 이미지](designs/compact-workspace.png), [식별 정보](metadata.json).
- MCP의 `download_assets`는 완료를 반환했지만 요청한 Windows 경로에 파일이 생기지 않았다. 반환된 생성 파일 URL에서 직접 받아 실제 파일 크기를 확인했다.
- 원본에는 외부 폰트·아이콘·Tailwind CDN 참조가 있다. 제품에는 기존 시스템 글꼴과 자체 CSS로 옮긴다.
- 원본의 임의 교육 단계·Enter 제출 안내·R을 정답으로 보는 듯한 문구·과도한 여백은 제품 요구사항에 맞게 고친다. 생성 결과를 교육·번역·권리 검수 합격으로 취급하지 않는다.

제품의 적용 결과는 [I006](../docs/I006-stitch-blender-implementation.md)을 따른다.
