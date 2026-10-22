# 보안 및 실습 격리

## 운영 서비스

- 비밀번호: bcrypt cost 12, UTF-8 72바이트 제한. 원문 저장·출력 금지.
- 세션: 난수 256비트, DB에는 SHA-256만 저장, 7일 만료. 로그아웃 시 서버 세션 삭제. 운영은 `__Host-` + Secure + HttpOnly + SameSite=Strict + Path=/.
- CSRF: 모든 POST의 Origin을 정확히 검사하고 application/json만 허용. 프록시가 외부 요청의 Origin을 그대로 전달합니다.
- 인가: 서버가 매 요청 세션을 조회하고 user_id를 결정합니다. 요청 본문의 userId·score·clearance를 신뢰하지 않습니다.
- 입력: 코드명·비밀번호·FLAG 형식, 길이, 문제 ID, 힌트 단계 검사. SQL 문자열로 사용자 입력을 조립하지 않습니다.
- 제출: 사용자당 20회/60초. DB upsert 기반 제한은 서버리스 인스턴스 사이에도 공유됩니다.
- 인증: 코드명당 10회/5분, 등록 전역 100회/시간. IP 헤더 위조에 의존하지 않습니다. 별도의 WAF·봇 관리·분산 공격 방어는 이 MVP에서 검증하지 않았습니다.
- 해설과 기밀문서는 해당 문제 해결 이후에만 반환. `/catalog`는 힌트 본문·해설·문서와 검증 해시를 제외합니다.
- 제출 기록에는 FLAG 원문을 보관하지 않습니다. 불필요한 운영 비밀은 브라우저·Git·로그에 넣지 않습니다.
- 응답: no-store, nosniff, CSP, frame-ancestors none, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy.
- 공개 정적 증거는 접근 가능한 학습 파일입니다. 챕터 잠금은 서버 채점·해설·문서 인가에 적용되고, 파일 자체를 비밀 저장소로 취급하지 않습니다.

## Supabase

`scp_game`은 모든 테이블 RLS 활성화 + anon/authenticated 스키마·테이블·함수 권한 회수 상태입니다. 사용자용 RLS 정책을 부여하지 않아 기본 거부합니다. Edge 함수만 service role로 고정된 경로에 접근합니다. 이 설계는 DB에서 사용자를 재인증하는 RLS 모델이 아니며, 사용자별 권한은 API에서 강제합니다. 관리 키가 유출되면 범위가 커질 수 있으므로 Edge 런타임에만 보관합니다.

전용 RPC는 SECURITY INVOKER, 빈 search_path, 명시적 스키마 이름, service_role 실행 권한만 사용합니다. 별도 SECURITY DEFINER 우회가 없습니다. 기존 `public`, `jigwan`, `vault_api`, `pds`의 권한과 데이터를 변경하지 않았습니다.

Supabase advisor에는 `scp_game` 테이블에 대한 정책 없음 INFO가 예상됩니다. 기본 거부·서버 전용 모델이기 때문입니다. 기존 다른 스키마의 경고·오류는 프로젝트 전체의 별도 이슈이며 이 워게임의 해결 성과로 기록하지 않습니다. 기존 테이블을 임의 수정하지 않습니다.

## 실습 컨테이너

- non-root UID 1000, read_only, cap_drop ALL, no-new-privileges
- privileged 미사용, Docker socket 미노출, 호스트 볼륨 미사용
- 서비스별 메모리 128MiB / CPU 0.25 / PID 32 제한
- internal Docker network, 호스트 바인딩 127.0.0.1만 사용
- 가상의 문서만 포함. 운영 인증 쿠키·운영 DB 연결 없음
- 006의 의도적 IDOR는 별도 실습 코드에만 존재

이는 구성의 정적 검토 결과입니다. Docker 런타임·네트워크 차단·리소스 제한 실제 동작은 Docker가 있는 호스트에서 별도로 검증해야 합니다. `npm run lab` 대체 실행은 컨테이너 격리가 아닙니다.

## 운영 관리

현재 계정 복구·탈퇴 UI·이메일 인증·2FA는 없습니다. 코드명은 공개 랭킹에 표시되므로 개인정보를 사용하지 않도록 안내합니다. 향후 계정 정책과 운영자 지원 경로를 별도로 설계합니다.

만료 세션과 rate_buckets는 주기적 정리가 필요합니다. 운영자가 전용 스키마에서 `expires_at < now()` 조건으로 정리할 수 있습니다. 이번 배포는 기존 Cron·스케줄러를 수정하지 않습니다. 제출 이력 보존 기간과 백업 복구 정책은 별도 운영 결정 사항입니다.

취약점 보고에는 운영 키, 비밀번호, 세션 쿠키, 실제 사용자 데이터를 붙이지 않습니다. 로컬 재현과 영향 경로를 설명하세요.
