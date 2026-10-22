# 시설 조사 연출과 이미지 제작 기록

## 참고 범위

사용자가 지정한 [나무위키 시설 페이지](https://namu.wiki/w/SCP:%20Secret%20Laboratory/%EC%8B%9C%EC%84%A4)는 직접 열람이 실패했고, 브라우저에서는 사이트 보안 정책에 의해 차단되었습니다. 우회하여 내용을 수집하지 않았으며 해당 원문을 읽었다고 주장하지 않습니다. 시설의 공간적 특징은 다음 공식 게임 위키로 보완 확인했습니다.

- [Site-02와 네 개 시설 구역](https://en.scpslgame.com/index.php?title=Site-02)
- [Light Containment Zone](https://en.scpslgame.com/index.php?title=Light_Containment_Zone): 사무실, SCP-173 구역, 관측·시험실, 검문소, 엘리베이터 등
- [Heavy Containment Zone](https://en.scpslgame.com/index.php?title=Heavy_Containment_Zone): SCP-049 구역, 서버실, 검문소 등

이 프로젝트의 기지는 원작의 Site-02가 아니라 창작 설정인 제██-17입니다. 실제 게임의 무작위 배치 지도를 복제하지 않았습니다. PC/LCZ/HCZ 공간 분위기와 호실 식별 방식을 참고해 10개 조사 현장의 동선을 재구성했습니다. 각 호실의 용도·문서 내용은 본 게임을 위한 창작이며 원작 게임의 지도·사건을 그대로 재현한 것이 아닙니다.

## 구현된 조사 흐름

로그인 이후 모든 페이지는 현재 조사 구역에 맞는 시설 배경과 어두운 읽기 패널을 표시합니다. 임무 상세에서는 해당 현장의 배경으로 바뀝니다. 대시보드와 문제 목록의 조사 동선은 서버에서 받은 해결 기록과 인가 등급을 사용하며, UI의 현장 기록 열기 자체가 해결·점수·인가를 만들지 않습니다.

각 문제의 흐름은 현장 이미지 발견 → 조사 지점 클릭 → 훼손 문서의 판독 메모 확인 → 원본 실습 자료 분석 → 서버 FLAG 검증 → 기존 해설·문서 해금 → 다음 현장 이동입니다. 기존 10개 문제의 자료, 정답, 점수, 난이도, 잠금 조건은 바꾸지 않았습니다. 분석 이미지와 시나리오는 보조 연출이며 실제 정답은 원본 실습 자료에서 도출합니다.

## 이미지 13종

내장 **image_gen** 도구로 새로 생성한 원본 환경·증거 이미지입니다. 기존 게임 스크린샷, 나무위키 이미지, SCP-173 조각상 사진을 다운로드하거나 복제하지 않았습니다. 게임 내 글자는 직접 생성한 읽을 수 있는 HTML 텍스트로 별도 제공합니다. 이미지 속 모호한 글자·그림은 해독해야 할 정답이 아닙니다.

| 파일 | 목적 |
|---|---|
| `public/images/story/facility-control.webp` | 관제·사무 구역 배경 |
| `public/images/story/facility-containment.webp` | 격리 구역 배경 |
| `public/images/story/facility-research.webp` | 연구 기록 구역 배경 |
| `public/images/story/evidence-001.webp` | 콘솔에 붙은 찢어진 경고문 |
| `public/images/story/evidence-002.webp` | 파쇄된 관리자 메모 |
| `public/images/story/evidence-003.webp` | 끊어진 수신 기록지 |
| `public/images/story/evidence-004.webp` | 물에 번진 인증 대장 |
| `public/images/story/evidence-005.webp` | 손상된 CCTV 화면·출력 사진 |
| `public/images/story/evidence-006.webp` | 서랍 속 검열된 연구 보고서 |
| `public/images/story/evidence-007.webp` | 서로 어긋난 두 사건 대장 |
| `public/images/story/evidence-008.webp` | 오염되고 찢어진 연구 일지 |
| `public/images/story/evidence-009.webp` | 서버실의 잘려 나간 통신 출력물 |
| `public/images/story/evidence-010.webp` | 세 조각으로 찢어진 검열 보고서 |

**최종 프롬프트 전체와 파일별 크기·해상도**는 [story-art-manifest.json](story-art-manifest.json)에 기록했습니다. 공통 방향은 어두운 청록·올리브·콘크리트, 제한된 적색 비상등, 실제 종이의 찢김·얼룩·검열, 사람·고어·정답 문자열·원작 로고 없음입니다.

원본 PNG는 생성 도구의 사용자 폴더에 보존했습니다. 서비스가 참조하는 최종 WebP 13개는 모두 저장소의 `public/images/story/`에 들어 있습니다. Sharp로 1536px 이하, quality 82의 WebP로 최적화했으며 합계 약 1.9MiB입니다. 불필요한 원본 대용량 PNG는 웹 배포에 포함하지 않습니다.

수정·재생성 시 `.local/story-art-sources.json`에 출제자의 로컬 원본 위치와 프롬프트를 기록한 다음 `node scripts/optimize-story-art.mjs`로 최종 파일과 매니페스트를 갱신합니다. 이 로컬 위치 목록은 Git에서 제외됩니다. 사용자 제공 기존 소개 페이지 이미지는 이번 작업에서 교체하지 않았습니다.

## 접근성과 검증

현장 이미지는 대체 텍스트와 별도 서사를 제공합니다. 조사 지점은 키보드로 조작 가능한 버튼이고 펼침 상태를 알립니다. 확대 창은 Escape로 닫히며 포커스를 되돌립니다. 모바일에서는 사진·문서가 한 열로 배치되고, 배경은 본문의 가독성을 해치지 않도록 어둡게 덮습니다. 이동 시 스크롤을 화면 위로 초기화하고, 동선 스크롤은 reduced-motion 설정을 존중합니다.

본 이미지는 장면 연출을 위한 AI 생성물이며 실제 침해 사건의 증거 사진이 아닙니다.
