# NIOS Wireframes — Narrative Command Center & Spatial Views

Detailed layout and flow specs for the radical NIOS evolution.

---

## 1. Narrative Command Center (Home)

**Replaces:** Current card grid homepage.

**Purpose:** Living control room. User lands here and immediately *sees* their story.

### Layout (Single Viewport)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  NIOS                                    [Search...]  [Pulse]  [User]            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │              STORY GALAXY (Center — 60% width)                           │   │
│  │                                                                          │   │
│  │    ○────●────○         Glowing nodes, neural edges                       │   │
│  │     \   |   /          Zoom: scroll | Pinch                              │   │
│  │      ●──●──●           Pan: drag canvas                                  │   │
│  │       \|/              Click node → detail flyout                        │   │
│  │        ●                                                                 │   │
│  │                                                                          │   │
│  │  [−] [Fit] [1:1] [Layers: All ▼]                                         │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────────────┐   │
│  │ ACTIVE THREADS          │  │ AI THOUGHT STREAM                            │   │
│  │ ─────────────────────── │  │ ───────────────────────────────────────────  │   │
│  │ ● Betrayal arc     ▲    │  │ ◐ "Dagger first appears Ch.2 — consider      │   │
│  │ ● Romance thread   —    │  │    callback in Ch.8"                    [→]   │   │
│  │ ○ Old debt (dormant)    │  │ ◐ Continuity: Marcus wouldn't know that yet  │   │
│  │ [View Loom →]           │  │    [Compile] [Dismiss]                  [→]   │   │
│  └─────────────────────────┘  │ ◐ Opportunity: Echo Sarah's fear from act 1  │   │
│                               │    [Inspect] [Dismiss]                  [→]   │   │
│  ┌─────────────────────────┐  │                                             │   │
│  │ MOMENTUM                │  │ [Show more insights]                         │   │
│  │ ●●●●○○○○○○ 42%          │  └─────────────────────────────────────────────┘   │
│  │ Rising tension          │                                                   │
│  └─────────────────────────┘  ┌─────────────────────────────────────────────┐   │
│                               │ TIMELINE SLIVER (River preview)               │   │
│  ┌─────────────────────────┐  │ [●]──[●]──[●]──[●]──[●]──[●]  ← scroll →      │   │
│  │ CAST (who's active)     │  │ Ch1  Ch2  Ch3  Ch4  Ch5  Ch6                  │   │
│  │ ● Marcus ● Sarah        │  │ [Open River →]                                │   │
│  │ ○ John (dormant)        │  └─────────────────────────────────────────────┘   │
│  │ [View Cast →]           │                                                   │
│  └─────────────────────────┘                                                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Component Specs

| Component | Size | Content | Interaction |
|-----------|------|---------|-------------|
| **Story Galaxy** | 60% width, full height | Force-directed graph of objects + edges | Zoom, pan, click node → flyout |
| **Active Threads** | 200px width, ~120px | Top 3–5 threads, status icon, name | Click → Loom; status = ▲ rising, — flat, ○ dormant |
| **AI Thought Stream** | Flexible, ~200px height | Scrollable list of insights | Dismiss, action buttons per insight |
| **Momentum** | 200px, ~60px | Tension/pacing gauge 0–100% | Visual only (future: click → Strategy) |
| **Cast** | 200px, ~80px | Avatars/names of active chars | Click → Cast; link to River |
| **Timeline Sliver** | Full width, ~80px | Horizontal event markers | Scroll, click → River at event |
| **Search** | Nav bar | Natural-language story search | Type → highlights in Galaxy + River |

### Responsive Behavior

- **Desktop:** Sidebar (Active Threads, Momentum, Cast) right or left of Galaxy.
- **Tablet:** Sidebar collapses to bottom drawer; Galaxy full width.
- **Mobile:** Galaxy primary; bottom tab bar for Threads | River | Cast | AI Stream.

### Visual Hierarchy

1. **Galaxy** = primary focus (largest, center).
2. **AI Stream** = secondary (insights demand attention).
3. **Threads / Cast** = tertiary (context).
4. **Timeline sliver** = navigation hint to River.

---

## 2. Story Galaxy (Full View)

**Entry:** Command Center center panel, or `/universe` (universe tab).

### Full-Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [← Back]  Story Galaxy                    [All ▼] [Characters] [Events] [Both]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                            │ │
│  │                        FULL CANVAS                                         │ │
│  │                                                                            │ │
│  │     ★ Marcus ●────────● Sarah      ← Characters (green glow)               │ │
│  │        |    \       /    |         ← Events (amber)                         │ │
│  │        |     ●────●      |         ← Locations (blue)                       │ │
│  │        |     |    |      |         ← Plot threads (purple)                  │ │
│  │        ●─────●────●──────●                                                 │ │
│  │              |                                                             │ │
│  │              ● The Dagger           ← Objects (red)                         │ │
│  │                                                                            │ │
│  │  Nodes: pulsing = referenced in AI Stream | dimmed = dormant                │ │
│  │  Edges: thickness = relationship strength | arrow = direction               │ │
│  │                                                                            │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  [Layer filter] [Color by: type | importance | arc] [Export] [Extract text]      │
│                                                                                  │
│  ┌─ Node Detail Flyout ──────────┐                                              │
│  │ Marcus (character)            │  ← Appears on node click                     │
│  │ Goals: Revenge, Redemption    │                                              │
│  │ In scenes: Ch1, Ch3, Ch5      │                                              │
│  │ [Cast] [River] [Edit]         │                                              │
│  └──────────────────────────────┘                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Interaction Map

| Action | Result |
|--------|--------|
| Scroll / pinch | Zoom in/out |
| Drag canvas | Pan |
| Click node | Flyout with summary + quick links |
| Double-click node | Navigate to Cast (char) or River (event) |
| Right-click node | Context menu: Hide, Highlight connections, Add note |
| Layer filter | Toggle node types (characters, events, locations, threads) |
| Color mode | type (default) | importance | arc phase |

### Node Styling

- **Character:** Rounded, green tint, larger.
- **Event:** Diamond-ish, amber.
- **Location:** Square, blue.
- **Plot thread:** Elongated, purple.
- **Object:** Small circle, red.
- **Pulsing:** Node referenced in last 5 AI insights.
- **Dimmed:** No activity in last N scenes.

---

## 3. The River (Timeline)

**Entry:** Timeline sliver click, or `/river` (→ Universe Timeline tab).

### Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [← Back]  The River — Timeline & Causality          [Scene ▼] [Chapter] [Book]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Flow direction:  ───────────────────────────────────────────→  (left to right)  │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                             ││
│  │  ●══════●══════●──────────●══════●          Main flow (primary timeline)    ││
│  │  │      │      │          │      │                                          ││
│  │  Ch1    Ch2    Ch3        Ch4    Ch5                                        ││
│  │  The    The    The        The    The                                        ││
│  │  Meet   Dagger Betrayal   Fall   Return                                     ││
│  │                                                                             ││
│  │         └──────●          (branch = alternate thread / subplot)             ││
│  │               │                                                             ││
│  │               Sarah's POV                                                   ││
│  │                                                                             ││
│  │  Ripples (dashed): caused_by links between events                           ││
│  │                                                                             ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌─ Event Card (on hover/click) ────────────────────┐                           │
│  │ The Betrayal                          [Ch3]      │                           │
│  │ Marcus discovers Sarah's secret.                 │                           │
│  │ Caused by: The Dagger, Sarah's lie               │                           │
│  │ Characters: Marcus, Sarah                        │                           │
│  │ [Galaxy] [Compile]                               │                           │
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  Scroll: horizontal (timeline) | vertical (zoom level)                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Hierarchy Modes

| Mode | Unit | Visual |
|------|------|--------|
| Scene | Individual scenes | Dense nodes, many connections |
| Chapter | Chapters | Grouped nodes, chapter labels |
| Book | Books / acts | High-level flow, major beats |

### Causality Visualization

- **Solid line:** Timeline order.
- **Dashed arrow:** `caused_by` — event A caused event B.
- **Branch:** Parallel thread (e.g. POV, subplot).
- **Convergence:** Branch rejoins main flow.

### Responsive

- Desktop: Horizontal scroll, zoom slider.
- Mobile: Vertical stack (top-to-bottom), swipe between chapters.

---

## 4. The Loom (Plot Threads)

**Entry:** Active Threads panel, or `/loom` (→ Universe Threads tab).

### Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [← Back]  The Loom — Plot Threads                   [All] [Active] [Dormant]    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Each thread = horizontal band across the story.                                 │
│  Thickness = tension. Glow = unresolved. Fade = dormant.                         │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                                                                             ││
│  │  Timeline:  Ch1 ── Ch2 ── Ch3 ── Ch4 ── Ch5 ── Ch6 ── Ch7                   ││
│  │                                                                             ││
│  │  Betrayal   ████████████████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░  ▲ ACTIVE (glow)       ││
│  │  arc        │    │         │              │          │                      ││
│  │             intro  dagger   reveal        ?          │                      ││
│  │                                                                             ││
│  │  Romance    ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  — FLAT                ││
│  │  thread     │         │                    │                                ││
│  │             meet      conflict             resolution                       ││
│  │                                                                             ││
│  │  Old debt   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ○ DORMANT (faded)     ││
│  │                                                                             ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  Legend: █ high tension  ▓ medium  ░ low/dormant                                 │
│                                                                                  │
│  ┌─ Thread Detail ─────────────────────────────────────────────────────────────┐│
│  │ Betrayal arc                                                    [Edit]      ││
│  │ Status: Active (rising)   Events: 4   Next beat: Ch5                         ││
│  │ Summary: Marcus discovers Sarah hid the dagger; trust collapses.             ││
│  │ [River] [Galaxy] [Characters]                                                ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Thread Band Specs

- **Width:** Spans full timeline (Ch1 → end).
- **Height:** ~40–60px per thread.
- **Fill:** Gradient or bars = tension per chapter (from events/emotional beats).
- **State:**
  - **Active + rising:** Bright glow, thick.
  - **Active + flat:** Normal.
  - **Dormant:** 50% opacity, thin.
  - **Resolved:** Checkmark icon, muted.

### Interaction

- Hover thread → highlight events on mini-timeline.
- Click thread → detail panel (right or bottom).
- Click event marker → jump to River at that event.

---

## 5. Cross-View Navigation

```
Command Center ──┬── Galaxy (full) ──► Cast (character) | River (event)
                 │
                 ├── River (full) ───► Galaxy (event) | Compile (scene)
                 │
                 ├── Loom (full) ────► River (event) | Galaxy (thread)
                 │
                 └── AI Stream ──────► Compile | Galaxy | River (contextual)
```

**Deep links:** Every entity (character, event, thread) has URLs that open the right view with focus.

---

## 6. Writing Cockpit (Future)

**Concept:** Replace blank page with narrative HUD.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Scene: Ch4 — The Fall                                    [Compile] [Preview]    │
├────────────────────────────────┬────────────────────────────────────────────────┤
│                                │  CONTEXT PANEL (right, collapsible)             │
│  [Editor area]                  │  ─────────────────────────────────             │
│                                │  Characters in scene: Marcus, Sarah             │
│  The door swung open.           │  [Marcus] [Sarah]  ← click = insert            │
│  Marcus stood there,            │  Active threads: Betrayal arc                   │
│  his face—                      │  Lore: The Dagger (first mention Ch2)          │
│                                │  Continuity: ✓ No alerts                        │
│                                │  Tone: Tense → building                         │
│                                │  AI: "Consider echoing 'swung' from Ch1"  [Add] │
└────────────────────────────────┴────────────────────────────────────────────────┘
```

*(Spec for later implementation.)*

---

*Wireframes v1 — refine with design review.*
