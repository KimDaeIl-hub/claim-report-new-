/**
 * 클레임 유형 Seed (레지스트리 참조용, [DEMO] 예시 전용)
 * - 런타임 6대 고정 유형(foreign/spoilage/leak/label/volume/etc)은 코드에 존재하므로,
 *   이 파일은 커스텀 유형 정의 + 프리셋/상용구 claimType 참조 검증용으로 사용
 * - 실제 회사 데이터 아님
 */
export interface SeedClaimType {
  id: string;
  category: string;
  name: string;
  description: string;
  keywords: string[];
}

export const CLAIM_TYPE_SEEDS: SeedClaimType[] = [
  {
    id: "demo-claimtype-001",
    category: "foreign",
    name: "[DEMO] 데모 이물 유형 (실제 회사 데이터 아님)",
    description: "[DEMO] Seed 구조 검증용 예시 클레임 유형 (실제 회사 데이터 아님)",
    keywords: ["데모", "예시"],
  },

  // =========================================================================
  // 범용 세부 클레임 분류 (기존 6종 최상위 체계 유지, subtype/tags/keywords로 세분화)
  // category는 기존 ClaimTypeCategory(foreign/spoilage/leak/label/volume/etc)만 사용
  // =========================================================================

  // ---- A. 이물 관련 → foreign ----
  { id: "seed-ct-foreign-metal", category: "foreign", name: "금속 이물", description: "금속성 이물 혼입 의심 시 확인 항목 묶음", keywords: ["금속", "쇠", "철", "금속검출"] },
  { id: "seed-ct-foreign-plastic", category: "foreign", name: "플라스틱 이물", description: "플라스틱 조각·필름 혼입 의심 시 확인 항목 묶음", keywords: ["플라스틱", "비닐", "필름"] },
  { id: "seed-ct-foreign-glass", category: "foreign", name: "유리 파편", description: "유리 파편 혼입 의심 시 확인 항목 묶음", keywords: ["유리", "파편"] },
  { id: "seed-ct-foreign-paper", category: "foreign", name: "종이 이물", description: "종이·라벨 조각 혼입 의심 시 확인 항목 묶음", keywords: ["종이", "라벨조각"] },
  { id: "seed-ct-foreign-fiber", category: "foreign", name: "섬유 이물", description: "섬유·실·머리카락 혼입 의심 시 확인 항목 묶음", keywords: ["섬유", "실", "머리카락"] },
  { id: "seed-ct-foreign-rubber", category: "foreign", name: "고무 이물", description: "고무·패킹 조각 혼입 의심 시 확인 항목 묶음", keywords: ["고무", "패킹", "가스켓"] },
  { id: "seed-ct-foreign-insect", category: "foreign", name: "벌레·곤충", description: "곤충·벌레 혼입 의심 시 확인 항목 묶음", keywords: ["벌레", "곤충", "날파리", "개미"] },
  { id: "seed-ct-foreign-plant", category: "foreign", name: "식물성 물질", description: "식물 조직·잎·줄기 혼입 의심 시 확인 항목 묶음", keywords: ["식물", "잎", "줄기", "씨앗"] },
  { id: "seed-ct-foreign-raw", category: "foreign", name: "원료 유래 이물", description: "원료 자체 유래 이물 의심 시 확인 항목 묶음", keywords: ["원료", "원료유래"] },
  { id: "seed-ct-foreign-process", category: "foreign", name: "공정 유래 이물", description: "공정 중 발생 이물 의심 시 확인 항목 묶음", keywords: ["공정", "설비", "마모"] },
  { id: "seed-ct-foreign-packaging", category: "foreign", name: "포장재 유래 이물", description: "포장재·용기 유래 이물 의심 시 확인 항목 묶음", keywords: ["포장재", "용기유래"] },
  { id: "seed-ct-foreign-carbonized", category: "foreign", name: "탄화물", description: "탄화·그을음 이물 의심 시 확인 항목 묶음", keywords: ["탄화", "그을음", "까만"] },
  { id: "seed-ct-foreign-sediment", category: "foreign", name: "침전물", description: "침전·앙금 의심 시 확인 항목 묶음", keywords: ["침전", "앙금", "가라앉"] },
  { id: "seed-ct-foreign-crystal", category: "foreign", name: "결정", description: "결정 석출 의심 시 확인 항목 묶음", keywords: ["결정", "석출"] },
  { id: "seed-ct-foreign-unknown", category: "foreign", name: "미확인 이물", description: "정체 불명 이물 종합 확인 묶음", keywords: ["미확인", "정체불명", "이물"] },

  // ---- B. 내용물 이상 → spoilage / volume / foreign ----
  { id: "seed-ct-spoilage-discolor", category: "spoilage", name: "변색", description: "내용물 색상 이상 확인 묶음", keywords: ["변색", "색상", "갈변"] },
  { id: "seed-ct-spoilage-turbid", category: "spoilage", name: "혼탁", description: "혼탁 발생 확인 묶음", keywords: ["혼탁", "탁함"] },
  { id: "seed-ct-spoilage-sediment", category: "spoilage", name: "침전·부유물", description: "침전·부유물 발생 확인 묶음", keywords: ["침전", "부유물", "떠다님"] },
  { id: "seed-ct-spoilage-coagulate", category: "spoilage", name: "응고", description: "응고·겔화 확인 묶음", keywords: ["응고", "겔", "엉김"] },
  { id: "seed-ct-spoilage-separate", category: "spoilage", name: "층분리", description: "층분리 발생 확인 묶음", keywords: ["층분리", "분리"] },
  { id: "seed-ct-spoilage-viscosity", category: "spoilage", name: "점도 이상", description: "점도·농도 이상 확인 묶음", keywords: ["점도", "되직", "묽음"] },
  { id: "seed-ct-spoilage-odor", category: "spoilage", name: "이상취·이취", description: "냄새 이상 확인 묶음", keywords: ["냄새", "이취", "이상취", "시큼"] },
  { id: "seed-ct-spoilage-taste", category: "spoilage", name: "이미", description: "맛 이상 확인 묶음", keywords: ["맛", "이미", "씀", "심"] },
  { id: "seed-ct-spoilage-heat", category: "spoilage", name: "열변성", description: "가열 변성 의심 확인 묶음", keywords: ["열변성", "탄화취", "끓음"] },
  { id: "seed-ct-volume-shortage", category: "volume", name: "내용물 부족·내용량 이상", description: "충전량·중량 이상 확인 묶음", keywords: ["부족", "내용량", "중량", "덜"] },
  { id: "seed-ct-foreign-mixed", category: "foreign", name: "혼입(기타)", description: "기타 혼입 의심 종합 확인 묶음", keywords: ["혼입"] },

  // ---- C. 용기/포장 이상 → leak ----
  { id: "seed-ct-leak-leakage", category: "leak", name: "누액", description: "내용액 누출 확인 묶음", keywords: ["누액", "샘", "흐름"] },
  { id: "seed-ct-leak-cap", category: "leak", name: "캡 불량·헛돎", description: "캡 체결·밀봉 이상 확인 묶음", keywords: ["캡", "헛돎", "돌아감"] },
  { id: "seed-ct-leak-nocap", category: "leak", name: "무캡·밀봉 불량", description: "캡 미체결·밀봉 불량 확인 묶음", keywords: ["무캡", "밀봉", "열림"] },
  { id: "seed-ct-leak-breakage", category: "leak", name: "용기 파손", description: "용기 깨짐·파손 확인 묶음", keywords: ["파손", "깨짐", "금감"] },
  { id: "seed-ct-leak-defect", category: "leak", name: "용기 불량·변형", description: "용기 성형·변형 이상 확인 묶음", keywords: ["변형", "찌그러짐", "일그러짐"] },
  { id: "seed-ct-leak-corrosion", category: "leak", name: "용기 부식·도막 이상", description: "캔 부식·도막 이상 확인 묶음", keywords: ["부식", "녹", "도막"] },
  { id: "seed-ct-leak-label", category: "leak", name: "라벨·포장재 이상", description: "라벨·포장 외관 이상 확인 묶음", keywords: ["라벨", "포장재"] },
  { id: "seed-ct-leak-pouch", category: "leak", name: "파우치 파손·실링 불량", description: "파우치 파손·실링 이상 확인 묶음", keywords: ["파우치", "실링"] },
  { id: "seed-ct-leak-box", category: "leak", name: "박스·케이스 파손", description: "외박스·케이스 파손 확인 묶음", keywords: ["박스", "케이스"] },
  { id: "seed-ct-leak-adhesive", category: "leak", name: "접착·핫멜트 이상", description: "접착·핫멜트 이상 확인 묶음", keywords: ["접착", "핫멜트", "본드"] },

  // ---- D. 표시/인쇄 이상 → label ----
  { id: "seed-ct-label-expiry", category: "label", name: "소비기한 인쇄 이상", description: "소비기한 미인쇄·오인쇄 확인 묶음", keywords: ["소비기한", "유통기한"] },
  { id: "seed-ct-label-lot", category: "label", name: "제조번호 인쇄 이상", description: "제조번호 미인쇄·오인쇄 확인 묶음", keywords: ["제조번호", "로트번호"] },
  { id: "seed-ct-label-qr", category: "label", name: "QR·바코드 이상", description: "QR 미인쇄·인식불량·바코드 이상 확인 묶음", keywords: ["QR", "바코드", "인식"] },
  { id: "seed-ct-label-mislabel", category: "label", name: "라벨 오부착·인쇄 누락", description: "오부착·인쇄 누락 확인 묶음", keywords: ["오부착", "누락", "빠짐"] },
  { id: "seed-ct-label-smudge", category: "label", name: "인쇄 번짐·위치 이상", description: "번짐·위치 틀어짐 확인 묶음", keywords: ["번짐", "위치", "기욺"] },

  // ---- E. 공정/품질 관련 → spoilage ----
  { id: "seed-ct-process-sterilize", category: "spoilage", name: "살균 관련 이상", description: "살균 조건 의심 확인 묶음", keywords: ["살균", "UHT", "멸균"] },
  { id: "seed-ct-process-filling", category: "spoilage", name: "충전 관련 이상", description: "충전 공정 의심 확인 묶음", keywords: ["충전"] },
  { id: "seed-ct-process-mixing", category: "spoilage", name: "배합 관련 이상", description: "배합 공정 의심 확인 묶음", keywords: ["배합", "혼합"] },
  { id: "seed-ct-process-filtration", category: "spoilage", name: "여과 관련 이상", description: "여과 공정 의심 확인 묶음", keywords: ["여과", "필터"] },
  { id: "seed-ct-process-storage", category: "spoilage", name: "저장 관련 이상", description: "저장·보관 조건 의심 확인 묶음", keywords: ["저장", "보관"] },
  { id: "seed-ct-process-capping", category: "spoilage", name: "캡핑 관련 이상", description: "캡핑 공정 의심 확인 묶음", keywords: ["캡핑"] },
  { id: "seed-ct-process-cooling", category: "spoilage", name: "냉각 관련 이상", description: "냉각 공정 의심 확인 묶음", keywords: ["냉각"] },
  { id: "seed-ct-process-cip", category: "spoilage", name: "CIP·세척 관련 이상", description: "세척·CIP 의심 확인 묶음", keywords: ["CIP", "세척"] },
  { id: "seed-ct-process-lot", category: "spoilage", name: "동일번호 이상", description: "동일 제조번호 확산 여부 확인 묶음", keywords: ["동일", "확산", "다발"] },
  { id: "seed-ct-process-qc", category: "spoilage", name: "보관품·품질검사 이상", description: "보관품·성적서 이상 확인 묶음", keywords: ["보관품", "성적서", "품질검사"] },
];
