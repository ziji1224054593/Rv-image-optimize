import jt, { useRef as se, useState as X, useMemo as ar, useEffect as Ue } from "react";
function Je() {
  const e = [];
  if (typeof window < "u" && typeof document < "u") {
    const r = (() => {
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
    })() && e.push("avif"), r && e.push("webp");
  }
  return e.push("jpg", "jpeg", "png"), e;
}
function ft(e = null) {
  const a = Je();
  if (e) {
    const r = e.toLowerCase().replace("jpeg", "jpg");
    if (a.includes(r))
      return r;
  }
  return a[0] || "jpg";
}
function qt(e) {
  if (!e) return null;
  const r = e.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)(\?|$)/i);
  if (r) {
    const n = r[1].toLowerCase();
    return n === "jpeg" ? "jpg" : n;
  }
  try {
    const n = new URL(e), o = n.searchParams.get("format") || n.searchParams.get("f") || n.searchParams.get("image_format");
    if (o)
      return o.toLowerCase().replace("jpeg", "jpg");
  } catch {
  }
  return null;
}
const Ut = {
  // 阿里云OSS
  aliyun: {
    test: (e) => e.includes("aliyuncs.com") || e.includes("oss-"),
    process: (e, a) => {
      const { width: r, height: n, quality: o, format: s } = a, l = [];
      return (r || n) && l.push(`resize,w_${r || ""},h_${n || ""},m_lfit`), o && l.push(`quality,q_${o}`), s && l.push(`format,${s}`), l.length > 0 && e.searchParams.set("x-oss-process", l.join("/")), e.toString();
    }
  },
  // 腾讯云COS
  tencent: {
    test: (e) => e.includes("qcloud.com") || e.includes("myqcloud.com"),
    process: (e, a) => {
      const { width: r, height: n, quality: o, format: s } = a, l = [];
      if ((r || n) && l.push(`imageMogr2/thumbnail/${r}x${n}`), o && l.push(`quality/${o}`), s && l.push(`format/${s}`), l.length > 0) {
        const u = l.join("|"), i = e.search ? "|" : "?imageMogr2/";
        return `${e.toString()}${i}${u}`;
      }
      return e.toString();
    }
  },
  // 七牛云
  qiniu: {
    test: (e) => e.includes("qiniucdn.com") || e.includes("qiniu.com"),
    process: (e, a) => {
      const { width: r, height: n, quality: o, format: s } = a, l = [];
      if ((r || n) && l.push(`imageView2/1/w/${r || ""}/h/${n || ""}`), o && l.push(`quality/${o}`), s && l.push(`format/${s}`), l.length > 0) {
        const u = l.join("|"), i = e.search ? "|" : "?";
        return `${e.toString()}${i}${u}`;
      }
      return e.toString();
    }
  },
  // 又拍云
  upyun: {
    test: (e) => e.includes("upaiyun.com") || e.includes("upyun.com"),
    process: (e, a) => {
      const { width: r, height: n, quality: o, format: s } = a, l = [];
      if ((r || n) && l.push(`${r || ""}x${n || ""}`), o && l.push(`quality/${o}`), s && l.push(`format/${s}`), l.length > 0) {
        const u = e.pathname.split("/"), i = u[u.length - 1], d = u.slice(0, -1).join("/") + "/!" + l.join("/") + "/" + i;
        e.pathname = d;
      }
      return e.toString();
    }
  },
  // AWS CloudFront (需要配合 Lambda@Edge 或 CloudFront Functions)
  cloudfront: {
    test: (e) => e.includes("cloudfront.net") || e.includes(".aws"),
    process: (e, a) => {
      const { width: r, height: n, quality: o, format: s } = a;
      return r && e.searchParams.set("w", r), n && e.searchParams.set("h", n), o && e.searchParams.set("q", o), s && e.searchParams.set("f", s), e.toString();
    }
  }
};
function Be(e, a = {}) {
  if (!e) return e;
  const {
    width: r = null,
    height: n = null,
    quality: o = 30,
    format: s = null,
    autoFormat: l = !0
    // 自动选择最佳格式
  } = a;
  try {
    let u;
    try {
      u = new URL(e);
    } catch {
      if (e.startsWith("/")) {
        const b = typeof window < "u" && window.location ? window.location.origin : "https://example.com";
        u = new URL(e, b);
      } else
        return console.warn("无法解析的图片URL，跳过优化:", e), e;
    }
    let i = s;
    l && !s ? i = ft() : s && (i = ft(s));
    for (const [c, b] of Object.entries(Ut))
      if (b.test(e))
        return b.process(u, {
          width: r,
          height: n,
          quality: o,
          format: i
        });
    return r && u.searchParams.set("w", r), n && u.searchParams.set("h", n), o && u.searchParams.set("q", o), i && u.searchParams.set("f", i), u.toString();
  } catch (u) {
    return console.warn("图片URL优化失败:", u), e;
  }
}
function kt(e, a = {}) {
  if (!e) return "";
  const {
    widths: r = null,
    // 默认自动生成
    aspectRatio: n = null,
    quality: o = 80,
    format: s = null,
    autoFormat: l = !0
  } = a;
  return (r || [320, 640, 960, 1280, 1920]).map((c) => `${Be(e, {
    width: c,
    height: n ? Math.round(c / n) : null,
    quality: o,
    format: s,
    autoFormat: l
  })} ${c}w`).join(", ");
}
function dt(e = {}) {
  const {
    breakpoints: a = [
      "(max-width: 640px) 100vw",
      "(max-width: 1024px) 50vw",
      "33vw"
    ]
  } = e;
  return Array.isArray(a) ? a.join(", ") : a;
}
function or(e, a = {}) {
  if (!e) return { src: "", srcset: "", sizes: "" };
  const {
    widths: r = null,
    aspectRatio: n = null,
    quality: o = 80,
    format: s = null,
    autoFormat: l = !0,
    sizes: u = null,
    fallbackWidth: i = 960
    // 默认回退宽度
  } = a, d = kt(e, {
    widths: r,
    aspectRatio: n,
    quality: o,
    format: s,
    autoFormat: l
  }), c = u ? typeof u == "string" ? u : dt(u) : dt();
  return {
    src: Be(e, {
      width: i,
      height: n ? Math.round(i / n) : null,
      quality: o,
      format: s,
      autoFormat: l
    }),
    srcset: d,
    sizes: c
  };
}
function sr(e) {
  return Be(e, {
    width: 240,
    // 根据实际显示尺寸调整
    height: 320,
    quality: 75
  });
}
function zt(e) {
  return new Promise((a) => {
    if (!e) {
      a(!1);
      return;
    }
    const r = new Image();
    r.onload = () => a(!0), r.onerror = () => a(!1), r.src = e;
  });
}
async function ir(e, a = 3) {
  const r = [], n = [...e], o = async () => {
    for (; n.length > 0; ) {
      const l = n.shift(), u = await zt(l);
      r.push({ url: l, success: u });
    }
  }, s = Array(Math.min(a, e.length)).fill(null).map(() => o());
  return await Promise.all(s), r;
}
async function $t(e, a = {}) {
  const {
    concurrency: r = 10,
    // 默认高并发
    timeout: n = 3e4,
    // 30秒超时
    priority: o = !0,
    // 默认按优先级
    stages: s = null,
    // 渐进式加载阶段（可选）
    enableCache: l = !0,
    // 是否启用缓存（默认true）
    urlTransformer: u = null,
    // URL转换函数（用于自定义URL生成逻辑）
    onStageError: i = null,
    // 阶段错误回调（用于处理错误并返回降级URL）
    onProgress: d = null,
    onItemComplete: c = null,
    onItemStageComplete: b = null,
    // 阶段完成回调
    retryOnError: g = !1,
    maxRetries: h = 1
  } = a, y = e.map((v, S) => typeof v == "string" ? { url: v, priority: 0, index: S } : {
    url: v.url || v.src || "",
    priority: v.priority || 0,
    index: v.index !== void 0 ? v.index : S
  });
  o && y.sort((v, S) => S.priority - v.priority);
  const m = new Array(y.length);
  let C = 0;
  const E = y.length, p = async (v, S = 0) => {
    const { url: _, index: A } = v;
    if (!_) {
      const D = {
        url: "",
        success: !1,
        error: new Error("图片URL为空"),
        index: A,
        retries: S
      };
      return m[A] = D, C++, d && d(C, E, D), c && c(D), D;
    }
    if (s && Array.isArray(s) && s.length > 0) {
      const { loadImageProgressiveWithCache: P } = await Promise.resolve().then(() => _r);
      return P(_, {
        stages: s,
        timeout: n,
        enableCache: l,
        // 传递缓存开关
        urlTransformer: u,
        // 传递URL转换函数
        onStageError: i,
        // 传递阶段错误回调
        onStageComplete: (D, U, W) => {
          b && b({
            url: _,
            index: A,
            stageIndex: D,
            stageUrl: U,
            stage: W,
            currentStage: D + 1,
            totalStages: s.length
          }, D);
        },
        onComplete: (D) => {
        },
        onError: (D, U) => {
        }
      }).then((D) => {
        const U = {
          url: D.url,
          success: D.success,
          error: D.error,
          index: A,
          retries: S,
          stages: D.stages,
          fromCache: D.fromCache || !1
          // 标记是否来自缓存
        };
        return m[A] = U, C++, d && d(C, E, U), c && c(U), U;
      });
    }
    return new Promise((P) => {
      const D = new Image();
      let U = !1, W = null;
      const J = () => {
        W && (clearTimeout(W), W = null), D.onload = null, D.onerror = null, D.src = "";
      }, F = (L, Y = null) => {
        if (U) return null;
        U = !0, J();
        const K = {
          url: _,
          success: L,
          error: Y,
          index: A,
          retries: S
        };
        return m[A] = K, C++, d && d(C, E, K), c && c(K), K;
      };
      W = setTimeout(() => {
        const L = new Error(`图片加载超时 (${n}ms)`), Y = F(!1, L);
        g && S < h ? setTimeout(() => {
          p(v, S + 1).then(P);
        }, 1e3 * (S + 1)) : P(Y);
      }, n), D.onload = () => {
        const L = F(!0, null);
        L && P(L);
      }, D.onerror = (L) => {
        const Y = new Error("图片加载失败");
        Y.originalEvent = L;
        const K = F(!1, Y);
        g && S < h ? setTimeout(() => {
          p(v, S + 1).then(P);
        }, 1e3 * (S + 1)) : P(K);
      };
      try {
        D.crossOrigin = "anonymous", D.src = _;
      } catch (L) {
        const Y = F(!1, L);
        Y && P(Y);
      }
    });
  }, j = [...y], x = /* @__PURE__ */ new Set(), R = [];
  return await (async () => {
    for (; j.length > 0 || x.size > 0; ) {
      for (; j.length > 0 && x.size < r; ) {
        const v = j.shift(), S = p(v).then((_) => (x.delete(S), _)).catch((_) => {
          x.delete(S);
          const A = {
            url: v.url,
            success: !1,
            error: _ instanceof Error ? _ : new Error(String(_)),
            index: v.index,
            retries: 0
          };
          return m[v.index] = A, C++, d && d(C, E, A), c && c(A), A;
        });
        x.add(S), R.push(S);
      }
      x.size > 0 && await Promise.race(Array.from(x));
    }
  })(), await Promise.all(R), m;
}
async function cr(e, a = {}) {
  return $t(e, {
    priority: !1,
    // 批量加载不需要优先级
    ...a
  });
}
function At(e, a = {}) {
  if (!e) return e;
  const {
    width: r = 20,
    height: n = null,
    quality: o = 20,
    blur: s = 10
  } = a;
  return Be(e, {
    width: r,
    height: n,
    quality: o,
    format: "jpg"
    // 使用 jpg 格式，文件更小
  });
}
async function Ot(e, a = {}) {
  var b;
  const {
    stages: r = [
      { width: 20, quality: 20, blur: 10 },
      // 阶段1: 极速模糊图
      { width: 400, quality: 50, blur: 3 },
      // 阶段2: 中等质量
      { width: null, quality: 80, blur: 0 }
      // 阶段3: 最终质量（原图）
    ],
    timeout: n = 3e4,
    urlTransformer: o = null,
    onStageComplete: s = null,
    onStageError: l = null,
    onComplete: u = null,
    onError: i = null
  } = a;
  if (!e) {
    const g = new Error("图片URL为空");
    return i && i(g, -1), {
      url: "",
      stages: [],
      success: !1,
      error: g
    };
  }
  const d = [];
  let c = e;
  try {
    for (let h = 0; h < r.length; h++) {
      const y = r[h];
      let m;
      o && typeof o == "function" ? m = o(e, y, h) : h === r.length - 1 && !y.width && !y.height ? m = e : m = Be(e, {
        width: y.width || null,
        height: y.height || null,
        quality: y.quality || 80,
        format: y.format || null,
        autoFormat: y.autoFormat !== !1
      });
      let C;
      try {
        C = await new Promise((E, p) => {
          const j = new Image();
          let x = null, R = !1;
          const q = () => {
            x && (clearTimeout(x), x = null), j.onload = null, j.onerror = null, j.src = "";
          };
          x = setTimeout(() => {
            if (!R) {
              R = !0, q();
              const v = new Error(`阶段 ${h + 1} 加载超时: ${m}`);
              p(v);
            }
          }, n), j.onload = () => {
            R || (R = !0, q(), E({
              url: m,
              stage: y,
              loaded: !0
            }));
          }, j.onerror = (v) => {
            if (!R) {
              R = !0, q();
              let S = `阶段 ${h + 1} 加载失败`;
              try {
                if (v.target && v.target.src) {
                  const A = v.target.src;
                  S = `阶段 ${h + 1} 加载失败`;
                }
              } catch {
              }
              const _ = new Error(S);
              _.originalEvent = v, _.stageUrl = m, _.stageIndex = h, p(_);
            }
          };
          try {
            j.crossOrigin = "anonymous", j.src = m;
          } catch (v) {
            R || (R = !0, q(), p(v));
          }
        }), d.push(C), c = m, s && s(h, m, y);
      } catch (E) {
        let p = null;
        if (l && typeof l == "function")
          try {
            p = l(E, h, m, y);
          } catch {
          }
        if (p && typeof p == "string")
          try {
            const x = await new Promise((R, q) => {
              const v = new Image();
              let S = null, _ = !1;
              const A = () => {
                S && (clearTimeout(S), S = null), v.onload = null, v.onerror = null, v.src = "";
              };
              S = setTimeout(() => {
                _ || (_ = !0, A(), q(new Error(`降级URL加载超时: ${p}`)));
              }, n), v.onload = () => {
                _ || (_ = !0, A(), R({
                  url: p,
                  stage: y,
                  loaded: !0
                }));
              }, v.onerror = () => {
                _ || (_ = !0, A(), q(new Error(`降级URL加载失败: ${p}`)));
              };
              try {
                v.crossOrigin = "anonymous", v.src = p;
              } catch (P) {
                _ || (_ = !0, A(), q(P));
              }
            });
            d.push(x), c = p, s && s(h, p, y);
            break;
          } catch {
          }
        const j = E.message.includes("404") || E.originalEvent && E.originalEvent.type === "error";
        if ((!j || process.env.NODE_ENV === "development") && (j || console.warn(`⚠️ 阶段 ${h + 1} 加载失败，跳过继续下一阶段:`, E.message)), d.push({
          url: m,
          stage: y,
          loaded: !1,
          error: E
        }), h === r.length - 1 && d.length > 0) {
          for (let x = d.length - 1; x >= 0; x--)
            if (d[x].loaded) {
              c = d[x].url;
              break;
            }
        }
        if (s && s(h, m, y), !(h < r.length - 1)) {
          if (!d.some((x) => x.loaded))
            throw new Error(`所有阶段加载失败，最后一个错误: ${E.message}`);
        }
      }
      h < r.length - 1 && await new Promise((E) => setTimeout(E, 100));
    }
    if (!d.some((h) => h.loaded)) {
      const h = ((b = d[d.length - 1]) == null ? void 0 : b.error) || new Error("所有阶段加载失败"), y = h.message.includes("404") || h.originalEvent && h.originalEvent.type === "error";
      return (!y || process.env.NODE_ENV === "development") && (y || console.error(`❌ 图片加载失败: ${e.substring(0, 50)}...`, h.message)), i && i(h, d.length - 1), {
        url: c || e,
        stages: d,
        success: !1,
        error: h
      };
    }
    return u && u(c), {
      url: c,
      stages: d,
      success: !0,
      error: null
    };
  } catch (g) {
    const h = d.length, y = g.message && g.message.includes("404");
    return (!y || process.env.NODE_ENV === "development") && (y || console.error(`❌ 渐进式加载过程出错: ${e.substring(0, 50)}...`, g.message || g)), i && i(g, h), {
      url: c || e,
      stages: d,
      success: !1,
      error: g
    };
  }
}
async function lr(e, a = {}) {
  const {
    stages: r = [
      { width: 20, quality: 20, blur: 10 },
      { width: 400, quality: 50, blur: 3 },
      { width: null, quality: 80, blur: 0 }
    ],
    concurrency: n = 5,
    // 渐进式加载建议较低并发，避免网络拥塞
    timeout: o = 3e4,
    onProgress: s = null,
    onItemStageComplete: l = null,
    onItemComplete: u = null
  } = a, i = e.map((E, p) => typeof E == "string" ? { url: E, index: p } : {
    url: E.url || E.src || "",
    index: E.index !== void 0 ? E.index : p
  }), d = new Array(i.length);
  let c = 0;
  const b = i.length, g = async (E) => {
    const { url: p, index: j } = E, x = await Ot(p, {
      stages: r,
      timeout: o,
      onStageComplete: (R, q, v) => {
        l && l({
          url: p,
          index: j,
          stageIndex: R,
          stageUrl: q,
          stage: v,
          currentStage: R + 1,
          totalStages: r.length
        }, R);
      },
      onComplete: (R) => {
      },
      onError: (R, q) => {
      }
    });
    return d[j] = x, c++, s && s(c, b, x), u && u(x), x;
  }, h = [...i], y = /* @__PURE__ */ new Set(), m = [];
  return await (async () => {
    for (; h.length > 0 || y.size > 0; ) {
      for (; h.length > 0 && y.size < n; ) {
        const E = h.shift(), p = g(E).then((j) => (y.delete(p), j)).catch((j) => {
          y.delete(p);
          const x = {
            url: E.url,
            stages: [],
            success: !1,
            error: j instanceof Error ? j : new Error(String(j))
          };
          return d[E.index] = x, c++, s && s(c, b, x), u && u(x), x;
        });
        y.add(p), m.push(p);
      }
      y.size > 0 && await Promise.race(Array.from(y));
    }
  })(), await Promise.all(m), d;
}
async function Nt(e, a = {}) {
  const {
    maxWidth: r = null,
    maxHeight: n = null,
    quality: o = 0.8,
    compressionLevel: s = 0.5,
    // 压缩程度 0-1
    blur: l = 0,
    // 模糊程度 0-10
    smooth: u = !0,
    // 图像平滑
    format: i = null
  } = a;
  if (typeof window > "u" || typeof document > "u")
    throw new Error("浏览器端压缩功能仅在浏览器环境中可用");
  return new Promise((d, c) => {
    const b = new Image();
    if (b.crossOrigin = "anonymous", b.onload = () => {
      try {
        let { width: g, height: h } = b, y = g, m = h, C = !1;
        if (r || n) {
          const P = Math.min(
            r ? r / g : 1,
            n ? n / h : 1
          );
          P < 1 && (y = Math.round(g * P), m = Math.round(h * P), C = !0);
        }
        let E = y, p = m;
        if (s > 0) {
          const P = 1 - s * 0.75;
          E = Math.round(y * P), p = Math.round(m * P);
        }
        const j = E !== g || p !== h;
        if (!(j || s > 0 || l > 0) && typeof e == "string") {
          d(e);
          return;
        }
        const R = document.createElement("canvas");
        R.width = E, R.height = p;
        const q = R.getContext("2d");
        if (j ? (q.imageSmoothingEnabled = u, q.imageSmoothingQuality = u ? "high" : "low") : q.imageSmoothingEnabled = !1, q.drawImage(b, 0, 0, E, p), l > 0) {
          const P = document.createElement("canvas"), D = P.getContext("2d");
          if (P.width = E, P.height = p, D.drawImage(b, 0, 0, E, p), D.filter !== void 0)
            try {
              D.filter = `blur(${l}px)`, D.drawImage(P, 0, 0), D.filter = "none", q.clearRect(0, 0, R.width, R.height), q.drawImage(P, 0, 0);
            } catch {
              Rt(q, P, E, p, l);
            }
          else
            Rt(q, P, E, p, l);
        }
        let v = i;
        if (!v)
          if (s > 0 || l > 0 || j)
            v = Je().includes("webp") ? "webp" : "jpeg";
          else {
            const D = qt(e);
            D && ["jpg", "jpeg", "png"].includes(D) ? v = D === "jpeg" ? "jpeg" : D : v = Je().includes("webp") ? "webp" : "jpeg";
          }
        let S = o;
        s > 0 ? (S = o * (1 - s * 0.7), S = Math.max(0.1, Math.min(1, S))) : !j && l === 0 ? S = Math.max(o, 0.98) : j && (S = Math.max(o, 0.92));
        const _ = v === "webp" ? "image/webp" : v === "png" ? "image/png" : "image/jpeg", A = R.toDataURL(_, S);
        d(A);
      } catch (g) {
        c(new Error("图片压缩失败: " + g.message));
      }
    }, b.onerror = () => {
      c(new Error("图片加载失败"));
    }, typeof e == "string")
      b.src = e;
    else if (e instanceof File || e instanceof Blob) {
      const g = new FileReader();
      g.onload = (h) => {
        b.src = h.target.result;
      }, g.onerror = () => c(new Error("文件读取失败")), g.readAsDataURL(e);
    } else
      c(new Error("不支持的图片源类型"));
  });
}
function Rt(e, a, r, n, o) {
  const s = document.createElement("canvas"), l = s.getContext("2d"), u = Math.max(0.3, 1 - o / 10), i = Math.round(r * u), d = Math.round(n * u);
  s.width = i, s.height = d, l.drawImage(a, 0, 0, r, n, 0, 0, i, d), e.clearRect(0, 0, r, n), e.drawImage(s, 0, 0, i, d, 0, 0, r, n);
}
function It(e) {
  const a = e.split(","), r = a[0].match(/:(.*?);/)[1], n = atob(a[1]);
  let o = n.length;
  const s = new Uint8Array(o);
  for (; o--; )
    s[o] = n.charCodeAt(o);
  return new Blob([s], { type: r });
}
async function gt(e) {
  if (!e) return null;
  try {
    if (e.startsWith("blob:"))
      return (await (await fetch(e)).blob()).size;
    if (e.startsWith("data:")) {
      const n = e.split(",")[1];
      if (n) {
        const o = atob(n);
        return new Blob([o]).size;
      }
      return null;
    }
    try {
      const o = (await fetch(e, { method: "HEAD" })).headers.get("Content-Length");
      if (o)
        return parseInt(o, 10);
    } catch {
    }
    return (await (await fetch(e)).blob()).size;
  } catch {
    return null;
  }
}
function Ke(e) {
  if (e == null) return "未知";
  if (e === 0) return "0 B";
  const a = 1024, r = ["B", "KB", "MB", "GB"], n = Math.floor(Math.log(e) / Math.log(a));
  return parseFloat((e / Math.pow(a, n)).toFixed(2)) + " " + r[n];
}
function ke(e) {
  if (!e) return null;
  for (const [a, r] of Object.entries(Ut))
    if (r.test(e))
      return a;
  return null;
}
async function Lt(e, a) {
  const [r, n] = await Promise.all([
    gt(e),
    gt(a)
  ]);
  let o = null, s = null, l = !1, u = null;
  return r !== null && n !== null && (o = r - n, s = parseFloat((o / r * 100).toFixed(2)), l = o > 1024 || s > 1, !l && o === 0 ? ke(e) ? u = "⚠️ 优化参数可能无效，图片大小未发生变化。请检查CDN配置是否正确。" : u = "⚠️ 该图片URL不是支持的CDN，通用查询参数可能无效。支持的CDN：阿里云OSS、腾讯云COS、七牛云、又拍云、AWS CloudFront。" : !l && o > 0 && s <= 1 && (u = `⚠️ 优化效果不明显（仅节省 ${s}%），可能优化参数未生效。`)), {
    originalUrl: e,
    optimizedUrl: a,
    originalSize: r,
    optimizedSize: n,
    savedSize: o,
    savedPercentage: s,
    isOptimizationEffective: l,
    warningMessage: u,
    originalSizeFormatted: Ke(r),
    optimizedSizeFormatted: Ke(n),
    savedSizeFormatted: Ke(o),
    cdn: ke(e)
  };
}
const ur = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  compareImageSizes: Lt,
  compressImageInBrowser: Nt,
  dataURLToBlob: It,
  detectCDN: ke,
  detectImageFormat: qt,
  detectSupportedFormats: Je,
  formatFileSize: Ke,
  generateBlurPlaceholderUrl: At,
  generateResponsiveImage: or,
  generateSizes: dt,
  generateSrcset: kt,
  getBestFormat: ft,
  getImageSize: gt,
  getOptimizedCoverUrl: sr,
  loadImageProgressive: Ot,
  loadImagesBatch: cr,
  loadImagesProgressiveBatch: lr,
  loadImagesProgressively: $t,
  optimizeImageUrl: Be,
  preloadImage: zt,
  preloadImages: ir
}, Symbol.toStringTag, { value: "Module" }));
var mt = { exports: {} }, Ne = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Dt;
function fr() {
  if (Dt) return Ne;
  Dt = 1;
  var e = jt, a = Symbol.for("react.element"), r = Symbol.for("react.fragment"), n = Object.prototype.hasOwnProperty, o = e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, s = { key: !0, ref: !0, __self: !0, __source: !0 };
  function l(u, i, d) {
    var c, b = {}, g = null, h = null;
    d !== void 0 && (g = "" + d), i.key !== void 0 && (g = "" + i.key), i.ref !== void 0 && (h = i.ref);
    for (c in i) n.call(i, c) && !s.hasOwnProperty(c) && (b[c] = i[c]);
    if (u && u.defaultProps) for (c in i = u.defaultProps, i) b[c] === void 0 && (b[c] = i[c]);
    return { $$typeof: a, type: u, key: g, ref: h, props: b, _owner: o.current };
  }
  return Ne.Fragment = r, Ne.jsx = l, Ne.jsxs = l, Ne;
}
var Ie = {};
/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var _t;
function dr() {
  return _t || (_t = 1, process.env.NODE_ENV !== "production" && function() {
    var e = jt, a = Symbol.for("react.element"), r = Symbol.for("react.portal"), n = Symbol.for("react.fragment"), o = Symbol.for("react.strict_mode"), s = Symbol.for("react.profiler"), l = Symbol.for("react.provider"), u = Symbol.for("react.context"), i = Symbol.for("react.forward_ref"), d = Symbol.for("react.suspense"), c = Symbol.for("react.suspense_list"), b = Symbol.for("react.memo"), g = Symbol.for("react.lazy"), h = Symbol.for("react.offscreen"), y = Symbol.iterator, m = "@@iterator";
    function C(t) {
      if (t === null || typeof t != "object")
        return null;
      var f = y && t[y] || t[m];
      return typeof f == "function" ? f : null;
    }
    var E = e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    function p(t) {
      {
        for (var f = arguments.length, w = new Array(f > 1 ? f - 1 : 0), T = 1; T < f; T++)
          w[T - 1] = arguments[T];
        j("error", t, w);
      }
    }
    function j(t, f, w) {
      {
        var T = E.ReactDebugCurrentFrame, O = T.getStackAddendum();
        O !== "" && (f += "%s", w = w.concat([O]));
        var I = w.map(function(z) {
          return String(z);
        });
        I.unshift("Warning: " + f), Function.prototype.apply.call(console[t], console, I);
      }
    }
    var x = !1, R = !1, q = !1, v = !1, S = !1, _;
    _ = Symbol.for("react.module.reference");
    function A(t) {
      return !!(typeof t == "string" || typeof t == "function" || t === n || t === s || S || t === o || t === d || t === c || v || t === h || x || R || q || typeof t == "object" && t !== null && (t.$$typeof === g || t.$$typeof === b || t.$$typeof === l || t.$$typeof === u || t.$$typeof === i || // This needs to include all possible module reference object
      // types supported by any Flight configuration anywhere since
      // we don't know which Flight build this will end up being used
      // with.
      t.$$typeof === _ || t.getModuleId !== void 0));
    }
    function P(t, f, w) {
      var T = t.displayName;
      if (T)
        return T;
      var O = f.displayName || f.name || "";
      return O !== "" ? w + "(" + O + ")" : w;
    }
    function D(t) {
      return t.displayName || "Context";
    }
    function U(t) {
      if (t == null)
        return null;
      if (typeof t.tag == "number" && p("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), typeof t == "function")
        return t.displayName || t.name || null;
      if (typeof t == "string")
        return t;
      switch (t) {
        case n:
          return "Fragment";
        case r:
          return "Portal";
        case s:
          return "Profiler";
        case o:
          return "StrictMode";
        case d:
          return "Suspense";
        case c:
          return "SuspenseList";
      }
      if (typeof t == "object")
        switch (t.$$typeof) {
          case u:
            var f = t;
            return D(f) + ".Consumer";
          case l:
            var w = t;
            return D(w._context) + ".Provider";
          case i:
            return P(t, t.render, "ForwardRef");
          case b:
            var T = t.displayName || null;
            return T !== null ? T : U(t.type) || "Memo";
          case g: {
            var O = t, I = O._payload, z = O._init;
            try {
              return U(z(I));
            } catch {
              return null;
            }
          }
        }
      return null;
    }
    var W = Object.assign, J = 0, F, L, Y, K, Z, ce, Ee;
    function be() {
    }
    be.__reactDisabledLog = !0;
    function Ve() {
      {
        if (J === 0) {
          F = console.log, L = console.info, Y = console.warn, K = console.error, Z = console.group, ce = console.groupCollapsed, Ee = console.groupEnd;
          var t = {
            configurable: !0,
            enumerable: !0,
            value: be,
            writable: !0
          };
          Object.defineProperties(console, {
            info: t,
            log: t,
            warn: t,
            error: t,
            group: t,
            groupCollapsed: t,
            groupEnd: t
          });
        }
        J++;
      }
    }
    function Se() {
      {
        if (J--, J === 0) {
          var t = {
            configurable: !0,
            enumerable: !0,
            writable: !0
          };
          Object.defineProperties(console, {
            log: W({}, t, {
              value: F
            }),
            info: W({}, t, {
              value: L
            }),
            warn: W({}, t, {
              value: Y
            }),
            error: W({}, t, {
              value: K
            }),
            group: W({}, t, {
              value: Z
            }),
            groupCollapsed: W({}, t, {
              value: ce
            }),
            groupEnd: W({}, t, {
              value: Ee
            })
          });
        }
        J < 0 && p("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
      }
    }
    var ve = E.ReactCurrentDispatcher, ne;
    function xe(t, f, w) {
      {
        if (ne === void 0)
          try {
            throw Error();
          } catch (O) {
            var T = O.stack.trim().match(/\n( *(at )?)/);
            ne = T && T[1] || "";
          }
        return `
` + ne + t;
      }
    }
    var le = !1, pe;
    {
      var Ce = typeof WeakMap == "function" ? WeakMap : Map;
      pe = new Ce();
    }
    function de(t, f) {
      if (!t || le)
        return "";
      {
        var w = pe.get(t);
        if (w !== void 0)
          return w;
      }
      var T;
      le = !0;
      var O = Error.prepareStackTrace;
      Error.prepareStackTrace = void 0;
      var I;
      I = ve.current, ve.current = null, Ve();
      try {
        if (f) {
          var z = function() {
            throw Error();
          };
          if (Object.defineProperty(z.prototype, "props", {
            set: function() {
              throw Error();
            }
          }), typeof Reflect == "object" && Reflect.construct) {
            try {
              Reflect.construct(z, []);
            } catch (re) {
              T = re;
            }
            Reflect.construct(t, [], z);
          } else {
            try {
              z.call();
            } catch (re) {
              T = re;
            }
            t.call(z.prototype);
          }
        } else {
          try {
            throw Error();
          } catch (re) {
            T = re;
          }
          t();
        }
      } catch (re) {
        if (re && T && typeof re.stack == "string") {
          for (var k = re.stack.split(`
`), te = T.stack.split(`
`), H = k.length - 1, Q = te.length - 1; H >= 1 && Q >= 0 && k[H] !== te[Q]; )
            Q--;
          for (; H >= 1 && Q >= 0; H--, Q--)
            if (k[H] !== te[Q]) {
              if (H !== 1 || Q !== 1)
                do
                  if (H--, Q--, Q < 0 || k[H] !== te[Q]) {
                    var ie = `
` + k[H].replace(" at new ", " at ");
                    return t.displayName && ie.includes("<anonymous>") && (ie = ie.replace("<anonymous>", t.displayName)), typeof t == "function" && pe.set(t, ie), ie;
                  }
                while (H >= 1 && Q >= 0);
              break;
            }
        }
      } finally {
        le = !1, ve.current = I, Se(), Error.prepareStackTrace = O;
      }
      var qe = t ? t.displayName || t.name : "", _e = qe ? xe(qe) : "";
      return typeof t == "function" && pe.set(t, _e), _e;
    }
    function Re(t, f, w) {
      return de(t, !1);
    }
    function ee(t) {
      var f = t.prototype;
      return !!(f && f.isReactComponent);
    }
    function ue(t, f, w) {
      if (t == null)
        return "";
      if (typeof t == "function")
        return de(t, ee(t));
      if (typeof t == "string")
        return xe(t);
      switch (t) {
        case d:
          return xe("Suspense");
        case c:
          return xe("SuspenseList");
      }
      if (typeof t == "object")
        switch (t.$$typeof) {
          case i:
            return Re(t.render);
          case b:
            return ue(t.type, f, w);
          case g: {
            var T = t, O = T._payload, I = T._init;
            try {
              return ue(I(O), f, w);
            } catch {
            }
          }
        }
      return "";
    }
    var ae = Object.prototype.hasOwnProperty, ze = {}, De = E.ReactDebugCurrentFrame;
    function ge(t) {
      if (t) {
        var f = t._owner, w = ue(t.type, t._source, f ? f.type : null);
        De.setExtraStackFrame(w);
      } else
        De.setExtraStackFrame(null);
    }
    function He(t, f, w, T, O) {
      {
        var I = Function.call.bind(ae);
        for (var z in t)
          if (I(t, z)) {
            var k = void 0;
            try {
              if (typeof t[z] != "function") {
                var te = Error((T || "React class") + ": " + w + " type `" + z + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof t[z] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                throw te.name = "Invariant Violation", te;
              }
              k = t[z](f, z, T, w, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
            } catch (H) {
              k = H;
            }
            k && !(k instanceof Error) && (ge(O), p("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", T || "React class", w, z, typeof k), ge(null)), k instanceof Error && !(k.message in ze) && (ze[k.message] = !0, ge(O), p("Failed %s type: %s", w, k.message), ge(null));
          }
      }
    }
    var nt = Array.isArray;
    function $e(t) {
      return nt(t);
    }
    function at(t) {
      {
        var f = typeof Symbol == "function" && Symbol.toStringTag, w = f && t[Symbol.toStringTag] || t.constructor.name || "Object";
        return w;
      }
    }
    function fe(t) {
      try {
        return oe(t), !1;
      } catch {
        return !0;
      }
    }
    function oe(t) {
      return "" + t;
    }
    function Ye(t) {
      if (fe(t))
        return p("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", at(t)), oe(t);
    }
    var $ = E.ReactCurrentOwner, B = {
      key: !0,
      ref: !0,
      __self: !0,
      __source: !0
    }, N, M;
    function G(t) {
      if (ae.call(t, "ref")) {
        var f = Object.getOwnPropertyDescriptor(t, "ref").get;
        if (f && f.isReactWarning)
          return !1;
      }
      return t.ref !== void 0;
    }
    function Ae(t) {
      if (ae.call(t, "key")) {
        var f = Object.getOwnPropertyDescriptor(t, "key").get;
        if (f && f.isReactWarning)
          return !1;
      }
      return t.key !== void 0;
    }
    function Me(t, f) {
      typeof t.ref == "string" && $.current;
    }
    function Qe(t, f) {
      {
        var w = function() {
          N || (N = !0, p("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", f));
        };
        w.isReactWarning = !0, Object.defineProperty(t, "key", {
          get: w,
          configurable: !0
        });
      }
    }
    function ot(t, f) {
      {
        var w = function() {
          M || (M = !0, p("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", f));
        };
        w.isReactWarning = !0, Object.defineProperty(t, "ref", {
          get: w,
          configurable: !0
        });
      }
    }
    var st = function(t, f, w, T, O, I, z) {
      var k = {
        // This tag allows us to uniquely identify this as a React Element
        $$typeof: a,
        // Built-in properties that belong on the element
        type: t,
        key: f,
        ref: w,
        props: z,
        // Record the component responsible for creating this element.
        _owner: I
      };
      return k._store = {}, Object.defineProperty(k._store, "validated", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: !1
      }), Object.defineProperty(k, "_self", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: T
      }), Object.defineProperty(k, "_source", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: O
      }), Object.freeze && (Object.freeze(k.props), Object.freeze(k)), k;
    };
    function it(t, f, w, T, O) {
      {
        var I, z = {}, k = null, te = null;
        w !== void 0 && (Ye(w), k = "" + w), Ae(f) && (Ye(f.key), k = "" + f.key), G(f) && (te = f.ref, Me(f, O));
        for (I in f)
          ae.call(f, I) && !B.hasOwnProperty(I) && (z[I] = f[I]);
        if (t && t.defaultProps) {
          var H = t.defaultProps;
          for (I in H)
            z[I] === void 0 && (z[I] = H[I]);
        }
        if (k || te) {
          var Q = typeof t == "function" ? t.displayName || t.name || "Unknown" : t;
          k && Qe(z, Q), te && ot(z, Q);
        }
        return st(t, k, te, O, T, $.current, z);
      }
    }
    var Oe = E.ReactCurrentOwner, yt = E.ReactDebugCurrentFrame;
    function je(t) {
      if (t) {
        var f = t._owner, w = ue(t.type, t._source, f ? f.type : null);
        yt.setExtraStackFrame(w);
      } else
        yt.setExtraStackFrame(null);
    }
    var ct;
    ct = !1;
    function lt(t) {
      return typeof t == "object" && t !== null && t.$$typeof === a;
    }
    function bt() {
      {
        if (Oe.current) {
          var t = U(Oe.current.type);
          if (t)
            return `

Check the render method of \`` + t + "`.";
        }
        return "";
      }
    }
    function Qt(t) {
      return "";
    }
    var vt = {};
    function Kt(t) {
      {
        var f = bt();
        if (!f) {
          var w = typeof t == "string" ? t : t.displayName || t.name;
          w && (f = `

Check the top-level render call using <` + w + ">.");
        }
        return f;
      }
    }
    function Et(t, f) {
      {
        if (!t._store || t._store.validated || t.key != null)
          return;
        t._store.validated = !0;
        var w = Kt(f);
        if (vt[w])
          return;
        vt[w] = !0;
        var T = "";
        t && t._owner && t._owner !== Oe.current && (T = " It was passed a child from " + U(t._owner.type) + "."), je(t), p('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', w, T), je(null);
      }
    }
    function St(t, f) {
      {
        if (typeof t != "object")
          return;
        if ($e(t))
          for (var w = 0; w < t.length; w++) {
            var T = t[w];
            lt(T) && Et(T, f);
          }
        else if (lt(t))
          t._store && (t._store.validated = !0);
        else if (t) {
          var O = C(t);
          if (typeof O == "function" && O !== t.entries)
            for (var I = O.call(t), z; !(z = I.next()).done; )
              lt(z.value) && Et(z.value, f);
        }
      }
    }
    function Gt(t) {
      {
        var f = t.type;
        if (f == null || typeof f == "string")
          return;
        var w;
        if (typeof f == "function")
          w = f.propTypes;
        else if (typeof f == "object" && (f.$$typeof === i || // Note: Memo only checks outer props here.
        // Inner props are checked in the reconciler.
        f.$$typeof === b))
          w = f.propTypes;
        else
          return;
        if (w) {
          var T = U(f);
          He(w, t.props, "prop", T, t);
        } else if (f.PropTypes !== void 0 && !ct) {
          ct = !0;
          var O = U(f);
          p("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", O || "Unknown");
        }
        typeof f.getDefaultProps == "function" && !f.getDefaultProps.isReactClassApproved && p("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
      }
    }
    function Jt(t) {
      {
        for (var f = Object.keys(t.props), w = 0; w < f.length; w++) {
          var T = f[w];
          if (T !== "children" && T !== "key") {
            je(t), p("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", T), je(null);
            break;
          }
        }
        t.ref !== null && (je(t), p("Invalid attribute `ref` supplied to `React.Fragment`."), je(null));
      }
    }
    var xt = {};
    function Ct(t, f, w, T, O, I) {
      {
        var z = A(t);
        if (!z) {
          var k = "";
          (t === void 0 || typeof t == "object" && t !== null && Object.keys(t).length === 0) && (k += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
          var te = Qt();
          te ? k += te : k += bt();
          var H;
          t === null ? H = "null" : $e(t) ? H = "array" : t !== void 0 && t.$$typeof === a ? (H = "<" + (U(t.type) || "Unknown") + " />", k = " Did you accidentally export a JSX literal instead of a component?") : H = typeof t, p("React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", H, k);
        }
        var Q = it(t, f, w, O, I);
        if (Q == null)
          return Q;
        if (z) {
          var ie = f.children;
          if (ie !== void 0)
            if (T)
              if ($e(ie)) {
                for (var qe = 0; qe < ie.length; qe++)
                  St(ie[qe], t);
                Object.freeze && Object.freeze(ie);
              } else
                p("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
            else
              St(ie, t);
        }
        if (ae.call(f, "key")) {
          var _e = U(t), re = Object.keys(f).filter(function(nr) {
            return nr !== "key";
          }), ut = re.length > 0 ? "{key: someKey, " + re.join(": ..., ") + ": ...}" : "{key: someKey}";
          if (!xt[_e + ut]) {
            var rr = re.length > 0 ? "{" + re.join(": ..., ") + ": ...}" : "{}";
            p(`A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`, ut, _e, rr, _e), xt[_e + ut] = !0;
          }
        }
        return t === n ? Jt(Q) : Gt(Q), Q;
      }
    }
    function Zt(t, f, w) {
      return Ct(t, f, w, !0);
    }
    function Xt(t, f, w) {
      return Ct(t, f, w, !1);
    }
    var er = Xt, tr = Zt;
    Ie.Fragment = n, Ie.jsx = er, Ie.jsxs = tr;
  }()), Ie;
}
process.env.NODE_ENV === "production" ? mt.exports = fr() : mt.exports = dr();
var V = mt.exports;
let Pe = null, Pt = null, Te = /* @__PURE__ */ new Map(), gr = 0, Tt = !1;
const mr = () => `
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
  `, hr = () => Pe || typeof Worker > "u" ? Promise.resolve() : new Promise((e, a) => {
  try {
    const r = `
// IndexedDB Worker - 内联版本
${mr()}
        `, n = new Blob([r], { type: "application/javascript" });
    Pt = URL.createObjectURL(n), Pe = new Worker(Pt), Pe.onmessage = (o) => {
      const { id: s, success: l, result: u, error: i, type: d } = o.data;
      if (d === "ready") {
        Tt = !0, e();
        return;
      }
      const c = Te.get(s);
      if (c)
        if (Te.delete(s), l)
          c.resolve(u);
        else {
          const b = new Error(i.message);
          b.name = i.name, b.stack = i.stack, c.reject(b);
        }
    }, Pe.onerror = (o) => {
      console.error("❌ Worker 错误:", o), Te.forEach((s) => {
        s.reject(o);
      }), Te.clear(), a(o);
    }, Tt && e();
  } catch (r) {
    console.error("❌ 初始化 Worker 失败:", r), a(r);
  }
}), we = async (e, a = {}) => {
  if (!me())
    throw new Error("Worker 不支持，应该使用主线程实现");
  if (await hr(), !Pe)
    throw new Error("Worker 初始化失败");
  return new Promise((r, n) => {
    const o = ++gr;
    Te.set(o, { resolve: r, reject: n });
    const s = [];
    a.imageData && a.imageData instanceof ArrayBuffer ? s.push(a.imageData) : a.imageData && a.imageData.buffer instanceof ArrayBuffer && s.push(a.imageData.buffer), s.length > 0 ? Pe.postMessage({ id: o, action: e, params: a }, s) : Pe.postMessage({ id: o, action: e, params: a }), setTimeout(() => {
      Te.has(o) && (Te.delete(o), n(new Error(`操作超时: ${e}`)));
    }, 3e4);
  });
}, pr = () => typeof Worker < "u", me = () => pr() && !0, ht = "ImageOptimizeCache", Bt = "generalCache", Ge = /* @__PURE__ */ new Map(), Le = (e = ht, a = 1, r = []) => new Promise((n, o) => {
  const s = `${e}_${a}`;
  if (Ge.has(s)) {
    n(Ge.get(s));
    return;
  }
  const l = indexedDB.open(e, a);
  l.onerror = () => {
    o(l.error);
  }, l.onsuccess = () => {
    const u = l.result;
    Ge.set(s, u), n(u);
  }, l.onupgradeneeded = (u) => {
    const i = u.target.result;
    if (r.forEach((d) => {
      if (!i.objectStoreNames.contains(d)) {
        const c = i.createObjectStore(d, { keyPath: "key" });
        c.createIndex("timestamp", "timestamp", { unique: !1 }), c.createIndex("expireTime", "expireTime", { unique: !1 });
      }
    }), e === ht && !i.objectStoreNames.contains(Bt)) {
      const d = i.createObjectStore(Bt, { keyPath: "key" });
      d.createIndex("timestamp", "timestamp", { unique: !1 }), d.createIndex("expireTime", "expireTime", { unique: !1 });
    }
  };
}), We = async (e, a) => {
  let r, n = 1;
  try {
    if (indexedDB.databases)
      try {
        const s = (await indexedDB.databases()).find((l) => l.name === e);
        s && (n = s.version);
      } catch {
        n = 1;
      }
    try {
      if (r = await Le(e, n, []), !r.objectStoreNames.contains(a)) {
        r.close(), Ge.delete(`${e}_${n}`);
        const o = n + 1;
        r = await Le(e, o, [a]);
      }
    } catch {
      r = await Le(e, 1, [a]);
    }
  } catch {
    try {
      r = await Le(e, 1, [a]);
    } catch (s) {
      throw new Error(`无法创建数据库 ${e}: ${s.message}`);
    }
  }
  return r;
}, Mt = async (e) => {
  const { key: a, value: r, expireHours: n, dbName: o, storeName: s } = e;
  try {
    const i = (await We(o, s)).transaction([s], "readwrite").objectStore(s), d = Date.now(), c = n > 0 ? d + n * 60 * 60 * 1e3 : null, b = {
      key: a,
      value: typeof r == "string" ? r : JSON.stringify(r),
      timestamp: d,
      expireHours: n,
      expireTime: c
    }, g = i.put(b);
    return new Promise((h, y) => {
      g.onsuccess = () => h(), g.onerror = () => {
        const m = g.error;
        if (m && m.name === "QuotaExceededError") {
          const C = new Error("存储配额已满，无法保存缓存");
          C.name = "QuotaExceededError", C.originalError = m, y(C);
        } else
          y(m);
      };
    });
  } catch (l) {
    throw l;
  }
}, wr = async (e) => {
  const { key: a, dbName: r, storeName: n } = e;
  try {
    const u = (await We(r, n)).transaction([n], "readonly").objectStore(n).get(a);
    return new Promise((i, d) => {
      u.onsuccess = () => {
        const c = u.result;
        if (!c) {
          i(null);
          return;
        }
        const b = Date.now();
        if (c.expireTime && b > c.expireTime) {
          i(null);
          return;
        }
        try {
          const g = JSON.parse(c.value);
          i(g);
        } catch {
          i(null);
        }
      }, u.onerror = () => {
        i(null);
      };
    });
  } catch {
    return null;
  }
}, yr = async (e) => {
  const { key: a, dbName: r, storeName: n } = e;
  try {
    const l = (await We(r, n)).transaction([n], "readwrite").objectStore(n), u = a ? l.delete(a) : l.clear();
    return new Promise((i, d) => {
      u.onsuccess = () => i(), u.onerror = () => d(u.error);
    });
  } catch (o) {
    throw o;
  }
}, br = async (e) => {
  const { dbName: a, storeName: r } = e;
  try {
    const l = (await We(a, r)).transaction([r], "readwrite").objectStore(r).index("expireTime"), u = Date.now();
    let i = 0;
    const d = IDBKeyRange.upperBound(u), c = l.openCursor(d);
    return new Promise((b, g) => {
      c.onsuccess = (h) => {
        const y = h.target.result;
        y ? (y.delete(), i++, y.continue()) : b(i);
      }, c.onerror = () => g(c.error);
    });
  } catch (n) {
    throw n;
  }
}, vr = async (e) => {
  const { dbName: a, storeName: r } = e;
  try {
    const l = (await We(a, r)).transaction([r], "readonly").objectStore(r).getAll();
    return new Promise((u, i) => {
      l.onsuccess = () => {
        const d = l.result, c = Date.now();
        let b = 0, g = 0;
        d.forEach((h) => {
          h.value && (b += h.value.length), h.expireTime && c > h.expireTime && g++;
        }), u({
          count: d.length,
          totalSize: b,
          totalSizeMB: Math.round(b / 1024 / 1024 * 100) / 100,
          expiredCount: g
        });
      }, l.onerror = () => i(l.error);
    });
  } catch (n) {
    throw n;
  }
}, Er = async (e) => {
  const { dbName: a } = e;
  try {
    const r = await Le(a, 1, []);
    return Array.from(r.objectStoreNames);
  } catch {
    return [];
  }
}, Sr = async () => {
  if (indexedDB.databases)
    try {
      return (await indexedDB.databases()).map((a) => a.name);
    } catch {
      return [];
    }
  else
    return [ht];
}, xr = async () => {
  if (navigator.storage && navigator.storage.estimate)
    try {
      const e = await navigator.storage.estimate(), a = e.quota || 0, r = e.usage || 0, n = e.usageDetails || {}, o = n.indexedDB || 0;
      return {
        quota: a,
        usage: r,
        usageDetails: n,
        quotaMB: Math.round(a / 1024 / 1024 * 100) / 100,
        usageMB: Math.round(r / 1024 / 1024 * 100) / 100,
        availableMB: Math.round((a - r) / 1024 / 1024 * 100) / 100,
        usagePercent: a > 0 ? Math.round(r / a * 100 * 100) / 100 : 0,
        indexedDBUsage: o,
        indexedDBUsageMB: Math.round(o / 1024 / 1024 * 100) / 100
      };
    } catch {
      return {
        quota: 0,
        usage: 0,
        usageDetails: {},
        quotaMB: 0,
        usageMB: 0,
        availableMB: 0,
        usagePercent: 0,
        indexedDBUsage: 0,
        indexedDBUsageMB: 0
      };
    }
  else
    return {
      quota: 0,
      usage: 0,
      usageDetails: {},
      quotaMB: 0,
      usageMB: 0,
      availableMB: 0,
      usagePercent: 0,
      indexedDBUsage: 0,
      indexedDBUsageMB: 0,
      unsupported: !0
    };
}, he = "ImageOptimizeCache", ye = "generalCache", et = 30 * 24, tt = async (e, a, r = et, n = he, o = ye, s = {}) => {
  const { checkQuota: l = !1, autoCleanOnQuotaError: u = !1 } = s;
  try {
    let i;
    try {
      i = JSON.stringify(a);
    } catch (c) {
      throw new Error(`无法序列化值: ${c.message}`);
    }
    const d = new Blob([i]).size;
    if (l) {
      const c = await pt(d);
      if (!c.available)
        if (u) {
          if (console.warn("⚠️ 存储配额不足，尝试清理过期缓存..."), await Ze(n, o), !(await pt(d)).available)
            throw new Error(`存储配额不足: ${c.message}`);
        } else
          throw new Error(`存储配额不足: ${c.message}`);
    }
    try {
      me() ? await we("setCache", {
        key: e,
        value: i,
        // 已经序列化
        expireHours: r,
        dbName: n,
        storeName: o
      }) : (console.log("Worker 不支持 降级到主线程"), await Mt({
        key: e,
        value: i,
        expireHours: r,
        dbName: n,
        storeName: o
      }));
    } catch (c) {
      if (c && c.name === "QuotaExceededError")
        if (u)
          try {
            console.warn("⚠️ 存储配额已满，尝试清理过期缓存后重试..."), await Ze(n, o), me() ? await we("setCache", {
              key: e,
              value: i,
              expireHours: r,
              dbName: n,
              storeName: o
            }) : await Mt({
              key: e,
              value: i,
              expireHours: r,
              dbName: n,
              storeName: o
            });
          } catch (b) {
            const g = new Error("存储配额已满，即使清理过期缓存后仍无法保存");
            throw g.name = "QuotaExceededError", g.originalError = b, g;
          }
        else {
          const b = new Error("存储配额已满，无法保存缓存。建议清理过期缓存或删除不需要的数据");
          throw b.name = "QuotaExceededError", b.originalError = c, b.suggestion = "可以调用 cleanExpiredCache() 清理过期缓存，或使用 deleteCache() 删除不需要的数据", b;
        }
      else
        throw c;
    }
  } catch (i) {
    if (i && (i.name === "QuotaExceededError" || i.message.includes("配额"))) {
      const d = new Error(i.message || "存储配额已满，无法保存缓存");
      throw d.name = "QuotaExceededError", d.originalError = i, d.suggestion = "可以调用 cleanExpiredCache() 清理过期缓存，或使用 deleteCache() 删除不需要的数据", console.error("❌ 存储配额已满:", d), d;
    }
    throw console.error("❌ 设置缓存失败:", i), i;
  }
}, rt = async (e, a = he, r = ye) => {
  try {
    let n;
    return me() ? n = await we("getCache", { key: e, dbName: a, storeName: r }) : n = await wr({ key: e, dbName: a, storeName: r }), n === null && Fe(e, a, r).catch(() => {
    }), n;
  } catch (n) {
    return console.error("❌ 获取缓存失败:", n), null;
  }
}, Fe = async (e = null, a = he, r = ye) => {
  try {
    me() ? await we("deleteCache", { key: e, dbName: a, storeName: r }) : await yr({ key: e, dbName: a, storeName: r });
  } catch (n) {
    throw console.error("❌ 删除缓存失败:", n), n;
  }
}, Ze = async (e = he, a = ye) => {
  try {
    return me() ? await we("cleanExpiredCache", { dbName: e, storeName: a }) : await br({ dbName: e, storeName: a });
  } catch (r) {
    return console.error("❌ 清理过期缓存失败:", r), 0;
  }
}, Ft = async (e = he, a = ye) => {
  try {
    return me() ? await we("getCacheStats", { dbName: e, storeName: a }) : await vr({ dbName: e, storeName: a });
  } catch (r) {
    return console.error("❌ 获取缓存统计失败:", r), { count: 0, totalSize: 0, totalSizeMB: 0, expiredCount: 0 };
  }
}, Cr = async (e, a = he, r = ye) => await rt(e, a, r) !== null, Wt = async (e = he) => {
  try {
    return me() ? await we("getStoreNames", { dbName: e }) : await Er({ dbName: e });
  } catch (a) {
    return console.error("❌ 获取表名失败:", a), [];
  }
}, Rr = async (e) => new Promise((a, r) => {
  const n = indexedDB.deleteDatabase(e);
  n.onsuccess = () => {
    a();
  }, n.onerror = () => {
    r(n.error);
  };
}), Vt = async () => {
  try {
    return me() ? await we("getAllDatabaseNames", {}) : await Sr();
  } catch (e) {
    return console.error("❌ 获取数据库列表失败:", e), [];
  }
}, pt = async (e = 0) => {
  try {
    const a = await Ht(), r = a.quota - a.usage - e > 0, n = a.availableMB - e / 1024 / 1024;
    return {
      available: r,
      quota: a.quota,
      usage: a.usage,
      availableMB: Math.max(0, Math.round(n * 100) / 100),
      requiredMB: Math.round(e / 1024 / 1024 * 100) / 100,
      usagePercent: a.usagePercent,
      message: r ? `存储空间充足，可用 ${Math.round(n * 100) / 100} MB` : `存储空间不足，需要 ${Math.round(e / 1024 / 1024 * 100) / 100} MB，但只有 ${a.availableMB} MB 可用`
    };
  } catch (a) {
    return console.error("❌ 检查存储配额失败:", a), {
      available: !1,
      quota: 0,
      usage: 0,
      availableMB: 0,
      requiredMB: Math.round(e / 1024 / 1024 * 100) / 100,
      usagePercent: 0,
      message: "无法检查存储配额",
      error: a
    };
  }
}, Ht = async () => {
  try {
    return me() ? await we("getStorageQuota", {}) : await xr();
  } catch (e) {
    return console.error("❌ 获取存储配额失败:", e), {
      quota: 0,
      usage: 0,
      usageDetails: {},
      quotaMB: 0,
      usageMB: 0,
      availableMB: 0,
      usagePercent: 0,
      indexedDBUsage: 0,
      indexedDBUsageMB: 0
    };
  }
}, Dr = async () => {
  try {
    const e = await Vt(), a = [];
    for (const r of e)
      try {
        const n = await Wt(r), o = [];
        for (const u of n) {
          const i = await Ft(r, u);
          o.push({
            storeName: u,
            count: i.count,
            size: i.totalSize,
            sizeMB: i.totalSizeMB
          });
        }
        const s = o.reduce((u, i) => u + i.size, 0), l = Math.round(s / 1024 / 1024 * 100) / 100;
        a.push({
          dbName: r,
          stores: o,
          totalSize: s,
          totalSizeMB: l
        });
      } catch (n) {
        console.error(`❌ 获取数据库 ${r} 使用情况失败:`, n);
      }
    return a;
  } catch (e) {
    return console.error("❌ 获取所有数据库使用情况失败:", e), [];
  }
}, Xe = (e, a) => {
  try {
    const r = new Blob([e], { type: a });
    return URL.createObjectURL(r);
  } catch (r) {
    return console.error("❌ 创建 Blob URL 失败:", r), null;
  }
}, Yt = async (e, a = he, r = ye, n = et) => {
  try {
    try {
      await Ze(a, r);
    } catch (g) {
      console.warn("⚠️ 清理过期缓存失败:", g.message);
    }
    const o = `image:${e}`, s = await rt(o, a, r);
    if (s && s.data && s.mimeType)
      try {
        const g = s.data.split(",")[1] || s.data;
        if (!g || g.length === 0)
          throw new Error("缓存数据为空");
        const h = atob(g), y = new Uint8Array(h.length);
        for (let C = 0; C < h.length; C++)
          y[C] = h.charCodeAt(C);
        const m = Xe(y, s.mimeType);
        if (m)
          return m;
      } catch (g) {
        console.warn("⚠️ 缓存数据损坏，删除缓存:", g.message), await Fe(o, a, r).catch(() => {
        });
      }
    const l = await fetch(e);
    if (!l.ok)
      throw new Error(`HTTP ${l.status}: ${l.statusText}`);
    const u = await l.arrayBuffer(), i = new Uint8Array(u), d = l.headers.get("Content-Type") || "image/jpeg";
    let c;
    try {
      const g = [];
      for (let C = 0; C < i.length; C += 8192) {
        const E = i.slice(C, C + 8192), p = String.fromCharCode.apply(null, Array.from(E));
        g.push(p);
      }
      const y = g.join(""), m = btoa(y);
      c = `data:${d};base64,${m}`;
    } catch (g) {
      console.warn("⚠️ 图片数据编码失败，跳过缓存保存:", g.message), c = null;
    }
    if (c)
      try {
        await tt(
          o,
          { data: c, mimeType: d },
          n,
          a,
          r
        );
      } catch (g) {
        console.warn("⚠️ 保存缓存失败:", g.message);
      }
    return Xe(i, d);
  } catch (o) {
    console.error("❌ 加载图片失败:", o);
    const s = `image:${e}`;
    throw await Fe(s, a, r), o;
  }
}, wt = async (e, a = {}) => {
  const { loadImageProgressive: r, optimizeImageUrl: n } = await Promise.resolve().then(() => ur), {
    stages: o = [
      { width: 20, quality: 20, blur: 10 },
      { width: 400, quality: 50, blur: 3 },
      { width: null, quality: 80, blur: 0 }
    ],
    timeout: s = 3e4,
    enableCache: l = !0,
    urlTransformer: u = null,
    onStageComplete: i = null,
    onComplete: d = null,
    onError: c = null,
    onStageError: b = null,
    dbName: g = he,
    storeName: h = ye,
    expireHours: y = et
  } = a;
  if (!e) {
    const m = new Error("图片URL为空");
    return c && c(m, -1), {
      url: "",
      stages: [],
      success: !1,
      error: m,
      fromCache: !1
    };
  }
  try {
    if (!l)
      return {
        ...await r(e, {
          stages: o,
          timeout: s,
          urlTransformer: u,
          onStageError: b,
          onStageComplete: i,
          onComplete: d,
          onError: c
        }),
        fromCache: !1
      };
    const m = o[o.length - 1];
    let C = e;
    u && typeof u == "function" ? C = u(e, m, o.length - 1) : m && (m.width || m.height) && (C = n(e, {
      width: m.width || null,
      height: m.height || null,
      quality: m.quality || 80,
      format: m.format || null,
      autoFormat: m.autoFormat !== !1
    }));
    const E = `image:${C}`, p = await rt(E, g, h);
    if (p && p.data && p.mimeType)
      try {
        const x = p.data.split(",")[1] || p.data;
        if (!x || x.length === 0)
          throw new Error("缓存数据为空");
        const R = atob(x), q = new Uint8Array(R.length);
        for (let S = 0; S < R.length; S++)
          q[S] = R.charCodeAt(S);
        const v = Xe(q, p.mimeType);
        if (v)
          return d && d(v), i && o.forEach((S, _) => {
            _ === o.length - 1 && i(_, v, S);
          }), {
            url: v,
            stages: o.map((S, _) => ({
              url: _ === o.length - 1 ? v : "",
              stage: S,
              loaded: _ === o.length - 1
            })),
            success: !0,
            error: null,
            fromCache: !0
          };
      } catch (x) {
        console.warn("⚠️ 缓存数据损坏，删除缓存:", x.message), await Fe(E, g, h).catch(() => {
        });
      }
    return {
      ...await r(e, {
        stages: o,
        timeout: s,
        urlTransformer: u,
        onStageError: b,
        onStageComplete: i,
        onComplete: async (x) => {
          if (!x.startsWith("blob:"))
            try {
              const R = await fetch(x);
              if (R.ok) {
                const q = await R.arrayBuffer(), v = new Uint8Array(q), S = R.headers.get("Content-Type") || "image/jpeg";
                try {
                  const _ = [];
                  for (let W = 0; W < v.length; W += 8192) {
                    const J = v.slice(W, W + 8192), F = String.fromCharCode.apply(null, Array.from(J));
                    _.push(F);
                  }
                  const P = _.join(""), D = btoa(P), U = `data:${S};base64,${D}`;
                  await tt(
                    E,
                    { data: U, mimeType: S },
                    y,
                    g,
                    h
                  ), console.log(`[渐进式加载缓存] 已保存到缓存: ${E.substring(0, 50)}...`);
                } catch (_) {
                  console.warn("[渐进式加载缓存] 保存缓存失败:", _.message || _);
                }
              }
            } catch (R) {
              console.warn("[渐进式加载缓存] 保存缓存失败:", R.message || R);
            }
          d && d(x);
        },
        onError: c
      }),
      fromCache: !1
    };
  } catch (m) {
    const C = m.message && m.message.includes("404");
    return (!C || process.env.NODE_ENV === "development") && (C || console.error("❌ 渐进式加载图片失败:", m.message || m)), c && c(m, -1), {
      url: "",
      stages: [],
      success: !1,
      error: m,
      fromCache: !1
    };
  }
}, _r = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  DEFAULT_CACHE_EXPIRE_HOURS: et,
  DEFAULT_DB_NAME: he,
  DEFAULT_STORE_NAME_GENERAL: ye,
  checkStorageQuota: pt,
  cleanExpiredCache: Ze,
  createBlobUrlFromCache: Xe,
  deleteCache: Fe,
  deleteDatabase: Rr,
  getAllDatabaseNames: Vt,
  getAllDatabasesUsage: Dr,
  getCache: rt,
  getCacheStats: Ft,
  getStorageQuota: Ht,
  getStoreNames: Wt,
  hasCache: Cr,
  loadImageProgressiveWithCache: wt,
  loadImageWithCache: Yt,
  setCache: tt
}, Symbol.toStringTag, { value: "Module" }));
function Tr({
  src: e = "",
  alt: a = "",
  width: r = "100%",
  height: n = "auto",
  className: o = "",
  imageClassName: s = "",
  dataId: l = null,
  imageStyle: u = {},
  immediate: i = !1,
  rootMargin: d = "50px",
  optimize: c = {
    width: 240,
    height: 320,
    quality: 30
  },
  enableBrowserCompression: b = !0,
  // 默认启用浏览器端压缩
  showPlaceholderIcon: g = !1,
  showErrorMessage: h = !1,
  errorSrc: y = null,
  // 默认为 null，不加载错误图片，直接显示错误占位符
  progressive: m = !1,
  // 是否启用渐进式加载
  progressiveStages: C = [
    { width: 20, quality: 20, blur: 10 },
    // 阶段1: 极速模糊图
    { width: 400, quality: 50, blur: 3 },
    // 阶段2: 中等质量
    { width: null, quality: 80, blur: 0 }
    // 阶段3: 最终质量（原图）
  ],
  progressiveTransitionDuration: E = 300,
  // 过渡动画时间（毫秒）
  progressiveTimeout: p = 3e4,
  // 渐进式加载每个阶段的超时时间（毫秒，默认30秒）
  progressiveEnableCache: j = !0,
  // 渐进式加载是否启用缓存（默认true）
  onLoad: x = null,
  onOptimization: R = null,
  // 优化完成回调
  onError: q = null,
  onClick: v = null,
  onProgressiveStageComplete: S = null
  // 渐进式加载阶段完成回调
}) {
  const _ = se(null), A = se(null), P = se(null), D = se(null), [U, W] = X(!1), [J, F] = X(!1), [L, Y] = X(!1), [K, Z] = X(i), [ce, Ee] = X(""), [be, Ve] = X(null), [Se, ve] = X(!1), [ne, xe] = X(null), le = se(null), [pe, Ce] = X(-1), [de, Re] = X(""), ee = se(null), ue = se(-1), ae = se(!1), ze = se(null), De = ($) => {
    if (!$) return "";
    try {
      if (c && Object.keys(c).length > 0) {
        const B = Be($, c);
        if (B && B.trim())
          return B;
      }
      return $;
    } catch (B) {
      return console.warn("图片URL优化失败，使用原始URL:", B), $;
    }
  }, ge = ar(() => e ? m && de ? de : be || ne || (U && ce ? ce : De(e)) : "", [e, U, ce, c, be, ne, m, de]), He = () => {
    if (i || typeof window > "u" || !window.IntersectionObserver) {
      Z(!0);
      return;
    }
    P.current && (P.current.disconnect(), P.current = null), P.current = new IntersectionObserver(
      ($) => {
        $.forEach((B) => {
          B.isIntersecting && (Z(!0), P.current && B.target && P.current.unobserve(B.target));
        });
      },
      {
        rootMargin: d,
        threshold: 0.01
      }
    ), setTimeout(() => {
      A.current && P.current && P.current.observe(A.current);
    }, 0);
  }, nt = async ($) => {
    if (m) {
      const M = ue.current;
      if (M >= 0 && M < C.length)
        return;
    }
    if (U)
      return;
    const B = $.target.src;
    if (W(!0), F(!1), Y(!1), Ee(B), !B.startsWith("blob:") && !B.startsWith("data:"))
      try {
        const M = De(e), G = await fetch(M);
        if (G.ok) {
          const Ae = await G.arrayBuffer(), Me = new Uint8Array(Ae), Qe = G.headers.get("Content-Type") || "image/jpeg", ot = String.fromCharCode.apply(null, Array.from(Me)), st = btoa(ot), it = `data:${Qe};base64,${st}`, Oe = `image:${M}`;
          await tt(Oe, { data: it, mimeType: Qe });
        }
      } catch (M) {
        console.warn("保存图片缓存失败:", M);
      }
    let N = null;
    if (e && B !== e)
      try {
        const M = await Lt(e, B);
        M.originalSize !== null && M.optimizedSize !== null ? (N = {
          // 原始信息
          originalUrl: M.originalUrl,
          originalSize: M.originalSize,
          originalSizeFormatted: M.originalSizeFormatted,
          // 优化后信息
          optimizedUrl: M.optimizedUrl,
          optimizedSize: M.optimizedSize,
          optimizedSizeFormatted: M.optimizedSizeFormatted,
          // 节省信息
          savedSize: M.savedSize,
          savedSizeFormatted: M.savedSizeFormatted,
          savedPercentage: M.savedPercentage,
          // 其他信息
          cdn: M.cdn,
          isOptimizationEffective: M.isOptimizationEffective,
          warningMessage: M.warningMessage
        }, D.current = N, R && R(N), M.cdn, M.warningMessage && console.warn(M.warningMessage), M.isOptimizationEffective) : (N = {
          originalUrl: e,
          optimizedUrl: B,
          originalSize: null,
          originalSizeFormatted: null,
          optimizedSize: null,
          optimizedSizeFormatted: null,
          savedSize: null,
          savedSizeFormatted: null,
          savedPercentage: null,
          cdn: ke(e),
          isOptimizationEffective: null,
          warningMessage: "⚠️ 无法获取图片大小（可能由于CORS限制）"
        }, D.current = N, R && R(N));
      } catch (M) {
        console.warn("获取图片大小对比失败:", M), N = {
          originalUrl: e,
          optimizedUrl: B,
          originalSize: null,
          originalSizeFormatted: null,
          optimizedSize: null,
          optimizedSizeFormatted: null,
          savedSize: null,
          savedSizeFormatted: null,
          savedPercentage: null,
          cdn: ke(e),
          isOptimizationEffective: null,
          warningMessage: `获取图片大小对比失败: ${M.message}`
        }, D.current = N, R && R(N);
      }
    x && x($, N);
  }, $e = ($) => {
    if (U)
      return;
    const B = $.target.src, N = De(e);
    if (y && (B === y || B.includes("videoCover.png"))) {
      Y(!0), F(!1), q && q($);
      return;
    }
    if (B === N && N !== e) {
      $.target.src = e;
      return;
    }
    if (B === e || N === e) {
      if (y && B !== y) {
        $.target.src = y;
        return;
      }
      Y(!0), F(!1), q && q($);
    }
  }, at = ($) => {
    var B;
    if (v) {
      const N = {
        // 基本图片信息
        src: e,
        // 原始图片URL
        currentSrc: ((B = $.target) == null ? void 0 : B.src) || ge,
        // 当前加载的图片URL
        optimizedSrc: ge,
        // 优化后的URL
        alt: a,
        // 图片alt文本
        dataId: l,
        // data-id属性
        // 图片状态
        isLoaded: U,
        // 是否已加载
        isLoading: J,
        // 是否正在加载
        hasError: L,
        // 是否有错误
        isCompressing: Se,
        // 是否正在压缩
        // 优化信息（如果已获取）
        optimizationInfo: D.current,
        // 图片元素引用
        imageElement: $.target
        // 图片DOM元素
      };
      v($, N);
    }
  };
  Ue(() => {
    ze.current = C;
  }, [C]);
  const fe = se(!1), oe = se(null);
  Ue(() => {
    if (!m) {
      fe.current = !1, oe.current = null;
      return;
    }
    if (oe.current !== e && (fe.current = !1, oe.current = e), fe.current || !e || !K)
      return;
    fe.current = !0, ae.current = !0, F(!0);
    let $ = !1;
    const B = e, N = ze.current || C;
    return ee.current = () => {
      $ = !0, ae.current = !1, fe.current = !1;
    }, wt(B, {
      stages: N,
      timeout: p,
      enableCache: j,
      // 传递缓存开关
      onStageComplete: (M, G, Ae) => {
        if ($ || oe.current !== B) return;
        const Me = M + 1;
        requestAnimationFrame(() => {
          !$ && oe.current === B && (Ce(Me), ue.current = Me, Re(G), S && S(M, G, Ae));
        });
      },
      onComplete: (M) => {
        $ || oe.current !== B || requestAnimationFrame(() => {
          if (!$ && oe.current === B) {
            F(!1), Re(M), ae.current = !1;
            const G = N.length;
            Ce(G), ue.current = G;
          }
        });
      },
      onError: (M, G) => {
        $ || oe.current !== B || (console.warn(`[渐进式加载 ${B.substring(0, 20)}...] 阶段 ${G + 1} 失败:`, M.message || M), F(!1), ae.current = !1, fe.current = !1, Re(""), Ce(-1), ue.current = -1, F(!0));
      }
    }).catch((M) => {
      !$ && oe.current === B && (console.error(`[渐进式加载 ${B.substring(0, 20)}...] 加载过程出错:`, M), F(!1), ae.current = !1, fe.current = !1, Re(""), Ce(-1), ue.current = -1);
    }), () => {
      $ = !0, ae.current = !1, fe.current = !1;
    };
  }, [m, K, e, p, j]), Ue(() => {
    m || !m && K && !U && !L && !J && !Se && !ne && !de && e && (async () => {
      try {
        const B = De(e), N = await Yt(B);
        if (N)
          return xe(N), le.current = N, !0;
      } catch {
      }
      return !1;
    })().then((B) => {
      if (!B) {
        const N = ke(e);
        b && // 允许浏览器端压缩
        !N && // 不支持CDN
        c && Object.keys(c).length > 0 && // 有优化配置
        typeof window < "u" && // 浏览器环境
        !be ? (ve(!0), Nt(e, {
          maxWidth: c.width || null,
          maxHeight: c.height || null,
          quality: c.quality ? c.quality / 100 : 0.8,
          compressionLevel: c.compressionLevel !== void 0 ? c.compressionLevel : 0,
          blur: c.blur !== void 0 ? c.blur : 0,
          smooth: c.smooth !== void 0 ? c.smooth : !0,
          format: c.format || null
        }).then((G) => {
          Ve(G), ve(!1), It(G);
        }).catch((G) => {
          console.warn("浏览器端压缩失败，使用原始URL:", G), ve(!1);
        })) : F(!0);
      }
    });
  }, [K, U, L, J, Se, e, c, be, ne, b]), Ue(() => {
    le.current && (URL.revokeObjectURL(le.current), le.current = null), ee.current && (ee.current(), ee.current = null), W(!1), Y(!1), F(!1), Ee(""), Ve(null), ve(!1), xe(null), ee.current && (ee.current(), ee.current = null), ee.current && (ee.current(), ee.current = null), Re(""), Ce(-1), ue.current = -1, ae.current = !1, fe.current = !1, oe.current = null, D.current = null, i ? Z(!0) : He();
  }, [e]), Ue(() => (i ? Z(!0) : He(), () => {
    P.current && (P.current.disconnect(), P.current = null), le.current && (URL.revokeObjectURL(le.current), le.current = null), ee.current && (ee.current(), ee.current = null);
  }), []);
  const Ye = {
    width: typeof r == "number" ? `${r}px` : r,
    height: typeof n == "number" ? `${n}px` : n
  };
  return /* @__PURE__ */ V.jsxs(
    "div",
    {
      ref: A,
      className: `image-optimize-container ${o}`.trim(),
      style: Ye,
      children: [
        !U && !L && !J && !ne && !de && /* @__PURE__ */ V.jsx("div", { className: "image-optimize-placeholder", children: g && /* @__PURE__ */ V.jsx(
          "svg",
          {
            className: "image-optimize-placeholder-icon",
            width: "24",
            height: "24",
            viewBox: "0 0 24 24",
            fill: "none",
            xmlns: "http://www.w3.org/2000/svg",
            children: /* @__PURE__ */ V.jsx(
              "path",
              {
                d: "M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM13.96 12.29L11.21 15.83L9.25 13.47L6.5 17H17.5L13.96 12.29Z",
                fill: "currentColor"
              }
            )
          }
        ) }),
        (J || Se) && !L && !ne && !de && /* @__PURE__ */ V.jsxs("div", { className: "image-optimize-loading", children: [
          /* @__PURE__ */ V.jsx(
            "svg",
            {
              className: "image-optimize-loading-icon",
              width: "24",
              height: "24",
              viewBox: "0 0 24 24",
              fill: "none",
              xmlns: "http://www.w3.org/2000/svg",
              children: /* @__PURE__ */ V.jsx(
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
          Se && /* @__PURE__ */ V.jsx("span", { style: { marginTop: "8px", fontSize: "12px", color: "#666" }, children: "正在压缩图片..." })
        ] }),
        K && ge && /* @__PURE__ */ V.jsx(
          "img",
          {
            ref: _,
            src: ge,
            alt: a,
            "data-id": l,
            className: `image-optimize-image ${s}`.trim(),
            style: {
              display: U || ne || de || !L && ge ? "block" : "none",
              // 渐进式加载的过渡效果
              transition: m ? `opacity ${E}ms ease-in-out, filter ${E}ms ease-in-out` : void 0,
              opacity: m && pe >= 0 || U || ne ? 1 : 0,
              // 渐进式加载的模糊效果
              // progressiveStageIndex: -1(初始) -> 1(第1阶段完成) -> 2(第2阶段完成) -> 3(第3阶段完成/全部完成)
              filter: m ? pe === 1 ? "blur(10px)" : pe === 2 ? "blur(3px)" : pe >= 3 ? "blur(0px)" : "blur(10px)" : void 0,
              ...u
            },
            onLoad: nt,
            onError: $e,
            onClick: at
          }
        ),
        L && /* @__PURE__ */ V.jsxs("div", { className: "image-optimize-error", children: [
          /* @__PURE__ */ V.jsx(
            "svg",
            {
              className: "image-optimize-error-icon",
              width: "24",
              height: "24",
              viewBox: "0 0 24 24",
              fill: "none",
              xmlns: "http://www.w3.org/2000/svg",
              children: /* @__PURE__ */ V.jsx(
                "path",
                {
                  d: "M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z",
                  fill: "currentColor"
                }
              )
            }
          ),
          h && /* @__PURE__ */ V.jsx("span", { className: "image-optimize-error-text", children: "加载失败" })
        ] })
      ]
    }
  );
}
function Br({
  src: e = "",
  alt: a = "",
  width: r = "100%",
  height: n = "auto",
  className: o = "",
  imageClassName: s = "",
  imageStyle: l = {},
  stages: u = [
    { width: 20, quality: 20 },
    // 阶段1: 极速模糊图
    { width: 400, quality: 50 },
    // 阶段2: 中等质量
    { width: null, quality: 80 }
    // 阶段3: 最终质量（原图）
  ],
  transitionDuration: i = 300,
  timeout: d = 3e4,
  enableCache: c = !0,
  // 是否启用缓存（默认true）
  showPlaceholder: b = !0,
  onStageComplete: g = null,
  onComplete: h = null,
  onError: y = null,
  onLoad: m = null
}) {
  const [C, E] = X(-1), [p, j] = X(""), [x, R] = X(!1), [q, v] = X(!1), [S, _] = X(""), [A, P] = X(!1), D = se(null), U = se(null);
  Ue(() => {
    var Y, K;
    if (!e) return;
    const F = At(e, {
      width: ((Y = u[0]) == null ? void 0 : Y.width) || 20,
      quality: ((K = u[0]) == null ? void 0 : K.quality) || 20
    });
    j(F), E(0), R(!0), v(!1), _(""), P(!1);
    let L = !1;
    return wt(e, {
      stages: u,
      timeout: d,
      enableCache: c,
      // 传递缓存开关
      onStageComplete: (Z, ce, Ee) => {
        L || (E(Z + 1), j(ce), g && g(Z, ce, Ee));
      },
      onComplete: (Z) => {
        L || (R(!1), P(!0), j(Z), h && h(Z));
      },
      onError: (Z, ce) => {
        L || (R(!1), v(!0), _(Z.message), y && y(Z, ce));
      }
    }), () => {
      L = !0;
    };
  }, [e, c]);
  const W = {
    width: typeof r == "number" ? `${r}px` : r,
    height: typeof n == "number" ? `${n}px` : n,
    position: "relative",
    overflow: "hidden"
  }, J = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: `opacity ${i}ms ease-in-out, filter ${i}ms ease-in-out`,
    opacity: C >= 0 ? 1 : 0,
    // 真正的渐进式加载资源 + CSS模糊效果增强视觉体验
    filter: C === 0 ? "blur(10px)" : C === 1 ? "blur(3px)" : "blur(0px)",
    ...l
  };
  return /* @__PURE__ */ V.jsxs(
    "div",
    {
      ref: D,
      className: `progressive-image-container ${o}`.trim(),
      style: W,
      children: [
        b && C < 0 && !q && /* @__PURE__ */ V.jsx("div", { className: "image-optimize-placeholder", style: {
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%"
        }, children: /* @__PURE__ */ V.jsx(
          "svg",
          {
            className: "image-optimize-placeholder-icon",
            width: "24",
            height: "24",
            viewBox: "0 0 24 24",
            fill: "none",
            xmlns: "http://www.w3.org/2000/svg",
            children: /* @__PURE__ */ V.jsx(
              "path",
              {
                d: "M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM13.96 12.29L11.21 15.83L9.25 13.47L6.5 17H17.5L13.96 12.29Z",
                fill: "currentColor"
              }
            )
          }
        ) }),
        p && /* @__PURE__ */ V.jsx(
          "img",
          {
            ref: U,
            src: p,
            alt: a,
            className: `progressive-image ${s}`.trim(),
            style: J,
            onLoad: (F) => {
              A && m && m(F);
            },
            onError: (F) => {
              q || (v(!0), _("图片加载失败"), y && y(new Error("图片加载失败"), C));
            }
          }
        ),
        q && /* @__PURE__ */ V.jsxs("div", { style: {
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
          /* @__PURE__ */ V.jsx("div", { style: { fontSize: "24px", marginBottom: "8px" }, children: "❌" }),
          /* @__PURE__ */ V.jsx("div", { children: S || "加载失败" })
        ] }),
        x && !q && C < u.length && /* @__PURE__ */ V.jsxs("div", { style: {
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
          C + 1,
          " / ",
          u.length
        ] })
      ]
    }
  );
}
export {
  et as DEFAULT_CACHE_EXPIRE_HOURS,
  he as DEFAULT_DB_NAME,
  ye as DEFAULT_STORE_NAME_GENERAL,
  Tr as LazyImage,
  Br as ProgressiveImage,
  pt as checkStorageQuota,
  Ze as cleanExpiredCache,
  Lt as compareImageSizes,
  Nt as compressImageInBrowser,
  It as dataURLToBlob,
  Tr as default,
  Fe as deleteCache,
  Rr as deleteDatabase,
  ke as detectCDN,
  qt as detectImageFormat,
  Je as detectSupportedFormats,
  Ke as formatFileSize,
  At as generateBlurPlaceholderUrl,
  or as generateResponsiveImage,
  dt as generateSizes,
  kt as generateSrcset,
  Vt as getAllDatabaseNames,
  Dr as getAllDatabasesUsage,
  ft as getBestFormat,
  rt as getCache,
  Ft as getCacheStats,
  gt as getImageSize,
  sr as getOptimizedCoverUrl,
  Ht as getStorageQuota,
  Wt as getStoreNames,
  Cr as hasCache,
  Ot as loadImageProgressive,
  wt as loadImageProgressiveWithCache,
  Yt as loadImageWithCache,
  cr as loadImagesBatch,
  lr as loadImagesProgressiveBatch,
  $t as loadImagesProgressively,
  Be as optimizeImageUrl,
  zt as preloadImage,
  ir as preloadImages,
  tt as setCache
};
