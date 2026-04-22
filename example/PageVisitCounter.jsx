import React, { useEffect, useState } from 'react';

const BUSUANZI_SCRIPT_ID = 'busuanzi-script';
const BUSUANZI_SCRIPT_SRC = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';

function ensureBusuanziScript() {
  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(BUSUANZI_SCRIPT_ID);

    if (existingScript) {
      if (existingScript.dataset.loaded === 'true') {
        resolve();
        return;
      }

      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = BUSUANZI_SCRIPT_ID;
    script.src = BUSUANZI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error('统计脚本加载失败'));
    document.body.appendChild(script);
  });
}

export default function PageVisitCounter() {
  const [count, setCount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let pollTimer = null;
    let timeoutTimer = null;

    function updateCountFromDom() {
      const countElement = document.getElementById('busuanzi_value_page_pv');
      const nextCount = countElement?.textContent?.trim();

      if (nextCount && /^\d+$/.test(nextCount)) {
        setCount(nextCount);
        setError('');
        return true;
      }

      return false;
    }

    async function loadCounter() {
      if (updateCountFromDom()) {
        return;
      }

      try {
        await ensureBusuanziScript();

        pollTimer = window.setInterval(() => {
          if (cancelled) {
            return;
          }

          if (updateCountFromDom()) {
            window.clearInterval(pollTimer);
            window.clearTimeout(timeoutTimer);
          }
        }, 300);

        timeoutTimer = window.setTimeout(() => {
          if (!cancelled && !updateCountFromDom()) {
            setError('统计服务暂时不可用');
            window.clearInterval(pollTimer);
          }
        }, 8000);
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || '统计服务暂时不可用');
        }
      }
    }

    loadCounter();

    return () => {
      cancelled = true;
      if (pollTimer) {
        window.clearInterval(pollTimer);
      }
      if (timeoutTimer) {
        window.clearTimeout(timeoutTimer);
      }
    };
  }, []);

  return (
    <div style={{
      marginBottom: '20px',
      padding: '12px 16px',
      borderRadius: '8px',
      backgroundColor: '#f6ffed',
      border: '1px solid #b7eb8f',
      color: '#333',
      fontSize: '14px',
      display: 'flex',
      gap: '2px',
      alignItems: 'center',
    }}>
      <div style={{ fontWeight: 'bold' }}>
        页面访问统计：
      </div>
      {/* 用户可见的统计文案，只展示这一处。 */}
      <div>
        {error
          ? `统计接口不可用：${error}`
          : !count
            ? ''
            : ``}
      </div>
      {/* 这是 busuanzi 脚本写入 PV 数字的隐藏挂载点，不能删除。 */}
      <span
        id="busuanzi_container_page_pv"
        style={{ display: 'none' }}
        aria-hidden="true"
      >
        <span id="busuanzi_value_page_pv" />
      </span>
    </div>
  );
}
