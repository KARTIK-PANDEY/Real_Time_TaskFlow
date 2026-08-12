import { db } from "../db";
import { employees } from "../db/schema";
import { canSetTaskStatus } from "./permissions";
import { ensureSeedData } from "./dashboard-data";
import { eq } from "drizzle-orm";

async function runTests() {
  console.log("=== Initializing Test Environment ===");
  await ensureSeedData(true);

  const allDbEmployees = await db.select().from(employees);
  const employeeMap = Object.fromEntries(allDbEmployees.map(e => [e.name, e]));

  const mdUser = employeeMap["Sanjiv Rathi"];
  const managerAnita = employeeMap["Anita Sheikh"];
  const managerIrfan = employeeMap["Sheikh Irfan"];
  const managerSnehil = employeeMap["Snehil Khare"];
  const empLumeshwari = employeeMap["Lumeshwari Nirmal"];
  const empVenkatesh = employeeMap["S. Venkatesh Rao"];

  if (!mdUser || !managerAnita || !managerIrfan || !managerSnehil || !empLumeshwari || !empVenkatesh) {
    throw new Error("Missing seeded test employees in database.");
  }

  console.log("Seeded employees loaded successfully.");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}`);
      failed++;
    }
  }

  console.log("\n=== Starting Hierarchy Permission Tests ===");

  // Test Case 1: Employee self-completing task (should fail)
  const case1 = await canSetTaskStatus(
    { id: empLumeshwari.id, orgRole: empLumeshwari.orgRole },
    empLumeshwari.id,
    "completed"
  );
  assert(case1.allowed === false, "Employee (Lumeshwari) self-completing task should be blocked.");

  // Test Case 2: Employee setting status to In Review (should pass)
  const case2 = await canSetTaskStatus(
    { id: empLumeshwari.id, orgRole: empLumeshwari.orgRole },
    empLumeshwari.id,
    "review"
  );
  assert(case2.allowed === true, "Employee (Lumeshwari) setting task to review should be allowed.");

  // Test Case 3: Manager completing task for direct report (should pass)
  const case3 = await canSetTaskStatus(
    { id: managerAnita.id, orgRole: managerAnita.orgRole },
    empLumeshwari.id,
    "completed"
  );
  assert(case3.allowed === true, "Manager (Anita) completing task for direct report (Lumeshwari) should be allowed.");

  // Test Case 4: Manager completing task for someone outside reporting chain (should fail)
  const case4 = await canSetTaskStatus(
    { id: managerAnita.id, orgRole: managerAnita.orgRole },
    empVenkatesh.id,
    "completed"
  );
  assert(case4.allowed === false, "Manager (Anita) completing task outside reporting chain (Venkatesh) should be blocked.");

  // Test Case 5: Manager completing task for themselves (should pass)
  const case5 = await canSetTaskStatus(
    { id: managerAnita.id, orgRole: managerAnita.orgRole },
    managerAnita.id,
    "completed"
  );
  assert(case5.allowed === true, "Manager (Anita) completing task assigned to themselves should be allowed.");

  // Test Case 6: MD completing any task (should pass)
  const case6 = await canSetTaskStatus(
    { id: mdUser.id, orgRole: mdUser.orgRole },
    empVenkatesh.id,
    "completed"
  );
  assert(case6.allowed === true, "MD (Sanjiv Rathi) completing task for anyone (Venkatesh) should be allowed.");

  // Test Case 7: Manager completing task for indirect report 2+ levels down (should pass)
  const case7 = await canSetTaskStatus(
    { id: managerIrfan.id, orgRole: managerIrfan.orgRole },
    empVenkatesh.id, // S. Venkatesh Rao reports to Snehil Khare, who reports to Sheikh Irfan
    "completed"
  );
  assert(case7.allowed === true, "Manager (Irfan) completing task for indirect report 2+ levels down (Venkatesh) should be allowed.");

  console.log(`\n=== Test Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
