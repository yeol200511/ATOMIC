# PWA 배포 스펙

ATOMIC 을 실제 주소에 올려 휴대폰에서 설치해 쓸 수 있게 한다.

**상태: 미착수** — 호스팅을 어디로 할지 무열의 결정이 필요하다.

## 왜 필요한가

`vite-plugin-pwa` 로 서비스워커·매니페스트·아이콘까지 다 갖춰 놨는데 로컬 `npm run preview` 로만 볼 수 있다. 휴대폰 홈 화면에 설치해 오프라인에서 푸는 것이 이 앱의 원래 쓰임이라, 배포하지 않으면 만들어 둔 PWA 설정이 놀고 있는 셈이다.

## 지금 확인된 제약

`vite.config.ts` 에 `base` 를 두지 않아 기본값 `/` 로 빌드되고, 매니페스트도 `start_url: '/'` · `scope: '/'` 다. 즉 **도메인 루트에 올려야 그대로 돌아간다.**

서브경로(`example.com/ATOMIC/`)에 올린다면 세 곳을 함께 고쳐야 한다.

- `vite.config.ts` 의 `base: '/ATOMIC/'`
- 매니페스트의 `start_url` · `scope`
- `workbox.navigateFallback` 경로

## 호스팅 후보

| 후보 | 루트 배포 | 비용 | 손이 가는 정도 |
| --- | --- | --- | --- |
| Cloudflare Pages | `*.pages.dev` 루트 | 무료 | 저장소 연결만 하면 push 마다 자동 배포 |
| Vercel | `*.vercel.app` 루트 | 무료(개인) | 저장소 연결만 하면 자동 배포 |
| Netlify | `*.netlify.app` 루트 | 무료 | 저장소 연결 또는 `dist` 끌어다 놓기 |
| GitHub Pages (프로젝트) | `user.github.io/ATOMIC/` 서브경로 | 무료 | 위 세 곳 설정을 고쳐야 함 |
| GitHub Pages (user 사이트) | `user.github.io` 루트 | 무료 | 저장소 이름을 `user.github.io` 로 고정해야 함 |

앞의 세 곳은 설정을 건드릴 필요가 없어 지금 상태 그대로 올라간다.

## 절차

1. 호스팅을 고른다 (**무열 결정 대기**)
2. GitHub 에 원격 저장소를 만들고 push 한다 (계정 확인 필요)
3. 호스팅에 저장소를 연결한다 — 빌드 명령 `npm run build`, 산출 폴더 `dist`
4. Node 버전을 고정한다 (`.nvmrc` 또는 호스팅 설정에서 20 이상)
5. 첫 배포 후 실제 휴대폰에서 점검한다

## 완료 조건

- [ ] 공개 주소로 접속해 게임이 돌아간다
- [ ] 휴대폰 브라우저에서 "홈 화면에 추가" 가 뜨고 설치된다
- [ ] 설치한 앱을 비행기 모드에서 켜도 게임이 돌아간다
- [ ] 새 빌드를 올리면 `registerType: 'autoUpdate'` 로 갱신된다
- [ ] LocalStorage 진행도가 재접속 후에도 남아 있다
