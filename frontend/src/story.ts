export type ZoneId = "control" | "containment" | "research";
export const zones = {
  control: {
    id: "control",
    label: "관제·사무 구역",
    code: "PC / CONTROL",
    image: "/images/story/facility-control.webp",
    chapter: 1,
  },
  containment: {
    id: "containment",
    label: "저위험 격리 구역",
    code: "LCZ / CONTAINMENT",
    image: "/images/story/facility-containment.webp",
    chapter: 2,
  },
  research: {
    id: "research",
    label: "고위험 연구 구역",
    code: "HCZ / RESEARCH",
    image: "/images/story/facility-research.webp",
    chapter: 3,
  },
} as const;
export const chapterZones: Record<number, ZoneId> = {
  1: "control",
  2: "containment",
  3: "research",
};
export type Scene = {
  id: number;
  zone: ZoneId;
  room: string;
  item: string;
  damage: string;
  narrative: string;
  fragment: string;
  lead: string;
  image: string;
  alt: string;
};
const sceneRows: [ZoneId, string, string, string, string, string, string][] = [
  [
    "control",
    "PC-15 / 비상 관제실",
    "찢어진 경고문",
    "우측 가장자리 소실",
    "통제실의 유리벽 너머로 경고등이 깜빡인다. 전원이 꺼진 콘솔 위에 종이 한 장이 테이프로 붙어 있다.",
    "비상 경고 / 표면 기록은 손상됨. 원본 기록은 통제 단말에 남겨 두었다.",
    "보이는 화면과 전송된 원본은 같지 않을 수 있다. 통제실 페이지를 조사하라.",
  ],
  [
    "control",
    "PC-15 / 관리자 사무실",
    "파쇄된 관리자 메모",
    "본문 파쇄·순서 불명",
    "열린 사무실 문틈으로 종이 조각이 흩어져 있다. 메모는 찢겼지만 옆 단말에는 복구 모듈이 아직 연결되어 있다.",
    "관리자 전달 사항 / 복구용 사본은 클라이언트 모듈에 보관. 조각의 순서를 다시 확인할 것.",
    "메모 페이지가 불러오는 스크립트를 추적하라. 종이의 배치만으로 결론 내리지 말 것.",
  ],
  [
    "control",
    "COM-03 / 비상 통신실",
    "끊어진 수신 기록지",
    "전송 용지 일부 유실",
    "수신기의 스풀은 멈춰 있다. 잘려 나간 기록지 끝에는 외부 통신을 저장했다는 흔적만 남아 있다.",
    "비상 통신 수신 / 표시 형식 변환 적용. 송신 내용은 첨부된 디지털 기록에서 복구할 것.",
    "통신 기록의 payload를 조사하라. 인코딩과 암호화는 서로 다른 개념이다.",
  ],
  [
    "control",
    "EX-A / 출입 검문소",
    "물에 번진 인증 대장",
    "잉크 번짐·행 삭제",
    "검문소의 카드 리더는 여전히 켜져 있다. 젖은 인증 대장에는 반복된 접근 시도 뒤에 지워진 한 줄이 보인다.",
    "출입 승인 확인 / 반복 실패 이후의 접근을 재검토. 벽시계와 단말 시각은 KST로 통일되어 있다.",
    "원본 인증 로그에서 계정과 성공 시각을 대조하라. 종이에 지워진 행이 곧 증거는 아니다.",
  ],
  [
    "containment",
    "PT-00 / SCP-173 관측실",
    "손상된 감시 사진",
    "프레임 균열·하단 탈색",
    "빈 격리실을 비추던 감시 화면이 깨져 있다. 마지막 출력 사진이 모니터 아래에 끼워져 있다.",
    "감시 프레임 회수 / 사진의 외관과 파일이 보유한 정보는 별도 조사 대상. 원본 사본 보존.",
    "감시 이미지 파일을 확보하라. 픽셀 밖에 보관된 기록도 확인해야 한다.",
  ],
  [
    "containment",
    "GR-18 / 연구 문서 보관실",
    "검열된 연구원 보고서",
    "표지 절단·본문 검열",
    "서랍 하나가 잠기지 않은 채 열려 있다. 일반 보고서 아래에서 목록에 없는 분류표가 발견된다.",
    "연구 문서 분류 / 문서 번호는 보관 위치를 가리킨다. 열람 목록만으로 접근 권한이 보장되지는 않는다.",
    "격리된 실습용 문서 서버에서 보고서 번호와 접근 제어를 조사하라. 운영 계정은 조사 대상이 아니다.",
  ],
  [
    "containment",
    "EX-A / 감시 중계실",
    "서로 다른 두 사건 대장",
    "시각 열 절단·기록 불일치",
    "관측실에서 이어진 케이블은 중계실에서 끊겨 있다. 두 대장의 종료 사유가 서로 다르게 적혀 있다.",
    "감시계·출입계 기록 / 같은 시각을 기준으로 대조할 것. 한 시스템의 설명만으로 사건을 종결하지 말 것.",
    "CCTV와 출입 로그를 나란히 놓고 관리자 명령의 타임라인을 재구성하라.",
  ],
  [
    "research",
    "049-A / 담당 연구원 사무실",
    "오염된 연구 일지",
    "약품 얼룩·하단 찢김",
    "엘리베이터 아래층의 연구실에는 불빛만 남아 있다. 약품에 젖은 수첩 옆에서 일지의 디지털 사본을 확보했다.",
    "연구 일지 복구 / 단순 반복 키 사용. 같은 조작을 각 바이트에 적용했으므로 가능한 키를 비교할 수 있다.",
    "남은 암호문 사본을 분석하라. 종이에 남은 불명확한 기호를 그대로 입력할 필요는 없다.",
  ],
  [
    "research",
    "SRV-09 / 서버 유지보수실",
    "잘려 나간 통신 출력물",
    "연속 기록 중간 절단",
    "연구원 단말의 케이블을 따라가자 서버실에 도착한다. 카트 위의 저장 매체에는 마지막 통신의 사본이 남아 있다.",
    "통신 기록 봉인 / 정상 트래픽과 조사 대상 트래픽이 함께 보존됨. 분리된 조각은 하나의 스트림으로 확인할 것.",
    "PCAP 원본을 열어 HTTP 통신과 재조립된 TCP 스트림을 조사하라.",
  ],
  [
    "research",
    "049-R / 제한 연구 기록실",
    "서명란이 사라진 보고서",
    "세 조각 분리·다중 검열",
    "기록실 깊숙한 서류철에서 세 조각의 보고서를 찾았다. 지워진 승인자 옆에는 앞서 회수한 통신 기록을 대조하라는 메모가 있다.",
    "조사 보고서 / 프로젝트 항목 검열. 마지막 통신 기록과 함께 읽을 것. 승인자: [데이터 삭제됨].",
    "보고서 원본의 검열 방식과 앞선 네트워크 증거를 연결하라. 이 문서는 사건의 끝이 아니다.",
  ],
];
export const scenes: Scene[] = sceneRows.map(
  ([zone, room, item, damage, narrative, fragment, lead], i) => ({
    id: i + 1,
    zone,
    room,
    item,
    damage,
    narrative,
    fragment,
    lead,
    image: `/images/story/evidence-${String(i + 1).padStart(3, "0")}.webp`,
    alt: `${room}에서 발견한 ${damage} 상태의 ${item}`,
  }),
);
export const getScene = (id: number) =>
  scenes.find((scene) => scene.id === id)!;
