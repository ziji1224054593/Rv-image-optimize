import React, { useState } from 'react';
import { LazyImage } from '../src/index.js';
import { 
  losslessCompress, 
  checkLosslessCompressionSuitability,
  downloadCompressedImage 
} from '../losslessCompress.js';
import { optimizeImageUrl, formatFileSize } from '../imageOptimize.js';
import '../src/LazyImage.css';

// 无损压缩对比组件
function LosslessCompressDemo() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]); // 存储所有文件的压缩结果
  const [compressing, setCompressing] = useState(false);
  const [compressingIndex, setCompressingIndex] = useState(-1); // 当前正在压缩的文件索引
  const [totalStats, setTotalStats] = useState(null); // 总体统计

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    setFiles(selectedFiles);
    setResults([]);
    setTotalStats(null);
    setCompressing(true);

    // 自动开始压缩所有文件
    const compressResults = [];
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setCompressingIndex(i);

      try {
        // 检查是否适合无损压缩
        const suitability = await checkLosslessCompressionSuitability(file);

        // 执行无损压缩
        const startTime = window.performance.now();
        const result = await losslessCompress(file, {
          maxWidth: 1920,
          format: 'webp',
          compressionLevel: 6,
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
          suitability,
          result,
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
        <input 
          type="file" 
          accept="image/*" 
          multiple
          onChange={handleFileChange}
          style={{ marginBottom: '10px' }}
        />
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          💡 支持批量选择多个图片文件，选择后会自动开始压缩
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
                          <strong>格式:</strong> {item.suitability?.format?.toUpperCase() || '未知'} → {item.result.compressedFormat.toUpperCase()}
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

                      {/* 下载按钮 */}
                      <button 
                        onClick={() => handleDownload(item)}
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
                        下载压缩图片
                      </button>
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

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>图片优化工具演示</h1>
      
      {/* 无损压缩演示 */}
      <LosslessCompressDemo />
      
      <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #ddd' }}>
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
          {Array.from({ length: 2 }).map((_, i) => (
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
              onOptimization={(info) => {
                console.log(`图片 ${i + 1} 优化信息:`, info);
                console.log(`原始大小: ${info.originalSizeFormatted}`);
                console.log(`优化后大小: ${info.optimizedSizeFormatted}`);
                console.log(`节省比例: ${info.savedPercentage}%`);
              }}
              onLoad={(event, optimizationInfo) => {
                console.log(`图片 ${i + 1} 加载完成`);
                if (optimizationInfo) {
                  console.log('可通过 onLoad 获取优化信息:', optimizationInfo);
                }
              }}
              onClick={(event, imageInfo) => {
                console.log(`图片 ${i + 1} 被点击`);
                console.log('图片信息:', {
                  src: imageInfo.src,
                  currentSrc: imageInfo.currentSrc,
                  isLoaded: imageInfo.isLoaded,
                  hasError: imageInfo.hasError,
                });
                if (imageInfo.optimizationInfo) {
                  console.log('优化信息:', {
                    savedPercentage: imageInfo.optimizationInfo.savedPercentage + '%',
                    originalSize: imageInfo.optimizationInfo.originalSizeFormatted,
                    optimizedSize: imageInfo.optimizationInfo.optimizedSizeFormatted,
                  });
                }
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
    </div>
  );
}

export default App;
