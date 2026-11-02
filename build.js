#!/usr/bin/env node
// Builds every client in /clients into /public.
// No packages needed. Netlify runs this on every push: `node build.js`
//
// Per client it makes:
//   public/<slug>/index.html   the tap page (one file, images baked in)
//   public/<slug>/<slug>.vcf   the Save Contact file
// Plus one public/_redirects and public/_headers for the whole site.

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const CLIENTS = path.join(ROOT, "clients");
const OUT = path.join(ROOT, "public");
const TEMPLATE = fs.readFileSync(path.join(ROOT, "src/page.html"), "utf8");
const HOME = "https://jnuru.studio";

const warnings = [];
const warn = (slug, msg) => warnings.push(`  ! ${slug}: ${msg}`);

// ---------- icons (drawn as masks so they take the page's ink color) ----------
const stroke = (d) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const fill = (d) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${d}"/></svg>`;

const ICONS = {
  email: stroke('<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M3 6.5l9 6.5 9-6.5"/>'),
  phone: stroke('<path d="M5 3h3.5l2 5-2.5 1.5a11 11 0 0 0 6.5 6.5L16 13.5l5 2V19a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>'),
  text: stroke('<path d="M4 5h16v11H9l-5 4z"/>'),
  web: stroke('<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c3 3.2 3 15.8 0 19M12 2.5c-3 3.2-3 15.8 0 19"/>'),
  map: stroke('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  book: stroke('<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>'),
  reviews: stroke('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'),
  link: stroke('<path d="M7 17L17 7M9 7h8v8"/>'),
  instagram: fill("M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"),
  tiktok: fill("M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"),
  facebook: fill("M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"),
  linkedin: fill("M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"),
  youtube: fill("M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"),
  x: fill("M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"),
};
const iconCss = Object.entries(ICONS)
  .map(([k, svg]) => `  .ico.${k}{--m:url("data:image/svg+xml,${encodeURIComponent(svg)}")}`)
  .join("\n");

// ---------- helpers ----------
const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const digits = (p = "") => p.replace(/[^\d+]/g, "");
const bare = (u = "") => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp" };

function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

function readImage(dir, file, slug) {
  if (!file) return null;
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) {
    warn(slug, `can't find ${file}, skipping it`);
    return null;
  }
  const ext = path.extname(p).toLowerCase();
  const buf = fs.readFileSync(p);
  if (buf.length > 250 * 1024) warn(slug, `${file} is ${Math.round(buf.length / 1024)}KB. Shrink it (aim under 150KB) so the page opens fast.`);
  return { ext, buf, uri: `data:${MIME[ext] || "application/octet-stream"};base64,${buf.toString("base64")}` };
}

// ---------- the Save Contact file ----------
function vcard(c, img) {
  const fold = (line) => line.match(/.{1,74}/g).join("\r\n ");
  const v = (s = "") => String(s).replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const [first, ...rest] = c.name.split(" ");
  const L = ["BEGIN:VCARD", "VERSION:3.0", `N:${v(rest.join(" "))};${v(first)};;;`, `FN:${v(c.name)}`];
  if (c.business) L.push(`ORG:${v(c.business)}`);
  if (c.title) L.push(`TITLE:${v(c.title)}`);
  if (c.phone) L.push(`TEL;TYPE=CELL,VOICE:${digits(c.phone)}`);
  if (c.email) L.push(`EMAIL;TYPE=WORK:${c.email}`);
  if (c.website) L.push(`URL:${c.website}`);
  for (const l of c.links || []) {
    if (["instagram", "tiktok", "facebook", "linkedin", "youtube", "x"].includes(l.type))
      L.push(`X-SOCIALPROFILE;TYPE=${l.type}:${l.url}`);
  }
  const a = c.address;
  if (a) L.push(`ADR;TYPE=WORK:;;${v(a.street || "")};${v(a.city || "")};${v(a.state || "")};${v(a.zip || "")};USA`);
  if (c.pitch) L.push(`NOTE:${v(c.pitch)}`);
  if (img && (img.ext === ".jpg" || img.ext === ".jpeg" || img.ext === ".png")) {
    L.push(fold(`PHOTO;ENCODING=b;TYPE=${img.ext === ".png" ? "PNG" : "JPEG"}:${img.buf.toString("base64")}`));
  }
  L.push("END:VCARD");
  return L.join("\r\n") + "\r\n";
}

// ---------- the page ----------
function primaryHref(p, c) {
  const val = p.value || "";
  switch (p.type) {
    case "call": return `tel:${digits(val || c.phone)}`;
    case "text": return `sms:${digits(val || c.phone)}`;
    case "email": return `mailto:${val || c.email}`;
    case "site": return val || c.website;
    case "book": return val;
    default: return val;
  }
}

function linkHref(l) {
  if (l.url) return l.url;
  if (l.type === "email") return `mailto:${l.value}`;
  if (l.type === "phone") return `tel:${digits(l.value)}`;
  if (l.type === "text") return `sms:${digits(l.value)}`;
  return "#";
}

function buildPage(c, slug, photo, logo, vcfHref) {
  const bg = c.colors?.background || "#F5F2EA";
  const ink = c.colors?.ink || "#2A2826";
  const accent = c.colors?.accent || ink;
  const onAccent = contrast(accent, "#FFFFFF") >= contrast(accent, "#111111") ? "#FFFFFF" : "#111111";
  if (contrast(ink, bg) < 4.5) warn(slug, `ink on background is hard to read (contrast ${contrast(ink, bg).toFixed(1)}, want 4.5+)`);
  if (contrast(accent, onAccent) < 4.5) warn(slug, `main button text may be hard to read on that accent color`);

  const font = c.font || "Source Serif 4";
  const fontUrl =
    font === "Source Serif 4"
      ? "https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,440;8..60,600&display=swap"
      : `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g, "+")}:wght@400;600&display=swap`;

  // header: photo in a circle, logo above it. Logo only = big logo. Neither = initials.
  const h = [];
  if (logo) h.push(`    <img class="logo${photo ? "" : " solo"}" src="${logo.uri}" alt="${esc(c.business || c.name)}">`);
  if (photo) h.push(`    <div class="avatar"><img src="${photo.uri}" alt="${esc(c.name)}" width="128" height="128"></div>`);
  if (!photo && !logo) {
    const initials = c.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
    h.push(`    <div class="avatar"><span class="mono">${esc(initials)}</span></div>`);
  }
  h.push(`    <h1>${esc(c.name)}</h1>`);
  const sub = [c.title, c.business].filter(Boolean).join(" · ");
  if (sub) h.push(`    <p class="label sub">${esc(sub)}</p>`);
  if (c.pitch) h.push(`    <p class="pitch">${esc(c.pitch).replace(/ ([^ ]+)$/, "&nbsp;$1")}</p>`);

  const p = c.primary || {};
  const actions = [];
  if (p.type) {
    const note = p.note ? `<small>${esc(p.note)}</small>` : "";
    const ext = /^https?:/.test(primaryHref(p, c)) ? ' target="_blank" rel="noopener"' : "";
    actions.push(
      `    <a class="btn primary" href="${esc(primaryHref(p, c))}"${ext}>\n      <span>${esc(p.label)}${note}</span>\n      <span class="arrow">→</span>\n    </a>`
    );
  }
  actions.push(`    <a class="btn" href="${vcfHref}" download>\n      <span>Save contact</span>\n      <span class="arrow">+</span>\n    </a>`);

  const items = (c.links || []).map((l, i) => {
    const n = String(i + 1).padStart(2, "0");
    const ico = ICONS[l.type] ? l.type : "link";
    const show = l.show ?? (l.value || bare(l.url || ""));
    const ext = /^https?:/.test(linkHref(l)) ? ' target="_blank" rel="noopener"' : "";
    return `    <li><a href="${esc(linkHref(l))}"${ext}><span class="n">${n}</span><span class="lbl"><i class="ico ${ico}"></i>${esc(l.label)}</span><span class="v">${esc(show)}</span></a></li>`;
  });
  const links = items.length ? `\n  <ul class="links">\n${items.join("\n")}\n  </ul>\n` : "";

  const foot = [];
  if (c.tagline) foot.push(`    <p class="label">${esc(c.tagline)}</p>`);
  if (c.credit !== false) foot.push(`    <a class="label credit" href="${HOME}">made by jnuru.studio</a>`);
  const footer = foot.length ? `\n  <footer>\n${foot.join("\n")}\n  </footer>` : "";

  const fill = {
    title: esc(c.business ? `${c.name} · ${c.business}` : c.name),
    description: esc(c.pitch || ""),
    bg, ink, accent, onAccent, font, fontUrl: esc(fontUrl), iconCss,
    header: h.join("\n"), actions: actions.join("\n"), links, footer,
  };
  return TEMPLATE.replace(/\{\{(\w+)\}\}/g, (_, k) => fill[k] ?? "");
}

// ---------- run ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const domainRules = [];
const tapRules = [];
const headers = [];
let count = 0;

for (const slug of fs.readdirSync(CLIENTS).sort()) {
  if (slug.startsWith("_") || slug.startsWith(".")) continue; // _new is the blank starter
  const dir = path.join(CLIENTS, slug);
  if (!fs.statSync(dir).isDirectory()) continue;
  if (!/^[a-z0-9-]+$/.test(slug)) {
    console.error(`x Folder "${slug}" must be lowercase letters, numbers and dashes only.`);
    process.exit(1);
  }
  const cfg = path.join(dir, "client.json");
  if (!fs.existsSync(cfg)) { warn(slug, "no client.json, skipped"); continue; }
  let c;
  try { c = JSON.parse(fs.readFileSync(cfg, "utf8")); }
  catch (e) { console.error(`x ${slug}/client.json has a typo: ${e.message}`); process.exit(1); }
  if (c.live === false) { warn(slug, "live is false, skipped (cards will 404)"); continue; }
  if (!c.name) { console.error(`x ${slug}: "name" is required`); process.exit(1); }

  const photo = readImage(dir, c.photo, slug);
  const logo = readImage(dir, c.logo, slug);
  const domain = (c.domain || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const vcfFile = `${slug}.vcf`;
  const vcfHref = domain ? `/${vcfFile}` : `/${slug}/${vcfFile}`;

  fs.mkdirSync(path.join(OUT, slug), { recursive: true });
  fs.writeFileSync(path.join(OUT, slug, "index.html"), buildPage(c, slug, photo, logo, vcfHref));
  fs.writeFileSync(path.join(OUT, slug, vcfFile), vcard(c, photo || logo));
  headers.push(`/${slug}/${vcfFile}\n  Content-Type: text/vcard; charset=utf-8\n  Content-Disposition: attachment; filename="${vcfFile}"`);

  if (domain) {
    // their own domain shows their page, nothing else
    domainRules.push(
      `https://${domain}/            /${slug}/index.html  200!`,
      `https://${domain}/${vcfFile}  /${slug}/${vcfFile}  200!`,
      `https://${domain}/*           https://${domain}/   302!`
    );
    tapRules.push(`/t/${slug}   https://${domain}/  302!`, `/${slug}   https://${domain}/  301!`);
    headers.push(`/${vcfFile}\n  Content-Type: text/vcard; charset=utf-8\n  Content-Disposition: attachment; filename="${vcfFile}"`);
  } else {
    tapRules.push(`/t/${slug}   /${slug}/  302!`);
  }
  count++;
  console.log(`  ✓ ${slug}${domain ? `  (${domain})` : ""}`);
}

const redirects = [
  "# Built by build.js. Don't edit here, edit clients/*/client.json.",
  "# Client domains first so they never fall through to jnuru.studio.",
  ...domainRules,
  "",
  "# Card links. NFC chips and QR codes point here, never at the page itself.",
  ...tapRules,
  "",
  "# Bare tap.jnuru.studio goes to the studio site.",
  `/   ${HOME}   302`,
].join("\n");

fs.writeFileSync(path.join(OUT, "_redirects"), redirects + "\n");
fs.writeFileSync(path.join(OUT, "_headers"), headers.join("\n") + "\n");
fs.copyFileSync(path.join(ROOT, "src/404.html"), path.join(OUT, "404.html"));

console.log(`\nBuilt ${count} client page${count === 1 ? "" : "s"}.`);
if (warnings.length) console.log("\nHeads up:\n" + warnings.join("\n"));
