import { resolve } from "node:path";

export async function verifyFoster({ browser, run, password, otp, fixture }) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const base = "http://localhost:5000";
  const aid = fixture.animals[0],
    other = fixture.animals[1];
  const login = async (name, pass, code = "") => {
    const response = await context.request.post(`${base}/login`, {
      headers: { Origin: base },
      form: { username: name, password: pass, onetimepass: code },
    });
    return response.text();
  };
  if ((await login("synthetic-portal-0", password)) !== "synthetic-portal-0")
    throw Error("Foster account login failed");
  await page.goto(`${base}/main`);
  await page.waitForURL("**/foster/account");
  await page
    .getByLabel("Current password", { exact: true })
    .first()
    .fill(password);
  await page
    .getByLabel("Six-digit authenticator code")
    .fill(otp("JBSWY3DPEHPK3PXP"));
  await page
    .getByRole("button", { name: "Verify and enable authenticator" })
    .click();
  await page.waitForURL("**/foster");
  if (
    !(await page
      .getByRole("heading", { name: "Your foster animals" })
      .isVisible())
  )
    throw Error("Foster enrolment did not reach real dashboard");
  for (const [label, width, height] of [
    ["desktop", 1440, 1000],
    ["tablet", 820, 1180],
    ["phone", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    for (const route of [
      "/foster",
      `/foster/animal/${aid}`,
      "/foster/account",
    ]) {
      const response = await page.goto(base + route);
      if (response.status() !== 200)
        throw Error(`Foster route failed ${route}`);
      if (
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        )
      )
        throw Error(`Foster overflow ${label} ${route}`);
      const text = await page.locator("body").innerText();
      if (
        /PRIVATE PORTAL TEST HISTORY|PRIVATE STAFF DIARY COMMENT|PRIVATE STAFF TASK|Synthetic portal resident 1/.test(
          text,
        )
      )
        throw Error("Foster private projection leaked");
    }
    await page.goto(`${base}/foster/animal/${aid}`);
    await page.screenshot({
      path: resolve(`docs/assets/platform/foster-${label}.png`),
      fullPage: true,
    });
  }
  await page.goto(`${base}/foster`);
  await page.keyboard.press("Tab");
  if ((await page.locator(":focus").innerText()) !== "Skip to content")
    throw Error("Foster keyboard skip failed");
  await page.keyboard.press("Enter");
  if ((await page.locator(":focus").getAttribute("id")) !== "main")
    throw Error("Foster skip target failed");
  for (const route of [
    "/animal_find_results",
    "/config.js",
    "/media",
    "/report",
    "/diary",
    `/foster/animal/${other}`,
    `/foster/photo/${other}`,
  ]) {
    const response = await context.request.get(base + route, {
      maxRedirects: 0,
    });
    if (response.status() !== 403)
      throw Error(`Foster native/object boundary failed ${route}`);
  }
  const photo = await context.request.get(`${base}/foster/photo/${aid}`);
  if (
    photo.status() !== 200 ||
    !photo.headers()["content-type"].startsWith("image/jpeg")
  )
    throw Error("Assigned foster photo failed");
  await page.goto(`${base}/foster/animal/${aid}`);
  await page.getByText("Mark task completed", { exact: true }).click();
  await page.getByRole("button", { name: "Confirm task completed" }).click();
  await page.waitForURL("**/foster/animal/*?saved=1");
  if (
    !(await page.getByRole("status").innerText()).includes(
      "does not record medication",
    )
  )
    throw Error("Foster task confirmation failed");
  const observation =
    "Synthetic browser observation: appetite and comfort reviewed. <img src=x onerror=window.portalProbe=1>";
  await page.getByLabel("Your observation").fill(observation);
  const form = page.locator('form:has(textarea[name="text"])');
  const values = await form.evaluate((node) =>
    Object.fromEntries(new FormData(node)),
  );
  await page.getByRole("button", { name: "Save for staff review" }).click();
  await page.waitForURL("**/foster/animal/*?saved=1");
  if (
    !(await page.getByRole("status").innerText()).includes(
      "saved for staff review",
    )
  )
    throw Error("Foster observation confirmation failed");
  if (await page.evaluate(() => window.portalProbe === 1))
    throw Error("Observation executed markup");
  const replay = await context.request.post(`${base}/foster/animal/${aid}`, {
    headers: { Origin: base },
    form: values,
    maxRedirects: 0,
  });
  if (replay.status() !== 303) throw Error("Foster replay did not reconcile");
  const counts = JSON.parse(
    run([
      "-c",
      `import json; from shelter.core import database; d=database(); print(json.dumps([d.query_int("SELECT COUNT(*) FROM tw_action_receipt WHERE Kind='observation' AND ActorID=?",[${fixture.users[0]}]),d.query_int("SELECT COUNT(*) FROM diary WHERE Subject='Review foster observation' AND LinkType=1 AND LinkID=?",[${aid}])]))`,
    ]),
  );
  if (counts[0] !== 1 || counts[1] !== 1)
    throw Error("Foster retry duplicated canonical records");
  run([
    "-c",
    `from shelter.core import database; d=database(); d.update('adoption',${fixture.movements[0]},{'ReturnDate':d.today()})`,
  ]);
  for (const route of [`/foster/animal/${aid}`, `/foster/photo/${aid}`]) {
    if ((await context.request.get(base + route)).status() !== 403)
      throw Error("Returned foster access retained");
  }
  const retryAfterReturn = await context.request.post(
    `${base}/foster/animal/${aid}`,
    { headers: { Origin: base }, form: values, maxRedirects: 0 },
  );
  if (retryAfterReturn.status() !== 403)
    throw Error("Returned foster write retained");
  await page.goto(`${base}/foster`);
  if (
    !(await page
      .getByRole("heading", { name: "No current foster placements" })
      .isVisible())
  )
    throw Error("Foster empty state failed");
  await page.goto(`${base}/foster/account`);
  const newPassword = password + "-changed-portal";
  await page.getByLabel("Current password", { exact: true }).fill(password);
  await page.getByLabel("New passphrase").fill(newPassword);
  await page
    .getByRole("button", { name: "Change password and sign out" })
    .click();
  await page.waitForURL("**/login");
  if (
    (await login("synthetic-portal-0", password, otp("JBSWY3DPEHPK3PXP"))) !==
    "FAIL"
  )
    throw Error("Old foster password accepted");
  if (
    (await login(
      "synthetic-portal-0",
      newPassword,
      otp("JBSWY3DPEHPK3PXP"),
    )) !== "synthetic-portal-0"
  )
    throw Error("Changed foster password failed");
  await page.goto(`${base}/foster`);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.waitForURL("**/login");
  await context.close();
  console.log(
    "Foster portal: real enrolment, 3 sizes, keyboard, object/native boundaries, canonical observation/replay/task, return revocation and password/logout passed",
  );
}
