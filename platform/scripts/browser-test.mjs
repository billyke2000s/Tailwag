import { chromium } from '@playwright/test';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes, createHmac } from 'node:crypto';
const root=resolve('platform'), python=resolve('.venv/bin/python'), temp=mkdtempSync(`${tmpdir()}/tailwag-browser-`);
const password=randomBytes(24).toString('hex');
const env={...process.env,DEBUG:'true',TZ:'UTC',SECRET_KEY:randomBytes(48).toString('hex'),ADMIN_PASSWORD:password,DEMO_DATA:'true',ASM3_CONF:`${temp}/asm3.conf`,CORE_CACHE_DIR:`${temp}/cache`,PGDATABASE:`${temp}/core.sqlite3`,PORTAL_DB_PATH:`${temp}/portal.sqlite3`,STAFF_URL:'http://localhost:5000'};delete env.PGHOST;
const servers=[];let browser;
function run(args){const r=spawnSync(python,args,{cwd:root,env,encoding:'utf8'});if(r.status!==0)throw Error(`Setup failed: ${args.join(' ')}\n${r.stderr}`);}
async function ready(url){for(let i=0;i<100;i++){try{if((await fetch(url)).ok)return;}catch{}await new Promise(r=>setTimeout(r,200));}throw Error(`Server not ready: ${url}`);}
function otp(secret){let bits='';for(const c of secret.replace(/=+$/,'').toUpperCase())bits+='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(c).toString(2).padStart(5,'0');const key=Buffer.from(bits.match(/.{8}/g).map(b=>parseInt(b,2)));const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const digest=createHmac('sha1',key).update(counter).digest();const i=digest[19]&15;return ((digest.readUInt32BE(i)&0x7fffffff)%1000000).toString().padStart(6,'0');}
try{
 for(const args of [['scripts/configure.py'],['manage.py','migrate','--noinput'],['scripts/bootstrap.py'],['scripts/seed-demo.py'],['manage.py','collectstatic','--noinput']])run(args);
 for(const [port,app] of [[8000,'shelter.wsgi:application'],[5000,'staff_wsgi:application']])servers.push(spawn(python,['-m','gunicorn','--bind',`127.0.0.1:${port}`,'--workers','1','--threads','4',app],{cwd:root,env,stdio:'ignore'}));
 await Promise.all([ready('http://localhost:8000/health/'),ready('http://localhost:5000/login')]);
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 const page=await browser.newPage();mkdirSync('docs/assets/platform',{recursive:true});let checked=0;
 for(const [label,width,height] of [['desktop',1440,1000],['tablet',820,1180],['phone',390,844]]){
  await page.setViewportSize({width,height});
  for(const route of ['/','/animals/','/apply/foster/','/privacy/']){const response=await page.goto(`http://localhost:8000${route}`);if(response.status()!==200)throw Error(`Bad route ${route}`);if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error(`Overflow ${label} ${route}`);checked++;}
  await page.goto('http://localhost:8000/');await page.screenshot({path:`docs/assets/platform/public-${label}.png`,fullPage:true});
 }
 await page.goto('http://localhost:8000/apply/contact/');await page.locator('#id_first_name').fill('Synthetic');await page.locator('#id_last_name').fill('Browser Test');await page.locator('#id_email').fill('browser-test@example.invalid');await page.locator('#id_message').fill('Synthetic browser verification enquiry.');await page.locator('#id_privacy').check();await page.getByRole('button',{name:/Send enquiry/}).click();await page.getByRole('heading',{name:/We have your message/i}).waitFor();
 await page.goto('http://localhost:8000/');await page.keyboard.press('Tab');if(!await page.locator('.skip').evaluate(el=>el===document.activeElement))throw Error('Skip link is not first keyboard focus');
 await page.setViewportSize({width:1440,height:1000});await page.goto('http://localhost:5000/login');await page.locator('#username').fill('care-admin');await page.locator('#password').fill(password);await page.locator('#loginbutton').click();await page.waitForURL(/change_user_settings/);
 await page.getByRole('tab',{name:'Security',exact:true}).click();await page.locator('#button-enable2fa').click();await page.locator('#twofavalidcode').waitFor();const secret=await page.evaluate(()=>controller.user.OTPSECRET);await page.locator('#twofavalidcode').pressSequentially(otp(secret));const saved=page.waitForResponse(r=>r.url().includes('change_user_settings')&&r.request().method()==='POST');await page.locator('#button-save').click();const saveResponse=await saved;if(saveResponse.status()!==200)throw Error('TOTP save rejected');await page.waitForFunction(()=>typeof controller!=='undefined'&&Number(controller.user?.ENABLETOTP)===1);
 await page.goto('http://localhost:5000/main');await page.locator('#asm-content').waitFor();if(page.url().includes('force2fa'))throw Error('TOTP enrolment did not persist');await page.waitForTimeout(400);if(await page.locator('#force2fa:visible').count())throw Error('Forced enrolment screen remained');
 const close=page.getByRole('button',{name:'Close',exact:true});if(await close.count()){await close.last().click();await page.locator('#dialog-welcome').waitFor({state:'hidden'});}await page.waitForTimeout(300);
 for(const [label,width,height] of [['desktop',1440,1000],['tablet',820,1180],['phone',390,844]]){await page.setViewportSize({width,height});await page.screenshot({path:`docs/assets/platform/staff-${label}.png`,fullPage:true});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error(`Staff overflow ${label}: ${JSON.stringify(await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).filter(e=>e.getBoundingClientRect().right>innerWidth+1&&getComputedStyle(e).display!=='none').slice(0,12).map(e=>({tag:e.tagName,id:e.id,cl:e.className,w:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right}))))}`);}
 const forbidden=await page.request.post('http://localhost:5000/login',{headers:{Origin:'https://untrusted.example'},form:{username:'care-admin',password:'invalid'}});if(forbidden.status()!==403)throw Error('Foreign origin not blocked');
 console.log(JSON.stringify({publicRoutes:checked,enquiry:'passed',keyboardSkip:'passed',staffLoginAndTOTP:'passed',staffViewports:3,foreignOrigin:'blocked'}));
}finally{if(browser)await browser.close();for(const child of servers){if(child.exitCode===null){child.kill('SIGTERM');await new Promise(r=>child.once('exit',r));}}rmSync(temp,{recursive:true,force:true});}
