/* Statistical functions used by the interactive analysis space.
   All computations run in the browser from the data in data/data.js. */
const Stats = (() => {
  // log-gamma (Lanczos)
  function lgamma(x) {
    const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
      -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
    x -= 1; let a = c[0]; const t = x + g + 0.5;
    for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  // regularized upper incomplete gamma Q(a,x)
  function gammaQ(a, x) {
    if (x <= 0) return 1;
    if (x < a + 1) { // series for P
      let sum = 1 / a, term = sum, n = a;
      for (let i = 0; i < 500; i++) { n += 1; term *= x / n; sum += term; if (Math.abs(term) < Math.abs(sum) * 1e-15) break; }
      return 1 - sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
    }
    let b = x + 1 - a, c = 1 / 1e-300, d = 1 / b, h = d; // continued fraction
    for (let i = 1; i < 500; i++) {
      const an = -i * (i - a); b += 2;
      d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-15) break;
    }
    return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
  }
  const chi2sf = (x, df) => gammaQ(df / 2, x / 2);

  function logChoose(n, k) { return lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1); }
  // exact two-sided McNemar = two-sided binomial test on discordant pairs (p = 0.5)
  function mcnemarExact(b, c) {
    const n = b + c; if (n === 0) return 1;
    const k = Math.min(b, c); let p = 0;
    for (let i = 0; i <= k; i++) p += Math.exp(logChoose(n, i) - n * Math.LN2);
    return Math.min(1, 2 * p);
  }
  // Cochran's Q for a matrix rows x k of 0/1
  function cochranQ(X) {
    const k = X[0].length, colS = Array(k).fill(0); let N = 0, R2 = 0;
    X.forEach(r => { let s = 0; r.forEach((v, j) => { colS[j] += v; s += v; }); N += s; R2 += s * s; });
    const C2 = colS.reduce((a, v) => a + v * v, 0);
    const den = k * N - R2;
    const Q = den === 0 ? 0 : (k - 1) * (k * C2 - N * N) / den;
    return { Q, df: k - 1, p: chi2sf(Q, k - 1), colS, n: X.length };
  }
  function adjust(ps, method) {
    const m = ps.length;
    if (method === 'none') return ps.slice();
    if (method === 'bonferroni') return ps.map(p => Math.min(1, p * m));
    // Holm step-down
    const idx = ps.map((p, i) => [p, i]).sort((a, b) => a[0] - b[0]);
    const out = Array(m); let run = 0;
    idx.forEach(([p, i], r) => { run = Math.max(run, Math.min(1, (m - r) * p)); out[i] = run; });
    return out;
  }
  function wilson(k, n, z = 1.959963984540054) {
    if (!n) return [0, 0];
    const p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d;
    return [Math.max(0, c - h), Math.min(1, c + h)];
  }
  const zFor = conf => ({ 0.9: 1.6448536269514722, 0.95: 1.959963984540054, 0.99: 2.5758293035489004 })[conf] || 1.96;
  function jaccard(a, b) {
    let both = 0, u = 0;
    for (let i = 0; i < a.length; i++) { if (a[i] || b[i]) u++; if (a[i] && b[i]) both++; }
    return u ? both / u : 0;
  }
  // seeded RNG (mulberry32)
  function rng(seed) { let t = seed >>> 0; return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ t >>> 15, 1 | t); r ^= r + Math.imul(r ^ r >>> 7, 61 | r); return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  // gene-cluster bootstrap of Jaccard: resample genes with replacement
  function clusterBootstrap(rows, a, b, B, seed) {
    const genes = [...new Set(rows.map(r => r.gene))];
    const byGene = {}; rows.forEach(r => (byGene[r.gene] = byGene[r.gene] || []).push(r));
    const rand = rng(seed), vals = [];
    for (let i = 0; i < B; i++) {
      let both = 0, u = 0;
      for (let j = 0; j < genes.length; j++) {
        const g = genes[Math.floor(rand() * genes.length)];
        byGene[g].forEach(r => { if (r[a] || r[b]) u++; if (r[a] && r[b]) both++; });
      }
      vals.push(u ? both / u : 0);
    }
    vals.sort((x, y) => x - y);
    return [vals[Math.floor(0.025 * (B - 1))], vals[Math.ceil(0.975 * (B - 1))]];
  }
  const fmtP = p => p < 0.0001 ? '< 0.0001' : p.toFixed(4);
  return { chi2sf, mcnemarExact, cochranQ, adjust, wilson, zFor, jaccard, clusterBootstrap, fmtP };
})();
