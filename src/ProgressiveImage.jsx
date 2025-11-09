import React, { useState, useEffect, useRef } from 'react';
import { loadImageProgressive, generateBlurPlaceholderUrl } from '../imageOptimize.js';
import './LazyImage.css';

/**
 * ProgressiveImage 组件 - 模糊到清晰的渐进式加载图片组件
 * @param {Object} props - 组件属性
 * @param {string} props.src - 原始图片URL
 * @param {string} props.alt - 图片alt文本
 * @param {string|number} props.width - 容器宽度
 * @param {string|number} props.height - 容器高度
 * @param {string} props.className - 容器类名
 * @param {string} props.imageClassName - 图片类名
 * @param {Object} props.imageStyle - 图片样式
 * @param {Array} props.stages - 加载阶段配置，例如：
 *   [
 *     { width: 20, quality: 20, blur: 10 },   // 阶段1: 极速模糊图
 *     { width: 400, quality: 50, blur: 3 },   // 阶段2: 中等质量
 *     { width: 1200, quality: 80, blur: 0 }     // 阶段3: 最终质量
 *   ]
 * @param {number} props.transitionDuration - 过渡动画时间（毫秒，默认300）
 * @param {number} props.timeout - 每个阶段的加载超时时间（毫秒，默认30000）
 * @param {boolean} props.showPlaceholder - 是否显示占位符（默认true）
 * @param {Function} props.onStageComplete - 阶段完成回调 (stageIndex, stageUrl, stage) => void
 * @param {Function} props.onComplete - 全部完成回调 (finalUrl) => void
 * @param {Function} props.onError - 错误回调 (error, stageIndex) => void
 * @param {Function} props.onLoad - 加载完成回调 (event) => void
 */
export default function ProgressiveImage({
  src = '',
  alt = '',
  width = '100%',
  height = 'auto',
  className = '',
  imageClassName = '',
  imageStyle = {},
  stages = [
    { width: 20, quality: 20 },   // 阶段1: 极速模糊图
    { width: 400, quality: 50 },   // 阶段2: 中等质量
    { width: null, quality: 80 }  // 阶段3: 最终质量（原图）
  ],
  transitionDuration = 300,
  timeout = 30000,
  showPlaceholder = true,
  onStageComplete = null,
  onComplete = null,
  onError = null,
  onLoad = null,
}) {
  const [currentStageIndex, setCurrentStageIndex] = useState(-1);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // 初始化：生成模糊占位符
  useEffect(() => {
    if (!src) return;

    // 生成初始模糊占位符
    const placeholderUrl = generateBlurPlaceholderUrl(src, {
      width: stages[0]?.width || 20,
      quality: stages[0]?.quality || 20,
    });

    setCurrentImageUrl(placeholderUrl);
    setCurrentStageIndex(0);
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
    setIsComplete(false);

    // 开始渐进式加载
    let isCancelled = false;

    loadImageProgressive(src, {
      stages,
      timeout,
      onStageComplete: (stageIndex, stageUrl, stage) => {
        if (isCancelled) return;
        setCurrentStageIndex(stageIndex + 1);
        setCurrentImageUrl(stageUrl);
        
        if (onStageComplete) {
          onStageComplete(stageIndex, stageUrl, stage);
        }
      },
      onComplete: (finalUrl) => {
        if (isCancelled) return;
        setIsLoading(false);
        setIsComplete(true);
        setCurrentImageUrl(finalUrl);
        
        if (onComplete) {
          onComplete(finalUrl);
        }
      },
      onError: (error, stageIndex) => {
        if (isCancelled) return;
        setIsLoading(false);
        setHasError(true);
        setErrorMessage(error.message);
        
        if (onError) {
          onError(error, stageIndex);
        }
      },
    });

    return () => {
      isCancelled = true;
    };
  }, [src]);

  const containerStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    position: 'relative',
    overflow: 'hidden',
  };

  const imageStyleObj = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: `opacity ${transitionDuration}ms ease-in-out, filter ${transitionDuration}ms ease-in-out`,
    opacity: currentStageIndex >= 0 ? 1 : 0,
    // 真正的渐进式加载资源 + CSS模糊效果增强视觉体验
    filter: currentStageIndex === 0 ? 'blur(10px)' : 
            currentStageIndex === 1 ? 'blur(3px)' : 
            'blur(0px)',
    ...imageStyle,
  };

  return (
    <div
      ref={containerRef}
      className={`progressive-image-container ${className}`.trim()}
      style={containerStyle}
    >
      {/* 占位符 */}
      {showPlaceholder && currentStageIndex < 0 && !hasError && (
        <div className="image-optimize-placeholder" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}>
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
        </div>
      )}

      {/* 图片 */}
      {currentImageUrl && (
        <img
          ref={imageRef}
          src={currentImageUrl}
          alt={alt}
          className={`progressive-image ${imageClassName}`.trim()}
          style={imageStyleObj}
          onLoad={(e) => {
            if (isComplete && onLoad) {
              onLoad(e);
            }
          }}
          onError={(e) => {
            if (!hasError) {
              setHasError(true);
              setErrorMessage('图片加载失败');
              if (onError) {
                onError(new Error('图片加载失败'), currentStageIndex);
              }
            }
          }}
        />
      )}

      {/* 错误提示 */}
      {hasError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          color: '#999',
          fontSize: '14px',
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>❌</div>
          <div>{errorMessage || '加载失败'}</div>
        </div>
      )}

      {/* 加载指示器（可选） */}
      {isLoading && !hasError && currentStageIndex < stages.length && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          阶段 {currentStageIndex + 1} / {stages.length}
        </div>
      )}
    </div>
  );
}

