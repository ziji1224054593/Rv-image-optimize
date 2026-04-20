import React, { useEffect, useMemo, useState } from 'react';

const COUNT_API_BASE = 'https://api.countapi.xyz';

function sanitizeSegment(value, fallback) {
  const normalized = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

  return normalized || fallback;
}

function buildCounterConfig() {
  if (typeof window === 'undefined') {
    return {
      namespace: 'rv-image-optimize-local',
      key: 'page-home',
    };
  }

  const host = sanitizeSegment(window.location.hostname, 'localhost');
  const path = sanitizeSegment(window.location.pathname || '/', 'home');

  return {
    namespace: `rv-image-optimize-${host}`,
    key: `page-${path}`,
  };
}

async function requestCounterValue(namespace, key, shouldIncrement) {
  const action = shouldIncrement ? 'hit' : 'get';
  const response = await fetch(`${COUNT_API_BASE}/${action}/${namespace}/${key}`);

  if (!response.ok) {
    throw new Error(`Counter request failed with status ${response.status}`);
  }

  return response.json();
}

export default function PageVisitCounter() {
  const [count, setCount] = useState(null);
  const [error, setError] = useState('');
  const counterConfig = useMemo(() => buildCounterConfig(), []);
  const isProductionBuild = import.meta.env.PROD;

  useEffect(() => {
    let cancelled = false;

    async function syncCounter() {
      try {
        const data = await requestCounterValue(
          counterConfig.namespace,
          counterConfig.key,
          isProductionBuild
        );

        if (!cancelled) {
          setCount(typeof data?.value === 'number' ? data.value : 0);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || '计数服务暂时不可用');
        }
      }
    }

    syncCounter();

    return () => {
      cancelled = true;
    };
  }, [counterConfig, isProductionBuild]);

  return (
    <div style={{
      marginBottom: '20px',
      padding: '12px 16px',
      borderRadius: '8px',
      backgroundColor: '#f6ffed',
      border: '1px solid #b7eb8f',
      color: '#333',
      fontSize: '14px',
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        页面访问统计
      </div>
      <div>
        {error
          ? `计数接口不可用：${error}`
          : count === null
            ? '正在同步访问次数...'
            : `当前页面累计访问：${count}`}
      </div>
      <div style={{ marginTop: '6px', fontSize: '12px', color: '#666' }}>
        {isProductionBuild
          ? '正式部署环境下，每次打开页面都会自动 +1。'
          : '本地开发环境仅查看当前计数，不执行 +1。'}
      </div>
    </div>
  );
}
