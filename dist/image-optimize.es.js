import ht, { useRef as ie, useState as X, useMemo as Bt, useEffect as Ie } from "react";
function Be() {
  const t = [];
  if (typeof window < "u" && typeof document < "u") {
    const n = (() => {
      try {
        const r = document.createElement("canvas");
        return r.width = 1, r.height = 1, r.toDataURL("image/webp").indexOf("data:image/webp") === 0;
      } catch {
        return !1;
      }
    })();
    (() => {
      try {
        const r = document.createElement("canvas");
        return r.width = 1, r.height = 1, r.toDataURL("image/avif").indexOf("data:image/avif") === 0;
      } catch {
        return !1;
      }
    })() && t.push("avif"), n && t.push("webp");
  }
  return t.push("jpg", "jpeg", "png"), t;
}
function Ge(t = null) {
  const a = Be();
  if (t) {
    const n = t.toLowerCase().replace("jpeg", "jpg");
    if (a.includes(n))
      return n;
  }
  return a[0] || "jpg";
}
function pt(t) {
  if (!t) return null;
  const n = t.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)(\?|$)/i);
  if (n) {
    const o = n[1].toLowerCase();
    return o === "jpeg" ? "jpg" : o;
  }
  try {
    const o = new URL(t), r = o.searchParams.get("format") || o.searchParams.get("f") || o.searchParams.get("image_format");
    if (r)
      return r.toLowerCase().replace("jpeg", "jpg");
  } catch {
  }
  return null;
}
const wt = {
  // 阿里云OSS
  aliyun: {
    test: (t) => t.includes("aliyuncs.com") || t.includes("oss-"),
    process: (t, a) => {
      const { width: n, height: o, quality: r, format: s } = a, c = [];
      return (n || o) && c.push(`resize,w_${n || ""},h_${o || ""},m_lfit`), r && c.push(`quality,q_${r}`), s && c.push(`format,${s}`), c.length > 0 && t.searchParams.set("x-oss-process", c.join("/")), t.toString();
    }
  },
  // 腾讯云COS
  tencent: {
    test: (t) => t.includes("qcloud.com") || t.includes("myqcloud.com"),
    process: (t, a) => {
      const { width: n, height: o, quality: r, format: s } = a, c = [];
      if ((n || o) && c.push(`imageMogr2/thumbnail/${n}x${o}`), r && c.push(`quality/${r}`), s && c.push(`format/${s}`), c.length > 0) {
        const l = c.join("|"), f = t.search ? "|" : "?imageMogr2/";
        return `${t.toString()}${f}${l}`;
      }
      return t.toString();
    }
  },
  // 七牛云
  qiniu: {
    test: (t) => t.includes("qiniucdn.com") || t.includes("qiniu.com"),
    process: (t, a) => {
      const { width: n, height: o, quality: r, format: s } = a, c = [];
      if ((n || o) && c.push(`imageView2/1/w/${n || ""}/h/${o || ""}`), r && c.push(`quality/${r}`), s && c.push(`format/${s}`), c.length > 0) {
        const l = c.join("|"), f = t.search ? "|" : "?";
        return `${t.toString()}${f}${l}`;
      }
      return t.toString();
    }
  },
  // 又拍云
  upyun: {
    test: (t) => t.includes("upaiyun.com") || t.includes("upyun.com"),
    process: (t, a) => {
      const { width: n, height: o, quality: r, format: s } = a, c = [];
      if ((n || o) && c.push(`${n || ""}x${o || ""}`), r && c.push(`quality/${r}`), s && c.push(`format/${s}`), c.length > 0) {
        const l = t.pathname.split("/"), f = l[l.length - 1], g = l.slice(0, -1).join("/") + "/!" + c.join("/") + "/" + f;
        t.pathname = g;
      }
      return t.toString();
    }
  },
  // AWS CloudFront (需要配合 Lambda@Edge 或 CloudFront Functions)
  cloudfront: {
    test: (t) => t.includes("cloudfront.net") || t.includes(".aws"),
    process: (t, a) => {
      const { width: n, height: o, quality: r, format: s } = a;
      return n && t.searchParams.set("w", n), o && t.searchParams.set("h", o), r && t.searchParams.set("q", r), s && t.searchParams.set("f", s), t.toString();
    }
  }
};
function Ce(t, a = {}) {
  if (!t) return t;
  const {
    width: n = null,
    height: o = null,
    quality: r = 30,
    format: s = null,
    autoFormat: c = !0
    // 自动选择最佳格式
  } = a;
  try {
    let l;
    try {
      l = new URL(t);
    } catch {
      if (t.startsWith("/")) {
        const j = typeof window < "u" && window.location ? window.location.origin : "https://example.com";
        l = new URL(t, j);
      } else
        return console.warn("无法解析的图片URL，跳过优化:", t), t;
    }
    let f = s;
    c && !s ? f = Ge() : s && (f = Ge(s));
    for (const [u, j] of Object.entries(wt))
      if (j.test(t))
        return j.process(l, {
          width: n,
          height: o,
          quality: r,
          format: f
        });
    return n && l.searchParams.set("w", n), o && l.searchParams.set("h", o), r && l.searchParams.set("q", r), f && l.searchParams.set("f", f), l.toString();
  } catch (l) {
    return console.warn("图片URL优化失败:", l), t;
  }
}
function yt(t, a = {}) {
  if (!t) return "";
  const {
    widths: n = null,
    // 默认自动生成
    aspectRatio: o = null,
    quality: r = 80,
    format: s = null,
    autoFormat: c = !0
  } = a;
  return (n || [320, 640, 960, 1280, 1920]).map((u) => `${Ce(t, {
    width: u,
    height: o ? Math.round(u / o) : null,
    quality: r,
    format: s,
    autoFormat: c
  })} ${u}w`).join(", ");
}
function Qe(t = {}) {
  const {
    breakpoints: a = [
      "(max-width: 640px) 100vw",
      "(max-width: 1024px) 50vw",
      "33vw"
    ]
  } = t;
  return Array.isArray(a) ? a.join(", ") : a;
}
function Nt(t, a = {}) {
  if (!t) return { src: "", srcset: "", sizes: "" };
  const {
    widths: n = null,
    aspectRatio: o = null,
    quality: r = 80,
    format: s = null,
    autoFormat: c = !0,
    sizes: l = null,
    fallbackWidth: f = 960
    // 默认回退宽度
  } = a, g = yt(t, {
    widths: n,
    aspectRatio: o,
    quality: r,
    format: s,
    autoFormat: c
  }), u = l ? typeof l == "string" ? l : Qe(l) : Qe();
  return {
    src: Ce(t, {
      width: f,
      height: o ? Math.round(f / o) : null,
      quality: r,
      format: s,
      autoFormat: c
    }),
    srcset: g,
    sizes: u
  };
}
function Wt(t) {
  return Ce(t, {
    width: 240,
    // 根据实际显示尺寸调整
    height: 320,
    quality: 75
  });
}
function vt(t) {
  return new Promise((a) => {
    if (!t) {
      a(!1);
      return;
    }
    const n = new Image();
    n.onload = () => a(!0), n.onerror = () => a(!1), n.src = t;
  });
}
async function Vt(t, a = 3) {
  const n = [], o = [...t], r = async () => {
    for (; o.length > 0; ) {
      const c = o.shift(), l = await vt(c);
      n.push({ url: c, success: l });
    }
  }, s = Array(Math.min(a, t.length)).fill(null).map(() => r());
  return await Promise.all(s), n;
}
async function bt(t, a = {}) {
  const {
    concurrency: n = 10,
    // 默认高并发
    timeout: o = 3e4,
    // 30秒超时
    priority: r = !0,
    // 默认按优先级
    stages: s = null,
    // 渐进式加载阶段（可选）
    enableCache: c = !0,
    // 是否启用缓存（默认true）
    urlTransformer: l = null,
    // URL转换函数（用于自定义URL生成逻辑）
    onStageError: f = null,
    // 阶段错误回调（用于处理错误并返回降级URL）
    onProgress: g = null,
    onItemComplete: u = null,
    onItemStageComplete: j = null,
    // 阶段完成回调
    retryOnError: w = !1,
    maxRetries: p = 1
  } = a, y = t.map((v, T) => typeof v == "string" ? { url: v, priority: 0, index: T } : {
    url: v.url || v.src || "",
    priority: v.priority || 0,
    index: v.index !== void 0 ? v.index : T
  });
  r && y.sort((v, T) => T.priority - v.priority);
  const R = new Array(y.length);
  let k = 0;
  const h = y.length, d = async (v, T = 0) => {
    const { url: z, index: D } = v;
    if (!z) {
      const b = {
        url: "",
        success: !1,
        error: new Error("图片URL为空"),
        index: D,
        retries: T
      };
      return R[D] = b, k++, g && g(k, h, b), u && u(b), b;
    }
    if (s && Array.isArray(s) && s.length > 0) {
      const { loadImageProgressiveWithCache: x } = await Promise.resolve().then(() => tr);
      return x(z, {
        stages: s,
        timeout: o,
        enableCache: c,
        // 传递缓存开关
        urlTransformer: l,
        // 传递URL转换函数
        onStageError: f,
        // 传递阶段错误回调
        onStageComplete: (b, $, K) => {
          j && j({
            url: z,
            index: D,
            stageIndex: b,
            stageUrl: $,
            stage: K,
            currentStage: b + 1,
            totalStages: s.length
          }, b);
        },
        onComplete: (b) => {
        },
        onError: (b, $) => {
        }
      }).then((b) => {
        const $ = {
          url: b.url,
          success: b.success,
          error: b.error,
          index: D,
          retries: T,
          stages: b.stages,
          fromCache: b.fromCache || !1
          // 标记是否来自缓存
        };
        return R[D] = $, k++, g && g(k, h, $), u && u($), $;
      });
    }
    return new Promise((x) => {
      const b = new Image();
      let $ = !1, K = null;
      const ee = () => {
        K && (clearTimeout(K), K = null), b.onload = null, b.onerror = null, b.src = "";
      }, N = (B, H = null) => {
        if ($) return null;
        $ = !0, ee();
        const J = {
          url: z,
          success: B,
          error: H,
          index: D,
          retries: T
        };
        return R[D] = J, k++, g && g(k, h, J), u && u(J), J;
      };
      K = setTimeout(() => {
        const B = new Error(`图片加载超时 (${o}ms)`), H = N(!1, B);
        w && T < p ? setTimeout(() => {
          d(v, T + 1).then(x);
        }, 1e3 * (T + 1)) : x(H);
      }, o), b.onload = () => {
        const B = N(!0, null);
        B && x(B);
      }, b.onerror = (B) => {
        const H = new Error("图片加载失败");
        H.originalEvent = B;
        const J = N(!1, H);
        w && T < p ? setTimeout(() => {
          d(v, T + 1).then(x);
        }, 1e3 * (T + 1)) : x(J);
      };
      try {
        b.crossOrigin = "anonymous", b.src = z;
      } catch (B) {
        const H = N(!1, B);
        H && x(H);
      }
    });
  }, E = [...y], C = /* @__PURE__ */ new Set(), I = [];
  return await (async () => {
    for (; E.length > 0 || C.size > 0; ) {
      for (; E.length > 0 && C.size < n; ) {
        const v = E.shift(), T = d(v).then((z) => (C.delete(T), z)).catch((z) => {
          C.delete(T);
          const D = {
            url: v.url,
            success: !1,
            error: z instanceof Error ? z : new Error(String(z)),
            index: v.index,
            retries: 0
          };
          return R[v.index] = D, k++, g && g(k, h, D), u && u(D), D;
        });
        C.add(T), I.push(T);
      }
      C.size > 0 && await Promise.race(Array.from(C));
    }
  })(), await Promise.all(I), R;
}
async function Ht(t, a = {}) {
  return bt(t, {
    priority: !1,
    // 批量加载不需要优先级
    ...a
  });
}
function Et(t, a = {}) {
  if (!t) return t;
  const {
    width: n = 20,
    height: o = null,
    quality: r = 20,
    blur: s = 10
  } = a;
  return Ce(t, {
    width: n,
    height: o,
    quality: r,
    format: "jpg"
    // 使用 jpg 格式，文件更小
  });
}
async function St(t, a = {}) {
  var j;
  const {
    stages: n = [
      { width: 20, quality: 20, blur: 10 },
      // 阶段1: 极速模糊图
      { width: 400, quality: 50, blur: 3 },
      // 阶段2: 中等质量
      { width: null, quality: 80, blur: 0 }
      // 阶段3: 最终质量（原图）
    ],
    timeout: o = 3e4,
    urlTransformer: r = null,
    onStageComplete: s = null,
    onStageError: c = null,
    onComplete: l = null,
    onError: f = null
  } = a;
  if (!t) {
    const w = new Error("图片URL为空");
    return f && f(w, -1), {
      url: "",
      stages: [],
      success: !1,
      error: w
    };
  }
  const g = [];
  let u = t;
  try {
    for (let p = 0; p < n.length; p++) {
      const y = n[p];
      let R;
      r && typeof r == "function" ? R = r(t, y, p) : p === n.length - 1 && !y.width && !y.height ? R = t : R = Ce(t, {
        width: y.width || null,
        height: y.height || null,
        quality: y.quality || 80,
        format: y.format || null,
        autoFormat: y.autoFormat !== !1
      });
      let k;
      try {
        k = await new Promise((h, d) => {
          const E = new Image();
          let C = null, I = !1;
          const L = () => {
            C && (clearTimeout(C), C = null), E.onload = null, E.onerror = null, E.src = "";
          };
          C = setTimeout(() => {
            if (!I) {
              I = !0, L();
              const v = new Error(`阶段 ${p + 1} 加载超时: ${R}`);
              d(v);
            }
          }, o), E.onload = () => {
            I || (I = !0, L(), h({
              url: R,
              stage: y,
              loaded: !0
            }));
          }, E.onerror = (v) => {
            if (!I) {
              I = !0, L();
              let T = `阶段 ${p + 1} 加载失败`;
              try {
                if (v.target && v.target.src) {
                  const D = v.target.src;
                  T = `阶段 ${p + 1} 加载失败`;
                }
              } catch {
              }
              const z = new Error(T);
              z.originalEvent = v, z.stageUrl = R, z.stageIndex = p, d(z);
            }
          };
          try {
            E.crossOrigin = "anonymous", E.src = R;
          } catch (v) {
            I || (I = !0, L(), d(v));
          }
        }), g.push(k), u = R, s && s(p, R, y);
      } catch (h) {
        let d = null;
        if (c && typeof c == "function")
          try {
            d = c(h, p, R, y);
          } catch {
          }
        if (d && typeof d == "string")
          try {
            const C = await new Promise((I, L) => {
              const v = new Image();
              let T = null, z = !1;
              const D = () => {
                T && (clearTimeout(T), T = null), v.onload = null, v.onerror = null, v.src = "";
              };
              T = setTimeout(() => {
                z || (z = !0, D(), L(new Error(`降级URL加载超时: ${d}`)));
              }, o), v.onload = () => {
                z || (z = !0, D(), I({
                  url: d,
                  stage: y,
                  loaded: !0
                }));
              }, v.onerror = () => {
                z || (z = !0, D(), L(new Error(`降级URL加载失败: ${d}`)));
              };
              try {
                v.crossOrigin = "anonymous", v.src = d;
              } catch (x) {
                z || (z = !0, D(), L(x));
              }
            });
            g.push(C), u = d, s && s(p, d, y);
            break;
          } catch {
          }
        const E = h.message.includes("404") || h.originalEvent && h.originalEvent.type === "error";
        if ((!E || process.env.NODE_ENV === "development") && (E || console.warn(`⚠️ 阶段 ${p + 1} 加载失败，跳过继续下一阶段:`, h.message)), g.push({
          url: R,
          stage: y,
          loaded: !1,
          error: h
        }), p === n.length - 1 && g.length > 0) {
          for (let C = g.length - 1; C >= 0; C--)
            if (g[C].loaded) {
              u = g[C].url;
              break;
            }
        }
        if (s && s(p, R, y), !(p < n.length - 1)) {
          if (!g.some((C) => C.loaded))
            throw new Error(`所有阶段加载失败，最后一个错误: ${h.message}`);
        }
      }
      p < n.length - 1 && await new Promise((h) => setTimeout(h, 100));
    }
    if (!g.some((p) => p.loaded)) {
      const p = ((j = g[g.length - 1]) == null ? void 0 : j.error) || new Error("所有阶段加载失败"), y = p.message.includes("404") || p.originalEvent && p.originalEvent.type === "error";
      return (!y || process.env.NODE_ENV === "development") && (y || console.error(`❌ 图片加载失败: ${t.substring(0, 50)}...`, p.message)), f && f(p, g.length - 1), {
        url: u || t,
        stages: g,
        success: !1,
        error: p
      };
    }
    return l && l(u), {
      url: u,
      stages: g,
      success: !0,
      error: null
    };
  } catch (w) {
    const p = g.length, y = w.message && w.message.includes("404");
    return (!y || process.env.NODE_ENV === "development") && (y || console.error(`❌ 渐进式加载过程出错: ${t.substring(0, 50)}...`, w.message || w)), f && f(w, p), {
      url: u || t,
      stages: g,
      success: !1,
      error: w
    };
  }
}
async function Yt(t, a = {}) {
  const {
    stages: n = [
      { width: 20, quality: 20, blur: 10 },
      { width: 400, quality: 50, blur: 3 },
      { width: null, quality: 80, blur: 0 }
    ],
    concurrency: o = 5,
    // 渐进式加载建议较低并发，避免网络拥塞
    timeout: r = 3e4,
    onProgress: s = null,
    onItemStageComplete: c = null,
    onItemComplete: l = null
  } = a, f = t.map((h, d) => typeof h == "string" ? { url: h, index: d } : {
    url: h.url || h.src || "",
    index: h.index !== void 0 ? h.index : d
  }), g = new Array(f.length);
  let u = 0;
  const j = f.length, w = async (h) => {
    const { url: d, index: E } = h, C = await St(d, {
      stages: n,
      timeout: r,
      onStageComplete: (I, L, v) => {
        c && c({
          url: d,
          index: E,
          stageIndex: I,
          stageUrl: L,
          stage: v,
          currentStage: I + 1,
          totalStages: n.length
        }, I);
      },
      onComplete: (I) => {
      },
      onError: (I, L) => {
      }
    });
    return g[E] = C, u++, s && s(u, j, C), l && l(C), C;
  }, p = [...f], y = /* @__PURE__ */ new Set(), R = [];
  return await (async () => {
    for (; p.length > 0 || y.size > 0; ) {
      for (; p.length > 0 && y.size < o; ) {
        const h = p.shift(), d = w(h).then((E) => (y.delete(d), E)).catch((E) => {
          y.delete(d);
          const C = {
            url: h.url,
            stages: [],
            success: !1,
            error: E instanceof Error ? E : new Error(String(E))
          };
          return g[h.index] = C, u++, s && s(u, j, C), l && l(C), C;
        });
        y.add(d), R.push(d);
      }
      y.size > 0 && await Promise.race(Array.from(y));
    }
  })(), await Promise.all(R), g;
}
async function Rt(t, a = {}) {
  const {
    maxWidth: n = null,
    maxHeight: o = null,
    quality: r = 0.8,
    compressionLevel: s = 0.5,
    // 压缩程度 0-1
    blur: c = 0,
    // 模糊程度 0-10
    smooth: l = !0,
    // 图像平滑
    format: f = null
  } = a;
  if (typeof window > "u" || typeof document > "u")
    throw new Error("浏览器端压缩功能仅在浏览器环境中可用");
  return new Promise((g, u) => {
    const j = new Image();
    if (j.crossOrigin = "anonymous", j.onload = () => {
      try {
        let { width: w, height: p } = j, y = w, R = p, k = !1;
        if (n || o) {
          const x = Math.min(
            n ? n / w : 1,
            o ? o / p : 1
          );
          x < 1 && (y = Math.round(w * x), R = Math.round(p * x), k = !0);
        }
        let h = y, d = R;
        if (s > 0) {
          const x = 1 - s * 0.75;
          h = Math.round(y * x), d = Math.round(R * x);
        }
        const E = h !== w || d !== p;
        if (!(E || s > 0 || c > 0) && typeof t == "string") {
          g(t);
          return;
        }
        const I = document.createElement("canvas");
        I.width = h, I.height = d;
        const L = I.getContext("2d");
        if (E ? (L.imageSmoothingEnabled = l, L.imageSmoothingQuality = l ? "high" : "low") : L.imageSmoothingEnabled = !1, L.drawImage(j, 0, 0, h, d), c > 0) {
          const x = document.createElement("canvas"), b = x.getContext("2d");
          if (x.width = h, x.height = d, b.drawImage(j, 0, 0, h, d), b.filter !== void 0)
            try {
              b.filter = `blur(${c}px)`, b.drawImage(x, 0, 0), b.filter = "none", L.clearRect(0, 0, I.width, I.height), L.drawImage(x, 0, 0);
            } catch {
              dt(L, x, h, d, c);
            }
          else
            dt(L, x, h, d, c);
        }
        let v = f;
        if (!v)
          if (s > 0 || c > 0 || E)
            v = Be().includes("webp") ? "webp" : "jpeg";
          else {
            const b = pt(t);
            b && ["jpg", "jpeg", "png"].includes(b) ? v = b === "jpeg" ? "jpeg" : b : v = Be().includes("webp") ? "webp" : "jpeg";
          }
        let T = r;
        s > 0 ? (T = r * (1 - s * 0.7), T = Math.max(0.1, Math.min(1, T))) : !E && c === 0 ? T = Math.max(r, 0.98) : E && (T = Math.max(r, 0.92));
        const z = v === "webp" ? "image/webp" : v === "png" ? "image/png" : "image/jpeg", D = I.toDataURL(z, T);
        g(D);
      } catch (w) {
        u(new Error("图片压缩失败: " + w.message));
      }
    }, j.onerror = () => {
      u(new Error("图片加载失败"));
    }, typeof t == "string")
      j.src = t;
    else if (t instanceof File || t instanceof Blob) {
      const w = new FileReader();
      w.onload = (p) => {
        j.src = p.target.result;
      }, w.onerror = () => u(new Error("文件读取失败")), w.readAsDataURL(t);
    } else
      u(new Error("不支持的图片源类型"));
  });
}
function dt(t, a, n, o, r) {
  const s = document.createElement("canvas"), c = s.getContext("2d"), l = Math.max(0.3, 1 - r / 10), f = Math.round(n * l), g = Math.round(o * l);
  s.width = f, s.height = g, c.drawImage(a, 0, 0, n, o, 0, 0, f, g), t.clearRect(0, 0, n, o), t.drawImage(s, 0, 0, f, g, 0, 0, n, o);
}
function xt(t) {
  const a = t.split(","), n = a[0].match(/:(.*?);/)[1], o = atob(a[1]);
  let r = o.length;
  const s = new Uint8Array(r);
  for (; r--; )
    s[r] = o.charCodeAt(r);
  return new Blob([s], { type: n });
}
async function Xe(t) {
  if (!t) return null;
  try {
    if (t.startsWith("blob:"))
      return (await (await fetch(t)).blob()).size;
    if (t.startsWith("data:")) {
      const o = t.split(",")[1];
      if (o) {
        const r = atob(o);
        return new Blob([r]).size;
      }
      return null;
    }
    try {
      const r = (await fetch(t, { method: "HEAD" })).headers.get("Content-Length");
      if (r)
        return parseInt(r, 10);
    } catch {
    }
    return (await (await fetch(t)).blob()).size;
  } catch {
    return null;
  }
}
function Ae(t) {
  if (t == null) return "未知";
  if (t === 0) return "0 B";
  const a = 1024, n = ["B", "KB", "MB", "GB"], o = Math.floor(Math.log(t) / Math.log(a));
  return parseFloat((t / Math.pow(a, o)).toFixed(2)) + " " + n[o];
}
function Te(t) {
  if (!t) return null;
  for (const [a, n] of Object.entries(wt))
    if (n.test(t))
      return a;
  return null;
}
async function Ct(t, a) {
  const [n, o] = await Promise.all([
    Xe(t),
    Xe(a)
  ]);
  let r = null, s = null, c = !1, l = null;
  return n !== null && o !== null && (r = n - o, s = parseFloat((r / n * 100).toFixed(2)), c = r > 1024 || s > 1, !c && r === 0 ? Te(t) ? l = "⚠️ 优化参数可能无效，图片大小未发生变化。请检查CDN配置是否正确。" : l = "⚠️ 该图片URL不是支持的CDN，通用查询参数可能无效。支持的CDN：阿里云OSS、腾讯云COS、七牛云、又拍云、AWS CloudFront。" : !c && r > 0 && s <= 1 && (l = `⚠️ 优化效果不明显（仅节省 ${s}%），可能优化参数未生效。`)), {
    originalUrl: t,
    optimizedUrl: a,
    originalSize: n,
    optimizedSize: o,
    savedSize: r,
    savedPercentage: s,
    isOptimizationEffective: c,
    warningMessage: l,
    originalSizeFormatted: Ae(n),
    optimizedSizeFormatted: Ae(o),
    savedSizeFormatted: Ae(r),
    cdn: Te(t)
  };
}
const Kt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  compareImageSizes: Ct,
  compressImageInBrowser: Rt,
  dataURLToBlob: xt,
  detectCDN: Te,
  detectImageFormat: pt,
  detectSupportedFormats: Be,
  formatFileSize: Ae,
  generateBlurPlaceholderUrl: Et,
  generateResponsiveImage: Nt,
  generateSizes: Qe,
  generateSrcset: yt,
  getBestFormat: Ge,
  getImageSize: Xe,
  getOptimizedCoverUrl: Wt,
  loadImageProgressive: St,
  loadImagesBatch: Ht,
  loadImagesProgressiveBatch: Yt,
  loadImagesProgressively: bt,
  optimizeImageUrl: Ce,
  preloadImage: vt,
  preloadImages: Vt
}, Symbol.toStringTag, { value: "Module" }));
var et = { exports: {} }, Fe = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var mt;
function Jt() {
  if (mt) return Fe;
  mt = 1;
  var t = ht, a = Symbol.for("react.element"), n = Symbol.for("react.fragment"), o = Object.prototype.hasOwnProperty, r = t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, s = { key: !0, ref: !0, __self: !0, __source: !0 };
  function c(l, f, g) {
    var u, j = {}, w = null, p = null;
    g !== void 0 && (w = "" + g), f.key !== void 0 && (w = "" + f.key), f.ref !== void 0 && (p = f.ref);
    for (u in f) o.call(f, u) && !s.hasOwnProperty(u) && (j[u] = f[u]);
    if (l && l.defaultProps) for (u in f = l.defaultProps, f) j[u] === void 0 && (j[u] = f[u]);
    return { $$typeof: a, type: l, key: w, ref: p, props: j, _owner: r.current };
  }
  return Fe.Fragment = n, Fe.jsx = c, Fe.jsxs = c, Fe;
}
var Le = {};
/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var gt;
function Zt() {
  return gt || (gt = 1, process.env.NODE_ENV !== "production" && function() {
    var t = ht, a = Symbol.for("react.element"), n = Symbol.for("react.portal"), o = Symbol.for("react.fragment"), r = Symbol.for("react.strict_mode"), s = Symbol.for("react.profiler"), c = Symbol.for("react.provider"), l = Symbol.for("react.context"), f = Symbol.for("react.forward_ref"), g = Symbol.for("react.suspense"), u = Symbol.for("react.suspense_list"), j = Symbol.for("react.memo"), w = Symbol.for("react.lazy"), p = Symbol.for("react.offscreen"), y = Symbol.iterator, R = "@@iterator";
    function k(e) {
      if (e === null || typeof e != "object")
        return null;
      var i = y && e[y] || e[R];
      return typeof i == "function" ? i : null;
    }
    var h = t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    function d(e) {
      {
        for (var i = arguments.length, m = new Array(i > 1 ? i - 1 : 0), S = 1; S < i; S++)
          m[S - 1] = arguments[S];
        E("error", e, m);
      }
    }
    function E(e, i, m) {
      {
        var S = h.ReactDebugCurrentFrame, q = S.getStackAddendum();
        q !== "" && (i += "%s", m = m.concat([q]));
        var A = m.map(function(F) {
          return String(F);
        });
        A.unshift("Warning: " + i), Function.prototype.apply.call(console[e], console, A);
      }
    }
    var C = !1, I = !1, L = !1, v = !1, T = !1, z;
    z = Symbol.for("react.module.reference");
    function D(e) {
      return !!(typeof e == "string" || typeof e == "function" || e === o || e === s || T || e === r || e === g || e === u || v || e === p || C || I || L || typeof e == "object" && e !== null && (e.$$typeof === w || e.$$typeof === j || e.$$typeof === c || e.$$typeof === l || e.$$typeof === f || // This needs to include all possible module reference object
      // types supported by any Flight configuration anywhere since
      // we don't know which Flight build this will end up being used
      // with.
      e.$$typeof === z || e.getModuleId !== void 0));
    }
    function x(e, i, m) {
      var S = e.displayName;
      if (S)
        return S;
      var q = i.displayName || i.name || "";
      return q !== "" ? m + "(" + q + ")" : m;
    }
    function b(e) {
      return e.displayName || "Context";
    }
    function $(e) {
      if (e == null)
        return null;
      if (typeof e.tag == "number" && d("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), typeof e == "function")
        return e.displayName || e.name || null;
      if (typeof e == "string")
        return e;
      switch (e) {
        case o:
          return "Fragment";
        case n:
          return "Portal";
        case s:
          return "Profiler";
        case r:
          return "StrictMode";
        case g:
          return "Suspense";
        case u:
          return "SuspenseList";
      }
      if (typeof e == "object")
        switch (e.$$typeof) {
          case l:
            var i = e;
            return b(i) + ".Consumer";
          case c:
            var m = e;
            return b(m._context) + ".Provider";
          case f:
            return x(e, e.render, "ForwardRef");
          case j:
            var S = e.displayName || null;
            return S !== null ? S : $(e.type) || "Memo";
          case w: {
            var q = e, A = q._payload, F = q._init;
            try {
              return $(F(A));
            } catch {
              return null;
            }
          }
        }
      return null;
    }
    var K = Object.assign, ee = 0, N, B, H, J, Q, ce, ye;
    function pe() {
    }
    pe.__reactDisabledLog = !0;
    function ke() {
      {
        if (ee === 0) {
          N = console.log, B = console.info, H = console.warn, J = console.error, Q = console.group, ce = console.groupCollapsed, ye = console.groupEnd;
          var e = {
            configurable: !0,
            enumerable: !0,
            value: pe,
            writable: !0
          };
          Object.defineProperties(console, {
            info: e,
            log: e,
            warn: e,
            error: e,
            group: e,
            groupCollapsed: e,
            groupEnd: e
          });
        }
        ee++;
      }
    }
    function ve() {
      {
        if (ee--, ee === 0) {
          var e = {
            configurable: !0,
            enumerable: !0,
            writable: !0
          };
          Object.defineProperties(console, {
            log: K({}, e, {
              value: N
            }),
            info: K({}, e, {
              value: B
            }),
            warn: K({}, e, {
              value: H
            }),
            error: K({}, e, {
              value: J
            }),
            group: K({}, e, {
              value: Q
            }),
            groupCollapsed: K({}, e, {
              value: ce
            }),
            groupEnd: K({}, e, {
              value: ye
            })
          });
        }
        ee < 0 && d("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
      }
    }
    var we = h.ReactCurrentDispatcher, oe;
    function be(e, i, m) {
      {
        if (oe === void 0)
          try {
            throw Error();
          } catch (q) {
            var S = q.stack.trim().match(/\n( *(at )?)/);
            oe = S && S[1] || "";
          }
        return `
` + oe + e;
      }
    }
    var ue = !1, he;
    {
      var Ee = typeof WeakMap == "function" ? WeakMap : Map;
      he = new Ee();
    }
    function me(e, i) {
      if (!e || ue)
        return "";
      {
        var m = he.get(e);
        if (m !== void 0)
          return m;
      }
      var S;
      ue = !0;
      var q = Error.prepareStackTrace;
      Error.prepareStackTrace = void 0;
      var A;
      A = we.current, we.current = null, ke();
      try {
        if (i) {
          var F = function() {
            throw Error();
          };
          if (Object.defineProperty(F.prototype, "props", {
            set: function() {
              throw Error();
            }
          }), typeof Reflect == "object" && Reflect.construct) {
            try {
              Reflect.construct(F, []);
            } catch (ne) {
              S = ne;
            }
            Reflect.construct(e, [], F);
          } else {
            try {
              F.call();
            } catch (ne) {
              S = ne;
            }
            e.call(F.prototype);
          }
        } else {
          try {
            throw Error();
          } catch (ne) {
            S = ne;
          }
          e();
        }
      } catch (ne) {
        if (ne && S && typeof ne.stack == "string") {
          for (var O = ne.stack.split(`
`), re = S.stack.split(`
`), V = O.length - 1, Y = re.length - 1; V >= 1 && Y >= 0 && O[V] !== re[Y]; )
            Y--;
          for (; V >= 1 && Y >= 0; V--, Y--)
            if (O[V] !== re[Y]) {
              if (V !== 1 || Y !== 1)
                do
                  if (V--, Y--, Y < 0 || O[V] !== re[Y]) {
                    var le = `
` + O[V].replace(" at new ", " at ");
                    return e.displayName && le.includes("<anonymous>") && (le = le.replace("<anonymous>", e.displayName)), typeof e == "function" && he.set(e, le), le;
                  }
                while (V >= 1 && Y >= 0);
              break;
            }
        }
      } finally {
        ue = !1, we.current = A, ve(), Error.prepareStackTrace = q;
      }
      var je = e ? e.displayName || e.name : "", xe = je ? be(je) : "";
      return typeof e == "function" && he.set(e, xe), xe;
    }
    function Se(e, i, m) {
      return me(e, !1);
    }
    function te(e) {
      var i = e.prototype;
      return !!(i && i.isReactComponent);
    }
    function fe(e, i, m) {
      if (e == null)
        return "";
      if (typeof e == "function")
        return me(e, te(e));
      if (typeof e == "string")
        return be(e);
      switch (e) {
        case g:
          return be("Suspense");
        case u:
          return be("SuspenseList");
      }
      if (typeof e == "object")
        switch (e.$$typeof) {
          case f:
            return Se(e.render);
          case j:
            return fe(e.type, i, m);
          case w: {
            var S = e, q = S._payload, A = S._init;
            try {
              return fe(A(q), i, m);
            } catch {
            }
          }
        }
      return "";
    }
    var ae = Object.prototype.hasOwnProperty, ze = {}, Re = h.ReactDebugCurrentFrame;
    function ge(e) {
      if (e) {
        var i = e._owner, m = fe(e.type, e._source, i ? i.type : null);
        Re.setExtraStackFrame(m);
      } else
        Re.setExtraStackFrame(null);
    }
    function qe(e, i, m, S, q) {
      {
        var A = Function.call.bind(ae);
        for (var F in e)
          if (A(e, F)) {
            var O = void 0;
            try {
              if (typeof e[F] != "function") {
                var re = Error((S || "React class") + ": " + m + " type `" + F + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof e[F] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                throw re.name = "Invariant Violation", re;
              }
              O = e[F](i, F, S, m, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
            } catch (V) {
              O = V;
            }
            O && !(O instanceof Error) && (ge(q), d("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", S || "React class", m, F, typeof O), ge(null)), O instanceof Error && !(O.message in ze) && (ze[O.message] = !0, ge(q), d("Failed %s type: %s", m, O.message), ge(null));
          }
      }
    }
    var We = Array.isArray;
    function Oe(e) {
      return We(e);
    }
    function Ve(e) {
      {
        var i = typeof Symbol == "function" && Symbol.toStringTag, m = i && e[Symbol.toStringTag] || e.constructor.name || "Object";
        return m;
      }
    }
    function de(e) {
      try {
        return se(e), !1;
      } catch {
        return !0;
      }
    }
    function se(e) {
      return "" + e;
    }
    function De(e) {
      if (de(e))
        return d("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", Ve(e)), se(e);
    }
    var U = h.ReactCurrentOwner, P = {
      key: !0,
      ref: !0,
      __self: !0,
      __source: !0
    }, M, _;
    function Z(e) {
      if (ae.call(e, "ref")) {
        var i = Object.getOwnPropertyDescriptor(e, "ref").get;
        if (i && i.isReactWarning)
          return !1;
      }
      return e.ref !== void 0;
    }
    function $e(e) {
      if (ae.call(e, "key")) {
        var i = Object.getOwnPropertyDescriptor(e, "key").get;
        if (i && i.isReactWarning)
          return !1;
      }
      return e.key !== void 0;
    }
    function Pe(e, i) {
      typeof e.ref == "string" && U.current;
    }
    function He(e, i) {
      {
        var m = function() {
          M || (M = !0, d("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", i));
        };
        m.isReactWarning = !0, Object.defineProperty(e, "key", {
          get: m,
          configurable: !0
        });
      }
    }
    function It(e, i) {
      {
        var m = function() {
          _ || (_ = !0, d("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", i));
        };
        m.isReactWarning = !0, Object.defineProperty(e, "ref", {
          get: m,
          configurable: !0
        });
      }
    }
    var Tt = function(e, i, m, S, q, A, F) {
      var O = {
        // This tag allows us to uniquely identify this as a React Element
        $$typeof: a,
        // Built-in properties that belong on the element
        type: e,
        key: i,
        ref: m,
        props: F,
        // Record the component responsible for creating this element.
        _owner: A
      };
      return O._store = {}, Object.defineProperty(O._store, "validated", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: !1
      }), Object.defineProperty(O, "_self", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: S
      }), Object.defineProperty(O, "_source", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: q
      }), Object.freeze && (Object.freeze(O.props), Object.freeze(O)), O;
    };
    function zt(e, i, m, S, q) {
      {
        var A, F = {}, O = null, re = null;
        m !== void 0 && (De(m), O = "" + m), $e(i) && (De(i.key), O = "" + i.key), Z(i) && (re = i.ref, Pe(i, q));
        for (A in i)
          ae.call(i, A) && !P.hasOwnProperty(A) && (F[A] = i[A]);
        if (e && e.defaultProps) {
          var V = e.defaultProps;
          for (A in V)
            F[A] === void 0 && (F[A] = V[A]);
        }
        if (O || re) {
          var Y = typeof e == "function" ? e.displayName || e.name || "Unknown" : e;
          O && He(F, Y), re && It(F, Y);
        }
        return Tt(e, O, re, q, S, U.current, F);
      }
    }
    var Ye = h.ReactCurrentOwner, at = h.ReactDebugCurrentFrame;
    function _e(e) {
      if (e) {
        var i = e._owner, m = fe(e.type, e._source, i ? i.type : null);
        at.setExtraStackFrame(m);
      } else
        at.setExtraStackFrame(null);
    }
    var Ke;
    Ke = !1;
    function Je(e) {
      return typeof e == "object" && e !== null && e.$$typeof === a;
    }
    function st() {
      {
        if (Ye.current) {
          var e = $(Ye.current.type);
          if (e)
            return `

Check the render method of \`` + e + "`.";
        }
        return "";
      }
    }
    function Ot(e) {
      return "";
    }
    var it = {};
    function $t(e) {
      {
        var i = st();
        if (!i) {
          var m = typeof e == "string" ? e : e.displayName || e.name;
          m && (i = `

Check the top-level render call using <` + m + ">.");
        }
        return i;
      }
    }
    function lt(e, i) {
      {
        if (!e._store || e._store.validated || e.key != null)
          return;
        e._store.validated = !0;
        var m = $t(i);
        if (it[m])
          return;
        it[m] = !0;
        var S = "";
        e && e._owner && e._owner !== Ye.current && (S = " It was passed a child from " + $(e._owner.type) + "."), _e(e), d('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', m, S), _e(null);
      }
    }
    function ct(e, i) {
      {
        if (typeof e != "object")
          return;
        if (Oe(e))
          for (var m = 0; m < e.length; m++) {
            var S = e[m];
            Je(S) && lt(S, i);
          }
        else if (Je(e))
          e._store && (e._store.validated = !0);
        else if (e) {
          var q = k(e);
          if (typeof q == "function" && q !== e.entries)
            for (var A = q.call(e), F; !(F = A.next()).done; )
              Je(F.value) && lt(F.value, i);
        }
      }
    }
    function Ft(e) {
      {
        var i = e.type;
        if (i == null || typeof i == "string")
          return;
        var m;
        if (typeof i == "function")
          m = i.propTypes;
        else if (typeof i == "object" && (i.$$typeof === f || // Note: Memo only checks outer props here.
        // Inner props are checked in the reconciler.
        i.$$typeof === j))
          m = i.propTypes;
        else
          return;
        if (m) {
          var S = $(i);
          qe(m, e.props, "prop", S, e);
        } else if (i.PropTypes !== void 0 && !Ke) {
          Ke = !0;
          var q = $(i);
          d("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", q || "Unknown");
        }
        typeof i.getDefaultProps == "function" && !i.getDefaultProps.isReactClassApproved && d("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
      }
    }
    function Lt(e) {
      {
        for (var i = Object.keys(e.props), m = 0; m < i.length; m++) {
          var S = i[m];
          if (S !== "children" && S !== "key") {
            _e(e), d("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", S), _e(null);
            break;
          }
        }
        e.ref !== null && (_e(e), d("Invalid attribute `ref` supplied to `React.Fragment`."), _e(null));
      }
    }
    var ut = {};
    function ft(e, i, m, S, q, A) {
      {
        var F = D(e);
        if (!F) {
          var O = "";
          (e === void 0 || typeof e == "object" && e !== null && Object.keys(e).length === 0) && (O += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
          var re = Ot();
          re ? O += re : O += st();
          var V;
          e === null ? V = "null" : Oe(e) ? V = "array" : e !== void 0 && e.$$typeof === a ? (V = "<" + ($(e.type) || "Unknown") + " />", O = " Did you accidentally export a JSX literal instead of a component?") : V = typeof e, d("React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", V, O);
        }
        var Y = zt(e, i, m, q, A);
        if (Y == null)
          return Y;
        if (F) {
          var le = i.children;
          if (le !== void 0)
            if (S)
              if (Oe(le)) {
                for (var je = 0; je < le.length; je++)
                  ct(le[je], e);
                Object.freeze && Object.freeze(le);
              } else
                d("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
            else
              ct(le, e);
        }
        if (ae.call(i, "key")) {
          var xe = $(e), ne = Object.keys(i).filter(function(At) {
            return At !== "key";
          }), Ze = ne.length > 0 ? "{key: someKey, " + ne.join(": ..., ") + ": ...}" : "{key: someKey}";
          if (!ut[xe + Ze]) {
            var Mt = ne.length > 0 ? "{" + ne.join(": ..., ") + ": ...}" : "{}";
            d(`A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`, Ze, xe, Mt, xe), ut[xe + Ze] = !0;
          }
        }
        return e === o ? Lt(Y) : Ft(Y), Y;
      }
    }
    function Ut(e, i, m) {
      return ft(e, i, m, !0);
    }
    function kt(e, i, m) {
      return ft(e, i, m, !1);
    }
    var qt = kt, Dt = Ut;
    Le.Fragment = o, Le.jsx = qt, Le.jsxs = Dt;
  }()), Le;
}
process.env.NODE_ENV === "production" ? et.exports = Jt() : et.exports = Zt();
var W = et.exports;
const Gt = "ImageOptimizeCache", Qt = 1, G = "imageCache", Pt = 30 * 24 * 60 * 60 * 1e3;
let Me = null;
const Ue = () => new Promise((t, a) => {
  if (Me) {
    t(Me);
    return;
  }
  const n = indexedDB.open(Gt, Qt);
  n.onerror = () => {
    console.error("❌ IndexedDB 打开失败:", n.error), a(n.error);
  }, n.onsuccess = () => {
    Me = n.result, t(Me);
  }, n.onupgradeneeded = (o) => {
    const r = o.target.result;
    r.objectStoreNames.contains(G) || r.createObjectStore(G, { keyPath: "url" }).createIndex("timestamp", "timestamp", { unique: !1 });
  };
}), tt = async (t) => {
  try {
    const a = await Ue();
    if (!a.objectStoreNames.contains(G))
      return null;
    const r = a.transaction([G], "readonly").objectStore(G).get(t);
    return new Promise((s, c) => {
      r.onsuccess = () => {
        const l = r.result;
        if (l && Date.now() - l.timestamp < Pt) {
          const f = new Uint8Array(l.data);
          s({
            data: f,
            timestamp: l.timestamp,
            mimeType: l.mimeType || "image/jpeg"
          });
        } else
          s(null);
      }, r.onerror = () => c(r.error);
    });
  } catch (a) {
    return console.error("❌ 从 IndexedDB 读取图片缓存失败:", a), null;
  }
}, rt = async (t, a, n = "image/jpeg") => {
  try {
    const o = await Ue();
    if (!o.objectStoreNames.contains(G))
      return;
    const s = o.transaction([G], "readwrite").objectStore(G), c = {
      url: t,
      data: a.buffer,
      // 转换为 ArrayBuffer
      timestamp: Date.now(),
      mimeType: n
    }, l = s.put(c);
    return new Promise((f, g) => {
      l.onsuccess = () => {
        f();
      }, l.onerror = () => g(l.error);
    });
  } catch (o) {
    console.error("❌ 保存图片缓存到 IndexedDB 失败:", o);
  }
}, nt = async (t) => {
  try {
    const a = await Ue();
    if (!a.objectStoreNames.contains(G))
      return;
    const o = a.transaction([G], "readwrite").objectStore(G);
    if (t) {
      const r = o.delete(t);
      return new Promise((s, c) => {
        r.onsuccess = () => {
          s();
        }, r.onerror = () => c(r.error);
      });
    } else {
      const r = o.clear();
      return new Promise((s, c) => {
        r.onsuccess = () => {
          s();
        }, r.onerror = () => c(r.error);
      });
    }
  } catch (a) {
    console.error("❌ 删除图片缓存失败:", a);
  }
}, _t = async () => {
  try {
    const t = await Ue();
    if (!t.objectStoreNames.contains(G))
      return;
    const o = t.transaction([G], "readwrite").objectStore(G).index("timestamp"), r = Date.now(), s = IDBKeyRange.upperBound(r - Pt), c = o.openCursor(s);
    return new Promise((l, f) => {
      c.onsuccess = (g) => {
        const u = g.target.result;
        u ? (u.delete(), u.continue()) : l();
      }, c.onerror = () => f(c.error);
    });
  } catch (t) {
    console.error("❌ 清理过期图片缓存失败:", t);
  }
}, Xt = async () => {
  try {
    const t = await Ue();
    if (!t.objectStoreNames.contains(G))
      return { count: 0, totalSize: 0, totalSizeMB: 0 };
    const o = t.transaction([G], "readonly").objectStore(G).getAll();
    return new Promise((r, s) => {
      o.onsuccess = () => {
        const c = o.result, l = c.reduce((f, g) => f + (g.data ? g.data.byteLength : 0), 0);
        r({
          count: c.length,
          totalSize: l,
          totalSizeMB: Math.round(l / 1024 / 1024 * 100) / 100
        });
      }, o.onerror = () => s(o.error);
    });
  } catch (t) {
    return console.error("❌ 获取图片缓存统计失败:", t), { count: 0, totalSize: 0, totalSizeMB: 0 };
  }
}, Ne = (t, a) => {
  try {
    const n = new Blob([t], { type: a });
    return URL.createObjectURL(n);
  } catch (n) {
    return console.error("❌ 创建 Blob URL 失败:", n), null;
  }
}, jt = async (t) => {
  try {
    await _t();
    const a = await tt(t);
    if (a) {
      const l = Ne(a.data, a.mimeType);
      if (l)
        return l;
    }
    const n = await fetch(t);
    if (!n.ok)
      throw new Error(`HTTP ${n.status}: ${n.statusText}`);
    const o = await n.arrayBuffer(), r = new Uint8Array(o), s = n.headers.get("Content-Type") || "image/jpeg";
    return await rt(t, r, s), Ne(r, s);
  } catch (a) {
    throw console.error("❌ 加载图片失败:", a), await nt(t), a;
  }
}, er = async (t) => {
  await nt(t);
}, ot = async (t, a = {}) => {
  const { loadImageProgressive: n, optimizeImageUrl: o } = await Promise.resolve().then(() => Kt), {
    stages: r = [
      { width: 20, quality: 20, blur: 10 },
      { width: 400, quality: 50, blur: 3 },
      { width: null, quality: 80, blur: 0 }
    ],
    timeout: s = 3e4,
    enableCache: c = !0,
    // 默认启用缓存
    urlTransformer: l = null,
    onStageComplete: f = null,
    onComplete: g = null,
    onError: u = null,
    onStageError: j = null
  } = a;
  if (!t) {
    const w = new Error("图片URL为空");
    return u && u(w, -1), {
      url: "",
      stages: [],
      success: !1,
      error: w,
      fromCache: !1
    };
  }
  try {
    if (!c)
      return {
        ...await n(t, {
          stages: r,
          timeout: s,
          urlTransformer: l,
          onStageError: j,
          onStageComplete: f,
          onComplete: g,
          onError: u
        }),
        fromCache: !1
      };
    const w = r[r.length - 1];
    let p = t;
    l && typeof l == "function" ? p = l(t, w, r.length - 1) : w && (w.width || w.height) && (p = o(t, {
      width: w.width || null,
      height: w.height || null,
      quality: w.quality || 80,
      format: w.format || null,
      autoFormat: w.autoFormat !== !1
    }));
    const y = await tt(p);
    if (y) {
      const h = Ne(y.data, y.mimeType);
      if (h)
        return g && g(h), f && r.forEach((d, E) => {
          E === r.length - 1 && f(E, h, d);
        }), {
          url: h,
          stages: r.map((d, E) => ({
            url: E === r.length - 1 ? h : "",
            stage: d,
            loaded: E === r.length - 1
          })),
          success: !0,
          error: null,
          fromCache: !0
        };
    }
    const R = p;
    return {
      ...await n(t, {
        stages: r,
        timeout: s,
        urlTransformer: l,
        onStageError: j,
        onStageComplete: f,
        onComplete: async (h) => {
          if (h.startsWith("blob:"))
            console.log(`[渐进式加载缓存] 图片来自缓存，跳过保存: ${h.substring(0, 30)}...`);
          else
            try {
              const d = await fetch(h);
              if (d.ok) {
                const E = await d.arrayBuffer(), C = new Uint8Array(E), I = d.headers.get("Content-Type") || "image/jpeg";
                await rt(R, C, I), console.log(`[渐进式加载缓存] 已保存到缓存: ${R.substring(0, 50)}...`);
              } else
                console.warn(`[渐进式加载缓存] 响应状态码错误: ${d.status} - ${h.substring(0, 50)}...`);
            } catch (d) {
              console.warn("[渐进式加载缓存] 保存缓存失败:", d.message || d, h.substring(0, 50));
            }
          g && g(h);
        },
        onError: u
      }),
      fromCache: !1
    };
  } catch (w) {
    const p = w.message && w.message.includes("404");
    return (!p || process.env.NODE_ENV === "development") && (p || console.error("❌ 渐进式加载图片失败:", w.message || w)), u && u(w, -1), {
      url: "",
      stages: [],
      success: !1,
      error: w,
      fromCache: !1
    };
  }
}, tr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  cleanExpiredImageCache: _t,
  clearImageCache: er,
  createBlobUrlFromCache: Ne,
  deleteImageCache: nt,
  getImageCache: tt,
  getImageCacheStats: Xt,
  loadImageProgressiveWithCache: ot,
  loadImageWithCache: jt,
  saveImageCache: rt
}, Symbol.toStringTag, { value: "Module" }));
function nr({
  src: t = "",
  alt: a = "",
  width: n = "100%",
  height: o = "auto",
  className: r = "",
  imageClassName: s = "",
  dataId: c = null,
  imageStyle: l = {},
  immediate: f = !1,
  rootMargin: g = "50px",
  optimize: u = {
    width: 240,
    height: 320,
    quality: 30
  },
  enableBrowserCompression: j = !0,
  // 默认启用浏览器端压缩
  showPlaceholderIcon: w = !1,
  showErrorMessage: p = !1,
  errorSrc: y = null,
  // 默认为 null，不加载错误图片，直接显示错误占位符
  progressive: R = !1,
  // 是否启用渐进式加载
  progressiveStages: k = [
    { width: 20, quality: 20, blur: 10 },
    // 阶段1: 极速模糊图
    { width: 400, quality: 50, blur: 3 },
    // 阶段2: 中等质量
    { width: null, quality: 80, blur: 0 }
    // 阶段3: 最终质量（原图）
  ],
  progressiveTransitionDuration: h = 300,
  // 过渡动画时间（毫秒）
  progressiveTimeout: d = 3e4,
  // 渐进式加载每个阶段的超时时间（毫秒，默认30秒）
  progressiveEnableCache: E = !0,
  // 渐进式加载是否启用缓存（默认true）
  onLoad: C = null,
  onOptimization: I = null,
  // 优化完成回调
  onError: L = null,
  onClick: v = null,
  onProgressiveStageComplete: T = null
  // 渐进式加载阶段完成回调
}) {
  const z = ie(null), D = ie(null), x = ie(null), b = ie(null), [$, K] = X(!1), [ee, N] = X(!1), [B, H] = X(!1), [J, Q] = X(f), [ce, ye] = X(""), [pe, ke] = X(null), [ve, we] = X(!1), [oe, be] = X(null), ue = ie(null), [he, Ee] = X(-1), [me, Se] = X(""), te = ie(null), fe = ie(-1), ae = ie(!1), ze = ie(null), Re = (U) => {
    if (!U) return "";
    try {
      if (u && Object.keys(u).length > 0) {
        const P = Ce(U, u);
        if (P && P.trim())
          return P;
      }
      return U;
    } catch (P) {
      return console.warn("图片URL优化失败，使用原始URL:", P), U;
    }
  }, ge = Bt(() => t ? R && me ? me : pe || oe || ($ && ce ? ce : Re(t)) : "", [t, $, ce, u, pe, oe, R, me]), qe = () => {
    if (f || typeof window > "u" || !window.IntersectionObserver) {
      Q(!0);
      return;
    }
    x.current && (x.current.disconnect(), x.current = null), x.current = new IntersectionObserver(
      (U) => {
        U.forEach((P) => {
          P.isIntersecting && (Q(!0), x.current && P.target && x.current.unobserve(P.target));
        });
      },
      {
        rootMargin: g,
        threshold: 0.01
      }
    ), setTimeout(() => {
      D.current && x.current && x.current.observe(D.current);
    }, 0);
  }, We = async (U) => {
    if (R) {
      const _ = fe.current;
      if (_ >= 0 && _ < k.length)
        return;
    }
    if ($)
      return;
    const P = U.target.src;
    if (K(!0), N(!1), H(!1), ye(P), !P.startsWith("blob:") && !P.startsWith("data:"))
      try {
        const _ = Re(t), Z = await fetch(_);
        if (Z.ok) {
          const $e = await Z.arrayBuffer(), Pe = new Uint8Array($e), He = Z.headers.get("Content-Type") || "image/jpeg";
          await saveImageCache(_, Pe, He);
        }
      } catch (_) {
        console.warn("保存图片缓存失败:", _);
      }
    let M = null;
    if (t && P !== t)
      try {
        const _ = await Ct(t, P);
        _.originalSize !== null && _.optimizedSize !== null ? (M = {
          // 原始信息
          originalUrl: _.originalUrl,
          originalSize: _.originalSize,
          originalSizeFormatted: _.originalSizeFormatted,
          // 优化后信息
          optimizedUrl: _.optimizedUrl,
          optimizedSize: _.optimizedSize,
          optimizedSizeFormatted: _.optimizedSizeFormatted,
          // 节省信息
          savedSize: _.savedSize,
          savedSizeFormatted: _.savedSizeFormatted,
          savedPercentage: _.savedPercentage,
          // 其他信息
          cdn: _.cdn,
          isOptimizationEffective: _.isOptimizationEffective,
          warningMessage: _.warningMessage
        }, b.current = M, I && I(M), _.cdn, _.warningMessage && console.warn(_.warningMessage), _.isOptimizationEffective) : (M = {
          originalUrl: t,
          optimizedUrl: P,
          originalSize: null,
          originalSizeFormatted: null,
          optimizedSize: null,
          optimizedSizeFormatted: null,
          savedSize: null,
          savedSizeFormatted: null,
          savedPercentage: null,
          cdn: Te(t),
          isOptimizationEffective: null,
          warningMessage: "⚠️ 无法获取图片大小（可能由于CORS限制）"
        }, b.current = M, I && I(M));
      } catch (_) {
        console.warn("获取图片大小对比失败:", _), M = {
          originalUrl: t,
          optimizedUrl: P,
          originalSize: null,
          originalSizeFormatted: null,
          optimizedSize: null,
          optimizedSizeFormatted: null,
          savedSize: null,
          savedSizeFormatted: null,
          savedPercentage: null,
          cdn: Te(t),
          isOptimizationEffective: null,
          warningMessage: `获取图片大小对比失败: ${_.message}`
        }, b.current = M, I && I(M);
      }
    C && C(U, M);
  }, Oe = (U) => {
    if ($)
      return;
    const P = U.target.src, M = Re(t);
    if (y && (P === y || P.includes("videoCover.png"))) {
      H(!0), N(!1), L && L(U);
      return;
    }
    if (P === M && M !== t) {
      console.log("优化URL加载失败，尝试原始URL:", t), U.target.src = t;
      return;
    }
    if (P === t || M === t) {
      if (y && P !== y) {
        console.log("原始URL加载失败，尝试加载错误图片:", y), U.target.src = y;
        return;
      }
      console.log("图片加载失败，显示错误占位符"), H(!0), N(!1), L && L(U);
    }
  }, Ve = (U) => {
    var P;
    if (v) {
      const M = {
        // 基本图片信息
        src: t,
        // 原始图片URL
        currentSrc: ((P = U.target) == null ? void 0 : P.src) || ge,
        // 当前加载的图片URL
        optimizedSrc: ge,
        // 优化后的URL
        alt: a,
        // 图片alt文本
        dataId: c,
        // data-id属性
        // 图片状态
        isLoaded: $,
        // 是否已加载
        isLoading: ee,
        // 是否正在加载
        hasError: B,
        // 是否有错误
        isCompressing: ve,
        // 是否正在压缩
        // 优化信息（如果已获取）
        optimizationInfo: b.current,
        // 图片元素引用
        imageElement: U.target
        // 图片DOM元素
      };
      v(U, M);
    }
  };
  Ie(() => {
    ze.current = k;
  }, [k]);
  const de = ie(!1), se = ie(null);
  Ie(() => {
    if (!R) {
      de.current = !1, se.current = null;
      return;
    }
    if (se.current !== t && (de.current = !1, se.current = t), de.current || !t || !J)
      return;
    de.current = !0, ae.current = !0, N(!0);
    let U = !1;
    const P = t, M = ze.current || k;
    return te.current = () => {
      U = !0, ae.current = !1, de.current = !1;
    }, ot(P, {
      stages: M,
      timeout: d,
      enableCache: E,
      // 传递缓存开关
      onStageComplete: (_, Z, $e) => {
        if (U || se.current !== P) return;
        const Pe = _ + 1;
        requestAnimationFrame(() => {
          !U && se.current === P && (Ee(Pe), fe.current = Pe, Se(Z), T && T(_, Z, $e));
        });
      },
      onComplete: (_) => {
        U || se.current !== P || requestAnimationFrame(() => {
          if (!U && se.current === P) {
            N(!1), Se(_), ae.current = !1;
            const Z = M.length;
            Ee(Z), fe.current = Z;
          }
        });
      },
      onError: (_, Z) => {
        U || se.current !== P || (console.warn(`[渐进式加载 ${P.substring(0, 20)}...] 阶段 ${Z + 1} 失败:`, _.message || _), N(!1), ae.current = !1, de.current = !1, Se(""), Ee(-1), fe.current = -1, N(!0));
      }
    }).catch((_) => {
      !U && se.current === P && (console.error(`[渐进式加载 ${P.substring(0, 20)}...] 加载过程出错:`, _), N(!1), ae.current = !1, de.current = !1, Se(""), Ee(-1), fe.current = -1);
    }), () => {
      U = !0, ae.current = !1, de.current = !1;
    };
  }, [R, J, t, d, E]), Ie(() => {
    R || !R && J && !$ && !B && !ee && !ve && !oe && !me && t && (async () => {
      try {
        const P = Re(t), M = await jt(P);
        if (M)
          return be(M), ue.current = M, !0;
      } catch {
      }
      return !1;
    })().then((P) => {
      if (!P) {
        const M = Te(t);
        j && // 允许浏览器端压缩
        !M && // 不支持CDN
        u && Object.keys(u).length > 0 && // 有优化配置
        typeof window < "u" && // 浏览器环境
        !pe ? (we(!0), Rt(t, {
          maxWidth: u.width || null,
          maxHeight: u.height || null,
          quality: u.quality ? u.quality / 100 : 0.8,
          compressionLevel: u.compressionLevel !== void 0 ? u.compressionLevel : 0,
          blur: u.blur !== void 0 ? u.blur : 0,
          smooth: u.smooth !== void 0 ? u.smooth : !0,
          format: u.format || null
        }).then((Z) => {
          ke(Z), we(!1), xt(Z);
        }).catch((Z) => {
          console.warn("浏览器端压缩失败，使用原始URL:", Z), we(!1);
        })) : N(!0);
      }
    });
  }, [J, $, B, ee, ve, t, u, pe, oe, j]), Ie(() => {
    ue.current && (URL.revokeObjectURL(ue.current), ue.current = null), te.current && (te.current(), te.current = null), K(!1), H(!1), N(!1), ye(""), ke(null), we(!1), be(null), te.current && (te.current(), te.current = null), te.current && (te.current(), te.current = null), Se(""), Ee(-1), fe.current = -1, ae.current = !1, de.current = !1, se.current = null, b.current = null, f ? Q(!0) : qe();
  }, [t]), Ie(() => (f ? Q(!0) : qe(), () => {
    x.current && (x.current.disconnect(), x.current = null), ue.current && (URL.revokeObjectURL(ue.current), ue.current = null), te.current && (te.current(), te.current = null);
  }), []);
  const De = {
    width: typeof n == "number" ? `${n}px` : n,
    height: typeof o == "number" ? `${o}px` : o
  };
  return /* @__PURE__ */ W.jsxs(
    "div",
    {
      ref: D,
      className: `image-optimize-container ${r}`.trim(),
      style: De,
      children: [
        !$ && !B && !ee && !oe && !me && /* @__PURE__ */ W.jsx("div", { className: "image-optimize-placeholder", children: w && /* @__PURE__ */ W.jsx(
          "svg",
          {
            className: "image-optimize-placeholder-icon",
            width: "24",
            height: "24",
            viewBox: "0 0 24 24",
            fill: "none",
            xmlns: "http://www.w3.org/2000/svg",
            children: /* @__PURE__ */ W.jsx(
              "path",
              {
                d: "M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM13.96 12.29L11.21 15.83L9.25 13.47L6.5 17H17.5L13.96 12.29Z",
                fill: "currentColor"
              }
            )
          }
        ) }),
        (ee || ve) && !B && !oe && !me && /* @__PURE__ */ W.jsxs("div", { className: "image-optimize-loading", children: [
          /* @__PURE__ */ W.jsx(
            "svg",
            {
              className: "image-optimize-loading-icon",
              width: "24",
              height: "24",
              viewBox: "0 0 24 24",
              fill: "none",
              xmlns: "http://www.w3.org/2000/svg",
              children: /* @__PURE__ */ W.jsx(
                "circle",
                {
                  cx: "12",
                  cy: "12",
                  r: "10",
                  stroke: "currentColor",
                  strokeWidth: "2",
                  fill: "none",
                  strokeDasharray: "62.83",
                  strokeDashoffset: "31.42"
                }
              )
            }
          ),
          ve && /* @__PURE__ */ W.jsx("span", { style: { marginTop: "8px", fontSize: "12px", color: "#666" }, children: "正在压缩图片..." })
        ] }),
        J && ge && /* @__PURE__ */ W.jsx(
          "img",
          {
            ref: z,
            src: ge,
            alt: a,
            "data-id": c,
            className: `image-optimize-image ${s}`.trim(),
            style: {
              display: $ || oe || me || !B && ge ? "block" : "none",
              // 渐进式加载的过渡效果
              transition: R ? `opacity ${h}ms ease-in-out, filter ${h}ms ease-in-out` : void 0,
              opacity: R && he >= 0 || $ || oe ? 1 : 0,
              // 渐进式加载的模糊效果
              // progressiveStageIndex: -1(初始) -> 1(第1阶段完成) -> 2(第2阶段完成) -> 3(第3阶段完成/全部完成)
              filter: R ? he === 1 ? "blur(10px)" : he === 2 ? "blur(3px)" : he >= 3 ? "blur(0px)" : "blur(10px)" : void 0,
              ...l
            },
            onLoad: We,
            onError: Oe,
            onClick: Ve
          }
        ),
        B && /* @__PURE__ */ W.jsxs("div", { className: "image-optimize-error", children: [
          /* @__PURE__ */ W.jsx(
            "svg",
            {
              className: "image-optimize-error-icon",
              width: "24",
              height: "24",
              viewBox: "0 0 24 24",
              fill: "none",
              xmlns: "http://www.w3.org/2000/svg",
              children: /* @__PURE__ */ W.jsx(
                "path",
                {
                  d: "M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z",
                  fill: "currentColor"
                }
              )
            }
          ),
          p && /* @__PURE__ */ W.jsx("span", { className: "image-optimize-error-text", children: "加载失败" })
        ] })
      ]
    }
  );
}
function or({
  src: t = "",
  alt: a = "",
  width: n = "100%",
  height: o = "auto",
  className: r = "",
  imageClassName: s = "",
  imageStyle: c = {},
  stages: l = [
    { width: 20, quality: 20 },
    // 阶段1: 极速模糊图
    { width: 400, quality: 50 },
    // 阶段2: 中等质量
    { width: null, quality: 80 }
    // 阶段3: 最终质量（原图）
  ],
  transitionDuration: f = 300,
  timeout: g = 3e4,
  enableCache: u = !0,
  // 是否启用缓存（默认true）
  showPlaceholder: j = !0,
  onStageComplete: w = null,
  onComplete: p = null,
  onError: y = null,
  onLoad: R = null
}) {
  const [k, h] = X(-1), [d, E] = X(""), [C, I] = X(!1), [L, v] = X(!1), [T, z] = X(""), [D, x] = X(!1), b = ie(null), $ = ie(null);
  Ie(() => {
    var H, J;
    if (!t) return;
    const N = Et(t, {
      width: ((H = l[0]) == null ? void 0 : H.width) || 20,
      quality: ((J = l[0]) == null ? void 0 : J.quality) || 20
    });
    E(N), h(0), I(!0), v(!1), z(""), x(!1);
    let B = !1;
    return ot(t, {
      stages: l,
      timeout: g,
      enableCache: u,
      // 传递缓存开关
      onStageComplete: (Q, ce, ye) => {
        B || (h(Q + 1), E(ce), w && w(Q, ce, ye));
      },
      onComplete: (Q) => {
        B || (I(!1), x(!0), E(Q), p && p(Q));
      },
      onError: (Q, ce) => {
        B || (I(!1), v(!0), z(Q.message), y && y(Q, ce));
      }
    }), () => {
      B = !0;
    };
  }, [t, u]);
  const K = {
    width: typeof n == "number" ? `${n}px` : n,
    height: typeof o == "number" ? `${o}px` : o,
    position: "relative",
    overflow: "hidden"
  }, ee = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: `opacity ${f}ms ease-in-out, filter ${f}ms ease-in-out`,
    opacity: k >= 0 ? 1 : 0,
    // 真正的渐进式加载资源 + CSS模糊效果增强视觉体验
    filter: k === 0 ? "blur(10px)" : k === 1 ? "blur(3px)" : "blur(0px)",
    ...c
  };
  return /* @__PURE__ */ W.jsxs(
    "div",
    {
      ref: b,
      className: `progressive-image-container ${r}`.trim(),
      style: K,
      children: [
        j && k < 0 && !L && /* @__PURE__ */ W.jsx("div", { className: "image-optimize-placeholder", style: {
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%"
        }, children: /* @__PURE__ */ W.jsx(
          "svg",
          {
            className: "image-optimize-placeholder-icon",
            width: "24",
            height: "24",
            viewBox: "0 0 24 24",
            fill: "none",
            xmlns: "http://www.w3.org/2000/svg",
            children: /* @__PURE__ */ W.jsx(
              "path",
              {
                d: "M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM13.96 12.29L11.21 15.83L9.25 13.47L6.5 17H17.5L13.96 12.29Z",
                fill: "currentColor"
              }
            )
          }
        ) }),
        d && /* @__PURE__ */ W.jsx(
          "img",
          {
            ref: $,
            src: d,
            alt: a,
            className: `progressive-image ${s}`.trim(),
            style: ee,
            onLoad: (N) => {
              D && R && R(N);
            },
            onError: (N) => {
              L || (v(!0), z("图片加载失败"), y && y(new Error("图片加载失败"), k));
            }
          }
        ),
        L && /* @__PURE__ */ W.jsxs("div", { style: {
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
          color: "#999",
          fontSize: "14px"
        }, children: [
          /* @__PURE__ */ W.jsx("div", { style: { fontSize: "24px", marginBottom: "8px" }, children: "❌" }),
          /* @__PURE__ */ W.jsx("div", { children: T || "加载失败" })
        ] }),
        C && !L && k < l.length && /* @__PURE__ */ W.jsxs("div", { style: {
          position: "absolute",
          bottom: "10px",
          right: "10px",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          color: "white",
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "12px"
        }, children: [
          "阶段 ",
          k + 1,
          " / ",
          l.length
        ] })
      ]
    }
  );
}
export {
  nr as LazyImage,
  or as ProgressiveImage,
  _t as cleanExpiredImageCache,
  er as clearImageCache,
  Ct as compareImageSizes,
  Rt as compressImageInBrowser,
  xt as dataURLToBlob,
  nr as default,
  nt as deleteImageCache,
  Te as detectCDN,
  pt as detectImageFormat,
  Be as detectSupportedFormats,
  Ae as formatFileSize,
  Et as generateBlurPlaceholderUrl,
  Nt as generateResponsiveImage,
  Qe as generateSizes,
  yt as generateSrcset,
  Ge as getBestFormat,
  tt as getImageCache,
  Xt as getImageCacheStats,
  Xe as getImageSize,
  Wt as getOptimizedCoverUrl,
  St as loadImageProgressive,
  jt as loadImageWithCache,
  Ht as loadImagesBatch,
  Yt as loadImagesProgressiveBatch,
  bt as loadImagesProgressively,
  Ce as optimizeImageUrl,
  vt as preloadImage,
  Vt as preloadImages,
  rt as saveImageCache
};
