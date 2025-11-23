(function(P,U){typeof exports=="object"&&typeof module<"u"?U(exports,require("react")):typeof define=="function"&&define.amd?define(["exports","react"],U):(P=typeof globalThis<"u"?globalThis:P||self,U(P.ImageOptimize={},P.React))})(this,function(P,U){"use strict";function ke(){const e=[];if(typeof window<"u"&&typeof document<"u"){const r=(()=>{try{const s=document.createElement("canvas");return s.width=1,s.height=1,s.toDataURL("image/webp").indexOf("data:image/webp")===0}catch{return!1}})();(()=>{try{const s=document.createElement("canvas");return s.width=1,s.height=1,s.toDataURL("image/avif").indexOf("data:image/avif")===0}catch{return!1}})()&&e.push("avif"),r&&e.push("webp")}return e.push("jpg","jpeg","png"),e}function Ge(e=null){const n=ke();if(e){const r=e.toLowerCase().replace("jpeg","jpg");if(n.includes(r))return r}return n[0]||"jpg"}function it(e){if(!e)return null;const r=e.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)(\?|$)/i);if(r){const a=r[1].toLowerCase();return a==="jpeg"?"jpg":a}try{const a=new URL(e),s=a.searchParams.get("format")||a.searchParams.get("f")||a.searchParams.get("image_format");if(s)return s.toLowerCase().replace("jpeg","jpg")}catch{}return null}const Mt={aliyun:{test:e=>e.includes("aliyuncs.com")||e.includes("oss-"),process:(e,n)=>{const{width:r,height:a,quality:s,format:o}=n,l=[];return(r||a)&&l.push(`resize,w_${r||""},h_${a||""},m_lfit`),s&&l.push(`quality,q_${s}`),o&&l.push(`format,${o}`),l.length>0&&e.searchParams.set("x-oss-process",l.join("/")),e.toString()}},tencent:{test:e=>e.includes("qcloud.com")||e.includes("myqcloud.com"),process:(e,n)=>{const{width:r,height:a,quality:s,format:o}=n,l=[];if((r||a)&&l.push(`imageMogr2/thumbnail/${r}x${a}`),s&&l.push(`quality/${s}`),o&&l.push(`format/${o}`),l.length>0){const u=l.join("|"),i=e.search?"|":"?imageMogr2/";return`${e.toString()}${i}${u}`}return e.toString()}},qiniu:{test:e=>e.includes("qiniucdn.com")||e.includes("qiniu.com"),process:(e,n)=>{const{width:r,height:a,quality:s,format:o}=n,l=[];if((r||a)&&l.push(`imageView2/1/w/${r||""}/h/${a||""}`),s&&l.push(`quality/${s}`),o&&l.push(`format/${o}`),l.length>0){const u=l.join("|"),i=e.search?"|":"?";return`${e.toString()}${i}${u}`}return e.toString()}},upyun:{test:e=>e.includes("upaiyun.com")||e.includes("upyun.com"),process:(e,n)=>{const{width:r,height:a,quality:s,format:o}=n,l=[];if((r||a)&&l.push(`${r||""}x${a||""}`),s&&l.push(`quality/${s}`),o&&l.push(`format/${o}`),l.length>0){const u=e.pathname.split("/"),i=u[u.length-1],d=u.slice(0,-1).join("/")+"/!"+l.join("/")+"/"+i;e.pathname=d}return e.toString()}},cloudfront:{test:e=>e.includes("cloudfront.net")||e.includes(".aws"),process:(e,n)=>{const{width:r,height:a,quality:s,format:o}=n;return r&&e.searchParams.set("w",r),a&&e.searchParams.set("h",a),s&&e.searchParams.set("q",s),o&&e.searchParams.set("f",o),e.toString()}}};function be(e,n={}){if(!e)return e;const{width:r=null,height:a=null,quality:s=30,format:o=null,autoFormat:l=!0}=n;try{let u;try{u=new URL(e)}catch{if(e.startsWith("/")){const b=typeof window<"u"&&window.location?window.location.origin:"https://example.com";u=new URL(e,b)}else return console.warn("无法解析的图片URL，跳过优化:",e),e}let i=o;l&&!o?i=Ge():o&&(i=Ge(o));for(const[c,b]of Object.entries(Mt))if(b.test(e))return b.process(u,{width:r,height:a,quality:s,format:i});return r&&u.searchParams.set("w",r),a&&u.searchParams.set("h",a),s&&u.searchParams.set("q",s),i&&u.searchParams.set("f",i),u.toString()}catch(u){return console.warn("图片URL优化失败:",u),e}}function ct(e,n={}){if(!e)return"";const{widths:r=null,aspectRatio:a=null,quality:s=80,format:o=null,autoFormat:l=!0}=n;return(r||[320,640,960,1280,1920]).map(c=>`${be(e,{width:c,height:a?Math.round(c/a):null,quality:s,format:o,autoFormat:l})} ${c}w`).join(", ")}function Je(e={}){const{breakpoints:n=["(max-width: 640px) 100vw","(max-width: 1024px) 50vw","33vw"]}=e;return Array.isArray(n)?n.join(", "):n}function jt(e,n={}){if(!e)return{src:"",srcset:"",sizes:""};const{widths:r=null,aspectRatio:a=null,quality:s=80,format:o=null,autoFormat:l=!0,sizes:u=null,fallbackWidth:i=960}=n,d=ct(e,{widths:r,aspectRatio:a,quality:s,format:o,autoFormat:l}),c=u?typeof u=="string"?u:Je(u):Je();return{src:be(e,{width:i,height:a?Math.round(i/a):null,quality:s,format:o,autoFormat:l}),srcset:d,sizes:c}}function Ut(e){return be(e,{width:240,height:320,quality:75})}function lt(e){return new Promise(n=>{if(!e){n(!1);return}const r=new Image;r.onload=()=>n(!0),r.onerror=()=>n(!1),r.src=e})}async function zt(e,n=3){const r=[],a=[...e],s=async()=>{for(;a.length>0;){const l=a.shift(),u=await lt(l);r.push({url:l,success:u})}},o=Array(Math.min(n,e.length)).fill(null).map(()=>s());return await Promise.all(o),r}async function ut(e,n={}){const{concurrency:r=10,timeout:a=3e4,priority:s=!0,stages:o=null,enableCache:l=!0,urlTransformer:u=null,onStageError:i=null,onProgress:d=null,onItemComplete:c=null,onItemStageComplete:b=null,retryOnError:g=!1,maxRetries:h=1}=n,y=e.map((v,S)=>typeof v=="string"?{url:v,priority:0,index:S}:{url:v.url||v.src||"",priority:v.priority||0,index:v.index!==void 0?v.index:S});s&&y.sort((v,S)=>S.priority-v.priority);const m=new Array(y.length);let x=0;const E=y.length,p=async(v,S=0)=>{const{url:_,index:L}=v;if(!_){const D={url:"",success:!1,error:new Error("图片URL为空"),index:L,retries:S};return m[L]=D,x++,d&&d(x,E,D),c&&c(D),D}if(o&&Array.isArray(o)&&o.length>0){const{loadImageProgressiveWithCache:T}=await Promise.resolve().then(()=>hr);return T(_,{stages:o,timeout:a,enableCache:l,urlTransformer:u,onStageError:i,onStageComplete:(D,k,H)=>{b&&b({url:_,index:L,stageIndex:D,stageUrl:k,stage:H,currentStage:D+1,totalStages:o.length},D)},onComplete:D=>{},onError:(D,k)=>{}}).then(D=>{const k={url:D.url,success:D.success,error:D.error,index:L,retries:S,stages:D.stages,fromCache:D.fromCache||!1};return m[L]=k,x++,d&&d(x,E,k),c&&c(k),k})}return new Promise(T=>{const D=new Image;let k=!1,H=null;const X=()=>{H&&(clearTimeout(H),H=null),D.onload=null,D.onerror=null,D.src=""},$=(V,K=null)=>{if(k)return null;k=!0,X();const J={url:_,success:V,error:K,index:L,retries:S};return m[L]=J,x++,d&&d(x,E,J),c&&c(J),J};H=setTimeout(()=>{const V=new Error(`图片加载超时 (${a}ms)`),K=$(!1,V);g&&S<h?setTimeout(()=>{p(v,S+1).then(T)},1e3*(S+1)):T(K)},a),D.onload=()=>{const V=$(!0,null);V&&T(V)},D.onerror=V=>{const K=new Error("图片加载失败");K.originalEvent=V;const J=$(!1,K);g&&S<h?setTimeout(()=>{p(v,S+1).then(T)},1e3*(S+1)):T(J)};try{D.crossOrigin="anonymous",D.src=_}catch(V){const K=$(!1,V);K&&T(K)}})},z=[...y],C=new Set,R=[];return await(async()=>{for(;z.length>0||C.size>0;){for(;z.length>0&&C.size<r;){const v=z.shift(),S=p(v).then(_=>(C.delete(S),_)).catch(_=>{C.delete(S);const L={url:v.url,success:!1,error:_ instanceof Error?_:new Error(String(_)),index:v.index,retries:0};return m[v.index]=L,x++,d&&d(x,E,L),c&&c(L),L});C.add(S),R.push(S)}C.size>0&&await Promise.race(Array.from(C))}})(),await Promise.all(R),m}async function It(e,n={}){return ut(e,{priority:!1,...n})}function ft(e,n={}){if(!e)return e;const{width:r=20,height:a=null,quality:s=20,blur:o=10}=n;return be(e,{width:r,height:a,quality:s,format:"jpg"})}async function dt(e,n={}){var b;const{stages:r=[{width:20,quality:20,blur:10},{width:400,quality:50,blur:3},{width:null,quality:80,blur:0}],timeout:a=3e4,urlTransformer:s=null,onStageComplete:o=null,onStageError:l=null,onComplete:u=null,onError:i=null}=n;if(!e){const g=new Error("图片URL为空");return i&&i(g,-1),{url:"",stages:[],success:!1,error:g}}const d=[];let c=e;try{for(let h=0;h<r.length;h++){const y=r[h];let m;s&&typeof s=="function"?m=s(e,y,h):h===r.length-1&&!y.width&&!y.height?m=e:m=be(e,{width:y.width||null,height:y.height||null,quality:y.quality||80,format:y.format||null,autoFormat:y.autoFormat!==!1});let x;try{x=await new Promise((E,p)=>{const z=new Image;let C=null,R=!1;const I=()=>{C&&(clearTimeout(C),C=null),z.onload=null,z.onerror=null,z.src=""};C=setTimeout(()=>{if(!R){R=!0,I();const v=new Error(`阶段 ${h+1} 加载超时: ${m}`);p(v)}},a),z.onload=()=>{R||(R=!0,I(),E({url:m,stage:y,loaded:!0}))},z.onerror=v=>{if(!R){R=!0,I();let S=`阶段 ${h+1} 加载失败`;try{if(v.target&&v.target.src){const L=v.target.src;S=`阶段 ${h+1} 加载失败`}}catch{}const _=new Error(S);_.originalEvent=v,_.stageUrl=m,_.stageIndex=h,p(_)}};try{z.crossOrigin="anonymous",z.src=m}catch(v){R||(R=!0,I(),p(v))}}),d.push(x),c=m,o&&o(h,m,y)}catch(E){let p=null;if(l&&typeof l=="function")try{p=l(E,h,m,y)}catch{}if(p&&typeof p=="string")try{const C=await new Promise((R,I)=>{const v=new Image;let S=null,_=!1;const L=()=>{S&&(clearTimeout(S),S=null),v.onload=null,v.onerror=null,v.src=""};S=setTimeout(()=>{_||(_=!0,L(),I(new Error(`降级URL加载超时: ${p}`)))},a),v.onload=()=>{_||(_=!0,L(),R({url:p,stage:y,loaded:!0}))},v.onerror=()=>{_||(_=!0,L(),I(new Error(`降级URL加载失败: ${p}`)))};try{v.crossOrigin="anonymous",v.src=p}catch(T){_||(_=!0,L(),I(T))}});d.push(C),c=p,o&&o(h,p,y);break}catch{}const z=E.message.includes("404")||E.originalEvent&&E.originalEvent.type==="error";if((!z||process.env.NODE_ENV==="development")&&(z||console.warn(`⚠️ 阶段 ${h+1} 加载失败，跳过继续下一阶段:`,E.message)),d.push({url:m,stage:y,loaded:!1,error:E}),h===r.length-1&&d.length>0){for(let C=d.length-1;C>=0;C--)if(d[C].loaded){c=d[C].url;break}}if(o&&o(h,m,y),!(h<r.length-1)){if(!d.some(C=>C.loaded))throw new Error(`所有阶段加载失败，最后一个错误: ${E.message}`)}}h<r.length-1&&await new Promise(E=>setTimeout(E,100))}if(!d.some(h=>h.loaded)){const h=((b=d[d.length-1])==null?void 0:b.error)||new Error("所有阶段加载失败"),y=h.message.includes("404")||h.originalEvent&&h.originalEvent.type==="error";return(!y||process.env.NODE_ENV==="development")&&(y||console.error(`❌ 图片加载失败: ${e.substring(0,50)}...`,h.message)),i&&i(h,d.length-1),{url:c||e,stages:d,success:!1,error:h}}return u&&u(c),{url:c,stages:d,success:!0,error:null}}catch(g){const h=d.length,y=g.message&&g.message.includes("404");return(!y||process.env.NODE_ENV==="development")&&(y||console.error(`❌ 渐进式加载过程出错: ${e.substring(0,50)}...`,g.message||g)),i&&i(g,h),{url:c||e,stages:d,success:!1,error:g}}}async function kt(e,n={}){const{stages:r=[{width:20,quality:20,blur:10},{width:400,quality:50,blur:3},{width:null,quality:80,blur:0}],concurrency:a=5,timeout:s=3e4,onProgress:o=null,onItemStageComplete:l=null,onItemComplete:u=null}=n,i=e.map((E,p)=>typeof E=="string"?{url:E,index:p}:{url:E.url||E.src||"",index:E.index!==void 0?E.index:p}),d=new Array(i.length);let c=0;const b=i.length,g=async E=>{const{url:p,index:z}=E,C=await dt(p,{stages:r,timeout:s,onStageComplete:(R,I,v)=>{l&&l({url:p,index:z,stageIndex:R,stageUrl:I,stage:v,currentStage:R+1,totalStages:r.length},R)},onComplete:R=>{},onError:(R,I)=>{}});return d[z]=C,c++,o&&o(c,b,C),u&&u(C),C},h=[...i],y=new Set,m=[];return await(async()=>{for(;h.length>0||y.size>0;){for(;h.length>0&&y.size<a;){const E=h.shift(),p=g(E).then(z=>(y.delete(p),z)).catch(z=>{y.delete(p);const C={url:E.url,stages:[],success:!1,error:z instanceof Error?z:new Error(String(z))};return d[E.index]=C,c++,o&&o(c,b,C),u&&u(C),C});y.add(p),m.push(p)}y.size>0&&await Promise.race(Array.from(y))}})(),await Promise.all(m),d}async function gt(e,n={}){const{maxWidth:r=null,maxHeight:a=null,quality:s=.8,compressionLevel:o=.5,blur:l=0,smooth:u=!0,format:i=null}=n;if(typeof window>"u"||typeof document>"u")throw new Error("浏览器端压缩功能仅在浏览器环境中可用");return new Promise((d,c)=>{const b=new Image;if(b.crossOrigin="anonymous",b.onload=()=>{try{let{width:g,height:h}=b,y=g,m=h,x=!1;if(r||a){const T=Math.min(r?r/g:1,a?a/h:1);T<1&&(y=Math.round(g*T),m=Math.round(h*T),x=!0)}let E=y,p=m;if(o>0){const T=1-o*.75;E=Math.round(y*T),p=Math.round(m*T)}const z=E!==g||p!==h;if(!(z||o>0||l>0)&&typeof e=="string"){d(e);return}const R=document.createElement("canvas");R.width=E,R.height=p;const I=R.getContext("2d");if(z?(I.imageSmoothingEnabled=u,I.imageSmoothingQuality=u?"high":"low"):I.imageSmoothingEnabled=!1,I.drawImage(b,0,0,E,p),l>0){const T=document.createElement("canvas"),D=T.getContext("2d");if(T.width=E,T.height=p,D.drawImage(b,0,0,E,p),D.filter!==void 0)try{D.filter=`blur(${l}px)`,D.drawImage(T,0,0),D.filter="none",I.clearRect(0,0,R.width,R.height),I.drawImage(T,0,0)}catch{At(I,T,E,p,l)}else At(I,T,E,p,l)}let v=i;if(!v)if(o>0||l>0||z)v=ke().includes("webp")?"webp":"jpeg";else{const D=it(e);D&&["jpg","jpeg","png"].includes(D)?v=D==="jpeg"?"jpeg":D:v=ke().includes("webp")?"webp":"jpeg"}let S=s;o>0?(S=s*(1-o*.7),S=Math.max(.1,Math.min(1,S))):!z&&l===0?S=Math.max(s,.98):z&&(S=Math.max(s,.92));const _=v==="webp"?"image/webp":v==="png"?"image/png":"image/jpeg",L=R.toDataURL(_,S);d(L)}catch(g){c(new Error("图片压缩失败: "+g.message))}},b.onerror=()=>{c(new Error("图片加载失败"))},typeof e=="string")b.src=e;else if(e instanceof File||e instanceof Blob){const g=new FileReader;g.onload=h=>{b.src=h.target.result},g.onerror=()=>c(new Error("文件读取失败")),g.readAsDataURL(e)}else c(new Error("不支持的图片源类型"))})}function At(e,n,r,a,s){const o=document.createElement("canvas"),l=o.getContext("2d"),u=Math.max(.3,1-s/10),i=Math.round(r*u),d=Math.round(a*u);o.width=i,o.height=d,l.drawImage(n,0,0,r,a,0,0,i,d),e.clearRect(0,0,r,a),e.drawImage(o,0,0,i,d,0,0,r,a)}function mt(e){const n=e.split(","),r=n[0].match(/:(.*?);/)[1],a=atob(n[1]);let s=a.length;const o=new Uint8Array(s);for(;s--;)o[s]=a.charCodeAt(s);return new Blob([o],{type:r})}async function Ze(e){if(!e)return null;try{if(e.startsWith("blob:"))return(await(await fetch(e)).blob()).size;if(e.startsWith("data:")){const a=e.split(",")[1];if(a){const s=atob(a);return new Blob([s]).size}return null}try{const s=(await fetch(e,{method:"HEAD"})).headers.get("Content-Length");if(s)return parseInt(s,10)}catch{}return(await(await fetch(e)).blob()).size}catch{return null}}function Ae(e){if(e==null)return"未知";if(e===0)return"0 B";const n=1024,r=["B","KB","MB","GB"],a=Math.floor(Math.log(e)/Math.log(n));return parseFloat((e/Math.pow(n,a)).toFixed(2))+" "+r[a]}function Se(e){if(!e)return null;for(const[n,r]of Object.entries(Mt))if(r.test(e))return n;return null}async function ht(e,n){const[r,a]=await Promise.all([Ze(e),Ze(n)]);let s=null,o=null,l=!1,u=null;return r!==null&&a!==null&&(s=r-a,o=parseFloat((s/r*100).toFixed(2)),l=s>1024||o>1,!l&&s===0?Se(e)?u="⚠️ 优化参数可能无效，图片大小未发生变化。请检查CDN配置是否正确。":u="⚠️ 该图片URL不是支持的CDN，通用查询参数可能无效。支持的CDN：阿里云OSS、腾讯云COS、七牛云、又拍云、AWS CloudFront。":!l&&s>0&&o<=1&&(u=`⚠️ 优化效果不明显（仅节省 ${o}%），可能优化参数未生效。`)),{originalUrl:e,optimizedUrl:n,originalSize:r,optimizedSize:a,savedSize:s,savedPercentage:o,isOptimizationEffective:l,warningMessage:u,originalSizeFormatted:Ae(r),optimizedSizeFormatted:Ae(a),savedSizeFormatted:Ae(s),cdn:Se(e)}}const tr=Object.freeze(Object.defineProperty({__proto__:null,compareImageSizes:ht,compressImageInBrowser:gt,dataURLToBlob:mt,detectCDN:Se,detectImageFormat:it,detectSupportedFormats:ke,formatFileSize:Ae,generateBlurPlaceholderUrl:ft,generateResponsiveImage:jt,generateSizes:Je,generateSrcset:ct,getBestFormat:Ge,getImageSize:Ze,getOptimizedCoverUrl:Ut,loadImageProgressive:dt,loadImagesBatch:It,loadImagesProgressiveBatch:kt,loadImagesProgressively:ut,optimizeImageUrl:be,preloadImage:lt,preloadImages:zt},Symbol.toStringTag,{value:"Module"}));var pt={exports:{}},Ne={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Nt;function rr(){if(Nt)return Ne;Nt=1;var e=U,n=Symbol.for("react.element"),r=Symbol.for("react.fragment"),a=Object.prototype.hasOwnProperty,s=e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,o={key:!0,ref:!0,__self:!0,__source:!0};function l(u,i,d){var c,b={},g=null,h=null;d!==void 0&&(g=""+d),i.key!==void 0&&(g=""+i.key),i.ref!==void 0&&(h=i.ref);for(c in i)a.call(i,c)&&!o.hasOwnProperty(c)&&(b[c]=i[c]);if(u&&u.defaultProps)for(c in i=u.defaultProps,i)b[c]===void 0&&(b[c]=i[c]);return{$$typeof:n,type:u,key:g,ref:h,props:b,_owner:s.current}}return Ne.Fragment=r,Ne.jsx=l,Ne.jsxs=l,Ne}var Oe={};/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Ot;function ar(){return Ot||(Ot=1,process.env.NODE_ENV!=="production"&&function(){var e=U,n=Symbol.for("react.element"),r=Symbol.for("react.portal"),a=Symbol.for("react.fragment"),s=Symbol.for("react.strict_mode"),o=Symbol.for("react.profiler"),l=Symbol.for("react.provider"),u=Symbol.for("react.context"),i=Symbol.for("react.forward_ref"),d=Symbol.for("react.suspense"),c=Symbol.for("react.suspense_list"),b=Symbol.for("react.memo"),g=Symbol.for("react.lazy"),h=Symbol.for("react.offscreen"),y=Symbol.iterator,m="@@iterator";function x(t){if(t===null||typeof t!="object")return null;var f=y&&t[y]||t[m];return typeof f=="function"?f:null}var E=e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;function p(t){{for(var f=arguments.length,w=new Array(f>1?f-1:0),B=1;B<f;B++)w[B-1]=arguments[B];z("error",t,w)}}function z(t,f,w){{var B=E.ReactDebugCurrentFrame,F=B.getStackAddendum();F!==""&&(f+="%s",w=w.concat([F]));var W=w.map(function(N){return String(N)});W.unshift("Warning: "+f),Function.prototype.apply.call(console[t],console,W)}}var C=!1,R=!1,I=!1,v=!1,S=!1,_;_=Symbol.for("react.module.reference");function L(t){return!!(typeof t=="string"||typeof t=="function"||t===a||t===o||S||t===s||t===d||t===c||v||t===h||C||R||I||typeof t=="object"&&t!==null&&(t.$$typeof===g||t.$$typeof===b||t.$$typeof===l||t.$$typeof===u||t.$$typeof===i||t.$$typeof===_||t.getModuleId!==void 0))}function T(t,f,w){var B=t.displayName;if(B)return B;var F=f.displayName||f.name||"";return F!==""?w+"("+F+")":w}function D(t){return t.displayName||"Context"}function k(t){if(t==null)return null;if(typeof t.tag=="number"&&p("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."),typeof t=="function")return t.displayName||t.name||null;if(typeof t=="string")return t;switch(t){case a:return"Fragment";case r:return"Portal";case o:return"Profiler";case s:return"StrictMode";case d:return"Suspense";case c:return"SuspenseList"}if(typeof t=="object")switch(t.$$typeof){case u:var f=t;return D(f)+".Consumer";case l:var w=t;return D(w._context)+".Provider";case i:return T(t,t.render,"ForwardRef");case b:var B=t.displayName||null;return B!==null?B:k(t.type)||"Memo";case g:{var F=t,W=F._payload,N=F._init;try{return k(N(W))}catch{return null}}}return null}var H=Object.assign,X=0,$,V,K,J,ee,le,Re;function ve(){}ve.__reactDisabledLog=!0;function at(){{if(X===0){$=console.log,V=console.info,K=console.warn,J=console.error,ee=console.group,le=console.groupCollapsed,Re=console.groupEnd;var t={configurable:!0,enumerable:!0,value:ve,writable:!0};Object.defineProperties(console,{info:t,log:t,warn:t,error:t,group:t,groupCollapsed:t,groupEnd:t})}X++}}function De(){{if(X--,X===0){var t={configurable:!0,enumerable:!0,writable:!0};Object.defineProperties(console,{log:H({},t,{value:$}),info:H({},t,{value:V}),warn:H({},t,{value:K}),error:H({},t,{value:J}),group:H({},t,{value:ee}),groupCollapsed:H({},t,{value:le}),groupEnd:H({},t,{value:Re})})}X<0&&p("disabledDepth fell below zero. This is a bug in React. Please file an issue.")}}var Ee=E.ReactCurrentDispatcher,ne;function _e(t,f,w){{if(ne===void 0)try{throw Error()}catch(F){var B=F.stack.trim().match(/\n( *(at )?)/);ne=B&&B[1]||""}return`
`+ne+t}}var ue=!1,ye;{var Pe=typeof WeakMap=="function"?WeakMap:Map;ye=new Pe}function he(t,f){if(!t||ue)return"";{var w=ye.get(t);if(w!==void 0)return w}var B;ue=!0;var F=Error.prepareStackTrace;Error.prepareStackTrace=void 0;var W;W=Ee.current,Ee.current=null,at();try{if(f){var N=function(){throw Error()};if(Object.defineProperty(N.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(N,[])}catch(ae){B=ae}Reflect.construct(t,[],N)}else{try{N.call()}catch(ae){B=ae}t.call(N.prototype)}}else{try{throw Error()}catch(ae){B=ae}t()}}catch(ae){if(ae&&B&&typeof ae.stack=="string"){for(var A=ae.stack.split(`
`),re=B.stack.split(`
`),Y=A.length-1,G=re.length-1;Y>=1&&G>=0&&A[Y]!==re[G];)G--;for(;Y>=1&&G>=0;Y--,G--)if(A[Y]!==re[G]){if(Y!==1||G!==1)do if(Y--,G--,G<0||A[Y]!==re[G]){var ie=`
`+A[Y].replace(" at new "," at ");return t.displayName&&ie.includes("<anonymous>")&&(ie=ie.replace("<anonymous>",t.displayName)),typeof t=="function"&&ye.set(t,ie),ie}while(Y>=1&&G>=0);break}}}finally{ue=!1,Ee.current=W,De(),Error.prepareStackTrace=F}var Ie=t?t.displayName||t.name:"",Me=Ie?_e(Ie):"";return typeof t=="function"&&ye.set(t,Me),Me}function Te(t,f,w){return he(t,!1)}function te(t){var f=t.prototype;return!!(f&&f.isReactComponent)}function fe(t,f,w){if(t==null)return"";if(typeof t=="function")return he(t,te(t));if(typeof t=="string")return _e(t);switch(t){case d:return _e("Suspense");case c:return _e("SuspenseList")}if(typeof t=="object")switch(t.$$typeof){case i:return Te(t.render);case b:return fe(t.type,f,w);case g:{var B=t,F=B._payload,W=B._init;try{return fe(W(F),f,w)}catch{}}}return""}var se=Object.prototype.hasOwnProperty,He={},Be=E.ReactDebugCurrentFrame;function pe(t){if(t){var f=t._owner,w=fe(t.type,t._source,f?f.type:null);Be.setExtraStackFrame(w)}else Be.setExtraStackFrame(null)}function nt(t,f,w,B,F){{var W=Function.call.bind(se);for(var N in t)if(W(t,N)){var A=void 0;try{if(typeof t[N]!="function"){var re=Error((B||"React class")+": "+w+" type `"+N+"` is invalid; it must be a function, usually from the `prop-types` package, but received `"+typeof t[N]+"`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");throw re.name="Invariant Violation",re}A=t[N](f,N,B,w,null,"SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED")}catch(Y){A=Y}A&&!(A instanceof Error)&&(pe(F),p("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).",B||"React class",w,N,typeof A),pe(null)),A instanceof Error&&!(A.message in He)&&(He[A.message]=!0,pe(F),p("Failed %s type: %s",w,A.message),pe(null))}}}var Ct=Array.isArray;function Qe(t){return Ct(t)}function xt(t){{var f=typeof Symbol=="function"&&Symbol.toStringTag,w=f&&t[Symbol.toStringTag]||t.constructor.name||"Object";return w}}function de(t){try{return oe(t),!1}catch{return!0}}function oe(t){return""+t}function st(t){if(de(t))return p("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.",xt(t)),oe(t)}var O=E.ReactCurrentOwner,M={key:!0,ref:!0,__self:!0,__source:!0},q,j;function Z(t){if(se.call(t,"ref")){var f=Object.getOwnPropertyDescriptor(t,"ref").get;if(f&&f.isReactWarning)return!1}return t.ref!==void 0}function Ye(t){if(se.call(t,"key")){var f=Object.getOwnPropertyDescriptor(t,"key").get;if(f&&f.isReactWarning)return!1}return t.key!==void 0}function Ue(t,f){typeof t.ref=="string"&&O.current}function ot(t,f){{var w=function(){q||(q=!0,p("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)",f))};w.isReactWarning=!0,Object.defineProperty(t,"key",{get:w,configurable:!0})}}function Rt(t,f){{var w=function(){j||(j=!0,p("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)",f))};w.isReactWarning=!0,Object.defineProperty(t,"ref",{get:w,configurable:!0})}}var Dt=function(t,f,w,B,F,W,N){var A={$$typeof:n,type:t,key:f,ref:w,props:N,_owner:W};return A._store={},Object.defineProperty(A._store,"validated",{configurable:!1,enumerable:!1,writable:!0,value:!1}),Object.defineProperty(A,"_self",{configurable:!1,enumerable:!1,writable:!1,value:B}),Object.defineProperty(A,"_source",{configurable:!1,enumerable:!1,writable:!1,value:F}),Object.freeze&&(Object.freeze(A.props),Object.freeze(A)),A};function _t(t,f,w,B,F){{var W,N={},A=null,re=null;w!==void 0&&(st(w),A=""+w),Ye(f)&&(st(f.key),A=""+f.key),Z(f)&&(re=f.ref,Ue(f,F));for(W in f)se.call(f,W)&&!M.hasOwnProperty(W)&&(N[W]=f[W]);if(t&&t.defaultProps){var Y=t.defaultProps;for(W in Y)N[W]===void 0&&(N[W]=Y[W])}if(A||re){var G=typeof t=="function"?t.displayName||t.name||"Unknown":t;A&&ot(N,G),re&&Rt(N,G)}return Dt(t,A,re,F,B,O.current,N)}}var Ke=E.ReactCurrentOwner,Yt=E.ReactDebugCurrentFrame;function ze(t){if(t){var f=t._owner,w=fe(t.type,t._source,f?f.type:null);Yt.setExtraStackFrame(w)}else Yt.setExtraStackFrame(null)}var Pt;Pt=!1;function Tt(t){return typeof t=="object"&&t!==null&&t.$$typeof===n}function Kt(){{if(Ke.current){var t=k(Ke.current.type);if(t)return`

Check the render method of \``+t+"`."}return""}}function wr(t){return""}var Gt={};function yr(t){{var f=Kt();if(!f){var w=typeof t=="string"?t:t.displayName||t.name;w&&(f=`

Check the top-level render call using <`+w+">.")}return f}}function Jt(t,f){{if(!t._store||t._store.validated||t.key!=null)return;t._store.validated=!0;var w=yr(f);if(Gt[w])return;Gt[w]=!0;var B="";t&&t._owner&&t._owner!==Ke.current&&(B=" It was passed a child from "+k(t._owner.type)+"."),ze(t),p('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.',w,B),ze(null)}}function Zt(t,f){{if(typeof t!="object")return;if(Qe(t))for(var w=0;w<t.length;w++){var B=t[w];Tt(B)&&Jt(B,f)}else if(Tt(t))t._store&&(t._store.validated=!0);else if(t){var F=x(t);if(typeof F=="function"&&F!==t.entries)for(var W=F.call(t),N;!(N=W.next()).done;)Tt(N.value)&&Jt(N.value,f)}}}function br(t){{var f=t.type;if(f==null||typeof f=="string")return;var w;if(typeof f=="function")w=f.propTypes;else if(typeof f=="object"&&(f.$$typeof===i||f.$$typeof===b))w=f.propTypes;else return;if(w){var B=k(f);nt(w,t.props,"prop",B,t)}else if(f.PropTypes!==void 0&&!Pt){Pt=!0;var F=k(f);p("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?",F||"Unknown")}typeof f.getDefaultProps=="function"&&!f.getDefaultProps.isReactClassApproved&&p("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.")}}function vr(t){{for(var f=Object.keys(t.props),w=0;w<f.length;w++){var B=f[w];if(B!=="children"&&B!=="key"){ze(t),p("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.",B),ze(null);break}}t.ref!==null&&(ze(t),p("Invalid attribute `ref` supplied to `React.Fragment`."),ze(null))}}var Xt={};function er(t,f,w,B,F,W){{var N=L(t);if(!N){var A="";(t===void 0||typeof t=="object"&&t!==null&&Object.keys(t).length===0)&&(A+=" You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");var re=wr();re?A+=re:A+=Kt();var Y;t===null?Y="null":Qe(t)?Y="array":t!==void 0&&t.$$typeof===n?(Y="<"+(k(t.type)||"Unknown")+" />",A=" Did you accidentally export a JSX literal instead of a component?"):Y=typeof t,p("React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s",Y,A)}var G=_t(t,f,w,F,W);if(G==null)return G;if(N){var ie=f.children;if(ie!==void 0)if(B)if(Qe(ie)){for(var Ie=0;Ie<ie.length;Ie++)Zt(ie[Ie],t);Object.freeze&&Object.freeze(ie)}else p("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");else Zt(ie,t)}if(se.call(f,"key")){var Me=k(t),ae=Object.keys(f).filter(function(Dr){return Dr!=="key"}),Bt=ae.length>0?"{key: someKey, "+ae.join(": ..., ")+": ...}":"{key: someKey}";if(!Xt[Me+Bt]){var Rr=ae.length>0?"{"+ae.join(": ..., ")+": ...}":"{}";p(`A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`,Bt,Me,Rr,Me),Xt[Me+Bt]=!0}}return t===a?vr(G):br(G),G}}function Er(t,f,w){return er(t,f,w,!0)}function Sr(t,f,w){return er(t,f,w,!1)}var Cr=Sr,xr=Er;Oe.Fragment=a,Oe.jsx=Cr,Oe.jsxs=xr}()),Oe}process.env.NODE_ENV==="production"?pt.exports=rr():pt.exports=ar();var Q=pt.exports;let Ce=null,Lt=null,xe=new Map,nr=0,Ft=!1;const sr=()=>`
// 默认数据库和表名
const DEFAULT_DB_NAME = 'ImageOptimizeCache';
const DEFAULT_STORE_NAME_GENERAL = 'generalCache';
const DEFAULT_CACHE_EXPIRE_HOURS = 30 * 24;

// 数据库实例缓存
const dbCache = new Map();

const initDB = (dbName = DEFAULT_DB_NAME, version = 1, storeNames = []) => {
  return new Promise((resolve, reject) => {
    const cacheKey = \`\${dbName}_\${version}\`;
    if (dbCache.has(cacheKey)) {
      resolve(dbCache.get(cacheKey));
      return;
    }
    const request = indexedDB.open(dbName, version);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      dbCache.set(cacheKey, db);
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      storeNames.forEach(storeName => {
        if (!database.objectStoreNames.contains(storeName)) {
          const store = database.createObjectStore(storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('expireTime', 'expireTime', { unique: false });
        }
      });
      if (dbName === DEFAULT_DB_NAME) {
        if (!database.objectStoreNames.contains(DEFAULT_STORE_NAME_GENERAL)) {
          const generalStore = database.createObjectStore(DEFAULT_STORE_NAME_GENERAL, { keyPath: 'key' });
          generalStore.createIndex('timestamp', 'timestamp', { unique: false });
          generalStore.createIndex('expireTime', 'expireTime', { unique: false });
        }
      }
    };
  });
};

const ensureDBAndStore = async (dbName, storeName) => {
  let db;
  let currentVersion = 1;
  
  try {
    // 尝试获取现有数据库版本
    if (indexedDB.databases) {
      try {
        const databases = await indexedDB.databases();
        const existingDb = databases.find(d => d.name === dbName);
        if (existingDb) {
          currentVersion = existingDb.version;
        }
      } catch (error) {
        // indexedDB.databases() 可能不支持，使用默认版本
        currentVersion = 1;
      }
    }
    
    // 尝试打开现有数据库
    try {
      db = await initDB(dbName, currentVersion, []);
      
      // 如果表不存在，升级数据库版本并创建表
      if (!db.objectStoreNames.contains(storeName)) {
        db.close();
        dbCache.delete(\`\${dbName}_\${currentVersion}\`);
        const newVersion = currentVersion + 1;
        db = await initDB(dbName, newVersion, [storeName]);
      }
    } catch (error) {
      // 打开失败，可能是数据库不存在，创建新数据库
      db = await initDB(dbName, 1, [storeName]);
    }
  } catch (error) {
    // 所有尝试都失败，最后一次尝试创建新数据库
    try {
      db = await initDB(dbName, 1, [storeName]);
    } catch (finalError) {
      // 如果还是失败，抛出错误
      throw new Error(\`无法创建数据库 \${dbName}: \${finalError.message}\`);
    }
  }
  
  return db;
};

const handlers = {
  setCache: async (params) => {
    const { key, value, expireHours, dbName, storeName } = params;
    const database = await ensureDBAndStore(dbName, storeName);
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const now = Date.now();
    const expireTime = expireHours > 0 ? now + (expireHours * 60 * 60 * 1000) : null;
    const dataToStore = {
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
      timestamp: now,
      expireHours: expireHours,
      expireTime: expireTime,
    };
    const request = store.put(dataToStore);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => {
        const error = request.error;
        if (error && error.name === 'QuotaExceededError') {
          const quotaError = new Error('存储配额已满，无法保存缓存');
          quotaError.name = 'QuotaExceededError';
          reject(quotaError);
        } else {
          reject(error);
        }
      };
    });
  },
  getCache: async (params) => {
    const { key, dbName, storeName } = params;
    
    try {
      const database = await ensureDBAndStore(dbName, storeName);
      const transaction = database.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve(null);
            return;
          }
          
          const now = Date.now();
          if (result.expireTime && now > result.expireTime) {
            resolve(null);
            return;
          }
          
          try {
            const value = JSON.parse(result.value);
            resolve(value);
          } catch (error) {
            // JSON 解析失败，返回 null（数据可能损坏）
            resolve(null);
          }
        };
        request.onerror = () => {
          // 查询失败，返回 null 而不是抛出错误
          resolve(null);
        };
      });
    } catch (error) {
      // 数据库不存在或其他错误，返回 null 而不是抛出错误
      // 这样第一次打开项目时不会报错
      return null;
    }
  },
  deleteCache: async (params) => {
    const { key, dbName, storeName } = params;
    const database = await ensureDBAndStore(dbName, storeName);
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = key ? store.delete(key) : store.clear();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  cleanExpiredCache: async (params) => {
    const { dbName, storeName } = params;
    const database = await ensureDBAndStore(dbName, storeName);
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const index = store.index('expireTime');
    const now = Date.now();
    let deletedCount = 0;
    const range = IDBKeyRange.upperBound(now);
    const request = index.openCursor(range);
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
      request.onerror = () => reject(request.error);
    });
  },
  getCacheStats: async (params) => {
    const { dbName, storeName } = params;
    const database = await ensureDBAndStore(dbName, storeName);
    const transaction = database.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const items = request.result;
        const now = Date.now();
        let totalSize = 0;
        let expiredCount = 0;
        items.forEach(item => {
          if (item.value) {
            totalSize += item.value.length;
          }
          if (item.expireTime && now > item.expireTime) {
            expiredCount++;
          }
        });
        resolve({
          count: items.length,
          totalSize: totalSize,
          totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
          expiredCount: expiredCount,
        });
      };
      request.onerror = () => reject(request.error);
    });
  },
  getStoreNames: async (params) => {
    const { dbName } = params;
    try {
      const database = await initDB(dbName, 1, []);
      return Array.from(database.objectStoreNames);
    } catch (error) {
      return [];
    }
  },
  getAllDatabaseNames: async () => {
    if (indexedDB.databases) {
      try {
        const databases = await indexedDB.databases();
        return databases.map(db => db.name);
      } catch (error) {
        return [];
      }
    } else {
      return [DEFAULT_DB_NAME];
    }
  },
  getStorageQuota: async () => {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const quota = estimate.quota || 0;
        const usage = estimate.usage || 0;
        const usageDetails = estimate.usageDetails || {};
        const indexedDBUsage = usageDetails.indexedDB || 0;
        return {
          quota: quota,
          usage: usage,
          usageDetails: usageDetails,
          quotaMB: Math.round(quota / 1024 / 1024 * 100) / 100,
          usageMB: Math.round(usage / 1024 / 1024 * 100) / 100,
          availableMB: Math.round((quota - usage) / 1024 / 1024 * 100) / 100,
          usagePercent: quota > 0 ? Math.round((usage / quota) * 100 * 100) / 100 : 0,
          indexedDBUsage: indexedDBUsage,
          indexedDBUsageMB: Math.round(indexedDBUsage / 1024 / 1024 * 100) / 100,
        };
      } catch (error) {
        return {
          quota: 0, usage: 0, usageDetails: {}, quotaMB: 0, usageMB: 0,
          availableMB: 0, usagePercent: 0, indexedDBUsage: 0, indexedDBUsageMB: 0,
        };
      }
    } else {
      return {
        quota: 0, usage: 0, usageDetails: {}, quotaMB: 0, usageMB: 0,
        availableMB: 0, usagePercent: 0, indexedDBUsage: 0, indexedDBUsageMB: 0,
        unsupported: true,
      };
    }
  },
};

self.addEventListener('message', async (event) => {
  const { id, action, params } = event.data;
  try {
    const handler = handlers[action];
    if (!handler) {
      throw new Error(\`未知的操作: \${action}\`);
    }
    const result = await handler(params);
    self.postMessage({ id, success: true, result });
  } catch (error) {
    self.postMessage({
      id,
      success: false,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });
  }
});

self.postMessage({ type: 'ready' });
  `,or=()=>Ce||typeof Worker>"u"?Promise.resolve():new Promise((e,n)=>{try{const r=`
// IndexedDB Worker - 内联版本
${sr()}
        `,a=new Blob([r],{type:"application/javascript"});Lt=URL.createObjectURL(a),Ce=new Worker(Lt),Ce.onmessage=s=>{const{id:o,success:l,result:u,error:i,type:d}=s.data;if(d==="ready"){Ft=!0,e();return}const c=xe.get(o);if(c)if(xe.delete(o),l)c.resolve(u);else{const b=new Error(i.message);b.name=i.name,b.stack=i.stack,c.reject(b)}},Ce.onerror=s=>{console.error("❌ Worker 错误:",s),xe.forEach(o=>{o.reject(s)}),xe.clear(),n(s)},Ft&&e()}catch(r){console.error("❌ 初始化 Worker 失败:",r),n(r)}}),we=async(e,n={})=>{if(!ge())throw new Error("Worker 不支持，应该使用主线程实现");if(await or(),!Ce)throw new Error("Worker 初始化失败");return new Promise((r,a)=>{const s=++nr;xe.set(s,{resolve:r,reject:a});const o=[];n.imageData&&n.imageData instanceof ArrayBuffer?o.push(n.imageData):n.imageData&&n.imageData.buffer instanceof ArrayBuffer&&o.push(n.imageData.buffer),o.length>0?Ce.postMessage({id:s,action:e,params:n},o):Ce.postMessage({id:s,action:e,params:n}),setTimeout(()=>{xe.has(s)&&(xe.delete(s),a(new Error(`操作超时: ${e}`)))},3e4)})},ir=()=>typeof Worker<"u",ge=()=>ir()&&!0,wt="ImageOptimizeCache",qt="generalCache",Xe=new Map,Le=(e=wt,n=1,r=[])=>new Promise((a,s)=>{const o=`${e}_${n}`;if(Xe.has(o)){a(Xe.get(o));return}const l=indexedDB.open(e,n);l.onerror=()=>{s(l.error)},l.onsuccess=()=>{const u=l.result;Xe.set(o,u),a(u)},l.onupgradeneeded=u=>{const i=u.target.result;if(r.forEach(d=>{if(!i.objectStoreNames.contains(d)){const c=i.createObjectStore(d,{keyPath:"key"});c.createIndex("timestamp","timestamp",{unique:!1}),c.createIndex("expireTime","expireTime",{unique:!1})}}),e===wt&&!i.objectStoreNames.contains(qt)){const d=i.createObjectStore(qt,{keyPath:"key"});d.createIndex("timestamp","timestamp",{unique:!1}),d.createIndex("expireTime","expireTime",{unique:!1})}}}),Fe=async(e,n)=>{let r,a=1;try{if(indexedDB.databases)try{const o=(await indexedDB.databases()).find(l=>l.name===e);o&&(a=o.version)}catch{a=1}try{if(r=await Le(e,a,[]),!r.objectStoreNames.contains(n)){r.close(),Xe.delete(`${e}_${a}`);const s=a+1;r=await Le(e,s,[n])}}catch{r=await Le(e,1,[n])}}catch{try{r=await Le(e,1,[n])}catch(o){throw new Error(`无法创建数据库 ${e}: ${o.message}`)}}return r},Wt=async e=>{const{key:n,value:r,expireHours:a,dbName:s,storeName:o}=e;try{const i=(await Fe(s,o)).transaction([o],"readwrite").objectStore(o),d=Date.now(),c=a>0?d+a*60*60*1e3:null,b={key:n,value:typeof r=="string"?r:JSON.stringify(r),timestamp:d,expireHours:a,expireTime:c},g=i.put(b);return new Promise((h,y)=>{g.onsuccess=()=>h(),g.onerror=()=>{const m=g.error;if(m&&m.name==="QuotaExceededError"){const x=new Error("存储配额已满，无法保存缓存");x.name="QuotaExceededError",x.originalError=m,y(x)}else y(m)}})}catch(l){throw l}},cr=async e=>{const{key:n,dbName:r,storeName:a}=e;try{const u=(await Fe(r,a)).transaction([a],"readonly").objectStore(a).get(n);return new Promise((i,d)=>{u.onsuccess=()=>{const c=u.result;if(!c){i(null);return}const b=Date.now();if(c.expireTime&&b>c.expireTime){i(null);return}try{const g=JSON.parse(c.value);i(g)}catch{i(null)}},u.onerror=()=>{i(null)}})}catch{return null}},lr=async e=>{const{key:n,dbName:r,storeName:a}=e;try{const l=(await Fe(r,a)).transaction([a],"readwrite").objectStore(a),u=n?l.delete(n):l.clear();return new Promise((i,d)=>{u.onsuccess=()=>i(),u.onerror=()=>d(u.error)})}catch(s){throw s}},ur=async e=>{const{dbName:n,storeName:r}=e;try{const l=(await Fe(n,r)).transaction([r],"readwrite").objectStore(r).index("expireTime"),u=Date.now();let i=0;const d=IDBKeyRange.upperBound(u),c=l.openCursor(d);return new Promise((b,g)=>{c.onsuccess=h=>{const y=h.target.result;y?(y.delete(),i++,y.continue()):b(i)},c.onerror=()=>g(c.error)})}catch(a){throw a}},fr=async e=>{const{dbName:n,storeName:r}=e;try{const l=(await Fe(n,r)).transaction([r],"readonly").objectStore(r).getAll();return new Promise((u,i)=>{l.onsuccess=()=>{const d=l.result,c=Date.now();let b=0,g=0;d.forEach(h=>{h.value&&(b+=h.value.length),h.expireTime&&c>h.expireTime&&g++}),u({count:d.length,totalSize:b,totalSizeMB:Math.round(b/1024/1024*100)/100,expiredCount:g})},l.onerror=()=>i(l.error)})}catch(a){throw a}},dr=async e=>{const{dbName:n}=e;try{const r=await Le(n,1,[]);return Array.from(r.objectStoreNames)}catch{return[]}},gr=async()=>{if(indexedDB.databases)try{return(await indexedDB.databases()).map(n=>n.name)}catch{return[]}else return[wt]},mr=async()=>{if(navigator.storage&&navigator.storage.estimate)try{const e=await navigator.storage.estimate(),n=e.quota||0,r=e.usage||0,a=e.usageDetails||{},s=a.indexedDB||0;return{quota:n,usage:r,usageDetails:a,quotaMB:Math.round(n/1024/1024*100)/100,usageMB:Math.round(r/1024/1024*100)/100,availableMB:Math.round((n-r)/1024/1024*100)/100,usagePercent:n>0?Math.round(r/n*100*100)/100:0,indexedDBUsage:s,indexedDBUsageMB:Math.round(s/1024/1024*100)/100}}catch{return{quota:0,usage:0,usageDetails:{},quotaMB:0,usageMB:0,availableMB:0,usagePercent:0,indexedDBUsage:0,indexedDBUsageMB:0}}else return{quota:0,usage:0,usageDetails:{},quotaMB:0,usageMB:0,availableMB:0,usagePercent:0,indexedDBUsage:0,indexedDBUsageMB:0,unsupported:!0}},ce="ImageOptimizeCache",me="generalCache",qe=30*24,We=async(e,n,r=qe,a=ce,s=me,o={})=>{const{checkQuota:l=!1,autoCleanOnQuotaError:u=!1}=o;try{let i;try{i=JSON.stringify(n)}catch(c){throw new Error(`无法序列化值: ${c.message}`)}const d=new Blob([i]).size;if(l){const c=await et(d);if(!c.available)if(u){if(console.warn("⚠️ 存储配额不足，尝试清理过期缓存..."),await $e(a,s),!(await et(d)).available)throw new Error(`存储配额不足: ${c.message}`)}else throw new Error(`存储配额不足: ${c.message}`)}try{ge()?await we("setCache",{key:e,value:i,expireHours:r,dbName:a,storeName:s}):(console.log("Worker 不支持 降级到主线程"),await Wt({key:e,value:i,expireHours:r,dbName:a,storeName:s}))}catch(c){if(c&&c.name==="QuotaExceededError")if(u)try{console.warn("⚠️ 存储配额已满，尝试清理过期缓存后重试..."),await $e(a,s),ge()?await we("setCache",{key:e,value:i,expireHours:r,dbName:a,storeName:s}):await Wt({key:e,value:i,expireHours:r,dbName:a,storeName:s})}catch(b){const g=new Error("存储配额已满，即使清理过期缓存后仍无法保存");throw g.name="QuotaExceededError",g.originalError=b,g}else{const b=new Error("存储配额已满，无法保存缓存。建议清理过期缓存或删除不需要的数据");throw b.name="QuotaExceededError",b.originalError=c,b.suggestion="可以调用 cleanExpiredCache() 清理过期缓存，或使用 deleteCache() 删除不需要的数据",b}else throw c}}catch(i){if(i&&(i.name==="QuotaExceededError"||i.message.includes("配额"))){const d=new Error(i.message||"存储配额已满，无法保存缓存");throw d.name="QuotaExceededError",d.originalError=i,d.suggestion="可以调用 cleanExpiredCache() 清理过期缓存，或使用 deleteCache() 删除不需要的数据",console.error("❌ 存储配额已满:",d),d}throw console.error("❌ 设置缓存失败:",i),i}},Ve=async(e,n=ce,r=me)=>{try{let a;return ge()?a=await we("getCache",{key:e,dbName:n,storeName:r}):a=await cr({key:e,dbName:n,storeName:r}),a===null&&je(e,n,r).catch(()=>{}),a}catch(a){return console.error("❌ 获取缓存失败:",a),null}},je=async(e=null,n=ce,r=me)=>{try{ge()?await we("deleteCache",{key:e,dbName:n,storeName:r}):await lr({key:e,dbName:n,storeName:r})}catch(a){throw console.error("❌ 删除缓存失败:",a),a}},$e=async(e=ce,n=me)=>{try{return ge()?await we("cleanExpiredCache",{dbName:e,storeName:n}):await ur({dbName:e,storeName:n})}catch(r){return console.error("❌ 清理过期缓存失败:",r),0}},yt=async(e=ce,n=me)=>{try{return ge()?await we("getCacheStats",{dbName:e,storeName:n}):await fr({dbName:e,storeName:n})}catch(r){return console.error("❌ 获取缓存统计失败:",r),{count:0,totalSize:0,totalSizeMB:0,expiredCount:0}}},Vt=async(e,n=ce,r=me)=>await Ve(e,n,r)!==null,bt=async(e=ce)=>{try{return ge()?await we("getStoreNames",{dbName:e}):await dr({dbName:e})}catch(n){return console.error("❌ 获取表名失败:",n),[]}},$t=async e=>new Promise((n,r)=>{const a=indexedDB.deleteDatabase(e);a.onsuccess=()=>{n()},a.onerror=()=>{r(a.error)}}),vt=async()=>{try{return ge()?await we("getAllDatabaseNames",{}):await gr()}catch(e){return console.error("❌ 获取数据库列表失败:",e),[]}},et=async(e=0)=>{try{const n=await Et(),r=n.quota-n.usage-e>0,a=n.availableMB-e/1024/1024;return{available:r,quota:n.quota,usage:n.usage,availableMB:Math.max(0,Math.round(a*100)/100),requiredMB:Math.round(e/1024/1024*100)/100,usagePercent:n.usagePercent,message:r?`存储空间充足，可用 ${Math.round(a*100)/100} MB`:`存储空间不足，需要 ${Math.round(e/1024/1024*100)/100} MB，但只有 ${n.availableMB} MB 可用`}}catch(n){return console.error("❌ 检查存储配额失败:",n),{available:!1,quota:0,usage:0,availableMB:0,requiredMB:Math.round(e/1024/1024*100)/100,usagePercent:0,message:"无法检查存储配额",error:n}}},Et=async()=>{try{return ge()?await we("getStorageQuota",{}):await mr()}catch(e){return console.error("❌ 获取存储配额失败:",e),{quota:0,usage:0,usageDetails:{},quotaMB:0,usageMB:0,availableMB:0,usagePercent:0,indexedDBUsage:0,indexedDBUsageMB:0}}},Ht=async()=>{try{const e=await vt(),n=[];for(const r of e)try{const a=await bt(r),s=[];for(const u of a){const i=await yt(r,u);s.push({storeName:u,count:i.count,size:i.totalSize,sizeMB:i.totalSizeMB})}const o=s.reduce((u,i)=>u+i.size,0),l=Math.round(o/1024/1024*100)/100;n.push({dbName:r,stores:s,totalSize:o,totalSizeMB:l})}catch(a){console.error(`❌ 获取数据库 ${r} 使用情况失败:`,a)}return n}catch(e){return console.error("❌ 获取所有数据库使用情况失败:",e),[]}},tt=(e,n)=>{try{const r=new Blob([e],{type:n});return URL.createObjectURL(r)}catch(r){return console.error("❌ 创建 Blob URL 失败:",r),null}},St=async(e,n=ce,r=me,a=qe)=>{try{try{await $e(n,r)}catch(g){console.warn("⚠️ 清理过期缓存失败:",g.message)}const s=`image:${e}`,o=await Ve(s,n,r);if(o&&o.data&&o.mimeType)try{const g=o.data.split(",")[1]||o.data;if(!g||g.length===0)throw new Error("缓存数据为空");const h=atob(g),y=new Uint8Array(h.length);for(let x=0;x<h.length;x++)y[x]=h.charCodeAt(x);const m=tt(y,o.mimeType);if(m)return m}catch(g){console.warn("⚠️ 缓存数据损坏，删除缓存:",g.message),await je(s,n,r).catch(()=>{})}const l=await fetch(e);if(!l.ok)throw new Error(`HTTP ${l.status}: ${l.statusText}`);const u=await l.arrayBuffer(),i=new Uint8Array(u),d=l.headers.get("Content-Type")||"image/jpeg";let c;try{const g=[];for(let x=0;x<i.length;x+=8192){const E=i.slice(x,x+8192),p=String.fromCharCode.apply(null,Array.from(E));g.push(p)}const y=g.join(""),m=btoa(y);c=`data:${d};base64,${m}`}catch(g){console.warn("⚠️ 图片数据编码失败，跳过缓存保存:",g.message),c=null}if(c)try{await We(s,{data:c,mimeType:d},a,n,r)}catch(g){console.warn("⚠️ 保存缓存失败:",g.message)}return tt(i,d)}catch(s){console.error("❌ 加载图片失败:",s);const o=`image:${e}`;throw await je(o,n,r),s}},rt=async(e,n={})=>{const{loadImageProgressive:r,optimizeImageUrl:a}=await Promise.resolve().then(()=>tr),{stages:s=[{width:20,quality:20,blur:10},{width:400,quality:50,blur:3},{width:null,quality:80,blur:0}],timeout:o=3e4,enableCache:l=!0,urlTransformer:u=null,onStageComplete:i=null,onComplete:d=null,onError:c=null,onStageError:b=null,dbName:g=ce,storeName:h=me,expireHours:y=qe}=n;if(!e){const m=new Error("图片URL为空");return c&&c(m,-1),{url:"",stages:[],success:!1,error:m,fromCache:!1}}try{if(!l)return{...await r(e,{stages:s,timeout:o,urlTransformer:u,onStageError:b,onStageComplete:i,onComplete:d,onError:c}),fromCache:!1};const m=s[s.length-1];let x=e;u&&typeof u=="function"?x=u(e,m,s.length-1):m&&(m.width||m.height)&&(x=a(e,{width:m.width||null,height:m.height||null,quality:m.quality||80,format:m.format||null,autoFormat:m.autoFormat!==!1}));const E=`image:${x}`,p=await Ve(E,g,h);if(p&&p.data&&p.mimeType)try{const C=p.data.split(",")[1]||p.data;if(!C||C.length===0)throw new Error("缓存数据为空");const R=atob(C),I=new Uint8Array(R.length);for(let S=0;S<R.length;S++)I[S]=R.charCodeAt(S);const v=tt(I,p.mimeType);if(v)return d&&d(v),i&&s.forEach((S,_)=>{_===s.length-1&&i(_,v,S)}),{url:v,stages:s.map((S,_)=>({url:_===s.length-1?v:"",stage:S,loaded:_===s.length-1})),success:!0,error:null,fromCache:!0}}catch(C){console.warn("⚠️ 缓存数据损坏，删除缓存:",C.message),await je(E,g,h).catch(()=>{})}return{...await r(e,{stages:s,timeout:o,urlTransformer:u,onStageError:b,onStageComplete:i,onComplete:async C=>{if(!C.startsWith("blob:"))try{const R=await fetch(C);if(R.ok){const I=await R.arrayBuffer(),v=new Uint8Array(I),S=R.headers.get("Content-Type")||"image/jpeg";try{const _=[];for(let H=0;H<v.length;H+=8192){const X=v.slice(H,H+8192),$=String.fromCharCode.apply(null,Array.from(X));_.push($)}const T=_.join(""),D=btoa(T),k=`data:${S};base64,${D}`;await We(E,{data:k,mimeType:S},y,g,h),console.log(`[渐进式加载缓存] 已保存到缓存: ${E.substring(0,50)}...`)}catch(_){console.warn("[渐进式加载缓存] 保存缓存失败:",_.message||_)}}}catch(R){console.warn("[渐进式加载缓存] 保存缓存失败:",R.message||R)}d&&d(C)},onError:c}),fromCache:!1}}catch(m){const x=m.message&&m.message.includes("404");return(!x||process.env.NODE_ENV==="development")&&(x||console.error("❌ 渐进式加载图片失败:",m.message||m)),c&&c(m,-1),{url:"",stages:[],success:!1,error:m,fromCache:!1}}},hr=Object.freeze(Object.defineProperty({__proto__:null,DEFAULT_CACHE_EXPIRE_HOURS:qe,DEFAULT_DB_NAME:ce,DEFAULT_STORE_NAME_GENERAL:me,checkStorageQuota:et,cleanExpiredCache:$e,createBlobUrlFromCache:tt,deleteCache:je,deleteDatabase:$t,getAllDatabaseNames:vt,getAllDatabasesUsage:Ht,getCache:Ve,getCacheStats:yt,getStorageQuota:Et,getStoreNames:bt,hasCache:Vt,loadImageProgressiveWithCache:rt,loadImageWithCache:St,setCache:We},Symbol.toStringTag,{value:"Module"}));function Qt({src:e="",alt:n="",width:r="100%",height:a="auto",className:s="",imageClassName:o="",dataId:l=null,imageStyle:u={},immediate:i=!1,rootMargin:d="50px",optimize:c={width:240,height:320,quality:30},enableBrowserCompression:b=!0,showPlaceholderIcon:g=!1,showErrorMessage:h=!1,errorSrc:y=null,progressive:m=!1,progressiveStages:x=[{width:20,quality:20,blur:10},{width:400,quality:50,blur:3},{width:null,quality:80,blur:0}],progressiveTransitionDuration:E=300,progressiveTimeout:p=3e4,progressiveEnableCache:z=!0,onLoad:C=null,onOptimization:R=null,onError:I=null,onClick:v=null,onProgressiveStageComplete:S=null}){const _=U.useRef(null),L=U.useRef(null),T=U.useRef(null),D=U.useRef(null),[k,H]=U.useState(!1),[X,$]=U.useState(!1),[V,K]=U.useState(!1),[J,ee]=U.useState(i),[le,Re]=U.useState(""),[ve,at]=U.useState(null),[De,Ee]=U.useState(!1),[ne,_e]=U.useState(null),ue=U.useRef(null),[ye,Pe]=U.useState(-1),[he,Te]=U.useState(""),te=U.useRef(null),fe=U.useRef(-1),se=U.useRef(!1),He=U.useRef(null),Be=O=>{if(!O)return"";try{if(c&&Object.keys(c).length>0){const M=be(O,c);if(M&&M.trim())return M}return O}catch(M){return console.warn("图片URL优化失败，使用原始URL:",M),O}},pe=U.useMemo(()=>e?m&&he?he:ve||ne||(k&&le?le:Be(e)):"",[e,k,le,c,ve,ne,m,he]),nt=()=>{if(i||typeof window>"u"||!window.IntersectionObserver){ee(!0);return}T.current&&(T.current.disconnect(),T.current=null),T.current=new IntersectionObserver(O=>{O.forEach(M=>{M.isIntersecting&&(ee(!0),T.current&&M.target&&T.current.unobserve(M.target))})},{rootMargin:d,threshold:.01}),setTimeout(()=>{L.current&&T.current&&T.current.observe(L.current)},0)},Ct=async O=>{if(m){const j=fe.current;if(j>=0&&j<x.length)return}if(k)return;const M=O.target.src;if(H(!0),$(!1),K(!1),Re(M),!M.startsWith("blob:")&&!M.startsWith("data:"))try{const j=Be(e),Z=await fetch(j);if(Z.ok){const Ye=await Z.arrayBuffer(),Ue=new Uint8Array(Ye),ot=Z.headers.get("Content-Type")||"image/jpeg",Rt=String.fromCharCode.apply(null,Array.from(Ue)),Dt=btoa(Rt),_t=`data:${ot};base64,${Dt}`,Ke=`image:${j}`;await We(Ke,{data:_t,mimeType:ot})}}catch(j){console.warn("保存图片缓存失败:",j)}let q=null;if(e&&M!==e)try{const j=await ht(e,M);j.originalSize!==null&&j.optimizedSize!==null?(q={originalUrl:j.originalUrl,originalSize:j.originalSize,originalSizeFormatted:j.originalSizeFormatted,optimizedUrl:j.optimizedUrl,optimizedSize:j.optimizedSize,optimizedSizeFormatted:j.optimizedSizeFormatted,savedSize:j.savedSize,savedSizeFormatted:j.savedSizeFormatted,savedPercentage:j.savedPercentage,cdn:j.cdn,isOptimizationEffective:j.isOptimizationEffective,warningMessage:j.warningMessage},D.current=q,R&&R(q),j.cdn,j.warningMessage&&console.warn(j.warningMessage),j.isOptimizationEffective):(q={originalUrl:e,optimizedUrl:M,originalSize:null,originalSizeFormatted:null,optimizedSize:null,optimizedSizeFormatted:null,savedSize:null,savedSizeFormatted:null,savedPercentage:null,cdn:Se(e),isOptimizationEffective:null,warningMessage:"⚠️ 无法获取图片大小（可能由于CORS限制）"},D.current=q,R&&R(q))}catch(j){console.warn("获取图片大小对比失败:",j),q={originalUrl:e,optimizedUrl:M,originalSize:null,originalSizeFormatted:null,optimizedSize:null,optimizedSizeFormatted:null,savedSize:null,savedSizeFormatted:null,savedPercentage:null,cdn:Se(e),isOptimizationEffective:null,warningMessage:`获取图片大小对比失败: ${j.message}`},D.current=q,R&&R(q)}C&&C(O,q)},Qe=O=>{if(k)return;const M=O.target.src,q=Be(e);if(y&&(M===y||M.includes("videoCover.png"))){K(!0),$(!1),I&&I(O);return}if(M===q&&q!==e){O.target.src=e;return}if(M===e||q===e){if(y&&M!==y){O.target.src=y;return}K(!0),$(!1),I&&I(O)}},xt=O=>{var M;if(v){const q={src:e,currentSrc:((M=O.target)==null?void 0:M.src)||pe,optimizedSrc:pe,alt:n,dataId:l,isLoaded:k,isLoading:X,hasError:V,isCompressing:De,optimizationInfo:D.current,imageElement:O.target};v(O,q)}};U.useEffect(()=>{He.current=x},[x]);const de=U.useRef(!1),oe=U.useRef(null);U.useEffect(()=>{if(!m){de.current=!1,oe.current=null;return}if(oe.current!==e&&(de.current=!1,oe.current=e),de.current||!e||!J)return;de.current=!0,se.current=!0,$(!0);let O=!1;const M=e,q=He.current||x;return te.current=()=>{O=!0,se.current=!1,de.current=!1},rt(M,{stages:q,timeout:p,enableCache:z,onStageComplete:(j,Z,Ye)=>{if(O||oe.current!==M)return;const Ue=j+1;requestAnimationFrame(()=>{!O&&oe.current===M&&(Pe(Ue),fe.current=Ue,Te(Z),S&&S(j,Z,Ye))})},onComplete:j=>{O||oe.current!==M||requestAnimationFrame(()=>{if(!O&&oe.current===M){$(!1),Te(j),se.current=!1;const Z=q.length;Pe(Z),fe.current=Z}})},onError:(j,Z)=>{O||oe.current!==M||(console.warn(`[渐进式加载 ${M.substring(0,20)}...] 阶段 ${Z+1} 失败:`,j.message||j),$(!1),se.current=!1,de.current=!1,Te(""),Pe(-1),fe.current=-1,$(!0))}}).catch(j=>{!O&&oe.current===M&&(console.error(`[渐进式加载 ${M.substring(0,20)}...] 加载过程出错:`,j),$(!1),se.current=!1,de.current=!1,Te(""),Pe(-1),fe.current=-1)}),()=>{O=!0,se.current=!1,de.current=!1}},[m,J,e,p,z]),U.useEffect(()=>{m||!m&&J&&!k&&!V&&!X&&!De&&!ne&&!he&&e&&(async()=>{try{const M=Be(e),q=await St(M);if(q)return _e(q),ue.current=q,!0}catch{}return!1})().then(M=>{if(!M){const q=Se(e);b&&!q&&c&&Object.keys(c).length>0&&typeof window<"u"&&!ve?(Ee(!0),gt(e,{maxWidth:c.width||null,maxHeight:c.height||null,quality:c.quality?c.quality/100:.8,compressionLevel:c.compressionLevel!==void 0?c.compressionLevel:0,blur:c.blur!==void 0?c.blur:0,smooth:c.smooth!==void 0?c.smooth:!0,format:c.format||null}).then(Z=>{at(Z),Ee(!1),mt(Z)}).catch(Z=>{console.warn("浏览器端压缩失败，使用原始URL:",Z),Ee(!1)})):$(!0)}})},[J,k,V,X,De,e,c,ve,ne,b]),U.useEffect(()=>{ue.current&&(URL.revokeObjectURL(ue.current),ue.current=null),te.current&&(te.current(),te.current=null),H(!1),K(!1),$(!1),Re(""),at(null),Ee(!1),_e(null),te.current&&(te.current(),te.current=null),te.current&&(te.current(),te.current=null),Te(""),Pe(-1),fe.current=-1,se.current=!1,de.current=!1,oe.current=null,D.current=null,i?ee(!0):nt()},[e]),U.useEffect(()=>(i?ee(!0):nt(),()=>{T.current&&(T.current.disconnect(),T.current=null),ue.current&&(URL.revokeObjectURL(ue.current),ue.current=null),te.current&&(te.current(),te.current=null)}),[]);const st={width:typeof r=="number"?`${r}px`:r,height:typeof a=="number"?`${a}px`:a};return Q.jsxs("div",{ref:L,className:`image-optimize-container ${s}`.trim(),style:st,children:[!k&&!V&&!X&&!ne&&!he&&Q.jsx("div",{className:"image-optimize-placeholder",children:g&&Q.jsx("svg",{className:"image-optimize-placeholder-icon",width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:Q.jsx("path",{d:"M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM13.96 12.29L11.21 15.83L9.25 13.47L6.5 17H17.5L13.96 12.29Z",fill:"currentColor"})})}),(X||De)&&!V&&!ne&&!he&&Q.jsxs("div",{className:"image-optimize-loading",children:[Q.jsx("svg",{className:"image-optimize-loading-icon",width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:Q.jsx("circle",{cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"2",fill:"none",strokeDasharray:"62.83",strokeDashoffset:"31.42"})}),De&&Q.jsx("span",{style:{marginTop:"8px",fontSize:"12px",color:"#666"},children:"正在压缩图片..."})]}),J&&pe&&Q.jsx("img",{ref:_,src:pe,alt:n,"data-id":l,className:`image-optimize-image ${o}`.trim(),style:{display:k||ne||he||!V&&pe?"block":"none",transition:m?`opacity ${E}ms ease-in-out, filter ${E}ms ease-in-out`:void 0,opacity:m&&ye>=0||k||ne?1:0,filter:m?ye===1?"blur(10px)":ye===2?"blur(3px)":ye>=3?"blur(0px)":"blur(10px)":void 0,...u},onLoad:Ct,onError:Qe,onClick:xt}),V&&Q.jsxs("div",{className:"image-optimize-error",children:[Q.jsx("svg",{className:"image-optimize-error-icon",width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:Q.jsx("path",{d:"M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z",fill:"currentColor"})}),h&&Q.jsx("span",{className:"image-optimize-error-text",children:"加载失败"})]})]})}function pr({src:e="",alt:n="",width:r="100%",height:a="auto",className:s="",imageClassName:o="",imageStyle:l={},stages:u=[{width:20,quality:20},{width:400,quality:50},{width:null,quality:80}],transitionDuration:i=300,timeout:d=3e4,enableCache:c=!0,showPlaceholder:b=!0,onStageComplete:g=null,onComplete:h=null,onError:y=null,onLoad:m=null}){const[x,E]=U.useState(-1),[p,z]=U.useState(""),[C,R]=U.useState(!1),[I,v]=U.useState(!1),[S,_]=U.useState(""),[L,T]=U.useState(!1),D=U.useRef(null),k=U.useRef(null);U.useEffect(()=>{var K,J;if(!e)return;const $=ft(e,{width:((K=u[0])==null?void 0:K.width)||20,quality:((J=u[0])==null?void 0:J.quality)||20});z($),E(0),R(!0),v(!1),_(""),T(!1);let V=!1;return rt(e,{stages:u,timeout:d,enableCache:c,onStageComplete:(ee,le,Re)=>{V||(E(ee+1),z(le),g&&g(ee,le,Re))},onComplete:ee=>{V||(R(!1),T(!0),z(ee),h&&h(ee))},onError:(ee,le)=>{V||(R(!1),v(!0),_(ee.message),y&&y(ee,le))}}),()=>{V=!0}},[e,c]);const H={width:typeof r=="number"?`${r}px`:r,height:typeof a=="number"?`${a}px`:a,position:"relative",overflow:"hidden"},X={width:"100%",height:"100%",objectFit:"cover",transition:`opacity ${i}ms ease-in-out, filter ${i}ms ease-in-out`,opacity:x>=0?1:0,filter:x===0?"blur(10px)":x===1?"blur(3px)":"blur(0px)",...l};return Q.jsxs("div",{ref:D,className:`progressive-image-container ${s}`.trim(),style:H,children:[b&&x<0&&!I&&Q.jsx("div",{className:"image-optimize-placeholder",style:{position:"absolute",top:0,left:0,width:"100%",height:"100%"},children:Q.jsx("svg",{className:"image-optimize-placeholder-icon",width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:Q.jsx("path",{d:"M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM13.96 12.29L11.21 15.83L9.25 13.47L6.5 17H17.5L13.96 12.29Z",fill:"currentColor"})})}),p&&Q.jsx("img",{ref:k,src:p,alt:n,className:`progressive-image ${o}`.trim(),style:X,onLoad:$=>{L&&m&&m($)},onError:$=>{I||(v(!0),_("图片加载失败"),y&&y(new Error("图片加载失败"),x))}}),I&&Q.jsxs("div",{style:{position:"absolute",top:0,left:0,width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",backgroundColor:"#f5f5f5",color:"#999",fontSize:"14px"},children:[Q.jsx("div",{style:{fontSize:"24px",marginBottom:"8px"},children:"❌"}),Q.jsx("div",{children:S||"加载失败"})]}),C&&!I&&x<u.length&&Q.jsxs("div",{style:{position:"absolute",bottom:"10px",right:"10px",backgroundColor:"rgba(0, 0, 0, 0.6)",color:"white",padding:"4px 8px",borderRadius:"4px",fontSize:"12px"},children:["阶段 ",x+1," / ",u.length]})]})}P.DEFAULT_CACHE_EXPIRE_HOURS=qe,P.DEFAULT_DB_NAME=ce,P.DEFAULT_STORE_NAME_GENERAL=me,P.LazyImage=Qt,P.ProgressiveImage=pr,P.checkStorageQuota=et,P.cleanExpiredCache=$e,P.compareImageSizes=ht,P.compressImageInBrowser=gt,P.dataURLToBlob=mt,P.default=Qt,P.deleteCache=je,P.deleteDatabase=$t,P.detectCDN=Se,P.detectImageFormat=it,P.detectSupportedFormats=ke,P.formatFileSize=Ae,P.generateBlurPlaceholderUrl=ft,P.generateResponsiveImage=jt,P.generateSizes=Je,P.generateSrcset=ct,P.getAllDatabaseNames=vt,P.getAllDatabasesUsage=Ht,P.getBestFormat=Ge,P.getCache=Ve,P.getCacheStats=yt,P.getImageSize=Ze,P.getOptimizedCoverUrl=Ut,P.getStorageQuota=Et,P.getStoreNames=bt,P.hasCache=Vt,P.loadImageProgressive=dt,P.loadImageProgressiveWithCache=rt,P.loadImageWithCache=St,P.loadImagesBatch=It,P.loadImagesProgressiveBatch=kt,P.loadImagesProgressively=ut,P.optimizeImageUrl=be,P.preloadImage=lt,P.preloadImages=zt,P.setCache=We,Object.defineProperties(P,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}})});
