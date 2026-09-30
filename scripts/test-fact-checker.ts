import { checkFactIntegrity } from "../src/utils/aiFactChecker";
import { safeRuleBasedPolish } from "../src/utils/safeRulePolish";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
  }
}

console.log("=== [1] Fact Integrity Checker Tests ===");

// 1. Number integrity test
{
  const original = "FT-IR 측정 결과 92.5% 일치 및 0.3mm 이물 확인";
  const distorted = "FT-IR 측정 결과 85.0% 일치 및 0.5mm 이물 확인되었습니다.";
  const res = checkFactIntegrity(original, distorted);
  assert(res.hasWarnings === true, "Should detect number mismatch");
  assert(res.warnings.some((w) => w.type === "number"), "Warning type should be 'number'");
  console.log("  -> Number mismatch detected properly:", res.warnings.map(w => w.message));
}

// 2. Uncertainty to Certainty shift test (추정 -> 확정 왜곡)
{
  const original = "개봉 후 보관 중 외부 유입 가능성 추정됨";
  const distorted = "개봉 후 보관 중 외부 유입으로 확인되었습니다.";
  const res = checkFactIntegrity(original, distorted);
  assert(res.hasWarnings === true, "Should detect uncertainty to certainty shift");
  assert(res.warnings.some((w) => w.type === "uncertainty"), "Warning type should be 'uncertainty'");
  console.log("  -> Uncertainty shift detected properly:", res.warnings.map(w => w.message));
}

// 3. Hallucinated safety / non-detection test
{
  const original = "현품 표면에 흑색 점이 관찰됨.";
  const distorted = "현품 표면에 흑색 점이 관찰되었으며 유해 미생물 불검출 및 인체에 무해합니다.";
  const res = checkFactIntegrity(original, distorted);
  assert(res.hasWarnings === true, "Should detect ungrounded safety/non-detection assertion");
  assert(res.warnings.some((w) => w.type === "assertion"), "Warning type should be 'assertion'");
  console.log("  -> Ungrounded assertion detected properly:", res.warnings.map(w => w.message));
}

// 4. Perfect clean preservation test (No distortions)
{
  const original = "자사 보관 검체 10개 검사 결과 특이사항 없음. 보관온도 4℃ 유지.";
  const polished = "자사 보관 검체 10개 검사 결과 특이사항은 확인되지 않았습니다. 보관온도 4℃를 유지하였습니다.";
  const res = checkFactIntegrity(original, polished);
  assert(res.hasWarnings === false, "Clean preservation should pass with no warnings");
  console.log("  -> Clean preservation passed zero-distortion check");
}

console.log("\n=== [2] Safe Rule-Based Polish Engine Tests ===");

// 5. Safe rule polish with uncertainty
{
  const raw = "개봉 후 유입된 것 같음";
  const polished = safeRuleBasedPolish(raw);
  assert(polished.includes("사료됩니다") || polished.includes("추정됩니다"), "Should convert '것 같음' to '사료/추정됩니다'");
  assert(!polished.includes("확인하였습니다"), "Must NOT append confirmation '확인하였습니다'");
  console.log("  -> Raw:", raw, "=> Polished:", polished);
}

// 6. Safe rule polish with numbers & units
{
  const raw = "금속검출기 감도 Fe 1.2mm, SUS 1.5mm 체크해보니 정상임";
  const polished = safeRuleBasedPolish(raw);
  assert(polished.includes("1.2mm"), "Must preserve 1.2mm");
  assert(polished.includes("1.5mm"), "Must preserve 1.5mm");
  assert(!polished.includes("확인하였습니다"), "Must not blindly append confirmation");
  console.log("  -> Raw:", raw, "=> Polished:", polished);
}

// 7. Safe rule polish when unsure (원문 보존)
{
  const raw = "원인 규명 불가 상태임";
  const polished = safeRuleBasedPolish(raw);
  assert(polished.includes("원인 규명 불가"), "Must preserve '원인 규명 불가'");
  console.log("  -> Raw:", raw, "=> Polished:", polished);
}

console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
