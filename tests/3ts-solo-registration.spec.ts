import { test, expect } from "@playwright/test";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_EMAIL = `3ts-solo-${Date.now()}@playwright-test.com`;

test.describe.serial("3T's Solo registration", () => {

test("completes end to end and claims a slot", async ({
  page,
}) => {
  // Capture the slot count before registering, so we can confirm it
  // actually decremented afterward - this is the part most likely to
  // have a subtle bug, since it's the only piece with real atomic
  // transaction logic (claim_solo_slot RPC).
  const { count: beforeCount } = await supabaseAdmin
    .from("solo_3ts_slots")
    .select("*", { count: "exact", head: true })
    .eq("claimed", true);

  await page.goto("/register/hip-hop-dance");

  // NOTE: assumes the "groupInfo" step still shows Crew Name / City / State
  // fields for Solo (only the members step and fee are known to differ per
  // the prompts run tonight). If Crew Name isn't actually present for
  // Solo, this line will simply find nothing and Playwright will time out
  // here specifically - that's a useful signal pointing at exactly this
  // assumption being wrong.
  await page.getByLabel(/Solo/i).check();

  const crewNameField = page.getByLabel("Crew Name");
  if (await crewNameField.isVisible().catch(() => false)) {
    await crewNameField.fill("Playwright Solo Entry");
  }

  // Category should now show "College" / "Open" (not "College Crew" /
  // "Open Crew") per the label-swap change - selecting by value, not
  // visible text, to sidestep that specific wording entirely.
  await page.getByLabel("Category").selectOption("college");

  const institutionField = page.getByLabel(/College \/ University Name/i);
  if (await institutionField.isVisible().catch(() => false)) {
    await institutionField.fill("Test University");
  }

  await page.getByLabel("City").fill("Hyderabad");
  await page.getByLabel("State").fill("Telangana");

  await page.getByRole("button", { name: "Continue" }).click();

  // Solo participant details - single entrant, same field labels as a
  // crew member card.
  await page.getByLabel("Name").fill("Playwright Solo Test");
  await page.getByLabel("Phone").fill("9876543210");
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Age").fill("20");
  await page.getByLabel("Institution").fill("N/A");

  await page.setInputFiles(
    'input[type="file"]',
    path.join(__dirname, "fixtures", "test-id.jpg")
  );

  // These are required for BOTH Crew and Solo in the real form - no
  // format-based skip exists for them, confirmed against actual source.
  await page.getByLabel("Performance Duration").fill("2 minutes");
  await page.getByLabel("No").check(); // props used = No
  await page.getByLabel(/We agree to abide by the rules/i).check();
  await page.getByLabel(/All information provided is accurate/i).check();

  await page.getByRole("button", { name: "Continue to Payment" }).click();

  await expect(page.getByText("₹899")).toBeVisible();

  await page.getByLabel("Payee Name").fill("Playwright Payer");
  await page.getByLabel("Payee Mobile Number").fill("9999999999");
  await page.getByLabel(/UTR/i).fill("UTR123456789TEST");

  await page.setInputFiles(
    'input[type="file"]',
    path.join(__dirname, "fixtures", "test-payment.jpg")
  );

  await page.getByRole("button", { name: "Submit Registration" }).click();

  await expect(page.getByText("You're registered!")).toBeVisible({
    timeout: 15000,
  });

  // Confirm the slot count actually incremented by exactly 1.
  const { count: afterCount } = await supabaseAdmin
    .from("solo_3ts_slots")
    .select("*", { count: "exact", head: true })
    .eq("claimed", true);

  expect(afterCount).toBe((beforeCount ?? 0) + 1);

  // Confirm the row landed in crew_registrations with the right shape.
  const { data: registration } = await supabaseAdmin
    .from("crew_registrations")
    .select("*")
    .eq("format", "solo")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  expect(registration?.amount_paid).toBe(899);
  expect(registration?.member_count).toBe(1);
});

test("shows 'full' once all 10 slots are claimed", async ({
  page,
}) => {
  // Directly claim all 10 slots via the RPC (bypassing the UI) to test
  // the "full" state without submitting 10 real registrations through
  // the form.
  const fakeIds = Array.from({ length: 10 }, () => randomUUID());

  for (const id of fakeIds) {
    await supabaseAdmin.rpc("claim_solo_slot", { reg_id: id });
  }

  await page.goto("/register/hip-hop-dance");

  await expect(page.getByText(/Solo registration is full/i)).toBeVisible();

  // Cleanup: release the 10 slots this test claimed, so it doesn't
  // permanently block real Solo registrations.
  await supabaseAdmin
    .from("solo_3ts_slots")
    .update({ claimed: false, registration_id: null })
    .in("registration_id", fakeIds);
});

});
