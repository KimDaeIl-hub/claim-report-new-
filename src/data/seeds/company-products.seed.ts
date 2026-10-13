import { ProductMaster } from "../../types";

/**
 * 실제 회사 제품 Seed — 자사 (사용자 제공값만 기재, 추정 없음)
 *
 * - 제공 항목: 제품명·유형·용량(또는 포장수량)·생산라인
 * - 미제공 항목(productCode·subProductType·containerType·주요클레임유형)은 빈 값
 * - 동일 제품의 복수 라인 생산은 제품+라인 단위 레코드로 분리
 *   (ProductMaster가 단일 manufactureLineId만 지원하므로 복제 없이 표현 불가 →
 *   이름 기준 임의 병합 금지, 라인별 ID 분리. §7·§20·§21 대응)
 * - packageType은 제공된 생산 영역 용어만 사용 (음료 병 라인→"유리병",
 *   환제 병 포장 단계→"병", 파우치 라인→"파우치")
 */

const MFG_ID = "company-mfg-kd-food";
const MFG_NAME = "[실제] 광동제약 식품공장";

interface CompanyProductRow {
  id: string;
  name: string;
  productType: string;
  volume: string;
  packageType: string;
  lineId: string;
  lineName: string;
  processId: string;
  processName: string;
}

function buildProduct(r: CompanyProductRow): ProductMaster {
  return {
    id: r.id,
    productName: `[실제] ${r.name}`,
    productCode: "",
    productType: r.productType,
    subProductType: "",
    volume: r.volume,
    packageType: r.packageType,
    containerType: "",
    manufacturerId: MFG_ID,
    manufacturer: MFG_NAME,
    manufactureLineId: r.lineId,
    manufactureLine: r.lineName,
    isActive: true,
    primaryClaimTypes: [],
    relatedProcessPresetId: r.processId,
    relatedProcessName: r.processName,
  };
}

const DRINK_PROCESS = "company-process-drink-bottle";
const DRINK_PROCESS_NAME = "[실제] 식품팀 음료 병 라인 공정";
const HWAN_PROCESS = "company-process-hwan";
const HWAN_PROCESS_NAME = "[실제] 건기식팀 환제 라인 공정";
const POUCH_PROCESS = "company-process-pouch";
const POUCH_PROCESS_NAME = "[실제] 건기식팀 파우치 라인 공정";

const LINE_A = { lineId: "company-line-a", lineName: "[실제] A라인" };
const LINE_B = { lineId: "company-line-b", lineName: "[실제] B라인" };
const LINE_C = { lineId: "company-line-c", lineName: "[실제] C라인" };
const LINE_HWAN = { lineId: "company-line-hwan", lineName: "[실제] 환제 라인" };
const LINE_POUCH_SHAPE = { lineId: "company-line-pouch-shape", lineName: "[실제] 형상(스탠딩) 파우치 라인" };
const LINE_POUCH_STICK = { lineId: "company-line-pouch-stick", lineName: "[실제] 스틱 파우치 라인" };

function drink(
  id: string,
  name: string,
  productType: string,
  volume: string,
  line: { lineId: string; lineName: string }
): ProductMaster {
  return buildProduct({
    id,
    name,
    productType,
    volume,
    packageType: "유리병",
    lineId: line.lineId,
    lineName: line.lineName,
    processId: DRINK_PROCESS,
    processName: DRINK_PROCESS_NAME,
  });
}

export const COMPANY_PRODUCT_SEEDS: ProductMaster[] = [
  // ---- A라인 (음료 병) ----
  drink("company-prod-vita500-a", "비타500", "혼합음료", "100mL", LINE_A),
  drink("company-prod-vita500-zero-a", "비타500 zero", "혼합음료", "100mL", LINE_A),
  drink("company-prod-vita500-zinc-a", "비타500 아연", "혼합음료", "100mL", LINE_A),
  drink("company-prod-vita500-ace-a", "비타500 ACE", "혼합음료", "100mL", LINE_A),
  drink("company-prod-vita500-gold-a", "비타500 골드", "혼합음료", "100mL", LINE_A),
  drink("company-prod-bokbunja-a", "광동 복분자", "혼합음료", "100mL", LINE_A),
  drink("company-prod-ssanghwa-a", "광동 쌍화", "액상차", "100mL", LINE_A),
  drink("company-prod-yuja-ssanghwa-a", "광동 유자쌍화", "액상차", "150mL", LINE_A),
  drink("company-prod-jinsaenggang-ssanghwa-a", "광동 진생강쌍화", "액상차", "150mL", LINE_A),
  drink("company-prod-jin-ssanghwa-a", "광동 진 쌍화", "혼합음료", "100mL", LINE_A),
  // ---- B라인 (음료 병) ----
  drink("company-prod-vita500-b", "비타500", "혼합음료", "100mL", LINE_B),
  drink("company-prod-vita500-zero-b", "비타500 zero", "혼합음료", "100mL", LINE_B),
  drink("company-prod-bokbunja-b", "광동 복분자", "혼합음료", "100mL", LINE_B),
  drink("company-prod-c-plus-b", "비타500 C Plus", "혼합음료", "100mL", LINE_B),
  drink("company-prod-taurine2000-b", "타우린2000", "혼합음료", "120mL", LINE_B),
  drink("company-prod-taurine2000-zero-b", "타우린2000 제로", "혼합음료", "120mL", LINE_B),
  drink("company-prod-sunkist-peach-b", "썬키스트 피치리치", "과채음료", "100mL", LINE_B),
  drink("company-prod-sunkist-orange-b", "썬키스트 오렌지레몬", "과채음료", "100mL", LINE_B),
  drink("company-prod-saenggang-ssanghwa-b", "광동 생강쌍화", "액상차", "120mL", LINE_B),
  drink("company-prod-jinsaenggang-ssanghwa-b", "광동 진생강쌍화", "액상차", "100mL", LINE_B),
  drink("company-prod-jin-hongsam-gold-b", "광동 진 홍삼골드", "홍삼음료", "100mL", LINE_B),
  // ---- C라인 (음료 병) ----
  drink("company-prod-vita500-c", "비타500", "혼합음료", "100mL", LINE_C),
  drink("company-prod-vita500-zero-c", "비타500 zero", "혼합음료", "100mL", LINE_C),
  drink("company-prod-bokbunja-c", "광동 복분자", "혼합음료", "100mL", LINE_C),
  drink("company-prod-c-plus-c", "비타500 C Plus", "혼합음료", "100mL", LINE_C),
  drink("company-prod-fresh-c", "비타500 Fresh", "혼합음료", "100mL", LINE_C),
  drink("company-prod-wisaengcheon-c", "광동 위생천", "액상차", "75mL", LINE_C),
  // ---- 환제 라인 (유형·포장수량 제공, 그 외 미제공은 빈 값) ----
  buildProduct({
    id: "company-prod-chimhyanghwan-hwan",
    name: "광동 침향환 프리미엄",
    productType: "기타가공품",
    volume: "30환",
    packageType: "병",
    lineId: LINE_HWAN.lineId,
    lineName: LINE_HWAN.lineName,
    processId: HWAN_PROCESS,
    processName: HWAN_PROCESS_NAME,
  }),
  buildProduct({
    id: "company-prod-nokyongdan-hwan",
    name: "광동 녹용단",
    productType: "기타가공품",
    volume: "30환",
    packageType: "병",
    lineId: LINE_HWAN.lineId,
    lineName: LINE_HWAN.lineName,
    processId: HWAN_PROCESS,
    processName: HWAN_PROCESS_NAME,
  }),
  // ---- 파우치 라인 (유형·용량 미제공 → 빈 값, 추정 금지) ----
  buildProduct({
    id: "company-prod-vita-ice-zero-shape",
    name: "비타500 아이스 zero",
    productType: "혼합음료",
    volume: "230mL",
    packageType: "파우치",
    lineId: LINE_POUCH_SHAPE.lineId,
    lineName: LINE_POUCH_SHAPE.lineName,
    processId: POUCH_PROCESS,
    processName: POUCH_PROCESS_NAME,
  }),
  buildProduct({
    id: "company-prod-gwangokgo-stick",
    name: "광동 광옥고 스틱",
    productType: "",
    volume: "",
    packageType: "파우치",
    lineId: LINE_POUCH_STICK.lineId,
    lineName: LINE_POUCH_STICK.lineName,
    processId: POUCH_PROCESS,
    processName: POUCH_PROCESS_NAME,
  }),
  buildProduct({
    id: "company-prod-gwangokgo-sansam-stick",
    name: "광동 광옥고 스틱 산삼배양근",
    productType: "",
    volume: "",
    packageType: "파우치",
    lineId: LINE_POUCH_STICK.lineId,
    lineName: LINE_POUCH_STICK.lineName,
    processId: POUCH_PROCESS,
    processName: POUCH_PROCESS_NAME,
  }),
  buildProduct({
    id: "company-prod-nano-curcumin-stick",
    name: "나노 커큐민",
    productType: "",
    volume: "",
    packageType: "파우치",
    lineId: LINE_POUCH_STICK.lineId,
    lineName: LINE_POUCH_STICK.lineName,
    processId: POUCH_PROCESS,
    processName: POUCH_PROCESS_NAME,
  }),
  buildProduct({
    id: "company-prod-baedoraji-stick",
    name: "배도라지 스틱",
    productType: "",
    volume: "",
    packageType: "파우치",
    lineId: LINE_POUCH_STICK.lineId,
    lineName: LINE_POUCH_STICK.lineName,
    processId: POUCH_PROCESS,
    processName: POUCH_PROCESS_NAME,
  }),
  buildProduct({
    id: "company-prod-daechu-ssanghwajin-shape",
    name: "광동 대추쌍화진",
    productType: "",
    volume: "",
    packageType: "파우치",
    lineId: LINE_POUCH_SHAPE.lineId,
    lineName: LINE_POUCH_SHAPE.lineName,
    processId: POUCH_PROCESS,
    processName: POUCH_PROCESS_NAME,
  }),
];
