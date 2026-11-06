/* ============================================================
   Chapter 05 Ã¢â‚¬â€ a small OLS engine for the control dial.
   Classical (homoskedastic) standard errors, matching statsmodels.
   ============================================================ */
(function (global) {
  'use strict';

  function zeros(rows, cols) {
    var out = [];
    for (var i = 0; i < rows; i++) {
      out.push(new Array(cols).fill(0));
    }
    return out;
  }

  function invert(matrix) {
    var n = matrix.length;
    var a = matrix.map(function (row, i) {
      var copy = row.slice();
      for (var j = 0; j < n; j++) copy.push(i === j ? 1 : 0);
      return copy;
    });

    for (var col = 0; col < n; col++) {
      var pivot = col;
      for (var r = col + 1; r < n; r++) {
        if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
      }
      if (Math.abs(a[pivot][col]) < 1e-12) throw new Error('singular design matrix');
      if (pivot !== col) {
        var tmp = a[col];
        a[col] = a[pivot];
        a[pivot] = tmp;
      }
      var div = a[col][col];
      for (var c = 0; c < 2 * n; c++) a[col][c] /= div;
      for (var row = 0; row < n; row++) {
        if (row === col) continue;
        var factor = a[row][col];
        if (!factor) continue;
        for (var c2 = 0; c2 < 2 * n; c2++) a[row][c2] -= factor * a[col][c2];
      }
    }

    return a.map(function (row) { return row.slice(n); });
  }

  function ols(data, yName, xNames) {
    var n = data.n;
    var k = xNames.length + 1;
    var XtX = zeros(k, k);
    var Xty = new Array(k).fill(0);
    var y = data[yName];

    for (var i = 0; i < n; i++) {
      var row = new Array(k);
      row[0] = 1;
      for (var j = 0; j < xNames.length; j++) row[j + 1] = data[xNames[j]][i];
      for (var a = 0; a < k; a++) {
        Xty[a] += row[a] * y[i];
        for (var b = 0; b < k; b++) XtX[a][b] += row[a] * row[b];
      }
    }

    var inv = invert(XtX);
    var beta = new Array(k).fill(0);
    for (var m = 0; m < k; m++) {
      for (var p = 0; p < k; p++) beta[m] += inv[m][p] * Xty[p];
    }

    var rss = 0;
    var yMean = 0;
    for (var q = 0; q < n; q++) yMean += y[q];
    yMean /= n;
    var tss = 0;
    for (var r = 0; r < n; r++) {
      var fit = beta[0];
      for (var s = 0; s < xNames.length; s++) fit += beta[s + 1] * data[xNames[s]][r];
      var resid = y[r] - fit;
      rss += resid * resid;
      tss += (y[r] - yMean) * (y[r] - yMean);
    }

    var sigma2 = rss / (n - k);
    var idx = xNames.indexOf('educ') + 1;
    var hasEduc = idx > 0;
    var se = hasEduc ? Math.sqrt(sigma2 * inv[idx][idx]) : null;
    var coef = hasEduc ? beta[idx] : null;

    return {
      coef: coef,
      intercept: beta[0],
      coefficients: beta,
      names: ['intercept'].concat(xNames),
      se: se,
      lo: hasEduc ? coef - 1.96 * se : null,
      hi: hasEduc ? coef + 1.96 * se : null,
      r2: 1 - rss / tss,
      n: n,
      k: k
    };
  }


  function wls(data, yName, xNames, weights) {
    var n = data.n;
    var k = xNames.length + 1;
    var XtWX = zeros(k, k);
    var XtWy = new Array(k).fill(0);
    var y = data[yName];

    for (var i = 0; i < n; i++) {
      var w = weights[i];
      var row = new Array(k);
      row[0] = 1;
      for (var j = 0; j < xNames.length; j++) row[j + 1] = data[xNames[j]][i];
      for (var a = 0; a < k; a++) {
        XtWy[a] += w * row[a] * y[i];
        for (var b = 0; b < k; b++) XtWX[a][b] += w * row[a] * row[b];
      }
    }

    var inv = invert(XtWX);
    var beta = new Array(k).fill(0);
    for (var m = 0; m < k; m++) {
      for (var p = 0; p < k; p++) beta[m] += inv[m][p] * XtWy[p];
    }

    var rss = 0;
    for (var r = 0; r < n; r++) {
      var fit = beta[0];
      for (var s = 0; s < xNames.length; s++) fit += beta[s + 1] * data[xNames[s]][r];
      var resid = y[r] - fit;
      rss += weights[r] * resid * resid;
    }

    var sigma2 = rss / (n - k);
    var idx = xNames.indexOf('educ') + 1;
    if (idx <= 0) throw new Error('educ must be a regressor');
    var se = Math.sqrt(sigma2 * inv[idx][idx]);
    var coef = beta[idx];
    return {
      coef: coef,
      intercept: beta[0],
      se: se,
      lo: coef - 1.96 * se,
      hi: coef + 1.96 * se,
      n: n,
      k: k
    };
  }
  var api = { ols: ols, wls: wls, invert: invert };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Ch05OLS = api;
})(typeof window !== 'undefined' ? window : globalThis);



