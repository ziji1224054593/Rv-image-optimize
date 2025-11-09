import React, { useState, useEffect } from 'react';
import { LazyImage, ProgressiveImage } from '../src/index.js';
import { 
  losslessCompress, 
  downloadCompressedImage 
} from '../losslessCompress.js';
import { optimizeImageUrl, formatFileSize, loadImagesProgressively, loadImageProgressive } from '../imageOptimize.js';
import '../src/LazyImage.css';

// 无损压缩对比组件
function LosslessCompressDemo() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]); // 存储所有文件的压缩结果
  const [compressing, setCompressing] = useState(false);
  const [compressingIndex, setCompressingIndex] = useState(-1); // 当前正在压缩的文件索引
  const [totalStats, setTotalStats] = useState(null); // 总体统计
  const [uploadStatus, setUploadStatus] = useState({}); // 上传状态 { fileIndex: { uploading: bool, success: bool, error: string } }
  const [enableAutoUpload, setEnableAutoUpload] = useState(false); // 是否启用自动上传

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    setFiles(selectedFiles);
    setResults([]);
    setTotalStats(null);
    setUploadStatus({}); // 重置上传状态
    setCompressing(true);

    // 自动开始压缩所有文件
    const compressResults = [];
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setCompressingIndex(i);

      try {
        // 执行无损压缩（一步到位，无需额外检查）
        const startTime = window.performance.now();
        const result = await losslessCompress(file, {
          maxWidth: 1920,
          format: 'webp',
          compressionLevel: 6,
          // 使用回调函数：压缩完成后自动上传到后端
          onComplete: enableAutoUpload ? async (compressedFile, compressionResult, fileInfo) => {
            // fileInfo 已经是 Element UI 格式，直接使用
            fileInfo.status = 'uploading'; // 更新状态为上传中
            
            console.log('压缩完成，文件信息（Element UI 格式）:', fileInfo);
            console.log('文件详情:', {
              name: fileInfo.name,
              size: fileInfo.sizeFormatted,
              type: fileInfo.type,
              uid: fileInfo.uid,
              status: fileInfo.status,
              compressionInfo: fileInfo.compressionInfo,
            });
            
            // 更新上传状态
            setUploadStatus(prev => ({
              ...prev,
              [i]: { uploading: true, success: false, error: null, fileInfo }
            }));

            try {
              // 模拟上传到后端（实际使用时替换为真实的后端接口）
              const uploadResult = await simulateUploadToBackend(compressedFile, compressionResult, file.name);
              
              // 更新文件信息状态为成功
              fileInfo.status = 'success';
              fileInfo.response = uploadResult; // Element UI 格式：服务器响应
              fileInfo.url = uploadResult.url;  // Element UI 格式：文件 URL
              
              // 更新上传状态为成功
              setUploadStatus(prev => ({
                ...prev,
                [i]: { uploading: false, success: true, error: null, result: uploadResult, fileInfo }
              }));
              
              console.log('上传成功，更新后的文件信息:', fileInfo);
            } catch (uploadError) {
              // 更新文件信息状态为失败
              fileInfo.status = 'fail';
              fileInfo.error = uploadError.message;
              
              // 更新上传状态为失败
              setUploadStatus(prev => ({
                ...prev,
                [i]: { uploading: false, success: false, error: uploadError.message, fileInfo }
              }));
              
              console.error('上传失败，文件信息:', fileInfo);
            }
          } : null,
        });
        const endTime = window.performance.now();
        const compressTime = endTime - startTime;

        // 生成优化后的URL（使用 imageOptimize）
        const optimizedUrl = optimizeImageUrl(URL.createObjectURL(file), {
          width: 1920,
          quality: 85,
          autoFormat: true,
        });

        // 创建预览
        const preview = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataURL = e.target.result;
            const img = new Image();
            img.onload = () => {
              resolve({
                dataURL,
                width: img.width,
                height: img.height,
              });
            };
            img.src = dataURL;
          };
          reader.readAsDataURL(file);
        });

        const fileResult = {
          file,
          result,
          fileInfo: result.fileInfo, // Element UI 格式的文件信息（主要使用这个）
          optimizedUrl,
          preview,
          performance: {
            compressTime: compressTime.toFixed(2),
            compressTimeFormatted: `${compressTime.toFixed(2)}ms`,
          },
          index: i,
        };

        compressResults.push(fileResult);

        // 更新统计
        if (result.originalSize !== null && !isNaN(result.originalSize) && result.originalSize > 0) {
          totalOriginalSize += result.originalSize;
        }
        if (result.compressedSize !== null && !isNaN(result.compressedSize)) {
          totalCompressedSize += result.compressedSize;
        }

        // 更新结果状态（实时显示）
        setResults([...compressResults]);
      } catch (error) {
        console.error(`文件 ${file.name} 压缩失败:`, error);
        compressResults.push({
          file,
          error: error.message,
          index: i,
        });
        setResults([...compressResults]);
      }
    }

    // 计算总体统计
    const totalSaved = (totalOriginalSize > 0 && !isNaN(totalOriginalSize) && !isNaN(totalCompressedSize))
      ? (totalOriginalSize - totalCompressedSize)
      : null;
    const totalSavedPercentage = (totalOriginalSize > 0 && !isNaN(totalOriginalSize) && totalSaved !== null)
      ? parseFloat(((totalSaved / totalOriginalSize) * 100).toFixed(2))
      : null;

    setTotalStats({
      totalFiles: selectedFiles.length,
      totalOriginalSize: totalOriginalSize > 0 ? totalOriginalSize : 0,
      totalCompressedSize: totalCompressedSize > 0 ? totalCompressedSize : 0,
      totalSaved,
      totalSavedPercentage,
      totalOriginalSizeFormatted: totalOriginalSize > 0 ? formatFileSize(totalOriginalSize) : '未知',
      totalCompressedSizeFormatted: totalCompressedSize > 0 ? formatFileSize(totalCompressedSize) : '未知',
      totalSavedFormatted: totalSaved !== null && !isNaN(totalSaved) ? formatFileSize(Math.abs(totalSaved)) : '未知',
    });

    setCompressing(false);
    setCompressingIndex(-1);
  };

  const handleDownload = (result) => {
    if (result && result.result) {
      downloadCompressedImage(result.result.blob, `compressed-${result.file.name}`);
    }
  };

  // 手动上传文件到后端（不使用回调函数的方式）
  const handleManualUpload = async (result, fileIndex) => {
    if (!result || !result.result || !result.result.file) {
      alert('文件不存在，无法上传');
      return;
    }

    // 直接使用 result.fileInfo（已经是 Element UI 格式）
    const fileInfo = result.result.fileInfo || result.fileInfo;
    if (!fileInfo) {
      alert('文件信息不存在');
      return;
    }
    
    fileInfo.status = 'uploading'; // 更新状态为上传中
    
    console.log('手动上传，文件信息（Element UI 格式）:', fileInfo);
    console.log('文件详情:', {
      name: fileInfo.name,
      size: fileInfo.sizeFormatted,
      type: fileInfo.type,
      uid: fileInfo.uid,
      status: fileInfo.status,
      compressionInfo: fileInfo.compressionInfo,
    });

    setUploadStatus(prev => ({
      ...prev,
      [fileIndex]: { uploading: true, success: false, error: null, fileInfo }
    }));

    try {
      const uploadResult = await simulateUploadToBackend(
        result.result.file, 
        result.result, 
        result.file.name
      );
      
      // 更新文件信息状态为成功
      fileInfo.status = 'success';
      fileInfo.response = uploadResult; // Element UI 格式：服务器响应
      fileInfo.url = uploadResult.url;  // Element UI 格式：文件 URL
      
      setUploadStatus(prev => ({
        ...prev,
        [fileIndex]: { uploading: false, success: true, error: null, result: uploadResult, fileInfo }
      }));
      
      console.log('上传成功，更新后的文件信息:', fileInfo);
      alert('上传成功！');
    } catch (error) {
      // 更新文件信息状态为失败
      fileInfo.status = 'fail';
      fileInfo.error = error.message;
      
      setUploadStatus(prev => ({
        ...prev,
        [fileIndex]: { uploading: false, success: false, error: error.message, fileInfo }
      }));
      
      console.error('上传失败，文件信息:', fileInfo);
      alert(`上传失败: ${error.message}`);
    }
  };

  // 模拟上传到后端（实际使用时替换为真实的后端接口）
  const simulateUploadToBackend = async (compressedFile, compressionResult, originalFileName) => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // 模拟上传（实际使用时，这里应该是真实的 fetch 调用）
    // const formData = new FormData();
    // formData.append('image', compressedFile);
    // formData.append('originalSize', compressionResult.originalSize);
    // formData.append('compressedSize', compressionResult.compressedSize);
    // 
    // const response = await fetch('/api/upload', {
    //   method: 'POST',
    //   body: formData,
    // });
    // 
    // if (!response.ok) {
    //   throw new Error('上传失败');
    // }
    // 
    // return await response.json();

    // 模拟返回结果
    return {
      success: true,
      url: `https://example.com/uploads/${compressedFile.name}`,
      fileSize: compressionResult.compressedSize,
      uploadedAt: new Date().toISOString(),
    };
  };

  return (
    <div style={{ 
      marginBottom: '40px', 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h2>无损压缩功能演示与对比（支持批量处理）</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input 
            type="file" 
            accept="image/*" 
            multiple
            onChange={handleFileChange}
            style={{ marginBottom: '10px' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={enableAutoUpload}
              onChange={(e) => setEnableAutoUpload(e.target.checked)}
            />
            <span style={{ fontSize: '14px' }}>启用自动上传（使用回调函数）</span>
          </label>
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          💡 支持批量选择多个图片文件，选择后会自动开始压缩
          {enableAutoUpload && (
            <span style={{ color: '#1890ff', marginLeft: '10px' }}>
              ✓ 已启用自动上传：压缩完成后会自动通过回调函数上传到后端
            </span>
          )}
        </div>
        
        {compressing && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#e3f2fd',
            borderRadius: '4px',
            marginBottom: '10px'
          }}>
            <strong>压缩进度：</strong>
            {compressingIndex >= 0 && (
              <span>正在处理第 {compressingIndex + 1} / {files.length} 个文件 ({files[compressingIndex]?.name})</span>
            )}
            {compressingIndex < 0 && <span>准备中...</span>}
          </div>
        )}

        {totalStats && (
          <div style={{ 
            padding: '15px', 
            backgroundColor: '#e8f5e9',
            borderRadius: '4px',
            marginBottom: '10px'
          }}>
            <h3 style={{ marginTop: 0 }}>总体统计</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
              gap: '10px',
              marginTop: '10px'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>文件数量</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{totalStats.totalFiles} 个</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>原始总大小</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{totalStats.totalOriginalSizeFormatted}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>压缩后总大小</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>{totalStats.totalCompressedSizeFormatted}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {totalStats.totalSavedPercentage !== null && totalStats.totalSavedPercentage > 0 ? '节省总大小' : '变化总大小'}
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: totalStats.totalSavedPercentage !== null && totalStats.totalSavedPercentage > 0 ? '#1890ff' : '#ff9800'
                }}>
                  {totalStats.totalSavedFormatted !== '未知' ? totalStats.totalSavedFormatted : '无法计算'}
                  {totalStats.totalSavedPercentage !== null && (
                    <span style={{ fontSize: '14px', marginLeft: '5px' }}>
                      ({totalStats.totalSavedPercentage > 0 ? '-' : '+'}{Math.abs(totalStats.totalSavedPercentage)}%)
                    </span>
                  )}
                  {totalStats.totalSavedPercentage === null && totalStats.totalSavedFormatted === '未知' && (
                    <span style={{ fontSize: '12px', marginLeft: '5px', color: '#999' }}>
                      (部分文件无法获取原始大小)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 批量文件结果列表 */}
      {results.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>压缩结果列表</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '20px',
            marginTop: '15px'
          }}>
            {results.map((item, index) => (
              <div key={index} style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '15px',
                backgroundColor: 'white'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}>
                    {item.file.name}
                    {compressingIndex === index && <span style={{ color: '#1890ff', marginLeft: '10px' }}>⏳ 压缩中...</span>}
                  </h4>
                  
                  {item.error ? (
                    <div style={{ padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px', color: '#c62828' }}>
                      ❌ 压缩失败: {item.error}
                    </div>
                  ) : item.result ? (
                    <>
                      {/* 三栏对比 */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)', 
                        gap: '10px',
                        marginBottom: '10px'
                      }}>
                        {/* 原始图片 */}
                        <div>
                          <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>原始</div>
                          <img 
                            src={item.preview.dataURL} 
                            alt="原始" 
                            style={{ 
                              width: '100%', 
                              height: 'auto', 
                              borderRadius: '4px',
                              border: '1px solid #eee'
                            }} 
                          />
                          <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>
                            {item.result.originalSizeFormatted || '未知'}
                          </div>
                        </div>

                        {/* 优化后 */}
                        <div>
                          <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>优化</div>
                          <img 
                            src={item.optimizedUrl} 
                            alt="优化" 
                            style={{ 
                              width: '100%', 
                              height: 'auto', 
                              borderRadius: '4px',
                              border: '1px solid #eee'
                            }}
                            onError={(e) => {
                              e.target.src = item.preview.dataURL;
                            }}
                          />
                          <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>
                            CDN优化
                          </div>
                        </div>

                        {/* 无损压缩 */}
                        <div>
                          <div style={{ fontSize: '11px', color: '#666', marginBottom: '5px' }}>无损</div>
                          <img 
                            src={item.result.dataURL} 
                            alt="无损压缩" 
                            style={{ 
                              width: '100%', 
                              height: 'auto', 
                              borderRadius: '4px',
                              border: '1px solid #eee'
                            }} 
                          />
                          <div style={{ fontSize: '10px', color: '#52c41a', marginTop: '5px', fontWeight: 'bold' }}>
                            {item.result.compressedSizeFormatted}
                          </div>
                        </div>
                      </div>

                      {/* 压缩信息 */}
                      <div style={{ 
                        padding: '10px', 
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        <div style={{ marginBottom: '5px' }}>
                          <strong>格式:</strong> {item.result.originalFormat?.toUpperCase() || '未知'} → {item.result.compressedFormat.toUpperCase()}
                        </div>
                        <div style={{ marginBottom: '5px' }}>
                          <strong>尺寸:</strong> {item.result.compressedWidth} × {item.result.compressedHeight}px
                        </div>
                        <div style={{ marginBottom: '5px' }}>
                          <strong>压缩效果:</strong>
                          <span style={{ 
                            color: item.result.savedPercentage !== null && item.result.savedPercentage > 0 ? '#52c41a' : '#ff9800',
                            fontWeight: 'bold',
                            marginLeft: '5px'
                          }}>
                            {item.result.savedPercentage !== null 
                              ? (item.result.savedPercentage > 0
                                  ? `节省 ${item.result.savedSizeFormatted || '未知'} (${item.result.savedPercentage}%)`
                                  : `增加 ${item.result.savedSizeFormatted || '未知'} (+${Math.abs(item.result.savedPercentage)}%)`)
                              : '无法计算'}
                          </span>
                        </div>
                        <div>
                          <strong>耗时:</strong> {item.performance.compressTimeFormatted}
                        </div>
                      </div>

                      {/* 上传状态显示 */}
                      {uploadStatus[item.index] && (
                        <div style={{ 
                          marginTop: '10px',
                          padding: '8px',
                          backgroundColor: uploadStatus[item.index].uploading 
                            ? '#e3f2fd' 
                            : uploadStatus[item.index].success 
                            ? '#e8f5e9' 
                            : '#ffebee',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          {uploadStatus[item.index].uploading && (
                            <div style={{ color: '#1890ff' }}>
                              ⏳ 正在上传到后端...
                            </div>
                          )}
                          {uploadStatus[item.index].success && (
                            <div style={{ color: '#52c41a' }}>
                              ✅ 上传成功！
                                {uploadStatus[item.index].result && (
                                  <div style={{ fontSize: '11px', marginTop: '5px', color: '#666' }}>
                                    文件URL: 
                                    <div 
                                      title={uploadStatus[item.index].result.url}
                                      style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        wordBreak: 'break-all',
                                        maxWidth: '100%'
                                      }}
                                    >
                                      {uploadStatus[item.index].result.url}
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}
                          {uploadStatus[item.index].error && (
                            <div style={{ color: '#f5222d' }}>
                              ❌ 上传失败: {uploadStatus[item.index].error}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 操作按钮 */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '10px',
                        marginTop: '10px'
                      }}>
                        <button 
                          onClick={() => handleDownload(item)}
                          style={{
                            padding: '8px',
                            backgroundColor: '#52c41a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          下载
                        </button>
                        <button 
                          onClick={() => handleManualUpload(item, item.index)}
                          disabled={uploadStatus[item.index]?.uploading || uploadStatus[item.index]?.success}
                          style={{
                            padding: '8px',
                            backgroundColor: uploadStatus[item.index]?.uploading || uploadStatus[item.index]?.success
                              ? '#d9d9d9'
                              : '#1890ff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: uploadStatus[item.index]?.uploading || uploadStatus[item.index]?.success
                              ? 'not-allowed'
                              : 'pointer',
                            fontSize: '12px',
                            opacity: uploadStatus[item.index]?.uploading || uploadStatus[item.index]?.success ? 0.6 : 1
                          }}
                        >
                          {uploadStatus[item.index]?.uploading 
                            ? '上传中...' 
                            : uploadStatus[item.index]?.success 
                            ? '已上传' 
                            : '上传到后端'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                      等待压缩...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 在线图片优化展示组件
function OnlineImageOptimizeDemo() {
  const imageUrl = "https://pic.rmb.bdstatic.com/bjh/pay_read/3883a287b37eaa34dcf80a031f969db05547.jpeg";
  const [optimizedImages, setOptimizedImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleOptimizeImage = async () => {
    setLoading(true);
    try {
      // 使用 losslessCompress 优化在线图片
      const result = await losslessCompress(imageUrl, {
        maxWidth: 1920,
        format: 'webp',
        compressionLevel: 6,
      });

      setOptimizedImages(prev => [...prev, {
        originalUrl: imageUrl,
        optimized: result,
        timestamp: Date.now(),
      }]);
    } catch (error) {
      console.error('图片优化失败:', error);
      alert('图片优化失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h2>在线图片优化展示</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        使用图片优化工具对在线 URL 的高清图片进行优化处理，展示优化效果
      </p>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleOptimizeImage}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#d9d9d9' : '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {loading ? '优化中...' : '优化图片'}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* 原始图片展示 */}
        <div style={{ marginBottom: '30px',width: '48%' }}>
          <h3>原始图片</h3>
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '15px',
            backgroundColor: 'white',
          }}>
            <h3 style={ {marginTop: '0px'} }>优化前的图片</h3>
            <LazyImage
              src={imageUrl}
              alt="原始高清图片"
              width={'auto'}
              height={'auto'}
              optimize={{
                width: 1920,
                quality: 90,
                autoFormat: true
              }}
              showPlaceholderIcon={true}
              onLoad={(event, optimizationInfo) => {
                console.log('原始图片加载完成', optimizationInfo);
              }}
            />
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                图片URL: 
                <div title={imageUrl} style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  wordBreak: 'break-all',
                  maxWidth: '100%'
                }}>
                  {imageUrl}
                </div>
              </div>
          </div>
        </div>
        {/* 优化后的图片列表 */}
        {optimizedImages.length > 0 && (
          <div style={{ width: '48%' }}>
            <h3>优化后的图片 ({optimizedImages.length})</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
              gap: '20px',
              marginTop: '15px'
            }}>
              {optimizedImages.map((item, index) => (
                <div key={item.timestamp} style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '15px',
                  backgroundColor: 'white'
                }}>
                  <h4 style={{ marginTop: 0, marginBottom: '15px' }}>
                    优化结果 #{index + 1}
                  </h4>
                  
                  {/* 优化后的图片 */}
                  <div style={{ marginBottom: '15px' }}>
                    <img 
                      src={item.optimized.dataURL} 
                      alt="优化后的图片"
                      style={{ 
                        width: '100%', 
                        height: 'auto', 
                        borderRadius: '4px',
                        border: '1px solid #eee'
                      }} 
                    />
                  </div>

                  {/* 优化信息 */}
                  <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    <div style={{ marginBottom: '5px' }}>
                      <strong>格式:</strong> {item.optimized.originalFormat?.toUpperCase() || '未知'} → {item.optimized.compressedFormat.toUpperCase()}
                    </div>
                    <div style={{ marginBottom: '5px' }}>
                      <strong>尺寸:</strong> {item.optimized.compressedWidth} × {item.optimized.compressedHeight}px
                    </div>
                    <div style={{ marginBottom: '5px' }}>
                      <strong>原始大小:</strong> {item.optimized.originalSizeFormatted || '未知'}
                    </div>
                    <div style={{ marginBottom: '5px' }}>
                      <strong>优化后大小:</strong> 
                      <span style={{ color: '#52c41a', fontWeight: 'bold', marginLeft: '5px' }}>
                        {item.optimized.compressedSizeFormatted}
                      </span>
                    </div>
                    {item.optimized.savedPercentage !== null && (
                      <div style={{ marginBottom: '5px' }}>
                        <strong>节省:</strong>
                        <span style={{ 
                          color: item.optimized.savedPercentage > 0 ? '#52c41a' : '#ff9800',
                          fontWeight: 'bold',
                          marginLeft: '5px'
                        }}>
                          {item.optimized.savedPercentage > 0 ? '-' : '+'}{Math.abs(item.optimized.savedPercentage)}%
                          ({item.optimized.savedSizeFormatted})
                        </span>
                      </div>
                    )}
                    {item.optimized.gpuAccelerated && (
                      <div style={{ marginBottom: '5px', color: '#1890ff' }}>
                        <strong>GPU加速:</strong> ✓ 已启用 ({item.optimized.gpuMethod})
                      </div>
                    )}
                  </div>

                  {/* 下载按钮 */}
                  <button 
                    onClick={() => downloadCompressedImage(item.optimized.blob, `optimized-${index + 1}.${item.optimized.compressedFormat}`)}
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      padding: '8px',
                      backgroundColor: '#52c41a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    下载优化图片
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 在线图片无损压力测试组件
function OnlineImageStressTest() {
  const imageUrl = "https://pic.rmb.bdstatic.com/bjh/pay_read/3883a287b37eaa34dcf80a031f969db05547.jpeg";
  const [optimizedImages, setOptimizedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 40 });
  const [totalTime, setTotalTime] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [stats, setStats] = useState(null);

  // 自动执行压力测试
  useEffect(() => {
    const runStressTest = async () => {
      setLoading(true);
      setStartTime(Date.now());
      setOptimizedImages([]);
      setProgress({ current: 0, total: 40 });

      const results = [];
      const totalStartTime = Date.now();
      let totalOriginalSize = 0;
      let totalCompressedSize = 0;
      let successCount = 0;
      let failCount = 0;

      // 并发处理40张图片（使用 Promise.all 但限制并发数）
      const batchSize = 5; // 每批处理5张
      const totalBatches = Math.ceil(40 / batchSize);

      for (let batch = 0; batch < totalBatches; batch++) {
        const batchPromises = [];
        const batchStart = batch * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, 40);

        for (let i = batchStart; i < batchEnd; i++) {
          batchPromises.push(
            losslessCompress(imageUrl, {
              maxWidth: 1920,
              format: 'webp',
              compressionLevel: 6,
            })
              .then((result) => {
                results.push({
                  index: i + 1,
                  optimized: result,
                  timestamp: Date.now(),
                  success: true,
                });
                if (result.originalSize) totalOriginalSize += result.originalSize;
                if (result.compressedSize) totalCompressedSize += result.compressedSize;
                successCount++;
                setProgress({ current: i + 1, total: 40 });
                setOptimizedImages([...results]);
              })
              .catch((error) => {
                results.push({
                  index: i + 1,
                  error: error.message,
                  timestamp: Date.now(),
                  success: false,
                });
                failCount++;
                setProgress({ current: i + 1, total: 40 });
                setOptimizedImages([...results]);
              })
          );
        }

        await Promise.all(batchPromises);
      }

      const totalEndTime = Date.now();
      const totalTimeMs = totalEndTime - totalStartTime;
      const totalTimeSeconds = (totalTimeMs / 1000).toFixed(2);
      const totalTimeMinutes = (totalTimeMs / 60000).toFixed(2);

      setTotalTime({
        ms: totalTimeMs,
        seconds: totalTimeSeconds,
        minutes: totalTimeMinutes,
        formatted: totalTimeMs < 60000 
          ? `${totalTimeSeconds} 秒` 
          : `${totalTimeMinutes} 分钟 (${totalTimeSeconds} 秒)`
      });

      const totalSaved = totalOriginalSize > 0 ? (totalOriginalSize - totalCompressedSize) : null;
      const totalSavedPercentage = totalOriginalSize > 0 
        ? parseFloat(((totalSaved / totalOriginalSize) * 100).toFixed(2))
        : null;

      setStats({
        totalImages: 40,
        successCount,
        failCount,
        totalOriginalSize,
        totalCompressedSize,
        totalSaved,
        totalSavedPercentage,
        totalOriginalSizeFormatted: totalOriginalSize > 0 ? formatFileSize(totalOriginalSize) : '未知',
        totalCompressedSizeFormatted: totalCompressedSize > 0 ? formatFileSize(totalCompressedSize) : '未知',
        totalSavedFormatted: totalSaved !== null ? formatFileSize(Math.abs(totalSaved)) : '未知',
        averageTime: (totalTimeMs / 40).toFixed(2),
      });

      setLoading(false);
    };

    runStressTest();
  }, []); // 只在组件挂载时执行一次

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h2>在线图片无损压力测试</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        自动对同一张图片进行40次无损压缩处理，测试性能和稳定性
      </p>

      {/* 进度和统计信息 */}
      <div style={{ 
        padding: '15px', 
        backgroundColor: loading ? '#e3f2fd' : '#e8f5e9',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <div style={{ marginBottom: '10px' }}>
          <strong>处理进度:</strong> {progress.current} / {progress.total} 
          <div style={{ 
            width: '100%', 
            height: '20px', 
            backgroundColor: '#e0e0e0', 
            borderRadius: '10px',
            marginTop: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(progress.current / progress.total) * 100}%`,
              height: '100%',
              backgroundColor: loading ? '#1890ff' : '#52c41a',
              transition: 'width 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {Math.round((progress.current / progress.total) * 100)}%
            </div>
          </div>
        </div>

        {loading && (
          <div style={{ color: '#1890ff', fontSize: '14px' }}>
            ⏳ 正在处理中，请稍候...
          </div>
        )}

        {totalTime && !loading && (
          <div style={{ marginTop: '15px' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a', marginBottom: '10px' }}>
              ✅ 全部处理完成！
            </div>
            <div style={{ fontSize: '16px', marginBottom: '5px' }}>
              <strong>总耗时:</strong> {totalTime.formatted}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              <strong>平均每张:</strong> {stats.averageTime} 毫秒
            </div>
          </div>
        )}

        {stats && !loading && (
          <div style={{ 
            marginTop: '15px',
            padding: '10px',
            backgroundColor: 'white',
            borderRadius: '4px'
          }}>
            <h4 style={{ marginTop: 0, marginBottom: '10px' }}>统计信息</h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
              gap: '10px',
              fontSize: '12px'
            }}>
              <div>
                <div style={{ color: '#666' }}>成功数量</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                  {stats.successCount} 张
                </div>
              </div>
              <div>
                <div style={{ color: '#666' }}>失败数量</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: stats.failCount > 0 ? '#f5222d' : '#52c41a' }}>
                  {stats.failCount} 张
                </div>
              </div>
              <div>
                <div style={{ color: '#666' }}>原始总大小</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {stats.totalOriginalSizeFormatted}
                </div>
              </div>
              <div>
                <div style={{ color: '#666' }}>压缩后总大小</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                  {stats.totalCompressedSizeFormatted}
                </div>
              </div>
              <div>
                <div style={{ color: '#666' }}>节省总大小</div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: stats.totalSavedPercentage > 0 ? '#1890ff' : '#ff9800'
                }}>
                  {stats.totalSavedFormatted}
                  {stats.totalSavedPercentage !== null && (
                    <span style={{ fontSize: '12px', marginLeft: '5px' }}>
                      ({stats.totalSavedPercentage > 0 ? '-' : '+'}{Math.abs(stats.totalSavedPercentage)}%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 优化后的图片网格 */}
      {optimizedImages.length > 0 && (
        <div>
          <h3>优化结果 ({optimizedImages.length} 张)</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: '15px',
            marginTop: '15px'
          }}>
            {optimizedImages.map((item, index) => (
              <div key={item.timestamp || index} style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '10px',
                backgroundColor: 'white',
                position: 'relative'
              }}>
                {item.success ? (
                  <>
                    <div style={{ 
                      position: 'absolute', 
                      top: '5px', 
                      right: '5px',
                      backgroundColor: '#52c41a',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      #{item.index}
                    </div>
                    <img 
                      src={item.optimized.dataURL} 
                      alt={`优化图片 ${item.index}`}
                      style={{ 
                        width: '100%', 
                        height: 'auto', 
                        borderRadius: '4px',
                        border: '1px solid #eee'
                      }} 
                    />
                    <div style={{ 
                      marginTop: '8px', 
                      fontSize: '11px',
                      color: '#666'
                    }}>
                      <div>大小: {item.optimized.compressedSizeFormatted}</div>
                      {item.optimized.savedPercentage !== null && (
                        <div style={{ 
                          color: item.optimized.savedPercentage > 0 ? '#52c41a' : '#ff9800'
                        }}>
                          节省: {item.optimized.savedPercentage > 0 ? '-' : '+'}{Math.abs(item.optimized.savedPercentage)}%
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ 
                    padding: '20px', 
                    textAlign: 'center',
                    color: '#f5222d'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '5px' }}>❌</div>
                    <div style={{ fontSize: '12px' }}>失败</div>
                    <div style={{ fontSize: '10px', marginTop: '5px', color: '#999' }}>
                      {item.error}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 模糊到清晰的渐进式加载演示组件
function BlurToClearDemo() {
  const imageUrl = "https://pic.rmb.bdstatic.com/bjh/pay_read/3883a287b37eaa34dcf80a031f969db05547.jpeg";
  const [stageInfo1, setStageInfo1] = useState('');
  const [stageInfo2, setStageInfo2] = useState('');
  const [stageInfo3, setStageInfo3] = useState('');

  return (
    <div style={{ 
      marginTop: '40px',
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>模糊到清晰的渐进式加载示例（Instagram风格）</h3>
      <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
        🎨 新功能：图片从模糊逐渐变清晰，适合网络较差的场景。
        先加载极小的模糊占位图，然后逐步加载更清晰的版本，最后加载原图。
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px',
        marginTop: '20px'
      }}>
        {/* 示例1: 默认3阶段 */}
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '15px',
          backgroundColor: 'white'
        }}>
          <h4 style={{ marginTop: 0, marginBottom: '15px' }}>示例1: 默认3阶段</h4>
          <ProgressiveImage
            src={imageUrl}
            alt="渐进式加载示例1"
            width="100%"
            height={300}
            stages={[
              { width: 20, quality: 20 },   // 阶段1: 极速模糊图
              { width: 400, quality: 50 },   // 阶段2: 中等质量
              { width: null, quality: 80 }   // 阶段3: 最终质量（原图）
            ]}
            transitionDuration={300}
            timeout={30000}
            onStageComplete={(stageIndex, stageUrl, stage) => {
              setStageInfo1(`阶段 ${stageIndex + 1} 完成: ${stage.width ? `${stage.width}px` : '原图'}`);
            }}
            onComplete={(finalUrl) => {
              setStageInfo1('全部加载完成！');
            }}
          />
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            {stageInfo1 || '等待加载...'}
          </div>
        </div>

        {/* 示例2: 自定义2阶段（快速） */}
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '15px',
          backgroundColor: 'white'
        }}>
          <h4 style={{ marginTop: 0, marginBottom: '15px' }}>示例2: 快速2阶段（自定义超时）</h4>
          <ProgressiveImage
            src={imageUrl}
            alt="渐进式加载示例2"
            width="100%"
            height={300}
            stages={[
              { width: 50, quality: 30 },    // 阶段1: 快速模糊图
              { width: null, quality: 85 }    // 阶段2: 最终质量
            ]}
            transitionDuration={200}
            timeout={60000}
            onStageComplete={(stageIndex, stageUrl, stage) => {
              setStageInfo2(`阶段 ${stageIndex + 1} 完成`);
            }}
            onComplete={(finalUrl) => {
              setStageInfo2('加载完成！');
            }}
          />
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            {stageInfo2 || '等待加载...'}
          </div>
        </div>

        {/* 示例3: 4阶段精细加载 */}
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '15px',
          backgroundColor: 'white'
        }}>
          <h4 style={{ marginTop: 0, marginBottom: '15px' }}>示例3: 4阶段精细加载</h4>
          <ProgressiveImage
            src={imageUrl}
            alt="渐进式加载示例3"
            width="100%"
            height={300}
            stages={[
              { width: 20, quality: 20 },     // 阶段1: 极速模糊
              { width: 200, quality: 40 },    // 阶段2: 小图
              { width: 600, quality: 60 },    // 阶段3: 中图
              { width: null, quality: 85 }    // 阶段4: 原图
            ]}
            transitionDuration={400}
            onStageComplete={(stageIndex, stageUrl, stage) => {
              setStageInfo3(`阶段 ${stageIndex + 1}/4 完成`);
            }}
            onComplete={(finalUrl) => {
              setStageInfo3('全部完成！');
            }}
          />
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            {stageInfo3 || '等待加载...'}
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div style={{ 
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#e3f2fd',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <h4 style={{ marginTop: 0 }}>使用说明</h4>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>第一阶段：加载极小的模糊图（20px宽，质量20%），快速显示占位</li>
          <li>第二阶段：加载中等质量图片（400px宽，质量50%），提升清晰度</li>
          <li>第三阶段：加载最终高质量图片（原图，质量80%），完全清晰</li>
          <li>每个阶段之间有平滑的过渡动画（300ms）</li>
          <li>适合网络较差的场景，用户可以立即看到模糊预览</li>
        </ul>
      </div>
    </div>
  );
}

// 渐进式加载演示组件
function ProgressiveLoadDemo() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState(null);

  // 生成100张图片URL（使用相同的图片URL作为示例）
  const generateImageUrls = () => {
    const baseUrl = "https://pic.rmb.bdstatic.com/bjh/pay_read/3883a287b37eaa34dcf80a031f969db05547.jpeg";
    return Array.from({ length: 100 }, (_, i) => ({
      url: baseUrl,
      priority: i < 20 ? 10 : (i < 50 ? 5 : 0), // 前20张优先级最高
      index: i,
    }));
  };

  const handleStartLoading = async () => {
    setLoading(true);
    setImages([]);
    setProgress(0);
    setStats(null);

    const imageList = generateImageUrls();
    let successCount = 0;
    let failCount = 0;

    const results = await loadImagesProgressively(imageList, {
      concurrency: 100, // 高并发
      timeout: 30000,
      priority: true, // 启用优先级
      // 渐进式加载阶段：从模糊到清晰
      stages: [
        { width: 20, quality: 20 },   // 阶段1: 极速模糊图
        { width: 400, quality: 50 },   // 阶段2: 中等质量
        { width: null, quality: 80 }    // 阶段3: 最终质量（原图）
      ],
      onProgress: (current, total, result) => {
        const percentage = ((current / total) * 100).toFixed(1);
        setProgress(parseFloat(percentage));
      },
      // 阶段完成回调：每完成一个阶段就更新图片
      onItemStageComplete: (stageResult, stageIndex) => {
        const { index, stageUrl, currentStage, totalStages } = stageResult;
        // 更新图片URL，显示当前阶段的图片
        setImages(prev => {
          const newImages = [...prev];
          if (!newImages[index]) {
            newImages[index] = {
              url: stageUrl,
              index,
              loaded: false,
              error: null,
              currentStage,
              totalStages,
              isComplete: false,
            };
          } else {
            newImages[index] = {
              ...newImages[index],
              url: stageUrl,
              currentStage,
              isComplete: currentStage === totalStages,
            };
          }
          return newImages;
        });
      },
      onItemComplete: (result) => {
        if (result.success) {
          successCount++;
          // 最终完成，标记为已加载
          setImages(prev => {
            const newImages = [...prev];
            newImages[result.index] = {
              url: result.url,
              index: result.index,
              loaded: true,
              error: null,
              isComplete: true,
            };
            return newImages;
          });
        } else {
          failCount++;
          // 显示错误占位符
          setImages(prev => {
            const newImages = [...prev];
            newImages[result.index] = {
              url: result.url,
              index: result.index,
              loaded: false,
              error: result.error,
              isComplete: false,
            };
            return newImages;
          });
        }
      },
    });

    // 更新统计信息
    setStats({
      total: results.length,
      success: successCount,
      failed: failCount,
      successRate: ((successCount / results.length) * 100).toFixed(1),
    });

    setLoading(false);
  };

  return (
    <div style={{ 
      marginTop: '40px',
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>渐进式加载示例（100张图片，模糊到清晰）</h3>
      <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
        🎨 新功能：每张图片从模糊逐渐变清晰（3阶段加载）。
        先加载极小的模糊图（20px），然后中等质量（400px），最后加载原图。
        支持高并发（默认10）、错误隔离、独立错误信息。
      </p>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleStartLoading}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#d9d9d9' : '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {loading ? '加载中...' : '开始加载100张图片'}
        </button>
      </div>

      {/* 进度条 */}
      {loading && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '10px',
            fontSize: '14px'
          }}>
            <span>加载进度: {progress.toFixed(1)}%</span>
            <span>{images.filter(img => img && img.loaded).length} / 100 已加载</span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '24px', 
            backgroundColor: '#e0e0e0', 
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#1890ff',
              transition: 'width 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {Math.round(progress)}%
            </div>
          </div>
        </div>
      )}

      {/* 统计信息 */}
      {stats && !loading && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#e8f5e9',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h4 style={{ marginTop: 0, marginBottom: '10px' }}>加载统计</h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '10px',
            fontSize: '14px'
          }}>
            <div>
              <div style={{ color: '#666', fontSize: '12px' }}>总计</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{stats.total} 张</div>
            </div>
            <div>
              <div style={{ color: '#666', fontSize: '12px' }}>成功</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                {stats.success} 张
              </div>
            </div>
            <div>
              <div style={{ color: '#666', fontSize: '12px' }}>失败</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: stats.failed > 0 ? '#f5222d' : '#52c41a' }}>
                {stats.failed} 张
              </div>
            </div>
            <div>
              <div style={{ color: '#666', fontSize: '12px' }}>成功率</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                {stats.successRate}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 图片网格 */}
      {images.length > 0 && (
        <div>
          <h4 style={{ marginBottom: '15px' }}>图片展示 ({images.filter(img => img).length} 张)</h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
            gap: '10px',
            maxHeight: '600px',
            overflowY: 'auto',
            padding: '10px',
            backgroundColor: 'white',
            borderRadius: '4px'
          }}>
            {images.map((img, i) => (
              img ? (
                <div key={i} style={{ 
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: '1px solid #ddd'
                }}>
                  {img.error ? (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#ffebee',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#f5222d',
                      fontSize: '12px',
                      padding: '5px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '20px', marginBottom: '5px' }}>❌</div>
                      <div style={{ fontSize: '10px' }}>加载失败</div>
                    </div>
                  ) : (
                    <img 
                      src={img.url} 
                      alt={`图片 ${i + 1}`}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        transition: 'filter 0.3s ease-in-out, opacity 0.3s ease-in-out',
                        // 真正的渐进式加载资源 + CSS模糊效果增强视觉体验
                        filter: img.currentStage === 1 ? 'blur(10px)' : 
                                img.currentStage === 2 ? 'blur(3px)' : 
                                'blur(0px)',
                        opacity: img.isComplete ? 1 : 0.95,
                      }} 
                    />
                  )}
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    backgroundColor: img.error ? '#f5222d' : 
                                    img.isComplete ? '#52c41a' : 
                                    '#1890ff',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    #{i + 1}
                    {img.currentStage && !img.isComplete && (
                      <span style={{ marginLeft: '4px', fontSize: '9px' }}>
                        {img.currentStage}/{img.totalStages}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div key={i} style={{ 
                  aspectRatio: '1',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999',
                  fontSize: '12px'
                }}>
                  等待中...
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 简单的 Tabs 组件
function Tabs({ children, tabs }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      {/* Tab 标签 */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #e0e0e0',
        marginBottom: '20px'
      }}>
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === index ? 'bold' : 'normal',
              color: activeTab === index ? '#1890ff' : '#666',
              borderBottom: activeTab === index ? '2px solid #1890ff' : '2px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.3s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div>
        {children[activeTab]}
      </div>
    </div>
  );
}

function App() {
  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px' }}>图片优化工具演示</h1>
      
      <Tabs tabs={['LazyImage 组件示例', '图片优化上传工具演示', '在线图片优化展示', '渐进式加载示例', '模糊到清晰的渐进式加载示例']}>
        {/* 第一页：LazyImage 组件示例 */}
        <div>
          <h2>LazyImage 组件示例</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            展示 LazyImage 组件的懒加载和图片优化功能
          </p>
          
          <div style={{ marginBottom: '20px' }}>
            <h3>懒加载示例</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <LazyImage 
                  key={i}
                  src="https://pic.rmb.bdstatic.com/bjh/pay_read/3883a287b37eaa34dcf80a031f969db05547.jpeg"
                  alt={`懒加载图片 ${i + 1}`}
                  width={200}
                  height={200}
                  rootMargin="50px"
                  optimize={{
                    width: 1376,
                    quality: 90
                  }}
                  onOptimization={(info) => {}}
                  onLoad={(event, optimizationInfo) => {
                    // console.log(`图片 ${i + 1} 加载完成`);
                  }}
                  onClick={(event, imageInfo) => {
                    // console.log(`图片 ${i + 1} 被点击`);
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 第二页：图片优化工具演示 */}
        <div>
          <LosslessCompressDemo />
        </div>

        {/* 第三页：在线图片优化展示 */}
        <div>
          <OnlineImageOptimizeDemo />
        </div>

        {/* 第四页 渐进式加载示例 */}
        <div>
          <ProgressiveLoadDemo />
        </div>

        {/* 第五页 模糊到清晰的渐进式加载示例 */}
        <div>
          <BlurToClearDemo />
        </div>
        {/* 第四页：在线图片无损压力测试 */}
        {/* <div>
          <OnlineImageStressTest />
        </div> */}
      </Tabs>
    </div>
  );
}

export default App;
