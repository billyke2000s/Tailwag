import { test, expect } from '@playwright/test';
const nav = (page:any, name:string) => page.getByRole('navigation',{name:'Android Bottom Navigation'}).getByRole('button',{name});
test.beforeEach(async ({page})=>{await page.goto('/');});
test('bundled dog and cat photos load',async({page})=>{
  const image=page.getByAltText('Max',{exact:true}).first();
  await expect(image).toBeVisible();
  await expect.poll(()=>image.evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
  await page.getByRole('button',{name:'🐱 Cats',exact:true}).click();
  const cat=page.getByAltText('Cleo',{exact:true}).first();await expect(cat).toBeVisible();
  await expect.poll(()=>cat.evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
});
test('messages survive navigation, replies and reload',async({page})=>{
  await nav(page,'Matches').click();await page.getByRole('button',{name:'Max',exact:true}).click();
  await page.getByPlaceholder(/message/i).fill('Persistent message');
  await page.getByPlaceholder(/message/i).press('Enter');
  await nav(page,'My Pup').click();await page.waitForTimeout(1700);
  await nav(page,'Matches').click();await page.getByRole('button',{name:'Max',exact:true}).click();
  await expect(page.getByText('Persistent message',{exact:true})).toBeVisible();
  await page.reload();await nav(page,'Matches').click();await page.getByRole('button',{name:'Max',exact:true}).click();
  await expect(page.getByText('Persistent message',{exact:true})).toBeVisible();
});
test('rapid pass does not skip dogs and rewind works at deck end',async({page})=>{
  const pass=page.getByTitle('Pass to next dog');
  await pass.evaluate((button:HTMLButtonElement)=>{button.click();button.click();button.click();});
  await expect(page.getByRole('heading',{name:'Winston'})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('tailwag:v1:discovery-dogs')!).value.length)).toBe(1);
  for(let i=0;i<3;i++){await expect(pass).toBeEnabled();await pass.click();await page.waitForTimeout(250);}
  await page.getByTitle('Rewind previous card').click();await expect(page.getByRole('heading',{name:'Biscuit'})).toBeVisible();
});
test('filter changes reconcile deck and draft cancellation',async({page})=>{
  await page.getByTitle('Pass to next dog').click();await page.waitForTimeout(250);
  await page.getByTitle('Search Filters').click();await page.getByRole('button',{name:'Hyper Zoomies Champion',exact:true}).click();await page.getByRole('button',{name:'Apply Filters'}).click();
  await expect(page.getByRole('heading',{name:'Maya'})).toBeVisible();
  await page.getByTitle('Search Filters').click();await page.getByRole('button',{name:'Chill Couch Potato',exact:true}).click();await page.keyboard.press('Escape');
  await page.getByTitle('Search Filters').click();await page.getByRole('button',{name:'Apply Filters'}).click();
  await expect(page.getByRole('heading',{name:'Maya'})).toBeVisible();
});
test('check-in survives navigation and meetup preserves chosen park',async({page})=>{
  await nav(page,'Dog Parks').click();await page.getByRole('button',{name:'Check In Charlie',exact:true}).nth(1).click();
  await nav(page,'My Pup').click();await nav(page,'Dog Parks').click();await expect(page.getByRole('button',{name:'Charlie Checked In!'})).toBeVisible();
  await page.getByRole('button',{name:'Meetup',exact:true}).nth(1).click();
  const dialog=page.getByRole('dialog',{name:'Choose a playmate'});await dialog.getByRole('button',{name:/Winston/}).click();
  const scheduler=page.getByRole('dialog',{name:'Plan a playdate'});await expect(scheduler).toBeVisible();
  await expect(scheduler.locator('select')).toHaveValue('Elmwood Square Canine Haven');
});
test('preferences persist, physical Back event consumes modal',async({page})=>{
  await nav(page,'My Pup').click();const alerts=page.getByRole('checkbox',{name:'New Playmate Match Alerts'});await alerts.uncheck();
  const sound=page.getByRole('checkbox',{name:'Playful Canine Sound Effects'});await sound.uncheck();
  await page.reload();await nav(page,'My Pup').click();await expect(alerts).not.toBeChecked();await expect(sound).not.toBeChecked();
  await nav(page,'Discover').click();await page.getByTitle('Search Filters').click();
  expect(await page.evaluate(()=>!window.dispatchEvent(new Event('tailwag-back',{cancelable:true})))).toBe(true);
  await expect(page.getByRole('dialog',{name:'Match preferences'})).toHaveCount(0);
});
test('profile edits persist through reload',async({page})=>{
  await nav(page,'My Pup').click();await page.getByRole('button',{name:'Edit',exact:true}).click();
  await page.getByRole('textbox',{name:'Pet name',exact:true}).fill('Charlie Test');await page.getByRole('button',{name:'Save',exact:true}).click();
  await page.reload();await nav(page,'My Pup').click();await expect(page.getByRole('heading',{name:'Charlie Test',exact:true})).toBeVisible();
});
test('production app and local photos work offline after caching',async({page,context})=>{
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
  await context.setOffline(true);await page.reload();
  const image=page.getByAltText('Max',{exact:true}).first();await expect(image).toBeVisible();
  await expect.poll(()=>image.evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
  await page.getByRole('button',{name:'🐱 Cats',exact:true}).click();await expect(page.getByRole('heading',{name:'Cleo',exact:true})).toBeVisible();
});
