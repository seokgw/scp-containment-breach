# SCP: CONTAINMENT BREACH

**기지 제██-17 격리 실패 사건 · MVP 1.0**

정보보안 분석관 K-17이 되어 증거를 복원하는 한국어 스토리 워게임입니다. ACT I의 10문제와 3챕터만 구현했습니다. 011–040은 잠긴 향후 계획입니다.

- 웹: https://scp-containment-breach.vercel.app
- 저장소: https://github.com/seokgw/scp-containment-breach
- 총점 2,250점 / 보안 인가 LEVEL 0–3
- 코드명·비밀번호 로그인, 진행 저장, 세 단계 힌트, 정답 후 해설·기밀문서, 랭킹, ACT I 엔딩
- 첫 접속에는 기지 복도 이미지를 사용하는 소개·로그인 페이지를 표시합니다. 로그인·회원가입 완료 후 기존 통제 대시보드로 진입하고, 로그아웃하면 소개 페이지로 돌아옵니다. 유효한 세션이 있으면 기존 조사 화면을 유지합니다.
- React + TypeScript + Vite / Node.js Express 로컬 API / Supabase Postgres + Edge Function / Vercel 웹·API 프록시

## 설치와 실행

Node.js 24 이상과 Git을 설치합니다. Docker 실습에는 Docker Desktop이 필요합니다.

```powershell
git clone https://github.com/seokgw/scp-containment-breach.git
cd scp-containment-breach
npm ci
npm run dev
```

브라우저에서 **http://localhost:5173** 을 엽니다. 로컬 API는 127.0.0.1:3001, SQLite는 무시된 `.local/game.sqlite`에 저장됩니다. 로컬 실행은 Supabase 키 없이 가능합니다. `npm run dev`는 Vite와 Express를 함께 시작합니다. 코드명은 영문·숫자·밑줄·하이픈 3–24자, 비밀번호는 10자 이상이며 bcrypt의 제한에 맞춰 72바이트 이하입니다. 계정 복구·이메일 인증은 이 버전에 포함하지 않습니다.

종료하려면 실행 터미널에서 **Ctrl+C** 를 누릅니다. 진행 기록은 종료 후에도 SQLite에 유지됩니다. 별도 실행 시 `npm run dev:web`는 기본 origin이 127.0.0.1이므로 `.env`의 `APP_ORIGIN`도 일치시켜야 합니다. 기본 통합 실행을 권장합니다.

## 실습 실행

```powershell
docker compose up --build -d
docker compose ps
```

- 006 IDOR: http://127.0.0.1:8080
- 정적 자료 격리 서버: http://127.0.0.1:8081/001/control.html
- 종료: `docker compose down`

Docker가 없는 경우 **로컬 학습용 대체 실행**은 `npm run lab`입니다. 이 경우 HTTP 서버가 127.0.0.1:8080에 실행되며, Docker 수준의 격리는 제공하지 않습니다. Ctrl+C로 종료합니다. 실제 배포 웹은 이 취약한 서버를 운영하지 않습니다. 006은 이용자 자신의 로컬 실습 환경에서 풀어야 합니다. 나머지 9개 문제는 배포 웹에서 자료를 내려받아 분석할 수 있습니다.

## 테스트 및 빌드

```powershell
npm test
npm run build
# Wireshark/TShark 설치 시 (실제 PCAP HTTP 분석)
node scripts/verify-pcap.mjs
```

`npm test`는 10개 자료의 실제 풀이, 가입·로그인·로그아웃, 잘못된 FLAG, 중복·동시 제출, 인가 변경, 사용자 분리, 해설·문서 권한, 제출 제한을 검증합니다. 테스트는 메모리 SQLite와 일시적인 006 HTTP 서버를 사용합니다. 빌드는 TypeScript 검사 후 Vite 프로덕션 파일을 생성합니다.

`npm run test:live`는 **운영 계정과 기록을 생성하는 별도 검증**입니다. 운영자의 승인을 확인한 후 실행합니다. 종료 시 finally에서 해당 실행이 만든 계정만 비밀번호·코드명을 재확인해 자동 삭제하며, FK 연쇄 삭제로 관련 세션·진행·제출·힌트도 삭제합니다. 비밀번호·FLAG는 로그에 출력하지 않습니다. 결과와 계정 정리 상태는 무시된 `.local/live-results.json`에 저장됩니다. 실제 결과는 [docs/TEST-RESULTS.md](docs/TEST-RESULTS.md)에 구분합니다.

## 디렉터리

```text
frontend/src/          React 화면과 반응형 스타일
backend/               Web Request API, catalog, 검증 해시, SQLite/REST 저장소
api/gateway.mjs        Vercel → Supabase Edge 프록시 (명시적 /api/* rewrite)
public/evidence/       9개 문제의 공개 분석 자료 (001·002 포함)
challenges/idor/       격리 IDOR 실습 전용 서버와 가상 문서
challenges/static/     정적 자료 Docker 서버
scripts/               생성, 로컬 실행, 배포·검증 도구
tests/                 독립 풀이 및 통합 테스트
docs/                  설계, 풀이 절차, 확장 계획, 검증 근거
```

## 배포 및 데이터 격리

Vercel 프로젝트는 `scp-containment-breach`입니다. Supabase 기존 프로젝트의 전용 **`scp_game`** 스키마만 사용합니다. 다른 앱의 데이터·Auth 사용자·Storage는 변경하지 않습니다. 서버 코드만 service role로 전용 테이블에 접근합니다. 브라우저에는 Supabase 서비스 키를 전달하지 않습니다.

Supabase Edge Function `scp-game-api`는 `backend/edge.ts`가 진입점입니다. `backend/{edge.ts,app.mjs,repository.mjs,catalog.mjs,verifiers.json,deno.json}`을 함께 배포하고 import map을 `deno.json`으로 지정합니다. 함수가 자체 세션 인증을 수행하므로 플랫폼 JWT 검증은 끄지만, 건강 검사·문제 목록·랭킹·인증 경로를 제외한 요청은 서버가 세션을 검사합니다. Supabase 기본 환경변수의 서비스 키를 사용하며 새 서비스 키를 저장소에 쓰지 않습니다.

새 빈 DB에 최초 설치할 때만 `backend/schema.sql`을 검토해 적용합니다. 이 파일은 기존 스키마 노출 목록을 보존하며 `scp_game`만 추가합니다. 이미 적용된 DB에 재실행하지 않습니다. 다른 프로젝트의 Data API 노출 구성이 다르면 먼저 해당 구성을 확인해야 합니다.

Vercel 서버 환경변수 `SCP_BACKEND_URL`에 새 Edge 함수 URL을 지정합니다. 공개 origin을 바꾸면 `backend/edge.ts`의 허용 origin도 변경하고 함수를 다시 배포합니다. 세션 쿠키는 `Secure; HttpOnly; SameSite=Strict; Path=/`와 `__Host-` 접두사를 사용합니다. Vercel 미리보기 도메인은 기본 허용하지 않습니다.

```powershell
npx vercel@65.0.0 link --project scp-containment-breach
npx vercel@65.0.0 env add SCP_BACKEND_URL production
npx vercel@65.0.0 deploy --prod
```

## 정답·풀이 취급

일반 API는 정답을 반환하지 않습니다. 분석 자료에 단서가 있는 것은 의도된 문제 설계입니다. 공개 저장소이므로 실습 파일과 코드 자체는 열람 가능하며, 정적 CTF 자료의 기밀성을 전제로 하지 않습니다. 운영 계정 정보와 정답의 구분은 [SECURITY](docs/SECURITY.md)를 참고하세요.

관리자 풀이 절차는 `docs/WALKTHROUGH.md`에 있으며 웹 빌드 `dist/`에는 포함되지 않습니다. 정답 문자열 목록은 `.local/answers.json`에만 생성되고 Git에서 제외됩니다. 이미 배포된 검증 해시가 있는데 이 로컬 파일이 없는 새 clone에서는 `npm run generate`를 실행하지 않습니다. 기존 자료로 즉시 실행·테스트할 수 있습니다. 문제 재생성은 출제자 백업과 의도적인 버전 교체가 있을 때만 합니다.

## 문서·라이선스

- [아키텍처](docs/ARCHITECTURE.md) · [격리와 보안](docs/SECURITY.md)
- [문제 구성](docs/CHALLENGES.md) · [관리자 풀이 절차](docs/WALKTHROUGH.md)
- [스토리](docs/STORY.md) · [확장 로드맵](docs/ROADMAP.md)
- [실제 검증 결과](docs/TEST-RESULTS.md)
- [저작자 표시](ATTRIBUTION.md) · [라이선스](LICENSE)

SCP Wiki 기반 비공식 팬 창작입니다. SCP 세계관을 바탕으로 한 게임 시나리오·문서·문제 자료는 CC BY-SA 3.0으로 제공합니다. SCP-173 조각상 사진은 사용하지 않습니다.
