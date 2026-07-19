/* eslint-disable */
import React from 'react';
import { StoryNotes, SpotifyMusic, Whispers, RequestsPanel, DiceRoller } from './liveParts';

/**
 * DMScreen — "Book of the Raven" Dungeon-Master interface.
 *
 * Plain React. The ONLY dependency is React itself. All Arcana design-system
 * tokens (colors, type, spacing, effects) and the Google Fonts are injected by
 * the component (see TOKENS_CSS) and scoped under `.arcana-dm-root`, so every
 * inline `var(--…)` resolves without any external stylesheet.
 *
 * Usage:
 *   import DMScreen from './DMScreen';
 *   <DMScreen veil autoReply defaultMode="DESC" />
 *
 * Props:
 *   veil        boolean  CRT scanline overlay        (default true)
 *   autoReply   boolean  simulate an AI reply on Send (default true)
 *   defaultMode 'DESC'|'ACT'|'BOTH'|'META'|'RULES'   (default 'DESC')
 */

/* ------------------------------------------------------------------ *
 * Design tokens + fonts (scoped). Drop this into your own global
 * stylesheet instead if you'd rather not inject per-instance.
 * ------------------------------------------------------------------ */
const TOKENS_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&family=Silkscreen:wght@400;700&display=swap');

.arcana-dm-root {
  --c-blood:#A6032F; --c-blood-deep:#6E021F; --c-ink:#170D26; --c-arcane:#2745F2;
  --c-brass:#A69B03; --c-ember:#F29F05; --c-frost:#AEF5F1; --c-violet:#8901C8; --c-oxblood:#4B1D2A;
  --brass-100:#F4E9A8; --brass-200:#E3CE5C; --brass-300:#C9B321; --brass-400:#A69B03; --brass-500:#7E760A; --brass-600:#564F0B;
  --ink-900:#0C0712; --ink-800:#170D26; --ink-700:#211634; --ink-600:#2E2142; --ink-500:#463757;
  --ink-400:#6C5C7E; --ink-300:#9A8AA8; --ink-200:#C9BBD0; --ink-100:#EFE6D6;
  --wood-dark:#2E1F18; --wood-mid:#5A3D2B; --wood-light:#7A5538;

  --surface-void:var(--ink-900); --surface-base:var(--ink-800); --surface-panel:var(--ink-700);
  --surface-raised:var(--ink-600); --surface-slot:#120A1C; --surface-wood:var(--wood-mid);

  --text-strong:var(--ink-100); --text-body:var(--ink-200); --text-muted:var(--ink-300);
  --text-faint:var(--ink-400); --text-gold:var(--brass-200); --text-on-gold:var(--ink-900);

  --frame-gold:var(--c-brass); --frame-gold-bright:var(--brass-200); --frame-gold-shadow:var(--brass-600);

  --shadow-pixel:3px 3px 0 0 var(--ink-900);
  --glow-brass:0 0 0 2px var(--brass-300), 0 0 12px 0 rgba(227,206,92,0.55);
  --frame-plaque:inset 0 0 0 2px var(--ink-900), inset 0 0 0 4px var(--brass-400), inset 0 0 0 6px var(--ink-900);
  --frame-slot:inset 2px 2px 0 0 rgba(0,0,0,0.55), inset -1px -1px 0 0 rgba(244,233,168,0.08);
  --ease-out:cubic-bezier(0.2,0.8,0.2,1); --dur-fast:90ms; --dur-slow:240ms;

  --radius-chip:2px; --radius-sm:4px; --radius-md:6px;
  --control-h-sm:32px; --control-h:44px; --control-h-lg:56px;

  --font-name:'Pixelify Sans', ui-monospace, monospace;
  --font-ui:'Pixelify Sans', ui-monospace, monospace;
  --font-label:'Silkscreen','Pixelify Sans', monospace;
  --font-mono:'Silkscreen', ui-monospace, monospace;
  --ls-label:0.14em; --ls-caps:0.08em; --ls-name:0.01em;
  --overlay-hover:rgba(244,233,168,0.10);
}
.arcana-dm-root *{box-sizing:border-box;}
.arcana-dm-root textarea, .arcana-dm-root input, .arcana-dm-root button{font-family:inherit;}
.arcana-dm-root textarea::placeholder, .arcana-dm-root input::placeholder{color:var(--text-faint);}
@keyframes arcana-blink{0%,80%,100%{opacity:.2}40%{opacity:1}}
.arcana-dm-root .om-scroll::-webkit-scrollbar{width:10px;height:10px;}
.arcana-dm-root .om-scroll::-webkit-scrollbar-track{background:var(--surface-slot);}
.arcana-dm-root .om-scroll::-webkit-scrollbar-thumb{background:var(--brass-600);border:2px solid var(--surface-slot);border-radius:2px;}
.arcana-dm-root .tx-scanline{background-image:repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px);}
`;

/* ------------------------------------------------------------------ *
 * Button — Arcana primary action control (square, brass, pixel shadow)
 * ------------------------------------------------------------------ */
function Button({ children, variant = 'primary', size = 'md', block = false, disabled = false, type = 'button', onClick, style, ...rest }) {
  const sizes = {
    sm: { height: 'var(--control-h-sm)', padding: '0 14px', fontSize: '11px' },
    md: { height: 'var(--control-h)',    padding: '0 20px', fontSize: '13px' },
    lg: { height: 'var(--control-h-lg)', padding: '0 28px', fontSize: '15px' },
  };
  const variants = {
    primary:   { background: 'var(--c-brass)', color: 'var(--text-on-gold)', border: '2px solid var(--brass-200)', boxShadow: 'var(--shadow-pixel)' },
    secondary: { background: 'transparent', color: 'var(--text-gold)', border: '2px solid var(--c-brass)', boxShadow: 'none' },
    ghost:     { background: 'transparent', color: 'var(--text-body)', border: '2px solid transparent', boxShadow: 'none' },
    danger:    { background: 'var(--c-blood)', color: 'var(--ink-100)', border: '2px solid #C8254C', boxShadow: 'var(--shadow-pixel)' },
  };
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    width: block ? '100%' : 'auto', fontFamily: 'var(--font-label)', letterSpacing: 'var(--ls-label)',
    textTransform: 'uppercase', borderRadius: 'var(--radius-sm)', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1, userSelect: 'none', whiteSpace: 'nowrap',
    transition: 'transform var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
    ...sizes[size], ...variants[variant], ...style,
  };
  const down = (e) => { if (!disabled) { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = 'none'; } };
  const reset = (e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = variants[variant].boxShadow; };
  const over = (e) => { if (!disabled && variant !== 'primary' && variant !== 'danger') e.currentTarget.style.background = 'var(--overlay-hover)'; };
  const out = (e) => { reset(e); if (variant !== 'primary' && variant !== 'danger') e.currentTarget.style.background = variants[variant].background; };
  return (
    <button type={type} disabled={disabled} onClick={onClick} style={base}
      onMouseDown={down} onMouseUp={reset} onMouseEnter={over} onMouseLeave={out} {...rest}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Badge — small status capsule
 * ------------------------------------------------------------------ */
function Badge({ children, tone = 'gold', variant = 'solid', style, ...rest }) {
  const tones = {
    gold:    { c: 'var(--c-brass)',  t: 'var(--ink-900)' },
    blood:   { c: 'var(--c-blood)',  t: 'var(--ink-100)' },
    mana:    { c: 'var(--c-arcane)', t: 'var(--ink-100)' },
    ember:   { c: 'var(--c-ember)',  t: 'var(--ink-900)' },
    magic:   { c: 'var(--c-violet)', t: 'var(--ink-100)' },
    neutral: { c: 'var(--ink-400)',  t: 'var(--ink-100)' },
  };
  const { c, t } = tones[tone] || tones.gold;
  const skin = variant === 'outline'
    ? { background: 'transparent', color: c, border: `2px solid ${c}` }
    : { background: c, color: t, border: `2px solid ${c}` };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px', height: '22px', padding: '0 9px',
      fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: 'var(--ls-label)',
      textTransform: 'uppercase', borderRadius: 'var(--radius-sm)', lineHeight: 1, whiteSpace: 'nowrap',
      ...skin, ...style,
    }} {...rest}>{children}</span>
  );
}

/* ------------------------------------------------------------------ *
 * Static config
 * ------------------------------------------------------------------ */
const MODES = ['DESC', 'ACT', 'BOTH', 'META', 'RULES'];
const PLACEHOLDERS = {
  DESC: 'Describe a scene, location, or moment…',
  ACT:  'Narrate what a character attempts…',
  BOTH: 'Describe the scene and the action together…',
  META: 'Leave a note for the table — not narrated…',
  RULES:'Ask a rules question…',
};
const REPLIES = {
  DESC: [
    'Torchlight gutters against the wet stone. The passage narrows, and the humming stops — replaced by the scrape of something dragging itself upright in the dark ahead.',
    'A vaulted hall opens before you, its floor a mosaic of a sleeping dragon. Roots have split the tiles, and pale fungus glows along the cracks like buried stars.',
  ],
  ACT: [
    'The blade bites true. The goblin folds without a sound, and its lantern tumbles into the chasm — a single falling spark swallowed by the dark below.',
    'A loose plank betrays the step. The bridge lurches, rope shrieking, and every creature on it must grab fast or fall.',
  ],
  BOTH: [
    'As the door groans inward the smell hits first — rot and old incense. Inside, a robed figure turns from a twisted sapling, and its smile does not reach its eyes. “You’re late,” it says.',
  ],
  META: ['Noted. I’ll hold Belak’s offer in reserve until the party reaches the Gulthias Tree.'],
  RULES: [
    'A creature moving at half speed or less ignores the difficult terrain from the rotted planks. Otherwise it’s a DC 12 Acrobatics check or fall prone — and a Dexterity save vs. the drop at the bridge’s center.',
  ],
};

/* shared style fragments ------------------------------------------- */
const S = {
  panel: { background: 'var(--surface-panel)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--frame-plaque)', flex: '0 0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '2px solid var(--frame-gold-shadow)' },
  headLabel: { fontFamily: 'var(--font-label)', fontSize: '12px', letterSpacing: 'var(--ls-label)', textTransform: 'uppercase', color: 'var(--text-gold)' },
  chev: { color: 'var(--text-faint)' },
  slot: { background: 'var(--surface-slot)', boxShadow: 'var(--frame-slot)', border: '2px solid var(--ink-900)', borderRadius: 'var(--radius-sm)' },
  field: { background: 'var(--surface-slot)', boxShadow: 'var(--frame-slot)', border: '2px solid var(--ink-900)', borderRadius: 'var(--radius-sm)', color: 'var(--text-strong)', fontFamily: 'var(--font-ui)', outline: 'none' },
};

/* ------------------------------------------------------------------ *
 * DMScreen
 * ------------------------------------------------------------------ */
export default class DMScreen extends React.Component {
  constructor(props) {
    super(props);
    this.transcriptRef = React.createRef();
    this._timerInt = null;
    this.state = {
      characters: [
        { id:'akwan',  name:'Akwan Akusian', cls:'Paladin',   race:'half-orc',   lvl:6, hp:9,  max:21, ac:18, dc:14,
          abil:[{k:'STR',v:'+4'},{k:'CON',v:'+3'},{k:'CHA',v:'+2'},{k:'WIS',v:'+1'},{k:'DEX',v:'+0'},{k:'INT',v:'−1'}],
          feats:['Lay on Hands (30)','Channel Divinity (1/1)'],
          actions:['Divine Smite','Bless','Cure Wounds','Command','Shield of Faith','Thunderous Smite'] },
        { id:'fiel',   name:'Fiel Amimso',   cls:'Cleric',    race:'wood elf',   lvl:6, hp:24, max:24, ac:16, dc:15,
          abil:[{k:'WIS',v:'+5'},{k:'CON',v:'+2'},{k:'DEX',v:'+2'},{k:'STR',v:'+1'},{k:'CHA',v:'+1'},{k:'INT',v:'+0'}],
          feats:['Channel Divinity (2/2)'],
          actions:['Sacred Flame','Guiding Bolt','Healing Word','Spirit Guardians','Bless','Cure Wounds'] },
        { id:'flicker',name:'Flicker',       cls:'Warlock',   race:'changeling', lvl:6, hp:23, max:24, ac:15, dc:13,
          abil:[{k:'CHA',v:'+5'},{k:'CON',v:'+2'},{k:'DEX',v:'+2'},{k:'INT',v:'+0'},{k:'STR',v:'−1'},{k:'WIS',v:'+2'}],
          feats:['Fey Presence (1/1)'],
          actions:['Eldritch Blast','Guidance','Mage Hand','Minor Illusion','Prestidigitation','Faerie Fire','Hex','Misty Step','Suggestion'] },
        { id:'fordee', name:'Fordee Whax',   cls:'Barbarian', race:'goliath',    lvl:6, hp:28, max:28, ac:14, dc:12,
          abil:[{k:'STR',v:'+5'},{k:'CON',v:'+4'},{k:'DEX',v:'+2'},{k:'WIS',v:'+1'},{k:'INT',v:'−1'},{k:'CHA',v:'−1'}],
          feats:['Rage (3/4)','Reckless Attack'],
          actions:['Reckless Attack','Frenzy','Intimidate','Second Wind'] },
      ],
      expanded: {}, // all party cards start minimised
      selected: 'flicker',
      mode: props.defaultMode || 'DESC',
      draft: '',
      thinking: false,
      replyIdx: 0,
      messages: [], // real narration only — no placeholder transcript
      streamText: '', // partial AI reply while streaming
      timer: { remaining: 0, running: false },
      budget: props.initialBudget || { total: 10, used: 0 },
      requests: [], // live requests render via <RequestsPanel />
      diceLog: [], // live rolls render via the liveDiceLog prop
      notes: '', // live notes render via <StoryNotes />
      meta: [],
      music: [
        { id:1, name:'Tavern Hearth',        playing:false },
        { id:2, name:'Dungeon Depths',       playing:true  },
        { id:3, name:'The Gulthias Tree',    playing:false },
        { id:4, name:'Rain & Distant Bells', playing:false },
      ],
      // right-hand column (requests/messages/timer/dice) starts minimised
      open: { party:true, requests:false, messages:false, timer:false, dice:false, diceLog:false, notes:false, meta:false, music:false },
      info: null, // {title, body} — spell/ability description pop-out
    };
  }

  componentDidMount() { this._scrollBottom(); }
  componentWillUnmount() { if (this._timerInt) clearInterval(this._timerInt); }
  componentDidUpdate(prevProps, prevState) {
    if (!prevState) return;
    if (this.state.messages.length !== prevState.messages.length || this.state.thinking !== prevState.thinking || this.state.streamText !== prevState.streamText) this._scrollBottom();
  }
  _scrollBottom() { const el = this.transcriptRef.current; if (el) el.scrollTop = el.scrollHeight; }
  d20() { return 1 + Math.floor(Math.random() * 20); }

  selectChar(id) { this.setState({ selected: id }); }
  toggleExpand(id) { this.setState(s => ({ selected: id, expanded: { ...s.expanded, [id]: !s.expanded[id] } })); }
  adjustHp(id, delta) {
    this.setState(s => ({
      selected: id,
      characters: s.characters.map(c => c.id === id ? { ...c, hp: Math.max(0, Math.min(c.max, c.hp + delta)) } : c),
    }));
  }

  setMode(m) { this.setState({ mode: m }); }
  onDraft(e) { this.setState({ draft: e.target.value }); }
  onKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); } }
  send() {
    const text = (this.state.draft || '').trim();
    if (!text || this.state.thinking) return;
    const mode = this.state.mode;
    const id = Date.now();
    if (mode === 'META') {
      this.setState(s => ({ meta: [...s.meta, { id, who:'DM', text }], draft:'', open:{ ...s.open, meta:true } }));
      return;
    }
    // LIVE: the real DM prompt tool — stream the reply from the AI worker.
    if (this.props.onAiSend) {
      if (this.state.budget.total > 0 && this.state.budget.used >= this.state.budget.total) return; // budget spent
      this.setState(s => ({ messages: [...s.messages, { id, who:'dm', text }], draft:'', thinking:true, streamText:'' }));
      this.props.onAiSend({ text, mode, onToken: (partial) => this.setState({ streamText: partial }) })
        .then(({ reply, spentUsd }) => {
          const who = mode === 'RULES' ? 'rules' : 'raven';
          this.setState(s => ({
            messages: [...s.messages, { id: id + 1, who, text: reply }],
            thinking: false, streamText: '',
            budget: spentUsd != null ? { ...s.budget, used: spentUsd } : s.budget,
          }));
        })
        .catch((err) => {
          this.setState(s => ({ messages: [...s.messages, { id: id + 1, who:'system', text: '[AI error: ' + err.message + ']' }], thinking:false, streamText:'' }));
        });
      return;
    }
    const used = Math.min(this.state.budget.total, this.state.budget.used + 0.72);
    const auto = this.props.autoReply !== false;
    this.setState(s => ({ messages: [...s.messages, { id, who:'dm', text }], draft:'', budget:{ ...s.budget, used }, thinking: auto }));
    if (auto) {
      setTimeout(() => {
        const rep = this.nextReply(mode);
        this.setState(s => ({ messages: [...s.messages, { id:id+1, who:rep.who, text:rep.text }], thinking:false }));
      }, 850);
    }
  }
  nextReply(mode) {
    const pool = REPLIES[mode] || REPLIES.DESC;
    const idx = this.state.replyIdx % pool.length;
    this.setState(s => ({ replyIdx: s.replyIdx + 1 }));
    const who = mode === 'RULES' ? 'rules' : (mode === 'META' ? 'system' : 'raven');
    return { who, text: pool[idx] };
  }
  undo() {
    // With the real AI, undo removes the last exchange (DM line + reply) and
    // pops it from the conversation history so the model forgets it too.
    if (this.props.onAiUndo && this.state.messages.length >= 2) {
      this.props.onAiUndo();
      this.setState(s => ({ messages: s.messages.slice(0, -2) }));
      return;
    }
    this.setState(s => (s.messages.length ? { messages: s.messages.slice(0, -1) } : {}));
  }

  shortRest() {
    this.setState(s => ({
      characters: s.characters.map(c => ({ ...c, hp: Math.min(c.max, c.hp + Math.ceil(c.max * 0.3)) })),
      messages: [...s.messages, { id:Date.now(), who:'system', text:'The party takes a short rest. Hit dice spent — wounds bound, breath caught.' }],
    }));
  }
  longRest() {
    this.setState(s => ({
      characters: s.characters.map(c => ({ ...c, hp: c.max })),
      messages: [...s.messages, { id:Date.now(), who:'system', text:'Dawn, of a sort. The party takes a long rest and wakes at full strength.' }],
    }));
  }
  endSession() {
    this.pauseTimer();
    // LIVE: hard-save the current story notes under an immutable session record
    let saved = false;
    if (this.props.onEndSession) { try { this.props.onEndSession(); saved = true; } catch (e) { /* ignore */ } }
    const text = saved
      ? '— The session ends. The Raven closes the book — its notes sealed and saved. —'
      : '— Session 7 ends. The Raven closes the book. —';
    this.setState(s => ({ messages: [...s.messages, { id:Date.now(), who:'system', text }] }));
  }

  startTimer() {
    if (this._timerInt) return;
    this._timerInt = setInterval(() => {
      this.setState(s => {
        const r = s.timer.remaining - 1;
        if (r <= 0) { clearInterval(this._timerInt); this._timerInt = null; return { timer:{ remaining:0, running:false } }; }
        return { timer:{ ...s.timer, remaining:r } };
      });
    }, 1000);
    this.setState(s => ({ timer:{ ...s.timer, running:true } }));
  }
  pauseTimer() { if (this._timerInt) { clearInterval(this._timerInt); this._timerInt = null; } this.setState(s => ({ timer:{ ...s.timer, running:false } })); }
  toggleTimer() { if (this.state.timer.running) this.pauseTimer(); else if (this.state.timer.remaining > 0) this.startTimer(); }
  setPreset(sec) { this.pauseTimer(); this.setState({ timer:{ remaining:sec, running:false } }); }
  resetTimer() { this.pauseTimer(); this.setState({ timer:{ remaining:0, running:false } }); }

  resolveReq(id, status) {
    this.setState(s => {
      const r = s.requests.find(x => x.id === id);
      let msg = null;
      if (r) {
        const text = status === 'approved'
          ? (r.type === 'gold' ? `${r.label} released to ${r.char}.` : `${r.label} added to ${r.char}’s pack.`)
          : `${r.char}’s request was denied.`;
        msg = { id:Date.now(), who:'system', text };
      }
      return {
        requests: s.requests.map(x => x.id === id ? { ...x, status } : x),
        messages: msg ? [...s.messages, msg] : s.messages,
      };
    });
  }

  onNotes(e) { this.setState({ notes: e.target.value }); }
  onBudget(e) {
    const v = parseFloat(e.target.value);
    const total = isNaN(v) ? 0 : v;
    if (this.props.onBudgetLimit) this.props.onBudgetLimit(total);
    this.setState(s => ({ budget:{ ...s.budget, total } }));
  }
  resetBudget() {
    if (this.props.onBudgetReset) this.props.onBudgetReset();
    this.setState(s => ({ budget:{ ...s.budget, used:0 } }));
  }

  toggle(panel) { this.setState(s => ({ open:{ ...s.open, [panel]: !s.open[panel] } })); }
  showInfo(title, body) { this.setState({ info: { title, body } }); }
  closeInfo() { this.setState({ info: null }); }
  toggleMusic(id) { this.setState(s => ({ music: s.music.map(t => t.id === id ? { ...t, playing:!t.playing } : { ...t, playing:false }) })); }

  hpColor(pct) {
    if (pct < 15) return 'var(--c-blood)';
    if (pct < 50) return 'var(--c-ember)';
    if (pct < 80) return 'var(--c-arcane)';
    return '#A4E024';
  }

  render() {
    const s = this.state;
    const o = s.open;
    const chev = (open) => (open ? '▾' : '▸');

    /* LIVE: the character-sheet tracker (Party panel) is driven by real data.
       Everything else on this screen is still the prototype's mock data. */
    const party = this.props.liveCharacters || s.characters;
    const diceLog = this.props.liveDiceLog || s.diceLog;
    const adjustHp = this.props.onAdjustHp || ((id, d) => this.adjustHp(id, d));
    // feats/actions may be live objects ({label,name,desc}) or the prototype's
    // plain-string mock — normalise so the clickable chips work for both.
    const chipInfo = (x) => (typeof x === 'string'
      ? { label: x, name: x, desc: 'No description available.' }
      : x);

    /* narration message skins */
    const styleMap = {
      dm:     { background:'var(--surface-raised)', borderLeft:'3px solid var(--c-brass)' },
      raven:  { background:'var(--surface-panel)',  borderLeft:'3px solid var(--c-violet)' },
      rules:  { background:'var(--surface-panel)',  borderLeft:'3px solid var(--c-arcane)' },
      system: { background:'transparent',           borderLeft:'3px solid var(--ink-500)' },
    };
    const speakerMap = { dm:'DM', raven:'THE RAVEN', rules:'RULES', system:'TABLE' };
    const toneMap = { dm:'gold', raven:'magic', rules:'mana', system:'neutral' };

    const tt = s.timer.remaining;
    const timerText = `${Math.floor(tt / 60)}:${String(tt % 60).padStart(2, '0')}`;
    const timerColor = (tt > 0 && tt <= 10) ? 'var(--c-blood)' : 'var(--brass-200)';

    const total = s.budget.total, used = s.budget.used, left = Math.max(0, total - used);
    const budgetPct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
    const pendingCount = this.props.requestCount != null
      ? this.props.requestCount
      : s.requests.filter(r => r.status === 'pending').length;

    return (
      <div className="arcana-dm-root" style={{ height:'100vh', width:'100%' }}>
        <style>{TOKENS_CSS}</style>
        <div style={{ position:'relative', height:'100%', display:'flex', flexDirection:'column', gap:'14px', padding:'18px 22px',
          background:'radial-gradient(120% 120% at 50% -10%, rgba(80,40,100,0.16), rgba(12,7,18,0) 60%), var(--surface-void)',
          color:'var(--text-body)', fontFamily:'var(--font-ui)', fontSize:'15px', overflow:'hidden' }}>

          {this.props.veil !== false && (
            <div className="tx-scanline" style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:0.45, zIndex:60 }} />
          )}

          <div style={{ flex:'1 1 auto', minHeight:0, overflowX:'auto', overflowY:'hidden' }}>
            <div style={{ minWidth:'1140px', height:'100%', display:'flex', flexDirection:'column', gap:'14px' }}>

              {/* ---- Header ---- */}
              <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flex:'0 0 auto' }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:'14px', minWidth:0 }}>
                  <span style={{ fontFamily:'var(--font-name)', fontWeight:700, fontSize:'26px', color:'var(--brass-200)', letterSpacing:'var(--ls-name)', whiteSpace:'nowrap' }}>✦ Book of the Raven</span>
                  <span style={{ fontFamily:'var(--font-label)', fontSize:'11px', letterSpacing:'var(--ls-label)', textTransform:'uppercase', color:'var(--text-faint)', whiteSpace:'nowrap' }}>Session 7 · The Sunless Citadel</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', flex:'0 0 auto' }}>
                  <Button variant="ghost" size="sm">⚙ Setup</Button>
                  <Button variant="secondary" size="sm" onClick={() => this.shortRest()}>Short Rest</Button>
                  <Button variant="secondary" size="sm" onClick={() => this.longRest()}>Long Rest</Button>
                  <Button variant="danger" size="sm" onClick={() => this.endSession()}>End Session</Button>
                  <Button variant="ghost" size="sm">← Home</Button>
                </div>
              </header>
              <div style={{ height:'2px', background:'linear-gradient(90deg, var(--c-brass), var(--brass-600) 40%, transparent)', flex:'0 0 auto', marginTop:'-4px' }} />

              {/* ---- 3-column grid ---- */}
              <div style={{ flex:'1 1 auto', minHeight:0, display:'grid', gridTemplateColumns:'300px minmax(0,1fr) 332px', gap:'18px' }}>

                {/* ===== LEFT COLUMN ===== */}
                <div className="om-scroll" style={{ display:'flex', flexDirection:'column', gap:'14px', minHeight:0, overflowY:'auto', paddingRight:'4px' }}>

                  {/* Party */}
                  <section style={S.panel}>
                    <div onClick={() => this.toggle('party')} style={{ ...S.header, cursor:'pointer' }}>
                      <span style={S.headLabel}>⚔ Party</span>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--text-faint)' }}>{party.length} HEROES</span>
                        <span style={S.chev}>{chev(o.party)}</span>
                      </div>
                    </div>
                    {o.party && (
                      <div style={{ padding:'12px', display:'flex', flexDirection:'column', gap:'10px' }}>
                        {party.map(c => {
                          const downed = c.hp <= 0;
                          const bloodied = !downed && c.hp <= c.max / 2;
                          const pct = c.max > 0 ? Math.max(0, Math.min(100, (c.hp / c.max) * 100)) : 0;
                          const selected = s.selected === c.id;
                          const expanded = !!s.expanded[c.id];
                          return (
                            <div key={c.id} onClick={() => this.selectChar(c.id)} style={{ position:'relative', ...S.slot, padding:'11px 12px', cursor:'pointer', display:'flex', flexDirection:'column', gap:'9px' }}>
                              {selected && <div style={{ position:'absolute', inset:0, borderRadius:'var(--radius-sm)', boxShadow:'var(--glow-brass)', pointerEvents:'none' }} />}
                              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'8px' }}>
                                <div style={{ display:'flex', flexDirection:'column', gap:'3px', minWidth:0 }}>
                                  <span style={{ fontFamily:'var(--font-name)', fontWeight:700, fontSize:'17px', color:'var(--text-strong)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name}</span>
                                  <span style={{ fontFamily:'var(--font-label)', fontSize:'9px', letterSpacing:'var(--ls-caps)', textTransform:'uppercase', color:'var(--text-faint)' }}>{`Lv ${c.lvl} · ${c.cls}`}</span>
                                </div>
                                <div style={{ display:'flex', alignItems:'center', gap:'6px', flex:'0 0 auto' }}>
                                  {downed && <Badge tone="neutral">DOWNED</Badge>}
                                  {bloodied && <Badge tone="blood">BLOODIED</Badge>}
                                  <span style={{ fontFamily:'var(--font-mono)', fontSize:'13px', color:'var(--brass-200)', whiteSpace:'nowrap' }}>{`${c.hp} / ${c.max}`}</span>
                                  <span onClick={(e) => { e.stopPropagation(); this.toggleExpand(c.id); }} style={{ cursor:'pointer', color:'var(--text-gold)', fontSize:'13px', padding:'0 2px', lineHeight:1 }}>{chev(expanded)}</span>
                                </div>
                              </div>
                              <div style={{ position:'relative', height:'14px', ...S.slot, overflow:'hidden' }}>
                                <div style={{ width:`${pct}%`, height:'100%', background:this.hpColor(pct),
                                  boxShadow:'inset 0 -3px 0 0 rgba(0,0,0,0.28), inset 0 2px 0 0 rgba(255,255,255,0.18)',
                                  transition:'width var(--dur-slow) var(--ease-out), background-color var(--dur-slow) var(--ease-out)' }} />
                              </div>
                              <div style={{ display:'flex', gap:'8px', alignItems:'center', justifyContent:'flex-end' }}>
                                <Button variant="danger" size="sm" style={{ width:'36px' }} onClick={(e) => { e.stopPropagation(); adjustHp(c.id, -1); }}>−</Button>
                                <Button variant="secondary" size="sm" style={{ width:'36px' }} onClick={(e) => { e.stopPropagation(); adjustHp(c.id, 1); }}>+</Button>
                              </div>
                              {expanded && (
                                <div style={{ display:'flex', flexDirection:'column', gap:'9px', borderTop:'2px solid var(--frame-gold-shadow)', paddingTop:'10px', marginTop:'1px' }}>
                                  <span style={{ fontFamily:'var(--font-label)', fontSize:'9px', letterSpacing:'var(--ls-caps)', textTransform:'uppercase', color:'var(--text-muted)' }}>{`${(c.race + ' ' + c.cls).toLowerCase()} · AC ${c.ac} · DC ${c.dc}`}</span>
                                  <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                                    {c.abil.map(a => (
                                      <div key={a.k} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'1px', minWidth:'36px', padding:'4px 6px', background:'var(--surface-base)', border:'2px solid var(--ink-900)', borderRadius:'var(--radius-sm)' }}>
                                        <span style={{ fontFamily:'var(--font-label)', fontSize:'8px', letterSpacing:'0.06em', color:'var(--text-faint)' }}>{a.k}</span>
                                        <span style={{ fontFamily:'var(--font-mono)', fontSize:'13px', color:'var(--brass-200)' }}>{a.v}</span>
                                      </div>
                                    ))}
                                  </div>
                                  {c.feats.length > 0 && (
                                    <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                                      {c.feats.map((raw, i) => {
                                        const ft = chipInfo(raw);
                                        return (
                                        <span key={ft.label + '·' + i} onClick={(e) => { e.stopPropagation(); this.showInfo(ft.name, ft.desc); }} title="What does this do?" style={{ cursor:'pointer', fontFamily:'var(--font-ui)', fontSize:'12px', color:'var(--brass-200)', padding:'4px 9px', background:'var(--surface-base)', border:'2px solid var(--brass-600)', borderRadius:'var(--radius-sm)' }}>{ft.label}</span>
                                        );
                                      })}
                                    </div>
                                  )}
                                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                                    {c.actions.map((raw, i) => {
                                      const act = chipInfo(raw);
                                      return (
                                      <span key={act.label + '·' + i} onClick={(e) => { e.stopPropagation(); this.showInfo(act.name, act.desc); }} title="What does this do?" style={{ cursor:'pointer', fontFamily:'var(--font-ui)', fontSize:'12px', color:'var(--text-body)', padding:'4px 9px', ...S.slot }}>{act.label}</span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  {/* Player Dice Log */}
                  <section style={S.panel}>
                    <button onClick={() => this.toggle('diceLog')} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'transparent', border:'none', cursor:'pointer', color:'var(--text-gold)', ...S.headLabel }}>
                      <span>🎲 Player Dice Log ({diceLog.length})</span>
                      <span style={S.chev}>{chev(o.diceLog)}</span>
                    </button>
                    {o.diceLog && (
                      <div className="om-scroll" style={{ maxHeight:'230px', overflowY:'auto', padding:'0 12px 12px', display:'flex', flexDirection:'column', gap:'6px' }}>
                        {diceLog.length === 0 && <div style={{ fontSize:'14px', color:'var(--text-faint)', padding:'4px 2px' }}>No player rolls yet.</div>}
                        {diceLog.map((d, i) => (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'7px 10px', background:'var(--surface-slot)', borderRadius:'var(--radius-sm)', boxShadow:'var(--frame-slot)' }}>
                            <span style={{ flex:1, fontSize:'13px', color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{d.char}</span>
                            <span style={{ fontFamily:'var(--font-mono)', fontSize:'10px', color:'var(--text-faint)' }}>{d.f}</span>
                            <span style={{ fontFamily:'var(--font-mono)', fontSize:'14px', color:'var(--brass-200)', minWidth:'28px', textAlign:'right' }}>{d.r}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Story Notes */}
                  <section style={S.panel}>
                    <button onClick={() => this.toggle('notes')} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'transparent', border:'none', cursor:'pointer', color:'var(--text-gold)', ...S.headLabel }}>
                      <span>📜 Story Notes</span><span style={S.chev}>{chev(o.notes)}</span>
                    </button>
                    {o.notes && <StoryNotes />}
                  </section>

                  {/* Meta Comments */}
                  <section style={S.panel}>
                    <button onClick={() => this.toggle('meta')} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'transparent', border:'none', cursor:'pointer', color:'var(--text-gold)', ...S.headLabel }}>
                      <span>💬 Meta Comments ({s.meta.length})</span><span style={S.chev}>{chev(o.meta)}</span>
                    </button>
                    {o.meta && (
                      <div style={{ padding:'0 12px 12px', display:'flex', flexDirection:'column', gap:'8px' }}>
                        {s.meta.length > 0
                          ? s.meta.map(cm => (
                              <div key={cm.id} style={{ background:'var(--surface-slot)', boxShadow:'var(--frame-slot)', borderRadius:'var(--radius-sm)', padding:'9px 11px', display:'flex', flexDirection:'column', gap:'4px' }}>
                                <span style={{ fontFamily:'var(--font-label)', fontSize:'9px', letterSpacing:'var(--ls-label)', textTransform:'uppercase', color:'var(--text-faint)' }}>{cm.who}</span>
                                <span style={{ fontSize:'14px', color:'var(--text-body)', lineHeight:1.45 }}>{cm.text}</span>
                              </div>
                            ))
                          : <span style={{ fontSize:'14px', color:'var(--text-faint)', lineHeight:1.5 }}>No comments. Use META mode to add.</span>}
                      </div>
                    )}
                  </section>

                  {/* Music */}
                  <section style={S.panel}>
                    <button onClick={() => this.toggle('music')} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'transparent', border:'none', cursor:'pointer', color:'var(--text-gold)', ...S.headLabel }}>
                      <span>♫ Music</span><span style={S.chev}>{chev(o.music)}</span>
                    </button>
                    {o.music && <SpotifyMusic />}
                  </section>

                </div>

                {/* ===== CENTER COLUMN ===== */}
                <div style={{ display:'flex', flexDirection:'column', gap:'14px', minHeight:0 }}>

                  {/* Narration */}
                  <section style={{ ...S.panel, flex:'1 1 auto', minHeight:0, display:'flex', flexDirection:'column' }}>
                    <div style={{ ...S.header, flex:'0 0 auto' }}>
                      <span style={S.headLabel}>✦ Narration</span>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                        <Button variant="ghost" size="sm" onClick={() => this.undo()}>↩ Undo</Button>
                        <Button variant="ghost" size="sm" disabled>↪ Redo</Button>
                      </div>
                    </div>
                    <div ref={this.transcriptRef} className="om-scroll" style={{ flex:'1 1 auto', minHeight:0, overflowY:'auto', padding:'18px', display:'flex', flexDirection:'column', gap:'16px' }}>
                      {s.messages.map(m => (
                        <div key={m.id} style={{ display:'flex', flexDirection:'column', gap:'6px', alignItems:'flex-start' }}>
                          <Badge tone={toneMap[m.who] || 'magic'}>{speakerMap[m.who] || 'THE RAVEN'}</Badge>
                          <div style={{ ...(styleMap[m.who] || styleMap.raven), padding:'11px 14px', borderRadius:'var(--radius-sm)', color:'var(--text-body)', fontSize:'15px', lineHeight:1.55, maxWidth:'92%' }}>{m.text}</div>
                        </div>
                      ))}
                      {s.thinking && (
                        <div style={{ display:'flex', flexDirection:'column', gap:'6px', alignItems:'flex-start' }}>
                          <Badge tone="magic">THE RAVEN</Badge>
                          {s.streamText ? (
                            <div style={{ ...styleMap.raven, padding:'11px 14px', borderRadius:'var(--radius-sm)', color:'var(--text-body)', fontSize:'15px', lineHeight:1.55, maxWidth:'92%' }}>{s.streamText}</div>
                          ) : (
                            <div style={{ display:'flex', gap:'5px', padding:'14px', background:'var(--surface-panel)', borderLeft:'3px solid var(--c-violet)', borderRadius:'var(--radius-sm)' }}>
                              <span style={{ width:'7px', height:'7px', background:'var(--c-violet)', animation:'arcana-blink 1.2s infinite' }} />
                              <span style={{ width:'7px', height:'7px', background:'var(--c-violet)', animation:'arcana-blink 1.2s infinite .2s' }} />
                              <span style={{ width:'7px', height:'7px', background:'var(--c-violet)', animation:'arcana-blink 1.2s infinite .4s' }} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Composer */}
                  <section style={{ ...S.panel, padding:'14px' }}>
                    <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'10px' }}>
                      {MODES.map(m => (
                        <Button key={m} variant={s.mode === m ? 'primary' : 'ghost'} size="sm" onClick={() => this.setMode(m)}>{m}</Button>
                      ))}
                    </div>
                    <textarea value={s.draft} onChange={(e) => this.onDraft(e)} onKeyDown={(e) => this.onKey(e)} placeholder={PLACEHOLDERS[s.mode] || PLACEHOLDERS.DESC} rows={3}
                      style={{ width:'100%', resize:'none', minHeight:'74px', ...S.field, fontSize:'15px', lineHeight:1.4, padding:'10px 12px' }} />
                    <div style={{ display:'flex', alignItems:'flex-end', gap:'12px', marginTop:'10px' }}>
                      <div style={{ flex:'1 1 auto', display:'flex', flexDirection:'column', gap:'5px', minWidth:0 }}>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--text-muted)' }}>{`$${left.toFixed(2)} left of $${total.toFixed(2)} · $${used.toFixed(2)} used`}</span>
                        <div style={{ height:'6px', background:'var(--surface-slot)', borderRadius:'var(--radius-chip)', boxShadow:'var(--frame-slot)', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${budgetPct}%`, background:'var(--c-ember)', transition:'width var(--dur-slow) var(--ease-out)' }} />
                        </div>
                      </div>
                      <input type="number" value={s.budget.total} onChange={(e) => this.onBudget(e)} style={{ width:'62px', height:'44px', ...S.field, fontFamily:'var(--font-mono)', fontSize:'14px', textAlign:'center' }} />
                      <Button variant="ghost" size="md" onClick={() => this.resetBudget()}>Reset</Button>
                      <Button variant="primary" size="md" onClick={() => this.send()}>Send ✦</Button>
                    </div>
                  </section>

                </div>

                {/* ===== RIGHT COLUMN ===== */}
                <div className="om-scroll" style={{ display:'flex', flexDirection:'column', gap:'14px', minHeight:0, overflowY:'auto', paddingRight:'4px' }}>

                  {/* Requests */}
                  <section style={S.panel}>
                    <div onClick={() => this.toggle('requests')} style={{ ...S.header, cursor:'pointer' }}>
                      <span style={S.headLabel}>⚑ Requests</span>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <Badge tone={pendingCount > 0 ? 'ember' : 'neutral'}>{pendingCount > 0 ? `${pendingCount} PENDING` : 'CLEAR'}</Badge>
                        <span style={S.chev}>{chev(o.requests)}</span>
                      </div>
                    </div>
                    {o.requests && <RequestsPanel />}
                  </section>

                  {/* Messages — live private player<->DM whispers */}
                  <section style={S.panel}>
                    <div onClick={() => this.toggle('messages')} style={{ ...S.header, cursor:'pointer' }}>
                      <span style={S.headLabel}>✉ Messages</span>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <Badge tone="neutral">PRIVATE</Badge>
                        <span style={S.chev}>{chev(o.messages)}</span>
                      </div>
                    </div>
                    {o.messages && <Whispers />}
                  </section>

                  {/* Encounter Timer */}
                  <section style={S.panel}>
                    <div onClick={() => this.toggle('timer')} style={{ ...S.header, cursor:'pointer' }}>
                      <span style={S.headLabel}>⏱ Encounter Timer</span>
                      <span style={S.chev}>{chev(o.timer)}</span>
                    </div>
                    {o.timer && (
                      <div style={{ padding:'14px' }}>
                        <div style={{ textAlign:'center', fontFamily:'var(--font-mono)', fontSize:'48px', lineHeight:1, color:timerColor, padding:'6px 0 14px' }}>{timerText}</div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'6px', marginBottom:'8px' }}>
                          <Button variant="ghost" size="sm" block onClick={() => this.setPreset(30)}>0:30</Button>
                          <Button variant="ghost" size="sm" block onClick={() => this.setPreset(60)}>1:00</Button>
                          <Button variant="ghost" size="sm" block onClick={() => this.setPreset(120)}>2:00</Button>
                          <Button variant="ghost" size="sm" block onClick={() => this.setPreset(300)}>5:00</Button>
                        </div>
                        <div style={{ display:'flex', gap:'6px' }}>
                          <div style={{ flex:2 }}><Button variant="primary" size="sm" block onClick={() => this.toggleTimer()}>{s.timer.running ? 'Pause' : 'Start'}</Button></div>
                          <div style={{ flex:1 }}><Button variant="secondary" size="sm" block onClick={() => this.resetTimer()}>Reset</Button></div>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Dice Roller — the player screen's 3D dice, for the DM */}
                  <section style={S.panel}>
                    <div onClick={() => this.toggle('dice')} style={{ ...S.header, cursor:'pointer' }}>
                      <span style={S.headLabel}>⚄ Dice Roller</span>
                      <span style={S.chev}>{chev(o.dice)}</span>
                    </div>
                    {o.dice && <DiceRoller />}
                  </section>

                </div>

              </div>
            </div>
          </div>
        </div>

        {s.info && (
          <div onClick={() => this.closeInfo()} style={{ position:'absolute', inset:0, zIndex:80, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(6,3,10,0.72)', padding:'24px' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ maxWidth:'420px', width:'100%', background:'var(--surface-panel)', border:'2px solid var(--brass-600)', borderRadius:'var(--radius-md)', boxShadow:'var(--glow-brass)', padding:'18px 20px', display:'flex', flexDirection:'column', gap:'12px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px' }}>
                <span style={{ fontFamily:'var(--font-name)', fontWeight:700, fontSize:'19px', color:'var(--brass-200)', letterSpacing:'var(--ls-name)' }}>{s.info.title}</span>
                <span onClick={() => this.closeInfo()} style={{ cursor:'pointer', color:'var(--text-gold)', fontSize:'18px', lineHeight:1, padding:'0 2px' }}>✕</span>
              </div>
              <div style={{ fontFamily:'var(--font-ui)', fontSize:'14px', lineHeight:1.5, color:'var(--text-body)' }}>{s.info.body}</div>
              <div style={{ alignSelf:'flex-end' }}><Button variant="secondary" size="sm" onClick={() => this.closeInfo()}>Close</Button></div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
