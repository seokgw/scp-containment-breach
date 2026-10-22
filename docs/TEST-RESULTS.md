# 검증 결과 / 2026-10-22 KST

구현·검증 주체: Codex. 아래 결과는 실행한 개발자 검증이며 독립 운영자·초보자 사용성 평가나 외부 심사 승인을 뜻하지 않습니다.

## 로컬 실행

| 항목 | 결과 | 근거 |
|---|---|---|
| TypeScript 및 프로덕션 빌드 | PASS | `npm run build` |
| 10문제 실제 자료 독립 풀이 | PASS | `tests/solve-fixtures.mjs`로 자료를 파싱하고 SHA-256 대조 |
| 006 IDOR HTTP 풀이 | PASS (Node 로컬) | 별도 프로세스의 /report 조회, 정상 문서와 비공개 문서 비교 |
| 가입·로그인·로그아웃·재로그인 | PASS (SQLite API) | `npm test`, 저장된 해결 상태 유지 |
| 오답·중복·8개 동시 중복 제출 | PASS | 중복 해결 PK, 점수 1회 지급 |
| 총점·인가·챕터·엔딩 | PASS (SQLite API) | 2,250점, LEVEL 0→1→2→3, ACT 1 COMPLETE |
| 세 단계 힌트·해설·문서 | PASS (SQLite API) | 해결 전 403, 해결 후 200, 힌트 사용 기록 |
| A/B 계정 데이터 분리 | PASS (SQLite API) | B는 0점, 문서·해설 접근 거부 |
| 미구현 문제·잠긴 챕터 | PASS | 011 API 404, LEVEL 미달 403 |
| CSRF Origin·세션·제출 제한 | PASS (SQLite API) | 외부 Origin 403, HttpOnly/Secure/SameSite, 로그아웃 토큰 폐기, 429 |
| PCAP 실제 도구 호환 | PASS | TShark HTTP 필터와 Follow TCP Stream raw 재조립 |
| 의존성 검사 | PASS | `npm audit --omit=dev`: 0 vulnerabilities at run time |
| 390px 모바일 화면 | PASS (브라우저) | 대시보드·임무 목록, body 375px / viewport 390px, 가로 넘침 없음 |
| 데스크톱 화면 | PASS (브라우저) | 1280px 대시보드 실제 렌더링 확인 |
| 실제 모바일 기기 | NOT_TESTED | 데스크톱 브라우저의 viewport만 검증 |
| exiftool 실행 | NOT_TESTED | PNG tEXt는 독립 파서로 검증, exiftool 미설치 |
| Docker Compose 실행·리소스·네트워크 | NOT_TESTED | Docker 미설치. 제한 설정의 정적 검토만 수행 |
| 초보자 난이도·사용성 실험 | NOT_TESTED | 힌트·난이도는 설계 판단, 실제 대상자 평가 없음 |

로컬 테스트 최종 실행: 3개 통합 테스트 PASS, 0 FAIL. 이 세 테스트가 위 하위 검증을 포함하며 단순히 3문제만 테스트한 것이 아닙니다.

## 배포 및 DB

- Vercel production: `https://scp-containment-breach.vercel.app`, 최초 배포 READY.
- 공개 `/api/health`: 실제 HTTP 200, version 1.0.0, implementedChallenges 10.
- Supabase: 기존 프로젝트의 전용 `scp_game` 스키마와 `scp-game-api` 함수 배포.
- 전용 스키마의 anon/authenticated USAGE: 둘 다 false 확인. 모든 전용 테이블에 RLS, server-only grants.
- 기존 앱의 스키마·데이터를 변경하지 않고 Data API 노출 목록에 scp_game만 추가.
- Supabase advisor의 전용 테이블 RLS no policy INFO는 기본 거부 서버 전용 설계에 따른 결과. 다른 스키마의 기존 RLS 경고는 이번 워게임 범위 밖이며 수정하지 않음. [Advisor 설명](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
- 실제 운영 가입·10문제 제출·점수·랭킹·A/B 분리 검증은 임시 QA 계정 생성 및 삭제 승인 이후 별도로 기록합니다. 로컬 통합 테스트를 운영 결과로 대체 표기하지 않습니다.

## 공개 파일 경계

프런트엔드 배포는 `dist/`와 Vercel API 프록시만 포함합니다. `docs/WALKTHROUGH.md`, `backend/verifiers.json`, `.local/answers.json`, `.env*`는 정적 웹 파일이 아닙니다. Git 공개 저장소에는 의도된 실습 자료와 서버 코드가 존재하지만, 운영 인증 비밀과 사용자 데이터는 포함하지 않습니다.
