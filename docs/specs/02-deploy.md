# PWA 배포 스펙

ATOMIC 을 실제 주소에 올려 휴대폰에서 설치해 쓸 수 있게 한다.

**상태: 진행 중** — 호스팅은 **GitHub Pages 프로젝트 페이지**로 정했다(2026-08-17, 무열 결정). 서브경로 대응과 자동 배포 워크플로는 끝났고, 남은 것은 원격 저장소 생성·push·Pages 설정이다.

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

## 남은 절차

1. GitHub 에 원격 저장소를 만든다 — 이름은 `ATOMIC` (`BASE` 값과 같아야 한다)
2. `git remote add origin` 후 `main` 을 push 한다
3. 저장소 **Settings → Pages → Source** 를 `GitHub Actions` 로 바꾼다
4. 첫 배포가 끝나면 실제 휴대폰에서 점검한다

## 완료 조건

- [ ] 공개 주소로 접속해 게임이 돌아간다
- [ ] 휴대폰 브라우저에서 "홈 화면에 추가" 가 뜨고 설치된다
- [ ] 설치한 앱을 비행기 모드에서 켜도 게임이 돌아간다
- [ ] 새 빌드를 올리면 `registerType: 'autoUpdate'` 로 갱신된다
- [ ] LocalStorage 진행도가 재접속 후에도 남아 있다
