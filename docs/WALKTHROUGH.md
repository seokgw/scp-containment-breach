# 관리자 풀이 절차

**스포일러: 이 파일은 GitHub에서 공개되지만 웹의 정적 배포에는 포함하지 않습니다. 정답 문자열 목록은 기록하지 않습니다.** 실제 풀이 자동화는 `tests/solve-fixtures.mjs`, 10개 검증 해시는 `backend/verifiers.json`에 있습니다. 운영 비밀키와 사용자 계정 정보는 어떤 문제에도 필요하지 않습니다.

1. **001 HTML**: `public/evidence/001/control.html`의 소스를 열어 HTML 주석의 incident-marker를 찾습니다. 화면의 텍스트가 아닌 전송된 원본이 분석 대상입니다.
2. **002 JavaScript**: memo.html의 script src로 memo.js를 찾습니다. fragments를 order 인덱스 순서대로 조합하는 restoreMemo를 추적합니다. 단순 문자열 나열 순서는 정답이 아닙니다.
3. **003 Base64**: transmission.txt의 payload= 이후를 `base64.b64decode` 또는 브라우저 디코더로 풉니다. 파일의 헤더 전체를 디코더에 넣지 않습니다. 디코딩 결과를 제출합니다.
4. **004 인증 로그**: 반복 FAIL과 후속 SUCCESS가 있는 계정을 찾고 성공 시각을 HHMMSS로 정규화합니다. 화면에 안내된 계정·시각 조합 규칙을 사용합니다. 모든 시각은 KST입니다.
5. **005 PNG**: `exiftool public/evidence/005/cctv.png`를 실행하고 IncidentComment를 확인합니다. 대체 풀이로 PNG의 length/type/data/CRC 구조를 파싱하고 tEXt 청크를 읽습니다. 이미지 자체는 생성된 도형이며 SCP-173 조각상 사진이 아닙니다.
6. **006 IDOR**: `docker compose up --build -d` 후 127.0.0.1:8080에서 자신의 보고서를 엽니다. URL의 id를 인접 문서 값으로 바꿔 비공개 보고서를 읽습니다. 조회 대상은 이 서버에 포함된 가상 자료뿐입니다. 운영 서비스의 user ID나 진행 기록을 변조하는 문제가 아닙니다.
7. **007 타임라인**: CCTV OFFLINE 시각을 찾고 같은 시각의 ACCESS CONTROL 관리자 명령을 확인합니다. actor, command, HHMMSS를 문제의 제출 규칙대로 조합합니다. 단순히 마지막 로그 행을 고르지 않습니다.
8. **008 XOR**: journal.txt의 hex를 bytes로 변환합니다. 각 후보 키 0–255에 대해 모든 바이트에 XOR를 적용합니다. 읽을 수 있는 연구 기록과 알려진 FLAG 형식으로 올바른 후보를 찾습니다.
9. **009 PCAP**: Wireshark로 last-contact.pcap을 열고 `http` 필터를 적용합니다. `/research/079` 요청 또는 해당 응답에서 Follow → TCP Stream을 선택합니다. 정상 /health 통신은 잡음입니다. 두 패킷에 분할된 본문을 재조립해 기록과 제출 값을 확인합니다. `node scripts/verify-pcap.mjs`는 TShark의 실제 HTTP 필터와 Follow Stream으로 이를 검증합니다.
10. **010 검열 보고서**: report.html의 .redacted 요소를 소스로 확인합니다. analyst-note의 조합 규칙과 009에서 확인한 사건 전 시간(분)을 함께 사용합니다. 문서의 검열된 프로젝트명만 복사해서는 완성되지 않습니다.

해결 후 `/solution`은 개념·도구·풀이·방어 내용을 반환하고 `/document`는 창작 사건 기록을 반환합니다. 010 해결과 ACT I 전체 완료 시 엔딩이 표시됩니다. 최종 범인·K-17의 숨겨진 관계는 ACT I 엔딩에서 확정하지 않습니다.

풀이 검증: `npm test`는 별도의 파일 파서로 위 과정을 실행하고 정답 해시와 대조합니다. 006은 실제 로컬 HTTP 요청을 수행합니다. 자동 파서는 관리자용 보조 도구이며 실제 초보자 난이도 실험이나 Docker 격리 실증을 대체하지 않습니다.
