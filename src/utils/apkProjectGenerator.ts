/** Download the build-generated archive of the canonical Android project. */
export async function generateAndDownloadAndroidProjectZip() {
  const response = await fetch('/TailWag-Android-Project.zip');
  if (!response.ok || !response.headers.get('content-type')?.includes('zip')) {
    throw new Error('Project ZIP unavailable. Run npm run build and serve the dist directory.');
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a'); link.href=url; link.download='TailWag-Android-Project.zip';
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
