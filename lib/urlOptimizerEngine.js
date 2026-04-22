const DEFAULT_SIGNED_QUERY_KEYS = [
  'token',
  'signature',
  'sign',
  'sig',
  'expires',
  'x-amz-signature',
  'x-amz-credential',
  'x-amz-algorithm',
  'x-amz-date',
  'x-amz-security-token',
  'x-amz-expires',
];

let customHandlerSequence = 0;

function createHandlerContext(url, baseUrl = null) {
  let urlObject;
  let isRelative = false;

  try {
    urlObject = new URL(url);
  } catch (error) {
    if (typeof url === 'string' && url.startsWith('/')) {
      const resolvedBase = baseUrl || (
        typeof window !== 'undefined' && window.location
          ? window.location.origin
          : 'https://example.com'
      );
      urlObject = new URL(url, resolvedBase);
      isRelative = true;
    } else {
      return null;
    }
  }

  return {
    url,
    urlObject,
    hostname: urlObject.hostname,
    pathname: urlObject.pathname,
    searchParams: urlObject.searchParams,
    isRelative,
  };
}

function serializeContextUrl(context, urlObject = context.urlObject) {
  if (!context?.isRelative) {
    return urlObject.toString();
  }
  return `${urlObject.pathname}${urlObject.search}${urlObject.hash}`;
}

function normalizeFormat(format, getBestFormat) {
  if (!format) return null;
  if (format === 'auto') {
    return getBestFormat();
  }
  return getBestFormat(format);
}

function normalizePreserveKeys(keys = []) {
  return new Set(
    (Array.isArray(keys) ? keys : [keys])
      .filter(Boolean)
      .map((key) => String(key).toLowerCase())
  );
}

function hasSignedQuery(context, signedQueryKeys = DEFAULT_SIGNED_QUERY_KEYS) {
  const keySet = normalizePreserveKeys(signedQueryKeys);
  return Array.from(context.searchParams.keys()).some((key) => keySet.has(String(key).toLowerCase()));
}

function hostnameMatches(hostname, patterns = []) {
  const values = Array.isArray(patterns) ? patterns : [patterns];
  return values.some((pattern) => {
    if (!pattern) return false;
    if (pattern instanceof RegExp) return pattern.test(hostname);
    const normalized = String(pattern).toLowerCase();
    return hostname === normalized || hostname.endsWith(`.${normalized}`);
  });
}

function pathnameMatches(pathname, patterns = []) {
  const values = Array.isArray(patterns) ? patterns : [patterns];
  return values.some((pattern) => {
    if (!pattern) return false;
    if (pattern instanceof RegExp) return pattern.test(pathname);
    return pathname.startsWith(String(pattern));
  });
}

function queryMatches(searchParams, queryRule = {}) {
  if (!queryRule || typeof queryRule !== 'object') return true;
  return Object.entries(queryRule).every(([key, expected]) => {
    const actual = searchParams.get(key);
    if (expected === true) return actual !== null;
    if (expected === false) return actual === null;
    if (expected instanceof RegExp) return expected.test(actual || '');
    if (Array.isArray(expected)) return expected.includes(actual);
    return String(actual) === String(expected);
  });
}

function mergeAliyunProcess(urlObject, nextProcess) {
  if (!nextProcess) return urlObject.toString();
  const existing = urlObject.searchParams.get('x-oss-process');
  if (existing) {
    urlObject.searchParams.set('x-oss-process', `${existing}/${nextProcess}`);
  } else {
    urlObject.searchParams.set('x-oss-process', nextProcess);
  }
  return urlObject.toString();
}

function appendPipeline(urlObject, paramName, pipeline) {
  if (!pipeline) return urlObject.toString();
  const existing = urlObject.searchParams.get(paramName);
  if (existing) {
    urlObject.searchParams.set(paramName, `${existing}|${pipeline}`);
  } else {
    urlObject.searchParams.set(paramName, pipeline);
  }
  return urlObject.toString();
}

function createBuiltInHandlers() {
  return [
    {
      name: 'aliyun',
      priority: 100,
      match: (context) => hostnameMatches(context.hostname, ['aliyuncs.com']) || context.url.includes('oss-'),
      process: (context, options) => {
        const { urlObject } = context;
        const { width, height, quality, format } = options;
        const processParams = [];
        if (width || height) {
          processParams.push(`resize,w_${width || ''},h_${height || ''},m_lfit`);
        }
        if (quality) {
          processParams.push(`quality,q_${quality}`);
        }
        if (format) {
          processParams.push(`format,${format}`);
        }
        return mergeAliyunProcess(urlObject, processParams.join('/'));
      },
    },
    {
      name: 'tencent',
      priority: 90,
      match: (context) => hostnameMatches(context.hostname, ['qcloud.com', 'myqcloud.com']),
      process: (context, options) => {
        const { urlObject } = context;
        const { width, height, quality, format } = options;
        const processParams = [];
        if (width || height) {
          processParams.push(`thumbnail/${width || ''}x${height || ''}`);
        }
        if (quality) {
          processParams.push(`quality/${quality}`);
        }
        if (format) {
          processParams.push(`format/${format}`);
        }
        return appendPipeline(urlObject, 'imageMogr2', processParams.join('/'));
      },
    },
    {
      name: 'qiniu',
      priority: 80,
      match: (context) => hostnameMatches(context.hostname, ['qiniucdn.com', 'qiniu.com']),
      process: (context, options) => {
        const { urlObject } = context;
        const { width, height, quality, format } = options;
        const processParams = [];
        if (width || height) {
          processParams.push(`imageView2/1/w/${width || ''}/h/${height || ''}`);
        }
        if (quality) {
          processParams.push(`quality/${quality}`);
        }
        if (format) {
          processParams.push(`format/${format}`);
        }

        const suffix = processParams.join('/');
        if (suffix) {
          return `${urlObject.toString()}${urlObject.search ? '|' : '?'}${suffix}`;
        }
        return urlObject.toString();
      },
    },
    {
      name: 'upyun',
      priority: 70,
      match: (context) => hostnameMatches(context.hostname, ['upaiyun.com', 'upyun.com']),
      process: (context, options) => {
        const { urlObject } = context;
        const { width, height, quality, format } = options;
        const processParams = [];
        if (width || height) {
          processParams.push(`${width || ''}x${height || ''}`);
        }
        if (quality) {
          processParams.push(`quality/${quality}`);
        }
        if (format) {
          processParams.push(`format/${format}`);
        }
        if (processParams.length > 0) {
          const pathParts = urlObject.pathname.split('/');
          const lastPart = pathParts[pathParts.length - 1];
          const processedPath = `${pathParts.slice(0, -1).join('/')}/!${processParams.join('/')}/${lastPart}`;
          urlObject.pathname = processedPath;
        }
        return urlObject.toString();
      },
    },
    {
      name: 'cloudfront',
      priority: 60,
      match: (context) => hostnameMatches(context.hostname, ['cloudfront.net']) || context.hostname.includes('.aws'),
      process: (context, options) => {
        const { urlObject } = context;
        const { width, height, quality, format } = options;
        if (width) urlObject.searchParams.set('w', width);
        if (height) urlObject.searchParams.set('h', height);
        if (quality) urlObject.searchParams.set('q', quality);
        if (format) urlObject.searchParams.set('f', format);
        return urlObject.toString();
      },
    },
  ];
}

const BUILT_IN_HANDLERS = createBuiltInHandlers().map((handler, index) => ({
  ...handler,
  __sequence: index,
}));

const customHandlers = [];

function getAllHandlers(localHandlers = []) {
  return [...BUILT_IN_HANDLERS, ...customHandlers, ...localHandlers]
    .filter(Boolean)
    .sort((left, right) => {
      const leftPriority = Number(left.priority) || 0;
      const rightPriority = Number(right.priority) || 0;
      if (leftPriority !== rightPriority) {
        return rightPriority - leftPriority;
      }
      return (left.__sequence || 0) - (right.__sequence || 0);
    });
}

export function createImageUrlHandler(handler = {}) {
  if (!handler || typeof handler !== 'object') {
    throw new Error('handler 必须是对象');
  }
  if (typeof handler.name !== 'string' || !handler.name.trim()) {
    throw new Error('handler.name 不能为空');
  }
  if (typeof handler.match !== 'function') {
    throw new Error('handler.match 必须是函数');
  }
  if (typeof handler.process !== 'function') {
    throw new Error('handler.process 必须是函数');
  }

  return {
    ...handler,
    name: handler.name.trim(),
    priority: Number(handler.priority) || 0,
  };
}

export function registerImageUrlHandler(handler) {
  const normalizedHandler = createImageUrlHandler(handler);
  const enrichedHandler = {
    ...normalizedHandler,
    __sequence: BUILT_IN_HANDLERS.length + customHandlerSequence,
  };
  customHandlerSequence += 1;

  const existingIndex = customHandlers.findIndex((item) => item.name === enrichedHandler.name);
  if (existingIndex >= 0) {
    customHandlers.splice(existingIndex, 1, enrichedHandler);
  } else {
    customHandlers.push(enrichedHandler);
  }

  return enrichedHandler;
}

export function registerImageUrlHandlers(handlers = []) {
  return handlers.map((handler) => registerImageUrlHandler(handler));
}

export function clearCustomImageUrlHandlers() {
  customHandlers.length = 0;
  customHandlerSequence = 0;
}

export function listImageUrlHandlers() {
  return getAllHandlers().map(({ __sequence, ...handler }) => ({ ...handler }));
}

function resolveMatchedRule(context, rules = []) {
  const normalizedRules = Array.isArray(rules) ? rules : [];
  return normalizedRules
    .filter(Boolean)
    .sort((left, right) => (Number(right.priority) || 0) - (Number(left.priority) || 0))
    .find((rule) => {
      if (rule.hostname && !hostnameMatches(context.hostname, rule.hostname)) return false;
      if (rule.hostnames && !hostnameMatches(context.hostname, rule.hostnames)) return false;
      if (rule.pathnamePrefix && !pathnameMatches(context.pathname, rule.pathnamePrefix)) return false;
      if (rule.pathnamePrefixes && !pathnameMatches(context.pathname, rule.pathnamePrefixes)) return false;
      if (rule.pathnamePattern && !pathnameMatches(context.pathname, rule.pathnamePattern)) return false;
      if (rule.query && !queryMatches(context.searchParams, rule.query)) return false;
      return true;
    }) || null;
}

function applyGenericQueryParams(context, options = {}) {
  const { urlObject } = context;
  const { width, height, quality, format } = options;
  if (width) urlObject.searchParams.set('w', width);
  if (height) urlObject.searchParams.set('h', height);
  if (quality) urlObject.searchParams.set('q', quality);
  if (format) urlObject.searchParams.set('f', format);
  return serializeContextUrl(context);
}

function resolveRuleHandler(rule, handlers) {
  if (!rule?.handler) return null;
  if (typeof rule.handler === 'string') {
    return handlers.find((handler) => handler.name === rule.handler) || null;
  }
  if (typeof rule.handler === 'function') {
    return {
      name: rule.name || 'custom-rule-handler',
      priority: Number(rule.priority) || 0,
      match: () => true,
      process: (context, options) => rule.handler(context, options),
    };
  }
  if (typeof rule.handler === 'object') {
    return createImageUrlHandler(rule.handler);
  }
  return null;
}

export function detectImageUrlHandler(url, options = {}) {
  const context = createHandlerContext(url, options.baseUrl);
  if (!context) return null;

  const localHandlers = Array.isArray(options.handlers) ? options.handlers : [];
  const handlers = getAllHandlers(localHandlers);
  const matchedRule = resolveMatchedRule(context, options.matchRules);
  const ruleHandler = resolveRuleHandler(matchedRule, handlers);
  if (ruleHandler) {
    return ruleHandler.name;
  }

  const matchedHandler = handlers.find((handler) => {
    try {
      return handler.match(context, options);
    } catch (error) {
      return false;
    }
  });

  return matchedHandler?.name || null;
}

export function optimizeImageUrlWithEngine(url, rawOptions = {}, helpers = {}) {
  if (!url) return url;
  const getBestFormat = typeof helpers.getBestFormat === 'function'
    ? helpers.getBestFormat
    : (format) => format || null;
  const context = createHandlerContext(url, rawOptions.baseUrl);
  if (!context) {
    return url;
  }

  const {
    width = null,
    height = null,
    quality = 30,
    format = null,
    autoFormat = true,
    transform = null,
    handlers = [],
    matchRules = [],
    skipSignedUrl = false,
    signedQueryKeys = DEFAULT_SIGNED_QUERY_KEYS,
  } = rawOptions;

  if (skipSignedUrl && hasSignedQuery(context, signedQueryKeys)) {
    return url;
  }

  const finalFormat = autoFormat && !format
    ? getBestFormat()
    : normalizeFormat(format, getBestFormat);

  const resolvedOptions = {
    ...rawOptions,
    width,
    height,
    quality,
    format: finalFormat,
  };

  if (typeof transform === 'function') {
    const transformed = transform(url, resolvedOptions, context);
    if (typeof transformed === 'string' && transformed.trim()) {
      return transformed;
    }
  }

  const localHandlers = Array.isArray(handlers) ? handlers : [];
  const allHandlers = getAllHandlers(localHandlers);
  const matchedRule = resolveMatchedRule(context, matchRules);
  const ruleHandler = resolveRuleHandler(matchedRule, allHandlers);
  const handler = ruleHandler || allHandlers.find((candidate) => {
    try {
      return candidate.match(context, resolvedOptions);
    } catch (error) {
      return false;
    }
  });

  if (handler) {
    const nextUrl = handler.process(context, resolvedOptions);
    return typeof nextUrl === 'string'
      ? (context.isRelative ? serializeContextUrl(context, new URL(nextUrl, context.urlObject.origin)) : nextUrl)
      : serializeContextUrl(context);
  }

  return applyGenericQueryParams(context, resolvedOptions);
}

export {
  DEFAULT_SIGNED_QUERY_KEYS,
  createHandlerContext,
  serializeContextUrl,
};
