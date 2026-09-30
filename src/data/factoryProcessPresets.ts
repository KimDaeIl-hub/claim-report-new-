export interface FactoryProcessPreset {
  id: string;
  name: string;
  type: "internal" | "oem";
  teamOrCategory: string; // 자사: '식품팀' | '건기식팀', 외주: 대표 라인 성격
  description: string;
  processFlow: string;
  processSteps: string[];
  filtrationAnalysis: string;
  cleaningAnalysis: string;
  criticalControlPoint: string;
  isCustom?: boolean;
}

export const FACTORY_PROCESS_PRESETS: FactoryProcessPreset[] = [
  // =========================================================================
  // [1] 자사 생산팀 (식품팀 / 건기식팀)
  // =========================================================================
  {
    id: "internal-food",
    name: "광동제약 식품팀",
    type: "internal",
    teamOrCategory: "식품팀",
    description: "광동제약 평택공장 식품팀 음료·유리병·파우치 주력 생산라인 (비타500, 쌍화탕, 옥수수수염차 등)",
    processFlow:
      "원료 입고 및 칭량 → 추출 및 배합액 조제 → 150 Mesh(105㎛) 마이크로 여과 → UHT 초고온 순간살균(135℃, 30초) → 85℃ 고온 온수 린싱 및 세척 → 충진 및 밀봉(캡핑) → 전수 비전 검사 및 금속검출기(Fe 1.5mm, Sus 2.0mm) → 후살균/냉각 → 라벨링 및 박스 포장",
    processSteps: [
      "원료 입고 및 칭량",
      "추출 및 배합액 조제",
      "150 Mesh(105㎛) 마이크로 여과",
      "UHT 초고온 순간살균 (135℃)",
      "85℃ 고온 온수 세척 린싱",
      "충진 및 밀봉 (캡핑)",
      "비전 검사 및 금속검출기",
      "후살균 및 냉각 샤워",
      "라벨링 및 완제품 포장",
    ],
    filtrationAnalysis:
      "원료 투입 및 배합 공정 후 150 Mesh(105㎛) 정밀 스트레이너 및 마이크로 카트리지 필터를 2중 통과하여 0.1mm 이상의 물리적 이물 혼입을 원천 차단함.",
    cleaningAnalysis:
      "공병 투입 후 85℃ 이상 고온 온수 린싱 및 3.5 bar 청정 에어 블로우를 동시 진행하여 용기 내부 잔류물 및 이물을 완벽히 제거함.",
    criticalControlPoint:
      "UHT 순간살균 온도 모니터링(CCP-1B: 135±2℃) 및 포장 직전 금속검출기 통과(CCP-2P: Fe 1.5mm, Sus 2.0mm 전수 적합 검증).",
  },
  {
    id: "internal-health",
    name: "광동제약 건기식팀",
    type: "internal",
    teamOrCategory: "건기식팀",
    description: "광동제약 평택공장 건강기능식품팀 GMP 정제·연질캡슐·스틱 파우치 라인",
    processFlow:
      "기능성 원료 칭량 → 초미분쇄 및 혼합 → 80 Mesh 진동체 여과 → 과립화/건조 → 타정/캡슐 충진 → 1차 제진 및 금속검출기 통과 → 개별 PTP/스틱 알루미늄 포장 → 기밀도 리크 검사 → 카톤 입갑 및 최종 외박스 포장",
    processSteps: [
      "기능성 원료 칭량",
      "초미분쇄 및 균질 혼합",
      "80 Mesh 진동체 선별 여과",
      "과립화 및 열풍 건조",
      "타정 및 캡슐 성형충진",
      "1차 제진 및 금속검출기",
      "개별 스틱/PTP 포장",
      "기밀도 리크 검사 및 카톤 입갑",
      "최종 외박스 포장",
    ],
    filtrationAnalysis:
      "분말 혼합 및 조제 시 80 Mesh(177㎛) 진동 체망(Sifter)을 통과하여 덩어리 및 외래 이물을 100% 제거하고 분말을 균질화함.",
    cleaningAnalysis:
      "GMP 청정구역(Class 10,000) 공조 제어 하에 클린룸 내 진공 흡입 제진 및 에어 샤워 시스템을 통하여 용기 및 포장재 청정도 유지.",
    criticalControlPoint:
      "금속검출기 공정(CCP-1P) 및 정제 중량 편차/기밀도 리크 검사(CCP-2P) 실시간 모니터링.",
  },

  // =========================================================================
  // [2] 외주 (OEM) 제조처 14개소
  // =========================================================================
  {
    id: "oem-samyang",
    name: "삼양패키징 광혜원공장",
    type: "oem",
    teamOrCategory: "무균 Aseptic PET",
    description: "국내 최대 Aseptic(무균충전) PET 음료 전문 공장 (헛개차 1.5L/500ml, 옥수수수염차 등)",
    processFlow:
      "원료 추출 → 추출액 저장(냉각 등) → 여과(0.5μm 필터) → 여과(0.2μm 필터) → 배합 → 배합액 검사 → 여과(0.2μm 필터) → UHT 살균(136.8±2°C) → Aseptic 충전 → 캡핑 → 날인 인쇄 → 검사(Fill level, 소비기한 등) → 라벨링 → 라벨 검사 → 박스 포장",
    processSteps: [
      "원료 추출 및 추출액 냉각 저장",
      "여과 (0.5μm 및 0.2μm 마이크로 필터)",
      "배합 및 배합액 규격 검사",
      "여과 (0.2μm 최종 제균 필터)",
      "UHT 초고온 살균 (136.8±2℃)",
      "Aseptic 무균 챔버 충전 및 캡핑",
      "Fill level 및 소비기한 날인 검사",
      "라벨링 및 전수 비전 검사",
      "박스 포장 및 완제품 적재",
    ],
    filtrationAnalysis:
      "다회 마이크로 필터(0.5μm 및 최종 0.2μm 제균 필터)와 충전 노즐 40 Mesh(pore size 0.42mm) 필터를 거쳐 이물 및 미생물 혼입을 차단함.",
    cleaningAnalysis:
      "PET병 및 캡은 충전 전 고압 세척수 및 과산화수소(H2O2) 살균을 진행 후 무균 챔버 내로 투입됨.",
    criticalControlPoint:
      "UHT 살균 온도 모니터링(136.8±2℃) 및 Aseptic 무균 챔버 양압 환경 실시간 제어.",
  },
  {
    id: "oem-dongwon",
    name: "동원시스템즈 횡성공장",
    type: "oem",
    teamOrCategory: "무균 Aseptic PET",
    description: "최신 무균 아셉틱 음료 충전 및 친환경 포장 라인",
    processFlow:
      "원료 추출 및 농축 → 마이크로 제균 여과(0.45㎛) → 초고온 순간살균(UHT 135℃) → Class 100 클린룸 Aseptic 무균 충전 → 멸균 캡 체결 → X-ray 액면 검사 → 롤 라벨링 → 로봇 자동 포장",
    processSteps: [
      "원료 추출 및 농축액 보관",
      "마이크로 제균 여과 (0.45㎛)",
      "초고온 순간살균 (UHT 135℃)",
      "Class 100 무균실 Aseptic 충전",
      "멸균 캡 체결 및 기밀도 검사",
      "X-ray 액면 및 이물 전수 검사",
      "롤 라벨링 및 자동 박스 포장",
    ],
    filtrationAnalysis:
      "원액 추출 후 1차 백필터(50㎛) 및 충전 직전 2차 정밀 카트리지 필터(0.45㎛) 2단 여과를 통하여 미세 이물 유입 방지.",
    cleaningAnalysis:
      "무균화된 과아세트산(PAA) 멸균액 및 무균 정제수로 용기 내외부 정밀 세척 및 클린 에어 건조.",
    criticalControlPoint:
      "살균기 온도 자동 기록계(CCP-1B: 135℃) 및 무균 클린룸 차압·무균도 제어(CCP-2P).",
  },
  {
    id: "oem-healthbio",
    name: "광동헬스바이오",
    type: "oem",
    teamOrCategory: "파우치·스틱·발효",
    description: "발효음료, 기능성 파우치, 젤리스틱 전문 제조 수탁사",
    processFlow:
      "배양 및 발효 농축 → 정밀 배합 → 100 Mesh 여과망 통과 → 95℃ 고온 살균 → 자동 4열 파우치 충진 및 열융착 실링 → 온수 살균조 침지(85℃, 20분) → 냉각 → 엑스레이 이물 검출 → 박스 포장",
    processSteps: [
      "배양 및 발효 농축액 조제",
      "정밀 배합 및 당도 조정",
      "100 Mesh 여과망 및 자력 선별",
      "95℃ 고온 1차 순간 살균",
      "자동 4열 파우치 충진 및 실링",
      "온수 살균조 침지 (85℃, 20분)",
      "냉각 샤워 및 수분 건조",
      "X-ray 이물 검출 및 박스 포장",
    ],
    filtrationAnalysis:
      "원료 혼합 후 100 Mesh(150㎛) 인라인 여과망 및 자력 선별기(10,000 Gauss)를 통해 금속 및 이물을 2중 차단함.",
    cleaningAnalysis:
      "파우치 필름 공급 시 정전기 제거 UV 살균 터널 통과 및 고순도 청정 에어 블로우 세척.",
    criticalControlPoint:
      "살균 침지 온도 및 시간 제어(CCP-1B: 85℃ 20분) 및 X-ray 이물 검사(CCP-2P).",
  },
  {
    id: "oem-jungang",
    name: "중앙타프라",
    type: "oem",
    teamOrCategory: "PET 핫필·드링크",
    description: "PET 병 음료 및 드링크 전문 블로우-충전 라인",
    processFlow:
      "원액 조제 → 규조토 및 마이크로 필터 여과 → 열교환 순간살균 → 보틀 린서 세척 → 핫필(Hot-Fill 87℃) 충전 및 캡핑 → 병 도립(Inverter) 캡 살균(30초) → 쿨링 샤워 냉각 → 라벨링 및 수축 포장",
    processSteps: [
      "원액 조제 및 규조토 여과",
      "열교환 순간 살균 (95℃)",
      "로터리 린서 공병 온수 세척",
      "핫필(Hot-Fill 87℃) 충전 및 캡핑",
      "병 도립 캡 살균 (30초)",
      "냉각 샤워 쿨링",
      "라벨 부착 및 수축 포장",
    ],
    filtrationAnalysis:
      "원액 라인 150 Mesh 스테인리스 필터를 거쳐 충전 노즐로 이송되어 물리적 입자 혼입 방지.",
    cleaningAnalysis:
      "자동 로터리 린서에서 80℃ 온수 고압 분사 세척 및 드레인 건조 공정 적용.",
    criticalControlPoint:
      "Hot-Fill 충전 온도(87±2℃) 및 캡 살균 도립 컨베이어 통과 시간(30초 이상) 엄격 관리.",
  },
  {
    id: "oem-okf",
    name: "오케이에프",
    type: "oem",
    teamOrCategory: "알로에·멀티음료",
    description: "알로에 음료 및 멀티 음료 글로벌 생산 라인",
    processFlow:
      "원료 입고 및 전처리 → 배합 탱크 균질화 → 80 Mesh 및 150 Mesh 다단 여과 → 초고온 살균(121℃) → 자동 음료 충진 → 질소 치환(LN2) 및 캡핑 → 캔/병 진공 타검기 검사 → 외포장",
    processSteps: [
      "원료 입고 및 알로에 겔 전처리",
      "배합 탱크 교반 및 균질화",
      "80/150 Mesh 다단 정밀 여과",
      "초고온 순간 살균 (121℃)",
      "자동 무균 충진 및 질소 치환",
      "캡핑 및 진공 타검기 검사",
      "수축 라벨링 및 외박스 포장",
    ],
    filtrationAnalysis:
      "원료 특성을 고려한 특수 슬롯 필터 및 150 Mesh 정밀망을 적용하여 이물 유입 차단.",
    cleaningAnalysis:
      "반전식 고압 세척 린서(Inverted Rinser)에서 제균수로 병 내벽 360도 고압 린싱.",
    criticalControlPoint:
      "살균 F0값 제어(CCP-1B) 및 질소 충진 압력/진공 캡핑 타검 검사.",
  },
  {
    id: "oem-healthy",
    name: "건강한사람들",
    type: "oem",
    teamOrCategory: "무균 PET·유제품",
    description: "OEM 전문 음료 및 유제품 무균/페트 라인",
    processFlow:
      "원료 배합 및 균질화(Homogenizer) → 0.45㎛ 마이크로 제균 필터 → UHT 무균 살균(137℃) → 무균 챔버 Aseptic 페트 충전 → 캡핑 → 감마선 액면 검사 → 수축 라벨링 → 자동 박스 포장",
    processSteps: [
      "원료 배합 및 고압 균질화",
      "0.45㎛ 마이크로 제균 필터",
      "UHT 초고온 무균 살균 (137℃)",
      "무균 챔버 Class 100 충전 및 캡핑",
      "감마선 액면 레벨 검사",
      "수축 라벨링 및 자동 로봇 포장",
    ],
    filtrationAnalysis:
      "다공성 멤브레인 필터(0.45㎛) 및 인라인 마그네틱 트랩(12,000 Gauss)을 설치하여 미세 이물 전수 차단.",
    cleaningAnalysis:
      "과산화수소 가스 멸균 챔버 통과 및 무균 온수 세척으로 완전 멸균 상태 확보.",
    criticalControlPoint:
      "살균 유지 온도(137±1℃) 및 챔버 HEPA 필터 무균도 관리(CCP-1B).",
  },
  {
    id: "oem-seoulfnb",
    name: "서울F&B",
    type: "oem",
    teamOrCategory: "컵커피·무균팩",
    description: "친환경 컵커피, 무균 팩, 드링크 생산 라인",
    processFlow:
      "원료 추출 및 우유/원액 배합 → UHT 초고온 살균(138℃) → 무균 버퍼 탱크 저장 → 아셉틱 무균 컵/보틀 충전 → 초음파 리드 융착 및 캡 결합 → 엑스레이 이물 검사기 통과 → 냉장 보관 출하",
    processSteps: [
      "원료 추출 및 원액 정밀 배합",
      "UHT 초고온 살균 (138℃, 4초)",
      "무균 버퍼 탱크 임시 저장",
      "아셉틱 무균 컵/보틀 충전",
      "초음파 리드 실링 및 캡 체결",
      "X-ray 이물 검사기 통과",
      "냉장 보관 및 저온 출하",
    ],
    filtrationAnalysis:
      "원유 및 추출액 200 Mesh 정밀 스트레이너 통과 후 듀얼 카트리지 필터 여과.",
    cleaningAnalysis:
      "용기 내면 과산화수소 훈증 멸균 및 UV-C 자외선 살균 터널 통과.",
    criticalControlPoint:
      "UHT 순간살균 CCP-1B(138℃, 4초) 및 금속/X-ray 이물 검사기 CCP-2P.",
  },
  {
    id: "oem-seoju",
    name: "서주푸드",
    type: "oem",
    teamOrCategory: "젤리·스파우트 파우치",
    description: "음료, 젤리/스파우트 파우치 전문 생산 라인",
    processFlow:
      "원료 계량 및 용해 → 고온 순간 살균(95℃) → 숙성 탱크 보관 → 스파우트 파우치 충진 → 캡핑 및 토크 검사 → 후살균 쿨러 → 건조 → 중량 선별 및 박스 포장",
    processSteps: [
      "원료 계량 및 균질 용해",
      "고온 순간 살균 (95℃)",
      "숙성 탱크 보관 및 탈포",
      "스파우트 파우치 자동 충진",
      "캡핑 및 체결 토크 검사",
      "후살균 온수조 및 냉각 쿨러",
      "중량 선별 및 박스 포장",
    ],
    filtrationAnalysis:
      "용해액 이송 시 100 Mesh 여과망을 거쳐 불용해분 및 이물 분리 제거.",
    cleaningAnalysis:
      "스파우트 파우치 내부 무균 이온 에어 블로우 흡입 세척.",
    criticalControlPoint:
      "살균 온도 시간 관리(CCP-1B) 및 중량 선별기 과부족 전수 검사.",
  },
  {
    id: "oem-tulip",
    name: "튤립인터내셔널",
    type: "oem",
    teamOrCategory: "캔(CAN)·수출 음료",
    description: "캔(CAN) 및 PET 음료 생산 공장",
    processFlow:
      "원료 정밀 배합 → 플레이트 살균기(98℃) → 자동 캔 시머(Seamer) 충진 및 밀봉 → 레토르트 고압 멸균(121℃, 25분) → 냉각 샤워 → 캔 리크 진공 타검기 → 번들 수축 포장",
    processSteps: [
      "원료 정밀 배합 및 여과",
      "플레이트 열교환 살균 (98℃)",
      "자동 캔 충진 및 시밍 밀봉",
      "레토르트 고압 멸균 (121℃, 25분)",
      "냉각 샤워 쿨링",
      "캔 진공 타검 리크 검사",
      "번들 수축 및 외박스 포장",
    ],
    filtrationAnalysis:
      "배합 라인 120 Mesh 스트레이너 및 마그넷 바 통과로 금속성 이물 배제.",
    cleaningAnalysis:
      "공캔 트위스트 반전 린서에서 85℃ 고온 온수 제균 세척.",
    criticalControlPoint:
      "레토르트 F0값 살균 기록(CCP-1B) 및 시밍 2중 밀봉 권철 검사(CCP-2P).",
  },
  {
    id: "oem-sangil",
    name: "상일",
    type: "oem",
    teamOrCategory: "건강음료·유리병",
    description: "건강음료, 파우치, 유리병 OEM/ODM 전통 수탁 제조사",
    processFlow:
      "원료 칭량 및 한방/과채 추출 → 여과 및 농축 → 배합 → 순간 살균기(105℃) → 유리병 자동 충진 → 캡핑(트위스트 캡) → 증기식 병목 살균 → 냉각 → 라벨링 및 포장",
    processSteps: [
      "원료 칭량 및 한방 추출",
      "여과 및 농축액 배합",
      "순간 살균기 가온 (105℃)",
      "유리병 자동 정량 충진",
      "트위스트 캡핑 밀봉",
      "증기식 병목 살균 및 냉각",
      "라벨링 및 완제품 포장",
    ],
    filtrationAnalysis:
      "추출액 규조토 1차 여과 및 150 Mesh 2차 카트리지 정밀 여과 진행.",
    cleaningAnalysis:
      "로터리 병 세병기에서 80℃ 온수 린싱 및 에어 나이프 건조.",
    criticalControlPoint:
      "순간 살균 온도(105±2℃) 및 캡핑 진공도(Safety Button) 점검.",
  },
  {
    id: "oem-purup",
    name: "퓨럽",
    type: "oem",
    teamOrCategory: "과채주스·퓨레",
    description: "과채주스, 퓨레, 스파우트 파우치 전문 친환경 가공 공장",
    processFlow:
      "원과 선별 및 세척 → 파쇄 및 착즙 → 디캔터 원심분리 여과 → 저온 순간살균(85℃) → 무균 파우치 충진 → 캡핑 → 금속검출기 통과 → 냉장 유통 포장",
    processSteps: [
      "원과 선별 및 오존수 세척",
      "파쇄 및 착즙 공정",
      "디캔터 원심분리 정밀 여과",
      "저온 순간 살균 (85℃)",
      "무균 파우치 충진 및 캡핑",
      "금속검출기 전수 검사",
      "냉장 보관 및 유통 포장",
    ],
    filtrationAnalysis:
      "원심분리기 및 80 Mesh 진동체 필터를 통한 과육 펄프 균일화 및 이물 제거.",
    cleaningAnalysis:
      "파우치 내부 클린 질소 에어 블로우 세척.",
    criticalControlPoint:
      "저온 살균 온도 제어(CCP-1B) 및 자력 선별기 점검.",
  },
  {
    id: "oem-daewoong",
    name: "대웅생명과학",
    type: "oem",
    teamOrCategory: "건기식 드링크·캡슐",
    description: "의약외품, 건강기능식품 드링크 및 연질/경질캡슐 라인",
    processFlow:
      "원료 입고 시험(QC) → 정밀 배합조 조제 → 0.22㎛ 제균 필터 여과 → 바이알/병 충진 → 크림핑/캡핑 → 고압 증기 멸균(121℃) → 자동 외관 이물 검사기(Vision) → 완제품 포장",
    processSteps: [
      "원료 입고 시험 및 칭량",
      "배합조 정밀 조제",
      "0.22㎛ 제균 필터 여과",
      "바이알/병 충진 및 크림핑",
      "고압 증기 멸균 (121℃)",
      "초고속 비전 외관 검사기",
      "카톤 입갑 및 완제품 포장",
    ],
    filtrationAnalysis:
      "GMP 기준에 따른 0.22㎛ 멸균 멤브레인 필터 및 316L 위생 배관 적용.",
    cleaningAnalysis:
      "초순수(WFI) 및 제균 에어를 통한 6단계 초음파 세병 공정.",
    criticalControlPoint:
      "고압 증기 멸균 사이클(CCP-1B) 및 전수 고속 비전 이물 검사.",
  },
  {
    id: "oem-kyungbuk",
    name: "경북과학대학 식품공장",
    type: "oem",
    teamOrCategory: "전통음료·발효식품",
    description: "산학협력 전통 발효식품 및 전통 음료, 식초, 농축액 라인",
    processFlow:
      "전통 원료 입고 및 전처리 → 장기 발효 및 숙성 → 규조토 정밀 여과 → 저온 순간살균 → 유리병/내열PET 충진 → 캡핑 → 온수 샤워 살균 → 라벨 부착 및 수작업 검수 포장",
    processSteps: [
      "전통 원료 입고 및 전처리",
      "발효 및 숙성 공정",
      "규조토 정밀 여과",
      "저온 순간 살균",
      "유리병/PET 충진 및 캡핑",
      "온수 샤워 후살균",
      "라벨링 및 검수 포장",
    ],
    filtrationAnalysis:
      "규조토 여과기 및 120 Mesh 마이크로 스트레이너 여과.",
    cleaningAnalysis:
      "세병기 온수 린싱 및 캡 자외선(UV) 소독.",
    criticalControlPoint:
      "살균 온도 모니터링 및 육안 전수 검사.",
  },
  {
    id: "oem-taewoong",
    name: "태웅식품",
    type: "oem",
    teamOrCategory: "홍삼·인삼 드링크",
    description: "홍삼, 인삼 음료, 파우치 및 건강 드링크 OEM 전문",
    processFlow:
      "인삼/홍삼 저온 추출 → 추출액 농축 및 원액 배합 → 150 Mesh 여과망 통과 → 121℃ 레토르트 살균 → 파우치/병 자동 충진 → 캡핑 → 엑스레이 검사기 → 선물세트 포장",
    processSteps: [
      "홍삼/인삼 저온 추출",
      "농축 및 원액 배합",
      "150 Mesh 정밀 여과 및 탈포",
      "레토르트 살균 (121℃)",
      "파우치/병 충진 및 캡핑",
      "X-ray 이물 검사기 통과",
      "선물세트 및 완제품 포장",
    ],
    filtrationAnalysis:
      "추출액 150 Mesh 정밀 여과 및 10,000 Gauss 희토류 봉자석을 통한 금속성 이물 원천 제거.",
    cleaningAnalysis:
      "고압 온수 세척 및 에어 제진 공정 적용.",
    criticalControlPoint:
      "레토르트 살균 F0값 제어(CCP-1B) 및 엑스레이 이물 검출기(CCP-2P).",
  },
];

const CUSTOM_FACTORIES_STORAGE_KEY = "food_qc_custom_factory_process_presets_v1";

/**
 * 로컬스토리지에 저장된 제조공정 프리셋 전체 목록 불러오기
 */
export function loadAllFactoryPresets(): FactoryProcessPreset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_FACTORIES_STORAGE_KEY);
    if (!raw) {
      // 최초 실행 시 기본 프리셋 세팅
      localStorage.setItem(CUSTOM_FACTORIES_STORAGE_KEY, JSON.stringify(FACTORY_PROCESS_PRESETS));
      return [...FACTORY_PROCESS_PRESETS];
    }
    const parsed: FactoryProcessPreset[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(CUSTOM_FACTORIES_STORAGE_KEY, JSON.stringify(FACTORY_PROCESS_PRESETS));
      return [...FACTORY_PROCESS_PRESETS];
    }
    return parsed;
  } catch {
    return [...FACTORY_PROCESS_PRESETS];
  }
}

/**
 * 제조공정 프리셋 전체 목록 저장 및 변경 이벤트 알림
 */
export function saveAllFactoryPresets(presets: FactoryProcessPreset[]): void {
  try {
    localStorage.setItem(CUSTOM_FACTORIES_STORAGE_KEY, JSON.stringify(presets));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("factoryPresetsChanged", { detail: presets }));
    }
  } catch (e) {
    console.error("Failed to save factory presets to localStorage", e);
  }
}

/**
 * 특정 제조공정 프리셋 저장 (수정 또는 신규 추가)
 */
export function saveFactoryPreset(preset: FactoryProcessPreset): FactoryProcessPreset[] {
  const all = loadAllFactoryPresets();
  const existingIdx = all.findIndex((p) => p.id === preset.id);
  if (existingIdx >= 0) {
    all[existingIdx] = { ...preset, isCustom: true };
  } else {
    all.push({ ...preset, isCustom: true });
  }
  saveAllFactoryPresets(all);
  return all;
}

/**
 * 특정 제조공정 프리셋 삭제
 */
export function deleteFactoryPreset(presetId: string): FactoryProcessPreset[] {
  const all = loadAllFactoryPresets();
  const filtered = all.filter((p) => p.id !== presetId);
  saveAllFactoryPresets(filtered);
  return filtered;
}

/**
 * 기본 프리셋으로 완전 초기화
 */
export function resetFactoryPresets(): FactoryProcessPreset[] {
  const fresh = [...FACTORY_PROCESS_PRESETS];
  saveAllFactoryPresets(fresh);
  return fresh;
}

/**
 * 제조처명 매칭 (이름으로 프리셋 찾기)
 */
export function findFactoryPresetByName(name: string): FactoryProcessPreset | undefined {
  if (!name) return undefined;
  const all = loadAllFactoryPresets();
  const trimmed = name.trim();
  // 정확 일치
  const exact = all.find((p) => p.name === trimmed);
  if (exact) return exact;
  // 부분 일치
  return all.find((p) => trimmed.includes(p.name) || p.name.includes(trimmed));
}
