# PWA 배포 스펙

ATOMIC 을 실제 주소에 올려 휴대폰에서 설치해 쓸 수 있게 한다.

**상태: 배포됨** — https://yeol200511.github.io/ATOMIC/ (2026-08-17 첫 배포 성공)

호스팅은 **GitHub Pages 프로젝트 페이지**로 정했다(2026-08-17, 무열 결정). 저장소는 `yeol200511/ATOMIC` public. 실기기 점검만 남았다.

## 왜 필요한가

`vite-plugin-pwa` 로 서비스워커·매니페스트·아이콘까지 다 갖춰 놨는데 로컬 `npm run preview` 로만 볼 수 있다. 휴대폰 홈 화면에 설치해 오프라인에서 푸는 것이 이 앱의 원래 쓰임이라, 배포하지 않으면 만들어 둔 PWA 설정이 놀고 있는 셈이다.

## 서브경로 대응 (완료)

GitHub Pages 프로젝트 페이지는 `<계정>.github.io/ATOMIC/` 처럼 서브경로로 서비스된다. 원래 `base` 를 두지 않아 `/` 기준으로 빌드되던 것을 서브경로 기준으로 바꿨다.

`vite.config.ts` 위쪽의 `BASE` 상수 하나가 네 곳을 함께 움직인다 — 저장소 이름이 바뀌면 이 값만 고치면 된다.

- `base`
- 매니페스트 `start_url` · `scope` · `id`
- `workbox.navigateFallback`

개발·preview 서버도 같은 경로를 쓴다(`http://localhost:5173/ATOMIC/`). 배포와 다른 조건에서 확인하다 놓치는 일을 막기 위해서다.

빌드로 확인한 결과, `dist/index.html` 의 asset 참조가 모두 `/ATOMIC/...` 로 붙었고 매니페스트의 `start_url`·`scope`·`id` 도 `/ATOMIC/` 를 가리킨다. 아이콘은 매니페스트 기준 상대경로라 그대로 `/ATOMIC/icon-192.png` 로 풀린다.

## 자동 배포 (완료)

`.github/workflows/deploy.yml` — `main` 에 push 하면 Node 22 로 `npm ci` → `npm run build`(타입 검사 포함) 를 거쳐 `dist` 를 Pages 에 올린다. `workflow_dispatch` 로 손수 돌릴 수도 있다. 배포는 `concurrency: pages` 로 한 번에 하나만 돌고, 진행 중인 배포를 취소하지 않는다.

## 첫 배포 결과 (2026-08-17)

저장소 `yeol200511/ATOMIC` (public) 을 만들어 push 했고, Pages 를 Actions 방식(`build_type: workflow`)으로 켰다. 워크플로는 build 20초 · deploy 8초로 끝났다.

배포된 주소에서 실측한 응답:

| 경로 | 응답 |
| --- | --- |
| `/ATOMIC/` | 200 `text/html` |
| `/ATOMIC/manifest.webmanifest` | 200 `application/manifest+json` |
| `/ATOMIC/sw.js` | 200 `application/javascript` |
| `/ATOMIC/icon-192.png` | 200 `image/png` |
| `/ATOMIC/favicon.svg` | 200 `image/svg+xml` |

배포된 `index.html` 의 asset 참조가 모두 `/ATOMIC/...` 이고, 매니페스트의 `start_url`·`scope`·`id` 도 `/ATOMIC/` 로 나온다.

Actions 로그에 Node 20 지원 종료 경고가 붙지만, 러너가 알아서 Node 24 로 돌려 배포는 정상이다. 나중에 각 action 의 상위 버전이 나오면 올린다.

## 완료 조건

- [x] 공개 주소로 접속해 게임이 돌아간다 — HTTP 200, asset 경로 실측 확인
- [x] 새 빌드를 올리면 자동 배포된다 — push 한 번으로 build·deploy 통과
- [ ] 휴대폰 브라우저에서 "홈 화면에 추가" 가 뜨고 설치된다 — **미검증** (실기기 필요)
- [ ] 설치한 앱을 비행기 모드에서 켜도 게임이 돌아간다 — **미검증** (실기기 필요)
- [ ] LocalStorage 진행도가 재접속 후에도 남아 있다 — **미검증** (실기기 필요)

아래 세 가지는 무열이 휴대폰으로 직접 확인해야 채울 수 있다. 서버 응답만으로는 설치 프롬프트·오프라인 동작을 증명할 수 없다.
