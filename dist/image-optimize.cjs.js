"use strict";Object.defineProperties(exports,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}});const U=require("react");function Fe(){const e=[];if(typeof window<"u"&&typeof document<"u"){const r=(()=>{try{const s=document.createElement("canvas");return s.width=1,s.height=1,s.toDataURL("image/webp").indexOf("data:image/webp")===0}catch{return!1}})();(()=>{try{const s=document.createElement("canvas");return s.width=1,s.height=1,s.toDataURL("image/avif").indexOf("data:image/avif")===0}catch{return!1}})()&&e.push("avif"),r&&e.push("webp")}return e.push("jpg","jpeg","png"),e}function et(e=null){const n=Fe();if(e){const r=e.toLowerCase().replace("jpeg","jpg");if(n.includes(r))return r}return n[0]||"jpg"}function pt(e){if(!e)return null;const r=e.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)(\?|$)/i);if(r){const a=r[1].toLowerCase();return a==="jpeg"?"jpg":a}try{const a=new URL(e),s=a.searchParams.get("format")||a.searchParams.get("f")||a.searchParams.get("image_format");if(s)return s.toLowerCase().replace("jpeg","jpg")}catch{}return null}const Wt={aliyun:{test:e=>e.includes("aliyuncs.com")||e.includes("oss-"),process:(e,n)=>{const{width:r,height:a,quality:s,format:o}=n,l=[];return(r||a)&&l.push(`resize,w_${r||""},h_${a||""},m_lfit`),s&&l.push(`quality,q_${s}`),o&&l.push(`format,${o}`),l.length>0&&e.searchParams.set("x-oss-process",l.join("/")),e.toString()}},tencent:{test:e=>e.includes("qcloud.com")||e.includes("myqcloud.com"),process:(e,n)=>{const{width:r,height:a,quality:s,format:o}=n,l=[];if((r||a)&&l.push(`imageMogr2/thumbnail/${r}x${a}`),s&&l.push(`quality/${s}`),o&&l.push(`format/${o}`),l.length>0){const u=l.join("|"),i=e.search?"|":"?imageMogr2/";return`${e.toString()}${i}${u}`}return e.toString()}},qiniu:{test:e=>e.includes("qiniucdn.com")||e.includes("qiniu.com"),process:(e,n)=>{const{width:r,height:a,quality:s,format:o}=n,l=[];if((r||a)&&l.push(`imageView2/1/w/${r||""}/h/${a||""}`),s&&l.push(`quality/${s}`),o&&l.push(`format/${o}`),l.length>0){const u=l.join("|"),i=e.search?"|":"?";return`${e.toString()}${i}${u}`}return e.toString()}},upyun:{test:e=>e.includes("upaiyun.com")||e.includes("upyun.com"),process:(e,n)=>{const{width:r,height:a,quality:s,format:o}=n,l=[];if((r||a)&&l.push(`${r||""}x${a||""}`),s&&l.push(`quality/${s}`),o&&l.push(`format/${o}`),l.length>0){const u=e.pathname.split("/"),i=u[u.length-1],d=u.slice(0,-1).join("/")+"/!"+l.join("/")+"/"+i;e.pathname=d}return e.toString()}},cloudfront:{test:e=>e.includes("cloudfront.net")||e.includes(".aws"),process:(e,n)=>{const{width:r,height:a,quality:s,format:o}=n;return r&&e.searchParams.set("w",r),a&&e.searchParams.set("h",a),s&&e.searchParams.set("q",s),o&&e.searchParams.set("f",o),e.toString()}}};function ve(e,n={}){if(!e)return e;const{width:r=null,height:a=null,quality:s=30,format:o=null,autoFormat:l=!0}=n;try{let u;try{u=new URL(e)}catch{if(e.startsWith("/")){const b=typeof window<"u"&&window.location?window.location.origin:"https://example.com";u=new URL(e,b)}else return console.warn("无法解析的图片URL，跳过优化:",e),e}let i=o;l&&!o?i=et():o&&(i=et(o));for(const[c,b]of Object.entries(Wt))if(b.test(e))return b.process(u,{width:r,height:a,quality:s,format:i});return r&&u.searchParams.set("w",r),a&&u.searchParams.set("h",a),s&&u.searchParams.set("q",s),i&&u.searchParams.set("f",i),u.toString()}catch(u){return console.warn("图片URL优化失败:",u),e}}function wt(e,n={}){if(!e)return"";const{widths:r=null,aspectRatio:a=null,quality:s=80,format:o=null,autoFormat:l=!0}=n;return(r||[320,640,960,1280,1920]).map(c=>`${ve(e,{width:c,height:a?Math.round(c/a):null,quality:s,format:o,autoFormat:l})} ${c}w`).join(", ")}function tt(e={}){const{breakpoints:n=["(max-width: 640px) 100vw","(max-width: 1024px) 50vw","33vw"]}=e;return Array.isArray(n)?n.join(", "):n}function Vt(e,n={}){if(!e)return{src:"",srcset:"",sizes:""};const{widths:r=null,aspectRatio:a=null,quality:s=80,format:o=null,autoFormat:l=!0,sizes:u=null,fallbackWidth:i=960}=n,d=wt(e,{widths:r,aspectRatio:a,quality:s,format:o,autoFormat:l}),c=u?typeof u=="string"?u:tt(u):tt();return{src:ve(e,{width:i,height:a?Math.round(i/a):null,quality:s,format:o,autoFormat:l}),srcset:d,sizes:c}}function Ht(e){return ve(e,{width:240,height:320,quality:75})}function yt(e){return new Promise(n=>{if(!e){n(!1);return}const r=new Image;r.onload=()=>n(!0),r.onerror=()=>n(!1),r.src=e})}async function Qt(e,n=3){const r=[],a=[...e],s=async()=>{for(;a.length>0;){const l=a.shift(),u=await yt(l);r.push({url:l,success:u})}},o=Array(Math.min(n,e.length)).fill(null).map(()=>s());return await Promise.all(o),r}async function bt(e,n={}){const{concurrency:r=10,timeout:a=3e4,priority:s=!0,stages:o=null,enableCache:l=!0,urlTransformer:u=null,onStageError:i=null,onProgress:d=null,onItemComplete:c=null,onItemStageComplete:b=null,retryOnError:g=!1,maxRetries:h=1}=n,y=e.map((v,S)=>typeof v=="string"?{url:v,priority:0,index:S}:{url:v.url||v.src||"",priority:v.priority||0,index:v.index!==void 0?v.index:S});s&&y.sort((v,S)=>S.priority-v.priority);const m=new Array(y.length);let C=0;const E=y.length,p=async(v,S=0)=>{const{url:_,index:N}=v;if(!_){const D={url:"",success:!1,error:new Error("图片URL为空"),index:N,retries:S};return m[N]=D,C++,d&&d(C,E,D),c&&c(D),D}if(o&&Array.isArray(o)&&o.length>0){const{loadImageProgressiveWithCache:P}=await Promise.resolve().then(()=>Cr);return P(_,{stages:o,timeout:a,enableCache:l,urlTransformer:u,onStageError:i,onStageComplete:(D,z,V)=>{b&&b({url:_,index:N,stageIndex:D,stageUrl:z,stage:V,currentStage:D+1,totalStages:o.length},D)},onComplete:D=>{},onError:(D,z)=>{}}).then(D=>{const z={url:D.url,success:D.success,error:D.error,index:N,retries:S,stages:D.stages,fromCache:D.fromCache||!1};return m[N]=z,C++,d&&d(C,E,z),c&&c(z),z})}return new Promise(P=>{const D=new Image;let z=!1,V=null;const Z=()=>{V&&(clearTimeout(V),V=null),D.onload=null,D.onerror=null,D.src=""},W=(F,Y=null)=>{if(z)return null;z=!0,Z();const G={url:_,success:F,error:Y,index:N,retries:S};return m[N]=G,C++,d&&d(C,E,G),c&&c(G),G};V=setTimeout(()=>{const F=new Error(`图片加载超时 (${a}ms)`),Y=W(!1,F);g&&S<h?setTimeout(()=>{p(v,S+1).then(P)},1e3*(S+1)):P(Y)},a),D.onload=()=>{const F=W(!0,null);F&&P(F)},D.onerror=F=>{const Y=new Error("图片加载失败");Y.originalEvent=F;const G=W(!1,Y);g&&S<h?setTimeout(()=>{p(v,S+1).then(P)},1e3*(S+1)):P(G)};try{D.crossOrigin="anonymous",D.src=_}catch(F){const Y=W(!1,F);Y&&P(Y)}})},j=[...y],x=new Set,R=[];return await(async()=>{for(;j.length>0||x.size>0;){for(;j.length>0&&x.size<r;){const v=j.shift(),S=p(v).then(_=>(x.delete(S),_)).catch(_=>{x.delete(S);const N={url:v.url,success:!1,error:_ instanceof Error?_:new Error(String(_)),index:v.index,retries:0};return m[v.index]=N,C++,d&&d(C,E,N),c&&c(N),N});x.add(S),R.push(S)}x.size>0&&await Promise.race(Array.from(x))}})(),await Promise.all(R),m}async function Yt(e,n={}){return bt(e,{priority:!1,...n})}function vt(e,n={}){if(!e)return e;const{width:r=20,height:a=null,quality:s=20,blur:o=10}=n;return ve(e,{width:r,height:a,quality:s,format:"jpg"})}async function Et(e,n={}){var b;const{stages:r=[{width:20,quality:20,blur:10},{width:400,quality:50,blur:3},{width:null,quality:80,blur:0}],timeout:a=3e4,urlTransformer:s=null,onStageComplete:o=null,onStageError:l=null,onComplete:u=null,onError:i=null}=n;if(!e){const g=new Error("图片URL为空");return i&&i(g,-1),{url:"",stages:[],success:!1,error:g}}const d=[];let c=e;try{for(let h=0;h<r.length;h++){const y=r[h];let m;s&&typeof s=="function"?m=s(e,y,h):h===r.length-1&&!y.width&&!y.height?m=e:m=ve(e,{width:y.width||null,height:y.height||null,quality:y.quality||80,format:y.format||null,autoFormat:y.autoFormat!==!1});let C;try{C=await new Promise((E,p)=>{const j=new Image;let x=null,R=!1;const q=()=>{x&&(clearTimeout(x),x=null),j.onload=null,j.onerror=null,j.src=""};x=setTimeout(()=>{if(!R){R=!0,q();const v=new Error(`阶段 ${h+1} 加载超时: ${m}`);p(v)}},a),j.onload=()=>{R||(R=!0,q(),E({url:m,stage:y,loaded:!0}))},j.onerror=v=>{if(!R){R=!0,q();let S=`阶段 ${h+1} 加载失败`;try{if(v.target&&v.target.src){const N=v.target.src;S=`阶段 ${h+1} 加载失败`}}catch{}const _=new Error(S);_.originalEvent=v,_.stageUrl=m,_.stageIndex=h,p(_)}};try{j.crossOrigin="anonymous",j.src=m}catch(v){R||(R=!0,q(),p(v))}}),d.push(C),c=m,o&&o(h,m,y)}catch(E){let p=null;if(l&&typeof l=="function")try{p=l(E,h,m,y)}catch{}if(p&&typeof p=="string")try{const x=await new Promise((R,q)=>{const v=new Image;let S=null,_=!1;const N=()=>{S&&(clearTimeout(S),S=null),v.onload=null,v.onerror=null,v.src=""};S=setTimeout(()=>{_||(_=!0,N(),q(new Error(`降级URL加载超时: ${p}`)))},a),v.onload=()=>{_||(_=!0,N(),R({url:p,stage:y,loaded:!0}))},v.onerror=()=>{_||(_=!0,N(),q(new Error(`降级URL加载失败: ${p}`)))};try{v.crossOrigin="anonymous",v.src=p}catch(P){_||(_=!0,N(),q(P))}});d.push(x),c=p,o&&o(h,p,y);break}catch{}const j=E.message.includes("404")||E.originalEvent&&E.originalEvent.type==="error";if((!j||process.env.NODE_ENV==="development")&&(j||console.warn(`⚠️ 阶段 ${h+1} 加载失败，跳过继续下一阶段:`,E.message)),d.push({url:m,stage:y,loaded:!1,error:E}),h===r.length-1&&d.length>0){for(let x=d.length-1;x>=0;x--)if(d[x].loaded){c=d[x].url;break}}if(o&&o(h,m,y),!(h<r.length-1)){if(!d.some(x=>x.loaded))throw new Error(`所有阶段加载失败，最后一个错误: ${E.message}`)}}h<r.length-1&&await new Promise(E=>setTimeout(E,100))}if(!d.some(h=>h.loaded)){const h=((b=d[d.length-1])==null?void 0:b.error)||new Error("所有阶段加载失败"),y=h.message.includes("404")||h.originalEvent&&h.originalEvent.type==="error";return(!y||process.env.NODE_ENV==="development")&&(y||console.error(`❌ 图片加载失败: ${e.substring(0,50)}...`,h.message)),i&&i(h,d.length-1),{url:c||e,stages:d,success:!1,error:h}}return u&&u(c),{url:c,stages:d,success:!0,error:null}}catch(g){const h=d.length,y=g.message&&g.message.includes("404");return(!y||process.env.NODE_ENV==="development")&&(y||console.error(`❌ 渐进式加载过程出错: ${e.substring(0,50)}...`,g.message||g)),i&&i(g,h),{url:c||e,stages:d,success:!1,error:g}}}async function Kt(e,n={}){const{stages:r=[{width:20,quality:20,blur:10},{width:400,quality:50,blur:3},{width:null,quality:80,blur:0}],concurrency:a=5,timeout:s=3e4,onProgress:o=null,onItemStageComplete:l=null,onItemComplete:u=null}=n,i=e.map((E,p)=>typeof E=="string"?{url:E,index:p}:{url:E.url||E.src||"",index:E.index!==void 0?E.index:p}),d=new Array(i.length);let c=0;const b=i.length,g=async E=>{const{url:p,index:j}=E,x=await Et(p,{stages:r,timeout:s,onStageComplete:(R,q,v)=>{l&&l({url:p,index:j,stageIndex:R,stageUrl:q,stage:v,currentStage:R+1,totalStages:r.length},R)},onComplete:R=>{},onError:(R,q)=>{}});return d[j]=x,c++,o&&o(c,b,x),u&&u(x),x},h=[...i],y=new Set,m=[];return await(async()=>{for(;h.length>0||y.size>0;){for(;h.length>0&&y.size<a;){const E=h.shift(),p=g(E).then(j=>(y.delete(p),j)).catch(j=>{y.delete(p);const x={url:E.url,stages:[],success:!1,error:j instanceof Error?j:new Error(String(j))};return d[E.index]=x,c++,o&&o(c,b,x),u&&u(x),x});y.add(p),m.push(p)}y.size>0&&await Promise.race(Array.from(y))}})(),await Promise.all(m),d}async function St(e,n={}){const{maxWidth:r=null,maxHeight:a=null,quality:s=.8,compressionLevel:o=.5,blur:l=0,smooth:u=!0,format:i=null}=n;if(typeof window>"u"||typeof document>"u")throw new Error("浏览器端压缩功能仅在浏览器环境中可用");return new Promise((d,c)=>{const b=new Image;if(b.crossOrigin="anonymous",b.onload=()=>{try{let{width:g,height:h}=b,y=g,m=h,C=!1;if(r||a){const P=Math.min(r?r/g:1,a?a/h:1);P<1&&(y=Math.round(g*P),m=Math.round(h*P),C=!0)}let E=y,p=m;if(o>0){const P=1-o*.75;E=Math.round(y*P),p=Math.round(m*P)}const j=E!==g||p!==h;if(!(j||o>0||l>0)&&typeof e=="string"){d(e);return}const R=document.createElement("canvas");R.width=E,R.height=p;const q=R.getContext("2d");if(j?(q.imageSmoothingEnabled=u,q.imageSmoothingQuality=u?"high":"low"):q.imageSmoothingEnabled=!1,q.drawImage(b,0,0,E,p),l>0){const P=document.createElement("canvas"),D=P.getContext("2d");if(P.width=E,P.height=p,D.drawImage(b,0,0,E,p),D.filter!==void 0)try{D.filter=`blur(${l}px)`,D.drawImage(P,0,0),D.filter="none",q.clearRect(0,0,R.width,R.height),q.drawImage(P,0,0)}catch{kt(q,P,E,p,l)}else kt(q,P,E,p,l)}let v=i;if(!v)if(o>0||l>0||j)v=Fe().includes("webp")?"webp":"jpeg";else{const D=pt(e);D&&["jpg","jpeg","png"].includes(D)?v=D==="jpeg"?"jpeg":D:v=Fe().includes("webp")?"webp":"jpeg"}let S=s;o>0?(S=s*(1-o*.7),S=Math.max(.1,Math.min(1,S))):!j&&l===0?S=Math.max(s,.98):j&&(S=Math.max(s,.92));const _=v==="webp"?"image/webp":v==="png"?"image/png":"image/jpeg",N=R.toDataURL(_,S);d(N)}catch(g){c(new Error("图片压缩失败: "+g.message))}},b.onerror=()=>{c(new Error("图片加载失败"))},typeof e=="string")b.src=e;else if(e instanceof File||e instanceof Blob){const g=new FileReader;g.onload=h=>{b.src=h.target.result},g.onerror=()=>c(new Error("文件读取失败")),g.readAsDataURL(e)}else c(new Error("不支持的图片源类型"))})}function kt(e,n,r,a,s){const o=document.createElement("canvas"),l=o.getContext("2d"),u=Math.max(.3,1-s/10),i=Math.round(r*u),d=Math.round(a*u);o.width=i,o.height=d,l.drawImage(n,0,0,r,a,0,0,i,d),e.clearRect(0,0,r,a),e.drawImage(o,0,0,i,d,0,0,r,a)}function xt(e){const n=e.split(","),r=n[0].match(/:(.*?);/)[1],a=atob(n[1]);let s=a.length;const o=new Uint8Array(s);for(;s--;)o[s]=a.charCodeAt(s);return new Blob([o],{type:r})}async function rt(e){if(!e)return null;try{if(e.startsWith("blob:"))return(await(await fetch(e)).blob()).size;if(e.startsWith("data:")){const a=e.split(",")[1];if(a){const s=atob(a);return new Blob([s]).size}return null}try{const s=(await fetch(e,{method:"HEAD"})).headers.get("Content-Length");if(s)return parseInt(s,10)}catch{}return(await(await fetch(e)).blob()).size}catch{return null}}function Le(e){if(e==null)return"未知";if(e===0)return"0 B";const n=1024,r=["B","KB","MB","GB"],a=Math.floor(Math.log(e)/Math.log(n));return parseFloat((e/Math.pow(n,a)).toFixed(2))+" "+r[a]}function Be(e){if(!e)return null;for(const[n,r]of Object.entries(Wt))if(r.test(e))return n;return null}async function Ct(e,n){const[r,a]=await Promise.all([rt(e),rt(n)]);let s=null,o=null,l=!1,u=null;return r!==null&&a!==null&&(s=r-a,o=parseFloat((s/r*100).toFixed(2)),l=s>1024||o>1,!l&&s===0?Be(e)?u="⚠️ 优化参数可能无效，图片大小未发生变化。请检查CDN配置是否正确。":u="⚠️ 该图片URL不是支持的CDN，通用查询参数可能无效。支持的CDN：阿里云OSS、腾讯云COS、七牛云、又拍云、AWS CloudFront。":!l&&s>0&&o<=1&&(u=`⚠️ 优化效果不明显（仅节省 ${o}%），可能优化参数未生效。`)),{originalUrl:e,optimizedUrl:n,originalSize:r,optimizedSize:a,savedSize:s,savedPercentage:o,isOptimizationEffective:l,warningMessage:u,originalSizeFormatted:Le(r),optimizedSizeFormatted:Le(a),savedSizeFormatted:Le(s),cdn:Be(e)}}const ur=Object.freeze(Object.defineProperty({__proto__:null,compareImageSizes:Ct,compressImageInBrowser:St,dataURLToBlob:xt,detectCDN:Be,detectImageFormat:pt,detectSupportedFormats:Fe,formatFileSize:Le,generateBlurPlaceholderUrl:vt,generateResponsiveImage:Vt,generateSizes:tt,generateSrcset:wt,getBestFormat:et,getImageSize:rt,getOptimizedCoverUrl:Ht,loadImageProgressive:Et,loadImagesBatch:Yt,loadImagesProgressiveBatch:Kt,loadImagesProgressively:bt,optimizeImageUrl:ve,preloadImage:yt,preloadImages:Qt},Symbol.toStringTag,{value:"Module"}));var mt={exports:{}},Ne={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var At;function fr(){if(At)return Ne;At=1;var e=U,n=Symbol.for("react.element"),r=Symbol.for("react.fragment"),a=Object.prototype.hasOwnProperty,s=e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,o={key:!0,ref:!0,__self:!0,__source:!0};function l(u,i,d){var c,b={},g=null,h=null;d!==void 0&&(g=""+d),i.key!==void 0&&(g=""+i.key),i.ref!==void 0&&(h=i.ref);for(c in i)a.call(i,c)&&!o.hasOwnProperty(c)&&(b[c]=i[c]);if(u&&u.defaultProps)for(c in i=u.defaultProps,i)b[c]===void 0&&(b[c]=i[c]);return{$$typeof:n,type:u,key:g,ref:h,props:b,_owner:s.current}}return Ne.Fragment=r,Ne.jsx=l,Ne.jsxs=l,Ne}var Oe={};/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Nt;function dr(){return Nt||(Nt=1,process.env.NODE_ENV!=="production"&&function(){var e=U,n=Symbol.for("react.element"),r=Symbol.for("react.portal"),a=Symbol.for("react.fragment"),s=Symbol.for("react.strict_mode"),o=Symbol.for("react.profiler"),l=Symbol.for("react.provider"),u=Symbol.for("react.context"),i=Symbol.for("react.forward_ref"),d=Symbol.for("react.suspense"),c=Symbol.for("react.suspense_list"),b=Symbol.for("react.memo"),g=Symbol.for("react.lazy"),h=Symbol.for("react.offscreen"),y=Symbol.iterator,m="@@iterator";function C(t){if(t===null||typeof t!="object")return null;var f=y&&t[y]||t[m];return typeof f=="function"?f:null}var E=e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;function p(t){{for(var f=arguments.length,w=new Array(f>1?f-1:0),T=1;T<f;T++)w[T-1]=arguments[T];j("error",t,w)}}function j(t,f,w){{var T=E.ReactDebugCurrentFrame,O=T.getStackAddendum();O!==""&&(f+="%s",w=w.concat([O]));var L=w.map(function(k){return String(k)});L.unshift("Warning: "+f),Function.prototype.apply.call(console[t],console,L)}}var x=!1,R=!1,q=!1,v=!1,S=!1,_;_=Symbol.for("react.module.reference");function N(t){return!!(typeof t=="string"||typeof t=="function"||t===a||t===o||S||t===s||t===d||t===c||v||t===h||x||R||q||typeof t=="object"&&t!==null&&(t.$$typeof===g||t.$$typeof===b||t.$$typeof===l||t.$$typeof===u||t.$$typeof===i||t.$$typeof===_||t.getModuleId!==void 0))}function P(t,f,w){var T=t.displayName;if(T)return T;var O=f.displayName||f.name||"";return O!==""?w+"("+O+")":w}function D(t){return t.displayName||"Context"}function z(t){if(t==null)return null;if(typeof t.tag=="number"&&p("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."),typeof t=="function")return t.displayName||t.name||null;if(typeof t=="string")return t;switch(t){case a:return"Fragment";case r:return"Portal";case o:return"Profiler";case s:return"StrictMode";case d:return"Suspense";case c:return"SuspenseList"}if(typeof t=="object")switch(t.$$typeof){case u:var f=t;return D(f)+".Consumer";case l:var w=t;return D(w._context)+".Provider";case i:return P(t,t.render,"ForwardRef");case b:var T=t.displayName||null;return T!==null?T:z(t.type)||"Memo";case g:{var O=t,L=O._payload,k=O._init;try{return z(k(L))}catch{return null}}}return null}var V=Object.assign,Z=0,W,F,Y,G,X,ie,Ee;function ye(){}ye.__reactDisabledLog=!0;function Ke(){{if(Z===0){W=console.log,F=console.info,Y=console.warn,G=console.error,X=console.group,ie=console.groupCollapsed,Ee=console.groupEnd;var t={configurable:!0,enumerable:!0,value:ye,writable:!0};Object.defineProperties(console,{info:t,log:t,warn:t,error:t,group:t,groupCollapsed:t,groupEnd:t})}Z++}}function Se(){{if(Z--,Z===0){var t={configurable:!0,enumerable:!0,writable:!0};Object.defineProperties(console,{log:V({},t,{value:W}),info:V({},t,{value:F}),warn:V({},t,{value:Y}),error:V({},t,{value:G}),group:V({},t,{value:X}),groupCollapsed:V({},t,{value:ie}),groupEnd:V({},t,{value:Ee})})}Z<0&&p("disabledDepth fell below zero. This is a bug in React. Please file an issue.")}}var be=E.ReactCurrentDispatcher,ae;function xe(t,f,w){{if(ae===void 0)try{throw Error()}catch(O){var T=O.stack.trim().match(/\n( *(at )?)/);ae=T&&T[1]||""}return`
`+ae+t}}var ce=!1,pe;{var Ce=typeof WeakMap=="function"?WeakMap:Map;pe=new Ce}function de(t,f){if(!t||ce)return"";{var w=pe.get(t);if(w!==void 0)return w}var T;ce=!0;var O=Error.prepareStackTrace;Error.prepareStackTrace=void 0;var L;L=be.current,be.current=null,Ke();try{if(f){var k=function(){throw Error()};if(Object.defineProperty(k.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(k,[])}catch(re){T=re}Reflect.construct(t,[],k)}else{try{k.call()}catch(re){T=re}t.call(k.prototype)}}else{try{throw Error()}catch(re){T=re}t()}}catch(re){if(re&&T&&typeof re.stack=="string"){for(var I=re.stack.split(`
`),te=T.stack.split(`
`),Q=I.length-1,K=te.length-1;Q>=1&&K>=0&&I[Q]!==te[K];)K--;for(;Q>=1&&K>=0;Q--,K--)if(I[Q]!==te[K]){if(Q!==1||K!==1)do if(Q--,K--,K<0||I[Q]!==te[K]){var oe=`
`+I[Q].replace(" at new "," at ");return t.displayName&&oe.includes("<anonymous>")&&(oe=oe.replace("<anonymous>",t.displayName)),typeof t=="function"&&pe.set(t,oe),oe}while(Q>=1&&K>=0);break}}}finally{ce=!1,be.current=L,Se(),Error.prepareStackTrace=O}var qe=t?t.displayName||t.name:"",_e=qe?xe(qe):"";return typeof t=="function"&&pe.set(t,_e),_e}function Re(t,f,w){return de(t,!1)}function ee(t){var f=t.prototype;return!!(f&&f.isReactComponent)}function le(t,f,w){if(t==null)return"";if(typeof t=="function")return de(t,ee(t));if(typeof t=="string")return xe(t);switch(t){case d:return xe("Suspense");case c:return xe("SuspenseList")}if(typeof t=="object")switch(t.$$typeof){case i:return Re(t.render);case b:return le(t.type,f,w);case g:{var T=t,O=T._payload,L=T._init;try{return le(L(O),f,w)}catch{}}}return""}var ne=Object.prototype.hasOwnProperty,ze={},De=E.ReactDebugCurrentFrame;function ge(t){if(t){var f=t._owner,w=le(t.type,t._source,f?f.type:null);De.setExtraStackFrame(w)}else De.setExtraStackFrame(null)}function Ge(t,f,w,T,O){{var L=Function.call.bind(ne);for(var k in t)if(L(t,k)){var I=void 0;try{if(typeof t[k]!="function"){var te=Error((T||"React class")+": "+w+" type `"+k+"` is invalid; it must be a function, usually from the `prop-types` package, but received `"+typeof t[k]+"`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");throw te.name="Invariant Violation",te}I=t[k](f,k,T,w,null,"SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED")}catch(Q){I=Q}I&&!(I instanceof Error)&&(ge(O),p("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).",T||"React class",w,k,typeof I),ge(null)),I instanceof Error&&!(I.message in ze)&&(ze[I.message]=!0,ge(O),p("Failed %s type: %s",w,I.message),ge(null))}}}var ot=Array.isArray;function Ie(t){return ot(t)}function it(t){{var f=typeof Symbol=="function"&&Symbol.toStringTag,w=f&&t[Symbol.toStringTag]||t.constructor.name||"Object";return w}}function ue(t){try{return se(t),!1}catch{return!0}}function se(t){return""+t}function Je(t){if(ue(t))return p("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.",it(t)),se(t)}var A=E.ReactCurrentOwner,B={key:!0,ref:!0,__self:!0,__source:!0},$,M;function J(t){if(ne.call(t,"ref")){var f=Object.getOwnPropertyDescriptor(t,"ref").get;if(f&&f.isReactWarning)return!1}return t.ref!==void 0}function ke(t){if(ne.call(t,"key")){var f=Object.getOwnPropertyDescriptor(t,"key").get;if(f&&f.isReactWarning)return!1}return t.key!==void 0}function Me(t,f){typeof t.ref=="string"&&A.current}function Ze(t,f){{var w=function(){$||($=!0,p("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)",f))};w.isReactWarning=!0,Object.defineProperty(t,"key",{get:w,configurable:!0})}}function ct(t,f){{var w=function(){M||(M=!0,p("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)",f))};w.isReactWarning=!0,Object.defineProperty(t,"ref",{get:w,configurable:!0})}}var lt=function(t,f,w,T,O,L,k){var I={$$typeof:n,type:t,key:f,ref:w,props:k,_owner:L};return I._store={},Object.defineProperty(I._store,"validated",{configurable:!1,enumerable:!1,writable:!0,value:!1}),Object.defineProperty(I,"_self",{configurable:!1,enumerable:!1,writable:!1,value:T}),Object.defineProperty(I,"_source",{configurable:!1,enumerable:!1,writable:!1,value:O}),Object.freeze&&(Object.freeze(I.props),Object.freeze(I)),I};function ut(t,f,w,T,O){{var L,k={},I=null,te=null;w!==void 0&&(Je(w),I=""+w),ke(f)&&(Je(f.key),I=""+f.key),J(f)&&(te=f.ref,Me(f,O));for(L in f)ne.call(f,L)&&!B.hasOwnProperty(L)&&(k[L]=f[L]);if(t&&t.defaultProps){var Q=t.defaultProps;for(L in Q)k[L]===void 0&&(k[L]=Q[L])}if(I||te){var K=typeof t=="function"?t.displayName||t.name||"Unknown":t;I&&Ze(k,K),te&&ct(k,K)}return lt(t,I,te,O,T,A.current,k)}}var Ae=E.ReactCurrentOwner,Bt=E.ReactDebugCurrentFrame;function je(t){if(t){var f=t._owner,w=le(t.type,t._source,f?f.type:null);Bt.setExtraStackFrame(w)}else Bt.setExtraStackFrame(null)}var ft;ft=!1;function dt(t){return typeof t=="object"&&t!==null&&t.$$typeof===n}function Mt(){{if(Ae.current){var t=z(Ae.current.type);if(t)return`

Check the render method of \``+t+"`."}return""}}function er(t){return""}var jt={};function tr(t){{var f=Mt();if(!f){var w=typeof t=="string"?t:t.displayName||t.name;w&&(f=`

Check the top-level render call using <`+w+">.")}return f}}function qt(t,f){{if(!t._store||t._store.validated||t.key!=null)return;t._store.validated=!0;var w=tr(f);if(jt[w])return;jt[w]=!0;var T="";t&&t._owner&&t._owner!==Ae.current&&(T=" It was passed a child from "+z(t._owner.type)+"."),je(t),p('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.',w,T),je(null)}}function Ut(t,f){{if(typeof t!="object")return;if(Ie(t))for(var w=0;w<t.length;w++){var T=t[w];dt(T)&&qt(T,f)}else if(dt(t))t._store&&(t._store.validated=!0);else if(t){var O=C(t);if(typeof O=="function"&&O!==t.entries)for(var L=O.call(t),k;!(k=L.next()).done;)dt(k.value)&&qt(k.value,f)}}}function rr(t){{var f=t.type;if(f==null||typeof f=="string")return;var w;if(typeof f=="function")w=f.propTypes;else if(typeof f=="object"&&(f.$$typeof===i||f.$$typeof===b))w=f.propTypes;else return;if(w){var T=z(f);Ge(w,t.props,"prop",T,t)}else if(f.PropTypes!==void 0&&!ft){ft=!0;var O=z(f);p("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?",O||"Unknown")}typeof f.getDefaultProps=="function"&&!f.getDefaultProps.isReactClassApproved&&p("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.")}}function ar(t){{for(var f=Object.keys(t.props),w=0;w<f.length;w++){var T=f[w];if(T!=="children"&&T!=="key"){je(t),p("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.",T),je(null);break}}t.ref!==null&&(je(t),p("Invalid attribute `ref` supplied to `React.Fragment`."),je(null))}}var zt={};function It(t,f,w,T,O,L){{var k=N(t);if(!k){var I="";(t===void 0||typeof t=="object"&&t!==null&&Object.keys(t).length===0)&&(I+=" You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");var te=er();te?I+=te:I+=Mt();var Q;t===null?Q="null":Ie(t)?Q="array":t!==void 0&&t.$$typeof===n?(Q="<"+(z(t.type)||"Unknown")+" />",I=" Did you accidentally export a JSX literal instead of a component?"):Q=typeof t,p("React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s",Q,I)}var K=ut(t,f,w,O,L);if(K==null)return K;if(k){var oe=f.children;if(oe!==void 0)if(T)if(Ie(oe)){for(var qe=0;qe<oe.length;qe++)Ut(oe[qe],t);Object.freeze&&Object.freeze(oe)}else p("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");else Ut(oe,t)}if(ne.call(f,"key")){var _e=z(t),re=Object.keys(f).filter(function(lr){return lr!=="key"}),gt=re.length>0?"{key: someKey, "+re.join(": ..., ")+": ...}":"{key: someKey}";if(!zt[_e+gt]){var cr=re.length>0?"{"+re.join(": ..., ")+": ...}":"{}";p(`A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`,gt,_e,cr,_e),zt[_e+gt]=!0}}return t===a?ar(K):rr(K),K}}function nr(t,f,w){return It(t,f,w,!0)}function sr(t,f,w){return It(t,f,w,!1)}var or=sr,ir=nr;Oe.Fragment=a,Oe.jsx=or,Oe.jsxs=ir}()),Oe}process.env.NODE_ENV==="production"?mt.exports=fr():mt.exports=dr();var H=mt.exports;let Pe=null,Ot=null,Te=new Map,gr=0,$t=!1;const mr=()=>`
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
  `,hr=()=>Pe||typeof Worker>"u"?Promise.resolve():new Promise((e,n)=>{try{const r=`
// IndexedDB Worker - 内联版本
${mr()}
        `,a=new Blob([r],{type:"application/javascript"});Ot=URL.createObjectURL(a),Pe=new Worker(Ot),Pe.onmessage=s=>{const{id:o,success:l,result:u,error:i,type:d}=s.data;if(d==="ready"){$t=!0,e();return}const c=Te.get(o);if(c)if(Te.delete(o),l)c.resolve(u);else{const b=new Error(i.message);b.name=i.name,b.stack=i.stack,c.reject(b)}},Pe.onerror=s=>{console.error("❌ Worker 错误:",s),Te.forEach(o=>{o.reject(s)}),Te.clear(),n(s)},$t&&e()}catch(r){console.error("❌ 初始化 Worker 失败:",r),n(r)}}),we=async(e,n={})=>{if(!me())throw new Error("Worker 不支持，应该使用主线程实现");if(await hr(),!Pe)throw new Error("Worker 初始化失败");return new Promise((r,a)=>{const s=++gr;Te.set(s,{resolve:r,reject:a});const o=[];n.imageData&&n.imageData instanceof ArrayBuffer?o.push(n.imageData):n.imageData&&n.imageData.buffer instanceof ArrayBuffer&&o.push(n.imageData.buffer),o.length>0?Pe.postMessage({id:s,action:e,params:n},o):Pe.postMessage({id:s,action:e,params:n}),setTimeout(()=>{Te.has(s)&&(Te.delete(s),a(new Error(`操作超时: ${e}`)))},3e4)})},pr=()=>typeof Worker<"u",me=()=>pr()&&!0,ht="ImageOptimizeCache",Lt="generalCache",Xe=new Map,$e=(e=ht,n=1,r=[])=>new Promise((a,s)=>{const o=`${e}_${n}`;if(Xe.has(o)){a(Xe.get(o));return}const l=indexedDB.open(e,n);l.onerror=()=>{s(l.error)},l.onsuccess=()=>{const u=l.result;Xe.set(o,u),a(u)},l.onupgradeneeded=u=>{const i=u.target.result;if(r.forEach(d=>{if(!i.objectStoreNames.contains(d)){const c=i.createObjectStore(d,{keyPath:"key"});c.createIndex("timestamp","timestamp",{unique:!1}),c.createIndex("expireTime","expireTime",{unique:!1})}}),e===ht&&!i.objectStoreNames.contains(Lt)){const d=i.createObjectStore(Lt,{keyPath:"key"});d.createIndex("timestamp","timestamp",{unique:!1}),d.createIndex("expireTime","expireTime",{unique:!1})}}}),Ve=async(e,n)=>{let r,a=1;try{if(indexedDB.databases)try{const o=(await indexedDB.databases()).find(l=>l.name===e);o&&(a=o.version)}catch{a=1}try{if(r=await $e(e,a,[]),!r.objectStoreNames.contains(n)){r.close(),Xe.delete(`${e}_${a}`);const s=a+1;r=await $e(e,s,[n])}}catch{r=await $e(e,1,[n])}}catch{try{r=await $e(e,1,[n])}catch(o){throw new Error(`无法创建数据库 ${e}: ${o.message}`)}}return r},Ft=async e=>{const{key:n,value:r,expireHours:a,dbName:s,storeName:o}=e;try{const i=(await Ve(s,o)).transaction([o],"readwrite").objectStore(o),d=Date.now(),c=a>0?d+a*60*60*1e3:null,b={key:n,value:typeof r=="string"?r:JSON.stringify(r),timestamp:d,expireHours:a,expireTime:c},g=i.put(b);return new Promise((h,y)=>{g.onsuccess=()=>h(),g.onerror=()=>{const m=g.error;if(m&&m.name==="QuotaExceededError"){const C=new Error("存储配额已满，无法保存缓存");C.name="QuotaExceededError",C.originalError=m,y(C)}else y(m)}})}catch(l){throw l}},wr=async e=>{const{key:n,dbName:r,storeName:a}=e;try{const u=(await Ve(r,a)).transaction([a],"readonly").objectStore(a).get(n);return new Promise((i,d)=>{u.onsuccess=()=>{const c=u.result;if(!c){i(null);return}const b=Date.now();if(c.expireTime&&b>c.expireTime){i(null);return}try{const g=JSON.parse(c.value);i(g)}catch{i(null)}},u.onerror=()=>{i(null)}})}catch{return null}},yr=async e=>{const{key:n,dbName:r,storeName:a}=e;try{const l=(await Ve(r,a)).transaction([a],"readwrite").objectStore(a),u=n?l.delete(n):l.clear();return new Promise((i,d)=>{u.onsuccess=()=>i(),u.onerror=()=>d(u.error)})}catch(s){throw s}},br=async e=>{const{dbName:n,storeName:r}=e;try{const l=(await Ve(n,r)).transaction([r],"readwrite").objectStore(r).index("expireTime"),u=Date.now();let i=0;const d=IDBKeyRange.upperBound(u),c=l.openCursor(d);return new Promise((b,g)=>{c.onsuccess=h=>{const y=h.target.result;y?(y.delete(),i++,y.continue()):b(i)},c.onerror=()=>g(c.error)})}catch(a){throw a}},vr=async e=>{const{dbName:n,storeName:r}=e;try{const l=(await Ve(n,r)).transaction([r],"readonly").objectStore(r).getAll();return new Promise((u,i)=>{l.onsuccess=()=>{const d=l.result,c=Date.now();let b=0,g=0;d.forEach(h=>{h.value&&(b+=h.value.length),h.expireTime&&c>h.expireTime&&g++}),u({count:d.length,totalSize:b,totalSizeMB:Math.round(b/1024/1024*100)/100,expiredCount:g})},l.onerror=()=>i(l.error)})}catch(a){throw a}},Er=async e=>{const{dbName:n}=e;try{const r=await $e(n,1,[]);return Array.from(r.objectStoreNames)}catch{return[]}},Sr=async()=>{if(indexedDB.databases)try{return(await indexedDB.databases()).map(n=>n.name)}catch{return[]}else return[ht]},xr=async()=>{if(navigator.storage&&navigator.storage.estimate)try{const e=await navigator.storage.estimate(),n=e.quota||0,r=e.usage||0,a=e.usageDetails||{},s=a.indexedDB||0;return{quota:n,usage:r,usageDetails:a,quotaMB:Math.round(n/1024/1024*100)/100,usageMB:Math.round(r/1024/1024*100)/100,availableMB:Math.round((n-r)/1024/1024*100)/100,usagePercent:n>0?Math.round(r/n*100*100)/100:0,indexedDBUsage:s,indexedDBUsageMB:Math.round(s/1024/1024*100)/100}}catch{return{quota:0,usage:0,usageDetails:{},quotaMB:0,usageMB:0,availableMB:0,usagePercent:0,indexedDBUsage:0,indexedDBUsageMB:0}}else return{quota:0,usage:0,usageDetails:{},quotaMB:0,usageMB:0,availableMB:0,usagePercent:0,indexedDBUsage:0,indexedDBUsageMB:0,unsupported:!0}},fe="ImageOptimizeCache",he="generalCache",He=30*24,Qe=async(e,n,r=He,a=fe,s=he,o={})=>{const{checkQuota:l=!1,autoCleanOnQuotaError:u=!1}=o;try{let i;try{i=JSON.stringify(n)}catch(c){throw new Error(`无法序列化值: ${c.message}`)}const d=new Blob([i]).size;if(l){const c=await at(d);if(!c.available)if(u){if(console.warn("⚠️ 存储配额不足，尝试清理过期缓存..."),await We(a,s),!(await at(d)).available)throw new Error(`存储配额不足: ${c.message}`)}else throw new Error(`存储配额不足: ${c.message}`)}try{me()?await we("setCache",{key:e,value:i,expireHours:r,dbName:a,storeName:s}):(console.log("Worker 不支持 降级到主线程"),await Ft({key:e,value:i,expireHours:r,dbName:a,storeName:s}))}catch(c){if(c&&c.name==="QuotaExceededError")if(u)try{console.warn("⚠️ 存储配额已满，尝试清理过期缓存后重试..."),await We(a,s),me()?await we("setCache",{key:e,value:i,expireHours:r,dbName:a,storeName:s}):await Ft({key:e,value:i,expireHours:r,dbName:a,storeName:s})}catch(b){const g=new Error("存储配额已满，即使清理过期缓存后仍无法保存");throw g.name="QuotaExceededError",g.originalError=b,g}else{const b=new Error("存储配额已满，无法保存缓存。建议清理过期缓存或删除不需要的数据");throw b.name="QuotaExceededError",b.originalError=c,b.suggestion="可以调用 cleanExpiredCache() 清理过期缓存，或使用 deleteCache() 删除不需要的数据",b}else throw c}}catch(i){if(i&&(i.name==="QuotaExceededError"||i.message.includes("配额"))){const d=new Error(i.message||"存储配额已满，无法保存缓存");throw d.name="QuotaExceededError",d.originalError=i,d.suggestion="可以调用 cleanExpiredCache() 清理过期缓存，或使用 deleteCache() 删除不需要的数据",console.error("❌ 存储配额已满:",d),d}throw console.error("❌ 设置缓存失败:",i),i}},Ye=async(e,n=fe,r=he)=>{try{let a;return me()?a=await we("getCache",{key:e,dbName:n,storeName:r}):a=await wr({key:e,dbName:n,storeName:r}),a===null&&Ue(e,n,r).catch(()=>{}),a}catch(a){return console.error("❌ 获取缓存失败:",a),null}},Ue=async(e=null,n=fe,r=he)=>{try{me()?await we("deleteCache",{key:e,dbName:n,storeName:r}):await yr({key:e,dbName:n,storeName:r})}catch(a){throw console.error("❌ 删除缓存失败:",a),a}},We=async(e=fe,n=he)=>{try{return me()?await we("cleanExpiredCache",{dbName:e,storeName:n}):await br({dbName:e,storeName:n})}catch(r){return console.error("❌ 清理过期缓存失败:",r),0}},Rt=async(e=fe,n=he)=>{try{return me()?await we("getCacheStats",{dbName:e,storeName:n}):await vr({dbName:e,storeName:n})}catch(r){return console.error("❌ 获取缓存统计失败:",r),{count:0,totalSize:0,totalSizeMB:0,expiredCount:0}}},Gt=async(e,n=fe,r=he)=>await Ye(e,n,r)!==null,Dt=async(e=fe)=>{try{return me()?await we("getStoreNames",{dbName:e}):await Er({dbName:e})}catch(n){return console.error("❌ 获取表名失败:",n),[]}},Jt=async e=>new Promise((n,r)=>{const a=indexedDB.deleteDatabase(e);a.onsuccess=()=>{n()},a.onerror=()=>{r(a.error)}}),_t=async()=>{try{return me()?await we("getAllDatabaseNames",{}):await Sr()}catch(e){return console.error("❌ 获取数据库列表失败:",e),[]}},at=async(e=0)=>{try{const n=await Pt(),r=n.quota-n.usage-e>0,a=n.availableMB-e/1024/1024;return{available:r,quota:n.quota,usage:n.usage,availableMB:Math.max(0,Math.round(a*100)/100),requiredMB:Math.round(e/1024/1024*100)/100,usagePercent:n.usagePercent,message:r?`存储空间充足，可用 ${Math.round(a*100)/100} MB`:`存储空间不足，需要 ${Math.round(e/1024/1024*100)/100} MB，但只有 ${n.availableMB} MB 可用`}}catch(n){return console.error("❌ 检查存储配额失败:",n),{available:!1,quota:0,usage:0,availableMB:0,requiredMB:Math.round(e/1024/1024*100)/100,usagePercent:0,message:"无法检查存储配额",error:n}}},Pt=async()=>{try{return me()?await we("getStorageQuota",{}):await xr()}catch(e){return console.error("❌ 获取存储配额失败:",e),{quota:0,usage:0,usageDetails:{},quotaMB:0,usageMB:0,availableMB:0,usagePercent:0,indexedDBUsage:0,indexedDBUsageMB:0}}},Zt=async()=>{try{const e=await _t(),n=[];for(const r of e)try{const a=await Dt(r),s=[];for(const u of a){const i=await Rt(r,u);s.push({storeName:u,count:i.count,size:i.totalSize,sizeMB:i.totalSizeMB})}const o=s.reduce((u,i)=>u+i.size,0),l=Math.round(o/1024/1024*100)/100;n.push({dbName:r,stores:s,totalSize:o,totalSizeMB:l})}catch(a){console.error(`❌ 获取数据库 ${r} 使用情况失败:`,a)}return n}catch(e){return console.error("❌ 获取所有数据库使用情况失败:",e),[]}},nt=(e,n)=>{try{const r=new Blob([e],{type:n});return URL.createObjectURL(r)}catch(r){return console.error("❌ 创建 Blob URL 失败:",r),null}},Tt=async(e,n=fe,r=he,a=He)=>{try{try{await We(n,r)}catch(g){console.warn("⚠️ 清理过期缓存失败:",g.message)}const s=`image:${e}`,o=await Ye(s,n,r);if(o&&o.data&&o.mimeType)try{const g=o.data.split(",")[1]||o.data;if(!g||g.length===0)throw new Error("缓存数据为空");const h=atob(g),y=new Uint8Array(h.length);for(let C=0;C<h.length;C++)y[C]=h.charCodeAt(C);const m=nt(y,o.mimeType);if(m)return m}catch(g){console.warn("⚠️ 缓存数据损坏，删除缓存:",g.message),await Ue(s,n,r).catch(()=>{})}const l=await fetch(e);if(!l.ok)throw new Error(`HTTP ${l.status}: ${l.statusText}`);const u=await l.arrayBuffer(),i=new Uint8Array(u),d=l.headers.get("Content-Type")||"image/jpeg";let c;try{const g=[];for(let C=0;C<i.length;C+=8192){const E=i.slice(C,C+8192),p=String.fromCharCode.apply(null,Array.from(E));g.push(p)}const y=g.join(""),m=btoa(y);c=`data:${d};base64,${m}`}catch(g){console.warn("⚠️ 图片数据编码失败，跳过缓存保存:",g.message),c=null}if(c)try{await Qe(s,{data:c,mimeType:d},a,n,r)}catch(g){console.warn("⚠️ 保存缓存失败:",g.message)}return nt(i,d)}catch(s){console.error("❌ 加载图片失败:",s);const o=`image:${e}`;throw await Ue(o,n,r),s}},st=async(e,n={})=>{const{loadImageProgressive:r,optimizeImageUrl:a}=await Promise.resolve().then(()=>ur),{stages:s=[{width:20,quality:20,blur:10},{width:400,quality:50,blur:3},{width:null,quality:80,blur:0}],timeout:o=3e4,enableCache:l=!0,urlTransformer:u=null,onStageComplete:i=null,onComplete:d=null,onError:c=null,onStageError:b=null,dbName:g=fe,storeName:h=he,expireHours:y=He}=n;if(!e){const m=new Error("图片URL为空");return c&&c(m,-1),{url:"",stages:[],success:!1,error:m,fromCache:!1}}try{if(!l)return{...await r(e,{stages:s,timeout:o,urlTransformer:u,onStageError:b,onStageComplete:i,onComplete:d,onError:c}),fromCache:!1};const m=s[s.length-1];let C=e;u&&typeof u=="function"?C=u(e,m,s.length-1):m&&(m.width||m.height)&&(C=a(e,{width:m.width||null,height:m.height||null,quality:m.quality||80,format:m.format||null,autoFormat:m.autoFormat!==!1}));const E=`image:${C}`,p=await Ye(E,g,h);if(p&&p.data&&p.mimeType)try{const x=p.data.split(",")[1]||p.data;if(!x||x.length===0)throw new Error("缓存数据为空");const R=atob(x),q=new Uint8Array(R.length);for(let S=0;S<R.length;S++)q[S]=R.charCodeAt(S);const v=nt(q,p.mimeType);if(v)return d&&d(v),i&&s.forEach((S,_)=>{_===s.length-1&&i(_,v,S)}),{url:v,stages:s.map((S,_)=>({url:_===s.length-1?v:"",stage:S,loaded:_===s.length-1})),success:!0,error:null,fromCache:!0}}catch(x){console.warn("⚠️ 缓存数据损坏，删除缓存:",x.message),await Ue(E,g,h).catch(()=>{})}return{...await r(e,{stages:s,timeout:o,urlTransformer:u,onStageError:b,onStageComplete:i,onComplete:async x=>{if(!x.startsWith("blob:"))try{const R=await fetch(x);if(R.ok){const q=await R.arrayBuffer(),v=new Uint8Array(q),S=R.headers.get("Content-Type")||"image/jpeg";try{const _=[];for(let V=0;V<v.length;V+=8192){const Z=v.slice(V,V+8192),W=String.fromCharCode.apply(null,Array.from(Z));_.push(W)}const P=_.join(""),D=btoa(P),z=`data:${S};base64,${D}`;await Qe(E,{data:z,mimeType:S},y,g,h),console.log(`[渐进式加载缓存] 已保存到缓存: ${E.substring(0,50)}...`)}catch(_){console.warn("[渐进式加载缓存] 保存缓存失败:",_.message||_)}}}catch(R){console.warn("[渐进式加载缓存] 保存缓存失败:",R.message||R)}d&&d(x)},onError:c}),fromCache:!1}}catch(m){const C=m.message&&m.message.includes("404");return(!C||process.env.NODE_ENV==="development")&&(C||console.error("❌ 渐进式加载图片失败:",m.message||m)),c&&c(m,-1),{url:"",stages:[],success:!1,error:m,fromCache:!1}}},Cr=Object.freeze(Object.defineProperty({__proto__:null,DEFAULT_CACHE_EXPIRE_HOURS:He,DEFAULT_DB_NAME:fe,DEFAULT_STORE_NAME_GENERAL:he,checkStorageQuota:at,cleanExpiredCache:We,createBlobUrlFromCache:nt,deleteCache:Ue,deleteDatabase:Jt,getAllDatabaseNames:_t,getAllDatabasesUsage:Zt,getCache:Ye,getCacheStats:Rt,getStorageQuota:Pt,getStoreNames:Dt,hasCache:Gt,loadImageProgressiveWithCache:st,loadImageWithCache:Tt,setCache:Qe},Symbol.toStringTag,{value:"Module"}));function Xt({src:e="",alt:n="",width:r="100%",height:a="auto",className:s="",imageClassName:o="",dataId:l=null,imageStyle:u={},immediate:i=!1,rootMargin:d="50px",optimize:c={width:240,height:320,quality:30},enableBrowserCompression:b=!0,showPlaceholderIcon:g=!1,showErrorMessage:h=!1,errorSrc:y=null,progressive:m=!1,progressiveStages:C=[{width:20,quality:20,blur:10},{width:400,quality:50,blur:3},{width:null,quality:80,blur:0}],progressiveTransitionDuration:E=300,progressiveTimeout:p=3e4,progressiveEnableCache:j=!0,onLoad:x=null,onOptimization:R=null,onError:q=null,onClick:v=null,onProgressiveStageComplete:S=null}){const _=U.useRef(null),N=U.useRef(null),P=U.useRef(null),D=U.useRef(null),[z,V]=U.useState(!1),[Z,W]=U.useState(!1),[F,Y]=U.useState(!1),[G,X]=U.useState(i),[ie,Ee]=U.useState(""),[ye,Ke]=U.useState(null),[Se,be]=U.useState(!1),[ae,xe]=U.useState(null),ce=U.useRef(null),[pe,Ce]=U.useState(-1),[de,Re]=U.useState(""),ee=U.useRef(null),le=U.useRef(-1),ne=U.useRef(!1),ze=U.useRef(null),De=A=>{if(!A)return"";try{if(c&&Object.keys(c).length>0){const B=ve(A,c);if(B&&B.trim())return B}return A}catch(B){return console.warn("图片URL优化失败，使用原始URL:",B),A}},ge=U.useMemo(()=>e?m&&de?de:ye||ae||(z&&ie?ie:De(e)):"",[e,z,ie,c,ye,ae,m,de]),Ge=()=>{if(i||typeof window>"u"||!window.IntersectionObserver){X(!0);return}P.current&&(P.current.disconnect(),P.current=null),P.current=new IntersectionObserver(A=>{A.forEach(B=>{B.isIntersecting&&(X(!0),P.current&&B.target&&P.current.unobserve(B.target))})},{rootMargin:d,threshold:.01}),setTimeout(()=>{N.current&&P.current&&P.current.observe(N.current)},0)},ot=async A=>{if(m){const M=le.current;if(M>=0&&M<C.length)return}if(z)return;const B=A.target.src;if(V(!0),W(!1),Y(!1),Ee(B),!B.startsWith("blob:")&&!B.startsWith("data:"))try{const M=De(e),J=await fetch(M);if(J.ok){const ke=await J.arrayBuffer(),Me=new Uint8Array(ke),Ze=J.headers.get("Content-Type")||"image/jpeg",ct=String.fromCharCode.apply(null,Array.from(Me)),lt=btoa(ct),ut=`data:${Ze};base64,${lt}`,Ae=`image:${M}`;await Qe(Ae,{data:ut,mimeType:Ze})}}catch(M){console.warn("保存图片缓存失败:",M)}let $=null;if(e&&B!==e)try{const M=await Ct(e,B);M.originalSize!==null&&M.optimizedSize!==null?($={originalUrl:M.originalUrl,originalSize:M.originalSize,originalSizeFormatted:M.originalSizeFormatted,optimizedUrl:M.optimizedUrl,optimizedSize:M.optimizedSize,optimizedSizeFormatted:M.optimizedSizeFormatted,savedSize:M.savedSize,savedSizeFormatted:M.savedSizeFormatted,savedPercentage:M.savedPercentage,cdn:M.cdn,isOptimizationEffective:M.isOptimizationEffective,warningMessage:M.warningMessage},D.current=$,R&&R($),M.cdn,M.warningMessage&&console.warn(M.warningMessage),M.isOptimizationEffective):($={originalUrl:e,optimizedUrl:B,originalSize:null,originalSizeFormatted:null,optimizedSize:null,optimizedSizeFormatted:null,savedSize:null,savedSizeFormatted:null,savedPercentage:null,cdn:Be(e),isOptimizationEffective:null,warningMessage:"⚠️ 无法获取图片大小（可能由于CORS限制）"},D.current=$,R&&R($))}catch(M){console.warn("获取图片大小对比失败:",M),$={originalUrl:e,optimizedUrl:B,originalSize:null,originalSizeFormatted:null,optimizedSize:null,optimizedSizeFormatted:null,savedSize:null,savedSizeFormatted:null,savedPercentage:null,cdn:Be(e),isOptimizationEffective:null,warningMessage:`获取图片大小对比失败: ${M.message}`},D.current=$,R&&R($)}x&&x(A,$)},Ie=A=>{if(z)return;const B=A.target.src,$=De(e);if(y&&(B===y||B.includes("videoCover.png"))){Y(!0),W(!1),q&&q(A);return}if(B===$&&$!==e){A.target.src=e;return}if(B===e||$===e){if(y&&B!==y){A.target.src=y;return}Y(!0),W(!1),q&&q(A)}},it=A=>{var B;if(v){const $={src:e,currentSrc:((B=A.target)==null?void 0:B.src)||ge,optimizedSrc:ge,alt:n,dataId:l,isLoaded:z,isLoading:Z,hasError:F,isCompressing:Se,optimizationInfo:D.current,imageElement:A.target};v(A,$)}};U.useEffect(()=>{ze.current=C},[C]);const ue=U.useRef(!1),se=U.useRef(null);U.useEffect(()=>{if(!m){ue.current=!1,se.current=null;return}if(se.current!==e&&(ue.current=!1,se.current=e),ue.current||!e||!G)return;ue.current=!0,ne.current=!0,W(!0);let A=!1;const B=e,$=ze.current||C;return ee.current=()=>{A=!0,ne.current=!1,ue.current=!1},st(B,{stages:$,timeout:p,enableCache:j,onStageComplete:(M,J,ke)=>{if(A||se.current!==B)return;const Me=M+1;requestAnimationFrame(()=>{!A&&se.current===B&&(Ce(Me),le.current=Me,Re(J),S&&S(M,J,ke))})},onComplete:M=>{A||se.current!==B||requestAnimationFrame(()=>{if(!A&&se.current===B){W(!1),Re(M),ne.current=!1;const J=$.length;Ce(J),le.current=J}})},onError:(M,J)=>{A||se.current!==B||(console.warn(`[渐进式加载 ${B.substring(0,20)}...] 阶段 ${J+1} 失败:`,M.message||M),W(!1),ne.current=!1,ue.current=!1,Re(""),Ce(-1),le.current=-1,W(!0))}}).catch(M=>{!A&&se.current===B&&(console.error(`[渐进式加载 ${B.substring(0,20)}...] 加载过程出错:`,M),W(!1),ne.current=!1,ue.current=!1,Re(""),Ce(-1),le.current=-1)}),()=>{A=!0,ne.current=!1,ue.current=!1}},[m,G,e,p,j]),U.useEffect(()=>{m||!m&&G&&!z&&!F&&!Z&&!Se&&!ae&&!de&&e&&(async()=>{try{const B=De(e),$=await Tt(B);if($)return xe($),ce.current=$,!0}catch{}return!1})().then(B=>{if(!B){const $=Be(e);b&&!$&&c&&Object.keys(c).length>0&&typeof window<"u"&&!ye?(be(!0),St(e,{maxWidth:c.width||null,maxHeight:c.height||null,quality:c.quality?c.quality/100:.8,compressionLevel:c.compressionLevel!==void 0?c.compressionLevel:0,blur:c.blur!==void 0?c.blur:0,smooth:c.smooth!==void 0?c.smooth:!0,format:c.format||null}).then(J=>{Ke(J),be(!1),xt(J)}).catch(J=>{console.warn("浏览器端压缩失败，使用原始URL:",J),be(!1)})):W(!0)}})},[G,z,F,Z,Se,e,c,ye,ae,b]),U.useEffect(()=>{ce.current&&(URL.revokeObjectURL(ce.current),ce.current=null),ee.current&&(ee.current(),ee.current=null),V(!1),Y(!1),W(!1),Ee(""),Ke(null),be(!1),xe(null),ee.current&&(ee.current(),ee.current=null),ee.current&&(ee.current(),ee.current=null),Re(""),Ce(-1),le.current=-1,ne.current=!1,ue.current=!1,se.current=null,D.current=null,i?X(!0):Ge()},[e]),U.useEffect(()=>(i?X(!0):Ge(),()=>{P.current&&(P.current.disconnect(),P.current=null),ce.current&&(URL.revokeObjectURL(ce.current),ce.current=null),ee.current&&(ee.current(),ee.current=null)}),[]);const Je={width:typeof r=="number"?`${r}px`:r,height:typeof a=="number"?`${a}px`:a};return H.jsxs("div",{ref:N,className:`image-optimize-container ${s}`.trim(),style:Je,children:[!z&&!F&&!Z&&!ae&&!de&&H.jsx("div",{className:"image-optimize-placeholder",children:g&&H.jsx("svg",{className:"image-optimize-placeholder-icon",width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:H.jsx("path",{d:"M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM13.96 12.29L11.21 15.83L9.25 13.47L6.5 17H17.5L13.96 12.29Z",fill:"currentColor"})})}),(Z||Se)&&!F&&!ae&&!de&&H.jsxs("div",{className:"image-optimize-loading",children:[H.jsx("svg",{className:"image-optimize-loading-icon",width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:H.jsx("circle",{cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"2",fill:"none",strokeDasharray:"62.83",strokeDashoffset:"31.42"})}),Se&&H.jsx("span",{style:{marginTop:"8px",fontSize:"12px",color:"#666"},children:"正在压缩图片..."})]}),G&&ge&&H.jsx("img",{ref:_,src:ge,alt:n,"data-id":l,className:`image-optimize-image ${o}`.trim(),style:{display:z||ae||de||!F&&ge?"block":"none",transition:m?`opacity ${E}ms ease-in-out, filter ${E}ms ease-in-out`:void 0,opacity:m&&pe>=0||z||ae?1:0,filter:m?pe===1?"blur(10px)":pe===2?"blur(3px)":pe>=3?"blur(0px)":"blur(10px)":void 0,...u},onLoad:ot,onError:Ie,onClick:it}),F&&H.jsxs("div",{className:"image-optimize-error",children:[H.jsx("svg",{className:"image-optimize-error-icon",width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:H.jsx("path",{d:"M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z",fill:"currentColor"})}),h&&H.jsx("span",{className:"image-optimize-error-text",children:"加载失败"})]})]})}function Rr({src:e="",alt:n="",width:r="100%",height:a="auto",className:s="",imageClassName:o="",imageStyle:l={},stages:u=[{width:20,quality:20},{width:400,quality:50},{width:null,quality:80}],transitionDuration:i=300,timeout:d=3e4,enableCache:c=!0,showPlaceholder:b=!0,onStageComplete:g=null,onComplete:h=null,onError:y=null,onLoad:m=null}){const[C,E]=U.useState(-1),[p,j]=U.useState(""),[x,R]=U.useState(!1),[q,v]=U.useState(!1),[S,_]=U.useState(""),[N,P]=U.useState(!1),D=U.useRef(null),z=U.useRef(null);U.useEffect(()=>{var Y,G;if(!e)return;const W=vt(e,{width:((Y=u[0])==null?void 0:Y.width)||20,quality:((G=u[0])==null?void 0:G.quality)||20});j(W),E(0),R(!0),v(!1),_(""),P(!1);let F=!1;return st(e,{stages:u,timeout:d,enableCache:c,onStageComplete:(X,ie,Ee)=>{F||(E(X+1),j(ie),g&&g(X,ie,Ee))},onComplete:X=>{F||(R(!1),P(!0),j(X),h&&h(X))},onError:(X,ie)=>{F||(R(!1),v(!0),_(X.message),y&&y(X,ie))}}),()=>{F=!0}},[e,c]);const V={width:typeof r=="number"?`${r}px`:r,height:typeof a=="number"?`${a}px`:a,position:"relative",overflow:"hidden"},Z={width:"100%",height:"100%",objectFit:"cover",transition:`opacity ${i}ms ease-in-out, filter ${i}ms ease-in-out`,opacity:C>=0?1:0,filter:C===0?"blur(10px)":C===1?"blur(3px)":"blur(0px)",...l};return H.jsxs("div",{ref:D,className:`progressive-image-container ${s}`.trim(),style:V,children:[b&&C<0&&!q&&H.jsx("div",{className:"image-optimize-placeholder",style:{position:"absolute",top:0,left:0,width:"100%",height:"100%"},children:H.jsx("svg",{className:"image-optimize-placeholder-icon",width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:H.jsx("path",{d:"M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM13.96 12.29L11.21 15.83L9.25 13.47L6.5 17H17.5L13.96 12.29Z",fill:"currentColor"})})}),p&&H.jsx("img",{ref:z,src:p,alt:n,className:`progressive-image ${o}`.trim(),style:Z,onLoad:W=>{N&&m&&m(W)},onError:W=>{q||(v(!0),_("图片加载失败"),y&&y(new Error("图片加载失败"),C))}}),q&&H.jsxs("div",{style:{position:"absolute",top:0,left:0,width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",backgroundColor:"#f5f5f5",color:"#999",fontSize:"14px"},children:[H.jsx("div",{style:{fontSize:"24px",marginBottom:"8px"},children:"❌"}),H.jsx("div",{children:S||"加载失败"})]}),x&&!q&&C<u.length&&H.jsxs("div",{style:{position:"absolute",bottom:"10px",right:"10px",backgroundColor:"rgba(0, 0, 0, 0.6)",color:"white",padding:"4px 8px",borderRadius:"4px",fontSize:"12px"},children:["阶段 ",C+1," / ",u.length]})]})}exports.DEFAULT_CACHE_EXPIRE_HOURS=He;exports.DEFAULT_DB_NAME=fe;exports.DEFAULT_STORE_NAME_GENERAL=he;exports.LazyImage=Xt;exports.ProgressiveImage=Rr;exports.checkStorageQuota=at;exports.cleanExpiredCache=We;exports.compareImageSizes=Ct;exports.compressImageInBrowser=St;exports.dataURLToBlob=xt;exports.default=Xt;exports.deleteCache=Ue;exports.deleteDatabase=Jt;exports.detectCDN=Be;exports.detectImageFormat=pt;exports.detectSupportedFormats=Fe;exports.formatFileSize=Le;exports.generateBlurPlaceholderUrl=vt;exports.generateResponsiveImage=Vt;exports.generateSizes=tt;exports.generateSrcset=wt;exports.getAllDatabaseNames=_t;exports.getAllDatabasesUsage=Zt;exports.getBestFormat=et;exports.getCache=Ye;exports.getCacheStats=Rt;exports.getImageSize=rt;exports.getOptimizedCoverUrl=Ht;exports.getStorageQuota=Pt;exports.getStoreNames=Dt;exports.hasCache=Gt;exports.loadImageProgressive=Et;exports.loadImageProgressiveWithCache=st;exports.loadImageWithCache=Tt;exports.loadImagesBatch=Yt;exports.loadImagesProgressiveBatch=Kt;exports.loadImagesProgressively=bt;exports.optimizeImageUrl=ve;exports.preloadImage=yt;exports.preloadImages=Qt;exports.setCache=Qe;
