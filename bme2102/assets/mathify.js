/* BME 2102 interactive notes: typeset the formulas inside sentences, worked examples and questions with KaTeX.
   The notes write formulas in plain text (v<sub>A</sub> = ω r, T₁/T₂ = e^μθ ...). This finds each formula
   (a run of symbols that contains a relation such as = or ⇒, or a single symbol with a subscript or Greek letter)
   and replaces it with KaTeX output, so every equation looks as it would in LaTeX. */
(function(global){
'use strict';
const GREEK = { 'α':'\\alpha','β':'\\beta','γ':'\\gamma','δ':'\\delta','ε':'\\varepsilon','ζ':'\\zeta','η':'\\eta','θ':'\\theta','ι':'\\iota','κ':'\\kappa','λ':'\\lambda','μ':'\\mu','ν':'\\nu','ξ':'\\xi','π':'\\pi','ρ':'\\rho','σ':'\\sigma','τ':'\\tau','υ':'\\upsilon','φ':'\\varphi','ϕ':'\\phi','χ':'\\chi','ψ':'\\psi','ω':'\\omega',
  'Γ':'\\Gamma','Δ':'\\Delta','Θ':'\\Theta','Λ':'\\Lambda','Ξ':'\\Xi','Π':'\\Pi','Σ':'\\Sigma','Φ':'\\Phi','Ψ':'\\Psi','Ω':'\\Omega' };
const SUBD = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','ₐ':'a','ₑ':'e','ₒ':'o','ₓ':'x','ᵢ':'i','ⱼ':'j','ₖ':'k','ₗ':'l','ₘ':'m','ₙ':'n','ₚ':'p','ₛ':'s','ₜ':'t','₊':'+','₋':'-' };
const SUPD = { '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-','ⁿ':'n','ᵗ':'t','ʳ':'r' };
const FUN = { sin:'\\sin', cos:'\\cos', tan:'\\tan', cot:'\\cot', sec:'\\sec', cosec:'\\operatorname{cosec}', log:'\\log', ln:'\\ln', exp:'\\exp', max:'\\max', min:'\\min' };
const UNITS = new Set(['mm','cm','m','km','s','min','h','rpm','rad','N','kN','MN','kg','g','W','kW','MW','J','kJ','Pa','kPa','MPa','GPa','Hz','m/s','m/s²','rad/s','rad/s²','mm/s','N/m²','kg/m','kg/m³','N/mm²','r.p.m.','N m','kg m','kg m²']);
const REL = /[=⇒≤≥<>≠→]/;
const PRE = { 'ṡ':'\\dot{s}', 'ẋ':'\\dot{x}', 'ẏ':'\\dot{y}', 'ẍ':'\\ddot{x}', 'ÿ':'\\ddot{y}', 'ṙ':'\\dot{r}', 'ṗ':'\\dot{p}' };
const isGreek = c => c in GREEK, isSub = c => c in SUBD, isSup = c => c in SUPD;
const esc = s => s.replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);
const unesc = s => s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

/* ---- tokenizer: html string -> tokens {k:'w'|'n'|'op'|'sp'|'tag'|'v', s, tex} ---- */
function tokenize(html){
  const out = []; let i = 0;
  const push = t => out.push(t);
  while (i < html.length){
    const c = html[i];
    if (c === '<'){ const j = html.indexOf('>', i); const tag = html.slice(i, j + 1); const m = tag.match(/^<\/?(\w+)/); const name = m ? m[1].toLowerCase() : '';
      if (name === 'sub' || name === 'sup'){ if (tag[1] === '/'){ i = j + 1; continue; }
        const end = html.indexOf(`</${name}>`, j); const inner = html.slice(j + 1, end); push({ k:name, s:html.slice(i, end + name.length + 3), inner }); i = end + name.length + 3; continue; }
      if (name === 'b' && tag[1] !== '/'){ const end = html.indexOf('</b>', j); const inner = html.slice(j + 1, end);
        if (end > 0 && /^([A-Za-z]{1,2}|[A-Z]{3}|[a-z][′'][a-z][′'])[′']?$/.test(unesc(inner)) ){ push({ k:'bv', s:html.slice(i, end + 4), inner:unesc(inner) }); i = end + 4; continue; } }
      push({ k:'tag', s:tag }); i = j + 1; continue; }
    if (c === '&' && /^&[#a-z0-9]+;/i.test(html.slice(i, i + 10))){ const j = html.indexOf(';', i); const ent = html.slice(i, j + 1); const ch = unesc(ent);
      if (ch === ' ' || ent === '&ensp;' || ent === '&emsp;' || ent === '&thinsp;'){ push({ k:'sp', s:ent }); i = j + 1; continue; }
      push({ k:'op', s:ent, ch }); i = j + 1; continue; }
    if (/\s/.test(c)){ let j = i; while (j < html.length && /\s/.test(html[j])) j++; push({ k:'sp', s:html.slice(i, j) }); i = j; continue; }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(html[i + 1] || ''))){ let j = i; while (j < html.length && /[0-9.,]/.test(html[j])){ if ((html[j] === ',' || html[j] === '.') && !/[0-9]/.test(html[j + 1] || '')) break; j++; } push({ k:'n', s:html.slice(i, j) }); i = j; continue; }
    if (/[A-Za-z]/.test(c)){ let j = i; while (j < html.length && /[A-Za-z]/.test(html[j])) j++; push({ k:'w', s:html.slice(i, j) }); i = j; continue; }
    if (isGreek(c)){ push({ k:'g', s:c }); i++; continue; }
    if (PRE[c]){ push({ k:'pre', s:c, tex:PRE[c] }); i++; continue; }
    if ((c === '_' || c === '^') && /[A-Za-z0-9]/.test(html[i + 1] || '')){ let j = i + 1; while (j < html.length && /[A-Za-z0-9]/.test(html[j])) j++; push({ k:c === '_' ? 'sub' : 'sup', s:html.slice(i, j), inner:html.slice(i + 1, j) }); i = j; continue; }
    // combining dots belong to the previous letter
    if (c === '̇' || c === '̈'){ push({ k:'acc', s:c }); i++; continue; }
    if (isSub(c)){ let j = i; while (j < html.length && isSub(html[j])) j++; push({ k:'usub', s:html.slice(i, j) }); i = j; continue; }
    if (isSup(c)){ let j = i; while (j < html.length && isSup(html[j])) j++; push({ k:'usup', s:html.slice(i, j) }); i = j; continue; }
    push({ k:'op', s:c, ch:c }); i++; }
  return units(out); }
/* a unit written after a number (12 rad/s, 3 m/s²) becomes one token */
function units(t){ const o = [];
  for (let i = 0; i < t.length; i++){ o.push(t[i]);
    if (t[i].k === 'n' && t[i + 1] && t[i + 1].k === 'sp' && t[i + 2] && t[i + 2].k === 'w' && UNITS.has(t[i + 2].s)){
      let u = t[i + 2].s, raw = t[i + 2].s, j = i + 3;
      while (t[j] && t[j].k === 'op' && t[j].ch === '/' && t[j + 1] && t[j + 1].k === 'w' && /^(s|min|m|mm|kg|m²|m³|rad|h)$/.test(t[j + 1].s)){ u += '/' + t[j + 1].s; raw += '/' + t[j + 1].s; j += 2; }
      if (t[j] && t[j].k === 'usup'){ u += '^{' + [...t[j].s].map(c => SUPD[c]).join('') + '}'; raw += t[j].s; j++; }
      if (t[j] && t[j].k === 'op' && /[=(]/.test(t[j].ch)) continue;
      if (t[i + 3] && ['sub', 'usub', 'sup'].includes(t[i + 3].k)) continue;
      o.push(t[i + 1]); o.push({ k:'unit', s:raw, tex:u }); i = j - 1; } }
  return o; }

/* ---- which tokens can be part of a formula ---- */
const MATHOP = new Set(['⟂', '∠', '=', '−', '-', '+', '×', '÷', '/', '(', ')', '[', ']', '√', '⇒', '≤', '≥', '<', '>', '≠', '′', '·', '°', '½', '→', '∞', '|', ',', '.', '%', '∑']);
function isMathWord(t, prev, next){ const w = t.s;
  if (FUN[w]) return true;
  if (/^[A-Z]{1,3}$/.test(w)) return !['I', 'A'].includes(w) || true;
  if (/^[A-Z][a-z]?$/.test(w)) return w.length === 1;
  if (/^[a-z]$/.test(w)) return true;
  if (/^(dt|ds|dv|dx|dy|dP|dθ|dr|arc)$/.test(w)) return true;
  if (/^[A-Z][A-Z0-9]*[a-z]?$/.test(w) && w.length <= 3) return true;
  return false; }

function isAtom(t){ return t.k === 'n' || t.k === 'unit' || t.k === 'g' || t.k === 'pre' || t.k === 'bv' || t.k === 'sub' || t.k === 'sup' || t.k === 'usub' || t.k === 'usup' || t.k === 'acc' || (t.k === 'w' && isMathWord(t)) || (t.k === 'op' && MATHOP.has(t.ch)); }

/* ---- convert a run of tokens to TeX ---- */
function subTeX(inner){ const s = unesc(inner).trim();
  if (/^[0-9]+$/.test(s) || /^[A-Za-z]$/.test(s) || /^[A-Z0-9]+$/.test(s)) return s;
  if (/^(max|min|cut|ideal|actual|cell|fixed|out|in)$/i.test(s)) return `\\text{${s}}`;
  return runTeX(tokenize(inner)); }
function runTeX(toks){ let out = '', lastAlnum = false, gap = false;
  const add = (s, alnum) => { if (gap && alnum === true && lastAlnum === true) out += '\\,'; out += s; lastAlnum = alnum; gap = false; };
  for (let k = 0; k < toks.length; k++){ const t = toks[k];
    if (t.k === 'sp'){ gap = true; continue; }
    if (t.k === 'n'){ const nxt = toks[k + 1], nxt2 = toks[k + 2];
      add(t.s.replace(/,/g, '{,}'), 'n');
      continue; }
    if (t.k === 'w'){ if (FUN[t.s]){ add(FUN[t.s], false); out += ' '; lastAlnum = false; continue; }
      add(t.s === 'arc' ? '\\mathrm{arc}' : t.glued ? t.s : (t.s.length > 1 && /^[a-z]+$/.test(t.s) && !/^d[a-zθ]$/.test(t.s) ? `\\mathrm{${t.s}}` : t.s), true); continue; }
    if (t.k === 'g'){ add(GREEK[t.s] + ' ', true); continue; }
    if (t.k === 'pre'){ add(t.tex, true); continue; }
    if (t.k === 'unit'){ out += `\\ \\mathrm{${t.tex}}`; lastAlnum = 'n'; gap = false; continue; }
    if (t.k === 'bv'){ add(`\\mathbf{${t.inner.replace(/′/g, "'")}}`, true); continue; }
    if (t.k === 'acc'){ // dot over previous symbol: rewrite the last symbol
      const m = out.match(/(\\[a-zA-Z]+ ?|\\mathbf\{[^}]*\}|[A-Za-z])$/); if (m){ out = out.slice(0, -m[0].length) + (t.s === '̇' ? '\\dot{' : '\\ddot{') + m[0].trim() + '}'; } continue; }
    if (t.k === 'sub'){ out += `_{${subTeX(t.inner)}}`; lastAlnum = true; gap = false; continue; }
    if (t.k === 'sup'){ out += `^{${subTeX(t.inner)}}`; lastAlnum = true; continue; }
    if (t.k === 'usub'){ out += '_{' + [...t.s].map(c => SUBD[c]).join('') + '}'; lastAlnum = true; continue; }
    if (t.k === 'usup'){ out += '^{' + [...t.s].map(c => SUPD[c]).join('') + '}'; lastAlnum = true; continue; }
    if (t.k === 'op'){ const c = t.ch; lastAlnum = false;
      if (c === '√'){ // √(...) or √x
        const nx = toks[k + 1];
        if (nx && nx.k === 'op' && nx.ch === '('){ let d = 0, j = k + 1; for (; j < toks.length; j++){ if (toks[j].k === 'op' && toks[j].ch === '(') d++; else if (toks[j].k === 'op' && toks[j].ch === ')'){ d--; if (d === 0) break; } }
          out += `\\sqrt{${runTeX(toks.slice(k + 2, j))}}`; lastAlnum = true; k = j; continue; }
        let j = k + 1; const inner = []; while (toks[j] && ['n', 'w', 'g', 'sub', 'usub', 'sup', 'usup'].includes(toks[j].k)){ inner.push(toks[j]); j++; if (toks[j] && !['sub', 'usub', 'sup', 'usup'].includes(toks[j].k)) break; }
        out += `\\sqrt{${runTeX(inner)}}`; lastAlnum = true; k = j - 1; continue; }
      const map = { '−':'-', '×':'\\times ', '÷':'\\div ', '·':'\\cdot ', '⇒':'\\Rightarrow ', '≤':'\\le ', '≥':'\\ge ', '≠':'\\ne ', '′':"'", '°':'^\\circ ', '½':'\\tfrac{1}{2}', '→':'\\to ', '∞':'\\infty ', '%':'\\%', '∑':'\\sum ', '<':'<', '>':'>', '|':'|', '∠':'\\angle ', '⟂':'\\perp ' };
      out += map[c] != null ? map[c] : c; if (c === ')' || c === '½' || c === '∞') lastAlnum = 'n'; continue; }
  }
  return out.replace(/\s+/g, ' ').trim(); }

/* ---- find formula runs in an html string and replace them ---- */
function convert(html, katex, opt = {}){
  const toks = tokenize(html); const res = []; let i = 0;
  const render = (tex) => { try { return katex.renderToString(tex, { throwOnError:true, output:'html', strict:'ignore' }); } catch (e) { return null; } };
  while (i < toks.length){
    if (!isAtom(toks[i]) || (toks[i].k === 'op' && /[,.)\]%]/.test(toks[i].ch))){ res.push(toks[i].s); i++; continue; }
    // extend a run over atoms and single spaces
    // short lowercase words glued to a formula (½gt², 2mv) are products of symbols
    const glued = (k) => { const t = toks[k]; if (!t || t.k !== 'w' || !/^([a-z]{2,3}|[a-z][A-Z]|[a-z][A-Z][a-z])$/.test(t.s) || FUN[t.s]) return false; const p = toks[k - 1], n = toks[k + 1];
      if (p && (['n', 'g', 'sub', 'sup', 'usub', 'usup', 'pre'].includes(p.k) || (p.k === 'op' && p.ch === '½'))) return true;
      if (n && (['sub', 'sup', 'usub', 'usup'].includes(n.k) || (n.k === 'op' && n.ch === '′'))) return true;
      let l = k - 1; while (toks[l] && toks[l].k === 'sp') l--; let r = k + 1; while (toks[r] && toks[r].k === 'sp') r++;
      const L = toks[l], R = toks[r]; if (!L || !R || L.k !== 'op' || R.k !== 'op') return false; if (t.s.length > 2 && !(r === k + 1 && /[\/)=]/.test(R.ch))) return false;
      return /[=−+×\/(⟂]/.test(L.ch) && (/[=−+×\/)⟂]/.test(R.ch) || (L.ch === '=' && /[,.]/.test(R.ch))); };
    for (let k = i; k < toks.length && toks[k].k !== 'sp'; k++) if (glued(k)) toks[k].glued = true;
    let dep = 0, j = i; while (j < toks.length && (isAtom(toks[j]) || glued(j) || (toks[j].k === 'sp' && j + 1 < toks.length && (isAtom(toks[j + 1]) || glued(j + 1))))){ if (glued(j)) toks[j].glued = true; const tj = toks[j]; if (tj.k === 'op' && /[(\[]/.test(tj.ch)) dep++; if (tj.k === 'op' && /[)\]]/.test(tj.ch)) dep--; if (j > i && tj.k === 'op' && (tj.ch === '.' || (tj.ch === ',' && dep <= 0)) && (!toks[j + 1] || toks[j + 1].k === 'sp' || toks[j + 1].k === 'tag')) break; j++; }
    // trim trailing punctuation, spaces and unbalanced brackets; leading spaces and unbalanced brackets
    const bal = (a, b) => { let d = 0; for (let k = a; k < b; k++){ const t = toks[k]; if (t.k === 'op' && (t.ch === '(' || t.ch === '[')) d++; if (t.k === 'op' && (t.ch === ')' || t.ch === ']')) d--; } return d; };
    let a = i, b = j, changed = true;
    while (changed && b > a){ changed = false; const L = toks[b - 1], F = toks[a];
      if (L.k === 'sp' || (L.k === 'op' && /[,.(]/.test(L.ch)) || (L.k === 'op' && /[)\]]/.test(L.ch) && bal(a, b) < 0)){ b--; changed = true; continue; }
      if (F.k === 'sp' || (F.k === 'op' && /[(\[]/.test(F.ch) && bal(a, b) > 0) || (F.k === 'op' && (REL.test(F.ch) || /[,.]/.test(F.ch)))){ a++; changed = true; } }
    for (let k = i; k < a; k++) res.push(toks[k].s);
    const run = toks.slice(a, b); let ok = false;
    if (run.length){
      const text = run.map(t => t.s).join('');
      const hasRel = run.some(t => t.k === 'op' && REL.test(t.ch));
      const single = run.every(t => t.k !== 'sp');
      const isSym = run.some(t => ['sub', 'sup', 'usub', 'usup', 'g', 'acc', 'bv', 'pre'].includes(t.k));
      const onlyNum = run.every(t => t.k === 'n' || t.k === 'sp' || (t.k === 'op' && /[,.%]/.test(t.ch)));
      const wordsOnly = run.every(t => t.k === 'w' || t.k === 'sp');
      const allSym = run.every(t => t.k === 'sp' || ['g', 'sub', 'sup', 'usub', 'usup', 'pre', 'bv'].includes(t.k) || (t.k === 'w' && /^[A-Za-z]$/.test(t.s)));
      ok = !onlyNum && !wordsOnly && (hasRel || (single && isSym) || (allSym && isSym) || (run.some(t => t.k === 'op' && /[×÷√/−+]/.test(t.ch)) && (isSym || run.some(t => t.k === 'w'))));
      if (ok && /^[0-9]+D$/.test(text)) ok = false;
      if (ok && opt.relOnly && !hasRel) ok = false;
      if (ok){ const tex = runTeX(run); const h = tex && render(tex); if (h) res.push(`<span class="mx">${h}</span>`); else ok = false; } }
    if (!ok) for (const t of run) res.push(t.s);
    for (let k = b; k < j; k++) res.push(toks[k].s);
    i = j; }
  return res.join(''); }

/* ---- browser glue ---- */
const cache = new Map();
function mathifyHTML(html){ if (!global.katex) return html; if (cache.has(html)) return cache.get(html); const out = convert(html, global.katex); cache.set(html, out); return out; }
function mathify(root, sel){ if (!global.katex || !root) return; (sel ? root.querySelectorAll(sel) : [root]).forEach(el => {
    if (el.closest('.katex, .mx-done, nav, .sitebar, .deckbar, .controls, .tlist, .slidehead, h1, h2, h3, h4, summary')) return;
    if (el.querySelector('input, select, canvas, button, textarea, .katex, .mx')) return;
    const h = el.innerHTML, n = mathifyHTML(h); if (n !== h) el.innerHTML = n; el.classList.add('mx-done'); }); }
global.MathifyCore = { tokenize, runTeX, convert };
global.mathify = mathify; global.mathifyHTML = mathifyHTML;
if (typeof module !== 'undefined') module.exports = { tokenize, runTeX, convert };
})(typeof window !== 'undefined' ? window : globalThis);
