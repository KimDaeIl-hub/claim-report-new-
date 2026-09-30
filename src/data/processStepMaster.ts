import { ProcessStepMaster } from "../types";
import { FactoryProcessPreset, loadAllFactoryPresets } from "./factoryProcessPresets";

export const PROCESS_STEP_MASTER_STORAGE_KEY = "kwangdong_process_step_master_v1";

/**
 * [표준 제조공정 개별 공정 단위 Master 초기 데이터]
 * 각 공정별 개별 고유 ID, 설비, 관리항목, CCP 여부, 품질 리스크, 이상 유형을 완벽하게 구조화
 */
export const DEFAULT_PROCESS_STEPS: ProcessStepMaster[] = [
  // =========================================================================
  // [1] 광동제약 평택공장 식품팀 (유리병 혼합음료 / 비타500 라인)
  // =========================================================================
  {
    id: "step-food-01",
    presetId: "internal-food",
    manufacturerId: "mfg-kd-pyeongtaek",
    manufacturer: "광동제약 평택공장",
    manufactureLineId: "line-kd-pt-01",
    manufactureLine: "1호 라인(유리병 충전)",
    stepNumber: 1,
    processName: "원료 입고 및 칭량",
    description: "입고된 주원료(비타민C, 타우린, 부형제 등)의 시험성적서(CoA) 적합 확인 및 클린부스 내 정밀 칭량",
    keyEquipment: "클린 칭량 부스, 정밀 전자저울(0.01g 단위), 원료 보관 랙",
    controlPoints: "원료 로트 번호 일치, 칭량 오차율 ±0.1% 이내, 칭량실 온습도 관리(25℃ 이하, RH 50% 이하)",
    rawMaterials: "비타민C, 비타민B2, 타우린, 액상과당, 정제수, 구연산",
    isCCP: false,
    qualityRisks: "원료 오투입, 계량 편차로 인한 규격 미달, 원료 개봉 시 외래 포장재 이물 혼입",
    possibleDefects: ["성분 함량 미달/초과", "맛/색상 이상", "원료 유래 이물"],
    isActive: true,
  },
  {
    id: "step-food-02",
    presetId: "internal-food",
    manufacturerId: "mfg-kd-pyeongtaek",
    manufacturer: "광동제약 평택공장",
    manufactureLineId: "line-kd-pt-01",
    manufactureLine: "1호 라인(유리병 충전)",
    stepNumber: 2,
    processName: "추출 및 배합액 조제",
    description: "정제수에 주원료 및 부원료를 순차 투입하여 완전 용해 및 균질 교반 배합액 조제",
    keyEquipment: "SUS316L 배합탱크 (5,000L), 고속 아지테이터 교반기, 열교환 재킷",
    controlPoints: "Brix 당도(±0.2°Bx), pH(3.2±0.2), 교반 속도 및 교반 시간(40분 이상 전수 균질화)",
    rawMaterials: "정제수, 주배합 원료",
    isCCP: false,
    qualityRisks: "원료 미용해 침전, 불완전 교반으로 인한 로트 내 농도 편차, 배합탱크 잔류 세척수 혼입",
    possibleDefects: ["침전물/혼탁", "맛/산미 편차", "Brix 규격 이탈"],
    isActive: true,
  },
  {
    id: "step-food-03",
    presetId: "internal-food",
    manufacturerId: "mfg-kd-pyeongtaek",
    manufacturer: "광동제약 평택공장",
    manufactureLineId: "line-kd-pt-01",
    manufactureLine: "1호 라인(유리병 충전)",
    stepNumber: 3,
    processName: "150 Mesh(105㎛) 마이크로 여과",
    description: "배합액 이송 배관에 설치된 2중 듀플렉스 스트레이너와 마이크로 카트리지 필터로 미세 이물 원천 여과",
    keyEquipment: "SUS316L 듀플렉스 스트레이너 (150 Mesh, 105㎛), 백 필터 하우징, 차압 게이지",
    controlPoints: "여과 차압 1.0 kgf/㎠ 이하 유지, 매 로트 작업 전후 망 파손·변형 유무 현미경 점검",
    rawMaterials: "조제 완료된 배합액",
    isCCP: false,
    qualityRisks: "여과망 고압 파손으로 인한 이물 여과 실패, 필터 체결 틈새 누설",
    possibleDefects: ["이물 혼입", "미용해 입자 통과", "침전물/혼탁"],
    isActive: true,
  },
  {
    id: "step-food-04",
    presetId: "internal-food",
    manufacturerId: "mfg-kd-pyeongtaek",
    manufacturer: "광동제약 평택공장",
    manufactureLineId: "line-kd-pt-01",
    manufactureLine: "1호 라인(유리병 충전)",
    stepNumber: 4,
    processName: "UHT 초고온 순간살균",
    description: "플레이트 열교환기를 통하여 배합액을 135℃에서 30초간 초고온 순간 가열 살균하여 유해요해 미생물 완전 사멸",
    keyEquipment: "UHT 플레이트 살균기, 자동 온도 조절 밸브, 멸균 홀딩 튜브, 디지털 차트 레코더",
    controlPoints: "살균 온도 135±2℃ 유지, 살균 유지 시간 30초 이상, 살균 압력 차압 양압 유지",
    rawMaterials: "여과 배합액",
    isCCP: true,
    ccpNumber: "CCP-1B",
    qualityRisks: "살균 온도 저하 시 미생물 사멸 실패로 인한 유통 중 변질·팽창, 과열 시 비타민C 열파괴 및 탄화",
    possibleDefects: ["변질/산패", "가스 팽창", "탄화 입자 발생", "갈변"],
    isActive: true,
  },
  {
    id: "step-food-05",
    presetId: "internal-food",
    manufacturerId: "mfg-kd-pyeongtaek",
    manufacturer: "광동제약 평택공장",
    manufactureLineId: "line-kd-pt-01",
    manufactureLine: "1호 라인(유리병 충전)",
    stepNumber: 5,
    processName: "85℃ 고온 온수 세척 린싱",
    description: "유리병 투입 후 180도 반전 상태에서 85℃ 이상 고온 탈이온수 제트 린싱 및 청정 에어 블로우로 내부 세척",
    keyEquipment: "로터리 연속 반전 세병기 (Inverter Rinser), 고압 온수 노즐, HEPA 청정 에어 제트",
    controlPoints: "세척 온수 온도 85℃ 이상, 세척수 분사 압력 3.5 bar 이상, 노즐 막힘 전수 감지 센서",
    rawMaterials: "갈색 약품용/음료용 유리병 100ml, 청정 세척수",
    isCCP: false,
    qualityRisks: "공병 내부 유리 미세 파편 잔류, 세척수 분사 압력 부족으로 분진 미제거",
    possibleDefects: ["유리 파손/이물", "유리 미세 파편", "용기 내부 잔류물"],
    isActive: true,
  },
  {
    id: "step-food-06",
    presetId: "internal-food",
    manufacturerId: "mfg-kd-pyeongtaek",
    manufacturer: "광동제약 평택공장",
    manufactureLineId: "line-kd-pt-01",
    manufactureLine: "1호 라인(유리병 충전)",
    stepNumber: 6,
    processName: "충진 및 밀봉 (캡핑)",
    description: "청정 챔버 내에서 정량 충전 밸브를 통한 핫필링 충진 직후 알루미늄 ROPP 캡 자동 롤링 밀봉",
    keyEquipment: "로터리 양압 충전기 (Gravity Filler), ROPP 캡핑 헤드(롤러 4조), 자동 캡 피더",
    controlPoints: "충진량 100±2ml, 충진 온도 85±3℃, 캡핑 토크 12~16 kgf·cm, 캡 롤링 림 깊이 1.2±0.1mm",
    rawMaterials: "알루미늄 ROPP 캡 28mm, 세척 완료된 유리병",
    isCCP: false,
    qualityRisks: "캡핑 토크 미달 시 완제품 누액 및 외부 공기 흡입 변질, 캡퍼 롤러 마모 시 캡 스크래치/탄화물 발생",
    possibleDefects: ["캡 흠집/탄화", "누액", "내용량 부족", "변질/산패"],
    isActive: true,
  },
  {
    id: "step-food-07",
    presetId: "internal-food",
    manufacturerId: "mfg-kd-pyeongtaek",
    manufacturer: "광동제약 평택공장",
    manufactureLineId: "line-kd-pt-01",
    manufactureLine: "1호 라인(유리병 충전)",
    stepNumber: 7,
    processName: "비전 검사 및 금속검출기",
    description: "인라인 고속 비전 카메라로 액위·캡 체결·바닥 이물 검사 후 금속검출기 터널 전수 통과",
    keyEquipment: "FBI 바닥 이물 광학 검사기, 액위 비전 센서, 인라인 고감도 금속검출기, 에어 리젝트 취출기",
    controlPoints: "금속검출기 감도 점검(Fe 1.5mm, Sus 2.0mm 2시간 주기), 불량품 자동 배출(Air Reject) 동작 확인",
    rawMaterials: "밀봉 완료된 병 음료",
    isCCP: true,
    ccpNumber: "CCP-2P",
    qualityRisks: "금속 파편 혼입 유출, 액위 미달품 미검출 출하, 캡 찌그러짐 미검출",
    possibleDefects: ["금속 이물", "내용량 부족", "캡 흠집/변형"],
    isActive: true,
  },
  {
    id: "step-food-08",
    presetId: "internal-food",
    manufacturerId: "mfg-kd-pyeongtaek",
    manufacturer: "광동제약 평택공장",
    manufactureLineId: "line-kd-pt-01",
    manufactureLine: "1호 라인(유리병 충전)",
    stepNumber: 8,
    processName: "후살균 및 냉각 샤워",
    description: "밀봉된 유리병의 캡 내부 스팀 멸균 및 단계별 온수-냉수 샤워 쿨러 터널 통과 급랭",
    keyEquipment: "샤워식 터널 워머/쿨러 (Tunnel Pasteurized Cooler), 순환수 펌프",
    controlPoints: "살균 온도 65±2℃(15분), 출구 냉각 온도 35℃ 이하(유리병 열충격 파손 방지 4단계 구역 감온)",
    rawMaterials: "순환 냉각수",
    isCCP: false,
    qualityRisks: "급격한 온도차로 인한 유리병 크랙 파손, 냉각 부족으로 인한 병 표면 결로 및 라벨 접착 불량",
    possibleDefects: ["유리 파손/이물", "미세 크랙", "라벨 들뜸"],
    isActive: true,
  },
  {
    id: "step-food-09",
    presetId: "internal-food",
    manufacturerId: "mfg-kd-pyeongtaek",
    manufacturer: "광동제약 평택공장",
    manufactureLineId: "line-kd-pt-01",
    manufactureLine: "1호 라인(유리병 충전)",
    stepNumber: 9,
    processName: "라벨링 및 완제품 포장",
    description: "유리병 외면 건조 후 몸체 롤 라벨 부착, 제조번호/소비기한 잉크젯 날인 후 10입 소박스 및 외박스 포장",
    keyEquipment: "로터리 핫멜트 라벨러, 연속 잉크젯 마킹기(CIJ), 오토 카토너, 중량선별기(Checkweigher)",
    controlPoints: "라벨 부착 높이 오차 ±1mm, 잉크젯 인자 선명도(OCR 비전 판독), 10입 박스 전수 중량 체커",
    rawMaterials: "롤 라벨, 10병 지함, 완제품 골판지 외박스, 핫멜트 글루",
    isCCP: false,
    qualityRisks: "유통기한 인자 누락/번짐, 라벨 틀어짐, 완제품 수량 누락(9병 입고 등)",
    possibleDefects: ["표시 오류(인자 불량)", "라벨 찢어짐/들뜸", "수량 부족"],
    isActive: true,
  },

  // =========================================================================
  // [2] 삼양패키징 광혜원공장 (Aseptic 무균 충전 PET 라인)
  // =========================================================================
  {
    id: "step-samyang-01",
    presetId: "oem-samyang",
    manufacturerId: "mfg-samyang-gwanghyewon",
    manufacturer: "삼양패키징 광혜원공장",
    manufactureLineId: "line-samyang-01",
    manufactureLine: "Aseptic 2호기(무균 PET 라인)",
    stepNumber: 1,
    processName: "원료 추출 및 정밀 배합",
    description: "국산 옥수수 및 볶은 옥수수수염 원료 고온 순환 열수 추출 및 농축액 정밀 배합",
    keyEquipment: "밀폐형 순환 추출기, 연속 원심분리기, 배합탱크",
    controlPoints: "추출 온도 92±2℃, 추출 시간, Brix 당도, 탁도(Turbidity)",
    rawMaterials: "옥수수 추출액, 옥수수수염 농축액, 정제수, L-아스코르브산나트륨",
    isCCP: false,
    qualityRisks: "원료 탄화 추출로 인한 탄내 발생, 천연 침전물 과다 발생",
    possibleDefects: ["침전물/혼탁", "맛/향 이상"],
    isActive: true,
  },
  {
    id: "step-samyang-02",
    presetId: "oem-samyang",
    manufacturerId: "mfg-samyang-gwanghyewon",
    manufacturer: "삼양패키징 광혜원공장",
    manufactureLineId: "line-samyang-01",
    manufactureLine: "Aseptic 2호기(무균 PET 라인)",
    stepNumber: 2,
    processName: "2중 세디먼트 및 0.45㎛ 멤브레인 정밀 여과",
    description: "추출액 고형분 분리 후 0.45㎛ 폴리프로필렌 멤브레인 필터를 2단계 통과하여 미세 불용성 입자 제거",
    keyEquipment: "원심 디스크 분리기, 2단 카트리지 멤브레인 필터 하우징 (0.45㎛)",
    controlPoints: "필터 입출구 차압 모니터링, 완전성 시험(Bubble Point Test)",
    rawMaterials: "추출 배합액",
    isCCP: false,
    qualityRisks: "필터 막힘으로 인한 유량 저하 및 멤브레인 파열로 인한 미세 침전 통과",
    possibleDefects: ["침전물/혼탁", "천연 침전물 발생"],
    isActive: true,
  },
  {
    id: "step-samyang-03",
    presetId: "oem-samyang",
    manufacturerId: "mfg-samyang-gwanghyewon",
    manufacturer: "삼양패키징 광혜원공장",
    manufactureLineId: "line-samyang-01",
    manufactureLine: "Aseptic 2호기(무균 PET 라인)",
    stepNumber: 3,
    processName: "UHT 멸균 (138℃)",
    description: "무균 챔버 충진 직전 138℃에서 4초간 초고온 UHT 멸균 후 무균 냉각기로 급랭",
    keyEquipment: "튜브식 초고온 UHT 멸균 시스템, 무균 완충 탱크(Aseptic Surge Tank)",
    controlPoints: "살균 온도 138±1℃ 유지, 살균 홀딩 타임 4초, 무균 챔버 양압 50 Pa 유지",
    rawMaterials: "여과 완료액",
    isCCP: true,
    ccpNumber: "CCP-1B",
    qualityRisks: "멸균 온도 이탈 시 내열성 아포균 잔존으로 상온 유통 중 변질 부패",
    possibleDefects: ["변질/산패", "미생물 증식", "탁도 상승"],
    isActive: true,
  },
  {
    id: "step-samyang-04",
    presetId: "oem-samyang",
    manufacturerId: "mfg-samyang-gwanghyewon",
    manufacturer: "삼양패키징 광혜원공장",
    manufactureLineId: "line-samyang-01",
    manufactureLine: "Aseptic 2호기(무균 PET 라인)",
    stepNumber: 4,
    processName: "용기 H2O2 과산화수소 멸균 및 건조",
    description: "PET 프리폼 블로잉 직후 병 내부 과산화수소(H2O2) 가스 멸균 및 무균 열풍 건조",
    keyEquipment: "Aseptic 병 멸균 챔버, H2O2 기화기, 무균 열풍 건조 블로워",
    controlPoints: "H2O2 농도 35%, 멸균 온도 65℃, 잔류 과산화수소 농도 0.5 ppm 이하(불검출)",
    rawMaterials: "과산화수소수, PET 프리폼",
    isCCP: true,
    ccpNumber: "CCP-2B",
    qualityRisks: "과산화수소 린싱 부족 시 화학적 잔류물 냄새 발생, 멸균 부족 시 용기 미생물 오염",
    possibleDefects: ["화학적 이취", "변질/산패"],
    isActive: true,
  },
  {
    id: "step-samyang-05",
    presetId: "oem-samyang",
    manufacturerId: "mfg-samyang-gwanghyewon",
    manufacturer: "삼양패키징 광혜원공장",
    manufactureLineId: "line-samyang-01",
    manufactureLine: "Aseptic 2호기(무균 PET 라인)",
    stepNumber: 5,
    processName: "상온 무균 충진 및 밀봉 (Aseptic Filling)",
    description: "클래스 100 무균실 내부에서 상온(20℃) 무균 충진 후 멸균 캡 체결",
    keyEquipment: "Aseptic 아이솔레이터 충전기, 무균 마그네틱 서보 캡퍼",
    controlPoints: "충전량 500±5ml, 캡핑 토크 14~18 kgf·cm, 무균 챔버 미생물 공기 모니터링(낙하균 0)",
    rawMaterials: "멸균 플라스틱 스크류 캡 28mm, 무균 음료액",
    isCCP: false,
    qualityRisks: "캡핑 토크 부족으로 인한 미세 공기 누설 및 외부 곰팡이 유입",
    possibleDefects: ["캡 밀봉 불량", "변질/산패", "용기 변형"],
    isActive: true,
  },
  {
    id: "step-samyang-06",
    presetId: "oem-samyang",
    manufacturerId: "mfg-samyang-gwanghyewon",
    manufacturer: "삼양패키징 광혜원공장",
    manufactureLineId: "line-samyang-01",
    manufactureLine: "Aseptic 2호기(무균 PET 라인)",
    stepNumber: 6,
    processName: "진공 검사 및 라벨링 포장",
    description: "음압 레이저 진공 체커를 통한 누설 전수 검사, 수축 라벨 슬리빙 및 로봇 팔레타이징",
    keyEquipment: "초음파 액위 체커, 음압 누설 테스터, 스팀 수축 라벨 터널, 자동 박스 패커",
    controlPoints: "내부 압력 모니터링, 라벨 비전 검사, 24입 박스 테이핑 인장력",
    rawMaterials: "수축 라벨, 24입 골판지 박스",
    isCCP: false,
    qualityRisks: "미세 리크 불량 누출, 라벨 수축 불량으로 인한 주름 발생",
    possibleDefects: ["누액", "라벨 불량", "캡 헛돎"],
    isActive: true,
  },

  // =========================================================================
  // [3] 광동제약 평택공장 - A Line (표준 9단계 공정: 원료 투입 ~ 포장)
  // =========================================================================
  {
    id: "step-aline-01",
    presetId: "line-kd-pt-01",
    manufacturerId: "mfg-kd-pyeongtaek",
    manufacturer: "광동제약 평택공장",
    manufactureLineId: "line-kd-pt-01",
    manufactureLine: "A Line",
    stepNumber: 1,
    processName: "원료 투입",
    description: "원료 시험성적서(CoA) 적합 확인 및 클린부스 내 계량 원료의 배합 탱크 투입",
    keyEquipment: "클린 칭량 부스, 원료 투입 호퍼, 정밀 전자저울",
    controlPoints: "원료 로트 번호 일치, 칭량 오차율 ±0.1% 이내, 포장재 파손 및 외래 이물 확인",
    rawMaterials: "비타민C, 타우린, 부형제, 정제수",
    isCCP: false,
    qualityRisks: "원료 오투입, 계량 오차, 포장재 개봉 시 외래 이물 혼입",
    possibleDefects: ["성분 함량 미달", "외래 이물"],
    isActive: true,
  },
  {
    id: "step-aline-02",
    presetId: "line-kd-pt-01",
    manufacturerId: "mfg-kd-pyeongtaek",
    manufacturer: "광동제약 평택공장",
    manufactureLineId: "line-kd-pt-01",
    manufactureLine: "A Line",
    stepNumber: 2,
    processName: "배합",
    description: "정제수와 투입 원료의 완전 용해 및 고속 교반을 통한 균질 배합액 조제",
    keyEquipment: "SUS316L 배합탱크 (5,000L), 고속 아지테이터 교반기",
    controlPoints: "Brix 당도(±0.2°Bx), pH(3.2±0.2), 교반 시간(40분 이상) 및 온도",
    rawMaterials: "정제수, 주원료 배합액",
    isCCP: false,
    qualityRisks: "원료 미용해 침전, 불완전 교반으로 인한 로트 내 농도 편차",
    possibleDefects: ["침전물/혼탁", "맛/산미 편차"],
    isActive: true,
  },
  {
    id: "step-aline-03",
    presetId: "line-kd-pt-01",
    manufacturerId: "mfg-kd-pyeongtaek",
    manufacturer: "광동제약 평택공장",
    manufactureLineId: "line-kd-pt-01",
    manufactureLine: "A Line",
    stepNumber: 3,
    processName: "여과",
    description: "150 Mesh(105㎛) 듀플렉스 정밀 스트레이너를 통과하여 미세 이물 및 미용해 입자 원천 차단",
    keyEquipment: "SUS316L 듀플렉스 스트레이너 (150 Mesh), 차압 게이지",
    controlPoints: "여과 차압 1.0 kgf/㎠ 이하, 작업 전후 여과망 파손 유무 현미경 점검",
    rawMaterials: "조제 배합액",
    isCCP: false,
    qualityRisks: "여과망 고압 파손으로 인한 이물 통과",
    possibleDefects: ["이물 혼입", "침전물/혼탁"],
    isActive: true,
  },
  {
    id: "step-aline-04",
    presetId: "line-kd-pt-01",
    manufacturerId: "mfg-kd-pyeongtaek",
    manufacturer: "광동제약 평택공장",
    manufactureLineId: "line-kd-pt-01",
    manufactureLine: "A Line",
    stepNumber: 4,
    processName: "UHT",
    description: "플레이트 열교환기를 통하여 135℃에서 30초간 초고온 순간 가열 살균",
    keyEquipment: "초고온 순간 UHT 살균기, 자동 차트 레코더, 홀딩 튜브",
    controlPoints: "살균 온도 135±2℃ 유지, 유지 시간 30초 이상 (자동 리턴 밸브 연동)",
    rawMaterials: "여과 배합액",
    isCCP: true,
    ccpNumber: "CCP-1B",
    qualityRisks: "살균 온도 저하 시 미생물 증식 및 변질, 과열 시 유효성분 열파괴",
    possibleDefects: ["변질/산패", "가스 팽창", "탄화 입자"],
    isActive: true,
  },
  {
    id: "step-aline-05",
    presetId: "line-kd-pt-01",
    manufacturerId: "mfg-kd-pyeongtaek",
    manufacturer: "광동제약 평택공장",
    manufactureLineId: "line-kd-pt-01",
    manufactureLine: "A Line",
    stepNumber: 5,
    processName: "저장",
    description: "살균 완료된 액상의 무균 완충 저장 탱크(Aseptic Buffer Tank) 일시 보관",
    keyEquipment: "SUS316L 무균 완충 저장 탱크, 0.2㎛ 멸균 에어 벤트 필터",
    controlPoints: "탱크 내부 양압 유지, 저장 온도 모니터링",
    rawMaterials: "살균 완료액",
    isCCP: false,
    qualityRisks: "에어 벤트 필터 파손 시 외부 미생물 오염",
    possibleDefects: ["변질/산패", "오염"],
    isActive: true,
  },
  {
    id: "step-aline-06",
    presetId: "line-kd-pt-01",
    manufacturerId: "mfg-kd-pyeongtaek",
    manufacturer: "광동제약 평택공장",
    manufactureLineId: "line-kd-pt-01",
    manufactureLine: "A Line",
    stepNumber: 6,
    processName: "충전",
    description: "세척 완료된 유리병에 정량 충전 노즐을 통한 양압 청정 충전",
    keyEquipment: "로터리 양압 자동 충전기, 정량 충전 밸브",
    controlPoints: "충전량 100±2ml, 충전 온도 85±3℃, 노즐 막힘 전수 감지",
    rawMaterials: "세척 유리병, 음료액",
    isCCP: false,
    qualityRisks: "충전 노즐 패킹 마모 이물 혼입, 충전량 편차",
    possibleDefects: ["내용량 부족", "노즐 이물"],
    isActive: true,
  },
  {
    id: "step-aline-07",
    presetId: "line-kd-pt-01",
    manufacturerId: "mfg-kd-pyeongtaek",
    manufacturer: "광동제약 평택공장",
    manufactureLineId: "line-kd-pt-01",
    manufactureLine: "A Line",
    stepNumber: 7,
    processName: "캡핑",
    description: "알루미늄 ROPP 캡 자동 공급 및 롤러에 의한 정밀 나사선 밀봉 체결",
    keyEquipment: "ROPP 4조 롤러 캡핑 헤드, 캡 피더 슛",
    controlPoints: "캡핑 토크 12~16 kgf·cm, 롤링 림 깊이 1.2±0.1mm, 캡 외관 스크래치 점검",
    rawMaterials: "알루미늄 ROPP 캡",
    isCCP: false,
    qualityRisks: "캡핑 토크 부족으로 인한 누액 및 변질, 롤러 마모로 인한 캡 스크래치/탄화물",
    possibleDefects: ["캡 흠집/탄화", "누액", "변질/산패"],
    isActive: true,
  },
  {
    id: "step-aline-08",
    presetId: "line-kd-pt-01",
    manufacturerId: "mfg-kd-pyeongtaek",
    manufacturer: "광동제약 평택공장",
    manufactureLineId: "line-kd-pt-01",
    manufactureLine: "A Line",
    stepNumber: 8,
    processName: "후살균",
    description: "캡핑 완료된 병의 캡 내부 스팀 멸균 및 터널 워머/샤워 쿨러 단계별 급랭",
    keyEquipment: "터널식 온수 샤워 살균기 및 4단 감온 냉각 쿨러",
    controlPoints: "살균 온도 65±2℃(15분), 출구 냉각 온도 35℃ 이하",
    rawMaterials: "순환 살균/냉각수",
    isCCP: false,
    qualityRisks: "급격한 온도차로 인한 유리병 크랙 파손, 냉각 부족 결로",
    possibleDefects: ["유리 파손/이물", "미세 크랙"],
    isActive: true,
  },
  {
    id: "step-aline-09",
    presetId: "line-kd-pt-01",
    manufacturerId: "mfg-kd-pyeongtaek",
    manufacturer: "광동제약 평택공장",
    manufactureLineId: "line-kd-pt-01",
    manufactureLine: "A Line",
    stepNumber: 9,
    processName: "포장",
    description: "라벨 부착, 소비기한 잉크젯 날인, 중량 검사 및 10입 소박스/골판지 외박스 자동 포장",
    keyEquipment: "로터리 라벨러, 연속 잉크젯 마킹기(CIJ), 중량선별기, 오토 카토너",
    controlPoints: "라벨 부착 위치(오차 ±1mm), 잉크젯 소비기한 인자 선명도, 전수 중량 체커",
    rawMaterials: "롤 라벨, 10병 지함, 골판지 박스",
    isCCP: false,
    qualityRisks: "유통기한 인자 누락/번짐, 라벨 들뜸, 수량 부족",
    possibleDefects: ["표시 오류(인자 불량)", "라벨 불량", "수량 부족"],
    isActive: true,
  },
];

// =========================================================================
// [CRUD & 로컬스토리지 관리 함수]
// =========================================================================

/**
 * 모든 구조화 공정 단위 불러오기 (localStorage 저장분 + 초기 데이터 병합)
 */
export function loadAllProcessSteps(): ProcessStepMaster[] {
  try {
    const raw = localStorage.getItem(PROCESS_STEP_MASTER_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        PROCESS_STEP_MASTER_STORAGE_KEY,
        JSON.stringify(DEFAULT_PROCESS_STEPS)
      );
      return DEFAULT_PROCESS_STEPS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Merge missing default steps if not already in parsed
      const existingIds = new Set(parsed.map((s: any) => s.id));
      const missingDefaults = DEFAULT_PROCESS_STEPS.filter((s) => !existingIds.has(s.id));
      if (missingDefaults.length > 0) {
        const merged = [...parsed, ...missingDefaults];
        localStorage.setItem(PROCESS_STEP_MASTER_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
      return parsed;
    }
    return DEFAULT_PROCESS_STEPS;
  } catch (e) {
    console.error("Failed to load process steps from localStorage", e);
    return DEFAULT_PROCESS_STEPS;
  }
}

/**
 * 전체 구조화 공정 단위 저장하기
 */
export function saveAllProcessSteps(steps: ProcessStepMaster[]): void {
  try {
    localStorage.setItem(PROCESS_STEP_MASTER_STORAGE_KEY, JSON.stringify(steps));
  } catch (e) {
    console.error("Failed to save process steps to localStorage", e);
  }
}

/**
 * 단일 공정 단계 추가 또는 수정
 */
export function saveProcessStep(step: ProcessStepMaster): ProcessStepMaster[] {
  const current = loadAllProcessSteps();
  const index = current.findIndex((s) => s.id === step.id);
  const now = new Date().toISOString().split("T")[0];

  let updated: ProcessStepMaster[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = {
      ...step,
      updatedAt: now,
    };
  } else {
    updated = [
      {
        ...step,
        createdAt: now,
        updatedAt: now,
      },
      ...current,
    ];
  }

  saveAllProcessSteps(updated);
  return updated;
}

/**
 * 공정 단계 사용/미사용 토글
 */
export function toggleProcessStepActive(stepId: string): ProcessStepMaster[] {
  const current = loadAllProcessSteps();
  const updated = current.map((s) => {
    if (s.id === stepId) {
      return {
        ...s,
        isActive: !s.isActive,
        updatedAt: new Date().toISOString().split("T")[0],
      };
    }
    return s;
  });
  saveAllProcessSteps(updated);
  return updated;
}

/**
 * 공정 단계 삭제
 */
export function deleteProcessStep(stepId: string): ProcessStepMaster[] {
  const current = loadAllProcessSteps();
  const target = current.find((s) => s.id === stepId);

  let updated: ProcessStepMaster[];
  if (target?.isCustom) {
    updated = current.filter((s) => s.id !== stepId);
  } else {
    updated = current.map((s) => (s.id === stepId ? { ...s, isActive: false } : s));
  }

  saveAllProcessSteps(updated);
  return updated;
}

/**
 * 특정 공정도 템플릿(Preset ID)에 속한 구조화 공정 목록 조회
 * (저장된 데이터가 없으면 프리셋의 processSteps 텍스트로부터 지능형 기본 구조화 단계 자동 생성)
 */
export function getProcessStepsByPreset(preset: FactoryProcessPreset): ProcessStepMaster[] {
  const all = loadAllProcessSteps();
  const filtered = all.filter((s) => s.presetId === preset.id);

  if (filtered.length > 0) {
    return filtered.sort((a, b) => a.stepNumber - b.stepNumber);
  }

  // 지능형 자동 구조화 생성 (기존 사용자의 재입력 불필요)
  return synthesizeStepsFromPreset(preset);
}

/**
 * 특정 공정 ID로 단일 공정 조회
 */
export function findProcessStepById(stepId?: string): ProcessStepMaster | undefined {
  if (!stepId) return undefined;
  const list = loadAllProcessSteps();
  return list.find((s) => s.id === stepId);
}

/**
 * 기존 공정도 템플릿(processSteps 문자열 배열)으로부터 구조화된 공정 단계 자동 합성
 * (사용자가 다시 입력하지 않아도 모든 공정도가 즉시 100% 구조화 데이터로 변환됨)
 */
export function synthesizeStepsFromPreset(preset: FactoryProcessPreset): ProcessStepMaster[] {
  const rawSteps =
    preset.processSteps && preset.processSteps.length > 0
      ? preset.processSteps
      : preset.processFlow
      ? preset.processFlow.split(/→|->/).map((s) => s.trim()).filter(Boolean)
      : [preset.name];

  const mfgName = preset.name || "자사/협력 공장";
  const lineName = preset.teamOrCategory || "표준 생산라인";

  return rawSteps.map((stepText, idx) => {
    const stepNumber = idx + 1;
    const stepId = `step-${preset.id}-${String(stepNumber).padStart(2, "0")}`;
    const nameLower = stepText.toLowerCase();

    // 지능형 공정 속성 추론
    let keyEquipment = "공정 표준 자동화 설비";
    let controlPoints = "표준 공정 작업 기준서(SOP) 준수";
    let isCCP = false;
    let ccpNumber = undefined;
    let qualityRisks = "작업 기준 미준수 및 설비 편차";
    let possibleDefects: string[] = ["품질 이상"];
    let rawMaterials = undefined;

    if (nameLower.includes("원료") || nameLower.includes("칭량") || nameLower.includes("입고")) {
      keyEquipment = "클린 칭량 부스, 정밀 전자저울";
      controlPoints = "원료 CoA 적합 확인, 칭량 오차율 ±0.1% 이내";
      qualityRisks = "원료 오투입, 계량 오차";
      possibleDefects = ["성분 함량 미달", "맛/색상 이상"];
      rawMaterials = "주원료, 부원료, 용수";
    } else if (nameLower.includes("배합") || nameLower.includes("조제") || nameLower.includes("추출")) {
      keyEquipment = "SUS316L 배합탱크, 고속 교반기, 열교환기";
      controlPoints = "Brix 당도, pH, 교반 시간 및 온도";
      qualityRisks = "미용해 침전, 불완전 교반 농도 편차";
      possibleDefects = ["침전물/혼탁", "맛/산미 편차"];
      rawMaterials = "배합 원료, 정제수";
    } else if (nameLower.includes("여과") || nameLower.includes("mesh") || nameLower.includes("체망")) {
      keyEquipment = "정밀 마이크로 스트레이너, 카트리지 필터";
      controlPoints = "여과 차압 모니터링, 필터망 파손 유무 점검";
      qualityRisks = "필터망 파손으로 인한 이물 통과";
      possibleDefects = ["이물 혼입", "침전물/혼탁"];
    } else if (nameLower.includes("살균") || nameLower.includes("uht") || nameLower.includes("멸균")) {
      keyEquipment = "초고온 순간 UHT 살균기, 자동 온도 조절 밸브";
      controlPoints = "살균 온도 및 유지 시간 모니터링";
      isCCP = true;
      ccpNumber = "CCP-1B";
      qualityRisks = "미살균으로 인한 미생물 증식 및 변질";
      possibleDefects = ["변질/산패", "가스 팽창", "탁도 상승"];
    } else if (nameLower.includes("세척") || nameLower.includes("세병") || nameLower.includes("린싱")) {
      keyEquipment = "로터리 반전 세병기, 고압 온수 노즐, 청정 에어 블로우";
      controlPoints = "세척수 온도, 분사 압력, 노즐 막힘 점검";
      qualityRisks = "용기 내부 잔류물 및 미세 파편 미제거";
      possibleDefects = ["유리 파손/이물", "용기 내부 이물"];
    } else if (nameLower.includes("충진") || nameLower.includes("충전") || nameLower.includes("캡핑") || nameLower.includes("밀봉")) {
      keyEquipment = "자동 로터리 충전기, ROPP 캡핑 헤드";
      controlPoints = "충진량, 캡핑 토크, 롤링 림 깊이";
      qualityRisks = "캡핑 불량으로 인한 누액 및 외부 공기 유입";
      possibleDefects = ["캡 흠집/탄화", "누액", "내용량 부족", "변질/산패"];
      rawMaterials = "용기, 캡, 음료액";
    } else if (nameLower.includes("검사") || nameLower.includes("금속") || nameLower.includes("비전")) {
      keyEquipment = "인라인 고속 비전 검사기, 금속검출기, 중량선별기";
      controlPoints = "금속검출기 감도 테스트, 불량품 자동 배출(Reject)";
      isCCP = true;
      ccpNumber = "CCP-2P";
      qualityRisks = "금속 파편 등 외래 이물 미검출 출하";
      possibleDefects = ["금속 이물", "내용량 부족", "외관 불량"];
    } else if (nameLower.includes("냉각") || nameLower.includes("후살균") || nameLower.includes("샤워")) {
      keyEquipment = "터널식 샤워 쿨러, 온도 제어기";
      controlPoints = "구역별 냉각수 온도, 출구 제품 온도";
      qualityRisks = "급격한 온도차로 인한 용기 파손";
      possibleDefects = ["유리 파손/이물", "미세 크랙"];
    } else if (nameLower.includes("포장") || nameLower.includes("라벨") || nameLower.includes("박스")) {
      keyEquipment = "자동 라벨러, 잉크젯 날인기, 오토 카토너";
      controlPoints = "라벨 접착 상태, 소비기한 인자 선명도, 중량";
      qualityRisks = "유통기한 인자 누락, 라벨 들뜸, 수량 누락";
      possibleDefects = ["표시 오류(인자 불량)", "라벨 불량", "수량 부족"];
      rawMaterials = "라벨, 지함, 골판지 박스";
    }

    return {
      id: stepId,
      presetId: preset.id,
      manufacturerId: preset.type === "internal" ? "mfg-kd-pyeongtaek" : "mfg-oem",
      manufacturer: mfgName,
      manufactureLineId: `line-${preset.id}`,
      manufactureLine: lineName,
      stepNumber,
      processName: stepText,
      description: `${mfgName} ${lineName}의 ${stepNumber}번째 공정인 '${stepText}' 단계입니다.`,
      keyEquipment,
      controlPoints,
      rawMaterials,
      isCCP,
      ccpNumber,
      qualityRisks,
      possibleDefects,
      isActive: true,
    };
  });
}

/**
 * 기본 표준 데이터로 리셋
 */
export function resetProcessStepsToDefault(): ProcessStepMaster[] {
  try {
    localStorage.setItem(
      PROCESS_STEP_MASTER_STORAGE_KEY,
      JSON.stringify(DEFAULT_PROCESS_STEPS)
    );
    return DEFAULT_PROCESS_STEPS;
  } catch (e) {
    console.error("Failed to reset process steps", e);
    return DEFAULT_PROCESS_STEPS;
  }
}
