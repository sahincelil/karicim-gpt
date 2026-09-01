const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9.-]{0,38})$/;
const REPO_RE = /^[A-Za-z0-9_.-]{1,100}$/;
const PATH_RE = /^[A-Za-z0-9._@+\-\/ ]{1,500}$/;
const MAX_FILE_BYTES = 120000;

export async function readPublicGitHubFile({ owner, repo, path }) {
  if (!OWNER_RE.test(owner || '') || !REPO_RE.test(repo || '') || !PATH_RE.test(path || '')) {
    throw new Error('Geçersiz GitHub dosya yolu.');
  }
  if (path.includes('..') || path.startsWith('/') || path.includes('\\')) {
    throw new Error('Geçersiz dosya yolu.');
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'KaricimGPT-Agent/1.1'
    },
    signal: AbortSignal.timeout(12000)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`GitHub ${response.status}`);
  if (data?.type !== 'file' || typeof data?.content !== 'string') throw new Error('Yalnızca tekil public dosyalar okunabilir.');

  const encoded = data.content.replace(/\s/g, '');
  const estimatedBytes = Math.floor((encoded.length * 3) / 4);
  if (estimatedBytes > MAX_FILE_BYTES) throw new Error('Dosya agent için fazla büyük.');

  const content = Buffer.from(encoded, 'base64').toString('utf8');
  if (content.includes('\u0000')) throw new Error('Binary dosyalar okunmuyor.');
  return content.slice(0, MAX_FILE_BYTES);
}
