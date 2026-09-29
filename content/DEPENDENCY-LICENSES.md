# 직접 의존성 라이선스 기록

기준일: 2026-09-30 · 설치된 패키지의 package.json license 필드를 확인한 기록이다. 전체 배포물의 법적 검토 완료를 의미하지 않는다.

| 패키지 | 설치 버전 | 패키지가 선언한 라이선스 | 용도 |
|---|---|---|---|
| react | 19.3.0 | MIT | 제품 실행 |
| react-dom | 19.3.0 | MIT | 제품 실행 |
| @testing-library/jest-dom | 7.0.1 | MIT | 개발·검사 |
| @testing-library/react | 16.3.3 | MIT | 개발·검사 |
| @testing-library/user-event | 14.6.7 | MIT | 개발·검사 |
| @types/node | 26.6.3 | MIT | 개발·검사 |
| @types/react | 19.3.0 | MIT | 개발·검사 |
| @types/react-dom | 19.3.0 | MIT | 개발·검사 |
| @vitejs/plugin-react | 6.1.1 | MIT | 개발·검사 |
| jsdom | 30.1.1 | MIT | 개발·검사 |
| typescript | 7.0.2 | Apache-2.0 | 개발·검사 |
| vite | 8.3.1 | MIT | 개발·검사 |
| vitest | 5.0.2 | MIT | 개발·검사 |

정확한 버전과 하위 의존성은 [package-lock.json](../package-lock.json)에 기록한다. 배포 전 실제 포함 파일과 각 패키지 LICENSE/NOTICE를 확인하고 필요한 고지를 제공한다. 이 프로젝트 자체 코드의 대외 라이선스는 여기서 결정하지 않는다.

외부 폰트·이미지·음원·번역 API는 이번 로컬 개발에 도입하지 않는다. 직접 작성 학습자료의 권리·검수 상태는 [ASSET-LICENSES](ASSET-LICENSES.md)에 따로 기록한다.
