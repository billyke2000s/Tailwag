import JSZip from 'jszip';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const zip = new JSZip();
async function add(directory, prefix='') {
  for (const entry of await readdir(directory, {withFileTypes:true})) {
    if (['.gradle','build','local.properties'].includes(entry.name)) continue;
    const relative = prefix + entry.name;
    const file = path.join(directory,entry.name);
    if (entry.isDirectory()) await add(file,relative+'/');
    else zip.file(relative,await readFile(file),{unixPermissions:entry.name === 'gradlew' ? 0o100755 : 0o100644});
  }
}
await add(path.join(root,'android'));
zip.file('README-BUILD-APK.md', '# TailWag Android prototype\n\nThe web build is bundled in app/src/main/assets. Java 17 and Android SDK 34 are required.\n\nLinux/macOS: `chmod +x gradlew && ./gradlew assembleDebug`\nWindows: `gradlew.bat assembleDebug`\n\nOutput: app/build/outputs/apk/debug/app-debug.apk. This is a debug APK for testing, not a signed store release.\n');
const content = await zip.generateAsync({type:'nodebuffer',platform:'UNIX',compression:'DEFLATE'});
await writeFile(path.join(root,'dist/TailWag-Android-Project.zip'),content);
console.log('Exported the canonical Android project with bundled web assets.');
