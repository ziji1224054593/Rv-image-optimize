import Ge, { useRef as se, useState as G, useMemo as Rt, useEffect as we } from "react";
function _e() {
  const t = [];
  if (typeof window < "u" && typeof document < "u") {
    const n = (() => {
      try {
        const o = document.createElement("canvas");
        return o.width = 1, o.height = 1, o.toDataURL("image/webp").indexOf("data:image/webp") === 0;
      } catch {
        return !1;
      }
    })();
    (() => {
      try {
        const o = document.createElement("canvas");
        return o.width = 1, o.height = 1, o.toDataURL("image/avif").indexOf("data:image/avif") === 0;
      } catch {
        return !1;
      }
    })() && t.push("avif"), n && t.push("webp");
  }
  return t.push("jpg", "jpeg", "png"), t;
}
function Ve(t = null) {
  const u = _e();
  if (t) {
    const n = t.toLowerCase().replace("jpeg", "jpg");
    if (u.includes(n))
      return n;
  }
  return u[0] || "jpg";
}
function xt(t) {
  if (!t) return null;
  const n = t.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)(\?|$)/i);
  if (n) {
    const i = n[1].toLowerCase();
    return i === "jpeg" ? "jpg" : i;
  }
  try {
    const i = new URL(t), o = i.searchParams.get("format") || i.searchParams.get("f") || i.searchParams.get("image_format");
    if (o)
      return o.toLowerCase().replace("jpeg", "jpg");
  } catch {
  }
  return null;
}
const Qe = {
  // 阿里云OSS
  aliyun: {
    test: (t) => t.includes("aliyuncs.com") || t.includes("oss-"),
    process: (t, u) => {
      const { width: n, height: i, quality: o, format: l } = u, a = [];
      return (n || i) && a.push(`resize,w_${n || ""},h_${i || ""},m_lfit`), o && a.push(`quality,q_${o}`), l && a.push(`format,${l}`), a.length > 0 && t.searchParams.set("x-oss-process", a.join("/")), t.toString();
    }
  },
  // 腾讯云COS
  tencent: {
    test: (t) => t.includes("qcloud.com") || t.includes("myqcloud.com"),
    process: (t, u) => {
      const { width: n, height: i, quality: o, format: l } = u, a = [];
      if ((n || i) && a.push(`imageMogr2/thumbnail/${n}x${i}`), o && a.push(`quality/${o}`), l && a.push(`format/${l}`), a.length > 0) {
        const s = a.join("|"), d = t.search ? "|" : "?imageMogr2/";
        return `${t.toString()}${d}${s}`;
      }
      return t.toString();
    }
  },
  // 七牛云
  qiniu: {
    test: (t) => t.includes("qiniucdn.com") || t.includes("qiniu.com"),
    process: (t, u) => {
      const { width: n, height: i, quality: o, format: l } = u, a = [];
      if ((n || i) && a.push(`imageView2/1/w/${n || ""}/h/${i || ""}`), o && a.push(`quality/${o}`), l && a.push(`format/${l}`), a.length > 0) {
        const s = a.join("|"), d = t.search ? "|" : "?";
        return `${t.toString()}${d}${s}`;
      }
      return t.toString();
    }
  },
  // 又拍云
  upyun: {
    test: (t) => t.includes("upaiyun.com") || t.includes("upyun.com"),
    process: (t, u) => {
      const { width: n, height: i, quality: o, format: l } = u, a = [];
      if ((n || i) && a.push(`${n || ""}x${i || ""}`), o && a.push(`quality/${o}`), l && a.push(`format/${l}`), a.length > 0) {
        const s = t.pathname.split("/"), d = s[s.length - 1], w = s.slice(0, -1).join("/") + "/!" + a.join("/") + "/" + d;
        t.pathname = w;
      }
      return t.toString();
    }
  },
  // AWS CloudFront (需要配合 Lambda@Edge 或 CloudFront Functions)
  cloudfront: {
    test: (t) => t.includes("cloudfront.net") || t.includes(".aws"),
    process: (t, u) => {
      const { width: n, height: i, quality: o, format: l } = u;
      return n && t.searchParams.set("w", n), i && t.searchParams.set("h", i), o && t.searchParams.set("q", o), l && t.searchParams.set("f", l), t.toString();
    }
  }
};
function le(t, u = {}) {
  if (!t) return t;
  const {
    width: n = null,
    height: i = null,
    quality: o = 30,
    format: l = null,
    autoFormat: a = !0
    // 自动选择最佳格式
  } = u;
  try {
    let s;
    try {
      s = new URL(t);
    } catch {
      if (t.startsWith("/")) {
        const h = typeof window < "u" && window.location ? window.location.origin : "https://example.com";
        s = new URL(t, h);
      } else
        return console.warn("无法解析的图片URL，跳过优化:", t), t;
    }
    let d = l;
    a && !l ? d = Ve() : l && (d = Ve(l));
    for (const [f, h] of Object.entries(Qe))
      if (h.test(t))
        return h.process(s, {
          width: n,
          height: i,
          quality: o,
          format: d
        });
    return n && s.searchParams.set("w", n), i && s.searchParams.set("h", i), o && s.searchParams.set("q", o), d && s.searchParams.set("f", d), s.toString();
  } catch (s) {
    return console.warn("图片URL优化失败:", s), t;
  }
}
function Ct(t, u = {}) {
  if (!t) return "";
  const {
    widths: n = null,
    // 默认自动生成
    aspectRatio: i = null,
    quality: o = 80,
    format: l = null,
    autoFormat: a = !0
  } = u;
  return (n || [320, 640, 960, 1280, 1920]).map((f) => `${le(t, {
    width: f,
    height: i ? Math.round(f / i) : null,
    quality: o,
    format: l,
    autoFormat: a
  })} ${f}w`).join(", ");
}
function He(t = {}) {
  const {
    breakpoints: u = [
      "(max-width: 640px) 100vw",
      "(max-width: 1024px) 50vw",
      "33vw"
    ]
  } = t;
  return Array.isArray(u) ? u.join(", ") : u;
}
function $t(t, u = {}) {
  if (!t) return { src: "", srcset: "", sizes: "" };
  const {
    widths: n = null,
    aspectRatio: i = null,
    quality: o = 80,
    format: l = null,
    autoFormat: a = !0,
    sizes: s = null,
    fallbackWidth: d = 960
    // 默认回退宽度
  } = u, w = Ct(t, {
    widths: n,
    aspectRatio: i,
    quality: o,
    format: l,
    autoFormat: a
  }), f = s ? typeof s == "string" ? s : He(s) : He();
  return {
    src: le(t, {
      width: d,
      height: i ? Math.round(d / i) : null,
      quality: o,
      format: l,
      autoFormat: a
    }),
    srcset: w,
    sizes: f
  };
}
function kt(t) {
  return le(t, {
    width: 240,
    // 根据实际显示尺寸调整
    height: 320,
    quality: 75
  });
}
function Pt(t) {
  return new Promise((u) => {
    if (!t) {
      u(!1);
      return;
    }
    const n = new Image();
    n.onload = () => u(!0), n.onerror = () => u(!1), n.src = t;
  });
}
async function Mt(t, u = 3) {
  const n = [], i = [...t], o = async () => {
    for (; i.length > 0; ) {
      const a = i.shift(), s = await Pt(a);
      n.push({ url: a, success: s });
    }
  }, l = Array(Math.min(u, t.length)).fill(null).map(() => o());
  return await Promise.all(l), n;
}
async function _t(t, u = {}) {
  const {
    concurrency: n = 10,
    // 默认高并发
    timeout: i = 3e4,
    // 30秒超时
    priority: o = !0,
    // 默认按优先级
    stages: l = null,
    // 渐进式加载阶段（可选）
    onProgress: a = null,
    onItemComplete: s = null,
    onItemStageComplete: d = null,
    // 阶段完成回调
    retryOnError: w = !1,
    maxRetries: f = 1
  } = u, h = t.map((y, m) => typeof y == "string" ? { url: y, priority: 0, index: m } : {
    url: y.url || y.src || "",
    priority: y.priority || 0,
    index: y.index !== void 0 ? y.index : m
  });
  o && h.sort((y, m) => m.priority - y.priority);
  const P = new Array(h.length);
  let E = 0;
  const _ = h.length, T = async (y, m = 0) => {
    const { url: S, index: R } = y;
    if (!S) {
      const j = {
        url: "",
        success: !1,
        error: new Error("图片URL为空"),
        index: R,
        retries: m
      };
      return P[R] = j, E++, a && a(E, _, j), s && s(j), j;
    }
    return l && Array.isArray(l) && l.length > 0 ? ze(S, {
      stages: l,
      timeout: i,
      onStageComplete: (x, j, H) => {
        d && d({
          url: S,
          index: R,
          stageIndex: x,
          stageUrl: j,
          stage: H,
          currentStage: x + 1,
          totalStages: l.length
        }, x);
      },
      onComplete: (x) => {
      },
      onError: (x, j) => {
      }
    }).then((x) => {
      const j = {
        url: x.url,
        success: x.success,
        error: x.error,
        index: R,
        retries: m,
        stages: x.stages
      };
      return P[R] = j, E++, a && a(E, _, j), s && s(j), j;
    }) : new Promise((x) => {
      const j = new Image();
      let H = !1, z = null;
      const q = () => {
        z && (clearTimeout(z), z = null), j.onload = null, j.onerror = null, j.src = "";
      }, N = (M, U = null) => {
        if (H) return null;
        H = !0, q();
        const Y = {
          url: S,
          success: M,
          error: U,
          index: R,
          retries: m
        };
        return P[R] = Y, E++, a && a(E, _, Y), s && s(Y), Y;
      };
      z = setTimeout(() => {
        const M = new Error(`图片加载超时 (${i}ms)`), U = N(!1, M);
        w && m < f ? setTimeout(() => {
          T(y, m + 1).then(x);
        }, 1e3 * (m + 1)) : x(U);
      }, i), j.onload = () => {
        const M = N(!0, null);
        M && x(M);
      }, j.onerror = (M) => {
        const U = new Error("图片加载失败");
        U.originalEvent = M;
        const Y = N(!1, U);
        w && m < f ? setTimeout(() => {
          T(y, m + 1).then(x);
        }, 1e3 * (m + 1)) : x(Y);
      };
      try {
        j.crossOrigin = "anonymous", j.src = S;
      } catch (M) {
        const U = N(!1, M);
        U && x(U);
      }
    });
  }, A = [...h], g = /* @__PURE__ */ new Set(), p = [];
  return await (async () => {
    for (; A.length > 0 || g.size > 0; ) {
      for (; A.length > 0 && g.size < n; ) {
        const y = A.shift(), m = T(y).then((S) => (g.delete(m), S)).catch((S) => {
          g.delete(m);
          const R = {
            url: y.url,
            success: !1,
            error: S instanceof Error ? S : new Error(String(S)),
            index: y.index,
            retries: 0
          };
          return P[y.index] = R, E++, a && a(E, _, R), s && s(R), R;
        });
        g.add(m), p.push(m);
      }
      g.size > 0 && await Promise.race(Array.from(g));
    }
  })(), await Promise.all(p), P;
}
async function Ut(t, u = {}) {
  return _t(t, {
    priority: !1,
    // 批量加载不需要优先级
    ...u
  });
}
function jt(t, u = {}) {
  if (!t) return t;
  const {
    width: n = 20,
    height: i = null,
    quality: o = 20,
    blur: l = 10
  } = u;
  return le(t, {
    width: n,
    height: i,
    quality: o,
    format: "jpg"
    // 使用 jpg 格式，文件更小
  });
}
async function ze(t, u = {}) {
  const {
    stages: n = [
      { width: 20, quality: 20, blur: 10 },
      // 阶段1: 极速模糊图
      { width: 400, quality: 50, blur: 3 },
      // 阶段2: 中等质量
      { width: null, quality: 80, blur: 0 }
      // 阶段3: 最终质量（原图）
    ],
    timeout: i = 3e4,
    onStageComplete: o = null,
    onComplete: l = null,
    onError: a = null
  } = u;
  if (!t) {
    const w = new Error("图片URL为空");
    return a && a(w, -1), {
      url: "",
      stages: [],
      success: !1,
      error: w
    };
  }
  const s = [];
  let d = t;
  try {
    for (let w = 0; w < n.length; w++) {
      const f = n[w];
      let h;
      w === n.length - 1 && !f.width && !f.height ? h = t : h = le(t, {
        width: f.width || null,
        height: f.height || null,
        quality: f.quality || 80,
        format: f.format || null,
        autoFormat: f.autoFormat !== !1
      });
      const P = await new Promise((E, _) => {
        const T = new Image();
        let A = null, g = !1;
        const p = () => {
          A && (clearTimeout(A), A = null), T.onload = null, T.onerror = null, T.src = "";
        };
        A = setTimeout(() => {
          if (!g) {
            g = !0, p();
            const I = new Error(`阶段 ${w + 1} 加载超时`);
            _(I);
          }
        }, i), T.onload = () => {
          g || (g = !0, p(), E({
            url: h,
            stage: f,
            loaded: !0
          }));
        }, T.onerror = (I) => {
          if (!g) {
            g = !0, p();
            const y = new Error(`阶段 ${w + 1} 加载失败`);
            y.originalEvent = I, _(y);
          }
        };
        try {
          T.crossOrigin = "anonymous", T.src = h;
        } catch (I) {
          g || (g = !0, p(), _(I));
        }
      });
      s.push(P), d = h, o && o(w, h, f), w < n.length - 1 && await new Promise((E) => setTimeout(E, 100));
    }
    return l && l(d), {
      url: d,
      stages: s,
      success: !0,
      error: null
    };
  } catch (w) {
    const f = s.length;
    return a && a(w, f), {
      url: d,
      stages: s,
      success: !1,
      error: w
    };
  }
}
async function At(t, u = {}) {
  const {
    stages: n = [
      { width: 20, quality: 20, blur: 10 },
      { width: 400, quality: 50, blur: 3 },
      { width: null, quality: 80, blur: 0 }
    ],
    concurrency: i = 5,
    // 渐进式加载建议较低并发，避免网络拥塞
    timeout: o = 3e4,
    onProgress: l = null,
    onItemStageComplete: a = null,
    onItemComplete: s = null
  } = u, d = t.map((g, p) => typeof g == "string" ? { url: g, index: p } : {
    url: g.url || g.src || "",
    index: g.index !== void 0 ? g.index : p
  }), w = new Array(d.length);
  let f = 0;
  const h = d.length, P = async (g) => {
    const { url: p, index: I } = g, y = await ze(p, {
      stages: n,
      timeout: o,
      onStageComplete: (m, S, R) => {
        a && a({
          url: p,
          index: I,
          stageIndex: m,
          stageUrl: S,
          stage: R,
          currentStage: m + 1,
          totalStages: n.length
        }, m);
      },
      onComplete: (m) => {
      },
      onError: (m, S) => {
      }
    });
    return w[I] = y, f++, l && l(f, h, y), s && s(y), y;
  }, E = [...d], _ = /* @__PURE__ */ new Set(), T = [];
  return await (async () => {
    for (; E.length > 0 || _.size > 0; ) {
      for (; E.length > 0 && _.size < i; ) {
        const g = E.shift(), p = P(g).then((I) => (_.delete(p), I)).catch((I) => {
          _.delete(p);
          const y = {
            url: g.url,
            stages: [],
            success: !1,
            error: I instanceof Error ? I : new Error(String(I))
          };
          return w[g.index] = y, f++, l && l(f, h, y), s && s(y), y;
        });
        _.add(p), T.push(p);
      }
      _.size > 0 && await Promise.race(Array.from(_));
    }
  })(), await Promise.all(T), w;
}
async function zt(t, u = {}) {
  const {
    maxWidth: n = null,
    maxHeight: i = null,
    quality: o = 0.8,
    compressionLevel: l = 0.5,
    // 压缩程度 0-1
    blur: a = 0,
    // 模糊程度 0-10
    smooth: s = !0,
    // 图像平滑
    format: d = null
  } = u;
  if (typeof window > "u" || typeof document > "u")
    throw new Error("浏览器端压缩功能仅在浏览器环境中可用");
  return new Promise((w, f) => {
    const h = new Image();
    if (h.crossOrigin = "anonymous", h.onload = () => {
      try {
        let { width: P, height: E } = h, _ = P, T = E, A = !1;
        if (n || i) {
          const z = Math.min(
            n ? n / P : 1,
            i ? i / E : 1
          );
          z < 1 && (_ = Math.round(P * z), T = Math.round(E * z), A = !0);
        }
        let g = _, p = T;
        if (l > 0) {
          const z = 1 - l * 0.75;
          g = Math.round(_ * z), p = Math.round(T * z);
        }
        const I = g !== P || p !== E;
        if (!(I || l > 0 || a > 0) && typeof t == "string") {
          w(t);
          return;
        }
        const m = document.createElement("canvas");
        m.width = g, m.height = p;
        const S = m.getContext("2d");
        if (I ? (S.imageSmoothingEnabled = s, S.imageSmoothingQuality = s ? "high" : "low") : S.imageSmoothingEnabled = !1, S.drawImage(h, 0, 0, g, p), a > 0) {
          const z = document.createElement("canvas"), q = z.getContext("2d");
          if (z.width = g, z.height = p, q.drawImage(h, 0, 0, g, p), q.filter !== void 0)
            try {
              q.filter = `blur(${a}px)`, q.drawImage(z, 0, 0), q.filter = "none", S.clearRect(0, 0, m.width, m.height), S.drawImage(z, 0, 0);
            } catch {
              Ye(S, z, g, p, a);
            }
          else
            Ye(S, z, g, p, a);
        }
        let R = d;
        if (!R)
          if (l > 0 || a > 0 || I)
            R = _e().includes("webp") ? "webp" : "jpeg";
          else {
            const q = xt(t);
            q && ["jpg", "jpeg", "png"].includes(q) ? R = q === "jpeg" ? "jpeg" : q : R = _e().includes("webp") ? "webp" : "jpeg";
          }
        let x = o;
        l > 0 ? (x = o * (1 - l * 0.7), x = Math.max(0.1, Math.min(1, x))) : !I && a === 0 ? x = Math.max(o, 0.98) : I && (x = Math.max(o, 0.92));
        const j = R === "webp" ? "image/webp" : R === "png" ? "image/png" : "image/jpeg", H = m.toDataURL(j, x);
        w(H);
      } catch (P) {
        f(new Error("图片压缩失败: " + P.message));
      }
    }, h.onerror = () => {
      f(new Error("图片加载失败"));
    }, typeof t == "string")
      h.src = t;
    else if (t instanceof File || t instanceof Blob) {
      const P = new FileReader();
      P.onload = (E) => {
        h.src = E.target.result;
      }, P.onerror = () => f(new Error("文件读取失败")), P.readAsDataURL(t);
    } else
      f(new Error("不支持的图片源类型"));
  });
}
function Ye(t, u, n, i, o) {
  const l = document.createElement("canvas"), a = l.getContext("2d"), s = Math.max(0.3, 1 - o / 10), d = Math.round(n * s), w = Math.round(i * s);
  l.width = d, l.height = w, a.drawImage(u, 0, 0, n, i, 0, 0, d, w), t.clearRect(0, 0, n, i), t.drawImage(l, 0, 0, d, w, 0, 0, n, i);
}
function Tt(t) {
  const u = t.split(","), n = u[0].match(/:(.*?);/)[1], i = atob(u[1]);
  let o = i.length;
  const l = new Uint8Array(o);
  for (; o--; )
    l[o] = i.charCodeAt(o);
  return new Blob([l], { type: n });
}
async function Je(t) {
  if (!t) return null;
  try {
    const n = (await fetch(t, { method: "HEAD" })).headers.get("Content-Length");
    return n ? parseInt(n, 10) : (await (await fetch(t)).blob()).size;
  } catch (u) {
    return console.warn("获取图片大小失败:", t, u), null;
  }
}
function Pe(t) {
  if (t == null) return "未知";
  if (t === 0) return "0 B";
  const u = 1024, n = ["B", "KB", "MB", "GB"], i = Math.floor(Math.log(t) / Math.log(u));
  return parseFloat((t / Math.pow(u, i)).toFixed(2)) + " " + n[i];
}
function pe(t) {
  if (!t) return null;
  for (const [u, n] of Object.entries(Qe))
    if (n.test(t))
      return u;
  return null;
}
async function Ot(t, u) {
  const [n, i] = await Promise.all([
    Je(t),
    Je(u)
  ]);
  let o = null, l = null, a = !1, s = null;
  return n !== null && i !== null && (o = n - i, l = parseFloat((o / n * 100).toFixed(2)), a = o > 1024 || l > 1, !a && o === 0 ? pe(t) ? s = "⚠️ 优化参数可能无效，图片大小未发生变化。请检查CDN配置是否正确。" : s = "⚠️ 该图片URL不是支持的CDN，通用查询参数可能无效。支持的CDN：阿里云OSS、腾讯云COS、七牛云、又拍云、AWS CloudFront。" : !a && o > 0 && l <= 1 && (s = `⚠️ 优化效果不明显（仅节省 ${l}%），可能优化参数未生效。`)), {
    originalUrl: t,
    optimizedUrl: u,
    originalSize: n,
    optimizedSize: i,
    savedSize: o,
    savedPercentage: l,
    isOptimizationEffective: a,
    warningMessage: s,
    originalSizeFormatted: Pe(n),
    optimizedSizeFormatted: Pe(i),
    savedSizeFormatted: Pe(o),
    cdn: pe(t)
  };
}
var je = { exports: {} }, ge = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Ke;
function Ft() {
  if (Ke) return ge;
  Ke = 1;
  var t = Ge, u = Symbol.for("react.element"), n = Symbol.for("react.fragment"), i = Object.prototype.hasOwnProperty, o = t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, l = { key: !0, ref: !0, __self: !0, __source: !0 };
  function a(s, d, w) {
    var f, h = {}, P = null, E = null;
    w !== void 0 && (P = "" + w), d.key !== void 0 && (P = "" + d.key), d.ref !== void 0 && (E = d.ref);
    for (f in d) i.call(d, f) && !l.hasOwnProperty(f) && (h[f] = d[f]);
    if (s && s.defaultProps) for (f in d = s.defaultProps, d) h[f] === void 0 && (h[f] = d[f]);
    return { $$typeof: u, type: s, key: P, ref: E, props: h, _owner: o.current };
  }
  return ge.Fragment = n, ge.jsx = a, ge.jsxs = a, ge;
}
var me = {};
/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Ze;
function It() {
  return Ze || (Ze = 1, process.env.NODE_ENV !== "production" && function() {
    var t = Ge, u = Symbol.for("react.element"), n = Symbol.for("react.portal"), i = Symbol.for("react.fragment"), o = Symbol.for("react.strict_mode"), l = Symbol.for("react.profiler"), a = Symbol.for("react.provider"), s = Symbol.for("react.context"), d = Symbol.for("react.forward_ref"), w = Symbol.for("react.suspense"), f = Symbol.for("react.suspense_list"), h = Symbol.for("react.memo"), P = Symbol.for("react.lazy"), E = Symbol.for("react.offscreen"), _ = Symbol.iterator, T = "@@iterator";
    function A(e) {
      if (e === null || typeof e != "object")
        return null;
      var r = _ && e[_] || e[T];
      return typeof r == "function" ? r : null;
    }
    var g = t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    function p(e) {
      {
        for (var r = arguments.length, c = new Array(r > 1 ? r - 1 : 0), v = 1; v < r; v++)
          c[v - 1] = arguments[v];
        I("error", e, c);
      }
    }
    function I(e, r, c) {
      {
        var v = g.ReactDebugCurrentFrame, O = v.getStackAddendum();
        O !== "" && (r += "%s", c = c.concat([O]));
        var L = c.map(function(C) {
          return String(C);
        });
        L.unshift("Warning: " + r), Function.prototype.apply.call(console[e], console, L);
      }
    }
    var y = !1, m = !1, S = !1, R = !1, x = !1, j;
    j = Symbol.for("react.module.reference");
    function H(e) {
      return !!(typeof e == "string" || typeof e == "function" || e === i || e === l || x || e === o || e === w || e === f || R || e === E || y || m || S || typeof e == "object" && e !== null && (e.$$typeof === P || e.$$typeof === h || e.$$typeof === a || e.$$typeof === s || e.$$typeof === d || // This needs to include all possible module reference object
      // types supported by any Flight configuration anywhere since
      // we don't know which Flight build this will end up being used
      // with.
      e.$$typeof === j || e.getModuleId !== void 0));
    }
    function z(e, r, c) {
      var v = e.displayName;
      if (v)
        return v;
      var O = r.displayName || r.name || "";
      return O !== "" ? c + "(" + O + ")" : c;
    }
    function q(e) {
      return e.displayName || "Context";
    }
    function N(e) {
      if (e == null)
        return null;
      if (typeof e.tag == "number" && p("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), typeof e == "function")
        return e.displayName || e.name || null;
      if (typeof e == "string")
        return e;
      switch (e) {
        case i:
          return "Fragment";
        case n:
          return "Portal";
        case l:
          return "Profiler";
        case o:
          return "StrictMode";
        case w:
          return "Suspense";
        case f:
          return "SuspenseList";
      }
      if (typeof e == "object")
        switch (e.$$typeof) {
          case s:
            var r = e;
            return q(r) + ".Consumer";
          case a:
            var c = e;
            return q(c._context) + ".Provider";
          case d:
            return z(e, e.render, "ForwardRef");
          case h:
            var v = e.displayName || null;
            return v !== null ? v : N(e.type) || "Memo";
          case P: {
            var O = e, L = O._payload, C = O._init;
            try {
              return N(C(L));
            } catch {
              return null;
            }
          }
        }
      return null;
    }
    var M = Object.assign, U = 0, Y, ee, te, J, Q, ne, re;
    function ue() {
    }
    ue.__reactDisabledLog = !0;
    function ye() {
      {
        if (U === 0) {
          Y = console.log, ee = console.info, te = console.warn, J = console.error, Q = console.group, ne = console.groupCollapsed, re = console.groupEnd;
          var e = {
            configurable: !0,
            enumerable: !0,
            value: ue,
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
        U++;
      }
    }
    function be() {
      {
        if (U--, U === 0) {
          var e = {
            configurable: !0,
            enumerable: !0,
            writable: !0
          };
          Object.defineProperties(console, {
            log: M({}, e, {
              value: Y
            }),
            info: M({}, e, {
              value: ee
            }),
            warn: M({}, e, {
              value: te
            }),
            error: M({}, e, {
              value: J
            }),
            group: M({}, e, {
              value: Q
            }),
            groupCollapsed: M({}, e, {
              value: ne
            }),
            groupEnd: M({}, e, {
              value: re
            })
          });
        }
        U < 0 && p("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
      }
    }
    var ce = g.ReactCurrentDispatcher, fe;
    function $(e, r, c) {
      {
        if (fe === void 0)
          try {
            throw Error();
          } catch (O) {
            var v = O.stack.trim().match(/\n( *(at )?)/);
            fe = v && v[1] || "";
          }
        return `
` + fe + e;
      }
    }
    var F = !1, k;
    {
      var D = typeof WeakMap == "function" ? WeakMap : Map;
      k = new D();
    }
    function Te(e, r) {
      if (!e || F)
        return "";
      {
        var c = k.get(e);
        if (c !== void 0)
          return c;
      }
      var v;
      F = !0;
      var O = Error.prepareStackTrace;
      Error.prepareStackTrace = void 0;
      var L;
      L = ce.current, ce.current = null, ye();
      try {
        if (r) {
          var C = function() {
            throw Error();
          };
          if (Object.defineProperty(C.prototype, "props", {
            set: function() {
              throw Error();
            }
          }), typeof Reflect == "object" && Reflect.construct) {
            try {
              Reflect.construct(C, []);
            } catch (Z) {
              v = Z;
            }
            Reflect.construct(e, [], C);
          } else {
            try {
              C.call();
            } catch (Z) {
              v = Z;
            }
            e.call(C.prototype);
          }
        } else {
          try {
            throw Error();
          } catch (Z) {
            v = Z;
          }
          e();
        }
      } catch (Z) {
        if (Z && v && typeof Z.stack == "string") {
          for (var b = Z.stack.split(`
`), K = v.stack.split(`
`), B = b.length - 1, V = K.length - 1; B >= 1 && V >= 0 && b[B] !== K[V]; )
            V--;
          for (; B >= 1 && V >= 0; B--, V--)
            if (b[B] !== K[V]) {
              if (B !== 1 || V !== 1)
                do
                  if (B--, V--, V < 0 || b[B] !== K[V]) {
                    var X = `
` + b[B].replace(" at new ", " at ");
                    return e.displayName && X.includes("<anonymous>") && (X = X.replace("<anonymous>", e.displayName)), typeof e == "function" && k.set(e, X), X;
                  }
                while (B >= 1 && V >= 0);
              break;
            }
        }
      } finally {
        F = !1, ce.current = L, be(), Error.prepareStackTrace = O;
      }
      var ae = e ? e.displayName || e.name : "", ie = ae ? $(ae) : "";
      return typeof e == "function" && k.set(e, ie), ie;
    }
    function Xe(e, r, c) {
      return Te(e, !1);
    }
    function et(e) {
      var r = e.prototype;
      return !!(r && r.isReactComponent);
    }
    function he(e, r, c) {
      if (e == null)
        return "";
      if (typeof e == "function")
        return Te(e, et(e));
      if (typeof e == "string")
        return $(e);
      switch (e) {
        case w:
          return $("Suspense");
        case f:
          return $("SuspenseList");
      }
      if (typeof e == "object")
        switch (e.$$typeof) {
          case d:
            return Xe(e.render);
          case h:
            return he(e.type, r, c);
          case P: {
            var v = e, O = v._payload, L = v._init;
            try {
              return he(L(O), r, c);
            } catch {
            }
          }
        }
      return "";
    }
    var de = Object.prototype.hasOwnProperty, Oe = {}, Fe = g.ReactDebugCurrentFrame;
    function ve(e) {
      if (e) {
        var r = e._owner, c = he(e.type, e._source, r ? r.type : null);
        Fe.setExtraStackFrame(c);
      } else
        Fe.setExtraStackFrame(null);
    }
    function tt(e, r, c, v, O) {
      {
        var L = Function.call.bind(de);
        for (var C in e)
          if (L(e, C)) {
            var b = void 0;
            try {
              if (typeof e[C] != "function") {
                var K = Error((v || "React class") + ": " + c + " type `" + C + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof e[C] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                throw K.name = "Invariant Violation", K;
              }
              b = e[C](r, C, v, c, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
            } catch (B) {
              b = B;
            }
            b && !(b instanceof Error) && (ve(O), p("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", v || "React class", c, C, typeof b), ve(null)), b instanceof Error && !(b.message in Oe) && (Oe[b.message] = !0, ve(O), p("Failed %s type: %s", c, b.message), ve(null));
          }
      }
    }
    var rt = Array.isArray;
    function Ee(e) {
      return rt(e);
    }
    function nt(e) {
      {
        var r = typeof Symbol == "function" && Symbol.toStringTag, c = r && e[Symbol.toStringTag] || e.constructor.name || "Object";
        return c;
      }
    }
    function it(e) {
      try {
        return Ie(e), !1;
      } catch {
        return !0;
      }
    }
    function Ie(e) {
      return "" + e;
    }
    function Le(e) {
      if (it(e))
        return p("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", nt(e)), Ie(e);
    }
    var $e = g.ReactCurrentOwner, ot = {
      key: !0,
      ref: !0,
      __self: !0,
      __source: !0
    }, ke, Me;
    function at(e) {
      if (de.call(e, "ref")) {
        var r = Object.getOwnPropertyDescriptor(e, "ref").get;
        if (r && r.isReactWarning)
          return !1;
      }
      return e.ref !== void 0;
    }
    function st(e) {
      if (de.call(e, "key")) {
        var r = Object.getOwnPropertyDescriptor(e, "key").get;
        if (r && r.isReactWarning)
          return !1;
      }
      return e.key !== void 0;
    }
    function lt(e, r) {
      typeof e.ref == "string" && $e.current;
    }
    function ut(e, r) {
      {
        var c = function() {
          ke || (ke = !0, p("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", r));
        };
        c.isReactWarning = !0, Object.defineProperty(e, "key", {
          get: c,
          configurable: !0
        });
      }
    }
    function ct(e, r) {
      {
        var c = function() {
          Me || (Me = !0, p("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", r));
        };
        c.isReactWarning = !0, Object.defineProperty(e, "ref", {
          get: c,
          configurable: !0
        });
      }
    }
    var ft = function(e, r, c, v, O, L, C) {
      var b = {
        // This tag allows us to uniquely identify this as a React Element
        $$typeof: u,
        // Built-in properties that belong on the element
        type: e,
        key: r,
        ref: c,
        props: C,
        // Record the component responsible for creating this element.
        _owner: L
      };
      return b._store = {}, Object.defineProperty(b._store, "validated", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: !1
      }), Object.defineProperty(b, "_self", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: v
      }), Object.defineProperty(b, "_source", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: O
      }), Object.freeze && (Object.freeze(b.props), Object.freeze(b)), b;
    };
    function dt(e, r, c, v, O) {
      {
        var L, C = {}, b = null, K = null;
        c !== void 0 && (Le(c), b = "" + c), st(r) && (Le(r.key), b = "" + r.key), at(r) && (K = r.ref, lt(r, O));
        for (L in r)
          de.call(r, L) && !ot.hasOwnProperty(L) && (C[L] = r[L]);
        if (e && e.defaultProps) {
          var B = e.defaultProps;
          for (L in B)
            C[L] === void 0 && (C[L] = B[L]);
        }
        if (b || K) {
          var V = typeof e == "function" ? e.displayName || e.name || "Unknown" : e;
          b && ut(C, V), K && ct(C, V);
        }
        return ft(e, b, K, O, v, $e.current, C);
      }
    }
    var Se = g.ReactCurrentOwner, Ue = g.ReactDebugCurrentFrame;
    function oe(e) {
      if (e) {
        var r = e._owner, c = he(e.type, e._source, r ? r.type : null);
        Ue.setExtraStackFrame(c);
      } else
        Ue.setExtraStackFrame(null);
    }
    var Re;
    Re = !1;
    function xe(e) {
      return typeof e == "object" && e !== null && e.$$typeof === u;
    }
    function Ae() {
      {
        if (Se.current) {
          var e = N(Se.current.type);
          if (e)
            return `

Check the render method of \`` + e + "`.";
        }
        return "";
      }
    }
    function gt(e) {
      return "";
    }
    var qe = {};
    function mt(e) {
      {
        var r = Ae();
        if (!r) {
          var c = typeof e == "string" ? e : e.displayName || e.name;
          c && (r = `

Check the top-level render call using <` + c + ">.");
        }
        return r;
      }
    }
    function De(e, r) {
      {
        if (!e._store || e._store.validated || e.key != null)
          return;
        e._store.validated = !0;
        var c = mt(r);
        if (qe[c])
          return;
        qe[c] = !0;
        var v = "";
        e && e._owner && e._owner !== Se.current && (v = " It was passed a child from " + N(e._owner.type) + "."), oe(e), p('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', c, v), oe(null);
      }
    }
    function We(e, r) {
      {
        if (typeof e != "object")
          return;
        if (Ee(e))
          for (var c = 0; c < e.length; c++) {
            var v = e[c];
            xe(v) && De(v, r);
          }
        else if (xe(e))
          e._store && (e._store.validated = !0);
        else if (e) {
          var O = A(e);
          if (typeof O == "function" && O !== e.entries)
            for (var L = O.call(e), C; !(C = L.next()).done; )
              xe(C.value) && De(C.value, r);
        }
      }
    }
    function pt(e) {
      {
        var r = e.type;
        if (r == null || typeof r == "string")
          return;
        var c;
        if (typeof r == "function")
          c = r.propTypes;
        else if (typeof r == "object" && (r.$$typeof === d || // Note: Memo only checks outer props here.
        // Inner props are checked in the reconciler.
        r.$$typeof === h))
          c = r.propTypes;
        else
          return;
        if (c) {
          var v = N(r);
          tt(c, e.props, "prop", v, e);
        } else if (r.PropTypes !== void 0 && !Re) {
          Re = !0;
          var O = N(r);
          p("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", O || "Unknown");
        }
        typeof r.getDefaultProps == "function" && !r.getDefaultProps.isReactClassApproved && p("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
      }
    }
    function ht(e) {
      {
        for (var r = Object.keys(e.props), c = 0; c < r.length; c++) {
          var v = r[c];
          if (v !== "children" && v !== "key") {
            oe(e), p("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", v), oe(null);
            break;
          }
        }
        e.ref !== null && (oe(e), p("Invalid attribute `ref` supplied to `React.Fragment`."), oe(null));
      }
    }
    var Ne = {};
    function Be(e, r, c, v, O, L) {
      {
        var C = H(e);
        if (!C) {
          var b = "";
          (e === void 0 || typeof e == "object" && e !== null && Object.keys(e).length === 0) && (b += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
          var K = gt();
          K ? b += K : b += Ae();
          var B;
          e === null ? B = "null" : Ee(e) ? B = "array" : e !== void 0 && e.$$typeof === u ? (B = "<" + (N(e.type) || "Unknown") + " />", b = " Did you accidentally export a JSX literal instead of a component?") : B = typeof e, p("React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", B, b);
        }
        var V = dt(e, r, c, O, L);
        if (V == null)
          return V;
        if (C) {
          var X = r.children;
          if (X !== void 0)
            if (v)
              if (Ee(X)) {
                for (var ae = 0; ae < X.length; ae++)
                  We(X[ae], e);
                Object.freeze && Object.freeze(X);
              } else
                p("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
            else
              We(X, e);
        }
        if (de.call(r, "key")) {
          var ie = N(e), Z = Object.keys(r).filter(function(St) {
            return St !== "key";
          }), Ce = Z.length > 0 ? "{key: someKey, " + Z.join(": ..., ") + ": ...}" : "{key: someKey}";
          if (!Ne[ie + Ce]) {
            var Et = Z.length > 0 ? "{" + Z.join(": ..., ") + ": ...}" : "{}";
            p(`A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`, Ce, ie, Et, ie), Ne[ie + Ce] = !0;
          }
        }
        return e === i ? ht(V) : pt(V), V;
      }
    }
    function vt(e, r, c) {
      return Be(e, r, c, !0);
    }
    function wt(e, r, c) {
      return Be(e, r, c, !1);
    }
    var yt = wt, bt = vt;
    me.Fragment = i, me.jsx = yt, me.jsxs = bt;
  }()), me;
}
process.env.NODE_ENV === "production" ? je.exports = Ft() : je.exports = It();
var W = je.exports;
function qt({
  src: t = "",
  alt: u = "",
  width: n = "100%",
  height: i = "auto",
  className: o = "",
  imageClassName: l = "",
  dataId: a = null,
  imageStyle: s = {},
  immediate: d = !1,
  rootMargin: w = "50px",
  optimize: f = {
    width: 240,
    height: 320,
    quality: 30
  },
  enableBrowserCompression: h = !0,
  // 默认启用浏览器端压缩
  showPlaceholderIcon: P = !1,
  showErrorMessage: E = !1,
  errorSrc: _ = null,
  // 默认为 null，不加载错误图片，直接显示错误占位符
  onLoad: T = null,
  onOptimization: A = null,
  // 优化完成回调
  onError: g = null,
  onClick: p = null
}) {
  const I = se(null), y = se(null), m = se(null), S = se(null), [R, x] = G(!1), [j, H] = G(!1), [z, q] = G(!1), [N, M] = G(d), [U, Y] = G(""), [ee, te] = G(null), [J, Q] = G(!1), ne = ($) => {
    if (!$) return "";
    try {
      if (f && Object.keys(f).length > 0) {
        const F = le($, f);
        if (F && F.trim())
          return F;
      }
      return $;
    } catch (F) {
      return console.warn("图片URL优化失败，使用原始URL:", F), $;
    }
  }, re = Rt(() => t ? ee || (R && U ? U : ne(t)) : "", [t, R, U, f, ee]), ue = () => {
    if (d || typeof window > "u" || !window.IntersectionObserver) {
      M(!0);
      return;
    }
    m.current && (m.current.disconnect(), m.current = null), m.current = new IntersectionObserver(
      ($) => {
        $.forEach((F) => {
          F.isIntersecting && (M(!0), m.current && F.target && m.current.unobserve(F.target));
        });
      },
      {
        rootMargin: w,
        threshold: 0.01
      }
    ), setTimeout(() => {
      y.current && m.current && m.current.observe(y.current);
    }, 0);
  }, ye = async ($) => {
    if (R)
      return;
    const F = $.target.src;
    x(!0), H(!1), q(!1), Y(F);
    let k = null;
    if (t && F !== t)
      try {
        const D = await Ot(t, F);
        D.originalSize !== null && D.optimizedSize !== null ? (k = {
          // 原始信息
          originalUrl: D.originalUrl,
          originalSize: D.originalSize,
          originalSizeFormatted: D.originalSizeFormatted,
          // 优化后信息
          optimizedUrl: D.optimizedUrl,
          optimizedSize: D.optimizedSize,
          optimizedSizeFormatted: D.optimizedSizeFormatted,
          // 节省信息
          savedSize: D.savedSize,
          savedSizeFormatted: D.savedSizeFormatted,
          savedPercentage: D.savedPercentage,
          // 其他信息
          cdn: D.cdn,
          isOptimizationEffective: D.isOptimizationEffective,
          warningMessage: D.warningMessage
        }, S.current = k, A && A(k), D.cdn, D.warningMessage && console.warn(D.warningMessage), D.isOptimizationEffective) : (k = {
          originalUrl: t,
          optimizedUrl: F,
          originalSize: null,
          originalSizeFormatted: null,
          optimizedSize: null,
          optimizedSizeFormatted: null,
          savedSize: null,
          savedSizeFormatted: null,
          savedPercentage: null,
          cdn: pe(t),
          isOptimizationEffective: null,
          warningMessage: "⚠️ 无法获取图片大小（可能由于CORS限制）"
        }, S.current = k, A && A(k));
      } catch (D) {
        console.warn("获取图片大小对比失败:", D), k = {
          originalUrl: t,
          optimizedUrl: F,
          originalSize: null,
          originalSizeFormatted: null,
          optimizedSize: null,
          optimizedSizeFormatted: null,
          savedSize: null,
          savedSizeFormatted: null,
          savedPercentage: null,
          cdn: pe(t),
          isOptimizationEffective: null,
          warningMessage: `获取图片大小对比失败: ${D.message}`
        }, S.current = k, A && A(k);
      }
    T && T($, k);
  }, be = ($) => {
    if (R)
      return;
    const F = $.target.src, k = ne(t);
    if (_ && (F === _ || F.includes("videoCover.png"))) {
      q(!0), H(!1), g && g($);
      return;
    }
    if (F === k && k !== t) {
      console.log("优化URL加载失败，尝试原始URL:", t), $.target.src = t;
      return;
    }
    if (F === t || k === t) {
      if (_ && F !== _) {
        console.log("原始URL加载失败，尝试加载错误图片:", _), $.target.src = _;
        return;
      }
      console.log("图片加载失败，显示错误占位符"), q(!0), H(!1), g && g($);
    }
  }, ce = ($) => {
    var F;
    if (p) {
      const k = {
        // 基本图片信息
        src: t,
        // 原始图片URL
        currentSrc: ((F = $.target) == null ? void 0 : F.src) || re,
        // 当前加载的图片URL
        optimizedSrc: re,
        // 优化后的URL
        alt: u,
        // 图片alt文本
        dataId: a,
        // data-id属性
        // 图片状态
        isLoaded: R,
        // 是否已加载
        isLoading: j,
        // 是否正在加载
        hasError: z,
        // 是否有错误
        isCompressing: J,
        // 是否正在压缩
        // 优化信息（如果已获取）
        optimizationInfo: S.current,
        // 图片元素引用
        imageElement: $.target
        // 图片DOM元素
      };
      p($, k);
    }
  };
  we(() => {
    if (N && !R && !z && !j && !J && t) {
      const $ = pe(t);
      h && // 允许浏览器端压缩
      !$ && // 不支持CDN
      f && Object.keys(f).length > 0 && // 有优化配置
      typeof window < "u" && // 浏览器环境
      !ee ? (Q(!0), zt(t, {
        maxWidth: f.width || null,
        maxHeight: f.height || null,
        quality: f.quality ? f.quality / 100 : 0.8,
        compressionLevel: f.compressionLevel !== void 0 ? f.compressionLevel : 0,
        blur: f.blur !== void 0 ? f.blur : 0,
        smooth: f.smooth !== void 0 ? f.smooth : !0,
        format: f.format || null
      }).then((k) => {
        te(k), Q(!1), Tt(k);
      }).catch((k) => {
        console.warn("浏览器端压缩失败，使用原始URL:", k), Q(!1);
      })) : H(!0);
    }
  }, [N, R, z, j, J, t, f, ee, h]), we(() => {
    x(!1), q(!1), H(!1), Y(""), te(null), Q(!1), S.current = null, d ? M(!0) : ue();
  }, [t]), we(() => (d ? M(!0) : ue(), () => {
    m.current && (m.current.disconnect(), m.current = null);
  }), []);
  const fe = {
    width: typeof n == "number" ? `${n}px` : n,
    height: typeof i == "number" ? `${i}px` : i
  };
  return /* @__PURE__ */ W.jsxs(
    "div",
    {
      ref: y,
      className: `image-optimize-container ${o}`.trim(),
      style: fe,
      children: [
        !R && !z && !j && /* @__PURE__ */ W.jsx("div", { className: "image-optimize-placeholder", children: P && /* @__PURE__ */ W.jsx(
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
        (j || J) && !z && /* @__PURE__ */ W.jsxs("div", { className: "image-optimize-loading", children: [
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
          J && /* @__PURE__ */ W.jsx("span", { style: { marginTop: "8px", fontSize: "12px", color: "#666" }, children: "正在压缩图片..." })
        ] }),
        N && re && /* @__PURE__ */ W.jsx(
          "img",
          {
            ref: I,
            src: re,
            alt: u,
            "data-id": a,
            className: `image-optimize-image ${l}`.trim(),
            style: {
              display: R || !z && re ? "block" : "none",
              ...s
            },
            onLoad: ye,
            onError: be,
            onClick: ce
          }
        ),
        z && /* @__PURE__ */ W.jsxs("div", { className: "image-optimize-error", children: [
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
          E && /* @__PURE__ */ W.jsx("span", { className: "image-optimize-error-text", children: "加载失败" })
        ] })
      ]
    }
  );
}
function Dt({
  src: t = "",
  alt: u = "",
  width: n = "100%",
  height: i = "auto",
  className: o = "",
  imageClassName: l = "",
  imageStyle: a = {},
  stages: s = [
    { width: 20, quality: 20 },
    // 阶段1: 极速模糊图
    { width: 400, quality: 50 },
    // 阶段2: 中等质量
    { width: null, quality: 80 }
    // 阶段3: 最终质量（原图）
  ],
  transitionDuration: d = 300,
  timeout: w = 3e4,
  showPlaceholder: f = !0,
  onStageComplete: h = null,
  onComplete: P = null,
  onError: E = null,
  onLoad: _ = null
}) {
  const [T, A] = G(-1), [g, p] = G(""), [I, y] = G(!1), [m, S] = G(!1), [R, x] = G(""), [j, H] = G(!1), z = se(null), q = se(null);
  we(() => {
    var ee, te;
    if (!t) return;
    const U = jt(t, {
      width: ((ee = s[0]) == null ? void 0 : ee.width) || 20,
      quality: ((te = s[0]) == null ? void 0 : te.quality) || 20
    });
    p(U), A(0), y(!0), S(!1), x(""), H(!1);
    let Y = !1;
    return ze(t, {
      stages: s,
      timeout: w,
      onStageComplete: (J, Q, ne) => {
        Y || (A(J + 1), p(Q), h && h(J, Q, ne));
      },
      onComplete: (J) => {
        Y || (y(!1), H(!0), p(J), P && P(J));
      },
      onError: (J, Q) => {
        Y || (y(!1), S(!0), x(J.message), E && E(J, Q));
      }
    }), () => {
      Y = !0;
    };
  }, [t]);
  const N = {
    width: typeof n == "number" ? `${n}px` : n,
    height: typeof i == "number" ? `${i}px` : i,
    position: "relative",
    overflow: "hidden"
  }, M = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: `opacity ${d}ms ease-in-out, filter ${d}ms ease-in-out`,
    opacity: T >= 0 ? 1 : 0,
    // 真正的渐进式加载资源 + CSS模糊效果增强视觉体验
    filter: T === 0 ? "blur(10px)" : T === 1 ? "blur(3px)" : "blur(0px)",
    ...a
  };
  return /* @__PURE__ */ W.jsxs(
    "div",
    {
      ref: z,
      className: `progressive-image-container ${o}`.trim(),
      style: N,
      children: [
        f && T < 0 && !m && /* @__PURE__ */ W.jsx("div", { className: "image-optimize-placeholder", style: {
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
        g && /* @__PURE__ */ W.jsx(
          "img",
          {
            ref: q,
            src: g,
            alt: u,
            className: `progressive-image ${l}`.trim(),
            style: M,
            onLoad: (U) => {
              j && _ && _(U);
            },
            onError: (U) => {
              m || (S(!0), x("图片加载失败"), E && E(new Error("图片加载失败"), T));
            }
          }
        ),
        m && /* @__PURE__ */ W.jsxs("div", { style: {
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
          /* @__PURE__ */ W.jsx("div", { children: R || "加载失败" })
        ] }),
        I && !m && T < s.length && /* @__PURE__ */ W.jsxs("div", { style: {
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
          T + 1,
          " / ",
          s.length
        ] })
      ]
    }
  );
}
export {
  qt as LazyImage,
  Dt as ProgressiveImage,
  Ot as compareImageSizes,
  zt as compressImageInBrowser,
  Tt as dataURLToBlob,
  qt as default,
  pe as detectCDN,
  xt as detectImageFormat,
  _e as detectSupportedFormats,
  Pe as formatFileSize,
  jt as generateBlurPlaceholderUrl,
  $t as generateResponsiveImage,
  He as generateSizes,
  Ct as generateSrcset,
  Ve as getBestFormat,
  Je as getImageSize,
  kt as getOptimizedCoverUrl,
  ze as loadImageProgressive,
  Ut as loadImagesBatch,
  At as loadImagesProgressiveBatch,
  _t as loadImagesProgressively,
  le as optimizeImageUrl,
  Pt as preloadImage,
  Mt as preloadImages
};
