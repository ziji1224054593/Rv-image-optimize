<template>
    <div
      ref="containerRef"
      :class="['image-optimize-container', className]"
      :style="containerStyle"
      :data-id="dataId"
    >
      <!-- 占位符 -->
      <div v-if="showPlaceholder" class="image-optimize-placeholder">
        <svg
          v-if="showPlaceholderIcon"
          class="image-optimize-placeholder-icon"
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
  
      <!-- 加载中 -->
      <div v-if="showLoading" class="image-optimize-loading">
        <svg
          class="image-optimize-loading-icon"
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
            stroke-width="2"
            fill="none"
            stroke-dasharray="62.83"
            stroke-dashoffset="31.42"
          />
        </svg>
        <span v-if="isCompressing" class="compressing-text">
          正在压缩图片...
        </span>
      </div>
  
      <!-- 实际图片 -->
      <img
        v-if="shouldLoad && optimizedSrc"
        ref="imgRef"
        :src="optimizedSrc"
        :alt="alt"
        :class="['image-optimize-image', imageClassName]"
        :style="computedImageStyle"
        @load="handleLoad"
        @error="handleError"
        @click="handleClick"
      />
  
      <!-- 错误占位符 -->
      <div v-if="hasError" class="image-optimize-error">
        <svg
          class="image-optimize-error-icon"
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
        <span v-if="showErrorMessage" class="image-optimize-error-text">
          加载失败
        </span>
      </div>
    </div>
  </template>
  
  <script>
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
  
  export default {
    name: 'LazyImage',
    
    props: {
      src: {
        type: String,
        default: ''
      },
      alt: {
        type: String,
        default: ''
      },
      width: {
        type: [String, Number],
        default: '100%'
      },
      height: {
        type: [String, Number],
        default: 'auto'
      },
      className: {
        type: String,
        default: ''
      },
      imageClassName: {
        type: String,
        default: ''
      },
      dataId: {
        type: [String, Number],
        default: null
      },
      imageStyle: {
        type: Object,
        default: () => ({})
      },
      immediate: {
        type: Boolean,
        default: false
      },
      rootMargin: {
        type: String,
        default: '50px'
      },
      optimize: {
        type: Object,
        default: () => ({
          width: 240,
          height: 320,
          quality: 30
        })
      },
      enableBrowserCompression: {
        type: Boolean,
        default: true
      },
      showPlaceholderIcon: {
        type: Boolean,
        default: false
      },
      showErrorMessage: {
        type: Boolean,
        default: false
      },
      errorSrc: {
        type: String,
        default: null
      },
      progressive: {
        type: Boolean,
        default: false
      },
      progressiveStages: {
        type: Array,
        default: () => [
          { width: 20, quality: 20, blur: 10 },
          { width: 400, quality: 50, blur: 3 },
          { width: null, quality: 80, blur: 0 }
        ]
      },
      progressiveTransitionDuration: {
        type: Number,
        default: 300
      },
      progressiveTimeout: {
        type: Number,
        default: 30000
      },
      progressiveEnableCache: {
        type: Boolean,
        default: true
      }
    },
  
    emits: ['load', 'optimization', 'error', 'click', 'progressive-stage-complete'],
  
    data() {
      return {
        isLoaded: false,
        isLoading: false,
        hasError: false,
        shouldLoad: this.immediate,
        lockedSrc: '',
        compressedSrc: null,
        isCompressing: false,
        cachedBlobUrl: null,
        progressiveStageIndex: -1,
        progressiveImageUrl: '',
        observer: null,
        optimizationInfo: null
      };
    },
  
    computed: {
      containerStyle() {
        return {
          width: typeof this.width === 'number' ? `${this.width}px` : this.width,
          height: typeof this.height === 'number' ? `${this.height}px` : this.height
        };
      },
  
      showPlaceholder() {
        return !this.isLoaded && !this.hasError && !this.isLoading && 
               !this.cachedBlobUrl && !this.progressiveImageUrl;
      },
  
      showLoading() {
        return (this.isLoading || this.isCompressing) && !this.hasError && 
               !this.cachedBlobUrl && !this.progressiveImageUrl;
      },
  
      optimizedSrc() {
        if (!this.src) return '';
  
        // 渐进式加载优先
        if (this.progressive && this.progressiveImageUrl) {
          return this.progressiveImageUrl;
        }
  
        // 浏览器端压缩图片
        if (this.compressedSrc) {
          return this.compressedSrc;
        }
  
        // 缓存图片
        if (this.cachedBlobUrl) {
          return this.cachedBlobUrl;
        }
  
        if (this.isLoaded && this.lockedSrc) {
          return this.lockedSrc;
        }
  
        return this.getOptimizedUrl(this.src);
      },
  
      computedImageStyle() {
        const baseStyle = {
          display: this.isLoaded || this.cachedBlobUrl || this.progressiveImageUrl || 
                  (!this.hasError && this.optimizedSrc) ? 'block' : 'none',
          ...this.imageStyle
        };
  
        if (this.progressive) {
          baseStyle.transition = `opacity ${this.progressiveTransitionDuration}ms ease-in-out, filter ${this.progressiveTransitionDuration}ms ease-in-out`;
          baseStyle.opacity = this.progressiveStageIndex >= 0 ? 1 : 
                            (this.isLoaded || this.cachedBlobUrl ? 1 : 0);
          
          // 渐进式模糊效果
          baseStyle.filter = this.progressiveStageIndex === 1 ? 'blur(10px)' :
                            this.progressiveStageIndex === 2 ? 'blur(3px)' :
                            this.progressiveStageIndex >= 3 ? 'blur(0px)' : 'blur(10px)';
        }
  
        return baseStyle;
      }
    },
  
    watch: {
      src: {
        handler(newSrc, oldSrc) {
          if (newSrc !== oldSrc) {
            this.resetState();
            if (this.immediate) {
              this.shouldLoad = true;
            } else {
              this.initObserver();
            }
          }
        },
        immediate: true
      },
  
      shouldLoad: {
        handler(newVal) {
          if (newVal && this.progressive) {
            this.handleProgressiveLoad();
          } else if (newVal && !this.progressive) {
            this.handleShouldLoad();
          }
        },
        immediate: true
      }
    },
    methods: {
    // 获取优化后的URL
    getOptimizedUrl(imageSrc) {
      if (!imageSrc) return '';
      try {
        if (this.optimize && Object.keys(this.optimize).length > 0) {
          const optimized = optimizeImageUrl(imageSrc, this.optimize);
          if (optimized && optimized.trim()) {
            return optimized;
          }
        }
        return imageSrc;
      } catch (error) {
        console.warn('图片URL优化失败，使用原始URL:', error);
        return imageSrc;
      }
    },

    // 初始化 Intersection Observer
    initObserver() {
      if (this.immediate || typeof window === 'undefined' || !window.IntersectionObserver) {
        this.shouldLoad = true;
        return;
      }

      // 清理现有的 observer
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }

      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.shouldLoad = true;
              if (this.observer && entry.target) {
                this.observer.unobserve(entry.target);
              }
            }
          });
        },
        {
          rootMargin: this.rootMargin,
          threshold: 0.01
        }
      );

      // 等待 DOM 更新后再观察
      this.$nextTick(() => {
        if (this.$refs.containerRef && this.observer) {
          this.observer.observe(this.$refs.containerRef);
        }
      });
    },

    // 处理图片加载成功
    async handleLoad(event) {
      const currentSrc = event.target.src;
      
      // 渐进式加载时，只有在最后一个阶段才标记为已加载
      if (this.progressive) {
        // 如果是渐进式加载的最后一个阶段，才标记为已加载
        if (this.progressiveStageIndex >= this.progressiveStages.length) {
          if (this.isLoaded) return;
          this.isLoaded = true;
          this.isLoading = false;
          this.hasError = false;
          this.lockedSrc = currentSrc;
        } else {
          // 中间阶段：更新状态但不标记为完全加载，允许继续加载下一阶段
          this.isLoading = false;
          this.hasError = false;
          // 不设置 isLoaded，允许继续加载下一阶段
          return;
        }
      } else {
        if (this.isLoaded) return;
        this.isLoaded = true;
        this.isLoading = false;
        this.hasError = false;
        this.lockedSrc = currentSrc;
      }

      // 保存到缓存
      if (!currentSrc.startsWith('blob:') && !currentSrc.startsWith('data:')) {
        try {
          const finalUrl = this.getOptimizedUrl(this.src);
          const response = await fetch(finalUrl);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const imageData = new Uint8Array(arrayBuffer);
            const mimeType = response.headers.get('Content-Type') || 'image/jpeg';
            
            const binaryString = String.fromCharCode.apply(null, Array.from(imageData));
            const base64String = btoa(binaryString);
            const dataUrl = `data:${mimeType};base64,${base64String}`;
            
            const cacheKey = `image:${finalUrl}`;
            await setCache(cacheKey, { data: dataUrl, mimeType });
          }
        } catch (error) {
          console.warn('保存图片缓存失败:', error);
        }
      }

      // 获取优化信息
      let optimizationInfo = null;
      if (this.src && currentSrc !== this.src) {
        try {
          const comparison = await compareImageSizes(this.src, currentSrc);
          if (comparison.originalSize !== null && comparison.optimizedSize !== null) {
            optimizationInfo = {
              originalUrl: comparison.originalUrl,
              originalSize: comparison.originalSize,
              originalSizeFormatted: comparison.originalSizeFormatted,
              optimizedUrl: comparison.optimizedUrl,
              optimizedSize: comparison.optimizedSize,
              optimizedSizeFormatted: comparison.optimizedSizeFormatted,
              savedSize: comparison.savedSize,
              savedSizeFormatted: comparison.savedSizeFormatted,
              savedPercentage: comparison.savedPercentage,
              cdn: comparison.cdn,
              isOptimizationEffective: comparison.isOptimizationEffective,
              warningMessage: comparison.warningMessage,
            };
            
            this.optimizationInfo = optimizationInfo;
            this.$emit('optimization', optimizationInfo);
          }
        } catch (error) {
          console.warn('获取图片大小对比失败:', error);
        }
      }

      this.$emit('load', event, optimizationInfo);
    },

    // 处理图片加载失败
    handleError(event) {
      if (this.isLoaded) return;

      const currentSrc = event.target.src;
      const optimizedUrl = this.getOptimizedUrl(this.src);

      if (this.errorSrc && (currentSrc === this.errorSrc || currentSrc.includes('videoCover.png'))) {
        this.hasError = true;
        this.isLoading = false;
        this.$emit('error', event);
        return;
      }

      if (currentSrc === optimizedUrl && optimizedUrl !== this.src) {
        event.target.src = this.src;
        return;
      }

      if (currentSrc === this.src || optimizedUrl === this.src) {
        if (this.errorSrc && currentSrc !== this.errorSrc) {
          event.target.src = this.errorSrc;
          return;
        }

        this.hasError = true;
        this.isLoading = false;
        this.$emit('error', event);
      }
    },

    // 处理图片点击
    handleClick(event) {
      const imageInfo = {
        src: this.src,
        currentSrc: event.target?.src || this.optimizedSrc,
        optimizedSrc: this.optimizedSrc,
        alt: this.alt,
        dataId: this.dataId,
        isLoaded: this.isLoaded,
        isLoading: this.isLoading,
        hasError: this.hasError,
        isCompressing: this.isCompressing,
        optimizationInfo: this.optimizationInfo,
        imageElement: event.target,
      };
      
      this.$emit('click', event, imageInfo);
    },

    // 处理渐进式加载
    async handleProgressiveLoad() {
      if (!this.progressive || this.isLoaded || this.hasError || 
          this.progressiveImageUrl || !this.src) {
        return;
      }

      try {
        this.isLoading = true;
        
        const result = await loadImageProgressiveWithCache(this.src, {
          stages: this.progressiveStages,
          timeout: this.progressiveTimeout,
          enableCache: this.progressiveEnableCache,
          onStageComplete: (stageIndex, stageUrl, stage) => {
            this.progressiveStageIndex = stageIndex + 1;
            this.progressiveImageUrl = stageUrl;
            this.$emit('progressive-stage-complete', stageIndex, stageUrl, stage);
          },
          onComplete: (finalUrl) => {
            this.progressiveImageUrl = finalUrl;
            this.progressiveStageIndex = this.progressiveStages.length;
            this.isLoading = false;
            // 图片元素的 load 事件会在 src 更新后自动触发
          },
          onError: (error, stageIndex) => {
            console.warn('渐进式加载失败:', error);
            this.isLoading = false;
            this.hasError = true;
            this.$emit('error', { error, stageIndex });
          }
        });

        if (result && result.url) {
          this.progressiveImageUrl = result.url;
          if (result.stages && result.stages.length > 0) {
            this.progressiveStageIndex = result.stages.length;
          }
        }
      } catch (error) {
        console.error('渐进式加载出错:', error);
        this.isLoading = false;
        this.hasError = true;
        this.$emit('error', { error });
      }
    },

    // 处理 shouldLoad 变化
    async handleShouldLoad() {
      if (this.progressive || this.isLoaded || this.hasError || this.isLoading || 
          this.isCompressing || this.cachedBlobUrl || this.progressiveImageUrl || !this.src) {
        return;
      }

      // 先尝试从缓存加载
      try {
        const finalUrl = this.getOptimizedUrl(this.src);
        const blobUrl = await loadImageWithCache(finalUrl);
        if (blobUrl) {
          this.cachedBlobUrl = blobUrl;
          return;
        }
      } catch (error) {
        // 缓存加载失败，继续正常流程
      }

      // 检查是否需要浏览器端压缩
      const cdn = detectCDN(this.src);
      const shouldUseBrowserCompression = 
        this.enableBrowserCompression && 
        !cdn && 
        this.optimize && Object.keys(this.optimize).length > 0 &&
        typeof window !== 'undefined' &&
        !this.compressedSrc;

      if (shouldUseBrowserCompression) {
        this.isCompressing = true;
        // 这里需要实现 compressImageInBrowser 函数
        // compressImageInBrowser(this.src, this.optimize)
        //   .then((dataURL) => {
        //     this.compressedSrc = dataURL;
        //     this.isCompressing = false;
        //   })
        //   .catch((error) => {
        //     console.warn('浏览器端压缩失败:', error);
        //     this.isCompressing = false;
        //     this.isLoading = true;
        //   });
      } else {
        this.isLoading = true;
      }
    },

    // 重置状态
    resetState() {
      // 清理 Blob URL
      if (this.cachedBlobUrl) {
        URL.revokeObjectURL(this.cachedBlobUrl);
      }

      this.isLoaded = false;
      this.hasError = false;
      this.isLoading = false;
      this.lockedSrc = '';
      this.compressedSrc = null;
      this.isCompressing = false;
      this.cachedBlobUrl = null;
      this.progressiveImageUrl = '';
      this.progressiveStageIndex = -1;
      this.optimizationInfo = null;
    }
  },

  mounted() {
    if (!this.immediate) {
      this.initObserver();
    } else {
      this.shouldLoad = true;
    }
  },

  beforeUnmount() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // 清理 Blob URL
    if (this.cachedBlobUrl) {
      URL.revokeObjectURL(this.cachedBlobUrl);
    }
  }
};
</script>
<style scoped>
@import './LazyImage.css';
</style>