/* Matching Lab - statistics primitives.
 * Zero dependencies. UMD-ish: attaches to window.MatchLabStats and module.exports.
 */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------------ *
   * small numeric helpers
   * ------------------------------------------------------------------ */

  function mean(a) {
    var s = 0;
    for (var i = 0; i < a.length; i++) s += a[i];
    return s / a.length;
  }

  function variance(a) {
    var m = mean(a);
    var s = 0;
    for (var i = 0; i < a.length; i++) {
      var d = a[i] - m;
      s += d * d;
    }
    return s / a.length;
  }

  function sd(a) {
    return Math.sqrt(variance(a));
  }

  function quantile(a, q) {
    var b = Array.prototype.slice.call(a);
    b.sort(function (x, y) { return x - y; });
    if (!b.length) return NaN;
    var pos = (b.length - 1) * q;
    var lo = Math.floor(pos);
    var hi = Math.ceil(pos);
    if (lo === hi) return b[lo];
    return b[lo] + (b[hi] - b[lo]) * (pos - lo);
  }

  function clamp(x, lo, hi) {
    return x < lo ? lo : x > hi ? hi : x;
  }

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ------------------------------------------------------------------ *
   * matrices
   * ------------------------------------------------------------------ */

  function buildMatrix(data, features, standardize) {
    var n = data.n;
    var d = features.length;
    var X = new Float64Array(n * d);
    var means = new Float64Array(d);
    var sds = new Float64Array(d);
    for (var j = 0; j < d; j++) {
      var arr = data[features[j]];
      if (!arr) throw new Error('unknown feature: ' + features[j]);
      var s = 0;
      for (var i = 0; i < n; i++) s += arr[i];
      var m = s / n;
      var v = 0;
      for (i = 0; i < n; i++) {
        var t = arr[i] - m;
        v += t * t;
      }
      var sdev = Math.sqrt(v / n);
      if (!sdev) sdev = 1;
      means[j] = m;
      sds[j] = sdev;
      for (i = 0; i < n; i++) {
        X[i * d + j] = standardize ? (arr[i] - m) / sdev : arr[i];
      }
    }
    return { X: X, n: n, d: d, features: features.slice(), mean: means, sd: sds };
  }

  function design(columns) {
    var n = columns[0].length;
    var d = columns.length;
    var X = new Float64Array(n * d);
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < d; j++) X[i * d + j] = columns[j][i];
    }
    return { X: X, n: n, d: d };
  }

  /* Ordinary least squares with an intercept, solved from normal equations.
   * X is a flat n*d matrix; indices optionally restricts the sample. */
  function ols(X, n, d, y, indices) {
    var m = indices ? indices.length : n;
    var p = d + 1;
    var A = new Float64Array(p * p);
    var b = new Float64Array(p);
    for (var s = 0; s < m; s++) {
      var i = indices ? indices[s] : s;
      var off = i * d;
      var yi = y[i];
      b[0] += yi;
      for (var j = 0; j < d; j++) {
        var xj = X[off + j];
        b[j + 1] += xj * yi;
        A[(j + 1) * p] += xj;
        A[j + 1] += xj;
        for (var k = 0; k < d; k++) {
          A[(j + 1) * p + (k + 1)] += xj * X[off + k];
        }
      }
    }
    A[0] = m;
    // tiny ridge for rank-deficient cases
    for (var q = 1; q < p; q++) A[q * p + q] += 1e-9;

    // Gaussian elimination with partial pivoting
    for (var col = 0; col < p; col++) {
      var piv = col;
      for (var r = col + 1; r < p; r++) {
        if (Math.abs(A[r * p + col]) > Math.abs(A[piv * p + col])) piv = r;
      }
      if (piv !== col) {
        for (var c = col; c < p; c++) {
          var tmp = A[col * p + c];
          A[col * p + c] = A[piv * p + c];
          A[piv * p + c] = tmp;
        }
        var tb = b[col];
        b[col] = b[piv];
        b[piv] = tb;
      }
      var div = A[col * p + col];
      if (Math.abs(div) < 1e-12) div = div < 0 ? -1e-12 : 1e-12;
      for (r = col + 1; r < p; r++) {
        var f = A[r * p + col] / div;
        if (!f) continue;
        for (c = col; c < p; c++) A[r * p + c] -= f * A[col * p + c];
        b[r] -= f * b[col];
      }
    }
    var beta = new Float64Array(p);
    for (r = p - 1; r >= 0; r--) {
      var sum = b[r];
      for (c = r + 1; c < p; c++) sum -= A[r * p + c] * beta[c];
      beta[r] = sum / A[r * p + r];
    }
    return beta;
  }

  function predict(beta, X, d, i) {
    var off = i * d;
    var out = beta[0];
    for (var j = 0; j < d; j++) out += beta[j + 1] * X[off + j];
    return out;
  }

  /* ------------------------------------------------------------------ *
   * k-d tree (exact nearest neighbours, deterministic tie-break by index)
   * ------------------------------------------------------------------ */

  function KDTree(X, n, d, indices) {
    this.X = X;
    this.n = n;
    this.d = d;
    var ids;
    if (indices) {
      ids = indices.slice();
    } else {
      ids = new Array(n);
      for (var i = 0; i < n; i++) ids[i] = i;
    }
    this.root = this._build(ids, 0);
  }

  KDTree.prototype._build = function (ids, depth) {
    if (!ids.length) return null;
    var d = this.d;
    var X = this.X;
    var axis = depth % d;
    ids.sort(function (a, b) {
      var diff = X[a * d + axis] - X[b * d + axis];
      return diff || a - b;
    });
    var mid = ids.length >> 1;
    return {
      idx: ids[mid],
      axis: axis,
      left: this._build(ids.slice(0, mid), depth + 1),
      right: this._build(ids.slice(mid + 1), depth + 1)
    };
  };

  KDTree.prototype.query = function (point, k) {
    var X = this.X;
    var d = this.d;
    var heap = [];

    function worstFirst(a, b) {
      return b.d2 - a.d2 || b.i - a.i;
    }

    function consider(i, d2) {
      if (heap.length < k) {
        heap.push({ i: i, d2: d2 });
        heap.sort(worstFirst);
      } else if (d2 < heap[0].d2 || (d2 === heap[0].d2 && i < heap[0].i)) {
        heap[0] = { i: i, d2: d2 };
        heap.sort(worstFirst);
      }
    }

    function search(node) {
      if (!node) return;
      var off = node.idx * d;
      var s = 0;
      for (var j = 0; j < d; j++) {
        var diff = point[j] - X[off + j];
        s += diff * diff;
      }
      consider(node.idx, s);
      var axis = node.axis;
      var delta = point[axis] - X[off + axis];
      var near = delta < 0 ? node.left : node.right;
      var far = delta < 0 ? node.right : node.left;
      search(near);
      if (heap.length < k || delta * delta <= heap[0].d2) search(far);
    }

    search(this.root);
    heap.sort(function (a, b) { return a.d2 - b.d2 || a.i - b.i; });
    return heap;
  };

  /* ------------------------------------------------------------------ *
   * matching
   * ------------------------------------------------------------------ */

  function matching(data, opts) {
    opts = opts || {};
    var features = opts.features || ['severity', 'age', 'sex'];
    var requestedK = clamp(Math.round(opts.k || 1), 1, 10);
    var standardize = opts.standardize !== false;
    var caliper = opts.caliper == null || opts.caliper <= 0 ? Infinity : opts.caliper;
    var replace = opts.replace !== false;
    var kMax = replace ? 10 : 1;

    var matrix = buildMatrix(data, features, standardize);
    var X = matrix.X;
    var n = matrix.n;
    var d = matrix.d;
    var t = data.medication;
    var y = data.recovery;

    var tr = [];
    var co = [];
    var i;
    for (i = 0; i < n; i++) {
      if (t[i]) tr.push(i);
      else co.push(i);
    }
    if (!tr.length || !co.length) throw new Error('both treatment groups are required');

    var treeCo = new KDTree(X, n, d, co);
    var treeTr = new KDTree(X, n, d, tr);
    var mu0 = ols(X, n, d, y, co);
    var mu1 = ols(X, n, d, y, tr);

    var pt = new Float64Array(d);

    function group(list) {
      return {
        list: list,
        m: list.length,
        match: new Int32Array(list.length * kMax).fill(-1),
        dist: new Float32Array(list.length * kMax).fill(NaN),
        raw: new Float64Array(list.length).fill(NaN),
        corr: new Float64Array(list.length).fill(NaN),
        kept: new Uint8Array(list.length),
        pos: null
      };
    }

    var T = group(tr);
    var C = group(co);
    T.pos = new Int32Array(n).fill(-1);
    C.pos = new Int32Array(n).fill(-1);
    for (i = 0; i < T.m; i++) T.pos[T.list[i]] = i;
    for (i = 0; i < C.m; i++) C.pos[C.list[i]] = i;

    function queryUnit(i, tree) {
      for (var j = 0; j < d; j++) pt[j] = X[i * d + j];
      return tree.query(pt, kMax);
    }

    function fillGroup(G, tree, mu) {
      var used = null;
      if (!replace) used = new Uint8Array(n);
      for (var s = 0; s < G.m; s++) {
        var unit = G.list[s];
        var cand = queryUnit(unit, tree);
        var filled = 0;
        var c;
        for (c = 0; c < cand.length; c++) {
          var candIdx = cand[c].i;
          if (!replace) {
            if (used[candIdx]) continue;
            used[candIdx] = 1;
          }
          G.match[s * kMax + filled] = candIdx;
          G.dist[s * kMax + filled] = Math.sqrt(cand[c].d2);
          filled++;
          if (!replace) break;
        }
        if (!filled) continue;
        var count = 0;
        var sumY = 0;
        var sumMu = 0;
        for (c = 0; c < filled; c++) {
          var dd = G.dist[s * kMax + c];
          if (dd > caliper) continue;
          count++;
          sumY += y[G.match[s * kMax + c]];
          sumMu += predict(mu, X, d, G.match[s * kMax + c]);
        }
        if (!count) continue;
        G.kept[s] = 1;
        G.raw[s] = y[unit] - sumY / count;
        G.corr[s] = predict(mu, X, d, unit) - sumMu / count;
      }
    }

    fillGroup(T, treeCo, mu0);
    fillGroup(C, treeTr, mu1);

    function estimateAt(kk, record) {
      var sumSign = 0;
      var sumRaw = 0;
      var sumCorr = 0;
      var usedT = 0;
      var usedC = 0;
      var attRaw = 0;
      var attCorr = 0;
      var atcRaw = 0;
      var atcCorr = 0;
      var kkUse = replace ? kk : 1;

      function walk(G, sign, isT) {
        for (var s = 0; s < G.m; s++) {
          if (!G.kept[s]) {
            if (record) { G.raw[s] = NaN; G.corr[s] = NaN; }
            continue;
          }
          var count = 0;
          var sumY = 0;
          var sumMu = 0;
          for (var c = 0; c < kkUse; c++) {
            var idx = G.match[s * kMax + c];
            if (idx < 0) break;
            var dd = G.dist[s * kMax + c];
            if (dd > caliper) break;
            count++;
            sumY += y[idx];
            sumMu += predict(isT ? mu0 : mu1, X, d, idx);
          }
          if (!count) {
            if (record) { G.raw[s] = NaN; G.corr[s] = NaN; }
            continue;
          }
          var raw = y[G.list[s]] - sumY / count;
          var corr = predict(isT ? mu0 : mu1, X, d, G.list[s]) - sumMu / count;
          if (record) {
            G.raw[s] = raw;
            G.corr[s] = corr;
          }
          var signedRaw = sign * raw;
          var signedCorr = sign * (raw - corr);
          sumSign += sign;
          sumRaw += signedRaw;
          sumCorr += signedCorr;
          if (isT) {
            usedT++;
            attRaw += raw;
            attCorr += raw - corr;
          } else {
            usedC++;
            atcRaw += -raw;
            atcCorr += -(raw - corr);
          }
        }
      }

      walk(T, 1, true);
      walk(C, -1, false);
      var total = usedT + usedC;
      return {
        k: kkUse,
        ateRaw: total ? sumRaw / total : NaN,
        ateCorrected: total ? sumCorr / total : NaN,
        attRaw: usedT ? attRaw / usedT : NaN,
        attCorrected: usedT ? attCorr / usedT : NaN,
        atcRaw: usedC ? atcRaw / usedC : NaN,
        atcCorrected: usedC ? atcCorr / usedC : NaN,
        usedT: usedT,
        usedC: usedC,
        droppedT: T.m - usedT,
        droppedC: C.m - usedC
      };
    }

    var curve = [];
    for (var kk = 1; kk <= kMax; kk++) {
      curve.push(estimateAt(kk, false));
    }

    var main = estimateAt(replace ? requestedK : 1, true);

    // nearest-match distances for diagnostics
    var distances = [];
    for (i = 0; i < T.m; i++) if (T.match[i * kMax] >= 0) distances.push(T.dist[i * kMax]);
    for (i = 0; i < C.m; i++) if (C.match[i * kMax] >= 0) distances.push(C.dist[i * kMax]);
    distances.sort(function (a, b) { return a - b; });

    var result = {
      features: features,
      standardize: standardize,
      caliper: caliper,
      replace: replace,
      k: replace ? requestedK : 1,
      currentK: replace ? requestedK : 1,
      kMax: kMax,
      matrix: matrix,
      mu0: mu0,
      mu1: mu1,
      T: T,
      C: C,
      curve: curve,
      main: main,
      medianDistance: distances.length ? quantile(distances, 0.5) : NaN,
      p90Distance: distances.length ? quantile(distances, 0.9) : NaN,
      meanDistance: distances.length ? mean(distances) : NaN,
      nTreated: T.m,
      nControl: C.m
    };
    result.estimateAt = estimateAt;
    return result;
  }

  /* Return the first k usable matches for an original unit index. */
  function unitMatches(result, unitIndex) {
    var G = result.T.pos[unitIndex] >= 0 ? result.T : result.C;
    var s = G.pos[unitIndex];
    if (s < 0) return null;
    var out = [];
    var kk = Math.min(result.currentK || result.k || result.kMax, result.kMax);
    for (var c = 0; c < kk; c++) {
      var idx = G.match[s * result.kMax + c];
      if (idx < 0) break;
      var dist = G.dist[s * result.kMax + c];
      if (dist > result.caliper) break;
      out.push({ index: idx, distance: dist });
    }
    return {
      group: G === result.T ? 'treated' : 'control',
      unit: unitIndex,
      matches: out,
      raw: G.raw[s],
      correction: G.corr[s]
    };
  }

  /* ------------------------------------------------------------------ *
   * chapter-specific helpers
   * ------------------------------------------------------------------ */

  function severityBand(data, band, target) {
    var sev = data.severity;
    var y = data.recovery;
    var t = data.medication;
    var n = data.n;
    var sumT = 0;
    var sumC = 0;
    var cT = 0;
    var cC = 0;
    for (var i = 0; i < n; i++) {
      if (Math.abs(sev[i] - target) > band) continue;
      if (t[i]) {
        sumT += y[i];
        cT++;
      } else {
        sumC += y[i];
        cC++;
      }
    }
    return {
      estimate: cT && cC ? sumT / cT - sumC / cC : NaN,
      n: cT + cC,
      treated: cT,
      control: cC,
      target: target
    };
  }

  function bandCurve(data, target, steps) {
    steps = steps || 40;
    var out = [];
    var lo = 0.01;
    var hi = 0.5;
    for (var s = 0; s < steps; s++) {
      var band = lo + (hi - lo) * (s / (steps - 1));
      var r = severityBand(data, band, target);
      out.push({ band: band, estimate: r.estimate, n: r.n, treated: r.treated });
    }
    return out;
  }

  function regressionWeights(drug) {
    var n = drug.length;
    var cells = [];
    var female = new Float64Array(n);
    var treat = new Float64Array(n);
    var days = new Float64Array(n);
    for (var i = 0; i < n; i++) {
      female[i] = drug[i].sex === 'W' ? 1 : 0;
      treat[i] = drug[i].drug;
      days[i] = drug[i].days;
    }
    var names = ['M', 'W'];
    for (var g = 0; g < 2; g++) {
      var mask = [];
      for (i = 0; i < n; i++) if (female[i] === g) mask.push(i);
      var nt = 0;
      var nc = 0;
      var st = 0;
      var sc = 0;
      for (i = 0; i < mask.length; i++) {
        var p = mask[i];
        if (treat[p]) { nt++; st += days[p]; } else { nc++; sc += days[p]; }
      }
      var effect = nt && nc ? st / nt - sc / nc : NaN;
      var pT = nt / mask.length;
      var varT = pT * (1 - pT);
      cells.push({
        name: names[g],
        n: mask.length,
        treated: nt,
        control: nc,
        meanTreated: nt ? st / nt : NaN,
        meanControl: nc ? sc / nc : NaN,
        effect: effect,
        varT: varT
      });
    }
    var sub = 0;
    for (i = 0; i < cells.length; i++) sub += (cells[i].n / n) * cells[i].effect;

    var mat = design([treat, female]);
    var beta = ols(mat.X, mat.n, mat.d, days, null);
    var weights = cells.map(function (c) { return c.n * c.varT; });
    var wsum = weights[0] + weights[1];
    var olsWeighted = 0;
    for (i = 0; i < cells.length; i++) olsWeighted += (weights[i] / wsum) * cells[i].effect;

    return {
      naive: mean(days.filter(function (_, j) { return treat[j] === 1; })) -
        mean(days.filter(function (_, j) { return treat[j] === 0; })),
      subclassification: sub,
      ols: beta[1],
      intercept: beta[0],
      femaleCoef: beta[2],
      cells: cells,
      weights: weights,
      weightShares: weights.map(function (w) { return w / wsum; }),
      true: -2.6
    };
  }

  function oracleAte(data) {
    var sex = data.sex;
    var age = data.age;
    var sev = data.severity;
    var med = data.medication;
    var y = data.recovery;
    var n = data.n;
    var age2 = new Float64Array(n);
    var logsev = new Float64Array(n);
    var sexsev = new Float64Array(n);
    for (var i = 0; i < n; i++) {
      age2[i] = age[i] * age[i];
      logsev[i] = Math.log(sev[i]);
      sexsev[i] = sex[i] * sev[i];
    }
    var mat = design([sex, age, age2, sev, logsev, sexsev, med]);
    var beta = ols(mat.X, mat.n, mat.d, y, null);
    return beta[7];
  }

  function curseSim(opts) {
    opts = opts || {};
    var n = opts.n || 500;
    var q = opts.q || 200;
    var dMax = opts.dMax || 10;
    var seed = opts.seed || 12345;
    var out = [];
    for (var d = 1; d <= dMax; d++) {
      var rng = mulberry32(seed + d * 101);
      var pts = new Float64Array(n * d);
      for (var i = 0; i < n * d; i++) pts[i] = rng();
      var dists = [];
      var queries = Math.min(q, n);
      for (var qi = 0; qi < queries; qi++) {
        var best = Infinity;
        for (var j = 0; j < n; j++) {
          if (j === qi) continue;
          var s = 0;
          for (var c = 0; c < d; c++) {
            var diff = pts[qi * d + c] - pts[j * d + c];
            s += diff * diff;
          }
          if (s < best) best = s;
        }
        dists.push(Math.sqrt(best));
      }
      out.push({
        d: d,
        cells: Math.pow(3, d),
        meanDistance: mean(dists),
        medianDistance: quantile(dists, 0.5)
      });
    }
    return out;
  }

  var api = {
    mean: mean,
    variance: variance,
    sd: sd,
    quantile: quantile,
    clamp: clamp,
    mulberry32: mulberry32,
    buildMatrix: buildMatrix,
    design: design,
    ols: ols,
    predict: predict,
    KDTree: KDTree,
    matching: matching,
    unitMatches: unitMatches,
    severityBand: severityBand,
    bandCurve: bandCurve,
    regressionWeights: regressionWeights,
    oracleAte: oracleAte,
    curseSim: curseSim
  };

  global.MatchLabStats = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

