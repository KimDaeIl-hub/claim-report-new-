import { StandardPhrase } from "../types";

export const OEM_STANDARD_PHRASES: StandardPhrase[] = [
  // =========================================================================
  // [11] 외주-PET 차류(헛개차 1.5L) 개봉 후 변질 및 곰팡이(진균) 이물
  // =========================================================================
  {
    id: "oem-phrase-pet-mold-sample",
    fieldKey: "sampleCondition",
    category: "oem_pet",
    subCategory: "spoilage",
    presetId: "preset-oem-pet-spoilage-mold",
    title: "외관: 회수 현품 잔여량(약 2ml) 및 미생물 군집 추정 이물 소견",
    content:
      "회수된 현품 내용액은 거의 없는 상태로 확인됨(약 2ml 잔류). PET병 및 캡에 파손, 핀홀과 같은 특이사항 발생은 없음. 이물은 탄성과 유연성을 모두 가지고 있는 것으로 보아 미생물의 군집으로 추정됨.",
  },
  {
    id: "oem-phrase-pet-mold-foreign",
    fieldKey: "foreignObjectAppearance",
    category: "oem_pet",
    subCategory: "spoilage",
    presetId: "preset-oem-pet-spoilage-mold",
    title: "이물 소견: 탄성과 유연성을 가진 미생물 군집",
    content:
      "이물은 탄성과 유연성을 모두 가지고 있는 것으로 보아 미생물의 군집으로 추정됨.",
  },
  {
    id: "oem-phrase-pet-mold-microscope",
    fieldKey: "opticalMicroscope",
    category: "oem_pet",
    subCategory: "spoilage",
    presetId: "preset-oem-pet-spoilage-mold",
    title: "현미경: 전형적인 진균 균사(Hyphae) 구조 관찰 및 곰팡이 확인",
    content:
      "분리된 이물에 대한 광학현미경 검경 결과, 전형적인 진균 균사(Hyphae) 구조가 명확히 관찰되어 이물은 진균류(곰팡이)로 확인됨.",
  },
  {
    id: "oem-phrase-pet-mold-principle-micro",
    fieldKey: "principle_microscope",
    category: "oem_pet",
    subCategory: "spoilage",
    presetId: "preset-oem-pet-spoilage-mold",
    title: "현미경 진균류 감식 원리 (호기성 곰팡이)",
    content:
      "※ 현미경 진균류 감식 원리: 고배율 광학 현미경 하에서 균사의 형태, 격벽 유무, 포자낭의 구조를 관찰하여 개봉 후 외부 공기 유입 및 구강 접촉에 의해 증식하는 호기성 곰팡이임을 감식합니다.",
  },
  {
    id: "oem-phrase-pet-mold-physicochemical-summary",
    fieldKey: "summary_physicochemical",
    category: "oem_pet",
    subCategory: "spoilage",
    presetId: "preset-oem-pet-spoilage-mold",
    title: "이화학: 당도 저하(0.40→0.36 Brix) 및 진균 증식 변질 메커니즘",
    content:
      "내용액 잔량이 거의 없는 상태로 당도에 대한 이화학 분석만 진행함. 기존 출하 시점 대비 당도가 저하되어 제품 기준 규격에 부적합 한것으로 확인됨. 당도와 pH의 저하 현상은 진균(곰팡이)의 증식으로 인한 변질 시 발생하는 전형적인 현상으로 해당 클레임 현품도 유사한 현상이 확인됨.",
  },
  {
    id: "oem-phrase-pet-mold-filtration",
    fieldKey: "filtrationAnalysis",
    category: "oem_pet",
    subCategory: "spoilage",
    presetId: "preset-oem-pet-spoilage-mold",
    title: "공정: 다회 마이크로 필터 여과 공정(이물 제어)",
    content:
      "다회 마이크로 필터를 거쳐 이물의 혼입은 차단함.",
  },
  {
    id: "oem-phrase-pet-mold-cleaning",
    fieldKey: "cleaningAnalysis",
    category: "oem_pet",
    subCategory: "spoilage",
    presetId: "preset-oem-pet-spoilage-mold",
    title: "공정: PET 및 캡 고압 세척수 및 과산화수소 살균",
    content:
      "PET 및 캡은 고압 세척 수 및 과산화수소 살균을 진행 후 무균 챔버 내로 투입됨.",
  },
  {
    id: "oem-phrase-pet-mold-production-log",
    fieldKey: "productionLogNote",
    category: "oem_pet",
    subCategory: "spoilage",
    presetId: "preset-oem-pet-spoilage-mold",
    title: "생산일지: UHT 살균온도(135.2℃) 및 무균 챔버 무균도 전수 정상 유지",
    content:
      "외주 생산 당일 UHT 살균온도(135.2℃) 및 무균 챔버 무균도 전수 정상 유지 확인. 특이사항 없음.",
  },
  {
    id: "oem-phrase-pet-mold-quality-record",
    fieldKey: "qualityTestRecord",
    category: "oem_pet",
    subCategory: "spoilage",
    presetId: "preset-oem-pet-spoilage-mold",
    title: "품질성적서: 완제품 미생물 무균 배양 시험(일반세균 불검출) 적합 판정",
    content:
      "완제품 미생물 무균 배양 시험(일반세균 불검출) 적합 판정 출하.",
  },
  {
    id: "oem-phrase-pet-mold-prior-claims",
    fieldKey: "priorClaimsCount",
    category: "oem_pet",
    subCategory: "spoilage",
    presetId: "preset-oem-pet-spoilage-mold",
    title: "이전 이력: 동일 Lot 생산량 600,000병 중 미개봉 변질 접수 0건",
    content:
      "동일 Lot 생산량 600,000병 중 미개봉 변질 접수 0건.",
  },
  {
    id: "oem-phrase-pet-mold-retained-check",
    fieldKey: "retainedSampleCheck",
    category: "oem_pet",
    subCategory: "spoilage",
    presetId: "preset-oem-pet-spoilage-mold",
    title: "보관품: 동일 로트 시간대별 보관품 검사 결과 특이사항 없음",
    content:
      "동일 로트 시간대별 보관품 검사 결과, 변질 혹은 이물과 같은 특이사항 없음.",
  },
  {
    id: "oem-phrase-pet-mold-cause",
    fieldKey: "rootCause",
    category: "oem_pet",
    subCategory: "spoilage",
    presetId: "preset-oem-pet-spoilage-mold",
    title: "원인 판정: 개봉 후 외부 공기 유입에 따른 곰팡이 증식",
    content:
      "불만 현품의 이물은 변질로 인해 증식한 곰팡이로 확인됩니다. 광동 男 진한 헛개차의 무(無) 보존료 특성 상 개봉 후 외부 공기 유입으로 인하여 미생물에 오염된 것으로 추정됩니다. 해당 내용은 제품 라벨 표시사항에 관련 문구 \"개봉 후에는 반드시 밀봉하여 냉장(0~10℃) 보관하시고 빨리 드시기 바랍니다.\"라는 문구가 삽입되어 있습니다. 한국소비자원 소비자안전센터에서 음용 중 세균변화 시뮬레이션 시험을 진행한 결과, 개봉 직후 균이 검출되지 않아도 실험자가 섭취함에 따라 균이 증식되는 양상을 보였습니다.",
  },
  {
    id: "oem-phrase-pet-mold-conclusion",
    fieldKey: "conclusion",
    category: "oem_pet",
    subCategory: "spoilage",
    presetId: "preset-oem-pet-spoilage-mold",
    title: "종합 결론: 외주 PET 헛개차 8단계 기술적 검증 결론 (가~아)",
    content:
      "가. 불만 현품 이물에 대한 광학현미경 검경 시 이물은 곰팡이(진균)으로 확인됩니다.\n나. 고객 불만 제품이 생산된 날짜의 생산일지 및 품질검사기록을 확인한 결과, 제조공정 중 특이사항이 발견되지 않았고, 설비적 이상도 없었음을 확인하였습니다. 정상 조건에서 보관중인 동일 제조번호 보관품에서 변질/이물과 같은 특이사항은 확인되지 않았습니다.\n다. 광동 男 진한 헛개차는 UHT살균 시스템에서 136℃ 이상의 고온으로 살균 및 무균화되었으며, Aseptic 충전을 통해 무균조건으로 충전을 진행하여 생산 중 변질에 대한 위험성은 없습니다.\n라. 제조과정 상 3단계의 마이크로 필터를 거친 후 충전기 내 노즐 말단에 40 Mesh(pore size 0.42mm) 필터를 사용하고 있기에 이물 혼입에 의한 변질 발생 가능성은 없습니다.\n마. 포장재의 경우 충전하기 전 수직으로 뒤집은 상태로 과초산과 무균수를 병 내부에 분사하기 때문에 이물 혼입에 의한 변질 가능성은 없습니다.\n바. 제조공정 상 다량의 추출 및 배합을 동시에 진행하고 있어 일부 제품에서만 변질이 발생할 가능성은 없으며, 해당 제품 출고(26년 5월) 이후 현재까지 해당 제조번호에서 동일한 유형의 클레임(이물/변질)이 발생한 사례는 없는 것으로 확인됩니다.\n사. 본 제품은 HACCP 지정(식약처) 받은 시스템에서 철저한 품질관리를 통해 생산되고 있습니다.\n아. 위 내용을 종합해보면 불만 현품의 이물은 개봉 후 외부 공기 유입에 따른 곰팡이 증식으로 발생한 것으로 추정됩니다.",
  },
  {
    id: "oem-phrase-pet-mold-apology",
    fieldKey: "apologyText",
    category: "oem_pet",
    subCategory: "spoilage",
    presetId: "preset-oem-pet-spoilage-mold",
    title: "고객 사과: 정중한 고객 안내 및 품질 재점검 약속",
    content:
      "다시 한번, 폐사 제품을 애용해 주시는 고객님께 저희 제품으로 인하여 불편을 드린 점에 대하여 진심으로 사과를 드립니다. 고객님의 소중한 의견을 바탕으로 폐사의 제조공정 및 품질관리에 소홀함이 없는지 재 점검하는 계기로 삼아, 더욱 안전한 제품을 소비자에게 전달할 수 있도록 성심을 다하겠습니다. 언제나 고객님과 가정에 건강과 행운이 가득하시길 기원합니다. 감사합니다.",
  },

  // =========================================================================
  // [12] 외주-PET 분리배출 에코 라벨 타공부 유통 충격 라벨 터짐
  // =========================================================================
  {
    id: "oem-phrase-pet-label-principle",
    fieldKey: "principle_magnifier",
    category: "oem_pet",
    presetId: "preset-oem-pet-label-tear",
    title: "라벨 절취선 타공(Perforation) 인장 강도 원리",
    content:
      "친환경 투명 페트 분리배출을 위한 에코 절취선은 소비자의 손가락 힘으로는 쉽게 뜯어져야 하고, 동시에 박스 적재 운반 중의 진동과 마찰 전단응력에는 견뎌야 하는 상충되는 임계 인장 강도를 요구합니다.",
  },
  {
    id: "oem-phrase-pet-label-cause",
    fieldKey: "rootCause",
    category: "oem_pet",
    presetId: "preset-oem-pet-label-tear",
    title: "원인: 분리배출 타공 개선 후 물류 유통 마찰 충격에 의한 찢어짐",
    content:
      "분리배출 편의성을 위해 타공 간격을 개선한 초기 제품군에서, 물류 팔레트 적재 및 차량 운송 중 박스 간 진동 마찰 압력이 타공 브릿지의 한계 인장력을 초과하여 절취선을 따라 국소적으로 터진 현상으로 분석됨. (음료 품질 이상 없음)",
  },

  // =========================================================================
  // [13] 외주-PET 용기 네크/바닥 크랙 및 공급사 성형 핀홀 누액
  // =========================================================================
  {
    id: "oem-phrase-pet-leak-principle",
    fieldKey: "principle_magnifier",
    category: "oem_pet",
    presetId: "preset-oem-pet-crack-pinhole",
    title: "가압 수침 검사를 통한 용기 크랙/핀홀 감식 원리",
    content:
      "용기 내부에 0.5kgf/cm² 공압을 가한 후 수조에 침지하여 발생하는 기포의 위치와 파단면 형태를 정밀 관찰함으로써, 캡 체결 불량인지, 블로우 몰딩 성형 핀홀인지, 유통 낙하 타격 크랙인지를 판정합니다.",
  },
  {
    id: "oem-phrase-pet-leak-cause",
    fieldKey: "rootCause",
    category: "oem_pet",
    presetId: "preset-oem-pet-crack-pinhole",
    title: "원인: 택배 물류 유통 중 취약 부위(Neck) 집중 충격에 의한 크랙 누액",
    content:
      "공장 전수 에어 리크 테스터를 통과한 정상 출하품이었으나, 택배 배송 중 외박스 낙하 충격 또는 상부 집중 하중으로 인해 PET 병의 취약 부위인 넥크(Neck) 라운드부에 모서리 타격이 가해져 미세 크랙이 발생하고 음료가 누액된 것으로 판정됨.",
  },

  // =========================================================================
  // [14] 외주-병 병 제품 오버캡 시계방향(역방향) 개봉에 따른 나사선 붕괴 헛돎
  // =========================================================================
  {
    id: "oem-phrase-bottle-overcap-principle",
    fieldKey: "principle_magnifier",
    category: "oem_bottle",
    presetId: "preset-oem-bottle-overcap-thread",
    title: "오버캡 이중구조 역방향 개봉 나사선 붕괴 원리",
    content:
      "오버캡 제품은 플라스틱 외장 캡 내부에 연질 알루미늄 캡이 감싸여 있어 내부가 보이지 않습니다. 소비자가 개봉 방향(반시계)을 오인하여 시계 방향(잠금 방향)으로 강하게 비틀 경우, 캡 나사선이 병 나사산 턱을 타고 넘어가며 영구 변형(나사선 뭉개짐)되어 헛돌게 됩니다.",
  },
  {
    id: "oem-phrase-bottle-overcap-cause",
    fieldKey: "rootCause",
    category: "oem_bottle",
    presetId: "preset-oem-bottle-overcap-thread",
    title: "원인: 시계방향(잠금방향) 역방향 무리한 회전에 따른 알루미늄 나사선 붕괴",
    content:
      "개봉 시 반시계 방향이 아닌 시계 방향으로 과도한 토크를 가하여 회전시킴으로써 내부 알루미늄 캡의 연질 나사선이 유리병 나사산 턱에 부딪혀 뭉개지고 펴져 발생한 '역방향 개봉에 의한 나사선 붕괴 헛돎'으로 규명됨.",
  },

  // =========================================================================
  // [16] 외주-병 병 제품 온장고(50~60℃) 2주일 초과 장기보관 단백질 변성 응고
  // =========================================================================
  {
    id: "oem-phrase-soymilk-principle",
    fieldKey: "principle_physicochemical",
    category: "oem_bottle",
    presetId: "preset-oem-bottle-soymilk-coagulation",
    title: "대두 단백질 고온 장기 노출 열변성 응고 원리",
    content:
      "두유의 주성분인 대두 단백질 글리시닌(Glycinin)은 50~60℃ 온장 상태에서 14일(2주일) 이상 연속 보관될 경우 유화 안정성이 깨지면서 단백질 분자 간 소수성 가교 결합을 통해 순두부/젤리 형태의 덩어리(응고 침전)로 분리됩니다. 이는 부패가 아닌 단백질 고유의 열역학적 열변성 현상입니다.",
  },
  {
    id: "oem-phrase-soymilk-cause",
    fieldKey: "rootCause",
    category: "oem_bottle",
    presetId: "preset-oem-bottle-soymilk-coagulation",
    title: "원인: 편의점 온장고 권장 보관 기한(2주일) 초과 장기 가온에 의한 단백질 변성",
    content:
      "판매처 온장고(50~60℃)에서 제품 라벨에 고지된 권장 보관 기한(2주일 이내)을 초과하여 장기간 가온 진열됨에 따라 대두 단백질이 물리화학적으로 열변성되어 순두부상으로 엉겨붙은 것으로, 미생물 시험 결과 완전 무균(0 CFU) 상태를 유지하여 변질이 아닌 온장 보관 수칙 미준수에 기인함.",
  },

  // =========================================================================
  // [17] 외주-젤리 젤리 제품 3대 결함 (검은 탄화물 / 데포지터 전분 / 젤리꼬리 갈변)
  // =========================================================================
  {
    id: "oem-phrase-jelly-foreign-principle",
    fieldKey: "principle_magnifier",
    category: "oem_jelly",
    presetId: "preset-oem-jelly-foreign-3types",
    title: "젤리 3대 성형 부산물(탄화물·전분·젤리꼬리) 감식 원리",
    content:
      "젤리 제품은 투명한 젤리 제형 특성상 미세 탄화물(솥 벽면 설탕 탄화), 데포지터 노즐 액떨어짐 비타민 원료 산화 갈변(젤리꼬리), 성형 트레이의 옥수수 전분 덩어리가 눈에 뚜렷이 띄며, 요오드 반응 및 연소 시험을 통해 무해한 제조 부산물임을 판별합니다.",
  },
  {
    id: "oem-phrase-jelly-foreign-cause",
    fieldKey: "rootCause",
    category: "oem_jelly",
    presetId: "preset-oem-jelly-foreign-3types",
    title: "원인: 배합 솥 미세 탄화물 및 노즐 비타민C 산화 갈변 제조 부산물",
    content:
      "검출된 물질은 외부 오염물이나 금속이 아니며, 농축 솥 표면의 미세 당액 탄화물, 데포지터 노즐 액떨어짐 비타민C 산화 갈변 꼬리, 성형 트레이 옥수수 전분 덩어리로 인체에 무해한 제조 공정 고유 부산물로 최종 판정됨.",
  },

  // =========================================================================
  // [18] 외주-젤리 하절기 고온 유통/보관에 따른 젤리 연화 및 녹아 뭉침
  // =========================================================================
  {
    id: "oem-phrase-jelly-melting-cause",
    fieldKey: "rootCause",
    category: "oem_jelly",
    presetId: "preset-oem-jelly-melting",
    title: "원인: 하절기 상온 초과 고온(35℃ 이상) 노출에 의한 젤라틴 겔 융해 뭉침",
    content:
      "젤라틴 및 펙틴 겔화제의 융점(32~35℃)을 초과하는 여름철 직사광선 또는 밀폐 차량 내 고온 환경에 장시간 노출됨에 따라 젤리가 녹아 한 덩어리로 엉겨붙은 '유통·소비 단계 고온 노출에 의한 열변형'으로 판정됨.",
  },

  // =========================================================================
  // [19] 외주-CAN 캔 엔드 탭(End Tab) 리벳 체결 불량 및 사각 개봉 파손
  // =========================================================================
  {
    id: "oem-phrase-can-tab-principle",
    fieldKey: "principle_magnifier",
    category: "oem_can",
    presetId: "preset-oem-can-tab-break",
    title: "캔 엔드 탭 지렛대 원리 및 리벳 체결 강도 감식 원리",
    content:
      "캔 탭 개봉은 지렛대 원리로 노즈(Nose)가 캔 뚜껑의 스코어 라인 잔류 두께(30~35㎛)를 먼저 뚫어야 합니다. 탭 체결 리벳 코킹 강도와 스코어 파열 하중의 균형을 계측하여 공급사 체결 편차인지 사각 비틀림 개봉인지를 규명합니다.",
  },
  {
    id: "oem-phrase-can-tab-cause",
    fieldKey: "rootCause",
    category: "oem_can",
    presetId: "preset-oem-can-tab-break",
    title: "원인: 캔 엔드 리벳 체결 편차 및 측면 사각 개봉 비틀림 복합 파손",
    content:
      "캔 엔드 공급사의 리벳 압착 강도 편차가 존재하는 상태에서 소비자가 탭을 수직이 아닌 측면 사각 방향으로 비틀어 당김으로써 스코어가 찢어지기 전 탭 결합부가 집중 전단 응력을 견디지 못하고 파손된 건으로 분석됨.",
  },

  // =========================================================================
  // [20] 외주-포/스틱 스틱포 실링부 액묻음 핀홀 누액 및 포 터짐
  // =========================================================================
  {
    id: "oem-phrase-pouch-leak-cause",
    fieldKey: "rootCause",
    category: "oem_pouch",
    presetId: "preset-oem-pouch-pinhole-leak",
    title: "원인: 고속 충전 시 실링부 내용액 비말 묻음(액물림 핀홀) 및 물류 충격 누액",
    content:
      "고점도 한방 농축액 충전 노즐 컷팅 시 미세 비말이 열접착 부위에 묻어 실란트 융착 불량(액물림 핀홀)이 형성되었고, 이후 택배 배송 중 외부 압축 하중을 받아 취약 부위로 진액이 누액된 것으로 분석됨.",
  },
];
