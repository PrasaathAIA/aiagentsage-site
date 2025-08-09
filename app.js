/*
  Front-end logic for the AIAGENTSAGE agent hub.

  The AGENTS array defines each available agent: its ID, display name, a hint for user input,
  a system message describing the agent's persona, and a template function to build the actual
  prompt sent to the OpenAI API. Feel free to add, remove, or modify agents here.

  BACKEND_URL must point to your deployed serverless proxy (e.g. Cloudflare Worker or Vercel Function)
  which securely holds your OpenAI API key. Do not expose your key in client-side JavaScript!
*/

// TODO: Replace this URL with your serverless endpoint (e.g. https://aiagentsage-proxy.<your-handle>.workers.dev/api/agent)
const BACKEND_URL = tile business agents
const AGENTS = [
  {
    id: "lead-researcher",
    name: "Lead Researcher",
    hint: "Describe your ideal customer and region.",
    system: "You are an analyst who profiles ICPs and lists potential leads with rationales.",
    template: (input) => `Profile the ICP and list 10 prospect types for: ${input}. Return bullets.`
  },
  {
    id: "cold-emailer",
    name: "Cold Email Writer",
    hint: "Paste your offer or product details.",
    system: "You write short, punchy cold emails with one CTA.",
    template: (input) => `Write 3 cold email variants under 120 words for: ${input}.`
  },
  {
    id: "followup-generator",
    name: "Follow-up Sequencer",
    hint: "What did they not reply to?",
 
    system: "Polite, persistent follow-ups with value add.",
    template: (i) => `Create a 4-step follow-up sequence for this prior email thread/context: ${i}.`
  },
  {
    id: "support-macro",
    name: "Support Macro Builder",
    hint: "Paste a common support issue.",
    system: "Create reusable support macros and troubleshooting trees.",
    template: (i) => `Turn this issue into support macros and a decision tree: ${i}.`
  },
  {
    id: "policy-summarizer",
    name: "Policy Summarizer",
    hint: "Paste a long policy or ToS.",
    system: "Summarize with key risks and actions.",
    template: (i) => `Summarize with bullets, highlight obligations and risks: ${i}.`
  },
  {
    id: "brand-voice",
    name: "Brand Voice Maker",
    hint: "Paste 2–3 samples of your content.",
    system: "Extract brand voice and style guide.",
    template: (i) => `Derive a style guide (tone, phrases, do/don't) from: ${i}.`
  },
  {
    id: "blog-outliner",
    name: "Blog Outliner",
    hint: "Give a topic & audience.",
    system: "Create SEO-driven outlines with intent mapping.",
    template: (i) => `Outline an SEO post (H2/H3, FAQs) about: ${i}.`
  },
  {
    id: "product-copy",
    name: "Product Copy",
    hint: "Describe your product.",
    system: "Write conversion-focused copy for product pages.",
    template: (i) => `Write hero, features, objections, and CTA copy for: ${i}.`
  },
  {
    id: "meeting-minutes",
    name: "Meeting Minutes",
    hint: "Paste raw meeting notes.",
    system: "Turn messy notes into crisp minutes and action items.",
    template: (i) => `Clean and structure minutes with owners and due dates: ${i}.`
  },
  {
    
    id: "contract-extractor",
    name: "Contract Extractor",
    hint: "Paste a contract clause.",
    system: "Extract key terms and obligations; not legal advice.",
    template: (i) => `Extract parties, term, renewal, fees, SLAs, liabilities from: ${i}.`
  },
   }
  

// Get references to DOM elements
const grid = document.getElementById('agentGrid');
const emailGate = document.getElementById('emailGate');
const emailInput = document.getElementById('emailInput');
const emailForm = document.getElementById('emailForm');
const cancelEmail = document.getElementById('cancelEmail');
const changeEmailBtn = document.getElementById('changeEmailBtn');
const userEmail = document.getElementById('userEmail');

// Prompt user for email if not stored
function requireEmail() {
  const email = localStorage.getItem('aiagentsage_email');
  if (!email) {
    emailGate.showModal();
  } else {
    userEmail.textContent = email;
    userEmail.classList.remove('hidden');
  }
}

// Render agent cards based on AGENTS array
function renderCards() {
  grid.innerHTML = AGENTS.map(a => `
    <div class="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-lg font-bold">${a.name}</h3>
        <button data-agent="${a.id}" class="runBtn px-3 py-1.5 rounded-lg bg-white text-slate-900 text-sm font-semibold">Run</button>
      </div>
      <p class="text-slate-400 text-sm mt-1">${a.hint}</p>
      <textarea id="input-${a.id}" class="mt-3 w-full h-28 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm outline-none focus:border-emerald-400" placeholder="${a.hint}"></textarea>
      <pre id="out-${a.id}" class="mt-3 text-sm whitespace-pre-wrap bg-slate-950 border border-slate-800 rounded-xl p-3 min-h-[88px]"></pre>
      
      <div class="mt-3 flex gap-2">
        <button data-copy="${a.id}" class="copyBtn px-3 py-1.5 rounded-lg border border-slate-700 text-sm">Copy</button>
        <button data-save="${a.id}" class="saveBtn px-3 py-1.5 rounded-lg border border-slate-700 text-sm">Save .txt</button>
      </div>
    </div>
  `).join('');
}

// Attach event listeners for running agents, copying results, saving results, and managing email capture
function attachHandlers() {
  // Run an agent when its button is clicked
  document.querySelectorAll('.runBtn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.agent;
      const agent = AGENTS.find(a => a.id === id);
      const input = document.getElementById(`input-${id}`).value.trim();
      const out = document.getElementById(`out-${id}`);
      const email = localStorage.getItem('aiagentsage_email');
      if (!email) { emailGate.showModal(); return; }
      if (!input) { out.textContent = 'Please provide some context.'; return; }
      out.textContent = 'Thinking…';
      try {
        const body = {
          email,
          agentId: agent.id,
          system: agent.system,
          prompt: agent.template(input)
        };
        const res = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        out.textContent = data.result || data.output || JSON.stringify(data, null, 2);
      } catch (err) {
        out.textContent = `Error: ${err.message}. Configure BACKEND_URL and serverless proxy.`;
      }
    });
  });

  // Copy results to clipboard
  document.querySelectorAll('.copyBtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.copy;
      const out = document.getElementById(`out-${id}`).textContent;
      navigator.clipboard.writeText(out || '').then(() => {
        e.currentTarget.textContent = 'Copied!';
        setTimeout(() => e.currentTarget.textContent = 'Copy', 1200);
      });
    });
  });

  // Save results as a .txt file
  document.querySelectorAll('.saveBtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.save;
      const content = document.getElementById(`out-${id}`).textContent || '';
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${id}-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  // Show email modal if user clicks change email
  changeEmailBtn.addEventListener('click', () => emailGate.showModal());
  // Cancel button closes the modal
  cancelEmail.addEventListener('click', () => emailGate.close());

  // On email form submission, store the email in localStorage and hide modal
  emailForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    // Basic email pattern check
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
    localStorage.setItem('aiagentsage_email', email);
    userEmail.textContent = email;
    userEmail.classList.remove('hidden');
    emailGate.close();
  });
}

// Initialize the hub if agent grid exists
if (document.getElementById('agentGrid')) {
  requireEmail();
  renderCards();
  attachHandlers();
}
