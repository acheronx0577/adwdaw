/* ============================================================
   Cursor-Skills Docs — main.js
   Scroll reveal · Nav · Marquee · Copy commands & code blocks
   ============================================================ */

'use strict';

/* ─── Scroll reveal ─────────────────────────────────────── */
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }),
  { threshold: 0.1, rootMargin: '0px 0px -36px 0px' }
);
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* ─── Nav scroll border ─────────────────────────────────── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.style.boxShadow = window.scrollY > 30 ? '0 2px 0 #141414' : 'none';
}, { passive: true });

/* ─── Mobile nav toggle ─────────────────────────────────── */
const burger  = document.getElementById('burger');
const overlay = document.getElementById('overlay');

burger?.addEventListener('click', () => {
  const open = burger.classList.toggle('open');
  overlay.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  burger.setAttribute('aria-expanded', String(open));
});

overlay?.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => {
    burger.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  })
);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && overlay?.classList.contains('open')) {
    burger.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
});

/* ─── Marquee pause on hover ────────────────────────────── */
const track = document.querySelector('.marquee-track');
document.querySelector('.marquee')?.addEventListener('mouseenter', () => {
  track.style.animationPlayState = 'paused';
});
document.querySelector('.marquee')?.addEventListener('mouseleave', () => {
  track.style.animationPlayState = 'running';
});

/* ─── Subtle card tilt ──────────────────────────────────── */
document.querySelectorAll('.cmd-card:not(.other-skill-card), .mini-card').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    card.style.transform =
      `translate(-3px,-3px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

/* ─── Copy on click (commands, table buttons, code blocks, inline code) */
async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(ta);
  return ok;
}

function getCopyText(el) {
  return (el.dataset.copy || el.textContent || '').trim();
}

let copyToastEl;
let copyToastTimer;

function getCopyToast() {
  if (!copyToastEl) {
    copyToastEl = document.createElement('div');
    copyToastEl.id = 'copy-toast';
    copyToastEl.className = 'copy-toast';
    copyToastEl.setAttribute('role', 'status');
    copyToastEl.setAttribute('aria-live', 'polite');
    copyToastEl.hidden = true;
    copyToastEl.innerHTML =
      '<span class="copy-toast-label">Copied to clipboard</span>' +
      '<span class="copy-toast-cmd"></span>';
    document.body.appendChild(copyToastEl);
  }
  return copyToastEl;
}

function showCopyToast(text) {
  const toast = getCopyToast();
  toast.querySelector('.copy-toast-cmd').textContent = text;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  clearTimeout(copyToastTimer);
  const duration = Math.min(5200, Math.max(2600, 2000 + text.length * 45));
  copyToastTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => { toast.hidden = true; }, 320);
  }, duration);
}

function bounceCopy(el) {
  el.classList.remove('copy-bounce');
  void el.offsetWidth;
  el.classList.add('copy-bounce');
  el.addEventListener('animationend', () => el.classList.remove('copy-bounce'), { once: true });
}

function resolveCopyText(container) {
  if (container.dataset.copy?.trim()) return container.dataset.copy.trim();
  const btn = container.querySelector('.table-cmd[data-copy]');
  if (btn?.dataset.copy) return btn.dataset.copy.trim();
  const titleCode = container.querySelector('.step-title code');
  if (titleCode) return getCopyText(titleCode);
  const tCmd = container.querySelector('.t-cmd');
  if (tCmd) {
    const arg = container.querySelector('.t-arg');
    return arg
      ? `${tCmd.textContent.trim()} ${arg.textContent.trim()}`
      : tCmd.textContent.trim();
  }
  const codes = [...container.querySelectorAll('code')];
  if (codes.length === 1) return getCopyText(codes[0]);
  if (codes.length > 1) return codes.map(getCopyText).join(' · ');
  return (container.textContent || '').trim();
}

async function handleCopyClick(container, text) {
  try {
    if (await copyToClipboard(text)) {
      bounceCopy(container);
      showCopyToast(text);
    }
  } catch (_) { /* silent */ }
}

function bindCopyChip(el, text) {
  el.classList.add('copy-chip');
  el.title = 'Click to copy';
  el.addEventListener('click', async (e) => {
    e.stopPropagation();
    e.preventDefault();
    await handleCopyClick(el, text);
  });
  if (el.classList.contains('code-block')) {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      }
    });
  }
}

/* Table: click command chip OR the Use cell next to it — chip size unchanged */
function bindCopyRow(tr) {
  const cmdCell = tr.querySelector('td:first-child');
  if (!cmdCell) return;
  const text = resolveCopyText(cmdCell);
  if (!text) return;
  const chip = cmdCell.querySelector('.table-cmd, code') || cmdCell;
  tr.classList.add('copy-row');
  tr.title = 'Click to copy command';
  tr.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    handleCopyClick(chip, text);
  });
}

document.querySelectorAll('.readme-table tbody tr').forEach(bindCopyRow);

document.querySelectorAll('.code-block[data-copy]').forEach((el) => {
  bindCopyChip(el, el.dataset.copy);
});

document.querySelectorAll('.cmd-name[data-copy]').forEach((el) => {
  bindCopyChip(el, el.dataset.copy);
});

document.querySelectorAll('.terminal-body > div').forEach((line) => {
  const text = resolveCopyText(line);
  if (!text) return;
  const chip = line.querySelector('.t-cmd') || line;
  line.classList.add('copy-row');
  line.title = 'Click to copy';
  line.addEventListener('click', () => handleCopyClick(chip, text));
});

document.querySelectorAll('code').forEach((el) => {
  if (el.closest('.code-block, .readme-table, .terminal-body')) return;
  bindCopyChip(el, getCopyText(el));
});

document.querySelectorAll('.dark-strip a, .section a, .callout a, .upstream-link')
  .forEach((a) => {
    if (a.hostname && a.hostname !== location.hostname) {
      a.setAttribute('rel', 'noopener noreferrer');
    }
  });
