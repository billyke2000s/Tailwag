import { chromium } from "@playwright/test";
import { verifyFoster } from "./foster-browser.mjs";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { randomBytes, createHmac } from "node:crypto";
const root = resolve("platform"),
  python = resolve(".venv/bin/python"),
  temp = mkdtempSync(`${tmpdir()}/tailwag-browser-`);
const password = randomBytes(24).toString("hex");
const env = {
  ...process.env,
  DEBUG: "true",
  TZ: "UTC",
  SECRET_KEY: randomBytes(48).toString("hex"),
  ADMIN_PASSWORD: password,
  DEMO_DATA: "true",
  ASM3_CONF: `${temp}/asm3.conf`,
  CORE_CACHE_DIR: `${temp}/cache`,
  PGDATABASE: `${temp}/core.sqlite3`,
  PORTAL_DB_PATH: `${temp}/portal.sqlite3`,
  STAFF_URL: "http://localhost:5000",
  FOSTER_PORTAL_ENABLED: "true",
};
delete env.PGHOST;
const servers = [];
let browser;
function run(args) {
  const r = spawnSync(python, args, { cwd: root, env, encoding: "utf8" });
  if (r.status !== 0)
    throw Error(`Setup failed: ${args.join(" ")}\n${r.stderr}`);
  return r.stdout.trim();
}
async function ready(url) {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw Error(`Server not ready: ${url}`);
}
function otp(secret) {
  let bits = "";
  for (const c of secret.replace(/=+$/, "").toUpperCase())
    bits += "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
      .indexOf(c)
      .toString(2)
      .padStart(5, "0");
  const key = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const digest = createHmac("sha1", key).update(counter).digest();
  const i = digest[19] & 15;
  return ((digest.readUInt32BE(i) & 0x7fffffff) % 1000000)
    .toString()
    .padStart(6, "0");
}
try {
  for (const args of [
    ["scripts/configure.py"],
    ["manage.py", "migrate", "--noinput"],
    ["scripts/bootstrap.py"],
    ["scripts/upgrade-core.py"],
    ["scripts/seed-demo.py"],
    ["scripts/run-jobs.py"],
    ["manage.py", "collectstatic", "--noinput"],
  ])
    run(args);
  run([
    "-c",
    "from shelter.core import database; import asm3.users,asm3.utils,os; d=database(); roles=['Care team','Veterinary team','Placement team','Volunteer','Finance']; [(lambda r: d.update('users',asm3.users.insert_user_from_form(d,'browser-test',asm3.utils.PostedData({'username':'synthetic-'+r.lower().split()[0],'realname':'Synthetic role test','password':os.environ['ADMIN_PASSWORD'],'roles':str(d.query_int('SELECT ID FROM role WHERE RoleName = ?',[r]))},'en_GB')),{'EnableTOTP':1,'OTPSecret':'JBSWY3DPEHPK3PXP'}))(r) for r in roles]",
  ]);
  run([
    "-c",
    "from shelter.core import database; import asm3.utils; d=database(); d.insert('templatedocument',{'ID':900000,'Name':'synthetic-browser.html','Path':'/','ShowAt':'everywhere','Content':asm3.utils.base64encode('<p>Synthetic agreement fixture</p>')},generateID=False)",
  ]);
  run([
    "-c",
    "from shelter.core import database; import asm3.users,asm3.utils,os; d=database(); r=d.query_int(\"SELECT ID FROM role WHERE RoleName = 'Veterinary team'\"); u=asm3.users.insert_user_from_form(d,'browser-test',asm3.utils.PostedData({'username':'synthetic-restricted','realname':'Synthetic restricted test','password':os.environ['ADMIN_PASSWORD'],'roles':str(r),'locationfilter':'-32'},'en_GB')); d.update('users',u,{'EnableTOTP':1,'OTPSecret':'JBSWY3DPEHPK3PXP'})",
  ]);
  run([
    "-c",
    "from shelter.core import database; import asm3.configuration; d=database(); asm3.configuration.cset(d,'PDFInline','No'); asm3.configuration.cset(d,'JSWindowPrint','No')",
  ]);
  const fosterFixture = JSON.parse(
    run([
      "-c",
      "import json,os; from shelter.core import database; from tests.foster_fixture import create; print(json.dumps(create(database(),os.environ['ADMIN_PASSWORD'])))",
    ]),
  );
  const activeReportID = Number(
    run([
      "-c",
      "from shelter.core import database; print(database().query_int(\"SELECT ID FROM customreport WHERE Title = 'Active Fosters'\"))",
    ]),
  );
  if (!activeReportID) throw Error("Sensitive report fixture missing");
  for (const [port, app] of [
    [8000, "shelter.wsgi:application"],
    [5000, "staff_wsgi:application"],
  ])
    servers.push(
      spawn(
        python,
        [
          "-m",
          "gunicorn",
          "--bind",
          `127.0.0.1:${port}`,
          "--workers",
          "1",
          "--threads",
          "4",
          app,
        ],
        { cwd: root, env, stdio: "ignore" },
      ),
    );
  await Promise.all([
    ready("http://localhost:8000/health/"),
    ready("http://localhost:5000/login"),
  ]);
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
    args: ["--no-sandbox"],
  });
  const mainContext = await browser.newContext();
  const page = await mainContext.newPage();
  mkdirSync("docs/assets/platform", { recursive: true });
  let checked = 0;
  for (const [label, width, height] of [
    ["desktop", 1440, 1000],
    ["tablet", 820, 1180],
    ["phone", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    for (const route of ["/", "/animals/", "/apply/foster/", "/privacy/"]) {
      const response = await page.goto(`http://localhost:8000${route}`);
      if (response.status() !== 200) throw Error(`Bad route ${route}`);
      if (
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        )
      )
        throw Error(`Overflow ${label} ${route}`);
      checked++;
    }
    await page.goto("http://localhost:8000/");
    await page.screenshot({
      path: `docs/assets/platform/public-${label}.png`,
      fullPage: true,
    });
  }
  await page.goto("http://localhost:8000/apply/contact/");
  await page.locator("#id_first_name").fill("Synthetic");
  await page.locator("#id_last_name").fill("Browser Test");
  await page.locator("#id_email").fill("browser-test@example.invalid");
  await page
    .locator("#id_message")
    .fill("Synthetic browser verification enquiry.");
  await page.locator("#id_privacy").check();
  await page.getByRole("button", { name: /Send enquiry/ }).click();
  await page.getByRole("heading", { name: /We have your message/i }).waitFor();
  await page.goto("http://localhost:8000/");
  await page.keyboard.press("Tab");
  if (
    !(await page
      .locator(".skip")
      .evaluate((el) => el === document.activeElement))
  )
    throw Error("Skip link is not first keyboard focus");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://localhost:5000/login");
  await page.locator("#username").fill("care-admin");
  await page.locator("#password").fill(password);
  await page.locator("#loginbutton").click();
  await page.waitForURL(/change_user_settings/);
  await page.getByRole("tab", { name: "Security", exact: true }).click();
  await page.locator("#button-enable2fa").click();
  await page.locator("#twofavalidcode").waitFor();
  const secret = await page.evaluate(() => controller.user.OTPSECRET);
  await page.locator("#twofavalidcode").pressSequentially(otp(secret));
  const saved = page.waitForResponse(
    (r) =>
      r.url().includes("change_user_settings") &&
      r.request().method() === "POST",
  );
  await page.locator("#button-save").click();
  const saveResponse = await saved;
  if (saveResponse.status() !== 200) throw Error("TOTP save rejected");
  await page.waitForFunction(
    () =>
      typeof controller !== "undefined" &&
      Number(controller.user?.ENABLETOTP) === 1,
  );
  await page.goto("http://localhost:5000/main");
  await page.locator("#asm-content").waitFor();
  if (page.url().includes("force2fa"))
    throw Error("TOTP enrolment did not persist");
  await page.waitForTimeout(400);
  if (await page.locator("#force2fa:visible").count())
    throw Error("Forced enrolment screen remained");
  const close = page.getByRole("button", { name: "Close", exact: true });
  if (await close.count()) {
    await close.last().click();
    await page.locator("#dialog-welcome").waitFor({ state: "hidden" });
  }
  await page.waitForTimeout(300);
  for (const [label, width, height] of [
    ["desktop", 1440, 1000],
    ["tablet", 820, 1180],
    ["phone", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.screenshot({
      path: `docs/assets/platform/staff-${label}.png`,
      fullPage: true,
    });
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      )
    )
      throw Error(
        `Staff overflow ${label}: ${JSON.stringify(
          await page.evaluate(() =>
            Array.from(document.querySelectorAll("body *"))
              .filter(
                (e) =>
                  e.getBoundingClientRect().right > innerWidth + 1 &&
                  getComputedStyle(e).display !== "none",
              )
              .slice(0, 12)
              .map((e) => ({
                tag: e.tagName,
                id: e.id,
                cl: e.className,
                w: e.getBoundingClientRect().width,
                right: e.getBoundingClientRect().right,
              })),
          ),
        )}`,
      );
  }
  const versions = await page.evaluate(() => ({
    jquery: jQuery.fn.jquery,
    jqueryUI: jQuery.ui.version,
    moment: moment.version,
    tinymce: tinymce.majorVersion + "." + tinymce.minorVersion,
  }));
  if (
    versions.jquery !== "3.7.1" ||
    versions.jqueryUI !== "1.14.2" ||
    versions.moment !== "2.31.0" ||
    versions.tinymce !== "8.10.0"
  )
    throw Error("Unexpected browser-library version");
  const editor = await page.context().newPage();
  await editor.goto("http://localhost:5000/document_template_edit?dtid=900000");
  await editor.waitForFunction(
    () => typeof tinymce !== "undefined" && tinymce.activeEditor?.initialized,
  );
  await editor.evaluate(() => {
    window.__tailwagXSS = false;
    tinymce.activeEditor.setContent(
      '<p>Synthetic sanitisation check</p><img src="data:image/png;base64,bad" onerror="window.top.__tailwagXSS=true">',
    );
  });
  if (
    await editor.evaluate(
      () =>
        window.__tailwagXSS ||
        tinymce.activeEditor.getContent().includes("onerror"),
    )
  )
    throw Error("Editor sanitisation failed");
  await editor
    .frameLocator("iframe.tox-edit-area__iframe")
    .locator("body")
    .fill("Synthetic agreement saved through the real editor.");
  await editor.waitForTimeout(1100);
  await editor.getByRole("button", { name: /^Save/ }).click();
  await editor.waitForURL(/document_templates/);
  await editor.goto("http://localhost:5000/document_template_edit?dtid=900000");
  await editor.waitForFunction(
    () => typeof tinymce !== "undefined" && tinymce.activeEditor?.initialized,
  );
  if (
    !(await editor.evaluate(() =>
      tinymce.activeEditor
        .getContent()
        .includes("Synthetic agreement saved through the real editor."),
    ))
  )
    throw Error("Editor save did not persist");
  await editor.screenshot({
    path: "docs/assets/platform/document-editor.png",
    fullPage: true,
  });
  const pdfResponsePromise = editor.waitForResponse(
    (r) =>
      r.url().includes("/document_template_edit") &&
      r.request().method() === "POST",
  );
  const pdfDownloadPromise = editor.waitForEvent("download");
  await editor
    .getByRole("button", { name: "View this document as a PDF", exact: true })
    .click();
  const pdfResponse = await pdfResponsePromise;
  if (
    pdfResponse.status() !== 200 ||
    !pdfResponse.headers()["content-type"]?.includes("application/pdf")
  )
    throw Error("Real document PDF export failed");
  const download = await pdfDownloadPromise;
  const pdfPath = `${temp}/synthetic-agreement.pdf`;
  await download.saveAs(pdfPath);
  const extracted = spawnSync("pdftotext", [pdfPath, "-"], {
    encoding: "utf8",
  });
  if (
    extracted.status !== 0 ||
    !extracted.stdout.includes(
      "Synthetic agreement saved through the real editor.",
    )
  )
    throw Error("Downloaded PDF is missing editor content");
  const printResponsePromise = editor.waitForResponse(
    (r) =>
      r.url().includes("/document_template_edit") &&
      r.request().method() === "POST",
  );
  await editor.getByRole("button", { name: "Print", exact: true }).click();
  const printResponse = await printResponsePromise;
  if (
    printResponse.status() !== 200 ||
    !printResponse.headers()["content-security-policy"]?.includes("sandbox")
  )
    throw Error("Print preview policy missing");
  await editor
    .getByText("Use your browser Print command.", { exact: false })
    .waitFor();
  await editor.setViewportSize({ width: 1440, height: 1000 });
  await editor.screenshot({
    path: "docs/assets/platform/print-preview.png",
    fullPage: true,
  });
  const previewProbe = await editor.context().newPage();
  await previewProbe.goto("http://localhost:5000/main");
  const probeResponsePromise = previewProbe.waitForResponse(
    (r) =>
      r.url().includes("/document_template_edit") &&
      r.request().method() === "POST",
  );
  await previewProbe.evaluate(() => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/document_template_edit";
    const values = {
      mode: "print",
      dtid: "900000",
      document:
        '<p>Synthetic print probe</p><img src="data:image/png;base64,bad" onerror="window.__twPrintXSS=true">',
    };
    for (const [name, value] of Object.entries(values)) {
      const input = document.createElement("input");
      input.name = name;
      input.value = value;
      form.append(input);
    }
    document.body.append(form);
    form.submit();
  });
  const probeResponse = await probeResponsePromise;
  if (probeResponse.status() !== 200) throw Error("Print probe did not render");
  await previewProbe
    .getByText("Synthetic print probe", { exact: true })
    .waitFor();
  if (await previewProbe.evaluate(() => Boolean(window.__twPrintXSS)))
    throw Error("Print preview event handler executed");
  if ((await previewProbe.evaluate(() => window.origin)) !== "null")
    throw Error("Print preview did not receive an opaque sandbox origin");
  await previewProbe.close();
  await editor.close();
  const oldAsset = await page.request.get(
    "http://localhost:5000/static/lib/tinymce/5.5.1/tinymce/js/tinymce/tinymce.min.js",
  );
  if (oldAsset.status() !== 404)
    throw Error("Vulnerable legacy asset is still served");
  const careFixture = JSON.parse(
    run([
      "-c",
      `
from shelter.core import database
import asm3.medical, asm3.stock, asm3.utils, asm3.i18n, json
from shelter.care import record_care
assert __import__('os').environ['DEMO_DATA'] == 'true'
d = database(); date = asm3.i18n.python2display('en_GB', d.today())
ids = []
for i in range(3):
    regimen = asm3.medical.insert_regimen_from_form(d, 'browser-test', asm3.utils.PostedData({'animal':str(2 if i == 2 else 1),'startdate':date,'treatmentname':'Synthetic browser care '+str(i),'dosage':'Synthetic text only; no dose','singlemulti':'0','treatmentrule':'0','status':'0'},'en_GB'))
    ids.append(d.query_int('SELECT ID FROM animalmedicaltreatment WHERE AnimalMedicalID = ?', [regimen]))
stock = asm3.stock.insert_stocklevel_from_form(d, asm3.utils.PostedData({'name':'Synthetic browser supply','unitname':'synthetic units','balance':'10','total':'10','usagedate':date,'usagetype':'1','location':'1'},'en_GB'), 'browser-test')
print(json.dumps({'ids':ids,'stock':stock,'date':date}))
`,
    ]),
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  const selectCare = async (id) => {
    await page.goto("http://localhost:5000/animal_medical?id=1");
    await page.waitForFunction(
      (id) =>
        typeof controller !== "undefined" &&
        controller.rows?.some((row) => row.TREATMENTID === id),
      id,
    );
    const row = await page.evaluate(
      (id) => controller.rows.find((row) => row.TREATMENTID === id),
      id,
    );
    await page
      .locator('input[type="checkbox"][data-id="' + row.COMPOSITEID + '"]')
      .check();
    return row;
  };
  const originalCare = await selectCare(careFixture.ids[0]);
  await page.locator("#button-given").click();
  const careDialog = page.getByRole("dialog", {
    name: "Save care record",
    exact: true,
  });
  await careDialog.waitFor();
  await page.locator("#item").selectOption(String(careFixture.stock));
  await page.locator("#quantity").fill("2");
  await page.locator("#usagetype").selectOption("1");
  await page
    .locator("#treatmentcomments")
    .fill("Synthetic browser administration");
  const saveCare = async () => {
    const response = page.waitForResponse(
      (r) => r.url().endsWith("/medical") && r.request().method() === "POST",
    );
    await careDialog
      .getByRole("button", { name: "Save care record", exact: true })
      .click();
    const savedResponse = await response;
    if (savedResponse.status() !== 200)
      throw Error(
        "Care dialog save failed: " +
          savedResponse.status() +
          " " +
          (await savedResponse.text()).slice(0, 300),
      );
    await careDialog.waitFor({ state: "hidden" });
  };
  await saveCare();
  const clinicalPost = (form) =>
    page.request.post("http://localhost:5000/medical", {
      headers: { Origin: "http://localhost:5000" },
      form,
    });
  const repeated = await Promise.all(
    [0, 1].map(() =>
      clinicalPost({
        mode: "given",
        ids: String(careFixture.ids[1]),
        newdate: careFixture.date,
        item: String(careFixture.stock),
        quantity: "2",
        usagetype: "1",
        givenby: "Synthetic browser carer",
      }),
    ),
  );
  if (
    repeated
      .map((r) => r.status())
      .sort()
      .join(",") !== "200,400"
  )
    throw Error("Concurrent care completion was not guarded");
  const staleCare = await clinicalPost({
    mode: "given",
    ids: String(careFixture.ids[0]),
    newdate: careFixture.date,
    item: "-1",
    recordaction: "correct",
    correctionreason: "Synthetic stale correction",
    recordversions: JSON.stringify({
      [careFixture.ids[0]]: originalCare.CAREVERSION,
    }),
  });
  if (staleCare.status() !== 400)
    throw Error("Stale care correction was accepted");
  await selectCare(careFixture.ids[0]);
  await page.locator("#button-given").click();
  await page.locator("#recordaction").selectOption("correct");
  await page
    .getByLabel("Correction reason", { exact: true })
    .fill("Synthetic browser correction reason");
  await page
    .locator("#treatmentcomments")
    .fill("Synthetic corrected browser note");
  if (await careDialog.locator(".tagstock:visible").count())
    throw Error("Correction exposes stock deduction controls");
  for (const [label, width, height] of [
    ["desktop", 1440, 1000],
    ["tablet", 820, 1180],
    ["phone", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(100);
    if (
      await careDialog.evaluate(
        (element) => element.scrollWidth > element.clientWidth + 1,
      )
    )
      throw Error("Care dialog overflow: " + label);
    await page.screenshot({
      path: `docs/assets/platform/care-correction-${label}.png`,
      fullPage: true,
    });
  }
  await saveCare();
  await selectCare(careFixture.ids[0]);
  await page.locator("#button-undo").click();
  await careDialog.waitFor();
  if ((await page.locator("#recordaction").inputValue()) !== "undo")
    throw Error("Explicit care clear action missing");
  await page
    .getByLabel("Correction reason", { exact: true })
    .fill("Synthetic erroneous completion correction");
  await saveCare();
  run([
    "-c",
    `from shelter.core import database; d=database(); assert d.query_date('SELECT DateGiven FROM animalmedicaltreatment WHERE ID = ?',[${careFixture.ids[0]}]) is None; assert 'Synthetic erroneous completion correction' in d.query_string('SELECT Comments FROM animalmedicaltreatment WHERE ID = ?',[${careFixture.ids[0]}]); assert d.query_float('SELECT Balance FROM stocklevel WHERE ID = ?',[${careFixture.stock}])==6; assert d.query_int('SELECT COUNT(*) FROM stockusage WHERE StockLevelID = ?',[${careFixture.stock}])==3; assert d.query_int('SELECT COUNT(*) FROM audittrail WHERE TableName = ? AND LinkID = ? AND UserName = ?',['animalmedicaltreatment',${careFixture.ids[0]},'care-admin'])>=3`,
  ]);
  const restrictedContext = await browser.newContext();
  await restrictedContext.request.get("http://localhost:5000/login");
  const restrictedLogin = await restrictedContext.request.post(
    "http://localhost:5000/login",
    {
      headers: { Origin: "http://localhost:5000" },
      form: {
        username: "synthetic-restricted",
        password,
        onetimepass: otp("JBSWY3DPEHPK3PXP"),
        database: "",
      },
    },
  );
  if (restrictedLogin.status() !== 200)
    throw Error("Restricted care account sign-in failed");
  const restrictedGet = await restrictedContext.request.get(
    "http://localhost:5000/animal_medical?id=1",
  );
  const restrictedWrite = await restrictedContext.request.post(
    "http://localhost:5000/medical",
    {
      headers: { Origin: "http://localhost:5000" },
      form: {
        mode: "given",
        ids: String(careFixture.ids[0]),
        newdate: careFixture.date,
        item: "-1",
      },
    },
  );
  if (restrictedGet.status() !== 403 || restrictedWrite.status() !== 403)
    throw Error("Clinical animal object boundary failed");
  const allowedClinicalWrite = await restrictedContext.request.post(
    "http://localhost:5000/medical",
    {
      headers: { Origin: "http://localhost:5000" },
      form: {
        mode: "given",
        ids: String(careFixture.ids[2]),
        newdate: careFixture.date,
        item: "-1",
      },
    },
  );
  if (allowedClinicalWrite.status() !== 200)
    throw Error("Authorised assigned-animal completion failed");
  await restrictedContext.close();
  const fosterPerson = Number(
    run([
      "-c",
      "from shelter.core import database; import asm3.person,asm3.utils; d=database(); p=asm3.person.insert_person_from_form(d,asm3.utils.PostedData({'surname':'Synthetic concurrency household','forenames':'Test'},'en_GB'),'browser-test',geocode=False); d.update('owner',p,{'IDCheck':1,'IsFosterer':1,'FosterCapacity':1}); print(p)",
    ]),
  );
  const fosterDate = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
  }).format(new Date());
  const fosterRequest = (animal) =>
    page.request.post("http://localhost:5000/move_foster", {
      headers: { Origin: "http://localhost:5000" },
      form: {
        mode: "create",
        animal: String(animal),
        person: String(fosterPerson),
        fosterdate: fosterDate,
      },
    });
  const moves = await Promise.all([fosterRequest(1), fosterRequest(2)]);
  if (
    moves
      .map((r) => r.status())
      .sort()
      .join(",") !== "200,400"
  )
    throw Error(
      "Concurrent foster capacity was not enforced: " +
        moves.map((r) => r.status()).join(","),
    );
  const winner = moves[0].status() === 200 ? 1 : 2;
  const loser = winner === 1 ? 2 : 1;
  const moveID = Number(await moves[winner - 1].text());
  if (!moveID) throw Error("Foster movement ID missing");
  const forged = await page.request.post("http://localhost:5000/move_adopt", {
    headers: { Origin: "http://localhost:5000" },
    form: {
      mode: "create",
      animal: String(winner),
      person: String(fosterPerson),
      movementdate: fosterDate,
      returndate: fosterDate,
      movementid: String(moveID),
    },
  });
  if (forged.status() !== 400)
    throw Error("Ignored adoption fields bypassed the guard");
  run([
    "-c",
    `from shelter.core import database; import asm3.movement; d=database(); assert d.query_int("SELECT COUNT(*) FROM adoption WHERE OwnerID = ? AND ReturnDate IS NULL",[${fosterPerson}])==1; assert d.query_date("SELECT ReturnDate FROM adoption WHERE ID = ?",[${moveID}]) is None; asm3.movement.return_movement(d,${moveID},'browser-test',returndate=d.today())`,
  ]);
  const afterReturn = await fosterRequest(loser);
  if (afterReturn.status() !== 200)
    throw Error("Explicit return did not release foster capacity");
  run([
    "-c",
    `from shelter.core import database; d=database(); assert d.query_int("SELECT COUNT(*) FROM adoption WHERE OwnerID = ?",[${fosterPerson}])==2; assert d.query_date("SELECT ReturnDate FROM adoption WHERE ID = ?",[${moveID}]) is not None`,
  ]);
  await page.goto("http://localhost:5000/change_password");
  await page.locator("#oldpassword").fill(password);
  const changedPassword = randomBytes(24).toString("hex");
  await page.locator("#newpassword").fill(changedPassword);
  await page.locator("#confirmpassword").fill(changedPassword);
  await page.locator("#button-change").click();
  await page
    .getByText("Password successfully changed.", { exact: true })
    .waitFor();
  const revoked = await page.request.get("http://localhost:5000/main", {
    maxRedirects: 0,
  });
  if (
    revoked.status() !== 303 ||
    !revoked.headers()["location"]?.includes("/login")
  )
    throw Error("Changed password did not revoke the old session");
  const recoveryGet = await page.request.get(
    "http://localhost:5000/reset_password?token=synthetic",
  );
  if (recoveryGet.status() !== 403)
    throw Error("Legacy recovery GET is reachable");
  const recoveryPost = await page.request.post("http://localhost:5000/login", {
    headers: { Origin: "http://localhost:5000" },
    form: { mode: "reset", username: "care-admin", database: "" },
  });
  if (recoveryPost.status() !== 403)
    throw Error("Legacy email recovery POST is reachable");
  let roleBoundaries = 0;
  const matrix = {
    care: [200, 403, 200, 403, 403, 403, 403],
    veterinary: [200, 403, 200, 403, 403, 403, 403],
    placement: [200, 200, 403, 200, 403, 403, 403],
    volunteer: [200, 403, 403, 403, 403, 403, 403],
    finance: [403, 403, 403, 403, 403, 403, 200],
  };
  const routes = [
    "animal?id=1",
    "person_find",
    "animal_medical?id=1",
    "animal_movements?id=1",
    "systemusers",
    "sql",
    "reports",
  ];
  for (const [role, statuses] of Object.entries(matrix)) {
    const context = await browser.newContext();
    await context.request.get("http://localhost:5000/login");
    const login = await context.request.post("http://localhost:5000/login", {
      headers: { Origin: "http://localhost:5000" },
      form: {
        username: "synthetic-" + role,
        password,
        onetimepass: otp("JBSWY3DPEHPK3PXP"),
      },
    });
    const loginText = await login.text();
    if (
      login.status() !== 200 ||
      ["FAIL", "ASK2FA", "BAD2FA"].includes(loginText.trim())
    )
      throw Error("Role sign-in failed: " + role);
    for (let i = 0; i < routes.length; i++) {
      const response = await context.request.get(
        "http://localhost:5000/" + routes[i],
      );
      if (response.status() !== statuses[i])
        throw Error(
          `Role boundary ${role} ${routes[i]}: ${response.status()} expected ${statuses[i]}`,
        );
      roleBoundaries++;
    }
    if (role === "finance") {
      const report = await context.request.get(
        "http://localhost:5000/report?id=" + activeReportID,
      );
      if (report.status() !== 403)
        throw Error("Finance can view foster health report");
      roleBoundaries++;
    }
    const denied = await context.request.post("http://localhost:5000/sql", {
      headers: { Origin: "http://localhost:5000" },
      form: { mode: "exec", sql: "SELECT 1" },
    });
    if (denied.status() !== 403) throw Error("SQL write boundary: " + role);
    roleBoundaries++;
    if (role === "volunteer") {
      run([
        "-c",
        "from shelter.core import database; d=database(); d.execute(\"UPDATE role SET SecurityMap = '' WHERE RoleName = 'Volunteer'\")",
      ]);
      const revokedRole = await context.request.get(
        "http://localhost:5000/main",
        {
          maxRedirects: 0,
        },
      );
      if (
        revokedRole.status() !== 303 ||
        !revokedRole.headers()["location"]?.includes("/login")
      )
        throw Error("Changed role did not revoke cached permissions");
    }
    await context.close();
  }
  const forbidden = await page.request.post("http://localhost:5000/login", {
    headers: { Origin: "https://untrusted.example" },
    form: { username: "care-admin", password: "invalid" },
  });
  if (forbidden.status() !== 403) throw Error("Foreign origin not blocked");
  // Use a fresh synthetic staff process for the separate carer suite. The login
  // abuse limiter remains unchanged; prior staff tests deliberately use many accounts.
  const staffProcess = servers[1];
  staffProcess.kill("SIGTERM");
  await new Promise((done) => staffProcess.once("exit", done));
  servers.push(
    spawn(
      python,
      [
        "-m",
        "gunicorn",
        "--bind",
        "127.0.0.1:5000",
        "--workers",
        "1",
        "--threads",
        "4",
        "staff_wsgi:application",
      ],
      { cwd: root, env, stdio: "ignore" },
    ),
  );
  await ready("http://localhost:5000/login");
  await verifyFoster({ browser, run, password, otp, fixture: fosterFixture });
  console.log(
    JSON.stringify({
      publicRoutes: checked,
      enquiry: "passed",
      keyboardSkip: "passed",
      staffLoginAndTOTP: "passed",
      staffViewports: 3,
      roleBoundaries,
      documentSave: "passed",
      documentPDFExport: "passed",
      sandboxedPrintPreview: "passed",
      passwordChange: "passed",
      credentialSessionRevocation: "passed",
      privilegeSessionRevocation: "passed",
      legacyEmailRecovery: "blocked",
      editorSanitization: "passed",
      browserAssetVersions: versions,
      reviewedDailyJobs: "passed",
      concurrentFosterCapacity: "passed",
      careCompletionAndCorrection: "passed",
      concurrentCareStock: "passed",
      staleCareCorrection: "blocked",
      careDialogViewports: 3,
      clinicalObjectBoundary: "passed",
      explicitReturnHistory: "passed",
      ignoredWorkflowFields: "blocked",
      foreignOrigin: "blocked",
    }),
  );
} finally {
  if (browser) await browser.close();
  for (const child of servers) {
    if (child.exitCode === null) {
      child.kill("SIGTERM");
      await new Promise((r) => child.once("exit", r));
    }
  }
  rmSync(temp, { recursive: true, force: true });
}
