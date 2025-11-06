/**
 * 无损压缩功能使用示例
 * 展示如何使用 losslessCompress.js 中的无损压缩功能
 */

import {
  losslessCompress,
  losslessCompressBatch,
  compareLosslessCompression,
  checkLosslessCompressionSuitability,
  downloadCompressedImage,
} from '../losslessCompress.js';
import { formatFileSize } from '../imageOptimize.js';

// ========== 示例1: 基本无损压缩 ==========
async function example1() {
  console.log('=== 示例1: 基本无损压缩 ===');
  
  const imageUrl = 'https://example.com/image.png';
  
  try {
    const result = await losslessCompress(imageUrl, {
      // 可选：限制最大尺寸
      maxWidth: 1920,
      maxHeight: 1080,
      // 可选：指定输出格式（png/webp）
      format: 'webp',
      // 可选：是否移除元数据（默认true）
      removeMetadata: true,
      // 可选：PNG压缩级别（0-9，默认6）
      compressionLevel: 6,
    });
    
    console.log('压缩成功！');
    console.log('原始大小:', result.originalSizeFormatted);
    console.log('压缩后大小:', result.compressedSizeFormatted);
    console.log('节省大小:', result.savedSizeFormatted);
    console.log('节省比例:', result.savedPercentage + '%');
    
    // 使用压缩后的图片
    const img = document.createElement('img');
    img.src = result.dataURL;
    document.body.appendChild(img);
    
    // 或者下载压缩后的图片
    // downloadCompressedImage(result.blob, 'compressed-image.webp');
    
  } catch (error) {
    console.error('压缩失败:', error);
  }
}

// ========== 示例2: 压缩文件上传的图片 ==========
async function example2() {
  console.log('=== 示例2: 压缩文件上传的图片 ===');
  
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  
  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // 先检查是否适合无损压缩
      const suitability = await checkLosslessCompressionSuitability(file);
      console.log('适合性检查:', suitability);
      
      if (suitability.isSuitable) {
        // 执行无损压缩
        const result = await losslessCompress(file, {
          maxWidth: 1920,
          format: 'webp',
        });
        
        console.log('压缩结果:', result);
        
        // 显示压缩前后的对比
        const beforeImg = document.createElement('img');
        beforeImg.src = URL.createObjectURL(file);
        beforeImg.style.width = '300px';
        beforeImg.style.margin = '10px';
        document.body.appendChild(beforeImg);
        
        const afterImg = document.createElement('img');
        afterImg.src = result.dataURL;
        afterImg.style.width = '300px';
        afterImg.style.margin = '10px';
        document.body.appendChild(afterImg);
        
        // 提供下载按钮
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = `下载压缩图片 (${result.compressedSizeFormatted})`;
        downloadBtn.onclick = () => {
          downloadCompressedImage(result.blob, `compressed-${file.name}`);
        };
        document.body.appendChild(downloadBtn);
      } else {
        console.warn('该图片不适合无损压缩:', suitability.recommendation);
      }
    } catch (error) {
      console.error('压缩失败:', error);
    }
  };
  
  // 触发文件选择（实际使用时，可以绑定到按钮点击事件）
  // fileInput.click();
}

// ========== 示例3: 批量压缩图片 ==========
async function example3() {
  console.log('=== 示例3: 批量压缩图片 ===');
  
  const imageUrls = [
    'https://example.com/image1.png',
    'https://example.com/image2.png',
    'https://example.com/image3.png',
  ];
  
  try {
    const results = await losslessCompressBatch(imageUrls, {
      maxWidth: 1920,
      format: 'webp',
    }, 3); // 并发数量
    
    console.log('批量压缩完成！');
    
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;
    
    results.forEach((item, index) => {
      if (item.success) {
        console.log(`图片 ${index + 1}:`, {
          原始大小: item.result.originalSizeFormatted,
          压缩后大小: item.result.compressedSizeFormatted,
          节省比例: item.result.savedPercentage + '%',
        });
        
        if (item.result.originalSize) {
          totalOriginalSize += item.result.originalSize;
        }
        totalCompressedSize += item.result.compressedSize;
      } else {
        console.error(`图片 ${index + 1} 压缩失败:`, item.error);
      }
    });
    
    const totalSaved = totalOriginalSize - totalCompressedSize;
    const totalSavedPercentage = totalOriginalSize > 0
      ? ((totalSaved / totalOriginalSize) * 100).toFixed(2)
      : 0;
    
    console.log('总计:', {
      原始总大小: formatFileSize(totalOriginalSize),
      压缩后总大小: formatFileSize(totalCompressedSize),
      节省总大小: formatFileSize(totalSaved),
      节省总比例: totalSavedPercentage + '%',
    });
    
  } catch (error) {
    console.error('批量压缩失败:', error);
  }
}

// ========== 示例4: 对比压缩效果 ==========
async function example4() {
  console.log('=== 示例4: 对比压缩效果 ===');
  
  const imageUrl = 'https://example.com/image.png';
  
  try {
    const comparison = await compareLosslessCompression(imageUrl, {
      maxWidth: 1920,
      format: 'webp',
    });
    
    if (comparison.success) {
      console.log('压缩对比结果:', {
        原始大小: comparison.originalSizeFormatted,
        压缩后大小: comparison.compressedSizeFormatted,
        节省大小: comparison.savedSizeFormatted,
        节省比例: comparison.savedPercentage + '%',
        压缩比: comparison.compressionRatio,
        建议: comparison.recommendation,
      });
    } else {
      console.error('对比失败:', comparison.error);
    }
  } catch (error) {
    console.error('对比失败:', error);
  }
}

// ========== 示例5: React组件中使用 ==========
// 这是一个React Hook示例
/*
import { useState } from 'react';
import { losslessCompress } from 'rv-image-optimize/lossless';

function ImageCompressor() {
  const [compressing, setCompressing] = useState(false);
  const [result, setResult] = useState(null);
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setCompressing(true);
    try {
      const compressed = await losslessCompress(file, {
        maxWidth: 1920,
        format: 'webp',
      });
      setResult(compressed);
    } catch (error) {
      console.error('压缩失败:', error);
    } finally {
      setCompressing(false);
    }
  };
  
  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileUpload} />
      {compressing && <p>正在压缩...</p>}
      {result && (
        <div>
          <p>原始大小: {result.originalSizeFormatted}</p>
          <p>压缩后大小: {result.compressedSizeFormatted}</p>
          <p>节省: {result.savedSizeFormatted} ({result.savedPercentage}%)</p>
          <img src={result.dataURL} alt="压缩后的图片" />
        </div>
      )}
    </div>
  );
}
*/

// ========== 示例6: Vue组件中使用 ==========
// 这是一个Vue3 Composition API示例
/*
<template>
  <div>
    <input type="file" accept="image/*" @change="handleFileUpload" />
    <div v-if="compressing">正在压缩...</div>
    <div v-if="result">
      <p>原始大小: {{ result.originalSizeFormatted }}</p>
      <p>压缩后大小: {{ result.compressedSizeFormatted }}</p>
      <p>节省: {{ result.savedSizeFormatted }} ({{ result.savedPercentage }}%)</p>
      <img :src="result.dataURL" alt="压缩后的图片" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { losslessCompress } from 'rv-image-optimize/lossless';

const compressing = ref(false);
const result = ref(null);

const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  compressing.value = true;
  try {
    const compressed = await losslessCompress(file, {
      maxWidth: 1920,
      format: 'webp',
    });
    result.value = compressed;
  } catch (error) {
    console.error('压缩失败:', error);
  } finally {
    compressing.value = false;
  }
};
</script>
*/

// 导出示例函数（如果需要）
export {
  example1,
  example2,
  example3,
  example4,
};

