import { r as e, t } from "../chunks/Bupu4aFx.js";
import {
  $ as n,
  F as r,
  H as i,
  I as a,
  L as o,
  N as s,
  P as c,
  Q as l,
  R as u,
  Tt as d,
  V as f,
  W as p,
  Z as m,
  a as h,
  at as g,
  b as _,
  bt as v,
  ct as y,
  gt as b,
  h as ee,
  ht as x,
  j as S,
  l as te,
  lt as C,
  nt as ne,
  ot as w,
  pt as re,
  q as T,
  r as E,
  s as D,
  st as O,
  ut as k,
  v as A,
  w as j,
  wt as M,
  xt as N,
  z as P,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as F } from "../chunks/D8pbUplu.js";
import { n as I } from "../chunks/D4lFFHu4.js";
import { t as L } from "../chunks/_6xtu--D.js";
import { t as ie } from "../chunks/gpmMc_Bx.js";
import { t as ae } from "../chunks/BGY9DLPb.js";
import { t as R } from "../chunks/H8UJX3L_2.js";
import { t as oe } from "../chunks/Cyprtw_22.js";
import { t as se } from "../chunks/B_kQVdkE2.js";
import { t as z } from "../chunks/CMGwYO6i2.js";
import { r as ce } from "../chunks/BdUjKaVy2.js";
import { n as B, t as V } from "../chunks/BEJa09Kq2.js";
import { t as le } from "../chunks/Da7GIpgR2.js";
import { t as H } from "../chunks/B2LjsFjQ2.js";
import { t as U } from "../chunks/Cue2Cs472.js";
import { t as W } from "../chunks/DmQt9wwK2.js";
import { t as G } from "../chunks/C8W1vu9i2.js";
import { t as K } from "../chunks/ejJaicvO2.js";
function ue(e, t) {
  let n = h(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    r = [
      [`circle`, { cx: `12`, cy: `12`, r: `10` }],
      [`path`, { d: `M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20` }],
      [`path`, { d: `M2 12h20` }],
    ];
  L(
    e,
    D({ name: `globe` }, () => n, {
      get iconNode() {
        return r;
      },
      children: (e, n) => {
        var r = u();
        (S(w(r), t, `default`, {}, null), o(e, r));
      },
      $$slots: { default: !0 },
    }),
  );
}
var q = t((e, t) => {
    t.exports = function () {
      return typeof Promise == `function` && Promise.prototype && Promise.prototype.then;
    };
  }),
  J = t((e) => {
    var t,
      n = [
        0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346, 404, 466, 532, 581, 655, 733, 815, 901,
        991, 1085, 1156, 1258, 1364, 1474, 1588, 1706, 1828, 1921, 2051, 2185, 2323, 2465, 2611,
        2761, 2876, 3034, 3196, 3362, 3532, 3706,
      ];
    ((e.getSymbolSize = function (e) {
      if (!e) throw Error(`"version" cannot be null or undefined`);
      if (e < 1 || e > 40) throw Error(`"version" should be in range from 1 to 40`);
      return e * 4 + 17;
    }),
      (e.getSymbolTotalCodewords = function (e) {
        return n[e];
      }),
      (e.getBCHDigit = function (e) {
        let t = 0;
        for (; e !== 0; ) (t++, (e >>>= 1));
        return t;
      }),
      (e.setToSJISFunction = function (e) {
        if (typeof e != `function`) throw Error(`"toSJISFunc" is not a valid function.`);
        t = e;
      }),
      (e.isKanjiModeEnabled = function () {
        return t !== void 0;
      }),
      (e.toSJIS = function (e) {
        return t(e);
      }));
  }),
  Y = t((e) => {
    ((e.L = { bit: 1 }), (e.M = { bit: 0 }), (e.Q = { bit: 3 }), (e.H = { bit: 2 }));
    function t(t) {
      if (typeof t != `string`) throw Error(`Param is not a string`);
      switch (t.toLowerCase()) {
        case `l`:
        case `low`:
          return e.L;
        case `m`:
        case `medium`:
          return e.M;
        case `q`:
        case `quartile`:
          return e.Q;
        case `h`:
        case `high`:
          return e.H;
        default:
          throw Error(`Unknown EC Level: ` + t);
      }
    }
    ((e.isValid = function (e) {
      return e && e.bit !== void 0 && e.bit >= 0 && e.bit < 4;
    }),
      (e.from = function (n, r) {
        if (e.isValid(n)) return n;
        try {
          return t(n);
        } catch {
          return r;
        }
      }));
  }),
  de = t((e, t) => {
    function n() {
      ((this.buffer = []), (this.length = 0));
    }
    ((n.prototype = {
      get: function (e) {
        let t = Math.floor(e / 8);
        return ((this.buffer[t] >>> (7 - (e % 8))) & 1) == 1;
      },
      put: function (e, t) {
        for (let n = 0; n < t; n++) this.putBit(((e >>> (t - n - 1)) & 1) == 1);
      },
      getLengthInBits: function () {
        return this.length;
      },
      putBit: function (e) {
        let t = Math.floor(this.length / 8);
        (this.buffer.length <= t && this.buffer.push(0),
          e && (this.buffer[t] |= 128 >>> (this.length % 8)),
          this.length++);
      },
    }),
      (t.exports = n));
  }),
  fe = t((e, t) => {
    function n(e) {
      if (!e || e < 1) throw Error(`BitMatrix size must be defined and greater than 0`);
      ((this.size = e),
        (this.data = new Uint8Array(e * e)),
        (this.reservedBit = new Uint8Array(e * e)));
    }
    ((n.prototype.set = function (e, t, n, r) {
      let i = e * this.size + t;
      ((this.data[i] = n), r && (this.reservedBit[i] = !0));
    }),
      (n.prototype.get = function (e, t) {
        return this.data[e * this.size + t];
      }),
      (n.prototype.xor = function (e, t, n) {
        this.data[e * this.size + t] ^= n;
      }),
      (n.prototype.isReserved = function (e, t) {
        return this.reservedBit[e * this.size + t];
      }),
      (t.exports = n));
  }),
  pe = t((e) => {
    var t = J().getSymbolSize;
    ((e.getRowColCoords = function (e) {
      if (e === 1) return [];
      let n = Math.floor(e / 7) + 2,
        r = t(e),
        i = r === 145 ? 26 : Math.ceil((r - 13) / (2 * n - 2)) * 2,
        a = [r - 7];
      for (let e = 1; e < n - 1; e++) a[e] = a[e - 1] - i;
      return (a.push(6), a.reverse());
    }),
      (e.getPositions = function (t) {
        let n = [],
          r = e.getRowColCoords(t),
          i = r.length;
        for (let e = 0; e < i; e++)
          for (let t = 0; t < i; t++)
            (e === 0 && t === 0) ||
              (e === 0 && t === i - 1) ||
              (e === i - 1 && t === 0) ||
              n.push([r[e], r[t]]);
        return n;
      }));
  }),
  me = t((e) => {
    var t = J().getSymbolSize,
      n = 7;
    e.getPositions = function (e) {
      let r = t(e);
      return [
        [0, 0],
        [r - n, 0],
        [0, r - n],
      ];
    };
  }),
  he = t((e) => {
    e.Patterns = {
      PATTERN000: 0,
      PATTERN001: 1,
      PATTERN010: 2,
      PATTERN011: 3,
      PATTERN100: 4,
      PATTERN101: 5,
      PATTERN110: 6,
      PATTERN111: 7,
    };
    var t = { N1: 3, N2: 3, N3: 40, N4: 10 };
    ((e.isValid = function (e) {
      return e != null && e !== `` && !isNaN(e) && e >= 0 && e <= 7;
    }),
      (e.from = function (t) {
        return e.isValid(t) ? parseInt(t, 10) : void 0;
      }),
      (e.getPenaltyN1 = function (e) {
        let n = e.size,
          r = 0,
          i = 0,
          a = 0,
          o = null,
          s = null;
        for (let c = 0; c < n; c++) {
          ((i = a = 0), (o = s = null));
          for (let l = 0; l < n; l++) {
            let n = e.get(c, l);
            (n === o ? i++ : (i >= 5 && (r += t.N1 + (i - 5)), (o = n), (i = 1)),
              (n = e.get(l, c)),
              n === s ? a++ : (a >= 5 && (r += t.N1 + (a - 5)), (s = n), (a = 1)));
          }
          (i >= 5 && (r += t.N1 + (i - 5)), a >= 5 && (r += t.N1 + (a - 5)));
        }
        return r;
      }),
      (e.getPenaltyN2 = function (e) {
        let n = e.size,
          r = 0;
        for (let t = 0; t < n - 1; t++)
          for (let i = 0; i < n - 1; i++) {
            let n = e.get(t, i) + e.get(t, i + 1) + e.get(t + 1, i) + e.get(t + 1, i + 1);
            (n === 4 || n === 0) && r++;
          }
        return r * t.N2;
      }),
      (e.getPenaltyN3 = function (e) {
        let n = e.size,
          r = 0,
          i = 0,
          a = 0;
        for (let t = 0; t < n; t++) {
          i = a = 0;
          for (let o = 0; o < n; o++)
            ((i = ((i << 1) & 2047) | e.get(t, o)),
              o >= 10 && (i === 1488 || i === 93) && r++,
              (a = ((a << 1) & 2047) | e.get(o, t)),
              o >= 10 && (a === 1488 || a === 93) && r++);
        }
        return r * t.N3;
      }),
      (e.getPenaltyN4 = function (e) {
        let n = 0,
          r = e.data.length;
        for (let t = 0; t < r; t++) n += e.data[t];
        return Math.abs(Math.ceil((n * 100) / r / 5) - 10) * t.N4;
      }));
    function n(t, n, r) {
      switch (t) {
        case e.Patterns.PATTERN000:
          return (n + r) % 2 == 0;
        case e.Patterns.PATTERN001:
          return n % 2 == 0;
        case e.Patterns.PATTERN010:
          return r % 3 == 0;
        case e.Patterns.PATTERN011:
          return (n + r) % 3 == 0;
        case e.Patterns.PATTERN100:
          return (Math.floor(n / 2) + Math.floor(r / 3)) % 2 == 0;
        case e.Patterns.PATTERN101:
          return ((n * r) % 2) + ((n * r) % 3) == 0;
        case e.Patterns.PATTERN110:
          return (((n * r) % 2) + ((n * r) % 3)) % 2 == 0;
        case e.Patterns.PATTERN111:
          return (((n * r) % 3) + ((n + r) % 2)) % 2 == 0;
        default:
          throw Error(`bad maskPattern:` + t);
      }
    }
    ((e.applyMask = function (e, t) {
      let r = t.size;
      for (let i = 0; i < r; i++)
        for (let a = 0; a < r; a++) t.isReserved(a, i) || t.xor(a, i, n(e, a, i));
    }),
      (e.getBestMask = function (t, n) {
        let r = Object.keys(e.Patterns).length,
          i = 0,
          a = 1 / 0;
        for (let o = 0; o < r; o++) {
          (n(o), e.applyMask(o, t));
          let r = e.getPenaltyN1(t) + e.getPenaltyN2(t) + e.getPenaltyN3(t) + e.getPenaltyN4(t);
          (e.applyMask(o, t), r < a && ((a = r), (i = o)));
        }
        return i;
      }));
  }),
  X = t((e) => {
    var t = Y(),
      n = [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 2, 2, 4, 1, 2, 4, 4, 2, 4, 4, 4, 2, 4, 6, 5, 2, 4, 6,
        6, 2, 5, 8, 8, 4, 5, 8, 8, 4, 5, 8, 11, 4, 8, 10, 11, 4, 9, 12, 16, 4, 9, 16, 16, 6, 10, 12,
        18, 6, 10, 17, 16, 6, 11, 16, 19, 6, 13, 18, 21, 7, 14, 21, 25, 8, 16, 20, 25, 8, 17, 23,
        25, 9, 17, 23, 34, 9, 18, 25, 30, 10, 20, 27, 32, 12, 21, 29, 35, 12, 23, 34, 37, 12, 25,
        34, 40, 13, 26, 35, 42, 14, 28, 38, 45, 15, 29, 40, 48, 16, 31, 43, 51, 17, 33, 45, 54, 18,
        35, 48, 57, 19, 37, 51, 60, 19, 38, 53, 63, 20, 40, 56, 66, 21, 43, 59, 70, 22, 45, 62, 74,
        24, 47, 65, 77, 25, 49, 68, 81,
      ],
      r = [
        7, 10, 13, 17, 10, 16, 22, 28, 15, 26, 36, 44, 20, 36, 52, 64, 26, 48, 72, 88, 36, 64, 96,
        112, 40, 72, 108, 130, 48, 88, 132, 156, 60, 110, 160, 192, 72, 130, 192, 224, 80, 150, 224,
        264, 96, 176, 260, 308, 104, 198, 288, 352, 120, 216, 320, 384, 132, 240, 360, 432, 144,
        280, 408, 480, 168, 308, 448, 532, 180, 338, 504, 588, 196, 364, 546, 650, 224, 416, 600,
        700, 224, 442, 644, 750, 252, 476, 690, 816, 270, 504, 750, 900, 300, 560, 810, 960, 312,
        588, 870, 1050, 336, 644, 952, 1110, 360, 700, 1020, 1200, 390, 728, 1050, 1260, 420, 784,
        1140, 1350, 450, 812, 1200, 1440, 480, 868, 1290, 1530, 510, 924, 1350, 1620, 540, 980,
        1440, 1710, 570, 1036, 1530, 1800, 570, 1064, 1590, 1890, 600, 1120, 1680, 1980, 630, 1204,
        1770, 2100, 660, 1260, 1860, 2220, 720, 1316, 1950, 2310, 750, 1372, 2040, 2430,
      ];
    ((e.getBlocksCount = function (e, r) {
      switch (r) {
        case t.L:
          return n[(e - 1) * 4 + 0];
        case t.M:
          return n[(e - 1) * 4 + 1];
        case t.Q:
          return n[(e - 1) * 4 + 2];
        case t.H:
          return n[(e - 1) * 4 + 3];
        default:
          return;
      }
    }),
      (e.getTotalCodewordsCount = function (e, n) {
        switch (n) {
          case t.L:
            return r[(e - 1) * 4 + 0];
          case t.M:
            return r[(e - 1) * 4 + 1];
          case t.Q:
            return r[(e - 1) * 4 + 2];
          case t.H:
            return r[(e - 1) * 4 + 3];
          default:
            return;
        }
      }));
  }),
  ge = t((e) => {
    var t = new Uint8Array(512),
      n = new Uint8Array(256);
    ((function () {
      let e = 1;
      for (let r = 0; r < 255; r++) ((t[r] = e), (n[e] = r), (e <<= 1), e & 256 && (e ^= 285));
      for (let e = 255; e < 512; e++) t[e] = t[e - 255];
    })(),
      (e.log = function (e) {
        if (e < 1) throw Error(`log(` + e + `)`);
        return n[e];
      }),
      (e.exp = function (e) {
        return t[e];
      }),
      (e.mul = function (e, r) {
        return e === 0 || r === 0 ? 0 : t[n[e] + n[r]];
      }));
  }),
  _e = t((e) => {
    var t = ge();
    ((e.mul = function (e, n) {
      let r = new Uint8Array(e.length + n.length - 1);
      for (let i = 0; i < e.length; i++)
        for (let a = 0; a < n.length; a++) r[i + a] ^= t.mul(e[i], n[a]);
      return r;
    }),
      (e.mod = function (e, n) {
        let r = new Uint8Array(e);
        for (; r.length - n.length >= 0; ) {
          let e = r[0];
          for (let i = 0; i < n.length; i++) r[i] ^= t.mul(n[i], e);
          let i = 0;
          for (; i < r.length && r[i] === 0; ) i++;
          r = r.slice(i);
        }
        return r;
      }),
      (e.generateECPolynomial = function (n) {
        let r = new Uint8Array([1]);
        for (let i = 0; i < n; i++) r = e.mul(r, new Uint8Array([1, t.exp(i)]));
        return r;
      }));
  }),
  Z = t((e, t) => {
    var n = _e();
    function r(e) {
      ((this.genPoly = void 0), (this.degree = e), this.degree && this.initialize(this.degree));
    }
    ((r.prototype.initialize = function (e) {
      ((this.degree = e), (this.genPoly = n.generateECPolynomial(this.degree)));
    }),
      (r.prototype.encode = function (e) {
        if (!this.genPoly) throw Error(`Encoder not initialized`);
        let t = new Uint8Array(e.length + this.degree);
        t.set(e);
        let r = n.mod(t, this.genPoly),
          i = this.degree - r.length;
        if (i > 0) {
          let e = new Uint8Array(this.degree);
          return (e.set(r, i), e);
        }
        return r;
      }),
      (t.exports = r));
  }),
  ve = t((e) => {
    e.isValid = function (e) {
      return !isNaN(e) && e >= 1 && e <= 40;
    };
  }),
  ye = t((e) => {
    var t = `[0-9]+`,
      n = `[A-Z $%*+\\-./:]+`,
      r = `(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+`;
    r = r.replace(/u/g, `\\u`);
    var i =
      `(?:(?![A-Z0-9 $%*+\\-./:]|` +
      r +
      `)(?:.|[\r
]))+`;
    ((e.KANJI = new RegExp(r, `g`)),
      (e.BYTE_KANJI = RegExp(`[^A-Z0-9 $%*+\\-./:]+`, `g`)),
      (e.BYTE = new RegExp(i, `g`)),
      (e.NUMERIC = new RegExp(t, `g`)),
      (e.ALPHANUMERIC = new RegExp(n, `g`)));
    var a = RegExp(`^` + r + `$`),
      o = RegExp(`^` + t + `$`),
      s = RegExp(`^[A-Z0-9 $%*+\\-./:]+$`);
    ((e.testKanji = function (e) {
      return a.test(e);
    }),
      (e.testNumeric = function (e) {
        return o.test(e);
      }),
      (e.testAlphanumeric = function (e) {
        return s.test(e);
      }));
  }),
  Q = t((e) => {
    var t = ve(),
      n = ye();
    ((e.NUMERIC = { id: `Numeric`, bit: 1, ccBits: [10, 12, 14] }),
      (e.ALPHANUMERIC = { id: `Alphanumeric`, bit: 2, ccBits: [9, 11, 13] }),
      (e.BYTE = { id: `Byte`, bit: 4, ccBits: [8, 16, 16] }),
      (e.KANJI = { id: `Kanji`, bit: 8, ccBits: [8, 10, 12] }),
      (e.MIXED = { bit: -1 }),
      (e.getCharCountIndicator = function (e, n) {
        if (!e.ccBits) throw Error(`Invalid mode: ` + e);
        if (!t.isValid(n)) throw Error(`Invalid version: ` + n);
        return n >= 1 && n < 10 ? e.ccBits[0] : n < 27 ? e.ccBits[1] : e.ccBits[2];
      }),
      (e.getBestModeForData = function (t) {
        return n.testNumeric(t)
          ? e.NUMERIC
          : n.testAlphanumeric(t)
            ? e.ALPHANUMERIC
            : n.testKanji(t)
              ? e.KANJI
              : e.BYTE;
      }),
      (e.toString = function (e) {
        if (e && e.id) return e.id;
        throw Error(`Invalid mode`);
      }),
      (e.isValid = function (e) {
        return e && e.bit && e.ccBits;
      }));
    function r(t) {
      if (typeof t != `string`) throw Error(`Param is not a string`);
      switch (t.toLowerCase()) {
        case `numeric`:
          return e.NUMERIC;
        case `alphanumeric`:
          return e.ALPHANUMERIC;
        case `kanji`:
          return e.KANJI;
        case `byte`:
          return e.BYTE;
        default:
          throw Error(`Unknown mode: ` + t);
      }
    }
    e.from = function (t, n) {
      if (e.isValid(t)) return t;
      try {
        return r(t);
      } catch {
        return n;
      }
    };
  }),
  be = t((e) => {
    var t = J(),
      n = X(),
      r = Y(),
      i = Q(),
      a = ve(),
      o = 7973,
      s = t.getBCHDigit(o);
    function c(t, n, r) {
      for (let i = 1; i <= 40; i++) if (n <= e.getCapacity(i, r, t)) return i;
    }
    function l(e, t) {
      return i.getCharCountIndicator(e, t) + 4;
    }
    function u(e, t) {
      let n = 0;
      return (
        e.forEach(function (e) {
          let r = l(e.mode, t);
          n += r + e.getBitsLength();
        }),
        n
      );
    }
    function d(t, n) {
      for (let r = 1; r <= 40; r++) if (u(t, r) <= e.getCapacity(r, n, i.MIXED)) return r;
    }
    ((e.from = function (e, t) {
      return a.isValid(e) ? parseInt(e, 10) : t;
    }),
      (e.getCapacity = function (e, r, o) {
        if (!a.isValid(e)) throw Error(`Invalid QR Code version`);
        o === void 0 && (o = i.BYTE);
        let s = (t.getSymbolTotalCodewords(e) - n.getTotalCodewordsCount(e, r)) * 8;
        if (o === i.MIXED) return s;
        let c = s - l(o, e);
        switch (o) {
          case i.NUMERIC:
            return Math.floor((c / 10) * 3);
          case i.ALPHANUMERIC:
            return Math.floor((c / 11) * 2);
          case i.KANJI:
            return Math.floor(c / 13);
          case i.BYTE:
          default:
            return Math.floor(c / 8);
        }
      }),
      (e.getBestVersionForData = function (e, t) {
        let n,
          i = r.from(t, r.M);
        if (Array.isArray(e)) {
          if (e.length > 1) return d(e, i);
          if (e.length === 0) return 1;
          n = e[0];
        } else n = e;
        return c(n.mode, n.getLength(), i);
      }),
      (e.getEncodedBits = function (e) {
        if (!a.isValid(e) || e < 7) throw Error(`Invalid QR Code version`);
        let n = e << 12;
        for (; t.getBCHDigit(n) - s >= 0; ) n ^= o << (t.getBCHDigit(n) - s);
        return (e << 12) | n;
      }));
  }),
  xe = t((e) => {
    var t = J(),
      n = 1335,
      r = 21522,
      i = t.getBCHDigit(n);
    e.getEncodedBits = function (e, a) {
      let o = (e.bit << 3) | a,
        s = o << 10;
      for (; t.getBCHDigit(s) - i >= 0; ) s ^= n << (t.getBCHDigit(s) - i);
      return ((o << 10) | s) ^ r;
    };
  }),
  Se = t((e, t) => {
    var n = Q();
    function r(e) {
      ((this.mode = n.NUMERIC), (this.data = e.toString()));
    }
    ((r.getBitsLength = function (e) {
      return 10 * Math.floor(e / 3) + (e % 3 ? (e % 3) * 3 + 1 : 0);
    }),
      (r.prototype.getLength = function () {
        return this.data.length;
      }),
      (r.prototype.getBitsLength = function () {
        return r.getBitsLength(this.data.length);
      }),
      (r.prototype.write = function (e) {
        let t, n, r;
        for (t = 0; t + 3 <= this.data.length; t += 3)
          ((n = this.data.substr(t, 3)), (r = parseInt(n, 10)), e.put(r, 10));
        let i = this.data.length - t;
        i > 0 && ((n = this.data.substr(t)), (r = parseInt(n, 10)), e.put(r, i * 3 + 1));
      }),
      (t.exports = r));
  }),
  Ce = t((e, t) => {
    var n = Q(),
      r = `0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:`.split(``);
    function i(e) {
      ((this.mode = n.ALPHANUMERIC), (this.data = e));
    }
    ((i.getBitsLength = function (e) {
      return 11 * Math.floor(e / 2) + (e % 2) * 6;
    }),
      (i.prototype.getLength = function () {
        return this.data.length;
      }),
      (i.prototype.getBitsLength = function () {
        return i.getBitsLength(this.data.length);
      }),
      (i.prototype.write = function (e) {
        let t;
        for (t = 0; t + 2 <= this.data.length; t += 2) {
          let n = r.indexOf(this.data[t]) * 45;
          ((n += r.indexOf(this.data[t + 1])), e.put(n, 11));
        }
        this.data.length % 2 && e.put(r.indexOf(this.data[t]), 6);
      }),
      (t.exports = i));
  }),
  we = t((e, t) => {
    var n = Q();
    function r(e) {
      ((this.mode = n.BYTE),
        typeof e == `string`
          ? (this.data = new TextEncoder().encode(e))
          : (this.data = new Uint8Array(e)));
    }
    ((r.getBitsLength = function (e) {
      return e * 8;
    }),
      (r.prototype.getLength = function () {
        return this.data.length;
      }),
      (r.prototype.getBitsLength = function () {
        return r.getBitsLength(this.data.length);
      }),
      (r.prototype.write = function (e) {
        for (let t = 0, n = this.data.length; t < n; t++) e.put(this.data[t], 8);
      }),
      (t.exports = r));
  }),
  Te = t((e, t) => {
    var n = Q(),
      r = J();
    function i(e) {
      ((this.mode = n.KANJI), (this.data = e));
    }
    ((i.getBitsLength = function (e) {
      return e * 13;
    }),
      (i.prototype.getLength = function () {
        return this.data.length;
      }),
      (i.prototype.getBitsLength = function () {
        return i.getBitsLength(this.data.length);
      }),
      (i.prototype.write = function (e) {
        let t;
        for (t = 0; t < this.data.length; t++) {
          let n = r.toSJIS(this.data[t]);
          if (n >= 33088 && n <= 40956) n -= 33088;
          else if (n >= 57408 && n <= 60351) n -= 49472;
          else
            throw Error(
              `Invalid SJIS character: ` +
                this.data[t] +
                `
Make sure your charset is UTF-8`,
            );
          ((n = ((n >>> 8) & 255) * 192 + (n & 255)), e.put(n, 13));
        }
      }),
      (t.exports = i));
  }),
  Ee = t((e, t) => {
    var n = {
      single_source_shortest_paths: function (e, t, r) {
        var i = {},
          a = {};
        a[t] = 0;
        var o = n.PriorityQueue.make();
        o.push(t, 0);
        for (var s, c, l, u, d, f, p, m, h; !o.empty(); )
          for (l in ((s = o.pop()), (c = s.value), (u = s.cost), (d = e[c] || {}), d))
            d.hasOwnProperty(l) &&
              ((f = d[l]),
              (p = u + f),
              (m = a[l]),
              (h = a[l] === void 0),
              (h || m > p) && ((a[l] = p), o.push(l, p), (i[l] = c)));
        if (r !== void 0 && a[r] === void 0) {
          var g = [`Could not find a path from `, t, ` to `, r, `.`].join(``);
          throw Error(g);
        }
        return i;
      },
      extract_shortest_path_from_predecessor_list: function (e, t) {
        for (var n = [], r = t; r; ) (n.push(r), e[r], (r = e[r]));
        return (n.reverse(), n);
      },
      find_path: function (e, t, r) {
        var i = n.single_source_shortest_paths(e, t, r);
        return n.extract_shortest_path_from_predecessor_list(i, r);
      },
      PriorityQueue: {
        make: function (e) {
          var t = n.PriorityQueue,
            r = {},
            i;
          for (i in ((e ||= {}), t)) t.hasOwnProperty(i) && (r[i] = t[i]);
          return ((r.queue = []), (r.sorter = e.sorter || t.default_sorter), r);
        },
        default_sorter: function (e, t) {
          return e.cost - t.cost;
        },
        push: function (e, t) {
          var n = { value: e, cost: t };
          (this.queue.push(n), this.queue.sort(this.sorter));
        },
        pop: function () {
          return this.queue.shift();
        },
        empty: function () {
          return this.queue.length === 0;
        },
      },
    };
    t !== void 0 && (t.exports = n);
  }),
  De = t((e) => {
    var t = Q(),
      n = Se(),
      r = Ce(),
      i = we(),
      a = Te(),
      o = ye(),
      s = J(),
      c = Ee();
    function l(e) {
      return unescape(encodeURIComponent(e)).length;
    }
    function u(e, t, n) {
      let r = [],
        i;
      for (; (i = e.exec(n)) !== null; )
        r.push({ data: i[0], index: i.index, mode: t, length: i[0].length });
      return r;
    }
    function d(e) {
      let n = u(o.NUMERIC, t.NUMERIC, e),
        r = u(o.ALPHANUMERIC, t.ALPHANUMERIC, e),
        i,
        a;
      return (
        s.isKanjiModeEnabled()
          ? ((i = u(o.BYTE, t.BYTE, e)), (a = u(o.KANJI, t.KANJI, e)))
          : ((i = u(o.BYTE_KANJI, t.BYTE, e)), (a = [])),
        n
          .concat(r, i, a)
          .sort(function (e, t) {
            return e.index - t.index;
          })
          .map(function (e) {
            return { data: e.data, mode: e.mode, length: e.length };
          })
      );
    }
    function f(e, o) {
      switch (o) {
        case t.NUMERIC:
          return n.getBitsLength(e);
        case t.ALPHANUMERIC:
          return r.getBitsLength(e);
        case t.KANJI:
          return a.getBitsLength(e);
        case t.BYTE:
          return i.getBitsLength(e);
      }
    }
    function p(e) {
      return e.reduce(function (e, t) {
        let n = e.length - 1 >= 0 ? e[e.length - 1] : null;
        return n && n.mode === t.mode ? ((e[e.length - 1].data += t.data), e) : (e.push(t), e);
      }, []);
    }
    function m(e) {
      let n = [];
      for (let r = 0; r < e.length; r++) {
        let i = e[r];
        switch (i.mode) {
          case t.NUMERIC:
            n.push([
              i,
              { data: i.data, mode: t.ALPHANUMERIC, length: i.length },
              { data: i.data, mode: t.BYTE, length: i.length },
            ]);
            break;
          case t.ALPHANUMERIC:
            n.push([i, { data: i.data, mode: t.BYTE, length: i.length }]);
            break;
          case t.KANJI:
            n.push([i, { data: i.data, mode: t.BYTE, length: l(i.data) }]);
            break;
          case t.BYTE:
            n.push([{ data: i.data, mode: t.BYTE, length: l(i.data) }]);
        }
      }
      return n;
    }
    function h(e, n) {
      let r = {},
        i = { start: {} },
        a = [`start`];
      for (let o = 0; o < e.length; o++) {
        let s = e[o],
          c = [];
        for (let e = 0; e < s.length; e++) {
          let l = s[e],
            u = `` + o + e;
          (c.push(u), (r[u] = { node: l, lastCount: 0 }), (i[u] = {}));
          for (let e = 0; e < a.length; e++) {
            let o = a[e];
            r[o] && r[o].node.mode === l.mode
              ? ((i[o][u] = f(r[o].lastCount + l.length, l.mode) - f(r[o].lastCount, l.mode)),
                (r[o].lastCount += l.length))
              : (r[o] && (r[o].lastCount = l.length),
                (i[o][u] = f(l.length, l.mode) + 4 + t.getCharCountIndicator(l.mode, n)));
          }
        }
        a = c;
      }
      for (let e = 0; e < a.length; e++) i[a[e]].end = 0;
      return { map: i, table: r };
    }
    function g(e, o) {
      let c,
        l = t.getBestModeForData(e);
      if (((c = t.from(o, l)), c !== t.BYTE && c.bit < l.bit))
        throw Error(
          `"` +
            e +
            `" cannot be encoded with mode ` +
            t.toString(c) +
            `.
 Suggested mode is: ` +
            t.toString(l),
        );
      switch ((c === t.KANJI && !s.isKanjiModeEnabled() && (c = t.BYTE), c)) {
        case t.NUMERIC:
          return new n(e);
        case t.ALPHANUMERIC:
          return new r(e);
        case t.KANJI:
          return new a(e);
        case t.BYTE:
          return new i(e);
      }
    }
    ((e.fromArray = function (e) {
      return e.reduce(function (e, t) {
        return (typeof t == `string` ? e.push(g(t, null)) : t.data && e.push(g(t.data, t.mode)), e);
      }, []);
    }),
      (e.fromString = function (t, n) {
        let r = h(m(d(t, s.isKanjiModeEnabled())), n),
          i = c.find_path(r.map, `start`, `end`),
          a = [];
        for (let e = 1; e < i.length - 1; e++) a.push(r.table[i[e]].node);
        return e.fromArray(p(a));
      }),
      (e.rawSplit = function (t) {
        return e.fromArray(d(t, s.isKanjiModeEnabled()));
      }));
  }),
  Oe = t((e) => {
    var t = J(),
      n = Y(),
      r = de(),
      i = fe(),
      a = pe(),
      o = me(),
      s = he(),
      c = X(),
      l = Z(),
      u = be(),
      d = xe(),
      f = Q(),
      p = De();
    function m(e, t) {
      let n = e.size,
        r = o.getPositions(t);
      for (let t = 0; t < r.length; t++) {
        let i = r[t][0],
          a = r[t][1];
        for (let t = -1; t <= 7; t++)
          if (!(i + t <= -1 || n <= i + t))
            for (let r = -1; r <= 7; r++)
              a + r <= -1 ||
                n <= a + r ||
                ((t >= 0 && t <= 6 && (r === 0 || r === 6)) ||
                (r >= 0 && r <= 6 && (t === 0 || t === 6)) ||
                (t >= 2 && t <= 4 && r >= 2 && r <= 4)
                  ? e.set(i + t, a + r, !0, !0)
                  : e.set(i + t, a + r, !1, !0));
      }
    }
    function h(e) {
      let t = e.size;
      for (let n = 8; n < t - 8; n++) {
        let t = n % 2 == 0;
        (e.set(n, 6, t, !0), e.set(6, n, t, !0));
      }
    }
    function g(e, t) {
      let n = a.getPositions(t);
      for (let t = 0; t < n.length; t++) {
        let r = n[t][0],
          i = n[t][1];
        for (let t = -2; t <= 2; t++)
          for (let n = -2; n <= 2; n++)
            t === -2 || t === 2 || n === -2 || n === 2 || (t === 0 && n === 0)
              ? e.set(r + t, i + n, !0, !0)
              : e.set(r + t, i + n, !1, !0);
      }
    }
    function _(e, t) {
      let n = e.size,
        r = u.getEncodedBits(t),
        i,
        a,
        o;
      for (let t = 0; t < 18; t++)
        ((i = Math.floor(t / 3)),
          (a = (t % 3) + n - 8 - 3),
          (o = ((r >> t) & 1) == 1),
          e.set(i, a, o, !0),
          e.set(a, i, o, !0));
    }
    function v(e, t, n) {
      let r = e.size,
        i = d.getEncodedBits(t, n),
        a,
        o;
      for (a = 0; a < 15; a++)
        ((o = ((i >> a) & 1) == 1),
          a < 6 ? e.set(a, 8, o, !0) : a < 8 ? e.set(a + 1, 8, o, !0) : e.set(r - 15 + a, 8, o, !0),
          a < 8
            ? e.set(8, r - a - 1, o, !0)
            : a < 9
              ? e.set(8, 15 - a - 1 + 1, o, !0)
              : e.set(8, 15 - a - 1, o, !0));
      e.set(r - 8, 8, 1, !0);
    }
    function y(e, t) {
      let n = e.size,
        r = -1,
        i = n - 1,
        a = 7,
        o = 0;
      for (let s = n - 1; s > 0; s -= 2)
        for (s === 6 && s--; ; ) {
          for (let n = 0; n < 2; n++)
            if (!e.isReserved(i, s - n)) {
              let r = !1;
              (o < t.length && (r = ((t[o] >>> a) & 1) == 1),
                e.set(i, s - n, r),
                a--,
                a === -1 && (o++, (a = 7)));
            }
          if (((i += r), i < 0 || n <= i)) {
            ((i -= r), (r = -r));
            break;
          }
        }
    }
    function b(e, n, i) {
      let a = new r();
      i.forEach(function (t) {
        (a.put(t.mode.bit, 4),
          a.put(t.getLength(), f.getCharCountIndicator(t.mode, e)),
          t.write(a));
      });
      let o = (t.getSymbolTotalCodewords(e) - c.getTotalCodewordsCount(e, n)) * 8;
      for (a.getLengthInBits() + 4 <= o && a.put(0, 4); a.getLengthInBits() % 8 != 0; ) a.putBit(0);
      let s = (o - a.getLengthInBits()) / 8;
      for (let e = 0; e < s; e++) a.put(e % 2 ? 17 : 236, 8);
      return ee(a, e, n);
    }
    function ee(e, n, r) {
      let i = t.getSymbolTotalCodewords(n),
        a = i - c.getTotalCodewordsCount(n, r),
        o = c.getBlocksCount(n, r),
        s = o - (i % o),
        u = Math.floor(i / o),
        d = Math.floor(a / o),
        f = d + 1,
        p = u - d,
        m = new l(p),
        h = 0,
        g = Array(o),
        _ = Array(o),
        v = 0,
        y = new Uint8Array(e.buffer);
      for (let e = 0; e < o; e++) {
        let t = e < s ? d : f;
        ((g[e] = y.slice(h, h + t)), (_[e] = m.encode(g[e])), (h += t), (v = Math.max(v, t)));
      }
      let b = new Uint8Array(i),
        ee = 0,
        x,
        S;
      for (x = 0; x < v; x++) for (S = 0; S < o; S++) x < g[S].length && (b[ee++] = g[S][x]);
      for (x = 0; x < p; x++) for (S = 0; S < o; S++) b[ee++] = _[S][x];
      return b;
    }
    function x(e, n, r, a) {
      let o;
      if (Array.isArray(e)) o = p.fromArray(e);
      else if (typeof e == `string`) {
        let t = n;
        if (!t) {
          let n = p.rawSplit(e);
          t = u.getBestVersionForData(n, r);
        }
        o = p.fromString(e, t || 40);
      } else throw Error(`Invalid data`);
      let c = u.getBestVersionForData(o, r);
      if (!c) throw Error(`The amount of data is too big to be stored in a QR Code`);
      if (!n) n = c;
      else if (n < c)
        throw Error(
          `
The chosen QR Code version cannot contain this amount of data.
Minimum version required to store current data is: ` +
            c +
            `.
`,
        );
      let l = b(n, r, o),
        d = new i(t.getSymbolSize(n));
      return (
        m(d, n),
        h(d),
        g(d, n),
        v(d, r, 0),
        n >= 7 && _(d, n),
        y(d, l),
        isNaN(a) && (a = s.getBestMask(d, v.bind(null, d, r))),
        s.applyMask(a, d),
        v(d, r, a),
        { modules: d, version: n, errorCorrectionLevel: r, maskPattern: a, segments: o }
      );
    }
    e.create = function (e, r) {
      if (e === void 0 || e === ``) throw Error(`No input text`);
      let i = n.M,
        a,
        o;
      return (
        r !== void 0 &&
          ((i = n.from(r.errorCorrectionLevel, n.M)),
          (a = u.from(r.version)),
          (o = s.from(r.maskPattern)),
          r.toSJISFunc && t.setToSJISFunction(r.toSJISFunc)),
        x(e, a, i, o)
      );
    };
  }),
  ke = t((e) => {
    function t(e) {
      if ((typeof e == `number` && (e = e.toString()), typeof e != `string`))
        throw Error(`Color should be defined as hex string`);
      let t = e.slice().replace(`#`, ``).split(``);
      if (t.length < 3 || t.length === 5 || t.length > 8) throw Error(`Invalid hex color: ` + e);
      ((t.length === 3 || t.length === 4) &&
        (t = Array.prototype.concat.apply(
          [],
          t.map(function (e) {
            return [e, e];
          }),
        )),
        t.length === 6 && t.push(`F`, `F`));
      let n = parseInt(t.join(``), 16);
      return {
        r: (n >> 24) & 255,
        g: (n >> 16) & 255,
        b: (n >> 8) & 255,
        a: n & 255,
        hex: `#` + t.slice(0, 6).join(``),
      };
    }
    ((e.getOptions = function (e) {
      ((e ||= {}), (e.color ||= {}));
      let n = e.margin === void 0 || e.margin === null || e.margin < 0 ? 4 : e.margin,
        r = e.width && e.width >= 21 ? e.width : void 0,
        i = e.scale || 4;
      return {
        width: r,
        scale: r ? 4 : i,
        margin: n,
        color: { dark: t(e.color.dark || `#000000ff`), light: t(e.color.light || `#ffffffff`) },
        type: e.type,
        rendererOpts: e.rendererOpts || {},
      };
    }),
      (e.getScale = function (e, t) {
        return t.width && t.width >= e + t.margin * 2 ? t.width / (e + t.margin * 2) : t.scale;
      }),
      (e.getImageWidth = function (t, n) {
        let r = e.getScale(t, n);
        return Math.floor((t + n.margin * 2) * r);
      }),
      (e.qrToImageData = function (t, n, r) {
        let i = n.modules.size,
          a = n.modules.data,
          o = e.getScale(i, r),
          s = Math.floor((i + r.margin * 2) * o),
          c = r.margin * o,
          l = [r.color.light, r.color.dark];
        for (let e = 0; e < s; e++)
          for (let n = 0; n < s; n++) {
            let u = (e * s + n) * 4,
              d = r.color.light;
            if (e >= c && n >= c && e < s - c && n < s - c) {
              let t = Math.floor((e - c) / o),
                r = Math.floor((n - c) / o);
              d = l[a[t * i + r] ? 1 : 0];
            }
            ((t[u++] = d.r), (t[u++] = d.g), (t[u++] = d.b), (t[u] = d.a));
          }
      }));
  }),
  Ae = t((e) => {
    var t = ke();
    function n(e, t, n) {
      (e.clearRect(0, 0, t.width, t.height),
        (t.style ||= {}),
        (t.height = n),
        (t.width = n),
        (t.style.height = n + `px`),
        (t.style.width = n + `px`));
    }
    function r() {
      try {
        return document.createElement(`canvas`);
      } catch {
        throw Error(`You need to specify a canvas element`);
      }
    }
    ((e.render = function (e, i, a) {
      let o = a,
        s = i;
      (o === void 0 && (!i || !i.getContext) && ((o = i), (i = void 0)),
        i || (s = r()),
        (o = t.getOptions(o)));
      let c = t.getImageWidth(e.modules.size, o),
        l = s.getContext(`2d`),
        u = l.createImageData(c, c);
      return (t.qrToImageData(u.data, e, o), n(l, s, c), l.putImageData(u, 0, 0), s);
    }),
      (e.renderToDataURL = function (t, n, r) {
        let i = r;
        (i === void 0 && (!n || !n.getContext) && ((i = n), (n = void 0)), (i ||= {}));
        let a = e.render(t, n, i),
          o = i.type || `image/png`,
          s = i.rendererOpts || {};
        return a.toDataURL(o, s.quality);
      }));
  }),
  je = t((e) => {
    var t = ke();
    function n(e, t) {
      let n = e.a / 255,
        r = t + `="` + e.hex + `"`;
      return n < 1 ? r + ` ` + t + `-opacity="` + n.toFixed(2).slice(1) + `"` : r;
    }
    function r(e, t, n) {
      let r = e + t;
      return (n !== void 0 && (r += ` ` + n), r);
    }
    function i(e, t, n) {
      let i = ``,
        a = 0,
        o = !1,
        s = 0;
      for (let c = 0; c < e.length; c++) {
        let l = Math.floor(c % t),
          u = Math.floor(c / t);
        (!l && !o && (o = !0),
          e[c]
            ? (s++,
              (c > 0 && l > 0 && e[c - 1]) ||
                ((i += o ? r(`M`, l + n, 0.5 + u + n) : r(`m`, a, 0)), (a = 0), (o = !1)),
              (l + 1 < t && e[c + 1]) || ((i += r(`h`, s)), (s = 0)))
            : a++);
      }
      return i;
    }
    e.render = function (e, r, a) {
      let o = t.getOptions(r),
        s = e.modules.size,
        c = e.modules.data,
        l = s + o.margin * 2,
        u = o.color.light.a
          ? `<path ` + n(o.color.light, `fill`) + ` d="M0 0h` + l + `v` + l + `H0z"/>`
          : ``,
        d = `<path ` + n(o.color.dark, `stroke`) + ` d="` + i(c, s, o.margin) + `"/>`,
        f = `viewBox="0 0 ` + l + ` ` + l + `"`,
        p =
          `<svg xmlns="http://www.w3.org/2000/svg" ` +
          (o.width ? `width="` + o.width + `" height="` + o.width + `" ` : ``) +
          f +
          ` shape-rendering="crispEdges">` +
          u +
          d +
          `</svg>
`;
      return (typeof a == `function` && a(null, p), p);
    };
  }),
  Me = e(
    t((e) => {
      var t = q(),
        n = Oe(),
        r = Ae(),
        i = je();
      function a(e, r, i, a, o) {
        let s = [].slice.call(arguments, 1),
          c = s.length,
          l = typeof s[c - 1] == `function`;
        if (!l && !t()) throw Error(`Callback required as last argument`);
        if (l) {
          if (c < 2) throw Error(`Too few arguments provided`);
          c === 2
            ? ((o = i), (i = r), (r = a = void 0))
            : c === 3 &&
              (r.getContext && o === void 0
                ? ((o = a), (a = void 0))
                : ((o = a), (a = i), (i = r), (r = void 0)));
        } else {
          if (c < 1) throw Error(`Too few arguments provided`);
          return (
            c === 1
              ? ((i = r), (r = a = void 0))
              : c === 2 && !r.getContext && ((a = i), (i = r), (r = void 0)),
            new Promise(function (t, o) {
              try {
                t(e(n.create(i, a), r, a));
              } catch (e) {
                o(e);
              }
            })
          );
        }
        try {
          let t = n.create(i, a);
          o(null, e(t, r, a));
        } catch (e) {
          o(e);
        }
      }
      ((e.create = n.create),
        (e.toCanvas = a.bind(null, r.render)),
        (e.toDataURL = a.bind(null, r.renderToDataURL)),
        (e.toString = a.bind(null, function (e, t, n) {
          return i.render(e, n);
        })));
    })(),
  ),
  Ne = P(`<a> </a>`),
  Pe = P(
    `<div class="flex items-center justify-between"><div class="flex items-center gap-3"><!> <div><!> <p class="text-sm text-muted-foreground mt-1">Add an extra layer of security with an authenticator app.</p></div></div> <!></div>`,
  ),
  Fe = P(`<p class="text-sm text-muted-foreground">Loading...</p>`),
  Ie = P(`<img alt="TOTP QR Code" class="w-48 h-48"/>`),
  Le = P(`<p class="text-sm text-muted-foreground">Generating QR code...</p>`),
  Re = P(
    `<div class="space-y-4"><p class="text-sm">Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)</p> <div class="flex justify-center p-4 bg-white rounded-lg border"><!></div> <div class="space-y-2"><p class="text-xs text-muted-foreground">Or enter this key manually:</p> <div class="flex items-center gap-2"><code class="flex-1 text-sm bg-muted px-3 py-2 rounded font-mono break-all"> </code> <!></div></div> <div class="border-t pt-4 space-y-2"><!> <div class="flex gap-2"><!> <!></div></div></div>`,
  ),
  ze = P(`<code class="text-sm font-mono text-center py-1"> </code>`),
  Be = P(`<!> Copy all codes`, 1),
  Ve =
    P(`<div class="space-y-4"><div class="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20"><!> <div class="text-sm"><p class="font-medium text-warning">Save your recovery codes</p> <p class="text-muted-foreground">These codes can be used to access your account if you lose your authenticator device.
                Each code can only be used once. Store them securely.</p></div></div> <div class="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg"></div> <div class="flex gap-2"><!> <!></div></div>`),
  He = P(`You have <strong> </strong> `, 1),
  Ue = P(
    `<span class="text-warning font-medium">No recovery codes remaining. Consider re-enrolling.</span>`,
  ),
  We = P(
    `<div class="border rounded-lg p-4 space-y-3"><p class="text-sm font-medium">Confirm your password to disable MFA</p> <!> <div class="flex gap-2"><!> <!></div></div>`,
  ),
  Ge = P(`<div class="flex gap-2"><!> <!></div>`),
  Ke = P(
    `<div class="space-y-4"><p class="text-sm text-muted-foreground">Two-factor authentication is active. <!></p> <!></div>`,
  ),
  qe = P(`<!> `, 1),
  Je = P(
    `<div class="space-y-3"><p class="text-sm text-muted-foreground">Protect your account with a time-based one-time password (TOTP) from an authenticator app.</p> <!></div>`,
  ),
  Ye = P(`<!> <!>`, 1),
  Xe = P(
    `<div class="flex items-center justify-between"><div class="flex items-center gap-3"><!> <div><!> <p class="text-sm text-muted-foreground mt-1">Configure SAML 2.0 or OIDC for centralized authentication via your identity provider.</p></div></div> <!></div>`,
  ),
  Ze = P(`<p class="text-sm text-muted-foreground">Loading SSO configuration...</p>`),
  Qe = P(
    `<div class="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-3"><div class="flex items-start gap-2"><!> <div><p class="text-sm font-medium text-destructive"> </p> <p class="text-xs text-muted-foreground mt-1">Try refreshing the page. If this persists, contact support.</p></div></div> <!></div>`,
  ),
  $e = P(`View Plans <!>`, 1),
  et = P(
    `<div class="rounded-lg border border-warning/20 bg-warning/5 p-4 space-y-3"><div class="flex items-start gap-2"><!> <div><p class="text-sm font-medium"> </p> <p class="text-xs text-muted-foreground mt-1">SSO enables centralized authentication via your identity provider (Okta, Azure AD, Google Workspace, etc.)</p></div></div> <!></div>`,
  ),
  tt = P(
    `<div class="space-y-4 border-t pt-4"><h3 class="text-sm font-medium">OIDC Configuration</h3> <div class="space-y-2"><!> <!> <p class="text-xs text-muted-foreground">The OIDC issuer URL. Endpoints will be auto-discovered from .well-known/openid-configuration.</p></div> <div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div class="space-y-2"><!> <!></div> <div class="space-y-2"><!> <!></div></div> <div class="space-y-2"><!> <!></div></div>`,
  ),
  nt = P(`<p class="text-xs text-destructive"> </p>`),
  rt = P(
    `<div class="space-y-4 border-t pt-4"><h3 class="text-sm font-medium">SAML 2.0 Configuration</h3> <div class="rounded-lg bg-muted/50 p-4 space-y-2"><p class="text-sm font-medium">Step 1: Add AtlasIT in your Identity Provider</p> <p class="text-xs text-muted-foreground">Create a new SAML app in your IdP and enter these values:</p> <div class="grid grid-cols-1 gap-2 mt-2"><div class="flex items-center justify-between gap-2"><div><p class="text-xs text-muted-foreground">SP Entity ID / Audience URI</p> <code class="text-xs"></code></div> <!></div> <div class="flex items-center justify-between gap-2"><div><p class="text-xs text-muted-foreground">ACS URL (Reply URL)</p> <code class="text-xs"></code></div> <!></div></div> <p class="text-xs text-muted-foreground mt-1">Or import our <a href="/api/auth/sso/metadata" target="_blank" class="text-primary underline">SP metadata XML</a> directly.</p></div> <div class="space-y-2"><p class="text-sm font-medium">Step 2: Import your IdP metadata</p> <p class="text-xs text-muted-foreground">Paste the metadata URL from your IdP and we'll fill in the rest automatically.</p> <div class="flex gap-2"><div class="flex-1"><!></div> <!></div> <!></div> <details><summary class="text-xs text-muted-foreground cursor-pointer hover:text-foreground"> </summary> <div class="space-y-3 mt-3"><div class="space-y-2"><!> <!></div> <div class="space-y-2"><!> <!></div> <div class="space-y-2"><!> <textarea class="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono min-h-[100px] resize-y" placeholder="-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----"></textarea></div></div></details></div>`,
  ),
  it = P(`<div> </div>`),
  at = P(`<!> Test Connection`, 1),
  ot = P(`<!> Remove`, 1),
  st = P(
    `<div class="space-y-6"><div class="space-y-2"><!> <div class="flex gap-2"><button>OpenID Connect</button> <button>SAML 2.0</button></div></div> <div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div class="space-y-2"><!> <!></div> <div class="space-y-2"><!> <select class="w-full rounded-md border bg-background px-3 py-2 text-sm"><option>Select IdP...</option><option>Okta</option><option>Azure AD / Entra ID</option><option>Google Workspace</option><option>OneLogin</option><option>PingFederate</option><option>Other</option></select></div></div> <!> <div class="space-y-4 border-t pt-4"><h3 class="text-sm font-medium">Behavior</h3> <div class="flex items-center justify-between"><div><p class="text-sm">Enable SSO</p> <p class="text-xs text-muted-foreground">Allow users to sign in via this identity provider.</p></div> <button><span></span></button></div> <div class="flex items-center justify-between"><div><p class="text-sm">Just-in-Time Provisioning</p> <p class="text-xs text-muted-foreground">Auto-create user accounts on first SSO login.</p></div> <button><span></span></button></div> <div class="flex items-center justify-between"><div><p class="text-sm">Force SSO</p> <p class="text-xs text-muted-foreground">Block password login; require SSO for all users.</p></div> <button><span></span></button></div> <div class="flex items-center justify-between"><div><p class="text-sm">Bypass MFA for SSO Users</p> <p class="text-xs text-muted-foreground">Skip TOTP challenge when authenticating via IdP.</p></div> <button><span></span></button></div> <div class="space-y-2"><!> <!> <p class="text-xs text-muted-foreground">JSON array of roles assigned to JIT-provisioned users.</p></div></div> <!> <div class="flex items-center gap-2 border-t pt-4"><!> <!> <!></div></div>`,
  ),
  ct = P(`<!> <!>`, 1),
  lt = P(
    `<div class="flex items-center gap-3"><!> <div><!> <p class="text-sm text-destructive mt-1"> </p></div></div>`,
  ),
  ut = P(`<!> <!>`, 1),
  dt = P(
    `<div class="flex items-center gap-3"><!> <div><!> <p class="text-sm text-muted-foreground mt-1">Configure security requirements for all users in your organization.</p></div></div>`,
  ),
  ft = P(`<button> </button>`),
  pt = P(`<div class="space-y-2"><!> <div class="flex flex-wrap gap-2"></div></div>`),
  mt = P(
    `<div class="space-y-6"><div class="space-y-3"><div class="flex items-center justify-between"><div><p class="text-sm font-medium">Require MFA for all users</p> <p class="text-xs text-muted-foreground">Users without MFA will be forced to enroll on next login.</p></div> <button><span></span></button></div> <!></div> <div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div class="space-y-2"><!> <select class="w-full rounded-md border bg-background px-3 py-2 text-sm"><option>1 hour</option><option>4 hours</option><option>8 hours</option><option>1 day</option><option>3 days</option><option>7 days</option><option>30 days</option></select> <p class="text-xs text-muted-foreground">How long sessions last without MFA.</p></div> <div class="space-y-2"><!> <select class="w-full rounded-md border bg-background px-3 py-2 text-sm"><option>1 hour</option><option>4 hours</option><option>8 hours</option><option>1 day</option><option>3 days</option><option>7 days</option><option>30 days</option><option>90 days</option></select> <p class="text-xs text-muted-foreground">Longer sessions for MFA-verified users.</p></div></div> <div class="space-y-2"><!> <select class="w-full rounded-md border bg-background px-3 py-2 text-sm max-w-xs"><option>15 minutes</option><option>30 minutes</option><option>1 hour</option><option>4 hours</option><option>1 day</option><option>7 days</option></select> <p class="text-xs text-muted-foreground">Sessions expire after this much inactivity.</p></div> <div class="space-y-2"><!> <!></div> <!></div>`,
  ),
  ht = P(`<!> <!>`, 1),
  gt = P(
    `<div class="space-y-6"><h1 class="text-2xl font-semibold tracking-tight">Security</h1> <div class="flex gap-1 border-b"></div> <!> <!> <!></div>`,
  );
function _t(e, t) {
  N(t, !1);
  let h = () => b(ce, `$session`, D),
    S = () => b(F, `$page`, D),
    [D, P] = x(),
    L = y(),
    q = y(),
    J = y(!1),
    Y = y(!1),
    de = y(!1),
    fe = y(``),
    pe = y(``),
    me = y(!1),
    he = y(`oidc`),
    X = y(null),
    ge = y(``),
    _e = y(``),
    Z = y(!1),
    ve = y(!0),
    ye = y(!1),
    Q = y(!1),
    be = y(`["member"]`),
    xe = y(``),
    Se = y(``),
    Ce = y(``),
    we = y(``),
    Te = y(``),
    Ee = y(``),
    De = y(``),
    Oe = y(`openid email profile`);
  async function ke() {
    (k(J, !0), k(pe, ``));
    try {
      let e = new AbortController(),
        t = setTimeout(() => e.abort(), 1e4),
        n = await fetch(`/api/tenant/sso`, { signal: e.signal });
      if ((clearTimeout(t), n.status === 403)) {
        let e = await n.json().catch(() => ({}));
        (k(de, !0), k(fe, e.error || `SSO requires a Professional or Enterprise plan`));
        return;
      }
      if (!n.ok) {
        k(
          pe,
          (await n.json().catch(() => ({}))).error ||
            `Failed to load SSO configuration (${n.status})`,
        );
        return;
      }
      let r = await n.json();
      (k(Y, r.configured),
        r.config &&
          (r.config,
          k(he, r.config.protocol),
          k(ge, r.config.displayName || ``),
          k(_e, r.config.idpName || ``),
          k(Z, r.config.enabled),
          k(ve, r.config.jitProvisioning),
          k(ye, r.config.forceSso),
          k(Q, r.config.ssoBypassMfa),
          k(be, JSON.stringify(r.config.defaultRoles || [`member`])),
          k(xe, r.config.samlEntityId || ``),
          k(Se, r.config.samlSsoUrl || ``),
          k(Ce, r.config.samlCertificate || ``),
          k(we, r.config.samlMetadataUrl || ``),
          k(Te, r.config.oidcIssuer || ``),
          k(Ee, r.config.oidcClientId || ``),
          k(De, ``),
          k(Oe, r.config.oidcScopes || `openid email profile`)));
    } catch {
      k(pe, `Failed to load SSO configuration`);
    } finally {
      k(J, !1);
    }
  }
  async function Ae() {
    (k(me, !0), k(X, null));
    try {
      let e;
      try {
        e = JSON.parse(p(be));
      } catch {
        e = [`member`];
      }
      let t = {
        protocol: p(he),
        enabled: p(Z),
        displayName: p(ge) || void 0,
        idpName: p(_e) || void 0,
        jitProvisioning: p(ve),
        defaultRoles: e,
        forceSso: p(ye),
        ssoBypassMfa: p(Q),
      };
      p(he) === `saml`
        ? ((t.samlEntityId = p(xe)),
          (t.samlSsoUrl = p(Se)),
          (t.samlCertificate = p(Ce)),
          (t.samlMetadataUrl = p(we)))
        : ((t.oidcIssuer = p(Te)),
          (t.oidcClientId = p(Ee)),
          p(De) && (t.oidcClientSecret = p(De)),
          (t.oidcScopes = p(Oe)));
      let n = await fetch(`/api/tenant/sso`, {
          method: `POST`,
          headers: { "content-type": `application/json` },
          body: JSON.stringify(t),
        }),
        r = await n.json();
      n.ok
        ? (I({ message: `SSO configuration saved`, variant: `success` }), k(Y, !0), await ke())
        : I({ message: r.error || `Failed to save`, variant: `error` });
    } catch {
      I({ message: `Failed to save SSO configuration`, variant: `error` });
    }
    k(me, !1);
  }
  async function je() {
    try {
      (await fetch(`/api/tenant/sso`, { method: `DELETE` })).ok
        ? (I({ message: `SSO configuration removed`, variant: `success` }), k(Y, !1), k(Z, !1))
        : I({ message: `Failed to remove SSO`, variant: `error` });
    } catch {
      I({ message: `Failed to remove SSO`, variant: `error` });
    }
  }
  let _t = y(!1),
    vt = y(``);
  async function yt() {
    if (!p(we)) {
      k(vt, `Enter a metadata URL first`);
      return;
    }
    (k(_t, !0), k(vt, ``));
    try {
      let e = await fetch(`/api/tenant/sso/metadata-fetch`, {
          method: `POST`,
          headers: { "content-type": `application/json` },
          body: JSON.stringify({ metadataUrl: p(we) }),
        }),
        t = await e.json();
      if (!e.ok) {
        k(vt, t.error || `Failed to fetch metadata`);
        return;
      }
      (k(xe, t.entityId || ``),
        k(Se, t.ssoUrl || ``),
        k(Ce, t.certificate || ``),
        I({ message: `IdP metadata loaded successfully`, variant: `success` }));
    } catch {
      k(vt, `Network error fetching metadata`);
    } finally {
      k(_t, !1);
    }
  }
  function bt() {
    let e = h()?.tenantId;
    if (!e) {
      k(X, { success: !1, message: `No tenant ID` });
      return;
    }
    (window.open(`/api/auth/sso/init?tenant=${e}`, `_blank`, `width=600,height=700`),
      k(X, {
        success: !0,
        message: `SSO test initiated in a new window. Complete the IdP login to verify.`,
      }));
  }
  let xt = [
      { href: `/console/settings`, label: `General` },
      { href: `/console/settings/users`, label: `Users` },
      { href: `/console/settings/audit-log`, label: `Audit Log` },
      { href: `/console/settings/billing`, label: `Billing` },
      { href: `/console/settings/trust`, label: `Trust Center` },
      { href: `/console/settings/incidents`, label: `Incidents` },
      { href: `/console/settings/security`, label: `Security` },
      { href: `/console/settings/notifications`, label: `Notifications` },
    ],
    St = y(!0),
    Ct = y(!1),
    wt = y(0),
    Tt = y(`idle`),
    Et = y(``),
    Dt = y(``),
    Ot = y(``),
    kt = y([]),
    At = y(``),
    jt = y(!1),
    Mt = y(!1),
    Nt = y(``),
    Pt = y(!1),
    $ = y(null),
    Ft = y(``),
    It = y(!1);
  E(async () => {
    await Promise.all([Lt(), ke(), Ut()]);
  });
  async function Lt() {
    k(St, !0);
    try {
      let e = await fetch(`/api/auth/mfa/status`);
      if (e.ok) {
        let t = await e.json();
        (k(Ct, t.totpEnabled), k(wt, t.recoveryCodesRemaining), t.enabledAt);
      }
    } catch {}
    k(St, !1);
  }
  async function Rt() {
    k(jt, !0);
    try {
      let e = await fetch(`/api/auth/mfa/setup`, { method: `POST` }),
        t = await e.json();
      e.ok
        ? (k(Et, t.secret), k(Dt, t.uri), k(kt, t.recoveryCodes), k(Tt, `qr`))
        : I({ message: t.error || `Failed to start setup`, variant: `error` });
    } catch {
      I({ message: `Failed to start setup`, variant: `error` });
    }
    k(jt, !1);
  }
  async function zt() {
    k(jt, !0);
    try {
      let e = await fetch(`/api/auth/mfa/confirm`, {
          method: `POST`,
          headers: { "content-type": `application/json` },
          body: JSON.stringify({ code: p(At) }),
        }),
        t = await e.json();
      e.ok
        ? (k(Tt, `done`),
          I({ message: `Two-factor authentication enabled!`, variant: `success` }),
          await Lt())
        : I({ message: t.error || `Invalid code`, variant: `error` });
    } catch {
      I({ message: `Verification failed`, variant: `error` });
    }
    k(jt, !1);
  }
  async function Bt() {
    k(Pt, !0);
    try {
      let e = await fetch(`/api/auth/mfa/disable`, {
          method: `POST`,
          headers: { "content-type": `application/json` },
          body: JSON.stringify({ password: p(Nt) }),
        }),
        t = await e.json();
      e.ok
        ? (I({ message: `Two-factor authentication disabled`, variant: `success` }),
          k(Mt, !1),
          k(Nt, ``),
          k(Tt, `idle`),
          await Lt())
        : I({ message: t.error || `Failed to disable`, variant: `error` });
    } catch {
      I({ message: `Failed to disable MFA`, variant: `error` });
    }
    k(Pt, !1);
  }
  function Vt(e) {
    (navigator.clipboard.writeText(e), I({ message: `Copied to clipboard`, variant: `success` }));
  }
  function Ht() {
    (k(Tt, `idle`), k(Et, ``), k(Dt, ``), k(kt, []), k(At, ``));
  }
  async function Ut() {
    try {
      let e = await fetch(`/api/tenant/security`);
      e.ok
        ? k($, (await e.json()).policy)
        : (console.error(`Failed to load security policy:`, e.status),
          k($, null),
          k(Ft, `Unable to load security policy. Please try again.`));
    } catch {
      (k($, null), k(Ft, `Unable to load security policy. Please try again.`));
    }
  }
  async function Wt() {
    k(It, !0);
    try {
      let e = await fetch(`/api/tenant/security`, {
          method: `PUT`,
          headers: { "content-type": `application/json` },
          body: JSON.stringify(p($)),
        }),
        t = await e.json();
      e.ok
        ? (k($, t.policy), I({ message: `Security policy updated`, variant: `success` }))
        : I({ message: t.error || `Failed to save`, variant: `error` });
    } catch {
      I({ message: `Failed to save policy`, variant: `error` });
    }
    k(It, !1);
  }
  (m(
    () => S(),
    () => {
      k(L, S().url.pathname);
    },
  ),
    m(
      () => (p(Dt), Me.default),
      () => {
        p(Dt) &&
          Me.toDataURL(p(Dt), { width: 200, margin: 2, errorCorrectionLevel: `M` })
            .then((e) => {
              k(Ot, e);
            })
            .catch(() => {
              k(Ot, ``);
            });
      },
    ),
    m(
      () => h(),
      () => {
        k(
          q,
          h()?.roles?.includes(`owner`) || h()?.roles?.includes(`super-admin`) || h()?.superAdmin,
        );
      },
    ),
    l(),
    te());
  var Gt = gt(),
    Kt = O(g(Gt), 2);
  (s(
    Kt,
    5,
    () => xt,
    c,
    (e, t) => {
      var r = Ne(),
        i = g(r, !0);
      (d(r),
        n(() => {
          (A(r, `href`, (p(t), T(() => p(t).href))),
            j(
              r,
              1,
              `px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${(p(L), p(t), T(() => (p(L) === p(t).href ? `text-foreground border-b-2 border-primary` : `text-muted-foreground hover:text-foreground`))) ?? ``}`,
            ),
            a(i, (p(t), T(() => p(t).label))));
        }),
        o(e, r));
    },
  ),
    d(Kt));
  var qt = O(Kt, 2);
  B(qt, {
    children: (e, t) => {
      var i = Ye(),
        l = w(i);
      (le(l, {
        children: (e, t) => {
          var n = Pe(),
            i = g(n),
            a = g(i);
          oe(a, { class: `h-5 w-5 text-muted-foreground` });
          var s = O(a, 2);
          (H(g(s), {
            children: (e, t) => {
              (M(), o(e, f(`Two-Factor Authentication (TOTP)`)));
            },
            $$slots: { default: !0 },
          }),
            M(2),
            d(s),
            d(i));
          var c = O(i, 2),
            l = (e) => {
              W(e, {
                variant: `success`,
                children: (e, t) => {
                  (M(), o(e, f(`Enabled`)));
                },
                $$slots: { default: !0 },
              });
            },
            u = (e) => {
              W(e, {
                variant: `secondary`,
                children: (e, t) => {
                  (M(), o(e, f(`Disabled`)));
                },
                $$slots: { default: !0 },
              });
            };
          (r(c, (e) => {
            p(Ct) ? e(l) : e(u, -1);
          }),
            d(n),
            o(e, n));
        },
        $$slots: { default: !0 },
      }),
        V(O(l, 2), {
          children: (e, t) => {
            var i = u(),
              l = w(i),
              m = (e) => {
                o(e, Fe());
              },
              h = (e) => {
                var t = Re(),
                  i = O(g(t), 2),
                  s = g(i),
                  c = (e) => {
                    var t = Ie();
                    (n(() => A(t, `src`, p(Ot))), o(e, t));
                  },
                  l = (e) => {
                    o(e, Le());
                  };
                (r(s, (e) => {
                  p(Ot) ? e(c) : e(l, -1);
                }),
                  d(i));
                var u = O(i, 2),
                  m = O(g(u), 2),
                  h = g(m),
                  _ = g(h, !0);
                (d(h),
                  U(O(h, 2), {
                    variant: `outline`,
                    size: `sm`,
                    $$events: { click: () => Vt(p(Et)) },
                    children: (e, t) => {
                      ie(e, { class: `w-4 h-4` });
                    },
                    $$slots: { default: !0 },
                  }),
                  d(m),
                  d(u));
                var v = O(u, 2),
                  y = g(v);
                K(y, {
                  htmlFor: `verifyCode`,
                  children: (e, t) => {
                    (M(), o(e, f(`Enter the code from your app to verify`)));
                  },
                  $$slots: { default: !0 },
                });
                var b = O(y, 2),
                  ee = g(b);
                G(ee, {
                  id: `verifyCode`,
                  placeholder: `000000`,
                  maxlength: 6,
                  autocomplete: `one-time-code`,
                  inputmode: `numeric`,
                  class: `font-mono text-center text-lg tracking-widest max-w-[180px]`,
                  get value() {
                    return p(At);
                  },
                  set value(e) {
                    k(At, e);
                  },
                  $$legacy: !0,
                });
                var x = O(ee, 2);
                {
                  let e = re(() => (p(jt), p(At), T(() => p(jt) || p(At).length !== 6)));
                  U(x, {
                    get disabled() {
                      return p(e);
                    },
                    $$events: { click: zt },
                    children: (e, t) => {
                      M();
                      var r = f();
                      (n(() => a(r, p(jt) ? `Verifying...` : `Verify & Enable`)), o(e, r));
                    },
                    $$slots: { default: !0 },
                  });
                }
                (d(b), d(v), d(t), n(() => a(_, p(Et))), o(e, t));
              },
              _ = (e) => {
                var t = Ve(),
                  r = g(t);
                (z(g(r), { class: `w-4 h-4 text-warning shrink-0 mt-0.5` }), M(2), d(r));
                var i = O(r, 2);
                (s(
                  i,
                  5,
                  () => p(kt),
                  c,
                  (e, t) => {
                    var r = ze(),
                      i = g(r, !0);
                    (d(r), n(() => a(i, p(t))), o(e, r));
                  },
                ),
                  d(i));
                var l = O(i, 2),
                  u = g(l);
                (U(u, {
                  variant: `outline`,
                  $$events: {
                    click: () =>
                      Vt(
                        p(kt).join(`
`),
                      ),
                  },
                  children: (e, t) => {
                    var n = Be();
                    (ie(w(n), { class: `w-4 h-4 mr-1` }), M(), o(e, n));
                  },
                  $$slots: { default: !0 },
                }),
                  U(O(u, 2), {
                    $$events: { click: Ht },
                    children: (e, t) => {
                      (M(), o(e, f(`I've saved my codes`)));
                    },
                    $$slots: { default: !0 },
                  }),
                  d(l),
                  d(t),
                  o(e, t));
              },
              v = (e) => {
                var t = Ke(),
                  i = g(t),
                  s = O(g(i)),
                  c = (e) => {
                    var t = He(),
                      r = O(w(t)),
                      i = g(r, !0);
                    d(r);
                    var s = O(r);
                    (n(() => {
                      (a(i, p(wt)), a(s, ` recovery code${p(wt) === 1 ? `` : `s`} remaining.`));
                    }),
                      o(e, t));
                  },
                  l = (e) => {
                    o(e, Ue());
                  };
                (r(s, (e) => {
                  p(wt) > 0 ? e(c) : e(l, -1);
                }),
                  d(i));
                var u = O(i, 2),
                  m = (e) => {
                    var t = We(),
                      r = O(g(t), 2);
                    G(r, {
                      type: `password`,
                      placeholder: `Current password`,
                      get value() {
                        return p(Nt);
                      },
                      set value(e) {
                        k(Nt, e);
                      },
                      $$legacy: !0,
                    });
                    var i = O(r, 2),
                      s = g(i);
                    {
                      let e = re(() => p(Pt) || !p(Nt));
                      U(s, {
                        variant: `destructive`,
                        get disabled() {
                          return p(e);
                        },
                        $$events: { click: Bt },
                        children: (e, t) => {
                          M();
                          var r = f();
                          (n(() => a(r, p(Pt) ? `Disabling...` : `Disable MFA`)), o(e, r));
                        },
                        $$slots: { default: !0 },
                      });
                    }
                    (U(O(s, 2), {
                      variant: `outline`,
                      $$events: {
                        click: () => {
                          (k(Mt, !1), k(Nt, ``));
                        },
                      },
                      children: (e, t) => {
                        (M(), o(e, f(`Cancel`)));
                      },
                      $$slots: { default: !0 },
                    }),
                      d(i),
                      d(t),
                      o(e, t));
                  },
                  h = (e) => {
                    var t = Ge(),
                      n = g(t);
                    (U(n, {
                      variant: `outline`,
                      $$events: { click: Rt },
                      children: (e, t) => {
                        (M(), o(e, f(`Re-enroll (new device)`)));
                      },
                      $$slots: { default: !0 },
                    }),
                      U(O(n, 2), {
                        variant: `outline`,
                        $$events: { click: () => k(Mt, !0) },
                        children: (e, t) => {
                          (M(), o(e, f(`Disable MFA`)));
                        },
                        $$slots: { default: !0 },
                      }),
                      d(t),
                      o(e, t));
                  };
                (r(u, (e) => {
                  p(Mt) ? e(m) : e(h, -1);
                }),
                  d(t),
                  o(e, t));
              },
              y = (e) => {
                var t = Je();
                (U(O(g(t), 2), {
                  get disabled() {
                    return p(jt);
                  },
                  $$events: { click: Rt },
                  children: (e, t) => {
                    var r = qe(),
                      i = w(r);
                    oe(i, { class: `w-4 h-4 mr-1` });
                    var s = O(i);
                    (n(() =>
                      a(s, ` ${p(jt) ? `Setting up...` : `Enable Two-Factor Authentication`}`),
                    ),
                      o(e, r));
                  },
                  $$slots: { default: !0 },
                }),
                  d(t),
                  o(e, t));
              };
            (r(l, (e) => {
              p(St)
                ? e(m)
                : p(Tt) === `qr`
                  ? e(h, 1)
                  : p(Tt) === `done`
                    ? e(_, 2)
                    : p(Ct)
                      ? e(v, 3)
                      : e(y, -1);
            }),
              o(e, i));
          },
          $$slots: { default: !0 },
        }),
        o(e, i));
    },
    $$slots: { default: !0 },
  });
  var Jt = O(qt, 2);
  B(Jt, {
    children: (e, t) => {
      var s = ct(),
        c = w(s);
      (le(c, {
        children: (e, t) => {
          var n = Xe(),
            i = g(n),
            a = g(i);
          ue(a, { class: `h-5 w-5 text-muted-foreground` });
          var s = O(a, 2);
          (H(g(s), {
            children: (e, t) => {
              (M(), o(e, f(`Single Sign-On (SSO)`)));
            },
            $$slots: { default: !0 },
          }),
            M(2),
            d(s),
            d(i));
          var c = O(i, 2),
            l = (e) => {
              W(e, {
                variant: `success`,
                children: (e, t) => {
                  (M(), o(e, f(`Enabled`)));
                },
                $$slots: { default: !0 },
              });
            },
            u = (e) => {
              W(e, {
                variant: `secondary`,
                children: (e, t) => {
                  (M(), o(e, f(`Configured`)));
                },
                $$slots: { default: !0 },
              });
            },
            m = (e) => {
              W(e, {
                variant: `warning`,
                children: (e, t) => {
                  (M(), o(e, f(`Upgrade Required`)));
                },
                $$slots: { default: !0 },
              });
            },
            h = (e) => {
              W(e, {
                variant: `secondary`,
                children: (e, t) => {
                  (M(), o(e, f(`Not Configured`)));
                },
                $$slots: { default: !0 },
              });
            };
          (r(c, (e) => {
            p(Z) && p(Y) ? e(l) : p(Y) ? e(u, 1) : p(de) ? e(m, 2) : e(h, -1);
          }),
            d(n),
            o(e, n));
        },
        $$slots: { default: !0 },
      }),
        V(O(c, 2), {
          children: (e, t) => {
            var s = u(),
              c = w(s),
              l = (e) => {
                o(e, Ze());
              },
              m = (e) => {
                var t = Qe(),
                  r = g(t),
                  i = g(r);
                z(i, { class: `h-4 w-4 text-destructive shrink-0 mt-0.5` });
                var s = O(i, 2),
                  c = g(s),
                  l = g(c, !0);
                (d(c),
                  M(2),
                  d(s),
                  d(r),
                  U(O(r, 2), {
                    variant: `outline`,
                    size: `sm`,
                    $$events: { click: ke },
                    children: (e, t) => {
                      (M(), o(e, f(`Retry`)));
                    },
                    $$slots: { default: !0 },
                  }),
                  d(t),
                  n(() => a(l, p(pe))),
                  o(e, t));
              },
              h = (e) => {
                var t = et(),
                  r = g(t),
                  i = g(r);
                z(i, { class: `h-4 w-4 text-warning shrink-0 mt-0.5` });
                var s = O(i, 2),
                  c = g(s),
                  l = g(c, !0);
                (d(c),
                  M(2),
                  d(s),
                  d(r),
                  U(O(r, 2), {
                    variant: `outline`,
                    size: `sm`,
                    $$events: { click: () => (window.location.href = `/console/settings/billing`) },
                    children: (e, t) => {
                      M();
                      var n = $e();
                      (ae(O(w(n)), { class: `ml-1 h-3 w-3` }), o(e, n));
                    },
                    $$slots: { default: !0 },
                  }),
                  d(t),
                  n(() => a(l, p(fe))),
                  o(e, t));
              },
              v = (e) => {
                var t = st(),
                  s = g(t),
                  c = g(s);
                K(c, {
                  children: (e, t) => {
                    (M(), o(e, f(`Protocol`)));
                  },
                  $$slots: { default: !0 },
                });
                var l = O(c, 2),
                  u = g(l),
                  m = O(u, 2);
                (d(l), d(s));
                var h = O(s, 2),
                  v = g(h),
                  y = g(v);
                (K(y, {
                  children: (e, t) => {
                    (M(), o(e, f(`Display Name`)));
                  },
                  $$slots: { default: !0 },
                }),
                  G(O(y, 2), {
                    placeholder: `e.g. Corporate SSO`,
                    get value() {
                      return p(ge);
                    },
                    set value(e) {
                      k(ge, e);
                    },
                    $$legacy: !0,
                  }),
                  d(v));
                var b = O(v, 2),
                  x = g(b);
                K(x, {
                  children: (e, t) => {
                    (M(), o(e, f(`Identity Provider`)));
                  },
                  $$slots: { default: !0 },
                });
                var S = O(x, 2),
                  te = g(S);
                te.value = te.__value = ``;
                var C = O(te);
                C.value = C.__value = `okta`;
                var E = O(C);
                E.value = E.__value = `azure-ad`;
                var D = O(E);
                D.value = D.__value = `google`;
                var A = O(D);
                A.value = A.__value = `onelogin`;
                var N = O(A);
                N.value = N.__value = `ping`;
                var P = O(N);
                ((P.value = P.__value = `other`), d(S), d(b), d(h));
                var F = O(h, 2),
                  I = (e) => {
                    var t = tt(),
                      n = O(g(t), 2),
                      r = g(n);
                    (K(r, {
                      children: (e, t) => {
                        (M(), o(e, f(`Issuer URL`)));
                      },
                      $$slots: { default: !0 },
                    }),
                      G(O(r, 2), {
                        placeholder: `https://accounts.google.com or https://login.microsoftonline.com/{tenant}/v2.0`,
                        get value() {
                          return p(Te);
                        },
                        set value(e) {
                          k(Te, e);
                        },
                        $$legacy: !0,
                      }),
                      M(2),
                      d(n));
                    var i = O(n, 2),
                      a = g(i),
                      s = g(a);
                    (K(s, {
                      children: (e, t) => {
                        (M(), o(e, f(`Client ID`)));
                      },
                      $$slots: { default: !0 },
                    }),
                      G(O(s, 2), {
                        placeholder: `your-client-id`,
                        get value() {
                          return p(Ee);
                        },
                        set value(e) {
                          k(Ee, e);
                        },
                        $$legacy: !0,
                      }),
                      d(a));
                    var c = O(a, 2),
                      l = g(c);
                    K(l, {
                      children: (e, t) => {
                        (M(), o(e, f(`Client Secret`)));
                      },
                      $$slots: { default: !0 },
                    });
                    var u = O(l, 2);
                    {
                      let e = re(() => (p(Y) ? `••••••••` : `your-client-secret`));
                      G(u, {
                        type: `password`,
                        get placeholder() {
                          return p(e);
                        },
                        get value() {
                          return p(De);
                        },
                        set value(e) {
                          k(De, e);
                        },
                        $$legacy: !0,
                      });
                    }
                    (d(c), d(i));
                    var m = O(i, 2),
                      h = g(m);
                    (K(h, {
                      children: (e, t) => {
                        (M(), o(e, f(`Scopes`)));
                      },
                      $$slots: { default: !0 },
                    }),
                      G(O(h, 2), {
                        placeholder: `openid email profile`,
                        get value() {
                          return p(Oe);
                        },
                        set value(e) {
                          k(Oe, e);
                        },
                        $$legacy: !0,
                      }),
                      d(m),
                      d(t),
                      o(e, t));
                  },
                  L = (e) => {
                    var t = rt(),
                      i = O(g(t), 2),
                      s = O(g(i), 4),
                      c = g(s),
                      l = g(c),
                      u = O(g(l), 2);
                    ((u.textContent = `${T(() => (typeof window < `u` ? window.location.origin : ``)) ?? ``}/api/auth/sso/metadata`),
                      d(l),
                      U(O(l, 2), {
                        variant: `ghost`,
                        size: `sm`,
                        $$events: {
                          click: () => Vt(`${window.location.origin}/api/auth/sso/metadata`),
                        },
                        children: (e, t) => {
                          ie(e, { class: `h-3 w-3` });
                        },
                        $$slots: { default: !0 },
                      }),
                      d(c));
                    var m = O(c, 2),
                      h = g(m),
                      _ = O(g(h), 2);
                    ((_.textContent = `${T(() => (typeof window < `u` ? window.location.origin : ``)) ?? ``}/api/auth/sso/callback`),
                      d(h),
                      U(O(h, 2), {
                        variant: `ghost`,
                        size: `sm`,
                        $$events: {
                          click: () => Vt(`${window.location.origin}/api/auth/sso/callback`),
                        },
                        children: (e, t) => {
                          ie(e, { class: `h-3 w-3` });
                        },
                        $$slots: { default: !0 },
                      }),
                      d(m),
                      d(s),
                      M(2),
                      d(i));
                    var v = O(i, 2),
                      y = O(g(v), 4),
                      b = g(y);
                    (G(g(b), {
                      placeholder: `https://login.microsoftonline.com/.../federationmetadata/2007-06/FederationMetadata.xml`,
                      get value() {
                        return p(we);
                      },
                      set value(e) {
                        k(we, e);
                      },
                      $$legacy: !0,
                    }),
                      d(b));
                    var x = O(b, 2);
                    {
                      let e = re(() => p(_t) || !p(we));
                      U(x, {
                        variant: `outline`,
                        size: `default`,
                        get disabled() {
                          return p(e);
                        },
                        $$events: { click: yt },
                        children: (e, t) => {
                          M();
                          var r = f();
                          (n(() => a(r, p(_t) ? `Fetching...` : `Import`)), o(e, r));
                        },
                        $$slots: { default: !0 },
                      });
                    }
                    d(y);
                    var S = O(y, 2),
                      te = (e) => {
                        var t = nt(),
                          r = g(t, !0);
                        (d(t), n(() => a(r, p(vt))), o(e, t));
                      };
                    (r(S, (e) => {
                      p(vt) && e(te);
                    }),
                      d(v));
                    var C = O(v, 2);
                    let w;
                    var E = g(C),
                      D = g(E, !0);
                    d(E);
                    var A = O(E, 2),
                      N = g(A),
                      P = g(N);
                    (K(P, {
                      children: (e, t) => {
                        (M(), o(e, f(`IdP Entity ID`)));
                      },
                      $$slots: { default: !0 },
                    }),
                      G(O(P, 2), {
                        placeholder: `https://sts.windows.net/...`,
                        get value() {
                          return p(xe);
                        },
                        set value(e) {
                          k(xe, e);
                        },
                        $$legacy: !0,
                      }),
                      d(N));
                    var F = O(N, 2),
                      I = g(F);
                    (K(I, {
                      children: (e, t) => {
                        (M(), o(e, f(`IdP SSO URL`)));
                      },
                      $$slots: { default: !0 },
                    }),
                      G(O(I, 2), {
                        placeholder: `https://login.microsoftonline.com/.../saml2`,
                        get value() {
                          return p(Se);
                        },
                        set value(e) {
                          k(Se, e);
                        },
                        $$legacy: !0,
                      }),
                      d(F));
                    var L = O(F, 2),
                      ae = g(L);
                    K(ae, {
                      children: (e, t) => {
                        (M(), o(e, f(`X.509 Signing Certificate (PEM)`)));
                      },
                      $$slots: { default: !0 },
                    });
                    var R = O(ae, 2);
                    (ne(R),
                      d(L),
                      d(A),
                      d(C),
                      d(t),
                      n(() => {
                        ((w = j(C, 1, `space-y-4`, null, w, { open: !!p(xe) || !!p(Se) })),
                          a(
                            D,
                            p(xe) ? `IdP details (auto-filled)` : `Or enter IdP details manually`,
                          ));
                      }),
                      ee(
                        R,
                        () => p(Ce),
                        (e) => k(Ce, e),
                      ),
                      o(e, t));
                  };
                r(F, (e) => {
                  p(he) === `oidc` ? e(I) : e(L, -1);
                });
                var R = O(F, 2),
                  oe = O(g(R), 2),
                  z = O(g(oe), 2),
                  ce = g(z);
                (d(z), d(oe));
                var B = O(oe, 2),
                  V = O(g(B), 2),
                  le = g(V);
                (d(V), d(B));
                var H = O(B, 2),
                  W = O(g(H), 2),
                  ue = g(W);
                (d(W), d(H));
                var q = O(H, 2),
                  J = O(g(q), 2),
                  de = g(J);
                (d(J), d(q));
                var fe = O(q, 2),
                  pe = g(fe);
                (K(pe, {
                  children: (e, t) => {
                    (M(), o(e, f(`Default Roles for New SSO Users`)));
                  },
                  $$slots: { default: !0 },
                }),
                  G(O(pe, 2), {
                    placeholder: `["member"]`,
                    class: `font-mono text-sm`,
                    get value() {
                      return p(be);
                    },
                    set value(e) {
                      k(be, e);
                    },
                    $$legacy: !0,
                  }),
                  M(2),
                  d(fe),
                  d(R));
                var ke = O(R, 2),
                  Me = (e) => {
                    var t = it(),
                      r = g(t, !0);
                    (d(t),
                      n(() => {
                        (j(
                          t,
                          1,
                          `rounded-md p-3 text-sm ${(p(X), T(() => (p(X).success ? `bg-green-500/10 text-green-700` : `bg-destructive/10 text-destructive`))) ?? ``}`,
                        ),
                          a(r, (p(X), T(() => p(X).message))));
                      }),
                      o(e, t));
                  };
                r(ke, (e) => {
                  p(X) && e(Me);
                });
                var Ne = O(ke, 2),
                  Pe = g(Ne);
                U(Pe, {
                  get disabled() {
                    return p(me);
                  },
                  $$events: { click: Ae },
                  children: (e, t) => {
                    M();
                    var r = f();
                    (n(() => a(r, p(me) ? `Saving...` : `Save SSO Configuration`)), o(e, r));
                  },
                  $$slots: { default: !0 },
                });
                var Fe = O(Pe, 2),
                  Ie = (e) => {
                    U(e, {
                      variant: `outline`,
                      $$events: { click: bt },
                      children: (e, t) => {
                        var n = at();
                        (ae(w(n), { class: `h-4 w-4 mr-1` }), M(), o(e, n));
                      },
                      $$slots: { default: !0 },
                    });
                  };
                r(Fe, (e) => {
                  p(Y) && p(Z) && e(Ie);
                });
                var Le = O(Fe, 2),
                  Re = (e) => {
                    U(e, {
                      variant: `outline`,
                      class: `text-destructive`,
                      $$events: { click: je },
                      children: (e, t) => {
                        var n = ot();
                        (se(w(n), { class: `h-4 w-4 mr-1` }), M(), o(e, n));
                      },
                      $$slots: { default: !0 },
                    });
                  };
                (r(Le, (e) => {
                  p(Y) && e(Re);
                }),
                  d(Ne),
                  d(t),
                  n(() => {
                    (j(
                      u,
                      1,
                      `px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${p(he) === `oidc` ? `bg-primary text-primary-foreground border-primary` : `bg-background text-muted-foreground border-border hover:border-foreground`}`,
                    ),
                      j(
                        m,
                        1,
                        `px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${p(he) === `saml` ? `bg-primary text-primary-foreground border-primary` : `bg-background text-muted-foreground border-border hover:border-foreground`}`,
                      ),
                      j(
                        z,
                        1,
                        `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${p(Z) ? `bg-primary` : `bg-muted`}`,
                      ),
                      j(
                        ce,
                        1,
                        `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${p(Z) ? `translate-x-6` : `translate-x-1`}`,
                      ),
                      j(
                        V,
                        1,
                        `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${p(ve) ? `bg-primary` : `bg-muted`}`,
                      ),
                      j(
                        le,
                        1,
                        `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${p(ve) ? `translate-x-6` : `translate-x-1`}`,
                      ),
                      j(
                        W,
                        1,
                        `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${p(ye) ? `bg-primary` : `bg-muted`}`,
                      ),
                      j(
                        ue,
                        1,
                        `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${p(ye) ? `translate-x-6` : `translate-x-1`}`,
                      ),
                      j(
                        J,
                        1,
                        `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${p(Q) ? `bg-primary` : `bg-muted`}`,
                      ),
                      j(
                        de,
                        1,
                        `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${p(Q) ? `translate-x-6` : `translate-x-1`}`,
                      ));
                  }),
                  i(`click`, u, () => k(he, `oidc`)),
                  i(`click`, m, () => k(he, `saml`)),
                  _(
                    S,
                    () => p(_e),
                    (e) => k(_e, e),
                  ),
                  i(`click`, z, () => k(Z, !p(Z))),
                  i(`click`, V, () => k(ve, !p(ve))),
                  i(`click`, W, () => k(ye, !p(ye))),
                  i(`click`, J, () => k(Q, !p(Q))),
                  o(e, t));
              };
            (r(c, (e) => {
              p(J) ? e(l) : p(pe) ? e(m, 1) : p(de) ? e(h, 2) : e(v, -1);
            }),
              o(e, s));
          },
          $$slots: { default: !0 },
        }),
        o(e, s));
    },
    $$slots: { default: !0 },
  });
  var Yt = O(Jt, 2),
    Xt = (e) => {
      B(e, {
        children: (e, t) => {
          var r = ut(),
            i = w(r);
          (le(i, {
            children: (e, t) => {
              var r = lt(),
                i = g(r);
              z(i, { class: `h-5 w-5 text-destructive` });
              var s = O(i, 2),
                c = g(s);
              H(c, {
                children: (e, t) => {
                  (M(), o(e, f(`Organization Security Policy`)));
                },
                $$slots: { default: !0 },
              });
              var l = O(c, 2),
                u = g(l, !0);
              (d(l), d(s), d(r), n(() => a(u, p(Ft))), o(e, r));
            },
            $$slots: { default: !0 },
          }),
            V(O(i, 2), {
              children: (e, t) => {
                U(e, {
                  variant: `outline`,
                  $$events: { click: Ut },
                  children: (e, t) => {
                    (M(), o(e, f(`Retry`)));
                  },
                  $$slots: { default: !0 },
                });
              },
              $$slots: { default: !0 },
            }),
            o(e, r));
        },
        $$slots: { default: !0 },
      });
    },
    Zt = (e) => {
      B(e, {
        children: (e, t) => {
          var l = ht(),
            u = w(l);
          (le(u, {
            children: (e, t) => {
              var n = dt(),
                r = g(n);
              R(r, { class: `h-5 w-5 text-muted-foreground` });
              var i = O(r, 2);
              (H(g(i), {
                children: (e, t) => {
                  (M(), o(e, f(`Organization Security Policy`)));
                },
                $$slots: { default: !0 },
              }),
                M(2),
                d(i),
                d(n),
                o(e, n));
            },
            $$slots: { default: !0 },
          }),
            V(O(u, 2), {
              children: (e, t) => {
                var l = mt(),
                  u = g(l),
                  m = g(u),
                  h = O(g(m), 2),
                  v = g(h);
                (d(h), d(m));
                var y = O(m, 2),
                  b = (e) => {
                    var t = pt(),
                      r = g(t);
                    K(r, {
                      children: (e, t) => {
                        (M(), o(e, f(`Require MFA for specific roles`)));
                      },
                      $$slots: { default: !0 },
                    });
                    var l = O(r, 2);
                    (s(
                      l,
                      4,
                      () => [`owner`, `admin`, `member`],
                      c,
                      (e, t) => {
                        var r = ft(),
                          s = g(r, !0);
                        (d(r),
                          n(
                            (e) => {
                              (j(
                                r,
                                1,
                                `px-3 py-1 rounded-full text-xs font-medium border transition-colors ${e ?? ``}`,
                              ),
                                a(s, t));
                            },
                            [
                              () => (
                                p($),
                                T(() =>
                                  p($).mfaRequiredRoles.includes(t)
                                    ? `bg-primary text-primary-foreground border-primary`
                                    : `bg-background text-muted-foreground border-border hover:border-foreground`,
                                )
                              ),
                            ],
                          ),
                          i(`click`, r, () => {
                            p($).mfaRequiredRoles.includes(t)
                              ? C(
                                  $,
                                  (p($).mfaRequiredRoles = p($).mfaRequiredRoles.filter(
                                    (e) => e !== t,
                                  )),
                                )
                              : C($, (p($).mfaRequiredRoles = [...p($).mfaRequiredRoles, t]));
                          }),
                          o(e, r));
                      },
                    ),
                      d(l),
                      d(t),
                      o(e, t));
                  };
                (r(y, (e) => {
                  (p($), T(() => !p($).mfaRequired) && e(b));
                }),
                  d(u));
                var ee = O(u, 2),
                  x = g(ee),
                  S = g(x);
                K(S, {
                  children: (e, t) => {
                    (M(), o(e, f(`Session duration`)));
                  },
                  $$slots: { default: !0 },
                });
                var te = O(S, 2),
                  ne = g(te);
                ne.value = ne.__value = 3600;
                var w = O(ne);
                w.value = w.__value = 14400;
                var re = O(w);
                re.value = re.__value = 28800;
                var E = O(re);
                E.value = E.__value = 86400;
                var D = O(E);
                D.value = D.__value = 259200;
                var k = O(D);
                k.value = k.__value = 604800;
                var A = O(k);
                ((A.value = A.__value = 2592e3), d(te), M(2), d(x));
                var N = O(x, 2),
                  P = g(N);
                K(P, {
                  children: (e, t) => {
                    (M(), o(e, f(`MFA session duration`)));
                  },
                  $$slots: { default: !0 },
                });
                var F = O(P, 2),
                  I = g(F);
                I.value = I.__value = 3600;
                var L = O(I);
                L.value = L.__value = 14400;
                var ie = O(L);
                ie.value = ie.__value = 28800;
                var ae = O(ie);
                ae.value = ae.__value = 86400;
                var R = O(ae);
                R.value = R.__value = 259200;
                var oe = O(R);
                oe.value = oe.__value = 604800;
                var se = O(oe);
                se.value = se.__value = 2592e3;
                var z = O(se);
                ((z.value = z.__value = 7776e3), d(F), M(2), d(N), d(ee));
                var ce = O(ee, 2),
                  B = g(ce);
                K(B, {
                  children: (e, t) => {
                    (M(), o(e, f(`Idle timeout`)));
                  },
                  $$slots: { default: !0 },
                });
                var V = O(B, 2),
                  le = g(V);
                le.value = le.__value = 900;
                var H = O(le);
                H.value = H.__value = 1800;
                var W = O(H);
                W.value = W.__value = 3600;
                var ue = O(W);
                ue.value = ue.__value = 14400;
                var q = O(ue);
                q.value = q.__value = 86400;
                var J = O(q);
                ((J.value = J.__value = 604800), d(V), M(2), d(ce));
                var Y = O(ce, 2),
                  de = g(Y);
                (K(de, {
                  children: (e, t) => {
                    (M(), o(e, f(`Minimum password length`)));
                  },
                  $$slots: { default: !0 },
                }),
                  G(O(de, 2), {
                    type: `number`,
                    min: 8,
                    max: 128,
                    class: `max-w-[120px]`,
                    get value() {
                      return p($).minPasswordLength;
                    },
                    set value(e) {
                      C($, (p($).minPasswordLength = e));
                    },
                    $$legacy: !0,
                  }),
                  d(Y),
                  U(O(Y, 2), {
                    get disabled() {
                      return p(It);
                    },
                    $$events: { click: Wt },
                    children: (e, t) => {
                      M();
                      var r = f();
                      (n(() => a(r, p(It) ? `Saving...` : `Save Security Policy`)), o(e, r));
                    },
                    $$slots: { default: !0 },
                  }),
                  d(l),
                  n(() => {
                    (j(
                      h,
                      1,
                      `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(p($), T(() => (p($).mfaRequired ? `bg-primary` : `bg-muted`))) ?? ``}`,
                    ),
                      j(
                        v,
                        1,
                        `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(p($), T(() => (p($).mfaRequired ? `translate-x-6` : `translate-x-1`))) ?? ``}`,
                      ));
                  }),
                  i(`click`, h, () => C($, (p($).mfaRequired = !p($).mfaRequired))),
                  _(
                    te,
                    () => p($).sessionTtlSeconds,
                    (e) => C($, (p($).sessionTtlSeconds = e)),
                  ),
                  _(
                    F,
                    () => p($).mfaSessionTtlSeconds,
                    (e) => C($, (p($).mfaSessionTtlSeconds = e)),
                  ),
                  _(
                    V,
                    () => p($).idleTimeoutSeconds,
                    (e) => C($, (p($).idleTimeoutSeconds = e)),
                  ),
                  o(e, l));
              },
              $$slots: { default: !0 },
            }),
            o(e, l));
        },
        $$slots: { default: !0 },
      });
    };
  (r(Yt, (e) => {
    p(q) && p(Ft) ? e(Xt) : p(q) && p($) && e(Zt, 1);
  }),
    d(Gt),
    o(e, Gt),
    v(),
    P());
}
export { _t as component };
