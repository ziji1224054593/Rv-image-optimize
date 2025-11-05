import React from 'react';
import { LazyImage } from '../src/index.js';
import '../src/LazyImage.css';

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>LazyImage 组件示例</h1>
      
      {/* <div style={{ marginBottom: '20px' }}>
        <h2>基础用法</h2>
        <LazyImage
          src="https://pic.rmb.bdstatic.com/bjh/pay_read/3883a287b37eaa34dcf80a031f969db05547.jpeg"
          alt="示例图片"
          width={400}
          height={300}
          optimize={{
            width: 400,
            quality: 85,
            autoFormat: true
          }}
          showPlaceholderIcon={true}
          onLoad={(e) => console.log('加载成功', e)}
          onError={(e) => console.log('加载失败', e)}
        />
      </div> */}
      
      <div style={{ marginBottom: '20px' }}>
        <h2>懒加载示例（40张图片）</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {Array.from({ length: 40 }).map((_, i) => (
            <LazyImage 
              key={i}
              src="https://pic.rmb.bdstatic.com/bjh/pay_read/3883a287b37eaa34dcf80a031f969db05547.jpeg"
              alt={`懒加载图片 ${i + 1}`}
              width={200}
              height={200}
              rootMargin="50px"
              optimize={{
                width: 200,
                quality: 80
              }}
            />
          ))}
        </div>
      </div>
      
      {/* <div style={{ marginBottom: '20px' }}>
        <h2>立即加载</h2>
        <LazyImage
          src="https://pic.rmb.bdstatic.com/bjh/pay_read/3883a287b37eaa34dcf80a031f969db05547.jpeg"
          alt="立即加载图片"
          width={300}
          height={200}
          immediate={true}
          optimize={{
            width: 300,
            quality: 75
          }}
        />
      </div> */}
    </div>
  );
}

export default App;
