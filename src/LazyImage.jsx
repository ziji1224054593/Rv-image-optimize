import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  optimizeImageUrl, 
  compareImageSizes, 
  detectCDN,
  compressImageInBrowser,
  dataURLToBlob,
  formatFileSize,
  generateBlurPlaceholderUrl,
} from '../lib/imageOptimize.js';
import { loadImageWithCache, loadImageProgressiveWithCache, setCache } from '../lib/imageCache.js';
import './LazyImage.css';

/**
 * LazyImage 组件 - 支持懒加载和图片优化的图片组件
 * @param {Object} props - 组件属性
 * @param {string} props.src - 原始图片URL
 * @param {string} props.alt - 图片alt文本
 * @param {string|number} props.width - 容器宽度
 * @param {string|number} props.height - 容器高度
 * @param {string} props.className - 容器类名
 * @param {string} props.imageClassName - 图片类名
 * @param {string|number} props.dataId - data-id属性
 * @param {Object} props.imageStyle - 图片样式
 * @param {boolean} props.immediate - 是否立即加载（不懒加载）
 * @param {string} props.rootMargin - 懒加载根边距（提前加载的距离）
 * @param {Object} props.optimize - 图片优化选项
 * @param {number} props.optimize.compressionLevel - 压缩程度（0-1，默认0.5，0=不压缩，1=最大压缩）
 * @param {number} props.optimize.blur - 模糊程度（0-10，默认0，值越大越模糊）
 * @param {boolean} props.optimize.smooth - 是否启用图像平滑（默认true）
 * @param {boolean} props.enableBrowserCompression - 当CDN不支持优化时，是否启用浏览器端压缩（默认true）
 * @param {boolean} props.showPlaceholderIcon - 是否显示占位符图标
 * @param {boolean} props.showErrorMessage - 是否显示错误信息
 * @param {string|null} props.errorSrc - 错误时的默认图片（可选，如果为null则不加载错误图片，直接显示错误占位符）
 * @param {boolean} props.progressive - 是否启用渐进式加载（从模糊到清晰，默认false）
 * @param {Array} props.progressiveStages - 渐进式加载阶段配置，例如：
 *   [
 *     { width: 20, quality: 20, blur: 10 },   // 阶段1: 极速模糊图
 *     { width: 400, quality: 50, blur: 3 },   // 阶段2: 中等质量
 *     { width: null, quality: 80, blur: 0 }   // 阶段3: 最终质量（原图）
 *   ]
 * @param {number} props.progressiveTransitionDuration - 渐进式加载过渡动画时间（毫秒，默认300）
 * @param {number} props.progressiveTimeout - 渐进式加载每个阶段的超时时间（毫秒，默认30000）
 * @param {boolean} props.progressiveEnableCache - 渐进式加载是否启用缓存（默认true）
 * @param {Function} props.onLoad - 加载成功回调 (event, optimizationInfo) - optimizationInfo包含优化信息
 * @param {Function} props.onOptimization - 优化完成回调 (optimizationInfo) - 专门用于接收优化信息
 * @param {Function} props.onError - 加载失败回调
 * @param {Function} props.onClick - 点击回调 (event, imageInfo) - imageInfo包含图片相关信息
 * @param {Function} props.onProgressiveStageComplete - 渐进式加载阶段完成回调 (stageIndex, stageUrl, stage) => void
 */
export default function LazyImage({
  src = '',
  alt = '',
  width = '100%',
  height = 'auto',
  className = '',
  imageClassName = '',
  dataId = null,
  imageStyle = {},
  immediate = false,
  rootMargin = '50px',
  optimize = {
    width: 240,
    height: 320,
    quality: 30,
  },
  enableBrowserCompression = true, // 默认启用浏览器端压缩
  showPlaceholderIcon = false,
  showErrorMessage = false,
  errorSrc = null, // 默认为 null，不加载错误图片，直接显示错误占位符
  progressive = false, // 是否启用渐进式加载
  progressiveStages = [
    { width: 20, quality: 20, blur: 10 },   // 阶段1: 极速模糊图
    { width: 400, quality: 50, blur: 3 },   // 阶段2: 中等质量
    { width: null, quality: 80, blur: 0 }   // 阶段3: 最终质量（原图）
  ],
  progressiveTransitionDuration = 300, // 过渡动画时间（毫秒）
  progressiveTimeout = 30000, // 渐进式加载每个阶段的超时时间（毫秒，默认30秒）
  progressiveEnableCache = true, // 渐进式加载是否启用缓存（默认true）
  onLoad = null,
  onOptimization = null, // 优化完成回调
  onError = null,
  onClick = null,
  onProgressiveStageComplete = null, // 渐进式加载阶段完成回调
}) {
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const observerRef = useRef(null);
  const optimizationInfoRef = useRef(null); // 存储优化信息，供 onClick 使用
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(immediate);
  const [lockedSrc, setLockedSrc] = useState('');
  const [compressedSrc, setCompressedSrc] = useState(null); // 浏览器端压缩后的图片
  const [isCompressing, setIsCompressing] = useState(false);
  const [cachedBlobUrl, setCachedBlobUrl] = useState(null); // 缓存的 Blob URL
  const cachedBlobUrlRef = useRef(null); // 用于清理 Blob URL
  const [progressiveStageIndex, setProgressiveStageIndex] = useState(-1); // 渐进式加载当前阶段索引
  const [progressiveImageUrl, setProgressiveImageUrl] = useState(''); // 渐进式加载当前图片URL
  const progressiveCancelRef = useRef(null); // 用于取消渐进式加载
  const progressiveStageIndexRef = useRef(-1); // 用于同步跟踪当前阶段索引（避免状态更新延迟）
  const progressiveLoadingRef = useRef(false); // 用于跟踪是否正在加载，避免重复启动
  const progressiveStagesRef = useRef(null); // 保存 stages 配置，避免依赖项变化导致重复执行

  // 获取优化后的URL
  const getOptimizedUrl = (imageSrc) => {
    if (!imageSrc) return '';
    try {
      if (optimize && Object.keys(optimize).length > 0) {
        const optimized = optimizeImageUrl(imageSrc, optimize);
        if (optimized && optimized.trim()) {
          return optimized;
        }
      }
      return imageSrc;
    } catch (error) {
      console.warn('图片URL优化失败，使用原始URL:', error);
      return imageSrc;
    }
  };

  // 优化后的图片URL
  const optimizedSrc = useMemo(() => {
    if (!src) return '';
    
    // 如果启用了渐进式加载，使用渐进式加载的URL
    if (progressive && progressiveImageUrl) {
      return progressiveImageUrl;
    }
    
    // 如果已经有浏览器端压缩的图片，优先使用
    if (compressedSrc) {
      return compressedSrc;
    }
    
    // 如果有缓存的 Blob URL，优先使用
    if (cachedBlobUrl) {
      return cachedBlobUrl;
    }
    
    if (isLoaded && lockedSrc) {
      return lockedSrc;
    }
    
    return getOptimizedUrl(src);
  }, [src, isLoaded, lockedSrc, optimize, compressedSrc, cachedBlobUrl, progressive, progressiveImageUrl]);

  // 初始化 Intersection Observer
  const initObserver = () => {
    if (immediate || typeof window === 'undefined' || !window.IntersectionObserver) {
      setShouldLoad(true);
      return;
    }

    // 如果已经有 observer，先清理
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            // 只 unobserve 当前元素，不要 disconnect 整个 observer
            if (observerRef.current && entry.target) {
              observerRef.current.unobserve(entry.target);
            }
          }
        });
      },
      {
        rootMargin,
        threshold: 0.01,
      }
    );

    // 等待 DOM 更新后再观察
    setTimeout(() => {
      if (containerRef.current && observerRef.current) {
        observerRef.current.observe(containerRef.current);
      }
    }, 0);
  };

  // 处理图片加载成功
  const handleLoad = async (event) => {
    // 如果是渐进式加载，需要特殊处理
    if (progressive) {
      // 渐进式加载时，只有在最后一个阶段完成时才设置 isLoaded
      // 使用 ref 来获取最新的阶段索引，避免状态更新延迟导致的问题
      const currentStageIndex = progressiveStageIndexRef.current;
      if (currentStageIndex >= 0 && currentStageIndex < progressiveStages.length) {
        // 渐进式加载的中间阶段，不设置 isLoaded，让 onStageComplete 和 onComplete 来控制
        return;
      }
      // 如果 currentStageIndex >= progressiveStages.length，说明所有阶段已完成，可以设置 isLoaded
    }
    
    if (isLoaded) {
      return;
    }
    
    const currentSrc = event.target.src;
    setIsLoaded(true);
    setIsLoading(false);
    setHasError(false);
    setLockedSrc(currentSrc);
    
    // 如果不是从缓存加载的（不是 Blob URL），则保存到缓存
    if (!currentSrc.startsWith('blob:') && !currentSrc.startsWith('data:')) {
      try {
        const finalUrl = getOptimizedUrl(src);
        const response = await fetch(finalUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const imageData = new Uint8Array(arrayBuffer);
          const mimeType = response.headers.get('Content-Type') || 'image/jpeg';
          
          // 将图片数据转换为 base64 字符串存储
          const binaryString = String.fromCharCode.apply(null, Array.from(imageData));
          const base64String = btoa(binaryString);
          const dataUrl = `data:${mimeType};base64,${base64String}`;
          
          // 使用通用 API 保存缓存
          const cacheKey = `image:${finalUrl}`;
          await setCache(cacheKey, { data: dataUrl, mimeType });
        }
      } catch (error) {
        // 保存缓存失败，不影响图片显示
        console.warn('保存图片缓存失败:', error);
      }
    }
    
    // 获取优化信息并传递给回调
    let optimizationInfo = null;
    if (src && currentSrc !== src) {
      try {
        const comparison = await compareImageSizes(src, currentSrc);
        if (comparison.originalSize !== null && comparison.optimizedSize !== null) {
          // 构建优化信息对象
          optimizationInfo = {
            // 原始信息
            originalUrl: comparison.originalUrl,
            originalSize: comparison.originalSize,
            originalSizeFormatted: comparison.originalSizeFormatted,
            
            // 优化后信息
            optimizedUrl: comparison.optimizedUrl,
            optimizedSize: comparison.optimizedSize,
            optimizedSizeFormatted: comparison.optimizedSizeFormatted,
            
            // 节省信息
            savedSize: comparison.savedSize,
            savedSizeFormatted: comparison.savedSizeFormatted,
            savedPercentage: comparison.savedPercentage,
            
            // 其他信息
            cdn: comparison.cdn,
            isOptimizationEffective: comparison.isOptimizationEffective,
            warningMessage: comparison.warningMessage,
          };
          
          // 存储优化信息到 ref，供 onClick 使用
          optimizationInfoRef.current = optimizationInfo;
          
          // 调用优化完成回调
          if (onOptimization) {
            onOptimization(optimizationInfo);
          }
          
          // 控制台日志（已注释）
          // const groupTitle = comparison.isOptimizationEffective 
          //   ? `✅ 图片优化效果 - ${alt || '图片'}` 
          //   : `❌ 图片优化无效 - ${alt || '图片'}`;
          
          // console.group(groupTitle);
          // console.log('原始URL:', comparison.originalUrl);
          // console.log('优化URL:', comparison.optimizedUrl);
          if (comparison.cdn) {
            // console.log(`检测到的CDN: ${comparison.cdn}`);
          } else {
            // console.log('⚠️ 未检测到支持的CDN');
          }
          // console.log(`原始大小: ${comparison.originalSizeFormatted} (${comparison.originalSize} 字节)`);
          // console.log(`优化后大小: ${comparison.optimizedSizeFormatted} (${comparison.optimizedSize} 字节)`);
          // console.log(`节省大小: ${comparison.savedSizeFormatted} (${comparison.savedSize} 字节)`);
          // console.log(`节省比例: ${comparison.savedPercentage}%`);
          
          if (comparison.warningMessage) {
            console.warn(comparison.warningMessage);
          }
          
          if (!comparison.isOptimizationEffective) {
            // console.warn('💡 建议：');
            // if (!comparison.cdn) {
            //   console.warn('   1. 使用支持的CDN（阿里云OSS、腾讯云COS、七牛云、又拍云、AWS CloudFront）');
            //   console.warn('   2. 或者使用支持通用查询参数的图片服务');
            //   console.warn('   3. 或者设置 immediate={false} 并关闭 optimize 参数，使用原始URL');
            // } else {
            //   console.warn('   1. 检查CDN配置是否正确');
            //   console.warn('   2. 确认CDN服务是否支持图片处理功能');
            // }
          }
          
          // console.groupEnd();
        } else {
          // 即使无法获取大小，也提供基本信息
          optimizationInfo = {
            originalUrl: src,
            optimizedUrl: currentSrc,
            originalSize: null,
            originalSizeFormatted: null,
            optimizedSize: null,
            optimizedSizeFormatted: null,
            savedSize: null,
            savedSizeFormatted: null,
            savedPercentage: null,
            cdn: detectCDN(src),
            isOptimizationEffective: null,
            warningMessage: '⚠️ 无法获取图片大小（可能由于CORS限制）',
          };
          
          // 存储优化信息到 ref，供 onClick 使用
          optimizationInfoRef.current = optimizationInfo;
          
          if (onOptimization) {
            onOptimization(optimizationInfo);
          }
          
          // console.log('⚠️ 无法获取图片大小（可能由于CORS限制）');
          // console.log('原始URL:', src);
          // console.log('优化URL:', currentSrc);
        }
      } catch (error) {
        console.warn('获取图片大小对比失败:', error);
        
        // 即使出错也提供基本信息
        optimizationInfo = {
          originalUrl: src,
          optimizedUrl: currentSrc,
          originalSize: null,
          originalSizeFormatted: null,
          optimizedSize: null,
          optimizedSizeFormatted: null,
          savedSize: null,
          savedSizeFormatted: null,
          savedPercentage: null,
          cdn: detectCDN(src),
          isOptimizationEffective: null,
          warningMessage: `获取图片大小对比失败: ${error.message}`,
        };
        
        // 存储优化信息到 ref，供 onClick 使用
        optimizationInfoRef.current = optimizationInfo;
        
        if (onOptimization) {
          onOptimization(optimizationInfo);
        }
      }
    }
    
    // 调用 onLoad 回调，传递优化信息作为第二个参数
    if (onLoad) {
      onLoad(event, optimizationInfo);
    }
  };

  // 处理图片加载失败
  const handleError = (event) => {
    if (isLoaded) {
      return;
    }
    
    const currentSrc = event.target.src;
    const optimizedUrl = getOptimizedUrl(src);
    
    // 如果指定了 errorSrc 且当前加载的是错误图片本身，不再重试
    if (errorSrc && (currentSrc === errorSrc || currentSrc.includes('videoCover.png'))) {
      setHasError(true);
      setIsLoading(false);
      if (onError) {
        onError(event);
      }
      return;
    }
    
    // 如果当前加载的是优化后的URL，且与原始URL不同，先尝试加载原始URL
    if (currentSrc === optimizedUrl && optimizedUrl !== src) {
      // console.log('优化URL加载失败，尝试原始URL:', src);
      event.target.src = src;
      return;
    }
    
    // 如果当前加载的是原始URL，加载失败
    if (currentSrc === src || optimizedUrl === src) {
      // 如果指定了 errorSrc，尝试加载错误图片
      if (errorSrc && currentSrc !== errorSrc) {
        // console.log('原始URL加载失败，尝试加载错误图片:', errorSrc);
        event.target.src = errorSrc;
        return;
      }
      
      // 如果没有指定 errorSrc 或错误图片也加载失败，直接显示错误占位符
      // console.log('图片加载失败，显示错误占位符');
      setHasError(true);
      setIsLoading(false);
      
      if (onError) {
        onError(event);
      }
    }
  };

  // 处理图片点击
  const handleClick = (event) => {
    if (onClick) {
      // 构建图片信息对象
      const imageInfo = {
        // 基本图片信息
        src: src,                              // 原始图片URL
        currentSrc: event.target?.src || optimizedSrc, // 当前加载的图片URL
        optimizedSrc: optimizedSrc,           // 优化后的URL
        alt: alt,                              // 图片alt文本
        dataId: dataId,                        // data-id属性
        
        // 图片状态
        isLoaded: isLoaded,                    // 是否已加载
        isLoading: isLoading,                   // 是否正在加载
        hasError: hasError,                    // 是否有错误
        isCompressing: isCompressing,          // 是否正在压缩
        
        // 优化信息（如果已获取）
        optimizationInfo: optimizationInfoRef.current,
        
        // 图片元素引用
        imageElement: event.target,            // 图片DOM元素
      };
      
      onClick(event, imageInfo);
    }
  };

  // 保存 stages 配置到 ref，避免依赖项变化导致重复执行
  useEffect(() => {
    progressiveStagesRef.current = progressiveStages;
  }, [progressiveStages]);

  // 渐进式加载的独立处理逻辑
  // 使用 useRef 来跟踪是否已启动，避免重复执行
  const progressiveInitRef = useRef(false);
  const progressiveSrcRef = useRef(null); // 跟踪当前加载的 src
  
  useEffect(() => {
    // 如果不是渐进式加载，重置标记
    if (!progressive) {
      progressiveInitRef.current = false;
      progressiveSrcRef.current = null;
      return;
    }

    // 如果 src 改变了，重置标记，允许重新加载
    if (progressiveSrcRef.current !== src) {
      progressiveInitRef.current = false;
      progressiveSrcRef.current = src;
    }

    // 如果已经初始化过且 src 没变，不再重复执行
    if (progressiveInitRef.current) {
      return;
    }

    // 如果没有 src，直接返回
    if (!src) {
      return;
    }

    // 只有在 shouldLoad 为 true 时才启动加载
    if (!shouldLoad) {
      return;
    }

    // 标记已经初始化，防止重复执行
    progressiveInitRef.current = true;
    progressiveLoadingRef.current = true;
    setIsLoading(true);
    
    // 每个组件实例独立管理自己的渐进式加载状态
    let isCancelled = false;
    const currentSrcRef = src; // 保存当前的 src，避免闭包问题
    const currentStages = progressiveStagesRef.current || progressiveStages; // 使用 ref 中的 stages
    
    progressiveCancelRef.current = () => {
      isCancelled = true;
      progressiveLoadingRef.current = false;
      progressiveInitRef.current = false;
    };
    
    // 使用封装的渐进式加载缓存函数
    loadImageProgressiveWithCache(currentSrcRef, {
      stages: currentStages,
      timeout: progressiveTimeout,
      enableCache: progressiveEnableCache, // 传递缓存开关
      onStageComplete: (stageIndex, stageUrl, stage) => {
        // 只检查是否已取消或 src 已改变
        if (isCancelled || progressiveSrcRef.current !== currentSrcRef) return;
        
        // stageIndex 是从 0 开始的，表示当前完成的阶段索引
        // 设置当前完成的阶段索引（stageIndex + 1），这样图片才能正确显示
        const newStageIndex = stageIndex + 1;
        
        // 使用 requestAnimationFrame 确保状态更新不会阻塞后续阶段的加载
        requestAnimationFrame(() => {
          if (!isCancelled && progressiveSrcRef.current === currentSrcRef) {
            setProgressiveStageIndex(newStageIndex);
            progressiveStageIndexRef.current = newStageIndex;
            setProgressiveImageUrl(stageUrl);
            
            if (onProgressiveStageComplete) {
              onProgressiveStageComplete(stageIndex, stageUrl, stage);
            }
          }
        });
      },
      onComplete: (finalUrl) => {
        // 只检查是否已取消或 src 已改变
        if (isCancelled || progressiveSrcRef.current !== currentSrcRef) return;
        
        // 使用 requestAnimationFrame 确保状态更新不会阻塞
        requestAnimationFrame(() => {
          if (!isCancelled && progressiveSrcRef.current === currentSrcRef) {
            setIsLoading(false);
            setProgressiveImageUrl(finalUrl);
            progressiveLoadingRef.current = false;
            // 渐进式加载完成后，设置最后一个阶段索引
            const finalStageIndex = currentStages.length;
            setProgressiveStageIndex(finalStageIndex);
            progressiveStageIndexRef.current = finalStageIndex;
            // 渐进式加载完成后，图片的 src 会更新为 finalUrl
            // 这会触发 img 元素的 onLoad 事件，从而调用 handleLoad
            // 此时 progressiveStageIndexRef.current >= currentStages.length，handleLoad 会正常设置 isLoaded
          }
        });
      },
      onError: (error, stageIndex) => {
        // 只检查是否已取消或 src 已改变
        if (isCancelled || progressiveSrcRef.current !== currentSrcRef) return;
        
        console.warn(`[渐进式加载 ${currentSrcRef.substring(0, 20)}...] 阶段 ${stageIndex + 1} 失败:`, error.message || error);
        setIsLoading(false);
        progressiveLoadingRef.current = false;
        progressiveInitRef.current = false;
        // 渐进式加载失败，回退到普通加载
        setProgressiveImageUrl('');
        setProgressiveStageIndex(-1);
        progressiveStageIndexRef.current = -1;
        setIsLoading(true);
      },
    }).catch((error) => {
      // 处理未捕获的错误
      if (!isCancelled && progressiveSrcRef.current === currentSrcRef) {
        console.error(`[渐进式加载 ${currentSrcRef.substring(0, 20)}...] 加载过程出错:`, error);
        setIsLoading(false);
        progressiveLoadingRef.current = false;
        progressiveInitRef.current = false;
        setProgressiveImageUrl('');
        setProgressiveStageIndex(-1);
        progressiveStageIndexRef.current = -1;
      }
    });
    
    return () => {
      // 只有在组件卸载或 src 改变时才取消
      isCancelled = true;
      progressiveLoadingRef.current = false;
      progressiveInitRef.current = false;
    };
  }, [progressive, shouldLoad, src, progressiveTimeout, progressiveEnableCache]);
  
  // 监听 shouldLoad 变化，先检查缓存，如果CDN不支持优化，尝试浏览器端压缩（普通加载流程）
  useEffect(() => {
    // 如果是渐进式加载，跳过普通加载流程
    if (progressive) {
      return;
    }
    
    // 普通加载流程（非渐进式）
    if (!progressive && shouldLoad && !isLoaded && !hasError && !isLoading && !isCompressing && !cachedBlobUrl && !progressiveImageUrl && src) {
      // 普通加载流程
      // 先尝试从缓存加载
      const loadFromCache = async () => {
        try {
          const finalUrl = getOptimizedUrl(src);
          const blobUrl = await loadImageWithCache(finalUrl);
          if (blobUrl) {
            setCachedBlobUrl(blobUrl);
            cachedBlobUrlRef.current = blobUrl;
            // 从缓存加载时，不设置 isLoading，让图片自然加载
            // 图片加载完成后会触发 onLoad 事件，自动设置 isLoaded 和 isLoading(false)
            return true;
          }
        } catch (error) {
          // 缓存加载失败，继续正常流程
        }
        return false;
      };
      
      loadFromCache().then((fromCache) => {
        if (!fromCache) {
          // 检查是否支持CDN优化，如果不支持且允许浏览器端压缩，则进行压缩
          const cdn = detectCDN(src);
          const shouldUseBrowserCompression = 
            enableBrowserCompression && // 允许浏览器端压缩
            !cdn && // 不支持CDN
            optimize && Object.keys(optimize).length > 0 && // 有优化配置
            typeof window !== 'undefined' && // 浏览器环境
            !compressedSrc; // 还没压缩过
          
          if (shouldUseBrowserCompression) {
            setIsCompressing(true);
            compressImageInBrowser(src, {
              maxWidth: optimize.width || null,
              maxHeight: optimize.height || null,
              quality: optimize.quality ? optimize.quality / 100 : 0.8,
              compressionLevel: optimize.compressionLevel !== undefined ? optimize.compressionLevel : 0,
              blur: optimize.blur !== undefined ? optimize.blur : 0,
              smooth: optimize.smooth !== undefined ? optimize.smooth : true,
              format: optimize.format || null,
            })
              .then((compressionResult) => {
                const previewUrl = compressionResult?.dataURL || compressionResult?.url || null;
                if (!previewUrl) {
                  throw new Error('浏览器端压缩结果缺少可用预览地址');
                }

                setCompressedSrc(previewUrl);
                setIsCompressing(false);
                
                // 计算压缩效果
                const blob = compressionResult?.blob || dataURLToBlob(previewUrl);
                // console.log('✅ 已启用浏览器端压缩');
                // console.log(`压缩后大小: ${formatFileSize(blob.size)}`);
              })
              .catch((error) => {
                console.warn('浏览器端压缩失败，使用原始URL:', error);
                setIsCompressing(false);
              });
          } else {
            // 如果不需要浏览器端压缩，正常设置加载状态
            setIsLoading(true);
          }
        }
      });
    }
  }, [shouldLoad, isLoaded, hasError, isLoading, isCompressing, src, optimize, compressedSrc, cachedBlobUrl, enableBrowserCompression]);

  // 监听 src 变化
  useEffect(() => {
    // 清理之前的 Blob URL
    if (cachedBlobUrlRef.current) {
      URL.revokeObjectURL(cachedBlobUrlRef.current);
      cachedBlobUrlRef.current = null;
    }
    
    // 取消渐进式加载
    if (progressiveCancelRef.current) {
      progressiveCancelRef.current();
      progressiveCancelRef.current = null;
    }
    
    setIsLoaded(false);
    setHasError(false);
    setIsLoading(false);
    setLockedSrc('');
    setCompressedSrc(null); // 重置压缩图片
    setIsCompressing(false);
    setCachedBlobUrl(null); // 重置缓存 Blob URL
    // 取消渐进式加载
    if (progressiveCancelRef.current) {
      progressiveCancelRef.current();
      progressiveCancelRef.current = null;
    }
    // 取消渐进式加载
    if (progressiveCancelRef.current) {
      progressiveCancelRef.current();
      progressiveCancelRef.current = null;
    }
    setProgressiveImageUrl(''); // 重置渐进式加载URL
    setProgressiveStageIndex(-1); // 重置渐进式加载阶段
    progressiveStageIndexRef.current = -1; // 重置 ref
    progressiveLoadingRef.current = false; // 重置加载标记
    progressiveInitRef.current = false; // 重置初始化标记
    progressiveSrcRef.current = null; // 重置 src 跟踪
    optimizationInfoRef.current = null; // 重置优化信息
    
    if (immediate) {
      setShouldLoad(true);
    } else {
      initObserver();
    }
  }, [src]);

  // 组件挂载
  useEffect(() => {
    if (!immediate) {
      initObserver();
    } else {
      setShouldLoad(true);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      // 清理 Blob URL
      if (cachedBlobUrlRef.current) {
        URL.revokeObjectURL(cachedBlobUrlRef.current);
        cachedBlobUrlRef.current = null;
      }
      // 取消渐进式加载
      if (progressiveCancelRef.current) {
        progressiveCancelRef.current();
        progressiveCancelRef.current = null;
      }
    };
  }, []);

  const containerStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      ref={containerRef}
      className={`image-optimize-container ${className}`.trim()}
      style={containerStyle}
    >
      {/* 占位符 */}
      {!isLoaded && !hasError && !isLoading && !cachedBlobUrl && !progressiveImageUrl && (
        <div className="image-optimize-placeholder">
          {showPlaceholderIcon && (
            <svg
              className="image-optimize-placeholder-icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM13.96 12.29L11.21 15.83L9.25 13.47L6.5 17H17.5L13.96 12.29Z"
                fill="currentColor"
              />
            </svg>
          )}
        </div>
      )}

      {/* 加载中 */}
      {(isLoading || isCompressing) && !hasError && !cachedBlobUrl && !progressiveImageUrl && (
        <div className="image-optimize-loading">
          <svg
            className="image-optimize-loading-icon"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeDasharray="62.83"
              strokeDashoffset="31.42"
            />
          </svg>
          {isCompressing && (
            <span style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              正在压缩图片...
            </span>
          )}
        </div>
      )}

      {/* 实际图片 */}
      {shouldLoad && optimizedSrc && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          alt={alt}
          data-id={dataId}
          className={`image-optimize-image ${imageClassName}`.trim()}
          style={{
            display: isLoaded || cachedBlobUrl || progressiveImageUrl || (!hasError && optimizedSrc) ? 'block' : 'none',
            // 渐进式加载的过渡效果
            transition: progressive 
              ? `opacity ${progressiveTransitionDuration}ms ease-in-out, filter ${progressiveTransitionDuration}ms ease-in-out`
              : undefined,
            opacity: progressive && progressiveStageIndex >= 0 
              ? 1 
              : (isLoaded || cachedBlobUrl ? 1 : 0),
            // 渐进式加载的模糊效果
            // progressiveStageIndex: -1(初始) -> 1(第1阶段完成) -> 2(第2阶段完成) -> 3(第3阶段完成/全部完成)
            filter: progressive 
              ? (progressiveStageIndex === 1 
                  ? 'blur(10px)' 
                  : progressiveStageIndex === 2 
                    ? 'blur(3px)' 
                    : progressiveStageIndex >= 3
                      ? 'blur(0px)'
                      : 'blur(10px)') // 初始状态也显示模糊
              : undefined,
            ...imageStyle,
          }}
          onLoad={handleLoad}
          onError={handleError}
          onClick={handleClick}
        />
      )}

      {/* 错误占位符 */}
      {hasError && (
        <div className="image-optimize-error">
          <svg
            className="image-optimize-error-icon"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z"
              fill="currentColor"
            />
          </svg>
          {showErrorMessage && (
            <span className="image-optimize-error-text">加载失败</span>
          )}
        </div>
      )}
    </div>
  );
}
