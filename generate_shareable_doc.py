import json
import base64

# Read image base64
with open('/Users/rdg_xihui/.gemini/antigravity-ide/scratch/spalding-phonograms/concept_mockup.jpg', 'rb') as f:
    img_b64 = base64.b64encode(f.read()).decode('utf-8')

# Read phonograms JSON
with open('/Users/rdg_xihui/.gemini/antigravity-ide/scratch/spalding-phonograms/phonograms.json', 'r') as f:
    phonograms = json.load(f)

# Build HTML Content
html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PhonoLand: Spalding Phonograms App - Game Design Specification & Prototype Guide</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap');

    :root {{
      --primary: #8338EC;
      --primary-light: #F3E8FF;
      --secondary: #FF5A79;
      --accent: #FFB703;
      --mint: #06D6A0;
      --text: #1E293B;
      --text-muted: #64748B;
      --bg: #F8FAFC;
      --card-bg: #FFFFFF;
      --border: #E2E8F0;
      --shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
    }}

    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.65;
      padding: 2.5rem 1rem;
    }}

    .container {{
      max-width: 1040px;
      margin: 0 auto;
      background: var(--card-bg);
      border-radius: 24px;
      box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--border);
      overflow: hidden;
    }}

    /* Hero Header */
    .hero-header {{
      background: linear-gradient(135deg, #4A154B 0%, #8338EC 50%, #FF5A79 100%);
      color: white;
      padding: 3.5rem 3rem 3rem;
      position: relative;
    }}

    .tag-badge {{
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      padding: 0.35rem 1rem;
      border-radius: 100px;
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 1rem;
    }}

    .hero-header h1 {{
      font-family: 'Fredoka', cursive, sans-serif;
      font-size: 2.85rem;
      font-weight: 700;
      line-height: 1.15;
      margin-bottom: 0.75rem;
    }}

    .hero-header p.subtitle {{
      font-size: 1.25rem;
      opacity: 0.92;
      max-width: 720px;
      line-height: 1.5;
    }}

    .meta-bar {{
      display: flex;
      gap: 2rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      font-size: 0.9rem;
      opacity: 0.85;
      flex-wrap: wrap;
    }}

    .content-body {{
      padding: 3rem;
    }}

    /* Concept art showcase */
    .image-showcase {{
      margin: 2.5rem 0;
      text-align: center;
      background: #FFFDF9;
      padding: 1.5rem;
      border-radius: 20px;
      border: 1px solid var(--border);
    }}

    .image-showcase img {{
      max-width: 100%;
      height: auto;
      border-radius: 14px;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
    }}

    .image-caption {{
      margin-top: 1rem;
      font-size: 0.9rem;
      color: var(--text-muted);
      font-weight: 500;
    }}

    h2 {{
      font-family: 'Fredoka', cursive, sans-serif;
      font-size: 1.95rem;
      color: #0F172A;
      margin: 2.5rem 0 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #F1F5F9;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }}

    h3 {{
      font-family: 'Fredoka', cursive, sans-serif;
      font-size: 1.35rem;
      color: #334155;
      margin: 1.5rem 0 0.6rem;
    }}

    p {{
      margin-bottom: 1rem;
      color: #334155;
    }}

    /* Callout Boxes */
    .callout {{
      background: #F8FAFC;
      border-left: 5px solid var(--primary);
      padding: 1.25rem 1.5rem;
      border-radius: 0 16px 16px 0;
      margin: 1.5rem 0;
    }}

    .callout.warning {{
      background: #FFFBEB;
      border-left-color: #F59E0B;
    }}

    .callout.success {{
      background: #ECFDF5;
      border-left-color: #10B981;
    }}

    .callout h4 {{
      font-weight: 700;
      margin-bottom: 0.4rem;
      color: #0F172A;
    }}

    /* Feature Grid */
    .grid-2 {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
      margin: 1.5rem 0;
    }}

    .feature-card {{
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: var(--shadow);
    }}

    .feature-card-icon {{
      font-size: 2.2rem;
      margin-bottom: 0.75rem;
    }}

    .feature-card h4 {{
      font-family: 'Fredoka', cursive, sans-serif;
      font-size: 1.25rem;
      color: #1E293B;
      margin-bottom: 0.4rem;
    }}

    /* Tables */
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      font-size: 0.95rem;
    }}

    th, td {{
      padding: 0.85rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }}

    th {{
      background: #F1F5F9;
      font-weight: 700;
      color: #475569;
    }}

    tr:hover td {{
      background: #F8FAFC;
    }}

    .phoneme-badge {{
      display: inline-block;
      background: var(--primary-light);
      color: var(--primary);
      font-family: 'Fredoka', cursive, sans-serif;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 8px;
      font-size: 1.05rem;
    }}

    .rule-pill {{
      display: inline-block;
      background: #FEF3C7;
      color: #92400E;
      font-size: 0.8rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
    }}

    /* Action bar */
    .action-bar {{
      display: flex;
      gap: 1rem;
      margin: 2.5rem 0 1rem;
      background: #F1F5F9;
      padding: 1.25rem;
      border-radius: 16px;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
    }}

    .btn {{
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.95rem;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }}

    .btn-primary {{
      background: var(--primary);
      color: white;
    }}

    .btn-primary:hover {{
      background: #6D28D9;
      transform: translateY(-2px);
    }}

    .btn-secondary {{
      background: #FFFFFF;
      color: #1E293B;
      border: 1px solid var(--border);
    }}

    /* Print Styles */
    @media print {{
      body {{ background: white; padding: 0; }}
      .container {{ border: none; box-shadow: none; border-radius: 0; }}
      .action-bar, .no-print {{ display: none !important; }}
      .hero-header {{ background: #8338EC !important; color: white !important; -webkit-print-color-adjust: exact; }}
      h2 {{ page-break-after: avoid; }}
      tr {{ page-break-inside: avoid; }}
    }}
  </style>
</head>
<body>

  <div class="container">
    
    <!-- Hero Header -->
    <header class="hero-header">
      <div class="tag-badge">Educational Game Design Document</div>
      <h1>PhonoLand: Spalding Edition</h1>
      <p class="subtitle">A tactile, multi-sensory game design for preschool toddlers (Ages 3–5) to master all 70 Spalding phonograms, frequency sounds, and spelling rules.</p>
      
      <div class="meta-bar">
        <div><strong>Status:</strong> Validated Prototype v1.0.0</div>
        <div><strong>Curriculum:</strong> Spalding / Orton-Gillingham (70 Phonograms)</div>
        <div><strong>Target Age:</strong> 3–5 Years (Preschool / Pre-K)</div>
        <div><strong>Tech Stack:</strong> HTML5, CSS3, Web Audio API, Web Speech API</div>
      </div>
    </header>

    <div class="content-body">

      <!-- Action Bar -->
      <div class="action-bar no-print">
        <div>
          <strong>🚀 Interactive Prototype is Live:</strong>
          <span style="color: var(--text-muted); margin-left: 0.5rem;">Running locally at <code>http://localhost:5173</code></span>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <a href="http://localhost:5173" target="_blank" class="btn btn-primary">Play Prototype ↗</a>
          <button onclick="window.print()" class="btn btn-secondary">🖨️ Print / Save PDF</button>
        </div>
      </div>

      <!-- Concept Art Showcase -->
      <div class="image-showcase">
        <img src="data:image/jpeg;base64,{img_b64}" alt="PhonoLand App UI Concept" />
        <div class="image-caption">Figure 1: Concept UI featuring the 3-Sound Spalding letter card (Sound 1, 2, 3 dots) and Chompy the Phono-Monster.</div>
      </div>

      <!-- Section 1: Executive Summary -->
      <h2>1. Executive Summary & Challenge</h2>
      <p>
        The <strong>Spalding Method</strong> (often recognized through <em>The Writing Road to Reading</em>) is renowned for producing exceptional reading and spelling fluency. However, adapting its rigorous curriculum for preschool toddlers (ages 3–5) presents distinct pedagogical and cognitive hurdles:
      </p>

      <div class="callout warning">
        <h4>⚠️ Why Traditional Phonics Apps Fail with Spalding:</h4>
        <ul style="padding-left: 1.25rem; margin-top: 0.4rem;">
          <li><strong>Letter Names vs. Isolated Sounds:</strong> Traditional apps chant <em>"A is for Apple"</em>. Spalding strictly forbids letter names early on; children must learn pure phonemic sounds (<code>/ă/</code>, <code>/b/</code>, <code>/k/</code>).</li>
          <li><strong>Multiple Sounds in Frequency Order:</strong> Standard apps teach single sounds. Spalding teaches <em>all sounds of each phonogram in order of their usage frequency</em> (e.g. <code>a</code> says <em>ă, ā, ah</em>; <code>c</code> says <em>k, s</em>; <code>ough</code> says 6 sounds).</li>
          <li><strong>Position & Usage Rules:</strong> Multi-letter phonograms rely on specific spelling rules (e.g. <em>"English words do not end in i, u, v, or j"</em>, <em>"ck is only used after a single vowel"</em>).</li>
        </ul>
      </div>

      <p>
        <strong>PhonoLand</strong> resolves these challenges by converting the multi-sound frequency chant into an intuitive, multi-tap rhythmic mechanic, pairing each sound with audio-visual toddler anchors and gamified rule puzzles.
      </p>

      <!-- Section 2: Core Game Modes -->
      <h2>2. Core Game Modes & Mechanics</h2>

      <div class="grid-2">
        
        <div class="feature-card">
          <div class="feature-card-icon">🌟</div>
          <h4>1. Sound Studio (The Spalding Chant)</h4>
          <p>Features giant, bouncy letter cards. Numbered bubble dots underneath indicate how many sounds the phonogram makes.</p>
          <ul>
            <li><strong>Multi-Tap Cadence:</strong> Tap 1 plays <code>/ă/</code> (apple 🍎), Tap 2 plays <code>/ā/</code> (navy ⛵), Tap 3 plays <code>/ah/</code> (father 👨).</li>
            <li><strong>Auto-Chant:</strong> Rhythmically chants through all sounds with synchronized visual pulses.</li>
          </ul>
        </div>

        <div class="feature-card">
          <div class="feature-card-icon">👾</div>
          <h4>2. Feed Chompy (Ear-Training)</h4>
          <p>Auditory discrimination game. Chompy the friendly monster asks: <em>"Can you feed me the sound: /sh/?"</em></p>
          <ul>
            <li><strong>Snack Cards:</strong> 3 floating snack cards (e.g., <code>sh</code>, <code>ch</code>, <code>th</code>).</li>
            <li><strong>Positive Reinforcement:</strong> Munching animations (<code>*nom nom!*</code>), confetti bursts, and gentle, non-punitive hints on mistake.</li>
          </ul>
        </div>

        <div class="feature-card">
          <div class="feature-card-icon">🎈</div>
          <h4>3. Bubble Pop Symphony</h4>
          <p>Reflex and auditory reaction arcade. Floating soap bubbles drift upward across a soft sky.</p>
          <ul>
            <li><strong>Goal:</strong> Toddler hears the prompt (e.g. <em>"Pop the /ŏ/ sound!"</em>) and pops the matching bubble.</li>
            <li><strong>Audio Feedback:</strong> Popping plays a crisp xylophone chord, building a playful musical scale.</li>
          </ul>
        </div>

        <div class="feature-card">
          <div class="feature-card-icon">🌉</div>
          <h4>4. Rule Detective (Bridge Builder)</h4>
          <p>Transforms complex Spalding spelling rules into visual bridge-crossing challenges.</p>
          <ul>
            <li><strong>Ending Rule:</strong> Completing <code>d - a - [ ? ]</code> (Day). Child selects <code>ay</code> over <code>ai</code> because <em>"English words do not end in i, use 'ay'!"</em></li>
            <li><strong>Single Vowel Rule:</strong> Completing <code>d - u - [ ? ]</code> (Duck) using <code>ck</code>.</li>
          </ul>
        </div>

      </div>

      <!-- Section 3: Preschool Sensory & Cognitive Architecture -->
      <h2>3. Preschool Sensory & Cognitive Architecture</h2>
      <div class="callout success">
        <h4>👶 Toddler-First Design Guidelines (Ages 3–5)</h4>
        <ul style="padding-left: 1.25rem; margin-top: 0.4rem; line-height: 1.7;">
          <li><strong>Zero Reading Required:</strong> Instructions are 100% spoken audio, accompanied by glowing touch cues.</li>
          <li><strong>Giant Touch Targets:</strong> Cards and buttons are oversized (minimum 72px – 160px) to accommodate developing toddler fine motor skills.</li>
          <li><strong>Squash-and-Stretch Tactile Physics:</strong> Buttons depress with 3D drop-shadows and spring back with delightful elasticity.</li>
          <li><strong>Non-Punitive Failure States:</strong> If a child taps the wrong card, it gently wobbles, announces its own sound, and encourages exploration without frustration.</li>
          <li><strong>Dual Audio Modes:</strong> Instant toggle between <em>"Sound Only"</em> (for classroom drilling) and <em>"Sound + Example Word"</em> (for toddler vocabulary anchoring).</li>
        </ul>
      </div>

      <!-- Section 4: Complete Curriculum Reference -->
      <h2>4. Complete 70 Spalding Phonograms Reference</h2>
      <p>The table below documents all 70 phonograms directly transcribed from the 5 curriculum sheets, organized with exact sound order, IPA pronunciation, reference words, and pedagogical rule notes.</p>

      <h3>Page 1: The Basic 26 Alphabet (a–z + qu)</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 80px;">Letter</th>
            <th style="width: 150px;">Sounds (In Order)</th>
            <th>Example Words (Support Sheet)</th>
            <th>Spalding Rule / Note</th>
          </tr>
        </thead>
        <tbody>
"""

for p in phonograms:
    if p["page"] == 1:
        sounds_str = " &nbsp; ".join([f"<span class='phoneme-badge'>{s['sound']}</span>" for s in p["sounds"]])
        examples_str = ", ".join([f"<strong>{s['sound']}</strong> – {s['example']} {s.get('icon', '')}" for s in p["sounds"]])
        rule_str = f"<span class='rule-pill'>📌 {p['rule']}</span>" if p.get('rule') else "<span style='color:#94A3B8;'>—</span>"
        html_content += f"""
          <tr>
            <td><strong style="font-size: 1.3rem; color: var(--primary);">{p['letters']}</strong></td>
            <td>{sounds_str}</td>
            <td>{examples_str}</td>
            <td>{rule_str}</td>
          </tr>
        """

html_content += """
        </tbody>
      </table>

      <h3>Pages 2–4: Multi-Letter Phonograms</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 80px;">Letter</th>
            <th style="width: 180px;">Sounds (In Order)</th>
            <th>Example Words</th>
            <th>Spalding Usage Rule</th>
          </tr>
        </thead>
        <tbody>
"""

for p in phonograms:
    if p["page"] in [2, 3, 4]:
        sounds_str = " &nbsp; ".join([f"<span class='phoneme-badge'>{s['sound']}</span>" for s in p["sounds"]])
        examples_str = ", ".join([f"<strong>{s['sound']}</strong> – {s['example']} {s.get('icon', '')}" for s in p["sounds"]])
        rule_str = f"<span class='rule-pill'>📌 {p['rule']}</span>" if p.get('rule') else "<span style='color:#94A3B8;'>—</span>"
        html_content += f"""
          <tr>
            <td><strong style="font-size: 1.3rem; color: var(--primary);">{p['letters']}</strong></td>
            <td>{sounds_str}</td>
            <td>{examples_str}</td>
            <td>{rule_str}</td>
          </tr>
        """

html_content += """
        </tbody>
      </table>

      <!-- Section 5: Technical Architecture -->
      <h2>5. Technical Architecture & Audio Engine</h2>
      <p>The application is designed to be lightweight, zero-latency, and capable of running offline on any tablet or classroom device:</p>
      
      <div class="grid-2">
        <div class="feature-card">
          <h4>🔊 Procedural Web Audio Synthesizer</h4>
          <p>Requires zero external audio files. Synthesizes delightful UI sounds using native oscillators and noise buffers:</p>
          <ul>
            <li><code>playPop()</code>: Soft sine bubble pop with exponential frequency drop.</li>
            <li><code>playChime()</code>: Celesta C5-E5-G5-C6 arpeggio for star rewards.</li>
            <li><code>playMunch()</code>: Filtered noise + low pulse for Chompy's crunch.</li>
            <li><code>playBoing()</code>: Elastic pitch-drop oscillator for gentle feedback.</li>
          </ul>
        </div>

        <div class="feature-card">
          <h4>🗣️ Phonetic Speech Synthesis Tuning</h4>
          <p>Configured specifically for preschool clear phonics:</p>
          <ul>
            <li>Speech rate calibrated to <code>0.82x</code> for auditory processing.</li>
            <li>Phonetic mappings ensure isolated consonants do not add unnatural schwas (e.g. avoiding "buh" for /b/).</li>
            <li>Automatic voice selection prioritizing warm, natural English voices (Google, Samantha, Karen).</li>
          </ul>
        </div>
      </div>

      <!-- Section 6: Implementation Roadmap -->
      <h2>6. Implementation Roadmap</h2>
      <table>
        <thead>
          <tr>
            <th>Milestone</th>
            <th>Deliverables</th>
            <th>Target Audience</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Phase 1: Validated Prototype (Complete)</strong></td>
            <td>Interactive 5-mode web app running locally with full 70 phonograms, sound engine, and monster game.</td>
            <td>Stakeholders & Internal Testing</td>
          </tr>
          <tr>
            <td><strong>Phase 2: Human Voice Recording Pack</strong></td>
            <td>Studio-recorded phonemes with authentic certified Spalding instructors.</td>
            <td>Preschool Classrooms</td>
          </tr>
          <tr>
            <td><strong>Phase 3: Multi-Sensory Tracing</strong></td>
            <td>Tactile finger-tracing on touchscreen with sparkle tracks following correct stroke order.</td>
            <td>Pre-K & Kindergarten</td>
          </tr>
          <tr>
            <td><strong>Phase 4: PWA / App Store Packaging</strong></td>
            <td>Offline Progressive Web App (PWA) and Capacitor wrap for iPad / Android tablets.</td>
            <td>Parents & Homeschoolers</td>
          </tr>
        </tbody>
      </table>

      <!-- Footer -->
      <footer style="margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--border); text-align: center; color: var(--text-muted); font-size: 0.9rem;">
        PhonoLand: Spalding Edition &bull; Game Design Document &bull; Generated November 2026
      </footer>

    </div>
  </div>

</body>
</html>
"""

with open('/Users/rdg_xihui/.gemini/antigravity-ide/scratch/spalding-phonograms/shareable_design_document.html', 'w') as f:
    f.write(html_content)

print("Generated shareable_design_document.html successfully!")

# Also generate a markdown specification file
md_content = f"""# PhonoLand: Spalding Phonograms App Design Specification

> **Pedagogical Game Design Document for Preschoolers (Ages 3–5)**  
> Aligned with the 70 Spalding Multi-Letter Phonograms Support Sheets  
> **Status**: Validated Interactive Prototype v1.0.0

---

## 1. Executive Summary

The **Spalding Method** is one of the world's most rigorous phonics foundations. Traditional phonics apps fail to teach Spalding properly because they:
1. Teach letter names (*"Ay, Bee, See"*) instead of isolated sounds (*"/ă/, /b/, /k/"*).
2. Teach only 1 sound per letter rather than all sounds in frequency order (e.g. `a` says */ă/, /ā/, /ah/*; `c` says */k/, /s/*; `ough` has 6 distinct sounds).
3. Overlook critical word-positioning rules (e.g. *"English words do not end in i, u, v, or j"*, *"ck only after a single vowel"*).

**PhonoLand** solves this by packaging the 70 phonograms into 5 playful, toddler-friendly game loops with multi-tap tactile cadences and non-punitive feedback.

---

## 2. Core Game Modes

| Mode | Pedagogical Target | Toddler Interaction |
| :--- | :--- | :--- |
| **1. Sound Studio** | Multi-Sound Frequency Chant | Tapping giant card cycles through sounds 1, 2, 3 with icon pops; "Sing Chant" button auto-chants in cadence. |
| **2. Feed Chompy** | Auditory Discrimination | Monster asks for sound (*"Feed me /sh/!"*); child drags/taps snack card; chomping animations + confetti. |
| **3. Bubble Pop** | Reaction & Rhythm | Soap bubbles drift upward; child pops target phonograms; plays xylophone chord scales. |
| **4. Rule Detective** | Spelling & Position Rules | Bridge builder where child solves `d - a - [ ? ]` choosing `ay` over `ai` based on the ending rule. |
| **5. Support Guide** | Teacher / Parent Reference | Full 70 phonogram grid with audio buttons, search filter, and printable layout. |

---

## 3. Curriculum Reference Table (All 70 Phonograms)

### Page 1: Basic 26 Alphabet (a–z + qu)
| Letter | Sounds (Frequency Order) | Reference Words (from Sheet) | Spalding Rule / Note |
| :--- | :--- | :--- | :--- |
"""

for p in phonograms:
    if p["page"] == 1:
        s_list = " / ".join([s["sound"] for s in p["sounds"]])
        w_list = ", ".join([f"{s['sound']} – {s['example']}" for s in p["sounds"]])
        r = p.get("rule") or "—"
        md_content += f"| **{p['letters']}** | `{s_list}` | {w_list} | {r} |\n"

md_content += """
### Pages 2–4: Multi-Letter Phonograms
| Letter | Sounds (Frequency Order) | Reference Words (from Sheet) | Spalding Rule / Note |
| :--- | :--- | :--- | :--- |
"""

for p in phonograms:
    if p["page"] in [2, 3, 4]:
        s_list = " / ".join([s["sound"] for s in p["sounds"]])
        w_list = ", ".join([f"{s['sound']} – {s['example']}" for s in p["sounds"]])
        r = p.get("rule") or "—"
        md_content += f"| **{p['letters']}** | `{s_list}` | {w_list} | {r} |\n"

md_content += """
---

## 4. Technical Architecture
* **Web Audio Procedural Synth**: Zero-dependency synthesis for pops, chimes, chomps, and elastic boings.
* **Preschool Web Speech Engine**: 0.82x speed, natural female/warm voices, customized phonetic IPA replacements.
* **Offline Readiness**: Can be deployed as a Progressive Web App (PWA) or wrapped in Capacitor for iPad / Android.

---

## 5. Live Prototype Links
* **Live Local Server**: `http://localhost:5173`
* **Shareable Standalone HTML**: `shareable_design_document.html` (can be opened in any browser or printed to PDF)
"""

with open('/Users/rdg_xihui/.gemini/antigravity-ide/scratch/spalding-phonograms/SPALDING_PHONOGRAMS_DESIGN_SPEC.md', 'w') as f:
    f.write(md_content)

print("Generated SPALDING_PHONOGRAMS_DESIGN_SPEC.md successfully!")
