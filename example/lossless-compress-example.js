/**
 * 无损压缩功能使用示例
 * 展示如何使用 losslessCompress.js 中的无损压缩功能
 * 
 * 主要特性：
 * - 自动检测 GPU 加速支持，智能使用 GPU 或 CPU 处理
 * - 返回 Element UI Upload 组件格式的文件信息
 * - 支持回调函数，压缩完成后自动处理（如上传到后端）
 * - 一步到位，无需额外检查，直接使用即可
 */

import {
  losslessCompress,
  losslessCompressBatch,
  compareLosslessCompression,
  checkLosslessCompressionSuitability,
  downloadCompressedImage,
  getGPUSupportInfo,
} from '../lib/losslessCompress.js';
import { formatFileSize } from '../lib/imageOptimize.js';

// ========== 示例1: 基本无损压缩 ==========
async function example1() {
  console.log('=== 示例1: 基本无损压缩 ===');
  
  const imageUrl = 'https://example.com/image.png';
  
  try {
    // 一步到位，直接压缩，无需额外检查
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
    
    // GPU 加速信息
    if (result.gpuAccelerated) {
      console.log('✅ 使用了 GPU 加速:', result.gpuMethod);
    } else {
      console.log('ℹ️ 使用 CPU 处理');
    }
    
    // Element UI 格式的文件信息（主要使用这个）
    const fileInfo = result.fileInfo;
    console.log('Element UI 格式文件信息:', {
      name: fileInfo.name,
      size: fileInfo.sizeFormatted,
      type: fileInfo.type,
      uid: fileInfo.uid,
      status: fileInfo.status,
      compressionInfo: fileInfo.compressionInfo,
    });
    
    // 使用压缩后的图片
    const img = document.createElement('img');
    img.src = result.dataURL;
    document.body.appendChild(img);
    
    // 或者下载压缩后的图片
    // downloadCompressedImage(result.blob, 'compressed-image.webp');
    
    // 或者使用 File 对象上传到后端
    // const formData = new FormData();
    // formData.append('image', result.file);
    // await fetch('/api/upload', { method: 'POST', body: formData });
    
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
      // 一步到位，直接压缩，无需额外检查
      const result = await losslessCompress(file, {
        maxWidth: 1920,
        format: 'webp',
      });
      
      console.log('压缩结果:', result);
      
      // 使用 Element UI 格式的文件信息
      const fileInfo = result.fileInfo;
      console.log('文件信息（Element UI 格式）:', fileInfo);
      
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
      
    } catch (error) {
      console.error('压缩失败:', error);
    }
  };
  
  // 触发文件选择（实际使用时，可以绑定到按钮点击事件）
  // fileInput.click();
}

// ========== 示例2.1: 使用回调函数上传到后端 ==========
async function example2_1() {
  console.log('=== 示例2.1: 使用回调函数上传到后端 ===');
  
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  
  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // 执行无损压缩，并使用回调函数处理压缩后的文件
      const result = await losslessCompress(file, {
        maxWidth: 1920,
        format: 'webp',
        // 回调函数：压缩完成后自动调用，接收三个参数
        // - compressedFile: 压缩后的 File 对象
        // - compressionResult: 完整的压缩结果对象
        // - fileInfo: Element UI Upload 组件格式的文件信息对象
        onComplete: async (compressedFile, compressionResult, fileInfo) => {
          console.log('压缩完成，准备上传到后端...');
          console.log('压缩后的文件:', compressedFile);
          console.log('文件大小:', compressionResult.compressedSizeFormatted);
          console.log('Element UI 格式文件信息:', fileInfo);
          
          // 更新文件信息状态为上传中
          fileInfo.status = 'uploading';
          
          // 方式1: 使用 FormData 上传
          const formData = new FormData();
          formData.append('image', compressedFile); // 或使用 fileInfo.raw
          formData.append('originalSize', compressionResult.originalSize);
          formData.append('compressedSize', compressionResult.compressedSize);
          
          try {
            // 上传到后端接口
            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });
            
            if (response.ok) {
              const data = await response.json();
              
              // 更新文件信息状态为成功
              fileInfo.status = 'success';
              fileInfo.response = data; // Element UI 格式：服务器响应
              fileInfo.url = data.url;  // Element UI 格式：文件 URL
              
              console.log('上传成功:', data);
              console.log('更新后的文件信息:', fileInfo);
              alert('图片压缩并上传成功！');
            } else {
              throw new Error('上传失败');
            }
          } catch (uploadError) {
            // 更新文件信息状态为失败
            fileInfo.status = 'fail';
            fileInfo.error = uploadError.message;
            
            console.error('上传失败:', uploadError);
            console.error('文件信息:', fileInfo);
            alert('上传失败，请重试');
          }
        },
      });
      
      console.log('压缩结果:', result);
      // 注意：即使使用了回调函数，Promise 仍然会返回完整的结果对象
      // 你可以在这里继续处理其他逻辑
      
    } catch (error) {
      console.error('压缩失败:', error);
    }
  };
  
  // 触发文件选择（实际使用时，可以绑定到按钮点击事件）
  // fileInput.click();
}

// ========== 示例2.2: 使用回调函数 + Promise 两种方式处理 ==========
async function example2_2() {
  console.log('=== 示例2.2: 使用回调函数 + Promise 两种方式处理 ===');
  
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  
  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    let uploadInProgress = false;
    
    try {
      // 执行无损压缩
      const result = await losslessCompress(file, {
        maxWidth: 1920,
        format: 'webp',
        // 方式1: 使用回调函数（适合需要立即处理的场景）
        // 回调函数接收三个参数：compressedFile, compressionResult, fileInfo
        onComplete: (compressedFile, compressionResult, fileInfo) => {
          if (!uploadInProgress) {
            uploadInProgress = true;
            console.log('回调函数: 开始上传...');
            console.log('Element UI 格式文件信息:', fileInfo);
            
            // 更新文件信息状态
            fileInfo.status = 'uploading';
            
            // 在回调中上传
            uploadToBackend(compressedFile, compressionResult, fileInfo)
              .then(() => {
                console.log('回调函数: 上传完成');
                uploadInProgress = false;
              })
              .catch((error) => {
                console.error('回调函数: 上传失败', error);
                fileInfo.status = 'fail';
                fileInfo.error = error.message;
                uploadInProgress = false;
              });
          }
        },
      });
      
      // 方式2: 使用 Promise 返回的结果（适合需要等待压缩完成后再处理的场景）
      console.log('Promise 返回结果:', result);
      console.log('Element UI 格式文件信息:', result.fileInfo);
      
      // 可以在这里进行其他处理，比如显示预览
      const previewImg = document.createElement('img');
      previewImg.src = result.dataURL;
      previewImg.style.width = '300px';
      previewImg.style.margin = '10px';
      document.body.appendChild(previewImg);
      
      // 也可以在这里再次上传（如果回调函数没有上传成功）
      // await uploadToBackend(result.file, result, result.fileInfo);
      
    } catch (error) {
      console.error('压缩失败:', error);
    }
  };
  
  // 上传到后端的辅助函数
  async function uploadToBackend(compressedFile, compressionResult, fileInfo) {
    const formData = new FormData();
    formData.append('image', compressedFile);
    formData.append('originalSize', compressionResult.originalSize);
    formData.append('compressedSize', compressionResult.compressedSize);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('上传失败');
    }
    
    const data = await response.json();
    
    // 更新文件信息状态为成功
    if (fileInfo) {
      fileInfo.status = 'success';
      fileInfo.response = data;
      fileInfo.url = data.url;
    }
    
    return data;
  }
  
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
      // 一步到位，直接压缩
      const compressed = await losslessCompress(file, {
        maxWidth: 1920,
        format: 'webp',
        // 可选：使用回调函数自动上传
        onComplete: async (compressedFile, compressionResult, fileInfo) => {
          // 自动上传到后端
          const formData = new FormData();
          formData.append('image', compressedFile);
          await fetch('/api/upload', { method: 'POST', body: formData });
        },
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
          {result.gpuAccelerated && (
            <p>✅ GPU加速: {result.gpuMethod}</p>
          )}
          <p>文件名: {result.fileInfo.name}</p>
          <p>文件大小: {result.fileInfo.sizeFormatted}</p>
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
      <p v-if="result.gpuAccelerated">✅ GPU加速: {{ result.gpuMethod }}</p>
      <!-- 使用 Element UI 格式的文件信息 -->
      <p>文件名: {{ result.fileInfo.name }}</p>
      <p>文件大小: {{ result.fileInfo.sizeFormatted }}</p>
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
    // 一步到位，直接压缩
    const compressed = await losslessCompress(file, {
      maxWidth: 1920,
      format: 'webp',
      // 可选：使用回调函数自动上传
      onComplete: async (compressedFile, compressionResult, fileInfo) => {
        // 自动上传到后端
        const formData = new FormData();
        formData.append('image', compressedFile);
        await fetch('/api/upload', { method: 'POST', body: formData });
      },
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

// ========== 示例7: 检测 GPU 加速支持 ==========
function example7() {
  console.log('=== 示例7: 检测 GPU 加速支持 ===');
  
  const gpuInfo = getGPUSupportInfo();
  console.log('GPU 支持信息:', gpuInfo);
  
  if (gpuInfo.supported) {
    console.log('✅ 支持 GPU 加速');
    console.log('使用方法:', gpuInfo.method);
    console.log('详细信息:', gpuInfo.details);
  } else {
    console.log('ℹ️ 不支持 GPU 加速，将使用 CPU 处理');
    console.log('原因:', gpuInfo.reason);
  }
}

// 导出示例函数（如果需要）
export {
  example1,
  example2,
  example2_1,
  example2_2,
  example3,
  example4,
  example7,
};

