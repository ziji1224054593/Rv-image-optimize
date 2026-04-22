export const STATIC_IMAGE_PLUGIN_DEFAULT_FORMATS = ['png', 'webp', 'avif', 'svg'];

export function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) {
    return '0 B';
  }

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function normalizeExtension(value) {
  return String(value || '').replace(/^\./, '').toLowerCase();
}

export function normalizeFormat(format) {
  const normalized = normalizeExtension(format);
  return normalized === 'jpg' ? 'jpeg' : normalized;
}

export function normalizeRulePath(value) {
  return String(value || '').replace(/\\/g, '/').toLowerCase();
}

export function shouldExclude(targetPath, excludeRules = []) {
  const normalizedPath = normalizeRulePath(targetPath);

  return excludeRules.some((rule) => {
    if (!rule) return false;
    if (rule instanceof RegExp) {
      return rule.test(targetPath);
    }
    return normalizedPath.includes(normalizeRulePath(rule));
  });
}

export function optimizeSvgContent(source) {
  return source
    .replace(/^\uFEFF/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .trim();
}

export async function runWithConcurrency(items, concurrency, worker) {
  const queue = [...items];
  const results = [];

  const execute = async () => {
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      results.push(await worker(current));
    }
  };

  await Promise.all(
    Array(Math.min(concurrency, Math.max(items.length, 1)))
      .fill(null)
      .map(() => execute())
  );

  return results;
}
