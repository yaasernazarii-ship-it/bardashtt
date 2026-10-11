// تبدیل لینک آپارات به نشانی امبد قابل نمایش در iframe.
export function aparatEmbedUrl(url) {
  if (!url) return null;
  const s = String(url).trim();
  let m = s.match(/aparat\.com\/v\/([A-Za-z0-9]+)/i);
  if (!m) m = s.match(/videohash\/([A-Za-z0-9]+)/i);
  if (!m) m = s.match(/aparat\.com\/([A-Za-z0-9]{6,})/i);
  if (!m) return null;
  return `https://www.aparat.com/video/video/embed/videohash/${m[1]}/vt/frame`;
}
