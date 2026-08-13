# 사주 미

한복 입은 고양이가 집사님의 사주를 풀어주는 웹 서비스입니다.

생년월일과 태어난 시간을 넣으면 Gemini가 사주를 해석하고, Google 로그인 후 해석을 저장·공유할 수 있습니다.

**라이브:** [https://saju-me-jin.vercel.app](https://saju-me-jin.vercel.app)

## 기능

- **비회원 사주 보기** — 이름, 생년월일, 태어난 시간, 성별, 양력/음력으로 바로 분석
- **로그인 게이트** — 비회원은 결과의 일부만 보고, Google 로그인 후 전체 해석을 확인
- **회원** — 프로필 저장, 해석 히스토리, 다시 풀이, 삭제
- **공유** — `/result/:id` 공개 링크로 해석 공유
- **마스코트** — 고양이 사주 선생이 집사님을 부르며 `-냥` 말투로 해석

## 스택

- React 19 + Vite
- Supabase (Google OAuth, `profiles`, `saju_readings`)
- Gemini API (`gemini-3.6-flash`)
- Vercel (SPA rewrite)

## 시작하기

```bash
npm install
cp .env.example .env
npm run dev
```

`.env`에 아래 값을 넣습니다.

```
VITE_GEMINI_API_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Supabase

- Authentication → Google provider 활성화
- Redirect URL에 로컬(`http://localhost:5173`)과 배포 도메인 추가
- 테이블: `profiles`(계정당 1명 정보), `saju_readings`(해석 히스토리)
- 공개 공유용 RPC: `get_public_reading`

### 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 미리보기 |
| `npm test` | 단위 테스트 |
| `npm run lint` | ESLint |

## 구조

```
src/
  App.jsx                 # 회원 / 비회원 화면
  pages/ResultPage.jsx    # 공유 결과 `/result/:id`
  hooks/useSajuApp.js     # 인증, 프로필, 해석 흐름
  lib/                    # Gemini, Supabase, 공유, 분석
  components/             # guest, reading, profile, layout
```

비회원 해석은 `localStorage`에 잠시 저장했다가, Google 로그인 후 계정으로 옮깁니다.
