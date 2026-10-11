# 美术提示词

## DnD 版场景图（NovelAI，2026-10-11）

用 NovelAI V5（`nai-diffusion-5-full`，采样器 `k_dpmpp_2m_sde`，28 步，2K 尺寸，提示词引导值 5.5，缩放引导值 0）生成，网页用的是转成 webp 的版本。补图时沿用同一组画师串，画风才统一。

- 画师串：`artist:wlop, artist:ask_(askzy), artist:kawacy, painterly, best quality, absurdres, very aesthetic, masterpiece, no text`
- 负面提示词：`lowres, worst quality, low quality, jpeg artifacts, blurry, text, watermark, signature, username, logo, artist name, frame, border, chibi, oversaturated`

### dnd-town-street.webp（横图）

用在：当前冒险、开始冒险、单人模式卡片、404 页

```text
no humans, scenery, fantasy, medieval fantasy town, narrow cobblestone street, half-timbered house, stone buildings, hanging lantern, warm window light, dusk, blue hour, light rain, wet ground, reflection, mist, distant castle on hill, dark sky, moody, cinematic lighting, wide shot, depth of field, dark atmosphere
```

### dnd-adventurer-desk.webp（横图）

用在：存档、车卡页背景、公告横幅

```text
no humans, still life, from above, old wooden table, unrolled parchment map, blank map, d20, dice, dagger, leather pouch, gold coin, potion bottle, red liquid, quill, inkwell, candle, leather-bound book, rope, compass, warm candlelight, dark background, shadows, fantasy, adventurer equipment, empty space in center, dark atmosphere, no text
```

### dnd-raven-messenger.webp（横图）

用在：同伴、公告

```text
no humans, raven, perched on windowsill, stone window, night, moonlight, sealed letter, wax seal, scroll, candle on table, fantasy, medieval, castle tower window, starry sky, distant mountains, cozy, dark atmosphere, cinematic lighting, wide shot, no text
```

### dnd-tavern-night.webp（横图）

用在：冒险小说

```text
no humans, scenery, indoors, fantasy tavern, after closing, empty tavern, wooden tables, wooden chairs, wooden beams, stone fireplace, dying embers, ember glow, tankard, wine bottle, candle, hanging lantern, barrels, bar counter, warm light, dark shadows, night, cozy, dark atmosphere, cinematic lighting, wide shot
```

### dnd-guild-library.webp（横图）

用在：图书馆阅览室

```text
no humans, scenery, indoors, fantasy library, wizard library, tall bookshelves, many books, spiral staircase, wooden balcony, arched windows, moonlight, floating candles, reading desk, open book, globe, warm candlelight, dust particles, night, dark atmosphere, cinematic lighting, wide shot, depth of field
```

### dnd-forbidden-vault.webp（横图）

用在：图书馆禁书区

```text
no humans, scenery, indoors, underground vault, dungeon, stone walls, iron bars, iron gate, chained book, chains, ancient tomes on stone shelves, glowing runes, faint purple magic glow, single torch, cobweb, dust, dark, ominous, dark atmosphere, cinematic lighting, wide shot
```

### dnd-launch-dragon.webp（竖图）

用在：开场动画

```text
no humans, dragon, western dragon, coiled around ruined tower, wings spread, full moon, night sky, clouds, castle ruins, mountains, moonlight, epic, fantasy, dark atmosphere, cinematic lighting, from below, vertical composition
```

## DnD 版小件和图鉴（GPT 图像生成，2026-10-11）

NovelAI 画不准几何体、出不了透明底，这几张改用 GPT 出。

### dnd-brand-d20.webp（品牌徽章：黄铜 d20）

```text
A single twenty-sided die (d20, regular icosahedron with 20 equilateral triangular faces, geometrically accurate) made of aged dark brass with subtle engraved filigree on each face, the top face showing a small engraved dragon-claw sigil instead of a number. The die sits centered inside a round antique brass medallion frame with a thin beaded rim. Painterly dark-fantasy illustration, oil-paint texture, warm candlelight rim light from the upper left, deep near-black navy background with soft vignette. Centered, front-facing, symmetrical, the whole medallion fits inside the frame with a small margin so it can be cropped to a circle. Must read clearly at very small sizes. No text, no letters, no numbers, no watermark, no signature.
```

### dnd-medallion-ring.webp（黄铜表圈：透明底）

```text
An isolated circular ornamental ring made of blackened antique brass, like the bezel of a fantasy adventurer's compass: a thick round band engraved with small arcane runes and tiny d20 motifs, four small gem studs at north, east, south and west, slight wear and patina. The center of the ring is completely empty and transparent. Front view, perfectly centered, ring fills about 90% of the canvas. Soft warm highlight on the upper-left edge, dark shading on the lower right. Transparent background (or flat pure magenta #FF00FF if transparency is unavailable). Painterly realistic metal texture, no text, no letters, no numbers, no shadow on the background, no watermark.
```

### dnd-herbarium-plate.webp（奇幻草药图鉴页）

```text
A page from a fantasy herbalist's field journal: hand-engraved botanical illustrations of three imaginary magical plants (a curling moonleaf vine with crescent-shaped leaves, a small mushroom cluster with spotted caps, and a thistle-like flower with star-shaped petals), each drawn with fine ink cross-hatching and very light watercolor washes in muted sage green and faded amber. Printed on genuinely aged warm parchment with deckled edges, light foxing spots and a faint fold crease. Portrait composition, plants arranged loosely around the page with generous empty margins, like a real 18th-century natural-history plate. Flat archival scan lighting. No title, no labels, no captions, no letters, no numbers, no readable text, no border frame, no watermark.
```

### dnd-bestiary-dragon.webp（龙骨图鉴）

```text
A naturalist's anatomical study plate of a western dragon, drawn as a museum-quality copperplate engraving: the dragon's skeleton shown in side view with a horned reptilian skull, long serpentine neck vertebrae, ribcage, four clawed legs and the bone structure of one bat-like wing extended upward, plus two small secondary sketches of a single claw and a wing joint in the lower corner. Fine ink cross-hatching in faded sepia-black on aged warm gray parchment with slight ink spread, foxing spots and soft scan shadows. Portrait composition, specimen centered with quiet paper margins. Scientific and believable, not monstrous. No title, no labels, no letters, no numbers, no readable text, no decorative border, no watermark.
```

### dnd-party-campfire.webp（四人冒险小队）

```text
Four fantasy adventurers resting around a small campfire in a forest clearing at night, seen from slightly behind and to the side so their faces are mostly hidden: an armored fighter with a sword leaning on a log, a hooded ranger holding a longbow, a robed wizard with a tall staff, and a cleric with a round shield. Starry night sky with distant snowy mountains above the treeline. Painterly dark-fantasy oil painting, visible brush strokes, warm orange firelight on the figures against cool blue-gray night shadows. Wide landscape composition with the group in the lower third and plenty of dark sky above for text overlays. No text, no logo, no watermark, no signature.
```

## 沿用的克苏鲁版通用素材（GPT 图像生成）

布纹、黄铜零件、星图和标本页没有题材色彩，DnD 版继续使用。

### 6. 暗色档案布纹

```text
Use case: stylized-concept
Asset type: seamless tileable website texture for dark Cthulhu archive interfaces
Primary request: a physically believable close-up material scan combining charcoal-black archival book cloth and extremely subtle aged paper fibers, with sparse fine dust, tiny scratches and uneven dye absorption
Style/medium: high-resolution flatbed material scan, tactile natural fiber detail, matte surface, no illustrated motif
Composition/framing: square orthographic texture, evenly distributed micro-detail, seamless on all four edges, no central focal point or vignette
Lighting/mood: flat neutral grazing light only enough to reveal fibers; dark, quiet and understated
Color palette: near-black navy, charcoal, faint desaturated green-gray; very low contrast so white interface text remains readable over it
Constraints: truly tileable edges; no symbols, stains shaped like faces, tentacles, objects, letters, numbers, border, logo, signature, or watermark
Avoid: obvious repeating clusters, dramatic highlights, grunge brush pack appearance, CGI noise, fabric folds, glossy material
```

### 8. 1890 年代天文观测草图

```text
Use case: scientific-educational
Asset type: decorative archival plate used as a low-opacity card watermark and chapter divider in a dark Cthulhu tabletop web app
Primary request: a convincing 1890s hand-drafted astronomical observation chart showing concentric orbital circles, a partial lunar phase study, fine radial construction lines, three small constellation clusters and instrument calibration arcs
Style/medium: authentic ink-and-graphite observatory working sheet scanned from real aged blue-black drafting paper; imperfect compass lines, faint erasures, pressure variation, paper fibers and subtle handling wear
Composition/framing: square plate, one large off-center circular construction with smaller studies around it, open margins, asymmetrical and utilitarian rather than ornamental
Lighting/mood: flat archival scan, scholarly, secretive and quietly ominous
Color palette: near-black navy paper, faded bone-white graphite, restrained oxidized teal and tiny antique brass pencil accents
Constraints: no readable words, letters, numbers or labels; no zodiac symbols, pentagrams, occult clichés, fantasy magic glow, logo, signature, border, or watermark
Avoid: vector-perfect geometry, modern infographic style, luminous galaxy photography, decorative tattoo design, obvious AI artifacts
```

### 11. 黑化黄铜档案角件

```text
Use case: stylized-concept
Asset type: reusable decorative corner overlay for dark archival website cards and module borders
Primary request: one authentic late-19th-century museum cabinet corner fitting, an L-shaped narrow frame ornament made from tarnished dark brass with two tiny rivets, restrained engraved linework and a small oxidized teal patina trace
Style/medium: photorealistic scan of a real physical metal fitting, understated historical conservation object, fine wear, scratches and uneven oxidation
Composition/framing: a single isolated 90-degree corner piece, equal horizontal and vertical arms, centered with generous padding, clear silhouette, front-on orthographic view
Lighting/mood: flat neutral archival documentation light; no dramatic shadow
Color palette: aged blackened brass, muted antique gold, charcoal and very restrained oxidized teal
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for local background removal
Constraints: background must be one uniform #ff00ff color with no shadows, gradients, texture, reflections, floor plane or lighting variation; crisp separated edges; do not use magenta anywhere in the object; no readable text, symbols, tentacles, skulls, logo, signature or watermark
Avoid: fantasy filigree, ornate baroque decoration, steampunk gears, glossy CGI, thick picture frame, obvious AI artifacts
```

### 12. 博物馆抽屉标签框

```text
Use case: stylized-concept
Asset type: reusable horizontal archive-label ornament for dark website cards, card headers and module titles
Primary request: one narrow 1920s museum catalogue label holder made from blackened brass, with a blank inset strip of worn cool-gray rag paper, two small side screws, subtly uneven edges and faint oxidized teal patina
Style/medium: photorealistic scan of a real historical drawer-label fitting, materially convincing metal and paper, restrained and utilitarian
Composition/framing: a single isolated horizontal plaque, front-on orthographic view, centered with generous padding; very wide and low; the inner paper area remains completely blank
Lighting/mood: flat neutral archival documentation light; no cast shadow
Color palette: charcoal brass, muted antique gold, cool old paper, tiny oxidized teal traces
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for local background removal
Constraints: background must be one uniform #ff00ff color with no shadows, gradients, texture, reflections, floor plane or lighting variation; crisp separated edges; do not use magenta in the object; no readable words, letters, numbers, symbols, logo, signature or watermark
Avoid: ornate Victorian filigree, steampunk gears, fantasy rune plaque, glossy CGI, bright gold, obvious AI artifacts
```

### 13. 封蜡档案装订带

```text
Use case: stylized-concept
Asset type: reusable horizontal edge ornament for dark archival website cards, section dividers and module footers
Primary request: one restrained 1920s evidence-file binding strip composed of a narrow frayed charcoal linen tape, three small tarnished brass paper fasteners, a short fragment of faded red sealing thread and one tiny cracked dark wax seal with no emblem
Style/medium: photorealistic flatbed scan of real historical stationery materials, physically plausible fibers, patina, worn edges and subtle age
Composition/framing: a single very wide low horizontal strip, front-on orthographic view, centered with generous padding; irregular but calm silhouette; no surrounding objects
Lighting/mood: flat neutral archival documentation light; no cast shadow
Color palette: charcoal linen, blackened brass, muted brown-red wax, a trace of oxidized teal
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for local background removal
Constraints: background must be one uniform #ff00ff color with no shadows, gradients, texture, reflections, floor plane or lighting variation; crisp separated edges; do not use magenta in the object; no readable text, letters, numbers, symbols, heraldry, tentacles, skulls, logo, signature or watermark
Avoid: decorative ribbon bow, fantasy scrollwork, steampunk machinery, bright red, glossy CGI, excessive complexity, obvious AI artifacts
```

