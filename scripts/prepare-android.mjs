import { readdir, cp, mkdir, rm, access } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
await access(path.join(root, 'dist/index.html'));
const target = path.join(root, 'android/app/src/main/assets');
await rm(target, {recursive:true,force:true});
await mkdir(target, {recursive:true});
for (const name of await readdir(path.join(root,'dist'))) {
  if (/\.(apk|idsig|zip)$/.test(name)) continue;
  await cp(path.join(root,'dist',name),path.join(target,name),{recursive:true});
}
console.log('Bundled web assets prepared for Android.');
