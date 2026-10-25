/* Male Infertility Gene Explorer — interactive front end.
   Data: data/data.js (verified project outputs). Statistics: js/stats.js */
(() => {
const D = window.DATA;
const FINAL = new Set(D.final);
const GENES = D.genes;
const byGene = Object.fromEntries(GENES.map(g => [g.gene, g]));
let LANG = 'ar';

/* ------------------------------------------------------------ text ---- */
const T = {
ar: {
  title: 'مستكشف جينات العقم الذكري', subtitle: 'المتغيرات الممرضة في جينات انعدام النطاف اللاانسدادي وأدلتها. نموذج أولي لا يُستخدم للتشخيص.', guide: 'دليل الموقع',
  lang: 'English', archive: 'السجل الأرشيفي', search: 'ابحث عن جين أو رقم ClinVar…',
  nav_karyo: 'الكروموسومات', nav_genes: 'الجينات', nav_lab: 'مختبر الاختيار', nav_stats: 'التحليل الإحصائي', nav_gallery: 'معرض الصور', nav_links: 'الروابط',
  karyo_h: 'خريطة الكروموسومات',
  genes_h: 'بطاقات الجينات',
  lab_h: 'مختبر الاختيار',
  stats_h: 'مساحة التحليل الإحصائي',
  gal_h: 'معرض الصور البنيوية',
  links_h: 'قواعد البيانات والأدوات',
  footer: 'نموذج بحثي لمشروع تخرج في المعلوماتية الحيوية، جامعة دمشق. البيانات مثبتة عند إصدار ClinVar بتاريخ 23 سبتمبر 2026، ولا تُحدَّث تلقائيًا. لا يُستخدم للتشخيص.',
  k_genes: 'جينًا مرشحًا في البداية', k_rec: 'سجلًا في ClinVar', k_plp: 'متغيرًا ممرضًا أو محتمل الإمراض', k_vep: 'بعد عتبتي CADD والتردد', k_final: 'ممثلًا نهائيًا في 16 جينًا', k_chr: 'كروموسومًا تحمل هذه الجينات',
  norep: 'بلا ممثل', illus: 'توضيحي، غير مطابق للعقم', outside: 'خارج جينات Galaxy',
  chrom: 'الكروموسوم', open: 'بطاقة الجين', site: 'صورة موقع الطفرة', journey: 'رحلة الدليل', expr: 'التعبير', links: 'الروابط',
  t_over: 'نظرة عامة', t_jour: 'رحلة الدليل', t_expr: 'التعبير الجيني', t_struct: 'البنية والصور', t_colab: 'الطريق الثاني', t_links: 'روابط',
  rep: 'الممثل في المجموعة النهائية', conseq: 'نوع الأثر', cond: 'المرض المسجل', match: 'مطابقة المرض', review: 'مستوى المراجعة', validity: 'صحة العلاقة بالمرض',
  afx: 'تردد gnomAD (الإكسومات)', afg: 'تردد gnomAD (الجينومات)', omim: 'أنماط OMIM', devin: 'التشغيل المستقل (Devin)', change: 'القرار', nmd: 'NMD',
  devin_yes: 'المتغير نفسه ودرجة CADD نفسها', devin_no: 'الجين خارج قائمة Devin',
  j1: 'سجلات ClinVar في الجين', j2: 'ممرض أو محتمل الإمراض', j3: 'بعد عتبتي CADD ≥ 20 والتردد ≤ 0.001', j4: 'مطابق للعقم الذكري', j5: 'الممثل النهائي',
  testis: 'الخصية', ratio: 'نسبة الخصية إلى أعلى نسيج آخر', tau: 'مؤشر Tau', rank: 'ترتيب الخصية بين 54 نسيجًا', hpa: 'تخصص RNA في HPA', ihc: 'الصبغ المناعي في الخصية',
  lolli: 'مخطط تقريبي للبروتين: موضع الممثل (أحمر) وأقوى متغير missense مطابق (أزرق) والمناطق المعروفة.',
  ov: 'البروتين كاملًا وموقع الطفرة', wt: 'تكبير الموقع: الحمض الأصلي', mu: 'تكبير الموقع: الحمض البديل', cmp: 'الطبيعي والطافر جنبًا إلى جنب',
  pym: 'صورة PyMOL (ملونة حسب pLDDT)', stopimg: 'متغير الإيقاف: الجزء المفقود من البروتين بالأحمر', schem: 'مخطط تسلسل TEX15 (لا نموذج في AlphaFold)',
  noimg: 'الممثل متغير إيقاف أو وصل، فلا يُنمذج بالاستبدال. يظهر موقعه على المخطط أعلاه.',
  mis_h: 'أقوى متغير missense مطابق للعقم (التوسع الثاني)', tex11note: 'الموضع 856 على نسخة MANE يقابل 871 في نموذج UniProt.',
  colab_cat: 'تصنيف Colab للمرض', spec: 'خاص بالعقم', mixed: 'مختلط', uninf: 'بلا معلومة', other: 'مرض آخر فقط', colab_rank: 'ترتيب ممثل الطريق الأول في Colab', top3: 'أفضل ثلاثة في Colab',
  strong: 'قوي', lower: 'بثقة أقل', undet: 'غير محسوم',
  cadd: 'CADD ≥', af: 'تردد gnomAD ≤', field: 'حقل التردد', rule: 'قاعدة المرض',
  rules: ['قاعدة المشروع (مطابقة المرض لكل تقييم)', 'المرض الإجمالي (كلمات مفتاحية)', 'تجاهل المرض (القاعدة الأصلية)'],
  fields: { af_exomes: 'الإكسومات', af_genomes: 'الجينومات', af_grpmax: 'أعلى مجموعة سكانية' },
  fun: ['ممرضة أو محتملة الإمراض', 'تجتاز CADD والتردد', 'تحقق قاعدة المرض'],
  same: 'مطابق للمجموعة النهائية', diff: 'مختلف', none: 'لا متغير يجتاز', reproduced: 'من الممثلين الخمسة عشر يتكررون', changed: 'جينات يتغير ممثلها',
  cols_lab: ['الجين', 'المتغير المختار', 'CADD', 'نوع الأثر', 'المقارنة'],
  st_tools: 'مقارنة الأدوات', st_boot: 'ثبات التداخل', st_scen: 'الطريقان الأول والثاني', st_rank: 'ترتيب الأدوات',
  set: 'المجموعة', toolsel: 'الأدوات', alpha: 'مستوى الدلالة', corr: 'تصحيح المقارنات', conf: 'مستوى الثقة', corrs: { holm: 'Holm', bonferroni: 'Bonferroni', none: 'بلا تصحيح' },
  pair: 'الزوج', both_: 'كلاهما', aonly: 'الأول فقط', bonly: 'الثاني فقط', praw: 'p الخام', padj: 'p المصححة', sel: 'المختار', share: 'النسبة', ci: 'فاصل الثقة',
  setnames: { H: 'H: أعلى CADD', C: 'C: مطابقة المرض', M: 'M: أقوى missense' },
  reps: 'عدد التكرارات', seed: 'البذرة', ds: 'مصدر البيانات', cls: 'تصنيف المرض', dss: { colab: 'Google Colab (734)', galaxy: 'Galaxy (480)' }, clss: { colab: 'Colab (القائمة الإجمالية)', galaxy: 'الطريق الأول (التقييم المرسل)' },
  incmix: 'اعتبار «المختلط» مطابقًا', scen_res: 'الممثل المختار', final_rep: 'ممثل الطريق الأول',
  gal_all: 'كل الجينات', gal_prog: 'البرنامج', all: 'الكل',
  a_sets: 'مجموعات الأدوات', a_ver: 'التحقق في المهمة الأولى', a_astra: 'GPT-6 Astra', a_img: 'صور توضيحية', a_colab: 'قائمة Colab المختصرة',
  tool: 'الأداة', infinal: 'في المجموعة النهائية', gene: 'الجين', item: 'البند', claim_by: 'مصدر الادعاء', status: 'الحالة', ver_by: 'جدول التحقق',
},
en: {
  title: 'Male Infertility Gene Explorer', subtitle: 'Pathogenic variants in non-obstructive azoospermia genes and their evidence. Prototype — not for diagnosis.', guide: 'Site guide',
  lang: 'العربية', archive: 'Archive', search: 'Search a gene or ClinVar ID…',
  nav_karyo: 'Chromosomes', nav_genes: 'Genes', nav_lab: 'Selection lab', nav_stats: 'Statistics', nav_gallery: 'Gallery', nav_links: 'Links',
  karyo_h: 'Chromosome map',
  genes_h: 'Gene cards',
  lab_h: 'Selection lab',
  stats_h: 'Statistical analysis space',
  gal_h: 'Structural image gallery',
  links_h: 'Databases and tools',
  footer: 'Research prototype of a bioinformatics graduation project, Damascus University. Data frozen at ClinVar release 23 Sep 2026; not updated automatically. Not for diagnosis.',
  k_genes: 'candidate genes at start', k_rec: 'ClinVar records', k_plp: 'pathogenic / likely pathogenic', k_vep: 'after CADD and frequency', k_final: 'final representatives in 16 genes', k_chr: 'chromosomes carrying these genes',
  norep: 'No representative', illus: 'Illustrative — not infertility-matched', outside: 'Outside Galaxy genes',
  chrom: 'Chromosome', open: 'Gene card', site: 'Mutation-site image', journey: 'Evidence journey', expr: 'Expression', links: 'Links',
  t_over: 'Overview', t_jour: 'Evidence journey', t_expr: 'Expression', t_struct: 'Structure & images', t_colab: 'Programmatic route', t_links: 'Links',
  rep: 'Final representative', conseq: 'Consequence', cond: 'ClinVar condition', match: 'Condition match', review: 'Review status', validity: 'Gene–disease validity',
  afx: 'gnomAD AF (exomes)', afg: 'gnomAD AF (genomes)', omim: 'OMIM phenotypes', devin: 'Independent run (Devin)', change: 'Decision', nmd: 'NMD',
  devin_yes: 'Same variant and same CADD', devin_no: 'Gene not in the Devin list',
  j1: 'ClinVar records in gene', j2: 'Pathogenic / likely pathogenic', j3: 'After CADD ≥ 20 and AF ≤ 0.001', j4: 'Infertility-matched', j5: 'Final representative',
  testis: 'Testis', ratio: 'Testis / highest other tissue', tau: 'Tau index', rank: 'Testis rank among 54 tissues', hpa: 'HPA RNA specificity', ihc: 'Testis IHC',
  lolli: 'Schematic protein: representative (red), strongest matched missense (blue) and known regions.',
  ov: 'Whole protein and mutation site', wt: 'Close-up: wild-type residue', mu: 'Close-up: mutant residue', cmp: 'Wild type vs mutant',
  pym: 'PyMOL image (coloured by pLDDT)', stopimg: 'Stop variant: lost segment in red', schem: 'TEX15 sequence map (no AlphaFold model)',
  noimg: 'The representative is a stop or splice variant and cannot be modelled by substitution. Its position is shown above.',
  mis_h: 'Strongest infertility-matched missense (Expansion 2)', tex11note: 'Position 856 on MANE corresponds to 871 in the UniProt model.',
  colab_cat: 'Colab condition class', spec: 'Infertility-specific', mixed: 'Mixed', uninf: 'Uninformative', other: 'Other disease only', colab_rank: 'Rank of the bioinformatics representative in Colab', top3: 'Colab top three',
  strong: 'Strong', lower: 'Lower confidence', undet: 'Undetermined',
  cadd: 'CADD ≥', af: 'gnomAD AF ≤', field: 'Frequency field', rule: 'Condition rule',
  rules: ['Project rule (per-submission match)', 'Aggregate condition (keywords)', 'Ignore condition (original rule)'],
  fields: { af_exomes: 'Exomes', af_genomes: 'Genomes', af_grpmax: 'Genomes grpmax' },
  fun: ['Pathogenic / likely pathogenic', 'Pass CADD and AF', 'Meet the condition rule'],
  same: 'Same as final set', diff: 'Different', none: 'No variant passes', reproduced: 'of 15 representatives reproduced', changed: 'genes change',
  cols_lab: ['Gene', 'Selected variant', 'CADD', 'Consequence', 'Comparison'],
  st_tools: 'Tool comparison', st_boot: 'Overlap stability', st_scen: 'Route 1 vs route 2', st_rank: 'Tool ranking',
  set: 'Set', toolsel: 'Tools', alpha: 'Significance level', corr: 'Multiple testing', conf: 'Confidence level', corrs: { holm: 'Holm', bonferroni: 'Bonferroni', none: 'None' },
  pair: 'Pair', both_: 'Both', aonly: 'First only', bonly: 'Second only', praw: 'raw p', padj: 'adjusted p', sel: 'Selected', share: 'Share', ci: 'CI',
  setnames: { H: 'H: highest CADD', C: 'C: condition-matched', M: 'M: strongest missense' },
  reps: 'Replicates', seed: 'Seed', ds: 'Data source', cls: 'Condition classification', dss: { colab: 'Google Colab (734)', galaxy: 'Galaxy (480)' }, clss: { colab: 'Colab (aggregate list)', galaxy: 'Route 1 (per submission)' },
  incmix: 'Count “mixed” as matched', scen_res: 'Selected variant', final_rep: 'Route 1 representative',
  gal_all: 'All genes', gal_prog: 'Program', all: 'All',
  a_sets: 'Tool sets', a_ver: 'First-mission verification', a_astra: 'GPT-6 Astra', a_img: 'Illustrative images', a_colab: 'Colab shortlist',
  tool: 'Tool', infinal: 'In final set', gene: 'Gene', item: 'Item', claim_by: 'Claim source', status: 'Status', ver_by: 'Verification table',
}};
const t = k => (T[LANG][k] !== undefined ? T[LANG][k] : k);
const ar = () => LANG === 'ar';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmt = (x, d = 2) => (x === null || x === undefined || x === '' ? '—' : Number(x).toLocaleString('en-US', { maximumFractionDigits: d }));
const pct = x => (x * 100).toFixed(1) + '%';
const L = (a, e) => (ar() ? a : e);

function applyLang() {
  document.documentElement.lang = LANG; document.documentElement.dir = ar() ? 'rtl' : 'ltr';
  document.title = t('title');
  document.querySelectorAll('[data-t]').forEach(n => { n.textContent = t(n.dataset.t); });
  $('#langBtn').textContent = t('lang'); $('#q').placeholder = t('search');
  renderAll();
}

/* ---------------------------------------------------------- tooltip --- */
const tip = $('#tip');
function showTip(e, g) {
  const lines = tipLines(g);
  tip.innerHTML = `<h4>${g.gene} <span style="font-size:13px;opacity:.8">· ${t('chrom')} ${g.chrom}</span></h4>` +
    lines.map((l, i) => `<div class="ln" style="animation-delay:${0.12 + i * 0.16}s">${l}</div>`).join('');
  tip.classList.add('on'); moveTip(e);
}
function moveTip(e) {
  const w = tip.offsetWidth, h = tip.offsetHeight;
  let x = e.clientX + 16, y = e.clientY + 16;
  if (x + w > innerWidth - 8) x = e.clientX - w - 16;
  if (y + h > innerHeight - 8) y = e.clientY - h - 16;
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
const hideTip = () => tip.classList.remove('on');
function tipLines(g) {
  const out = [];
  if (g.variant) {
    out.push(`<b>${t('rep')}:</b> <span class="ltr">ClinVar ${g.variant}</span>`);
    out.push(`<span class="ltr">${esc(g.hgvsp || g.hgvsc)}</span> · ${esc(g.consequence.split('&')[0])}`);
    out.push(`<b>CADD:</b> ${g.cadd} · <b>${t('match')}:</b> ${esc(g.match)}`);
    out.push(`<b>${t('cond')}:</b> <span class="ltr">${esc(g.condition.split('|')[0])}</span>`);
  } else out.push(`<b>${t('norep')}</b>`);
  out.push(`<b>${t('validity')}:</b> Houston ${esc(g.houston.split(' ')[0])} · Zhao ${esc(g.zhao.split(' ')[0])}`);
  out.push(`<b>${t('ratio')}:</b> ${g.expr.ratio}`);
  return out;
}
function bindTip(node, g) {
  node.addEventListener('mouseenter', e => showTip(e, g));
  node.addEventListener('mousemove', moveTip);
  node.addEventListener('mouseleave', hideTip);
}
const status = g => g.variant ? (g.devin ? 'both' : 'gal') : 'none';
const badge = g => `<span class="dot d-${status(g)}"></span>`;

/* ------------------------------------------------------------ KPIs ---- */
function renderKpis() {
  const k = [[37, t('k_genes')], ['6,157', t('k_rec')], [726, t('k_plp')], [480, t('k_vep')], [15, t('k_final')], [12, t('k_chr')]];
  $('#kpis').innerHTML = k.map(([v, l]) => `<div class="kpi"><b class="num">${v}</b><span>${l}</span></div>`).join('');
}

/* ------------------------------------------------------ karyotype ---- */
let selChrom = null;
function chromSVG(c) {
  const [len, cen] = D.chrom[c];
  const H = Math.max(40 + len / 249 * 190, 70), W = 26, y0 = 6, h = H - 12, cy = y0 + h * cen / len;
  const gs = GENES.filter(g => g.chrom === c);
  const bands = [];
  for (let i = 0; i < 9; i++) { const y = y0 + 6 + i * (h - 12) / 9; bands.push(`<rect x="${4}" y="${y.toFixed(1)}" width="${W - 8}" height="${(h / 26).toFixed(1)}" fill="#1D4E89" opacity="${0.12 + (i % 3) * 0.08}"/>`); }
  const pos = gs.map(g => ({ g, y: y0 + h * g.pos / (len * 1e6) })).sort((a, b) => a.y - b.y);
  pos.forEach((o, i) => { o.ly = o.y; if (i && o.ly - pos[i - 1].ly < 14) o.ly = pos[i - 1].ly + 14; });
  const marks = pos.map(({ g, y, ly }) => {
    const col = { both: '#3A9A66', gal: '#C8553D', none: '#C98A1B' }[status(g)];
    return `<g class="marker" data-gene="${g.gene}"><line x1="-6" x2="${W + 6}" y1="${y}" y2="${y}" stroke="${col}" stroke-width="3"/>
      ${ly !== y ? `<line x1="${W + 6}" x2="${W + 9}" y1="${y}" y2="${ly}" stroke="${col}" stroke-width="1"/>` : ''}
      <text x="${W + 10}" y="${ly + 4}" font-size="12" font-weight="600" fill="#DCE6F1" text-anchor="start" direction="ltr">${g.gene}</text></g>`;
  }).join('');
  return `<svg width="${W + 70}" height="${H}" viewBox="-8 0 ${W + 70} ${H}">
    <defs><clipPath id="cp${c}"><path d="M4,${y0 + 10} Q4,${y0} ${W / 2},${y0} Q${W - 4},${y0} ${W - 4},${y0 + 10} L${W - 4},${cy - 6} Q${W / 2},${cy + 2} ${W - 4},${cy + 6} L${W - 4},${y0 + h - 10} Q${W - 4},${y0 + h} ${W / 2},${y0 + h} Q4,${y0 + h} 4,${y0 + h - 10} L4,${cy + 6} Q${W / 2},${cy - 2} 4,${cy - 6} Z"/></clipPath>
    <linearGradient id="lg${c}" x1="0" x2="1"><stop offset="0" stop-color="#A9CBEA"/><stop offset=".5" stop-color="#EEF4FA"/><stop offset="1" stop-color="#A9CBEA"/></linearGradient></defs>
    <g clip-path="url(#cp${c})"><rect x="0" y="0" width="${W}" height="${H}" fill="url(#lg${c})"/>${bands.join('')}</g>
    <path d="M4,${y0 + 10} Q4,${y0} ${W / 2},${y0} Q${W - 4},${y0} ${W - 4},${y0 + 10} L${W - 4},${cy - 6} Q${W / 2},${cy + 2} ${W - 4},${cy + 6} L${W - 4},${y0 + h - 10} Q${W - 4},${y0 + h} ${W / 2},${y0 + h} Q4,${y0 + h} 4,${y0 + h - 10} L4,${cy + 6} Q${W / 2},${cy - 2} 4,${cy - 6} Z" fill="none" stroke="#1D4E89" stroke-width="1.5"/>
    ${marks}</svg>`;
}
function renderKaryo() {
  const order = ['1', '2', '6', '7', '8', '9', '10', '16', '17', '20', '22', 'X'];
  $('#karyoRow').innerHTML = order.map(c => `<div class="chrom ${selChrom === c ? 'sel' : ''}" data-c="${c}">${chromSVG(c)}<div class="lab">${c}</div></div>`).join('');
  document.querySelectorAll('.chrom').forEach(n => n.addEventListener('click', e => {
    if (e.target.closest('.marker')) return;
    selChrom = n.dataset.c; renderKaryo(); renderChromPanel();
  }));
  document.querySelectorAll('.marker').forEach(m => {
    const g = byGene[m.dataset.gene]; bindTip(m, g);
    m.addEventListener('click', e => { e.stopPropagation(); hideTip(); openPortal(g.gene); });
  });
}
function renderChromPanel() {
  const p = $('#chromPanel');
  if (!selChrom) { p.style.display = 'none'; return; }
  const gs = GENES.filter(g => g.chrom === selChrom);
  p.style.display = 'block';
  p.innerHTML = `<h3>${t('chrom')} ${selChrom}</h3>` + gs.map(g => `<div class="opt-row"><b class="ltr">${g.gene}</b>
      <span class="ltr" style="color:var(--muted)">${g.chrom}:${g.pos.toLocaleString('en-US')}</span>${badge(g)}
      <button data-g="${g.gene}" data-tab="over">${t('open')}</button>
      <button data-g="${g.gene}" data-tab="struct">${t('site')}</button>
      <button data-g="${g.gene}" data-tab="jour">${t('journey')}</button>
      <button data-g="${g.gene}" data-tab="expr">${t('expr')}</button>
      <button data-g="${g.gene}" data-tab="links">${t('links')}</button></div>`).join('');
  p.querySelectorAll('button').forEach(b => b.addEventListener('click', () => openPortal(b.dataset.g, b.dataset.tab)));
}

/* ------------------------------------------------------- gene grid ---- */
function renderGenes() {
  $('#geneGrid').innerHTML = GENES.map(g => `<div class="gchip s-${status(g)}" data-g="${g.gene}"><div class="nm ltr">${g.gene}</div>
    <div class="sub">${t('chrom')} ${g.chrom}</div><div class="sub ltr">${g.variant ? esc((g.hgvsp || g.consequence.split('&')[0])) : '—'}</div></div>`).join('');
  document.querySelectorAll('.gchip').forEach(n => { const g = byGene[n.dataset.g]; bindTip(n, g); n.addEventListener('click', () => { hideTip(); openPortal(g.gene); }); });
}

/* ---------------------------------------------------------- portal ---- */
let portalGene = null, portalTab = 'over';
function openPortal(gene, tab = 'over') { portalGene = gene; portalTab = tab; renderPortal(); $('#portalBack').classList.add('on'); }
function closePortal() { $('#portalBack').classList.remove('on'); }
function renderPortal() {
  const g = byGene[portalGene]; if (!g) return;
  const tabs = [['over', t('t_over')], ['jour', t('t_jour')], ['expr', t('t_expr')], ['struct', t('t_struct')], ['colab', t('t_colab')], ['links', t('t_links')]];
  $('#portal').innerHTML = `<div class="ph"><div><h3 class="ltr">${g.gene}</h3><div>${t('chrom')} ${g.chrom} · <span class="ltr">${g.chrom}:${g.pos.toLocaleString('en-US')}</span> · UniProt <span class="ltr">${g.uniprot}</span> ${badge(g)}</div></div>
    <button class="close" id="pClose">✕</button></div>
    <div class="ptabs">${tabs.map(([k, l]) => `<button data-k="${k}" class="${k === portalTab ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div class="pbody" id="pBody"></div>`;
  $('#pClose').onclick = closePortal;
  document.querySelectorAll('.ptabs button').forEach(b => b.onclick = () => { portalTab = b.dataset.k; renderPortal(); });
  const body = $('#pBody');
  ({ over: pOver, jour: pJour, expr: pExpr, struct: pStruct, colab: pColab, links: pLinks })[portalTab](g, body);
}
const fact = (k, v) => `<div class="fact"><div class="k">${k}</div><div class="v">${v}</div></div>`;
function pOver(g, b) {
  if (!g.variant) {
    b.innerHTML = `<div class="note">${L('لا يوجد بين المتغيرات الممرضة السبعة عشر في XRCC2 متغير مسجل للعقم الذكري، فبقي الجين بلا ممثل رغم أنه معتمد.', 'None of the 17 pathogenic XRCC2 variants is annotated to male infertility, so this validated gene has no representative.')}</div>
      <div class="facts">${fact(t('validity'), `Houston: ${esc(g.houston)}<br>Zhao: ${esc(g.zhao)}<br>Stallmeyer: ${esc(g.stallmeyer)}`)}${fact(t('omim'), g.omim.map(o => `<a href="https://omim.org/entry/${o[1]}" target="_blank" class="ltr">${esc(o[0])} (${o[1]})</a>`).join('<br>'))}</div>`;
    return;
  }
  b.innerHTML = `<div class="facts">
    ${fact(t('rep'), `<a class="ltr" target="_blank" href="https://www.ncbi.nlm.nih.gov/clinvar/variation/${g.variant}/">ClinVar ${g.variant}</a><br><span class="ltr">${esc(g.hgvsc)} ${esc(g.hgvsp || '')}</span>`)}
    ${fact(t('conseq'), `<span class="ltr">${esc(g.consequence.replace(/&/g, ' & '))}</span>`)}
    ${fact('CADD', g.cadd)}
    ${fact(t('afx'), `<span class="ltr">${esc(g.af_ex)}</span>`)}${fact(t('afg'), `<span class="ltr">${esc(g.af_ge)}</span>`)}
    ${fact('ClinVar', `${esc(g.clinsig)}<br><small>${esc(g.review)}</small>`)}
    ${fact(t('cond'), `<span class="ltr">${esc(g.condition.replace(/\|/g, ' | '))}</span>`)}
    ${fact(t('match'), `<span class="tag-ok">${esc(g.match)}</span>`)}
    ${g.spliceai !== null ? fact('SpliceAI', g.spliceai) : ''}${g.revel !== null ? fact('REVEL', g.revel) : ''}
    ${fact(t('nmd'), esc(g.nmd))}
    ${fact(t('validity'), `Houston: ${esc(g.houston)}<br>Zhao: ${esc(g.zhao)}<br>Stallmeyer: ${esc(g.stallmeyer)}`)}
    ${fact(t('change'), esc(g.change))}
    ${fact(t('devin'), g.devin ? `<span class="tag-ok">${t('devin_yes')}</span>` : `<span class="tag-diff">${t('devin_no')}</span>`)}
    ${fact(t('omim'), g.omim.map(o => o[1] !== 'Not found' ? `<a href="https://omim.org/entry/${o[1]}" target="_blank" class="ltr">${esc(o[0])} (${o[1]})</a>` : esc(o[0])).join('<br>'))}
  </div>${g.gene === 'NR5A1' ? `<div class="okbox">${L('صُحح ممثل NR5A1 من 3061776 إلى 958902 بعد أن أظهر التقييم المرسل تصنيفًا ممرضًا مستقلًا للعقم الذكري.', 'NR5A1 was corrected from 3061776 to 958902 after a submission-level record showed an independent pathogenic assertion for male infertility.')}</div>` : ''}`;
}
function pJour(g, b) {
  const j = g.journey, steps = [[t('j1'), j.cand], [t('j2'), j.plp], [t('j3'), j.vep], [t('j4'), j.matched], [t('j5'), j.final]];
  const mx = Math.max(...steps.map(s => s[1]), 1);
  b.innerHTML = `<div class="journey">${steps.map(([l, v]) => `<div class="jstep"><div class="jl">${l}</div><div class="jbar" data-w="${Math.max(6, 100 * Math.log10(v + 1) / Math.log10(mx + 1))}">${v}</div></div>`).join('')}</div>
    <div class="interp">${L(`من ${j.cand} سجلًا في ClinVar لجين ${g.gene}، كان ${j.plp} ممرضًا أو محتمل الإمراض، واجتاز ${j.vep} عتبتي CADD والتردد، ولم يكن مطابقًا للعقم الذكري منها إلا ${j.matched}. والممثل هو الأعلى درجة CADD بين المطابقة.`,
      `Of ${j.cand} ClinVar records in ${g.gene}, ${j.plp} were P/LP, ${j.vep} passed CADD and frequency, and only ${j.matched} were infertility-matched. The representative is the highest-CADD matched variant.`)}
      <br><small>${L('الأشرطة على مقياس لوغاريتمي.', 'Bars use a logarithmic scale.')}</small></div>`;
  requestAnimationFrame(() => setTimeout(() => b.querySelectorAll('.jbar').forEach(x => x.style.width = x.dataset.w + '%'), 30));
}
function pExpr(g, b) {
  const e = g.expr, top = e.tissues.slice(0, 14), mx = top[0][1] || 1;
  const rows = top.map(([n, v], i) => {
    const w = 100 * v / mx, isT = n === 'Testis';
    return `<div style="display:flex;align-items:center;gap:8px;margin:3px 0"><div class="ltr" style="width:230px;font-size:13px;${isT ? 'font-weight:700;color:#2E8B57' : ''}">${esc(n)}</div>
      <div style="flex:1;background:#EEF4FA;border-radius:6px"><div style="width:${w}%;height:16px;border-radius:6px;background:${isT ? '#2E8B57' : '#3E7CB1'}"></div></div><div class="num" style="width:70px">${fmt(v, 1)}</div></div>`;
  }).join('');
  b.innerHTML = `<div class="facts">${fact(t('testis') + ' TPM', e.tpm)}${fact(t('ratio'), e.ratio)}${fact(t('tau'), e.tau)}${fact(t('rank'), e.rank)}${fact(t('hpa'), esc(e.hpa_rna))}${fact(t('ihc'), esc(e.ihc))}</div>
    <h4>GTEx v8 — ${L('أعلى 14 نسيجًا (متوسط TPM)', 'top 14 tissues (median TPM)')}</h4><div class="ltr" style="direction:ltr">${rows}</div>
    <div class="interp">${e.rank === 1 ? L(`الخصية أعلى نسيج تعبيرًا لجين ${g.gene}.`, `Testis is the top tissue for ${g.gene}.`) : L(`الخصية في المرتبة ${e.rank}، وأعلى تعبير في ${e.top}.`, `Testis ranks ${e.rank}; the highest tissue is ${e.top}.`)}
     ${e.tau >= 0.9 && e.rank !== 1 ? L(' ارتفاع Tau هنا يعني تخصصًا في نسيج آخر غير الخصية.', ' The high Tau reflects specificity to another tissue.') : ''}</div>`;
}
function lolli(g) {
  const W = 900, H = 120, L0 = 30, L1 = W - 30, len = g.plen, X = p => L0 + (L1 - L0) * p / len;
  const doms = (g.domains || []).filter(d => d.e <= len).map((d, i) => `<rect x="${X(d.s)}" y="58" width="${Math.max(3, X(d.e) - X(d.s))}" height="20" rx="4" fill="${['#A9CBEA', '#3E7CB1', '#7FB3D5', '#1D4E89'][i % 4]}" opacity=".85"><title>${esc(d.t)} ${d.s}-${d.e}</title></rect>`).join('');
  const mk = (p, col, lab, up) => p ? `<line x1="${X(p)}" x2="${X(p)}" y1="${up ? 22 : 82}" y2="${up ? 58 : 102}" stroke="${col}" stroke-width="2.5"/><circle cx="${X(p)}" cy="${up ? 18 : 106}" r="7" fill="${col}"/><text x="${X(p)}" y="${up ? 8 : 120}" text-anchor="middle" font-size="12" fill="${col}">${esc(lab)}</text>` : '';
  const rep = g.vpos ? mk(g.vpos, '#B33A3A', (g.hgvsp || '').replace('p.', ''), true) : '';
  const mis = g.missense ? mk(g.missense.pos, '#1D4E89', g.missense.tag, false) : '';
  return `<svg viewBox="0 -14 ${W} ${H + 24}" style="width:100%;background:#fff;border-radius:10px;border:1px solid #D6E3F1" direction="ltr">
    <rect x="${L0}" y="62" width="${L1 - L0}" height="12" rx="6" fill="#EEF4FA" stroke="#1D4E89"/>${doms}
    <text x="${L0}" y="98" font-size="11" fill="#5B6F86">1</text><text x="${L1}" y="98" font-size="11" fill="#5B6F86" text-anchor="end">${len}</text>${rep}${mis}</svg>
    <div style="font-size:13px;color:var(--muted)">${t('lolli')}</div>`;
}
let LB = [], LBi = 0;
function lbOpen(list, i) { LB = list; LBi = i; lbShow(); $('#lightbox').classList.add('on'); }
function lbShow() { $('#lbImg').src = LB[LBi][0]; $('#lbCap').textContent = LB[LBi][1]; }
function figs(list, light) {
  return `<div class="imgs">${list.map(([src, cap], i) => `<figure class="${light ? 'light' : ''}" data-i="${i}"><img loading="lazy" src="${src}" alt="${esc(cap)}"><figcaption>${esc(cap)}</figcaption></figure>`).join('')}</div>`;
}
function bindFigs(root, list) { root.querySelectorAll('figure').forEach(f => f.onclick = () => lbOpen(list, +f.dataset.i)); }
function pStruct(g, b) {
  let html = lolli(g);
  const all = [];
  const m = g.missense;
  if (m) {
    html += `<h4>${t('mis_h')}: <span class="ltr">${m.hgvsp}</span> · ClinVar <span class="ltr">${m.id}</span> · CADD ${m.cadd}
      ${g.variant === m.id ? `<span class="tag-ok">${t('rep')}</span>` : ''}</h4>`;
    if (g.gene === 'TEX11') html += `<div class="note">${t('tex11note')}</div>`;
    const chx = m.chx || {}, labs = { overview: t('ov'), WT_closeup: t('wt'), mutant_closeup: t('mu'), compare: t('cmp') };
    const l = Object.entries(chx).map(([k, s]) => [s, `ChimeraX · ${labs[k]}`]);
    if (l.length) { html += `<div data-grp="chx">${figs(l)}</div>`; all.push(['chx', l]); }
    if (m.schematic) { const l2 = [[m.schematic, t('schem')]]; html += `<div data-grp="sch">${figs(l2, true)}</div>`; all.push(['sch', l2]); }
  }
  if (g.pymol) {
    const l3 = [[g.pymol.img, `${t('pym')} · pLDDT ${g.pymol.plddt}` + (g.pymol.model_pos ? ` · ${L('الموضع في النموذج', 'model position')} ${g.pymol.model_pos}` : '')]];
    html += `<div data-grp="pym">${figs(l3, true)}</div>`; all.push(['pym', l3]);
  }
  if (g.stop_img) { const l4 = [[g.stop_img, `ChimeraX · ${t('stopimg')} (p.Arg272Ter)`]]; html += `<div data-grp="stop">${figs(l4)}</div>`; all.push(['stop', l4]); }
  if (g.variant && !(m && m.id === g.variant) && !g.stop_img) html += `<div class="note">${t('noimg')}</div>`;
  b.innerHTML = html;
  all.forEach(([k, l]) => bindFigs(b.querySelector(`[data-grp="${k}"]`), l));
}
function pColab(g, b) {
  const c = g.colab;
  const seg = [[t('spec'), c.specific, '#1f6fb2'], [t('mixed'), c.mixed, '#6fb3e0'], [t('uninf'), c.uninf, '#c7c7c7'], [t('other'), c.other, '#e07b39']];
  const bar = `<div style="display:flex;height:28px;border-radius:8px;overflow:hidden;direction:ltr">${seg.map(([l, v, col]) => v ? `<div title="${l}: ${v}" style="flex:${v};background:${col};color:#fff;font-size:12px;display:flex;align-items:center;justify-content:center">${v}</div>` : '').join('')}</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:13px;margin-top:4px">${seg.map(([l, v, col]) => `<span><span style="display:inline-block;width:10px;height:10px;background:${col};border-radius:2px"></span> ${l} (${v})</span>`).join('')}</div>`;
  b.innerHTML = `<div class="facts">${fact(L('المتغيرات الممرضة في Colab', 'P/LP variants in Colab'), c.n)}${fact(t('strong'), c.strong)}${fact(t('lower'), c.lower)}${fact(t('undet'), c.undet)}${fact(t('colab_rank'), c.rank ?? '—')}</div>
    <h4>${t('colab_cat')}</h4>${bar}
    <h4>${t('top3')}</h4><table class="t"><tr><th>#</th><th>ClinVar</th><th>HGVS</th><th>${t('status')}</th><th>CADD</th></tr>
    ${c.top3.map((r, i) => `<tr><td>${i + 1}</td><td class="ltr">${r.Variation_ID}${FINAL.has(r.Variation_ID) ? ' <span class="tag-ok">✔</span>' : ''}</td><td class="ltr">${esc(r.HGVSp && r.HGVSp !== 'Not available' ? r.HGVSp.split(':')[1] : r.HGVSc.split(':')[1])}</td><td>${esc(r.Final_status.replace('Candidate: ', ''))}</td><td>${r.CADD_PHRED === '' ? '—' : r.CADD_PHRED}</td></tr>`).join('')}</table>`;
}
function pLinks(g, b) {
  const L1 = [
    g.variant ? ['ClinVar ' + g.variant, `https://www.ncbi.nlm.nih.gov/clinvar/variation/${g.variant}/`] : null,
    ['gnomAD', `https://gnomad.broadinstitute.org/gene/${g.gene}?dataset=gnomad_r4`],
    ['GTEx', `https://gtexportal.org/home/gene/${g.gene}`], ['Human Protein Atlas', `https://www.proteinatlas.org/search/${g.gene}`],
    ['UniProt ' + g.uniprot, `https://www.uniprot.org/uniprotkb/${g.uniprot}/entry`], ['AlphaFold DB', `https://alphafold.ebi.ac.uk/entry/${g.uniprot}`],
    ['Ensembl', `https://www.ensembl.org/Homo_sapiens/Gene/Summary?g=${g.gene}`], ...g.omim.filter(o => o[1] !== 'Not found').map(o => ['OMIM ' + o[1], `https://omim.org/entry/${o[1]}`])].filter(Boolean);
  b.innerHTML = `<div class="lgroup">${L1.map(([n, u]) => `<a class="ltr" target="_blank" href="${u}">${esc(n)} ↗</a>`).join('')}</div>`;
}

/* ---------------------------------------------------- selection lab --- */
function funnelSVG(counts, labels) {
  const W = 660, bh = 50, gap = 24, top = 8, H = top * 2 + counts.length * bh + (counts.length - 1) * gap;
  const lab = 190, [P0, P1] = ar() ? [10, W - lab - 10] : [lab + 10, W - 10], cx = (P0 + P1) / 2, maxW = P1 - P0, mx = counts[0] || 1;
  const cols = ['#0B2545', '#1D4E89', '#3E7CB1'];
  const geo = counts.map((n, i) => { const w = Math.max(3, maxW * n / mx); return { n, w, x: cx - w / 2, y: top + i * (bh + gap) }; });
  let s = `<svg viewBox="0 0 ${W} ${H}" style="width:100%" direction="ltr">`;
  geo.forEach((g, i) => {
    if (i) { const p = geo[i - 1]; s += `<polygon points="${p.x},${p.y + bh} ${p.x + p.w},${p.y + bh} ${g.x + g.w},${g.y} ${g.x},${g.y}" fill="#A9CBEA" fill-opacity=".13"/>`; }
    s += `<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${bh}" fill="${cols[i % 3]}" stroke="#A9CBEA" stroke-opacity=".55"/>`;
    const txt = `${g.n} · ${(100 * g.n / mx).toFixed(0)}%`;
    s += g.w > 120 ? `<text x="${cx}" y="${g.y + bh / 2 + 5}" text-anchor="middle" font-size="15" font-weight="700" fill="#fff">${txt}</text>`
      : `<text x="${g.x + g.w + 8}" y="${g.y + bh / 2 + 5}" text-anchor="start" font-size="15" font-weight="700" fill="#fff">${txt}</text>`;
    s += ar() ? `<text x="${W - 4}" y="${g.y + bh / 2 + 5}" direction="rtl" text-anchor="start" font-size="14">${labels[i]}</text>`
      : `<text x="4" y="${g.y + bh / 2 + 5}" text-anchor="start" font-size="14">${labels[i]}</text>`;
  });
  return s + '</svg>';
}
const LABS = { cadd: 20, af: 0.001, field: 'af_exomes', rule: 0 };
function renderLab() {
  const c = $('#labCtl');
  c.innerHTML = `<label>${t('cadd')} <b id="cv">${LABS.cadd}</b><input type="range" min="10" max="35" step="1" value="${LABS.cadd}" id="lc"></label>
    <label>${t('af')}<select id="la">${[0.0001, 0.001, 0.01, 0.05].map(v => `<option ${v === LABS.af ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <label>${t('field')}<select id="lf">${Object.entries(t('fields')).map(([k, v]) => `<option value="${k}" ${k === LABS.field ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <label>${t('rule')}<select id="lr">${t('rules').map((r, i) => `<option value="${i}" ${i === LABS.rule ? 'selected' : ''}>${r}</option>`).join('')}</select></label>`;
  $('#lc').oninput = e => { LABS.cadd = +e.target.value; $('#cv').textContent = LABS.cadd; runLab(); };
  $('#la').onchange = e => { LABS.af = +e.target.value; runLab(); };
  $('#lf').onchange = e => { LABS.field = e.target.value; runLab(); };
  $('#lr').onchange = e => { LABS.rule = +e.target.value; runLab(); };
  runLab();
}
function runLab() {
  const v = D.v726.filter(r => r.validated === 'Yes');
  const passed = v.filter(r => r.cadd !== null && r.cadd >= LABS.cadd && (r[LABS.field] === null || r[LABS.field] <= LABS.af));
  const matched = LABS.rule === 0 ? passed.filter(r => r.match_status === 'Infertility-matched') : LABS.rule === 1 ? passed.filter(r => r.male_infertility_keyword === 'Yes') : passed;
  const best = {};
  matched.forEach(r => { if (!best[r.gene] || r.cadd > best[r.gene].cadd) best[r.gene] = r; });
  const counts = [v.length, passed.length, matched.length], mx = counts[0];
  $('#labFunnel').innerHTML = funnelSVG(counts, t('fun'));
  let same = 0, changed = 0;
  const rows = GENES.map(g => {
    const r = best[g.gene];
    const fin = g.variant;
    let tag;
    if (!r) { tag = fin ? `<span class="tag-diff">${t('none')}</span>` : `<span class="tag-ok">${t('same')}</span>`; if (fin) changed++; }
    else if (r.clinvar_id === fin) { same++; tag = `<span class="tag-ok">${t('same')}</span>`; }
    else { changed++; tag = `<span class="tag-diff">${t('diff')}</span>`; }
    return `<tr><td class="ltr">${g.gene}</td><td class="ltr">${r ? r.clinvar_id : '—'}</td><td>${r ? r.cadd : '—'}</td><td class="ltr">${r ? esc(String(r.consequence).split('&')[0]) : '—'}</td><td>${tag}</td></tr>`;
  });
  $('#labKpi').innerHTML = `<div class="kpis"><div class="kpi"><b>${same}</b><span>${t('reproduced')}</span></div><div class="kpi"><b>${changed}</b><span>${t('changed')}</span></div></div>`;
  $('#labTable').innerHTML = `<table class="t"><tr>${t('cols_lab').map(c => `<th>${c}</th>`).join('')}</tr>${rows.join('')}</table>`;
  $('#labInterp').innerHTML = LABS.rule === 2
    ? L(`بتجاهل المرض، يتكرر ${same} ممثلًا فقط من 15: يعود الاختيار إلى متغيرات مسجلة لأمراض أخرى، وهذا ما صححته قاعدة المشروع.`, `Ignoring the condition reproduces only ${same} of 15: selection drifts to variants registered for other diseases.`)
    : L(`بهذه المعايير يتكرر ${same} من 15 ممثلًا. تغيّر عتبة CADD بين 15 و25 لا يغير المجموعة النهائية تقريبًا، أما تغيير قاعدة المرض فيغيرها بوضوح: المرض هو العامل الحاسم لا العتبة.`, `${same} of 15 representatives are reproduced. CADD between 15 and 25 barely changes the set; changing the condition rule does — the condition is decisive, not the threshold.`);
}

/* ------------------------------------------------------- statistics ---- */
const TOOLS = ['ChatGPT Plus', 'Claude', 'Devin', 'OpenCode'];
const SS = { tab: 'tools', set: 'M', tools: new Set(TOOLS), alpha: 0.05, corr: 'holm', conf: 0.95, pair: 'Claude|Devin', B: 3000, seed: 20261012, bset: 'H',
  ds: 'colab', cls: 'galaxy', cadd: 20, af: 0.001, mix: false };
function renderStats() {
  const tabs = [['tools', t('st_tools')], ['boot', t('st_boot')], ['scen', t('st_scen')], ['rank', t('st_rank')]];
  $('#statTabs').innerHTML = tabs.map(([k, l]) => `<button data-k="${k}" class="${SS.tab === k ? 'on' : ''}">${l}</button>`).join('');
  document.querySelectorAll('#statTabs button').forEach(b => b.onclick = () => { SS.tab = b.dataset.k; renderStats(); });
  ({ tools: stTools, boot: stBoot, scen: stScen, rank: stRank })[SS.tab]($('#statBody'));
}
function setSel(id, cur) { return `<select id="${id}">${['H', 'C', 'M'].map(s => `<option value="${s}" ${s === cur ? 'selected' : ''}>${t('setnames')[s]}</option>`).join('')}</select>`; }
function heat(names, M) {
  const n = names.length, c = 92, W = 120 + n * c;
  let s = `<svg viewBox="0 0 ${W} ${60 + n * c}" style="width:100%;max-width:${W}px" direction="ltr">`;
  names.forEach((a, i) => {
    s += `<text x="${112}" y="${60 + i * c + c / 2 + 4}" text-anchor="end" font-size="13">${a}</text><text x="${120 + i * c + c / 2}" y="${48}" text-anchor="middle" font-size="13">${a}</text>`;
    names.forEach((b, j) => {
      const v = M[i][j], col = `rgba(62,124,177,${0.12 + 0.88 * v})`;
      s += `<rect x="${120 + j * c}" y="${60 + i * c}" width="${c - 4}" height="${c - 4}" rx="8" fill="${col}"/><text x="${120 + j * c + c / 2 - 2}" y="${60 + i * c + c / 2 + 4}" text-anchor="middle" font-size="15" fill="#fff">${v.toFixed(3)}</text>`;
    });
  });
  return s + '</svg>';
}
function stTools(b) {
  b.innerHTML = `<div class="controls">
    <label>${t('set')}${setSel('sSet', SS.set)}</label>
    <label>${t('toolsel')}<div class="chk">${TOOLS.map(x => `<label><input type="checkbox" value="${x}" ${SS.tools.has(x) ? 'checked' : ''}>${x}</label>`).join('')}</div></label>
    <label>${t('alpha')}<select id="sA">${[0.01, 0.05, 0.1].map(v => `<option ${v === SS.alpha ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <label>${t('corr')}<select id="sC">${Object.entries(t('corrs')).map(([k, v]) => `<option value="${k}" ${k === SS.corr ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <label>${t('conf')}<select id="sF">${[0.9, 0.95, 0.99].map(v => `<option ${v === SS.conf ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div><div id="sOut"></div>`;
  $('#sSet').onchange = e => { SS.set = e.target.value; runTools(); };
  b.querySelectorAll('.chk input').forEach(i => i.onchange = () => { i.checked ? SS.tools.add(i.value) : SS.tools.delete(i.value); runTools(); });
  $('#sA').onchange = e => { SS.alpha = +e.target.value; runTools(); };
  $('#sC').onchange = e => { SS.corr = e.target.value; runTools(); };
  $('#sF').onchange = e => { SS.conf = +e.target.value; runTools(); };
  runTools();
}
function runTools() {
  const tools = TOOLS.filter(x => SS.tools.has(x)), out = $('#sOut');
  if (tools.length < 2) { out.innerHTML = `<div class="note">${L('تلزم أداتان على الأقل.', 'At least two tools are needed.')}</div>`; return; }
  const rows = D.paired.filter(r => r.set === SS.set).filter(r => tools.some(x => r[x]));
  const X = rows.map(r => tools.map(x => r[x]));
  const n = rows.length, z = Stats.zFor(SS.conf);
  // selection shares with Wilson
  const shares = tools.map((x, j) => { const k = X.reduce((a, r) => a + r[j], 0); return [x, k, Stats.wilson(k, n, z)]; });
  const shareSvg = `<svg viewBox="0 0 520 ${40 + tools.length * 46}" style="width:100%" direction="ltr">${shares.map(([x, k, [lo, hi]], i) => {
    const y = 30 + i * 46, X0 = 130, Wd = 360;
    return `<text x="122" y="${y + 5}" text-anchor="end" font-size="13">${x}</text><rect x="${X0}" y="${y - 10}" width="${Wd * k / n}" height="20" rx="5" fill="#3E7CB1" opacity=".9"/>
      <line x1="${X0 + Wd * lo}" x2="${X0 + Wd * hi}" y1="${y}" y2="${y}" stroke="#E9F1F9" stroke-width="2"/><line x1="${X0 + Wd * lo}" x2="${X0 + Wd * lo}" y1="${y - 7}" y2="${y + 7}" stroke="#E9F1F9" stroke-width="2"/><line x1="${X0 + Wd * hi}" x2="${X0 + Wd * hi}" y1="${y - 7}" y2="${y + 7}" stroke="#E9F1F9" stroke-width="2"/>
      <text x="${X0 + Wd * hi + 6}" y="${y + 5}" font-size="12">${k}/${n}</text>`; }).join('')}
      <line x1="130" x2="490" y1="${20 + tools.length * 46}" y2="${20 + tools.length * 46}" stroke="#999"/><text x="130" y="${36 + tools.length * 46}" font-size="11">0%</text><text x="490" y="${36 + tools.length * 46}" font-size="11" text-anchor="end">100%</text></svg>`;
  let omni = '';
  if (tools.length >= 3) {
    const q = Stats.cochranQ(X);
    omni = `<div class="kpi"><b>Q = ${q.Q.toFixed(3)}</b><span>Cochran's Q · df = ${q.df} · p = ${Stats.fmtP(q.p)} · n = ${n}</span></div>
      <div class="interp">${q.p < SS.alpha ? L(`الاختبار الكلي دال عند ${SS.alpha}: نسب الاختيار غير متساوية بين هذه الأدوات في المجموعة ${SS.set}. هذا لا يحدد أي أداة تختلف، ولا يعني أن إحداها أدق.`, `Significant at ${SS.alpha}: selection shares differ among these tools in set ${SS.set}. It does not identify which tool differs, nor that one is more accurate.`)
        : L(`الاختبار الكلي غير دال عند ${SS.alpha}: لا دليل كافيًا على اختلاف نسب الاختيار في المجموعة ${SS.set}.`, `Not significant at ${SS.alpha}: no sufficient evidence that selection shares differ in set ${SS.set}.`)}</div>`;
  }
  const pairs = [];
  for (let i = 0; i < tools.length; i++) for (let j = i + 1; j < tools.length; j++) {
    let both = 0, a = 0, c = 0; X.forEach(r => { if (r[i] && r[j]) both++; else if (r[i]) a++; else if (r[j]) c++; });
    pairs.push({ A: tools[i], B: tools[j], both, a, c, p: Stats.mcnemarExact(a, c), J: (both + a + c) ? both / (both + a + c) : 0 });
  }
  const adj = Stats.adjust(pairs.map(p => p.p), SS.corr); pairs.forEach((p, i) => p.pa = adj[i]);
  const sig = pairs.filter(p => p.pa < SS.alpha);
  const M = tools.map((x, i) => tools.map((y, j) => i === j ? 1 : pairs.find(p => (p.A === x && p.B === y) || (p.A === y && p.B === x)).J));
  out.innerHTML = `<div class="two"><div><h4>${t('share')} (${L('فاصل Wilson', 'Wilson interval')} ${SS.conf * 100}%)</h4>${shareSvg}</div><div>${omni || `<div class="note">${L("يحتاج Cochran's Q إلى ثلاث أدوات على الأقل.", "Cochran's Q needs at least three tools.")}</div>`}</div></div>
    <h4>McNemar ${L('الدقيق', 'exact')} · ${t('corrs')[SS.corr]}</h4>
    <table class="t"><tr><th>${t('pair')}</th><th>${t('both_')}</th><th>${t('aonly')}</th><th>${t('bonly')}</th><th>${t('praw')}</th><th>${t('padj')}</th><th>Jaccard</th></tr>
    ${pairs.map(p => `<tr><td class="ltr">${p.A} – ${p.B}</td><td>${p.both}</td><td>${p.a}</td><td>${p.c}</td><td>${Stats.fmtP(p.p)}</td><td>${p.pa < SS.alpha ? `<span class="tag-bad">${Stats.fmtP(p.pa)}</span>` : Stats.fmtP(p.pa)}</td><td>${p.J.toFixed(3)}</td></tr>`).join('')}</table>
    <div class="interp">${L(`من ${pairs.length} مقارنة زوجية، ${pairs.filter(p => p.p < SS.alpha).length} دالة قبل التصحيح و${sig.length} بعده.`, `Of ${pairs.length} pairwise comparisons, ${pairs.filter(p => p.p < SS.alpha).length} are significant before correction and ${sig.length} after.`)}
     ${sig.length === 0 && pairs.some(p => p.p < SS.alpha) ? L(' الفروق الخام لم تصمد بعد ضبط تعدد المقارنات، فلا يمكن الجزم بأن زوجًا بعينه مختلف.', ' Raw differences do not survive multiplicity control.') : ''}</div>
    <h4>Jaccard</h4>${heat(tools, M)}
    <div class="interp">${L('Jaccard يقيس التداخل بين قائمتين لا صحتهما: أداتان تشتركان في مصدر واحد قد تتفقان على الخطأ نفسه.', 'Jaccard measures overlap, not correctness: two tools sharing a source can agree on the same error.')}</div>`;
}
function stBoot(b) {
  const opts = []; for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) opts.push(TOOLS[i] + '|' + TOOLS[j]);
  b.innerHTML = `<div class="controls"><label>${t('set')}${setSel('bSet', SS.bset)}</label>
    <label>${t('pair')}<select id="bP">${opts.map(o => `<option value="${o}" ${o === SS.pair ? 'selected' : ''}>${o.replace('|', ' – ')}</option>`).join('')}</select></label>
    <label>${t('reps')}<select id="bB">${[500, 1000, 3000, 5000].map(v => `<option ${v === SS.B ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <label>${t('seed')}<input type="number" id="bS" value="${SS.seed}"></label></div><div id="bOut"></div>`;
  $('#bSet').onchange = e => { SS.bset = e.target.value; runBoot(); };
  $('#bP').onchange = e => { SS.pair = e.target.value; runBoot(); };
  $('#bB').onchange = e => { SS.B = +e.target.value; runBoot(); };
  $('#bS').onchange = e => { SS.seed = +e.target.value; runBoot(); };
  runBoot();
}
function runBoot() {
  const [a, c] = SS.pair.split('|');
  const rows = D.paired.filter(r => r.set === SS.bset && (r[a] || r[c]));
  const J = Stats.jaccard(rows.map(r => r[a]), rows.map(r => r[c]));
  const [lo, hi] = Stats.clusterBootstrap(rows.map(r => ({ ...r, gene: r.gene || r.id })), a, c, SS.B, SS.seed);
  const X = v => 40 + 520 * v;
  $('#bOut').innerHTML = `<div class="kpis"><div class="kpi"><b>${J.toFixed(3)}</b><span>Jaccard · ${a} – ${c} · ${SS.bset}</span></div><div class="kpi"><b class="ltr">${lo.toFixed(3)} – ${hi.toFixed(3)}</b><span>${L('فاصل Bootstrap العنقودي 95%', 'Gene-cluster bootstrap 95%')}</span></div></div>
    <svg viewBox="0 0 600 70" style="width:100%" direction="ltr"><line x1="40" x2="560" y1="40" y2="40" stroke="#ccc"/>
    <rect x="${X(lo)}" y="30" width="${X(hi) - X(lo)}" height="20" rx="3" fill="#3E7CB1"/><circle cx="${X(J)}" cy="40" r="8" fill="#fff" stroke="#1D4E89" stroke-width="3"/>
    ${[0, .25, .5, .75, 1].map(v => `<text x="${X(v)}" y="66" font-size="11" text-anchor="middle">${v}</text>`).join('')}</svg>
    <div class="interp">${L(`يُعاد سحب الجينات مع الإرجاع ${SS.B} مرة، فيبقى كل جين بمتغيراته معًا. ${hi - lo > 0.4 ? 'الفاصل واسع: التداخل يعتمد كثيرًا على جينات بعينها، لأن العينة صغيرة.' : 'الفاصل ضيق نسبيًا: التداخل ثابت عند تغير تركيب الجينات.'} وتغيير البذرة لا يحرك الحدود إلا قليلًا.`,
      `Genes are resampled with replacement ${SS.B} times, keeping each gene's variants together. ${hi - lo > 0.4 ? 'The interval is wide: overlap depends on particular genes because the sample is small.' : 'The interval is fairly narrow.'} Changing the seed moves the bounds only slightly.`)}</div>`;
}
function stScen(b) {
  b.innerHTML = `<div class="controls">
    <label>${t('ds')}<select id="cD">${Object.entries(t('dss')).map(([k, v]) => `<option value="${k}" ${k === SS.ds ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <label>${t('cls')}<select id="cC">${Object.entries(t('clss')).map(([k, v]) => `<option value="${k}" ${k === SS.cls ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <label>${t('cadd')} <b id="cdv">${SS.cadd}</b><input type="range" min="10" max="35" value="${SS.cadd}" id="cX"></label>
    <label>${t('af')}<select id="cA">${[0.0001, 0.001, 0.01].map(v => `<option ${v === SS.af ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <div class="chk"><label><input type="checkbox" id="cM" ${SS.mix ? 'checked' : ''}>${t('incmix')}</label></div></div><div id="cOut"></div>`;
  $('#cD').onchange = e => { SS.ds = e.target.value; runScen(); };
  $('#cC').onchange = e => { SS.cls = e.target.value; runScen(); };
  $('#cX').oninput = e => { SS.cadd = +e.target.value; $('#cdv').textContent = SS.cadd; runScen(); };
  $('#cA').onchange = e => { SS.af = +e.target.value; runScen(); };
  $('#cM').onchange = e => { SS.mix = e.target.checked; runScen(); };
  runScen();
}
function runScen() {
  const src = SS.ds === 'colab' ? D.colab : D.galvep;
  const clsOf = r => SS.cls === 'colab' ? r.ph : (SS.ds === 'colab' ? r.gal : r.gs);
  const ok = r => { const c = clsOf(r); return c === 'S' || (SS.mix && c === 'M'); };
  const best = {};
  src.forEach(r => {
    if (r.c === null || r.c < SS.cadd) return; if (r.af !== null && r.af > SS.af) return; if (!ok(r)) return;
    const b0 = best[r.g]; if (!b0 || r.c > b0.c || (r.c === b0.c && (r.st || 0) > (b0.st || 0))) best[r.g] = r;
  });
  let same = 0;
  const rows = GENES.filter(g => g.variant).map(g => {
    const r = best[g.gene], s = r && r.id === g.variant; if (s) same++;
    return `<tr><td class="ltr">${g.gene}</td><td class="ltr">${g.variant}</td><td class="ltr">${r ? r.id : '—'}</td><td>${r ? r.c : '—'}</td><td>${s ? `<span class="tag-ok">${t('same')}</span>` : `<span class="tag-diff">${r ? t('diff') : t('none')}</span>`}</td></tr>`;
  });
  const name = { 'colab|colab': 'A', 'colab|galaxy': 'B', 'galaxy|colab': 'C', 'galaxy|galaxy': L('الأصل', 'original') }[SS.ds + '|' + SS.cls];
  $('#cOut').innerHTML = `<div class="kpis"><div class="kpi"><b>${same} / 15</b><span>${L('سيناريو', 'Scenario')} ${name}: ${t('reproduced')}</span></div></div>
    <div class="scroll"><table class="t"><tr><th>${t('gene')}</th><th>${t('final_rep')}</th><th>${t('scen_res')}</th><th>CADD</th><th></th></tr>${rows.join('')}</table></div>
    <div class="interp">${L('حين يثبت تصنيف المرض وتتغير البيانات (Colab أو Galaxy)، لا يتغير الممثل تقريبًا، لأن درجات CADD والترددات متطابقة في الطريقين. وحين يتغير تصنيف المرض، يتغير الممثل في MEIOB وNR5A1 وMEI1: مستوى مطابقة المرض هو مصدر الاختلاف الوحيد.', 'With the condition classification fixed and the data source changed, the representative barely changes because CADD and frequencies are identical in both routes. Changing the classification changes MEIOB, NR5A1 and MEI1: the matching level is the only source of difference.')}</div>`;
}
function stRank(b) {
  const R = [
    [1, 'Devin', L('13 من 13 في الجينات المشتركة', '13 of 13 in shared genes'), '0.684', L('لا خطأ موثق، وكشف خطأ NR5A1', 'none; uncovered the NR5A1 error')],
    [2, L('الطريق الأول (Galaxy) قبل التصحيح', 'Route 1 (Galaxy) before correction'), '14 / 15', '—', L('ممثل NR5A1، وصُحح', 'NR5A1 representative, corrected')],
    [3, 'Claude', '12 / 15', '0.571', L('ثلاث نسخ لمجموعة M', 'three versions of set M')],
    [4, 'Google Colab', L('11 / 15 في أول ثلاثة', '11 / 15 in top three'), '—', L('المطابقة الإجمالية تغير الممثل في 3 جينات', 'aggregate matching changes 3 genes')],
    [5, 'OpenCode', '9 / 15', '0.346', '—'],
    [6, 'Gemini', '8 / 15', '0.471', L('متغيران لأمراض أخرى في C، وقيم تعبير مخالفة', 'two other-disease variants in C; contradicted expression values')],
    [7, 'ChatGPT Plus', '5 / 15', '0.250', L('أدنى نسب اختيار', 'lowest selection shares')],
    ['—', 'GPT-6 Astra', L('غير قابل للترتيب', 'not rankable'), '—', L('مهمة تحقق من مجموعة ثابتة', 'fixed-set verification task')]];
  b.innerHTML = `<p>${L('المعيار: الاتفاق مع المجموعة النهائية المحققة (15 ممثلًا) في المجموعة C، مع خصم الأخطاء الموثقة. لا يثبت هذا الترتيب تفوقًا إحصائيًا، لأن أي فرق زوجي لم يبقَ دالًا بعد تصحيح Holm.', 'Criterion: agreement with the verified final set (15 representatives) in set C, penalised for documented errors. Not statistical superiority: no pairwise difference survives Holm.')}</p>
    <table class="t"><tr><th>#</th><th>${t('tool')}</th><th>${L('ممثلو المجموعة النهائية', 'Final representatives')}</th><th>Jaccard</th><th>${L('الأخطاء الموثقة', 'Documented errors')}</th></tr>
    ${R.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join('')}</table>
    <div class="interp">${L('كان الطريق الأول أدق المسارات تقريبًا: أصاب في 14 من 15 ممثلًا (93.3%) قبل أي تصحيح، وتطابقت قيمه مع الطريق الثاني تمامًا (469 من 469 درجة CADD). ولم يتفوق عليه إلا Devin، الذي اتفق معه في الجينات الثلاثة عشر المشتركة كلها، وكان على حق في الاختلاف الوحيد بينهما (NR5A1)، لأنه قرأ ملف التقييمات المرسلة في ClinVar مباشرة، ولأنه نظام وكيل مركب لا نموذج لغوي منفرد.',
      'Route 1 was nearly the most accurate: 14 of 15 representatives (93.3%) before any correction, with values identical to route 2 (469 of 469 CADD scores). Only Devin surpassed it, agreeing on all 13 shared genes and being right in the single disagreement (NR5A1), because it read ClinVar submission records directly and is a compound agent system rather than a single language model.')}</div>`;
}

/* ---------------------------------------------------------- gallery ---- */
const GS = { gene: 'all', prog: 'all' };
function galleryItems() {
  const items = [], labs = { overview: 'ov', WT_closeup: 'wt', mutant_closeup: 'mu', compare: 'cmp' };
  GENES.forEach(g => {
    if (g.missense) {
      Object.entries(g.missense.chx || {}).forEach(([k, s]) => items.push({ gene: g.gene, prog: 'ChimeraX', src: s, cap: `${g.gene} ${g.missense.tag} · ${t(labs[k])}`, light: false }));
      if (g.missense.schematic) items.push({ gene: g.gene, prog: 'ChimeraX', src: g.missense.schematic, cap: `${g.gene} ${g.missense.tag} · ${t('schem')}`, light: true });
    }
    if (g.stop_img) items.push({ gene: g.gene, prog: 'ChimeraX', src: g.stop_img, cap: `${g.gene} R272X · ${t('stopimg')}`, light: false });
    if (g.pymol) items.push({ gene: g.gene, prog: 'PyMOL', src: g.pymol.img, cap: `${g.gene} · PyMOL · pLDDT ${g.pymol.plddt}`, light: true });
  });
  return items;
}
function renderGallery() {
  const items = galleryItems(), genes = [...new Set(items.map(i => i.gene))];
  $('#galCtl').innerHTML = `<label>${t('gene')}<select id="gG"><option value="all">${t('gal_all')}</option>${genes.map(g => `<option ${g === GS.gene ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
    <label>${t('gal_prog')}<select id="gP">${['all', 'ChimeraX', 'PyMOL'].map(p => `<option value="${p}" ${p === GS.prog ? 'selected' : ''}>${p === 'all' ? t('all') : p}</option>`).join('')}</select></label>
    <span style="color:var(--muted)">${items.length} ${L('صورة', 'images')}</span>`;
  $('#gG').onchange = e => { GS.gene = e.target.value; renderGallery(); };
  $('#gP').onchange = e => { GS.prog = e.target.value; renderGallery(); };
  const list = items.filter(i => (GS.gene === 'all' || i.gene === GS.gene) && (GS.prog === 'all' || i.prog === GS.prog));
  $('#galGrid').innerHTML = list.map((i, k) => `<figure class="${i.light ? 'light' : ''}" data-i="${k}"><img loading="lazy" src="${i.src}" alt="${esc(i.cap)}"><figcaption>${esc(i.cap)}</figcaption></figure>`).join('');
  bindFigs($('#galGrid'), list.map(i => [i.src, i.cap]));
}

/* ------------------------------------------------------------ links ---- */
function renderLinks() {
  const G = [
    [L('المتغيرات وتصنيفها', 'Variants and classification'), [['ClinVar', 'https://www.ncbi.nlm.nih.gov/clinvar/'], [L('ملفات ClinVar (FTP)', 'ClinVar files (FTP)'), 'https://ftp.ncbi.nlm.nih.gov/pub/clinvar/'], ['gnomAD', 'https://gnomad.broadinstitute.org/'], ['1000 Genomes (IGSR)', 'https://www.internationalgenome.org/'], ['MFGA', 'https://mfga.uni-muenster.de/']]],
    [L('التعليق والمتنبئات', 'Annotation and predictors'), [['Ensembl VEP', 'https://www.ensembl.org/Tools/VEP'], ['Ensembl REST API', 'https://rest.ensembl.org/'], ['CADD', 'https://cadd.gs.washington.edu/'], ['SpliceAI Lookup', 'https://spliceailookup.broadinstitute.org/'], ['OMIM', 'https://omim.org/']]],
    [L('التعبير والبنية', 'Expression and structure'), [['GTEx Portal', 'https://gtexportal.org/'], ['Human Protein Atlas', 'https://www.proteinatlas.org/'], ['UniProt', 'https://www.uniprot.org/'], ['AlphaFold DB', 'https://alphafold.ebi.ac.uk/'], ['UCSF ChimeraX', 'https://www.cgl.ucsf.edu/chimerax/'], ['PyMOL', 'https://pymol.org/']]],
    [L('الطريق الأول: Galaxy', 'Route 1: Galaxy'), [['Galaxy (usegalaxy.org)', 'https://usegalaxy.org/'], [L('دليل SnpSift Filter', 'SnpSift Filter manual'), 'https://pcingola.github.io/SnpEff/snpsift/filter/'], ['Galaxy Training Network', 'https://training.galaxyproject.org/']]],
    [L('الطريق الثاني: Google Colab', 'Route 2: Google Colab'), [['Google Colab', 'https://colab.research.google.com/'], [L('تنزيل دفتر Colab الكامل (ipynb)', 'Download the full Colab notebook (ipynb)'), 'files/Colab_notebook_full_run.ipynb']]],
    [L('مراجعات صحة الجينات', 'Gene-validity reviews'), [['Houston et al. (2022)', 'https://doi.org/10.1093/humupd/dmab030'], ['Zhao et al. (2025)', 'https://doi.org/10.3389/fendo.2025.1643543'], ['Stallmeyer et al. (2025)', 'https://doi.org/10.1111/andr.13728']]]];
  $('#linkGrid').innerHTML = G.map(([h, ls]) => `<div class="lgroup"><h4>${h}</h4>${ls.map(([n, u]) => `<a target="_blank" href="${u}">${esc(n)} ↗</a>`).join('')}</div>`).join('');
}

/* ---------------------------------------------------------- archive ---- */
const AS = { tab: 'sets', tool: 'ChatGPT Plus', set: 'C', vt: 'OpenCode' };
function renderArchive() {
  const tabs = [['sets', t('a_sets')], ['colab', t('a_colab')], ['ver', t('a_ver')], ['astra', t('a_astra')], ['img', t('a_img')]];
  const body = $('#drawerBody');
  body.innerHTML = `<div class="stabs">${tabs.map(([k, l]) => `<button data-k="${k}" class="${AS.tab === k ? 'on' : ''}">${l}</button>`).join('')}</div><div id="aOut"></div>`;
  body.querySelectorAll('.stabs button').forEach(b => b.onclick = () => { AS.tab = b.dataset.k; renderArchive(); });
  ({ sets: aSets, colab: aColab, ver: aVer, astra: aAstra, img: aImg })[AS.tab]($('#aOut'));
}
function aSets(o) {
  const tools = ['ChatGPT Plus', 'Claude', 'Devin', 'OpenCode', 'Gemini'];
  const rows = (D.toolsets[AS.tool] || {})[AS.set] || [];
  const inF = rows.filter(r => r.final).length;
  o.innerHTML = `<div class="controls"><label>${t('tool')}<select id="aT">${tools.map(x => `<option ${x === AS.tool ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label>${t('set')}${setSel('aS', AS.set)}</label></div>
    <div class="kpis"><div class="kpi"><b>${rows.length}</b><span>${L('متغيرًا في المجموعة', 'variants in set')}</span></div><div class="kpi"><b>${inF}</b><span>${t('infinal')}</span></div></div>
    <div class="scroll"><table class="t"><tr><th>#</th><th>${t('gene')}</th><th>ClinVar</th><th>${t('infinal')}</th></tr>
    ${rows.map((r, i) => `<tr><td>${i + 1}</td><td class="ltr">${esc(r.gene)}</td><td class="ltr">${r.id ? `<a target="_blank" href="https://www.ncbi.nlm.nih.gov/clinvar/variation/${r.id}/">${r.id}</a>` : '—'}</td><td>${r.final ? '<span class="tag-ok">✔</span>' : ''}</td></tr>`).join('')}</table></div>`;
  $('#aT').onchange = e => { AS.tool = e.target.value; renderArchive(); };
  $('#aS').onchange = e => { AS.set = e.target.value; renderArchive(); };
}
function aColab(o) {
  const rows = D.toolsets['Google Colab'].Top3;
  o.innerHTML = `<div class="kpis"><div class="kpi"><b>45</b><span>${L('متغيرًا في 15 جينًا', 'variants in 15 genes')}</span></div><div class="kpi"><b>${rows.filter(r => r.final).length}</b><span>${t('infinal')}</span></div></div>
    <div class="scroll"><table class="t"><tr><th>${t('gene')}</th><th>ClinVar</th><th>${t('status')}</th><th>${t('infinal')}</th></tr>${rows.map(r => `<tr><td class="ltr">${r.gene}</td><td class="ltr">${r.id}</td><td>${esc(r.status.replace('Candidate: ', ''))}</td><td>${r.final ? '<span class="tag-ok">✔</span>' : ''}</td></tr>`).join('')}</table></div>`;
}
function aVer(o) {
  const tools = ['ChatGPT Plus', 'OpenCode'], rows = D.verification.filter(r => r.tool === AS.vt);
  const cnt = {}; rows.forEach(r => cnt[r.status] = (cnt[r.status] || 0) + 1);
  const cls = s => s.startsWith('CONFIRMED') ? 'tag-ok' : s.startsWith('CONTRA') ? 'tag-bad' : 'tag-diff';
  o.innerHTML = `<div class="controls"><label>${t('ver_by')}<select id="aV">${tools.map(x => `<option ${x === AS.vt ? 'selected' : ''}>${x}</option>`).join('')}</select></label></div>
    <div class="kpis">${Object.entries(cnt).map(([k, v]) => `<div class="kpi"><b>${v}</b><span class="ltr">${esc(k)}</span></div>`).join('')}</div>
    <div class="scroll"><table class="t"><tr><th>${t('item')}</th><th>${t('claim_by')}</th><th>${t('status')}</th></tr>${rows.map(r => `<tr><td class="ltr">${esc(r.item)}</td><td class="ltr">${esc(r.by)}</td><td><span class="${cls(r.status)}">${esc(r.status)}</span></td></tr>`).join('')}</table></div>
    <div class="interp">${L('ادعاءات Claude تأكدت في الجدولين تقريبًا كلها، وادعاءات Gemini خالفت مصادرها كلها. وتطابق 21 من 22 ملفًا مشتركًا بين المسارين، لأن مسار OpenCode بُني على ملفات ChatGPT Plus.', 'Claude claims were almost all confirmed in both tables; all Gemini claims contradicted their sources. 21 of 22 shared files were byte-identical because the OpenCode package built on the ChatGPT Plus files.')}</div>`;
  $('#aV').onchange = e => { AS.vt = e.target.value; renderArchive(); };
}
function aAstra(o) {
  const R = [[L('الاحتفاظ بالمتغيرات الأربعة عشر', 'Retained the 14 variants'), 14, 14], [L('حساب TPM من GTEx', 'GTEx TPM computed'), 0, 14], [L('حقول OMIM المباشرة', 'Direct OMIM fields'), 0, 14], [L('سجلات VarCards2', 'VarCards2 records'), 0, 14]];
  o.innerHTML = `<table class="t"><tr><th>${t('item')}</th><th>${L('النتيجة', 'Result')}</th></tr>${R.map(([l, k, n]) => `<tr><td>${l}</td><td><span class="ltr">${k} / ${n}</span></td></tr>`).join('')}</table>
    <div class="interp">${L('الأصفار قيود في بيئة التنفيذ لا نتائج بيولوجية: تعذر تنزيل الملفات أو الوصول إلى المواقع.', 'Zeros reflect execution-environment limits, not biology.')}</div>`;
}
function aImg(o) {
  const list = [];
  D.archive_images.forEach(a => Object.entries(a.imgs).forEach(([k, s]) => list.push([s, `${a.gene} ${a.tag} · ${a.kind === 'pymol' ? 'PyMOL' + (a.plddt ? ' · pLDDT ' + a.plddt : '') : 'ChimeraX · ' + t({ overview: 'ov', WT_closeup: 'wt', mutant_closeup: 'mu', compare: 'cmp' }[k])} · ${a.note}`, a.note.includes('Galaxy') ? t('outside') : t('illus')])));
  o.innerHTML = `<div class="note">${L('هذه الصور لا تخص ممثلين مطابقين للعقم: متغيرات من الجدول A، أو جينات من خارج قائمة الطريق الأول.', 'These images are not infertility-matched representatives: Table A variants or genes outside route 1.')}</div>
    <div class="imgs">${list.map(([s, c, b], i) => `<figure class="${s.includes('pymol') ? 'light' : ''}" data-i="${i}"><img loading="lazy" src="${s}"><figcaption><span class="badge b-ill">${b}</span> ${esc(c)}</figcaption></figure>`).join('')}</div>`;
  bindFigs(o, list.map(([s, c]) => [s, c]));
}

/* ------------------------------------------------------------ guide ---- */
function renderGuide() {
  const dot = c => `<span class="dot d-${c}"></span>`;
  $('#guide').innerHTML = ar() ? `<button class="close" id="guideClose">✕</button>
    <h3>دليل الموقع</h3>
    <div class="goal"><b>هدف العمل:</b> تصميم نموذج أولي لموقع إلكتروني يعرض الطفرات المرتبطة بالعقم الذكري وأدلتها في مكان واحد، وسيجري توسيعه فيما بعد ليشمل أكبر عدد ممكن من الطفرات المرتبطة بالعقم الذكري.</div>
    <p>تعرض النسخة الحالية نتائج مشروع تخرج عن انعدام النطاف اللاانسدادي: 16 جينًا و15 متغيرًا ممثلًا، اختيرت من 6,157 سجلًا في ClinVar عبر طريقين: Galaxy (الطريق الأول) وGoogle Colab (الطريق الثاني).</p>
    <h4>دلالة الألوان</h4>
    <div class="legend"><span>${dot('both')} ممثل أكده الطريق الأول والتشغيل المستقل لـDevin</span><span>${dot('gal')} ممثل من الطريق الأول وحده</span><span>${dot('none')} جين بلا ممثل مطابق للعقم الذكري</span></div>
    <p>تظهر هذه الألوان على علامات الكروموسومات، وعلى الحافة الجانبية لبطاقات الجينات، وبجانب اسم الجين في نافذته.</p>
    <h4>الكروموسومات</h4>
    <ul><li>مرّر المؤشر على اسم جين لتظهر معلوماته الأساسية تدريجيًا في بطاقة ذات إطار أبيض.</li><li>انقر على الكروموسوم لتظهر خياراته: بطاقة الجين، صورة موقع الطفرة، رحلة الدليل، التعبير، الروابط.</li><li>انقر على اسم الجين مباشرة لفتح نافذته.</li></ul>
    <h4>بطاقات الجينات ونافذة الجين</h4>
    <ul><li>المرور فوق البطاقة يعرض الملخص، والنقر يفتح النافذة ذات الإطار الأخضر.</li>
    <li><b>نظرة عامة:</b> المتغير الممثل، ونوع أثره، وCADD، وتردده في gnomAD، والمرض المسجل، وصحة العلاقة بالمرض في المراجعات، وأنماط OMIM.</li>
    <li><b>رحلة الدليل:</b> عدد المتغيرات الباقية في كل مرحلة من مراحل التصفية لهذا الجين.</li>
    <li><b>التعبير الجيني:</b> قيم GTEx وHuman Protein Atlas، وأعلى الأنسجة تعبيرًا.</li>
    <li><b>البنية والصور:</b> مخطط البروتين وموضع الطفرة، وصور ChimeraX الأربع، وصورة PyMOL. انقر على أي صورة لتكبيرها، وتنقّل بالأسهم.</li>
    <li><b>الطريق الثاني:</b> نتائج Google Colab للجين نفسه.</li><li><b>روابط:</b> صفحات الجين في قواعد البيانات.</li></ul>
    <h4>مختبر الاختيار</h4>
    <p>حرّك عتبة CADD، وغيّر حد التردد وحقله وقاعدة المرض؛ فيُعاد تطبيق قاعدة الاختيار فورًا، ويُظهر الشكل القمعي عدد المتغيرات في كل مرحلة، ويقارن الجدول الممثل الناتج بالمجموعة النهائية.</p>
    <h4>التحليل الإحصائي</h4>
    <p>اختر التبويب، ثم غيّر المجموعة أو الأدوات أو طريقة التصحيح أو مستوى الدلالة أو عدد التكرارات والبذرة؛ فتُعاد الحسابات في المتصفح مباشرة من البيانات الأصلية.</p>
    <h4>معرض الصور</h4><p>كل صور ChimeraX وPyMOL، مع التصفية حسب الجين والبرنامج.</p>
    <h4>السجل الأرشيفي</h4><p>زر في الأعلى يفتح درجًا جانبيًا فيه جداول الأدوات الأخرى، وقائمة Colab المختصرة، والتحقق، والصور التوضيحية التي لا تخص ممثلين مطابقين.</p>
    <h4>البحث واللغة</h4><p>ابحث باسم الجين أو برقم ClinVar، وبدّل بين العربية والإنجليزية بالزر في الأعلى. يغلق Esc أي نافذة مفتوحة.</p>
    <p style="color:var(--muted);font-size:13px;margin-top:14px">البيانات مثبتة عند إصدار ClinVar بتاريخ 23 سبتمبر 2026. الموقع نموذج بحثي لا يُستخدم للتشخيص.</p>`
  : `<button class="close" id="guideClose">✕</button>
    <h3>Site guide</h3>
    <div class="goal"><b>Purpose:</b> to design a prototype website that presents mutations linked to male infertility with their evidence in one place. It will later be expanded to cover as many male-infertility mutations as possible.</div>
    <p>This version presents a graduation project on non-obstructive azoospermia: 16 genes and 15 representative variants selected from 6,157 ClinVar records through two routes: Galaxy (route 1) and Google Colab (route 2).</p>
    <h4>Colour key</h4>
    <div class="legend"><span>${dot('both')} Representative confirmed by route 1 and by the independent Devin run</span><span>${dot('gal')} Representative from route 1 only</span><span>${dot('none')} Gene without an infertility-matched representative</span></div>
    <p>The colours appear on chromosome markers, on the side edge of gene cards and next to the gene name in its window.</p>
    <h4>Chromosomes</h4>
    <ul><li>Hover a gene name to reveal its key details step by step in a white-framed card.</li><li>Click a chromosome for its options: gene card, mutation-site image, evidence journey, expression, links.</li><li>Click a gene name to open its window.</li></ul>
    <h4>Gene cards and gene window</h4>
    <ul><li>Hovering a card shows a summary; clicking opens the green-framed window.</li>
    <li><b>Overview:</b> representative variant, consequence, CADD, gnomAD frequency, ClinVar condition, gene–disease validity and OMIM phenotypes.</li>
    <li><b>Evidence journey:</b> how many variants remain at each filtering step for the gene.</li>
    <li><b>Expression:</b> GTEx and Human Protein Atlas values and the top tissues.</li>
    <li><b>Structure &amp; images:</b> protein map with the variant position, the four ChimeraX images and the PyMOL image. Click an image to enlarge; use the arrow keys to browse.</li>
    <li><b>Programmatic route:</b> Google Colab results for the same gene.</li><li><b>Links:</b> the gene's database pages.</li></ul>
    <h4>Selection lab</h4>
    <p>Move the CADD threshold and change the frequency limit, frequency field and condition rule; the selection rule re-runs at once, the funnel shows how many variants remain at each step, and the table compares the result with the final set.</p>
    <h4>Statistical analysis</h4>
    <p>Pick a tab, then change the set, tools, correction, significance level, replicates or seed; everything is recomputed in the browser from the original data.</p>
    <h4>Gallery</h4><p>All ChimeraX and PyMOL images, filterable by gene and program.</p>
    <h4>Archive</h4><p>The button at the top opens a side drawer with the other tools' tables, the Colab shortlist, the verification records and illustrative images that are not matched representatives.</p>
    <h4>Search and language</h4><p>Search by gene or ClinVar ID and switch language with the button at the top. Esc closes any open window.</p>
    <p style="color:var(--muted);font-size:13px;margin-top:14px">Data frozen at the ClinVar release of 23 September 2026. Research prototype, not for diagnosis.</p>`;
  $('#guideClose').onclick = closeGuide;
}
function openGuide() { renderGuide(); $('#guide').classList.add('on'); $('#guideBack').classList.add('on'); }
function closeGuide() { $('#guide').classList.remove('on'); $('#guideBack').classList.remove('on'); }

/* ----------------------------------------------------------- search ---- */
function search(q) {
  const r = $('#qres'); q = q.trim().toUpperCase();
  if (!q) { r.style.display = 'none'; return; }
  const hits = [];
  GENES.forEach(g => { if (g.gene.includes(q) || String(g.variant || '').includes(q)) hits.push([`${g.gene}${g.variant ? ' · ' + g.variant : ''}`, () => openPortal(g.gene)]); });
  Object.entries(D.toolsets).forEach(([tool, sets]) => Object.entries(sets).forEach(([s, rows]) => rows.forEach(x => {
    if (x.id && String(x.id).includes(q) && hits.length < 25) hits.push([`${x.id} · ${x.gene} · ${tool} ${s}`, () => { AS.tab = tool === 'Google Colab' ? 'colab' : 'sets'; if (tool !== 'Google Colab') { AS.tool = tool; AS.set = s; } openDrawer(); }]);
  })));
  r.innerHTML = hits.length ? hits.map((h, i) => `<div data-i="${i}" class="ltr">${esc(h[0])}</div>`).join('') : `<div>${L('لا نتائج', 'No results')}</div>`;
  r.style.display = 'block';
  r.querySelectorAll('[data-i]').forEach(d => d.onclick = () => { hits[+d.dataset.i][1](); r.style.display = 'none'; });
}

/* ------------------------------------------------------------- glue ---- */
function openDrawer() { renderArchive(); $('#drawer').classList.add('on'); }
function renderAll() { renderKpis(); renderKaryo(); renderChromPanel(); renderGenes(); renderLab(); renderStats(); renderGallery(); renderLinks(); if ($('#drawer').classList.contains('on')) renderArchive(); if ($('#portalBack').classList.contains('on')) renderPortal(); if ($('#guide').classList.contains('on')) renderGuide(); }
$('#langBtn').onclick = () => { LANG = ar() ? 'en' : 'ar'; applyLang(); };
$('#archBtn').onclick = openDrawer;
$('#drawerClose').onclick = () => $('#drawer').classList.remove('on');
$('#portalBack').onclick = e => { if (e.target.id === 'portalBack') closePortal(); };
$('#guideBtn').onclick = openGuide;
$('#guideBack').onclick = closeGuide;
$('#q').oninput = e => search(e.target.value);
$('#lightbox').onclick = e => { if (e.target.id === 'lightbox' || e.target.id === 'lbImg') $('#lightbox').classList.remove('on'); };
$('#lbPrev').onclick = e => { e.stopPropagation(); LBi = (LBi - 1 + LB.length) % LB.length; lbShow(); };
$('#lbNext').onclick = e => { e.stopPropagation(); LBi = (LBi + 1) % LB.length; lbShow(); };
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { $('#lightbox').classList.remove('on'); closePortal(); $('#drawer').classList.remove('on'); closeGuide(); }
  if ($('#lightbox').classList.contains('on') && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { LBi = (LBi + (e.key === 'ArrowRight' ? 1 : -1) + LB.length) % LB.length; lbShow(); }
});
const navLinks = [...document.querySelectorAll('#nav a')];
addEventListener('scroll', () => { let cur = null; navLinks.forEach(a => { const s = $(a.getAttribute('href')); if (s.getBoundingClientRect().top < 140) cur = a; }); navLinks.forEach(a => a.classList.toggle('on', a === cur)); });
applyLang();
})();
