<script setup>
import { ref } from 'vue'
// 导入 Vue 组件
import LazyImage from "rv-image-optimize/src/LazyImage.vue"

const imageUrl = ref("https://pic.rmb.bdstatic.com/bjh/pay_read/3883a287b37eaa34dcf80a031f969db05547.jpeg")

// 生成200张图片的数组
const imageList = Array.from({ length: 200 }, (_, i) => i + 1)

const handleProgressiveStageComplete = (stageIndex, stageUrl, stage) => {
  // 可以在这里处理阶段完成事件
  // console.log(`阶段 ${stageIndex + 1} 完成`)
}

const handleImageLoad = (event, optimizationInfo) => {
  // console.log('图片加载成功', optimizationInfo)
}
</script>

<template>
  <div class="app-container">
    <h1>图片优化示例</h1>
    
    <div class="demo-section">
      <h2>懒加载 + 渐进式加载示例</h2>
      <p class="description">
        🎨 新功能：结合懒加载和渐进式加载，图片从模糊逐渐变清晰，体验更丝滑。
        先加载极小的模糊占位图，然后逐步加载更清晰的版本，最后加载原图。
        <br />
        <strong>参数说明：</strong>
        <br />
        • <code>progressive</code>: 是否启用渐进式加载（默认 false）
        <br />
        • <code>progressiveStages</code>: 渐进式加载阶段配置数组
        <br />
        • <code>progressiveTransitionDuration</code>: 过渡动画时间（毫秒，默认 300）
        <br />
        • <code>progressiveTimeout</code>: 每个阶段的加载超时时间（毫秒，默认 30000）
        <br />
        • <code>progressiveEnableCache</code>: 是否启用缓存（默认 true，设置为 false 可禁用缓存）
      </p>
      
      <div class="image-grid">
        <div 
          v-for="index in 20" 
          :key="index" 
          class="image-item"
        >
          <LazyImage
            :src="imageUrl"
            :alt="`渐进式加载图片 ${index}`"
            width="100%"
            :height="300"
            root-margin="50px"
            :progressive="true"
            :progressive-stages="[
              { width: 20, quality: 20, blur: 10 },   // 阶段1: 极速模糊图
              { width: 400, quality: 50, blur: 3 },   // 阶段2: 中等质量
              { width: null, quality: 80, blur: 1 }   // 阶段3: 最终质量（原图）
            ]"
            :progressive-transition-duration="300"
            :progressive-timeout="30000"
            @progressive-stage-complete="handleProgressiveStageComplete"
            @load="handleImageLoad"
          />
          <p class="image-label">
            图片 {{ index }} - 滚动查看渐进式加载效果
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import 'rv-image-optimize/src/LazyImage.css';

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.image-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  background-color: #fff;
  transition: box-shadow 0.3s;
}

.image-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-label {
  margin-top: 10px;
  font-size: 12px;
  color: #999;
  text-align: center;
}
</style>
