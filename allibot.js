/* ═══════════════════════════════════════════
   ALLI CHATBOT — No API, Rule-Based
   Covers: Crypto, Amazon picks, Hair/booking,
   Web3 education, About Alli, General
   Fallback: directs to alicialifeinstyle@gmail.com
═══════════════════════════════════════════ */

const ALLI_EMAIL = 'alicialifeinstyle@gmail.com';

const KNOWLEDGE = [
  // ── ABOUT ALLI ──
  { keys: ['who are you','who is alli','about you','tell me about','what do you do','what is this site'],
    answer: `I'm Alli — hair colorist, crypto educator, Amazon influencer, and content creator based in West Palm Beach, FL. I build brands, teach crypto in plain English, and share beauty, home, and everything in between. This site is my home base.` },

  { keys: ['social media','follow you','instagram','tiktok','youtube','where can i find'],
    answer: `Here's where to find me:\n• Instagram (Amazon/beauty): @aliciareviewsit\n• Instagram (hair): @westpalmhairpro\n• Instagram (AI/dev): @alliopsec\n• TikTok (hair/lifestyle): @fadesandhairshades\n• TikTok (AI/dev): @alliopsdev\n• YouTube: @AlliOpsDev\n• And Wynston my goldendoodle: @official_winniethepooch` },

  { keys: ['contact','email','reach you','get in touch','message you','collaborate','collab','work with'],
    answer: `Best way to reach me depends what you need:\n• Brand collabs & business: email alicialifeinstyle@gmail.com\n• Hair bookings: DM @westpalmhairpro on Instagram or book via Vagaro\n• Crypto/Web3 questions: DM @alliopsec on Instagram\n• Amazon partnerships: DM @aliciareviewsit` },

  // ── HAIR / BOOKING ──
  { keys: ['book','appointment','booking','schedule','hair appointment','come in','client'],
    answer: `To book with me at Palm Beach Hair Co.:\n1. DM me on Instagram @westpalmhairpro\n2. Or search "Palm Beach Hair Co." under Alicia Ann on Google Maps to find my Vagaro booking link\n\nNew clients start with a consultation so we can align on the vision before touching color.` },

  { keys: ['where are you located','location','palm beach','west palm','florida','salon'],
    answer: `I'm based in West Palm Beach, FL — Palm Beach Hair Co. servicing the greater Palm Beach area. DM @westpalmhairpro on Instagram for exact location and availability.` },

  { keys: ['how much','price','cost','rates','pricing'],
    answer: `Pricing varies by service and hair length/density. Best way to get an accurate quote is to DM @westpalmhairpro on Instagram with a photo of your current hair and what you're going for — I'll be straight with you about what's realistic and what it'll cost.` },

  { keys: ['foilayage','balayage','highlights','blonde','lightening'],
    answer: `Foilayage is my specialty — it's a hybrid technique combining foils and freehand painting for a natural, dimensional result that grows out beautifully without a hard line. I use Redken Shades EQ for toning and DIA Light for full color services. DM @westpalmhairpro to book.` },

  { keys: ['extensions','tape in','weft','ibe','length','add length'],
    answer: `I install tape-in extensions and IBE weft extensions. Both are great for adding length and volume. I recommend IBE wefts for clients wanting a more seamless, comfortable install. DM @westpalmhairpro for a consultation — extensions require an in-person assessment before booking.` },

  { keys: ['shades eq','redken','dia light','color formul','gloss'],
    answer: `Shades EQ is a Redken demi-permanent gloss — it adds shine, tones brassiness, and refreshes color without lifting. DIA Light by L'Oréal is a liquid hair color I use for full color services. Both are professional salon formulas. I document every formula so clients know exactly what went on their hair.` },

  // ── AMAZON ──
  { keys: ['amazon','storefront','picks','affiliate','shop','recommendation','find products','buy'],
    answer: `My Amazon storefront is at amazon.com/shop/createwithalli — I have picks across five niches:\n• Beauty (salon-quality at home)\n• Tech & creator gear\n• Home & lifestyle\n• Salon professional supplies\n• Health & wellness\n\nEverything in my storefront is something I actually use. My goldendoodle Wynston also has her own storefront at amazon.com/shop/doodlechronicles.` },

  { keys: ['spf','sunscreen','sun protection','skincare'],
    answer: `My go-to SPF is Supergoop Unseen Sunscreen — no white cast, works great under makeup or alone. Florida sun is not optional. It's in my Amazon beauty picks. Link: amazon.com/shop/createwithalli?tag=alicialindsle-20` },

  { keys: ['hair care','shampoo','conditioner','leave in','hair product'],
    answer: `My hair care picks are in my Amazon salon professional and beauty sections. I lean toward products safe for color-treated hair — extensions and color work need extra care. Check amazon.com/shop/createwithalli?tag=alicialindsle-20 for my current favorites.` },

  { keys: ['ledger','hardware wallet','crypto hardware'],
    answer: `I use a Ledger hardware wallet — it stores your crypto keys offline so even if your computer gets hacked, your crypto is safe. It's in my Tech & Web3 Amazon picks. Link: amazon.com/shop/createwithalli?tag=alicialindsle-20` },

  { keys: ['father','dad gift','gift for him','men gift','holiday gift'],
    answer: `I wrote a full holiday gift guide for men on my blog at createwithalli.wordpress.com — covers every age group from teens to 60+, all Amazon picks with honest opinions. The YETI Rambler Tumbler is my Father's Day #1 right now.` },

  // ── CRYPTO BASICS ──
  { keys: ['what is crypto','what is cryptocurrency','what is bitcoin','explain bitcoin','bitcoin basics'],
    answer: `Bitcoin is digital money that exists on a shared public record book called a blockchain — no bank, no government controls it. Only 21 million will ever exist, which makes it scarce by design. The price goes up and down a lot — it's speculative. Understand what you're buying before you buy it.\n\nWant the full breakdown? Check my free crypto bootcamp at createwithalli.com/pages/learn.html` },

  { keys: ['what is ethereum','eth','ether'],
    answer: `Ethereum is like Bitcoin but with a superpower — developers can build apps on top of it. Think of Bitcoin as a calculator and Ethereum as a smartphone. Most of the interesting crypto tools (DeFi, NFTs, creator tools) are built on Ethereum or networks like it.\n\nI work mainly on Base, which is built on top of Ethereum — faster and cheaper to use.` },

  { keys: ['what is base','base chain','base blockchain','coinbase chain'],
    answer: `Base is a blockchain built by Coinbase on top of Ethereum. It's faster and cheaper — transaction fees are cents, not dollars. I do most of my crypto activity on Base. It's where a lot of creators are building right now. Think of Ethereum as the highway and Base as the express lane.` },

  { keys: ['what is defi','defi','decentralized finance','lending crypto','borrowing crypto'],
    answer: `DeFi is banking without a bank. You can lend, borrow, and swap crypto directly with other people using software — no middleman, no approval required. The trade-off is there's no customer service if something goes wrong. Start small, read what you're approving, and never put in more than you can afford to lose.\n\nFull DeFi module in my free bootcamp: createwithalli.com/pages/learn.html#module-5` },

  { keys: ['what is a wallet','crypto wallet','how does a wallet work','wallet'],
    answer: `A crypto wallet doesn't hold your crypto — your crypto lives on the blockchain. A wallet holds the private key that proves you own it. There are two types:\n• Custodial (like Coinbase) — they hold your keys, easier but you're trusting a company\n• Non-custodial (like MetaMask) — you hold your own keys, more control, more responsibility\n\nFull wallet module: createwithalli.com/pages/learn.html#module-4` },

  { keys: ['seed phrase','recovery phrase','12 words','24 words','mnemonic'],
    answer: `Your seed phrase (12 or 24 words) is your master password. Anyone who has it owns everything in your wallet — no exceptions. Write it on paper. Store it somewhere secure. Never type it into any website. Never share it with anyone — not even someone claiming to be support. This is the most important thing in crypto.` },

  { keys: ['how to buy crypto','how to start','getting started crypto','first crypto','buy bitcoin'],
    answer: `Here's how to start safely:\n1. Buy a small amount ($20-50) on a reputable exchange — Coinbase, Kraken, or Gemini\n2. Don't put in more than you can afford to lose\n3. Set up a non-custodial wallet (MetaMask or Rabby) when you're ready to explore further\n4. Learn before you go bigger\n\nFull getting-started guide: createwithalli.com/pages/learn.html#module-6` },

  { keys: ['is crypto safe','is bitcoin safe','should i invest','crypto scam','rug pull'],
    answer: `Honest answer: crypto is speculative and risky. Prices move dramatically. Scams are everywhere. The golden rules:\n• Never invest more than you can lose entirely\n• Anyone promising guaranteed returns is lying\n• Never share your seed phrase — ever\n• Research before you buy\n\nI teach it because I believe in financial education, not because I think everyone should put their savings in. Know what you're doing first.` },

  { keys: ['nft','nfts','what is an nft','digital art'],
    answer: `An NFT is a digital ownership record on a blockchain. It doesn't mean you own an image in the traditional sense — it means you own a record saying you have the original. Whether that record is worth anything depends on what the community agrees it's worth. A lot of NFTs are worth very little now. That's just how it went.` },

  { keys: ['what is a token','token','alt coin','altcoin'],
    answer: `A token is a digital asset that runs on top of an existing blockchain (like Ethereum or Base). Bitcoin is a coin (its own blockchain). Tokens are built on top of other blockchains. Most crypto projects you see listed on exchanges are tokens. Quality varies enormously — research the team, the use case, and the tokenomics before buying anything.` },

  { keys: ['gas fee','gas fees','transaction fee','network fee'],
    answer: `Gas fees are what you pay to process a transaction on a blockchain — it's like a tip to the computers that verify it. On Ethereum mainnet these can be expensive ($5-50+). On Base, they're cents. That's one reason I use Base — it makes everyday transactions actually affordable.` },

  { keys: ['shefi','she fi','web3 education','women in crypto'],
    answer: `SheFi is one of the most respected crypto education programs in the world — built to close the gender gap in the industry. I graduated Season 16 in May 2026. It covered everything from how crypto works to token design, governance, and DeFi tools. My certificate is on the site under credentials.` },

  { keys: ['allitrade','alli trade','trading signals','signal','crypto alerts'],
    answer: `ALLITRADE is my personal crypto alert tool — it watches price movement, market mood, and activity across the coins I track, then flags potential opportunities. I walk through the reasoning in plain English every time. It's educational only, not financial advice.` },

  // ── WEB3 / AI ──
  { keys: ['alliops','alli ops','ai agents','local ai','hermes'],
    answer: `AlliOps is my AI development brand — I build and run local AI agents (using Hermes) that handle content, crypto signals, and automation. My dev/tech content is on @alliopsdev (TikTok) and @alliopsec (Instagram). I'm also Harvard CS50 enrolled and CS50 Cybersecurity is next.` },

  { keys: ['claude','claude 101','anthropic','ai certificate'],
    answer: `I'm Claude 101 certified by Anthropic (April 2026) — that's the certification for working with Claude AI effectively. It's on my credentials page. I use Claude heavily in my AlliOps agent stack and for content creation. SheFi + Claude 101 + CS50 — the stack is real.` },

  { keys: ['harvard','cs50','computer science','cybersecurity','coding'],
    answer: `I'm currently enrolled in Harvard's CS50 (computer science fundamentals) via Harvard Online/edX. CS50 Cybersecurity is next after I complete CS50x. I started as a hairstylist and built my way into tech — the path is nonlinear and that's the point.` },

  // ── BLOG ──
  { keys: ['blog','blog post','read','article','gift guide'],
    answer: `My blog is at createwithalli.wordpress.com — I post gift guides, product deep-dives, and honest reviews there. My current post is a 2025 Holiday Gift Guide for men of every age. More content dropping regularly.` },

  // ── WYNSTON ──
  { keys: ['wynston','winnie','goldendoodle','dog','pet','puppy'],
    answer: `Wynston (aka Winnie) is my goldendoodle and the Chief Mood Officer at AlliOps. She has her own Amazon storefront at amazon.com/shop/doodlechronicles and her own Instagram at @official_winniethepooch. She takes her job very seriously.` },

  // ── LEARN / BOOTCAMP ──
  { keys: ['bootcamp','learn crypto','crypto course','free course','tutorial','how to learn'],
    answer: `I have a free crypto bootcamp right here on the site — 6 modules, no jargon:\n1. What money actually is\n2. Bitcoin basics\n3. Ethereum & what Base is\n4. Wallets & keeping your crypto safe\n5. DeFi — banking without a bank\n6. How to actually get started\n\nStart here: createwithalli.com/pages/learn.html` },
];

// ── Intent matching ──
function findAnswer(input) {
  const q = input.toLowerCase().trim();
  if (!q || q.length < 2) return null;

  // Score each entry
  let best = null, bestScore = 0;
  for (const entry of KNOWLEDGE) {
    let score = 0;
    for (const key of entry.keys) {
      if (q.includes(key)) {
        score += key.split(' ').length * 2; // longer matches score higher
      }
      // Partial word match
      const words = key.split(' ');
      for (const w of words) {
        if (w.length > 3 && q.includes(w)) score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return bestScore >= 1 ? best : null;
}

// ── Format answer for chat ──
function formatAnswer(text) {
  return text
    .replace(/\n/g, '<br>')
    .replace(/(amazon\.com\/shop\/[^\s<"]+)/g, '<a href="https://$1" target="_blank" rel="noopener" style="color:var(--teal)">$1</a>')
    .replace(/(createwithalli\.com\/[^\s<"]+)/g, '<a href="https://$1" target="_blank" rel="noopener" style="color:var(--teal)">$1</a>')
    .replace(/(createwithalli\.wordpress\.com)/g, '<a href="https://$1" target="_blank" rel="noopener" style="color:var(--teal)">$1</a>')
    .replace(/@([a-zA-Z0-9_]+)/g, '<strong style="color:var(--gold)">@$1</strong>');
}

// ── Fallback message ──
function fallbackMessage(question) {
  return `I don't have a specific answer for that one, but Alli does! Send your question directly to <a href="mailto:${ALLI_EMAIL}?subject=Question from the site&body=${encodeURIComponent(question)}" style="color:var(--teal)">${ALLI_EMAIL}</a> and she'll get back to you.`;
}

// ── Greeting ──
const GREETINGS = ['hey','hi','hello','sup','hola','yo','good morning','good afternoon','hey alli'];
function isGreeting(q) {
  return GREETINGS.some(g => q.trim().toLowerCase().startsWith(g));
}

// ── Bot response ──
function getBotResponse(input) {
  const q = input.trim();
  if (!q) return null;

  if (isGreeting(q)) {
    return `Hey! I'm Alli's site assistant. I can help with:\n• Crypto questions (Bitcoin, Ethereum, wallets, DeFi)\n• Amazon picks & storefront\n• Hair services & booking\n• About Alli & AlliOps\n\nWhat do you want to know?`;
  }

  const match = findAnswer(q);
  if (match) return match.answer;
  return null; // triggers fallback
}

// ── CHAT UI ──
function initAlliBot() {
  // Inject chat widget HTML
  const widget = document.createElement('div');
  widget.id = 'allibot-widget';
  widget.innerHTML = `
    <button id="allibot-toggle" aria-label="Chat with Alli" aria-expanded="false">
      <span class="bot-avatar">✦</span>
      <span class="bot-label">Ask Alli</span>
      <span class="bot-close" hidden>✕</span>
    </button>
    <div id="allibot-window" role="dialog" aria-label="Alli chatbot" hidden>
      <div class="bot-header">
        <div class="bot-header-info">
          <span class="bot-name">Alli</span>
          <span class="bot-status"><span class="dot"></span>Here to help</span>
        </div>
      </div>
      <div id="bot-messages" class="bot-messages" aria-live="polite">
        <div class="bot-msg bot">
          Hey! I'm Alli's site assistant — ask me anything about crypto, Amazon picks, hair services, or AlliOps. I'll answer in plain English or send you straight to Alli.
        </div>
      </div>
      <div class="bot-quick-btns" id="botQuickBtns">
        <button onclick="sendQuick('How do I book a hair appointment?')">📅 Book hair</button>
        <button onclick="sendQuick('What is Bitcoin?')">₿ Bitcoin basics</button>
        <button onclick="sendQuick('Show me Amazon picks')">🛍️ Amazon picks</button>
        <button onclick="sendQuick('What is DeFi?')">💸 DeFi explained</button>
      </div>
      <form id="bot-form" class="bot-form" onsubmit="sendBotMessage(event)">
        <input id="bot-input" type="text" placeholder="Ask anything…" autocomplete="off" aria-label="Your question" maxlength="200" />
        <button type="submit" aria-label="Send">→</button>
      </form>
    </div>
  `;
  document.body.appendChild(widget);

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #allibot-widget {
      position: fixed; bottom: 24px; right: 24px;
      z-index: 9999; font-family: 'DM Sans', sans-serif;
    }
    #allibot-toggle {
      background: linear-gradient(135deg, var(--teal, #00c9b1), var(--teal-dim, #009e8c));
      color: var(--navy, #0d1b2e);
      border: none; border-radius: 999px;
      padding: 12px 20px 12px 14px;
      display: flex; align-items: center; gap: 8px;
      font-size: 0.875rem; font-weight: 700;
      cursor: pointer; box-shadow: 0 4px 20px rgba(0,201,177,0.35);
      transition: transform 0.18s ease, box-shadow 0.18s ease;
    }
    #allibot-toggle:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(0,201,177,0.45); }
    .bot-avatar { font-size: 1rem; }
    .bot-close  { font-size: 0.75rem; }

    #allibot-window {
      position: absolute; bottom: 64px; right: 0;
      width: 340px; max-height: 520px;
      background: var(--navy-mid, #152338);
      border: 1px solid var(--navy-border, #1e3654);
      border-radius: 16px;
      display: flex; flex-direction: column;
      box-shadow: 0 16px 48px rgba(0,0,0,0.4);
      overflow: hidden;
    }
    #allibot-window[hidden] { display: none; }

    .bot-header {
      background: linear-gradient(135deg, var(--teal-dim, #009e8c), var(--teal, #00c9b1));
      padding: 14px 16px;
    }
    .bot-name   { font-size: 0.9rem; font-weight: 700; color: var(--navy, #0d1b2e); display: block; }
    .bot-status { font-size: 0.7rem; color: rgba(13,27,46,0.7); display: flex; align-items: center; gap: 4px; }
    .bot-status .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--navy, #0d1b2e); opacity: 0.6; }

    .bot-messages {
      flex: 1; overflow-y: auto; padding: 12px;
      display: flex; flex-direction: column; gap: 8px;
      scroll-behavior: smooth;
    }
    .bot-msg {
      max-width: 88%; padding: 10px 13px;
      font-size: 0.82rem; line-height: 1.6; border-radius: 12px;
      word-break: break-word;
    }
    .bot-msg.bot  { background: var(--navy-card, #1a2d45); color: var(--cream, #f5f0e8); align-self: flex-start; border-bottom-left-radius: 4px; }
    .bot-msg.user { background: var(--teal-dim, #009e8c); color: var(--navy, #0d1b2e); align-self: flex-end; border-bottom-right-radius: 4px; font-weight: 600; }
    .bot-msg.typing { opacity: 0.5; font-style: italic; }

    .bot-quick-btns {
      display: flex; flex-wrap: wrap; gap: 6px;
      padding: 6px 12px 0;
    }
    .bot-quick-btns button {
      font-size: 0.72rem; font-weight: 600;
      padding: 5px 10px; border-radius: 999px;
      border: 1px solid var(--navy-border, #1e3654);
      background: none; color: var(--muted, #7a9ab8);
      cursor: pointer; transition: border-color 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .bot-quick-btns button:hover { border-color: var(--teal, #00c9b1); color: var(--teal, #00c9b1); }

    .bot-form {
      display: flex; gap: 8px; padding: 10px 12px;
      border-top: 1px solid var(--navy-border, #1e3654);
    }
    .bot-form input {
      flex: 1; background: var(--navy-card, #1a2d45);
      border: 1px solid var(--navy-border, #1e3654);
      border-radius: 8px; padding: 8px 12px;
      font-size: 0.82rem; color: var(--cream, #f5f0e8);
      outline: none; font-family: inherit;
    }
    .bot-form input:focus { border-color: var(--teal, #00c9b1); }
    .bot-form input::placeholder { color: var(--muted, #7a9ab8); }
    .bot-form button {
      background: var(--teal, #00c9b1); color: var(--navy, #0d1b2e);
      border: none; border-radius: 8px; padding: 8px 14px;
      font-size: 1rem; font-weight: 700; cursor: pointer;
      transition: opacity 0.15s;
    }
    .bot-form button:hover { opacity: 0.85; }

    @media (max-width: 400px) {
      #allibot-window { width: calc(100vw - 32px); right: -8px; }
    }
  `;
  document.head.appendChild(style);

  // Toggle open/close
  document.getElementById('allibot-toggle').addEventListener('click', toggleBot);
}

function toggleBot() {
  const win    = document.getElementById('allibot-window');
  const toggle = document.getElementById('allibot-toggle');
  const label  = toggle.querySelector('.bot-label');
  const close  = toggle.querySelector('.bot-close');
  const avatar = toggle.querySelector('.bot-avatar');
  const isOpen = !win.hidden;

  win.hidden = isOpen;
  toggle.setAttribute('aria-expanded', String(!isOpen));
  label.hidden  = !isOpen;
  close.hidden  = isOpen;
  avatar.hidden = !isOpen;

  if (!isOpen) {
    document.getElementById('bot-input').focus();
  }
}

function addMessage(text, role) {
  const msgs = document.getElementById('bot-messages');
  const div  = document.createElement('div');
  div.className = `bot-msg ${role}`;
  div.innerHTML  = role === 'bot' ? formatAnswer(text) : escapeHtml(text);
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;

  // Hide quick buttons after first user message
  if (role === 'user') {
    const qb = document.getElementById('botQuickBtns');
    if (qb) qb.style.display = 'none';
  }
  return div;
}

function escapeHtml(text) {
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function sendBotMessage(e) {
  e.preventDefault();
  const input = document.getElementById('bot-input');
  const q = input.value.trim();
  if (!q) return;
  input.value = '';

  addMessage(q, 'user');

  // Typing indicator
  const typing = addMessage('…', 'bot typing');

  setTimeout(() => {
    typing.remove();
    const answer = getBotResponse(q);
    if (answer) {
      addMessage(answer, 'bot');
    } else {
      addMessage(fallbackMessage(q), 'bot');
    }
  }, 480);
}

function sendQuick(text) {
  document.getElementById('bot-input').value = text;
  document.getElementById('bot-form').dispatchEvent(new Event('submit', {bubbles:true, cancelable:true}));
}

// Auto-init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAlliBot);
} else {
  initAlliBot();
}
