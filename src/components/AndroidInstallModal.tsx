import React, { useState } from 'react';
import { useDialog } from '../utils/navigation';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { generateAndDownloadAndroidProjectZip } from '../utils/apkProjectGenerator';

interface Props { isOpen:boolean; onClose:() => void }
export function AndroidInstallModal({isOpen,onClose}:Props) {
  const ref = useDialog(isOpen,onClose);
  const {isInstallable,isInstalled,install} = usePWAInstall();
  const [error,setError] = useState('');
  const [downloading,setDownloading] = useState(false);
  const [copied,setCopied] = useState(false);
  if (!isOpen) return null;
  const native = navigator.userAgent.includes('TailWagAndroid');
  const configured = import.meta.env.VITE_APP_URL;
  const appUrl = configured && /^https:\/\//.test(configured) ? configured : window.location.origin;
  const apkUrl = import.meta.env.VITE_APK_URL;
  const validApkUrl = typeof apkUrl === 'string' && /^https:\/\//.test(apkUrl) ? apkUrl : null;
  return <div ref={ref} role="dialog" aria-modal="true" aria-label="Android installation" tabIndex={-1} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
    <div className="bg-white text-slate-900 rounded-3xl p-5 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
      <h2 className="font-bold text-lg">Install TailWag</h2>
      {native ? <p>This Android app is already installed and includes the web app for offline use.</p> : <>
        {isInstalled ? <p>Running as an installed web app.</p> : isInstallable ? <button className="w-full p-3 bg-emerald-600 text-white rounded-xl" onClick={async () => {try {if(await install()) onClose();} catch {setError('Installation was unavailable. Try your browser menu.');}}}>Install web app</button> : <p>In a supported browser, use its menu and choose Install app or Add to Home screen.</p>}
        <p className="text-sm">Android APKs are built separately. A project ZIP contains source code and must be compiled.</p>
        {validApkUrl ? <a className="block p-3 bg-emerald-600 text-white rounded-xl" href={validApkUrl} target="_blank" rel="noreferrer">Download test APK</a> : <p className="text-sm">Download the test APK from this project's GitHub Actions build artifacts.</p>}
        <button disabled={downloading} className="w-full p-3 bg-slate-100 rounded-xl" onClick={async () => {setDownloading(true);setError('');try{await generateAndDownloadAndroidProjectZip();}catch(e){setError(e instanceof Error ? e.message : 'Download failed.');}finally{setDownloading(false);}}}>{downloading ? 'Preparing download…' : 'Download Android project ZIP'}</button>
        <p className="text-sm">Build with Java 17 and Android SDK 34: <code>./gradlew assembleDebug</code></p>
        <button className="p-3 bg-slate-100 rounded-xl" onClick={async () => {try{await navigator.clipboard.writeText(appUrl);setCopied(true);}catch{setError('Could not copy the address.');}}}>{copied ? 'Copied app URL' : 'Copy app URL'}</button>
      </>}
      {error && <p role="alert">{error}</p>}
      <button className="p-3 font-semibold" onClick={onClose}>Close</button>
    </div>
  </div>;
}
