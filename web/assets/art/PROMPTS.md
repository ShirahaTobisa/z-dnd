# 美术提示词

## DnD 版场景图（NovelAI，2026-10-11）

用 NovelAI V5（`nai-diffusion-5-full`，采样器 `k_dpmpp_2m_sde`，28 步，2K 尺寸，提示词引导值 5.5，缩放引导值 0）生成，网页用的是转成 webp 的版本。补图时沿用同一组画师串，画风才统一。

- 画师串：`artist:wlop, artist:ask_(askzy), artist:kawacy, painterly, best quality, absurdres, very aesthetic, masterpiece, no text`（`dnd-bestiary-dragon` 只用 `artist:wlop`，好出单色素描）
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

### dnd-party-campfire.webp（横图）

用在：多人联机卡片

```text
multiple boys, multiple girls, adventurers, fantasy, from behind, sitting around campfire, night, forest clearing, cloak, armor, staff, bow (weapon), sword, starry sky, distant mountains, campfire glow, warm light, silhouette, wide shot, scenery, cinematic lighting, dark atmosphere
```

### dnd-launch-dragon.webp（竖图）

用在：开场动画

```text
no humans, dragon, western dragon, coiled around ruined tower, wings spread, full moon, night sky, clouds, castle ruins, mountains, moonlight, epic, fantasy, dark atmosphere, cinematic lighting, from below, vertical composition
```

### dnd-bestiary-dragon.webp（竖图）

用在：手册、空状态水印

```text
no humans, traditional media, ink sketch, monochrome, sepia, western dragon, anatomy study, side view, wings, skeleton sketch, old paper, parchment, aged paper, scientific illustration, naturalist sketch, hatching, white space, no text
```

### dnd-brand-medallion.webp（方图）

用在：侧栏品牌徽章（裁成 384×384）

```text
no humans, still life, round brass medallion, coin, dragon relief, embossed dragon, coiled dragon, circular emblem, ornate border, metal, antique gold, centered, front view, symmetrical, dark background, simple background, rim light, close-up, no text, no letters
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

### 9. 海藻腊叶标本

```text
Use case: scientific-educational
Asset type: decorative natural-history plate for library cards, archive empty states and side-panel accents in a dark Cthulhu tabletop web app
Primary request: an authentic late-19th-century pressed marine algae herbarium sheet with three distinct specimens of dark branching seaweed, a few salt crystals and a tiny dried shell fragment, arranged by a real museum curator
Style/medium: photorealistic flatbed scan of genuine pressed specimens mounted on aged cool-gray rag paper; delicate organic edges, brittle fibers, faded pigment, subtle mounting-thread shadows and uneven paper wear
Composition/framing: portrait plate, specimens distributed vertically with generous margins and natural asymmetry; visually interesting silhouette at small size
Lighting/mood: flat archival scan, scientifically sober, coastal, melancholy and faintly uncanny
Color palette: charcoal brown, desaturated bottle green, oxidized teal, cool old paper and restrained sepia
Constraints: all label areas blank; no readable text, letters, numbers, handwriting, stamps, logos, signatures, decorative frame or watermark; no tentacle monster or fantasy anatomy
Avoid: botanical illustration look, modern stock photography, bright green plants, perfect symmetry, glossy wet surfaces, obvious AI artifacts
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

### 15. 科学仪器状态表圈

```text
Use case: stylized-concept
Asset type: reusable status medallion and section-heading accent for a dark archival website
Primary request: one small circular 1890s scientific instrument bezel made from blackened brass, with a recessed center of dark blue-black enamel, a thin oxidized teal calibration ring and four tiny flush screws
Style/medium: photorealistic museum-object scan, restrained precision instrument hardware with real patina, scratches and slightly imperfect machining
Composition/framing: one isolated circular token, front-on orthographic view, centered with generous padding, strong simple silhouette
Lighting/mood: flat archival documentation light, no cast shadow
Color palette: charcoal brass, muted antique gold, near-black navy enamel and restrained oxidized teal
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for local removal
Constraints: the center is blank; background is one uniform #ff00ff with no gradient, shadow, texture, reflection or floor plane; do not use magenta in the object; no glyph, eye, star, rune, readable text, letters, numbers, logo, signature or watermark
Avoid: coin portrait, occult seal, compass rose, steampunk gear, glossy CGI, bright gold, obvious AI artifacts
```

