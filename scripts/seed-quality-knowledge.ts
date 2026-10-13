/**
 * 품질 지식 Seed 검증 + Import Preview (쓰기 없음)
 *
 * 실행: npx tsx scripts/seed-quality-knowledge.ts
 * 실제 반영: 브라우저에서 /?seed=demo 접속 1회 (기존 데이터 병합, 덮어쓰기 없음)
 */
import {
  collectSeedBundle,
  previewSeedImport,
} from "../src/utils/seedImporter";

function main() {
  const bundle = collectSeedBundle();
  const preview = previewSeedImport(bundle);

  console.log("=== 품질 지식 Seed Import Preview (쓰기 없음) ===");
  for (const d of preview.domains) {
    console.log(
      `총 ${d.domain} ${d.seeded}건 (신규 ${d.added}건, 기존 유지 ${d.kept}건)`
    );
  }
  console.log(`합계: Seed ${preview.totalSeeded}건 중 신규 ${preview.totalAdded}건`);

  if (preview.errors.length > 0) {
    console.log("\n[검증 오류] 존재하지 않는 ID 참조 등:");
    for (const e of preview.errors) {
      console.log(`- [${e.domain}] ${e.seedId}: ${e.message}`);
    }
    process.exit(1);
  }

  console.log("\n검증 통과. 브라우저에서 /?seed=demo 로 1회 적용하세요.");
}

main();
