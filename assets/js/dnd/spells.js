// SRD 法术表（说明为自行概括，非原书文字）。一行一个法术：
// id|名称|环阶|学派|施法时间|射程|持续时间|标签|职业|机制|说明
// 施法时间：A 动作 / B 附赠动作 / R 反应 / 其余为时长；持续时间：I 立即；标签：c 专注，r 仪式
// 职业：B 吟游诗人 C 牧师 D 德鲁伊 P 圣武士 R 游侠 S 术士 K 邪术师 W 法师
// 机制（; 分隔）：a:伤害骰:类型[:r3 固定 3 道射线 | :rc 戏法按等级增加射线] 法术攻击；
//   s:属性:伤害骰:类型[:h 成功减半] 豁免；h:治疗骰 治疗；t:临时生命；d:伤害骰:类型 必中伤害；
//   u:每升一环增加 / u2:每升两环增加；骰子中的 m 代表施法属性调整值
(function (root) {
    const RAW = `
acidSplash|酸液飞溅|0|咒法|A|60尺|I||SW|s:DEX:1d6:强酸|向一或两个相邻生物泼洒酸液。
chillTouch|颤栗之触|0|死灵|A|120尺|1轮||SKW|a:1d8:黯蚀|幽灵之手攻击，目标到你下回合前无法回复生命。
dancingLights|舞光术|0|塑能|A|120尺|1分|c|BSW||制造至多四团可移动的光点。
druidcraft|德鲁伊伎俩|0|变化|A|30尺|I||D||预测天气、催开花朵等自然小把戏。
eldritchBlast|魔能爆|0|塑能|A|120尺|I||K|a:1d10:力场:rc|力场光束，5、11、17 级各多一道，每道单独攻击。
fireBolt|火焰箭|0|塑能|A|120尺|I||SW|a:1d10:火焰|投出一道火焰，可点燃未被持握的易燃物。
guidance|神导术|0|预言|A|触及|1分|c|CD||目标的下一次属性检定加 1d4。
light|光亮术|0|塑能|A|触及|1时||BCSW||令一个物体发出明亮光线。
mageHand|法师之手|0|咒法|A|30尺|1分||BSKW||召唤一只灵体之手搬运轻物、开门。
mending|修复术|0|变化|1m|触及|I||BCDSW||修好物品上的一处破损。
message|传讯术|0|变化|A|120尺|1轮||BSW||与远处的生物低声传话。
minorIllusion|次级幻象|0|幻术|A|30尺|1分||BSKW||制造一个声音或一幅静止的图像。
poisonSpray|毒气喷射|0|咒法|A|10尺|I||DSKW|s:CON:1d12:毒素|向目标喷出毒雾。
prestidigitation|魔法伎俩|0|变化|A|10尺|1时||BSKW||清洁、调味、点火、变色等小戏法。
produceFlame|燃火术|0|咒法|A|自身|10分||D|a:1d8:火焰|手中生出火焰照明，也可投掷出去攻击。
rayOfFrost|冷冻射线|0|塑能|A|60尺|I||SW|a:1d8:冷冻|命中后目标速度降低 10 尺。
resistance|抵抗术|0|防护|A|触及|1分|c|CD||目标的下一次豁免加 1d4。
sacredFlame|圣火术|0|塑能|A|60尺|I||C|s:DEX:1d8:光耀|无视掩护的神圣火焰。
shillelagh|橡棍术|0|变化|B|触及|1分||D||木棍或长棍改用施法属性攻击，伤害骰变为 d8。
shockingGrasp|电爪|0|塑能|A|触及|I||SW|a:1d8:闪电|对穿金属甲的目标具有优势，命中后目标失去反应。
spareTheDying|维生术|0|死灵|A|触及|I||C||稳定一名生命为 0 的生物。
thaumaturgy|奇术|0|变化|A|30尺|1分||C||声音洪亮、火焰摇曳、大地震动等神迹。
trueStrike|克敌机先|0|预言|A|30尺|1轮|c|BSKW||下回合对目标的第一次攻击具有优势。
viciousMockery|恶言相加|0|惑控|A|60尺|I||B|s:WIS:1d4:心灵|恶毒的话语伤人，失败者下一次攻击具有劣势。
alarm|警报术|1|防护|1m|30尺|8时|r|RW||有生物进入区域时向你发出警报。
animalFriendship|化兽为友|1|惑控|A|30尺|24时||BDR||魅惑一只野兽（感知豁免）。
bane|灾祸术|1|惑控|A|30尺|1分|c|BC||至多三个生物的攻击和豁免减 1d4（魅力豁免）。
bless|祝福术|1|惑控|A|30尺|1分|c|CP||至多三个生物的攻击和豁免加 1d4。
burningHands|燃烧之手|1|塑能|A|自身(15尺锥)|I||SW|s:DEX:3d6:火焰:h;u:1d6|从指尖喷出扇形火焰。
charmPerson|魅惑人类|1|惑控|A|30尺|1时||BDSKW||魅惑一个类人生物（感知豁免）。
colorSpray|七彩喷射|1|幻术|A|自身(15尺锥)|1轮||SW||按生命值从低到高令生物目盲，共 6d10 点。
command|命令术|1|惑控|A|60尺|1轮||CP||下达一个词的命令（感知豁免）。
comprehendLanguages|通晓语言|1|预言|A|自身|1时|r|BSKW||理解任何口头和书面语言。
createOrDestroyWater|造水术/枯水术|1|变化|A|30尺|I||CD||制造或消除水。
cureWounds|治疗伤口|1|塑能|A|触及|I||BCDPR|h:1d8+m;u:1d8|触碰一个生物为其回复生命。
detectEvilAndGood|侦测善恶|1|预言|A|自身|10分|c|CP||感知附近的天界、邪魔、不死等生物。
detectMagic|侦测魔法|1|预言|A|自身|10分|cr|BCDPRSW||感知 30 尺内的魔法。
detectPoisonAndDisease|侦测毒素和疾病|1|预言|A|自身|10分|cr|CDPR||感知附近的毒素与疾病。
disguiseSelf|易容术|1|幻术|A|自身|1时||BSW||改变自己的外貌。
divineFavor|神恩|1|塑能|B|自身|1分|c|P||武器命中额外造成 1d4 光耀伤害。
divineSmite|至圣斩|1|塑能|B|自身|I||P|d:2d8:光耀;u:1d8|武器命中后追加光耀伤害（对邪魔与不死再加 1d8）。
entangle|纠缠术|1|咒法|A|90尺|1分|c|D||藤蔓缠住区域内的生物（力量豁免）。
expeditiousRetreat|脚底抹油|1|变化|B|自身|10分|c|SKW||每回合可用附赠动作疾走。
faerieFire|妖火|1|塑能|A|60尺|1分|c|BD||照亮区域内生物，攻击它们具有优势（敏捷豁免）。
falseLife|虚假生命|1|死灵|A|自身|1时||SW|t:1d4+4;u:5|获得临时生命。
featherFall|羽落术|1|变化|R|60尺|1分||BSW||至多五个下坠的生物缓缓落地。
findFamiliar|寻获魔宠|1|咒法|1h|10尺|I|r|W||召唤一只魔宠。
floatingDisk|浮碟术|1|咒法|A|30尺|1时|r|W||召唤一个能载物的力场圆盘。
fogCloud|云雾术|1|咒法|A|120尺|1时|c|DRSW||制造遮蔽视线的浓雾。
goodberry|神莓术|1|变化|A|触及|I||DR||制造十颗浆果，每颗回复 1 点生命。
grease|油腻术|1|咒法|A|60尺|1分||W||地面变滑，区域内生物可能倒地（敏捷豁免）。
guidingBolt|光导箭|1|塑能|A|120尺|1轮||C|a:4d6:光耀;u:1d6|命中后下一次攻击该目标具有优势。
healingWord|治愈真言|1|塑能|B|60尺|I||BCD|h:1d4+m;u:1d4|远距离为一个生物回复生命。
hellishRebuke|炼狱叱喝|1|塑能|R|60尺|I||K|s:DEX:2d10:火焰:h;u:1d10|被伤害时用地狱之火反击。
heroism|英雄气概|1|惑控|A|触及|1分|c|BP||目标免疫恐慌，每回合获得临时生命。
hideousLaughter|塔莎狂笑术|1|惑控|A|30尺|1分|c|BW||目标狂笑倒地并失能（感知豁免）。
huntersMark|猎人印记|1|预言|B|90尺|1时|c|R||对标记目标的武器伤害额外 1d6，追踪它具有优势。
identify|鉴定术|1|预言|1m|触及|I|r|BW||得知一件魔法物品的性质和用法。
illusoryScript|幻象文字|1|幻术|1m|触及|10天|r|BKW||写下只有指定对象能读懂的文字。
inflictWounds|致伤术|1|死灵|A|触及|I||C|a:3d10:黯蚀;u:1d10|近战法术攻击，造成黯蚀伤害。
jump|跳跃术|1|变化|A|触及|1分||DRSW||目标的跳跃距离变为三倍。
longstrider|大步奔行|1|变化|A|触及|1时||BDRW||目标速度 +10 尺。
mageArmor|法师护甲|1|防护|A|触及|8时||SW||未着甲时 AC 变为 13 + 敏捷调整值。
magicMissile|魔法飞弹|1|塑能|A|120尺|I||SW|d:3d4+3:力场;u:1d4+1|射出三枚必中的力场飞弹。
protectionFromEvilAndGood|防护善恶|1|防护|A|触及|10分|c|CPKW||异怪、天界、邪魔等攻击目标时具有劣势。
purifyFoodAndDrink|净化饮食|1|变化|A|10尺|I|r|CDP||净化有毒或腐坏的食物与饮水。
sanctuary|庇护术|1|防护|B|30尺|1分||C||敌人攻击目标前须先通过感知豁免。
shield|护盾术|1|防护|R|自身|1轮||SW||用反应获得 +5 AC，直到你的下回合开始。
shieldOfFaith|虔诚护盾|1|防护|B|60尺|10分|c|CP||目标 AC +2。
silentImage|无声幻影|1|幻术|A|60尺|10分|c|BSW||制造一个可移动的无声幻象。
sleep|睡眠术|1|惑控|A|90尺|1分||BSW||按生命值从低到高令生物入睡，共 5d8 点。
speakWithAnimals|动物交谈|1|预言|A|自身|10分|r|BDR||能与野兽交谈。
thunderwave|雷鸣波|1|塑能|A|自身(15尺立方)|I||BDSW|s:CON:2d8:雷鸣:h;u:1d8|冲击波推开周围生物。
unseenServant|隐形仆役|1|咒法|A|60尺|1时|r|BKW||召唤一个看不见的仆役做杂务。
acidArrow|梅尔夫强酸箭|2|塑能|A|90尺|I||W|a:4d4:强酸;u:1d4|命中后目标下回合再受 2d4 强酸伤害。
aid|援助术|2|防护|A|30尺|8时||CP||至多三个生物的生命上限和当前生命各 +5。
alterSelf|变身术|2|变化|A|自身|1时|c|SW||改变外形、适应水下或长出天生武器。
animalMessenger|动物传讯|2|惑控|A|30尺|24时|r|BDR||派一只小动物传递口信。
arcaneLock|奥术锁|2|防护|A|触及|永久||W||用魔法锁住门或容器。
arcanistsMagicAura|奥术师魔法灵光|2|幻术|A|触及|24时||W||伪装物品或生物的魔法讯息。
augury|卜筮术|2|预言|1m|自身|I|r|C||预知半小时内某项行动的吉凶。
barkskin|树肤术|2|变化|A|触及|1时|c|DR||目标的 AC 不会低于 16。
blindnessDeafness|目盲/耳聋术|2|死灵|A|30尺|1分||BCSW||令目标目盲或耳聋（体质豁免）。
blur|朦胧术|2|幻术|A|自身|1分|c|SW||身形模糊，攻击你的检定具有劣势。
calmEmotions|安定心神|2|惑控|A|60尺|1分|c|BC||压制魅惑、恐慌或敌意（魅力豁免）。
continualFlame|不灭明焰|2|塑能|A|触及|永久||CW||制造永不熄灭、不发热的火焰。
darkness|黑暗术|2|塑能|A|60尺|10分|c|KSW||制造一片魔法黑暗。
darkvision|黑暗视觉|2|变化|A|触及|8时||DRSW||目标获得 60 尺黑暗视觉。
detectThoughts|侦测思想|2|预言|A|自身|1分|c|BSW||读取附近生物的表层思想。
enhanceAbility|强化属性|2|变化|A|触及|1时|c|BCDS||目标某项属性的检定具有优势等增益。
enlargeReduce|变巨术/缩小术|2|变化|A|30尺|1分|c|SW||令目标体型变大或变小。
enthrall|迷惑术|2|惑控|A|60尺|1分||BK||令附近生物的注意力被你吸引。
findSteed|寻获坐骑|2|咒法|10m|30尺|I||P||召唤一匹聪慧忠诚的坐骑。
findTraps|搜寻陷阱|2|预言|A|120尺|I||CDR||感知附近是否有陷阱。
flameBlade|焰刃术|2|塑能|B|自身|10分|c|D|a:3d6:火焰;u2:1d6|手中生成火焰之刃，进行近战法术攻击。
flamingSphere|炽焰法球|2|咒法|A|60尺|1分|c|DW|s:DEX:2d6:火焰:h;u:1d6|可移动的火球撞击附近生物。
gentleRepose|遗体防腐|2|死灵|A|触及|10天|r|CW||防止尸体腐坏或成为不死生物。
gustOfWind|造风术|2|塑能|A|自身(60尺线)|1分|c|DSW||强风推开直线上的生物（力量豁免）。
heatMetal|灼热金属|2|变化|A|60尺|1分|c|BD|d:2d8:火焰;u:1d8|加热金属物品，持有或穿戴者受伤。
holdPerson|人类定身术|2|惑控|A|60尺|1分|c|BCDSKW||令一个类人生物麻痹（感知豁免）。
invisibility|隐形术|2|幻术|A|触及|1时|c|BSKW||目标隐形，攻击或施法后结束。
knock|敲击术|2|变化|A|60尺|I||BSW||打开锁住的门或容器，并发出巨响。
lesserRestoration|次级复原术|2|防护|A|触及|I||BCDPR||解除一种疾病，或目盲、耳聋、麻痹、中毒。
levitate|浮空术|2|变化|A|60尺|10分|c|SW||令目标升空悬浮。
locateAnimalsOrPlants|动植物定位术|2|预言|A|自身|I|r|BDR||感知指定野兽或植物的位置。
locateObject|物品定位术|2|预言|A|自身|10分|c|BCDPRW||感知熟悉物品的方位。
magicMouth|魔嘴术|2|幻术|1m|30尺|永久|r|BW||物体在条件满足时说出留言。
magicWeapon|魔化武器|2|变化|B|触及|1时|c|PW||武器成为 +1 魔法武器。
mirrorImage|镜影术|2|幻术|A|自身|1分||SKW||制造三个分身替你吸引攻击。
mistyStep|迷踪步|2|咒法|B|自身|I||SKW||传送到 30 尺内可见的位置。
moonbeam|月华之光|2|塑能|A|120尺|1分|c|D|s:CON:2d10:光耀:h;u:1d10|月光柱灼烧进入其中的生物。
passWithoutTrace|行动无踪|2|防护|A|自身|1时|c|DR||你和同伴的隐匿检定 +10。
prayerOfHealing|治疗祷言|2|塑能|10m|30尺|I||C|h:2d8+m;u:1d8|为至多六个生物回复生命。
protectionFromPoison|防护毒素|2|防护|A|触及|1时||CDPR||中和毒素，并获得毒素抗性。
rayOfEnfeeblement|衰弱射线|2|死灵|A|60尺|1分|c|KW||目标用力量的武器伤害减半。
ropeTrick|魔绳术|2|变化|A|触及|1时||W||绳顶开启一个异次元藏身处。
scorchingRay|灼热射线|2|塑能|A|120尺|I||SW|a:2d6:火焰:r3;u:r|射出三道火焰射线，各自攻击，每升一环多一道。
seeInvisibility|识破隐形|2|预言|A|自身|1时||BSW||看见隐形的生物与以太位面。
shatter|粉碎音波|2|塑能|A|60尺|I||BSKW|s:CON:3d8:雷鸣:h;u:1d8|一声巨响震伤区域内的一切。
silence|沉默术|2|幻术|A|120尺|10分|cr|BCR||区域内没有声音，无法施展需要言语的法术。
spiderClimb|蛛行术|2|变化|A|触及|1时|c|SKW||能在墙壁和天花板上行走。
spikeGrowth|尖刺丛生|2|变化|A|150尺|10分|c|DR||地面长出尖刺，每移动 5 尺受 2d4 穿刺伤害。
spiritualWeapon|灵体武器|2|塑能|B|60尺|1分||C|a:1d8+m:力场;u2:1d8|召唤漂浮的灵体武器，用附赠动作攻击。
suggestion|暗示术|2|惑控|A|30尺|8时|c|BSKW||让目标执行一项听起来合理的建议（感知豁免）。
wardingBond|守护联结|2|防护|A|触及|1时||C||目标 AC 和豁免 +1，你分担它受到的伤害。
web|蛛网术|2|咒法|A|60尺|1时|c|SW||蛛网束缚区域内的生物（敏捷豁免）。
zoneOfTruth|诚实之域|2|惑控|A|60尺|10分||BCP||区域内的生物无法故意说谎（魅力豁免）。
animateDead|操纵死尸|3|死灵|1m|10尺|I||CW||把尸体或骸骨变成听命的僵尸或骷髅。
beaconOfHope|希望信标|3|防护|A|30尺|1分|c|C||目标的感知豁免和死亡豁免具有优势，治疗取最大值。
bestowCurse|降咒|3|死灵|A|触及|1分|c|BCW||对目标施加一种诅咒（感知豁免）。
blink|闪烁术|3|变化|A|自身|1分||SW||每回合结束时可能消失到以太位面。
callLightning|召雷术|3|咒法|A|120尺|10分|c|D|s:DEX:3d10:闪电:h;u:1d10|召唤雷云，每回合可降下一道闪电。
clairvoyance|鹰眼术|3|预言|10m|1里|10分|c|BCSW||在远处制造一个隐形的感官。
conjureAnimals|召唤动物|3|咒法|A|60尺|1时|c|DR||召唤野兽协助战斗。
counterspell|法术反制|3|防护|R|60尺|I||SKW||打断他人施法，3 环以上需要检定。
createFoodAndWater|造粮术|3|咒法|A|30尺|I||CP||制造够十五人一天的食物和水。
daylight|昼明术|3|塑能|A|60尺|1时||CDPRS||制造大片阳光般的光线，可驱散魔法黑暗。
dispelMagic|解除魔法|3|防护|A|120尺|I||BCDPSKW||解除目标身上的法术效果。
fear|恐惧术|3|幻术|A|自身(30尺锥)|1分|c|BSKW||区域内生物恐慌并逃跑（感知豁免）。
fireball|火球术|3|塑能|A|150尺|I||SW|s:DEX:8d6:火焰:h;u:1d6|20 尺半径的火焰爆炸。
fly|飞行术|3|变化|A|触及|10分|c|SKW||目标获得 60 尺飞行速度。
gaseousForm|气化形体|3|变化|A|触及|1时|c|SKW||目标化为一团雾气。
glyphOfWarding|守卫刻文|3|防护|1h|触及|永久||BCW|s:DEX:5d8:元素:h;u:1d8|刻下符文，触发时爆炸或释放储存的法术。
haste|加速术|3|变化|A|30尺|1分|c|SW||目标速度翻倍、AC +2、多一个动作；结束时迟缓一回合。
hypnoticPattern|催眠图纹|3|幻术|A|120尺|1分|c|BSKW||魅惑区域内的生物并使其失能（感知豁免）。
lightningBolt|闪电束|3|塑能|A|自身(100尺线)|I||SW|s:DEX:8d6:闪电:h;u:1d6|射出一道直线闪电。
magicCircle|法阵|3|防护|1m|10尺|1时||CPKW||阻挡特定类型生物进出的法阵。
majorImage|高等幻象|3|幻术|A|120尺|10分|c|BSKW||带声音、气味和温度的逼真幻象。
massHealingWord|群体治愈真言|3|塑能|B|60尺|I||C|h:1d4+m;u:1d4|为至多六个生物回复生命。
meldIntoStone|融身入石|3|变化|A|触及|8时|r|CD||融入石头中藏身。
nondetection|回避侦测|3|防护|A|触及|8时||BRW||目标无法被预言魔法侦测。
phantomSteed|幻影驹|3|幻术|1m|30尺|1时|r|W||召唤一匹快速的幻影坐骑。
plantGrowth|植物滋长|3|变化|A|150尺|I||BDR||植物疯长成困难地形，或令作物丰收。
protectionFromEnergy|防护能量|3|防护|A|触及|1时|c|CDRSW||目标获得一种元素伤害的抗性。
removeCurse|移除诅咒|3|防护|A|触及|I||CPKW||解除生物或物品上的诅咒。
revivify|回生术|3|咒法|A|触及|I||CP||令一分钟内死亡的生物复活，恢复 1 点生命。
sending|短讯术|3|塑能|A|无限|1轮||BCW||向熟悉的生物发送一条短讯，对方可回复。
sleetStorm|雨夹雪|3|咒法|A|150尺|1分|c|DSW||冰雹覆盖区域，生物可能倒地、专注被打断。
slow|缓慢术|3|变化|A|120尺|1分|c|SW||至多六个生物 AC -2、速度减半、行动受限（感知豁免）。
speakWithDead|死者交谈|3|死灵|A|10尺|10分||BC||向一具尸体提出五个问题。
speakWithPlants|植物交谈|3|变化|A|自身|10分||BDR||与植物交流，并令其帮忙。
spiritGuardians|灵体卫士|3|咒法|A|自身(15尺)|10分|c|C|s:WIS:3d8:光耀:h;u:1d8|守护灵环绕你，伤害并减速附近敌人。
stinkingCloud|臭云术|3|咒法|A|90尺|1分|c|BSW||毒云令生物作呕、浪费动作（体质豁免）。
tinyHut|雷欧蒙小屋|3|塑能|1m|自身(10尺)|8时|r|BW||形成坚固舒适的半球形庇护所。
tongues|巧言术|3|预言|A|触及|1时||BCSKW||目标能理解并说出任何语言。
vampiricTouch|吸血鬼之触|3|死灵|A|自身|1分|c|KW|a:3d6:黯蚀;u:1d6|近战法术攻击，回复造成伤害一半的生命。
waterBreathing|水下呼吸|3|变化|A|30尺|24时|r|DRSW||至多十个生物能在水下呼吸。
waterWalk|水上行走|3|变化|A|30尺|1时|r|CDRS||至多十个生物能在液体表面行走。
windWall|风墙术|3|塑能|A|120尺|1分|c|DR|s:STR:3d8:钝击:h|强风之墙，阻挡箭矢等远程攻击。
arcaneEye|奥术之眼|4|预言|A|30尺|1时|c|W||制造一只隐形的飘浮魔眼替你侦察。
banishment|放逐术|4|防护|A|60尺|1分|c|CPSKW||把目标放逐到异界（魅力豁免）。
blackTentacles|艾伐黑触手|4|咒法|A|90尺|1分|c|W|s:DEX:3d6:钝击|触手束缚并伤害区域内的生物。
blight|枯萎术|4|死灵|A|30尺|I||DSKW|s:CON:8d8:黯蚀:h;u:1d8|吸干目标体内的水分与生机。
compulsion|强迫术|4|惑控|A|30尺|1分|c|B||迫使生物按你指定的方向移动（感知豁免）。
confusion|困惑术|4|惑控|A|90尺|1分|c|BDSW||区域内生物行动错乱（感知豁免）。
conjureMinorElementals|召唤次级元素|4|咒法|1m|90尺|1时|c|DW||召唤元素生物协助你。
conjureWoodlandBeings|召唤林地生物|4|咒法|A|60尺|1时|c|DR||召唤妖精生物协助你。
controlWater|操控水体|4|变化|A|300尺|10分|c|CDW||分开、涌起或旋转大片水体。
deathWard|死亡防护|4|防护|A|触及|8时||CP||目标首次降到 0 生命时改为剩 1 点。
dimensionDoor|任意门|4|咒法|A|500尺|I||BSKW||传送到 500 尺内的任意位置，可带一名同伴。
divination|预言术|4|预言|A|自身|I|r|C||向神祇询问一个关于近期事件的问题。
dominateBeast|支配野兽|4|惑控|A|60尺|1分|c|DS||控制一只野兽（感知豁免）。
fabricate|造物术|4|变化|10m|120尺|I||W||把原料加工成成品。
faithfulHound|魔邓肯忠犬|4|咒法|A|30尺|8时||W||召唤一只隐形的看门犬。
fireShield|火焰护盾|4|塑能|A|自身|10分||W||获得冷冻或火焰抗性，近战攻击你的生物受 2d8 伤害。
freedomOfMovement|行动自如|4|防护|A|触及|1时||BCDR||目标不受困难地形、麻痹和束缚影响。
giantInsect|巨虫术|4|变化|A|30尺|10分|c|D||把昆虫变成巨型生物为你作战。
greaterInvisibility|高等隐形术|4|幻术|A|触及|1分|c|BSW||目标隐形，攻击或施法后仍保持。
guardianOfFaith|信仰守卫|4|咒法|A|30尺|8时||C|s:DEX:20:光耀:h|召唤守卫伤害靠近的敌人，共造成 60 点后消失。
hallucinatoryTerrain|幻景|4|幻术|10m|300尺|24时||BDKW||把一片地形伪装成另一种地形。
iceStorm|冰风暴|4|塑能|A|300尺|I||DSW|s:DEX:2d8+4d6:钝击与冷冻:h;u:1d8|冰雹砸向区域，地面结冰。
locateCreature|生物定位术|4|预言|A|自身|1时|c|BCDPRW||感知熟悉生物的方位。
phantasmalKiller|幻影杀手|4|幻术|A|120尺|1分|c|W|s:WIS:4d10:心灵;u:1d10|把目标最深的恐惧具象化。
polymorph|变形术|4|变化|A|60尺|1时|c|BDSW||把一个生物变成野兽（感知豁免）。
privateSanctum|魔邓肯私人圣所|4|防护|10m|120尺|24时||W||保护区域不被窥探和传送。
resilientSphere|欧提路克弹力法球|4|塑能|A|30尺|1分|c|W||把生物困在力场球中（敏捷豁免）。
secretChest|李奥蒙秘藏箱|4|咒法|A|触及|I||W||把一个箱子藏到以太位面，随时召回。
stoneShape|塑石术|4|变化|A|触及|I||CDW||把石头塑造成任意形状。
stoneskin|石肤术|4|防护|A|触及|1时|c|DRSW||目标抵抗非魔法的钝击、穿刺、挥砍伤害。
wallOfFire|火墙术|4|塑能|A|120尺|1分|c|DSW|s:DEX:5d8:火焰:h;u:1d8|召唤一道火焰之墙。
animateObjects|活化物件|5|变化|A|120尺|1分|c|BSW||令至多十个物件活化为你作战。
antilifeShell|反生命护罩|5|防护|A|自身(10尺)|1时|c|D||阻挡构装与不死以外的生物靠近。
awaken|唤醒术|5|变化|8h|触及|I||BD||赋予一只野兽或植物智慧。
cloudkill|死云术|5|咒法|A|120尺|10分|c|SW|s:CON:5d8:毒素:h;u:1d8|一团会移动的剧毒云雾。
commune|通神术|5|预言|1m|自身|1分|r|C||向神祇提出三个是非问题。
communeWithNature|问道自然|5|预言|1m|自身|I|r|DR||得知周围的地形、水源和生物等信息。
coneOfCold|寒冰锥|5|塑能|A|自身(60尺锥)|I||SW|s:CON:8d8:冷冻:h;u:1d8|喷出锥形的刺骨寒气。
conjureElemental|召唤元素|5|咒法|1m|90尺|1时|c|DW||召唤一个元素生物。
contactOtherPlane|异界探知|5|预言|1m|自身|1分|r|KW||向异界存在提出五个问题（智力豁免）。
contagion|疫病术|5|死灵|A|触及|7天||CD||令目标染上一种疾病。
creation|创造术|5|幻术|1m|30尺|特殊||SW||用暗影物质制造临时物品。
dispelEvilAndGood|解除善恶|5|防护|A|自身|1分|c|CP||驱逐异界生物，解除魅惑与恐慌。
dominatePerson|支配人类|5|惑控|A|60尺|1分|c|BSW||控制一个类人生物（感知豁免）。
dream|托梦术|5|幻术|1m|特殊|8时||BKW||进入目标的梦境传讯或惊吓它。
flameStrike|焰击术|5|塑能|A|60尺|I||C|s:DEX:4d6+4d6:火焰与光耀:h;u:1d6|从天而降的神圣火柱。
geas|指使术|5|惑控|1m|60尺|30天||BCDPW||强制目标执行一项命令（感知豁免）。
greaterRestoration|高等复原术|5|防护|A|触及|I||BCD||解除魅惑、石化、诅咒、属性减值等。
hallow|圣居|5|塑能|24h|触及|永久||C||圣化一片区域，阻止特定生物进入。
holdMonster|怪物定身术|5|惑控|A|90尺|1分|c|BSKW||令任意生物麻痹（感知豁免）。
insectPlague|疫虫群|5|咒法|A|300尺|10分|c|CDS|s:CON:4d10:穿刺:h;u:1d10|蝗虫群叮咬区域内的生物。
legendLore|传说知识|5|预言|10m|自身|I||BCW||得知传说中的人物、地点或物品的信息。
massCureWounds|群体治疗伤口|5|咒法|A|60尺|I||BCD|h:3d8+m;u:1d8|为至多六个生物回复生命。
mislead|误导术|5|幻术|A|自身|1时|c|BW||自己隐形，同时制造一个分身。
modifyMemory|篡改记忆|5|惑控|A|30尺|1分|c|BW||修改目标的记忆（感知豁免）。
passwall|穿墙术|5|变化|A|30尺|1时||W||在墙壁上开出一条通道。
planarBinding|异界誓缚|5|防护|1h|60尺|24时||BCDW||束缚一个异界生物为你效力。
raiseDead|死者复活|5|死灵|1h|触及|I||BCP||复活十天内死亡的生物。
scrying|探知术|5|预言|10m|自身|10分|c|BCDKW||远距离观察一个生物（感知豁免）。
seeming|伪装术|5|幻术|A|30尺|8时||BSW||改变多个生物的外貌。
telekinesis|心灵遥控|5|变化|A|60尺|10分|c|SW||用意念移动生物或物体。
telepathicBond|心灵联结|5|预言|A|30尺|1时|r|W||至多八个生物之间心灵相通。
teleportationCircle|传送法阵|5|咒法|1m|10尺|1轮||BSW||传送到一个已知的永久法阵。
treeStride|树跃术|5|咒法|A|自身|1分|c|DR||在树木之间传送。
wallOfForce|力场墙|5|塑能|A|120尺|10分|c|W||召唤一道隐形且坚不可摧的力场墙。
wallOfStone|石墙术|5|塑能|A|120尺|10分|c|DSW||召唤一道石墙。
bladeBarrier|剑刃护壁|6|塑能|A|90尺|10分|c|C|s:DEX:6d10:挥砍:h|召唤一道旋转刀刃之墙。
chainLightning|连环闪电|6|塑能|A|150尺|I||SW|s:DEX:10d8:闪电:h|闪电跳跃，最多再击中三个目标。
circleOfDeath|死亡法阵|6|死灵|A|150尺|I||SKW|s:CON:8d6:黯蚀:h;u:2d6|负能量球体扩散。
conjureFey|召唤妖精|6|咒法|1m|90尺|1时|c|DK||召唤一个妖精生物。
contingency|触发术|6|塑能|10m|自身|10天||W||预设条件，满足时自动施展一个法术。
createUndead|制造不死生物|6|死灵|1m|10尺|I||CKW||制造食尸鬼等不死仆从。
disintegrate|解离术|6|变化|A|60尺|I||SW|s:DEX:10d6+40:力场;u:3d6|绿色射线，降到 0 生命的目标化为灰烬。
eyebite|恶眼术|6|死灵|A|自身|1分|c|BSKW||每回合令一个生物入睡、恐慌或作呕。
findThePath|寻路术|6|预言|1m|自身|1天|c|BCD||得知前往目的地的最佳路线。
fleshToStone|石化术|6|变化|A|60尺|1分|c|KW||把生物逐渐变成石头（体质豁免）。
forbiddance|禁制术|6|防护|10m|触及|1天|r|C||禁止传送进入，并伤害特定类型的生物。
freezingSphere|欧提路克冰封法球|6|塑能|A|300尺|I||W|s:CON:10d6:冷冻:h;u:1d6|冰冷的法球爆裂，可冻结水面。
globeOfInvulnerability|法术无效结界|6|防护|A|自身(10尺)|1分|c|SW||阻挡 5 环以下的法术。
guardsAndWards|守卫与结界|6|防护|10m|触及|24时||BW||用多种魔法守护一座建筑。
harm|重伤术|6|死灵|A|60尺|I||C|s:CON:14d6:黯蚀:h|重创目标，并降低其生命上限。
heal|医疗术|6|塑能|A|60尺|I||CD|h:70;u:10|回复 70 点生命，并解除目盲、耳聋和疾病。
heroesFeast|英雄宴|6|咒法|10m|30尺|I||CD||盛宴令参与者免疫毒素与恐慌，并增加生命上限。
instantSummons|德鲁米欧瞬间召物|6|咒法|1m|触及|直到解除|r|W||随时把标记的物品召回手中。
irresistibleDance|奥图迷舞|6|惑控|A|30尺|1分|c|BW||目标无法自控地跳舞。
magicJar|魂魄转移|6|死灵|1m|自身|直到解除||W||灵魂离体，附身其他生物。
massSuggestion|群体暗示术|6|惑控|A|60尺|24时||BSKW||向至多十二个生物下达暗示。
moveEarth|移土术|6|变化|A|120尺|2时|c|DSW||重塑一片地形。
planarAlly|异界盟友|6|咒法|10m|60尺|I||C||请求神祇派遣异界生物相助。
programmedIllusion|预置幻象|6|幻术|A|120尺|永久||BW||条件满足时出现的幻象。
sunbeam|阳炎射线|6|塑能|A|自身(60尺线)|1分|c|DSW|s:CON:6d8:光耀:h|灼热的阳光射线，失败者目盲。
transportViaPlants|植物传送|6|咒法|A|10尺|1轮||D||经由植物传送到远方。
trueSeeing|真知术|6|预言|A|触及|1时||BCSKW||看穿幻象、隐形与变形。
wallOfIce|冰墙术|6|塑能|A|120尺|10分|c|W|s:DEX:10d6:冷冻:h;u:2d6|召唤一道冰墙。
wallOfThorns|荆棘墙|6|咒法|A|120尺|10分|c|D|s:DEX:7d8:穿刺:h;u:1d8|召唤一道荆棘之墙。
windWalk|乘风而行|6|变化|1m|30尺|8时||D||把同伴化为云雾高速飞行。
wordOfRecall|回返真言|6|咒法|A|5尺|I||C||带领同伴传送回你的圣所。
arcaneSword|魔邓肯魔剑|7|塑能|A|60尺|1分|c|BW|a:3d10:力场|召唤一把可攻击的力场之剑。
conjureCelestial|召唤天界生物|7|咒法|1m|90尺|1时|c|C||召唤一个天界生物。
delayedBlastFireball|延迟爆裂火球|7|塑能|A|150尺|1分|c|SW|s:DEX:12d6:火焰:h;u:1d6|蓄力后爆炸，每多等一轮伤害增加。
divineWord|圣言术|7|塑能|B|30尺|I||C||按生命值令生物耳聋、目盲、震慑或死亡。
etherealness|虚体术|7|变化|A|自身|8时||BCSKW||进入以太位面。
fingerOfDeath|死亡一指|7|死灵|A|60尺|I||SKW|s:CON:7d8+30:黯蚀:h|杀死的类人生物会变成僵尸。
fireStorm|火焰风暴|7|塑能|A|150尺|I||CDS|s:DEX:7d10:火焰:h|大范围的熊熊烈焰。
forcecage|力场监牢|7|塑能|A|100尺|1时||BKW||把生物困在力场笼中。
magnificentMansion|魔邓肯豪宅|7|咒法|1m|300尺|24时||BW||开启一座异次元宅邸。
mirageArcane|海市蜃楼|7|幻术|10m|视线|10天||BDW||把大片地形伪装成另一种。
planeShift|位面转移|7|咒法|A|触及|I||CDSKW||前往其他位面，或把目标放逐过去。
prismaticSpray|虹光喷射|7|塑能|A|自身(60尺锥)|I||SW|s:DEX:10d6:多种:h|七色光芒，每个目标随机受到一种效果。
projectImage|投影术|7|幻术|A|500里|1天|c|BW||投射一个自己的幻象分身。
regenerate|再生术|7|变化|1m|触及|1时||BCD|h:4d8+15|回复生命，之后每回合再生，并长回断肢。
resurrection|复活术|7|死灵|1h|触及|I||BC||复活百年内死亡的生物。
reverseGravity|反转重力|7|变化|A|100尺|1分|c|DSW||区域内的重力反转。
sequester|隐匿术|7|变化|A|触及|直到解除||W||让目标隐形并陷入休眠。
simulacrum|拟像术|7|幻术|12h|触及|直到解除||W||制造一个冰雪复制体。
symbol|徽记术|7|防护|1m|触及|直到解除||BCW||刻下触发时产生强大效果的徽记。
teleport|传送术|7|咒法|A|10尺|I||BSW||传送到很远的地方。
animalShapes|动物形态|8|变化|A|30尺|24时|c|D||把多个生物变成野兽。
antimagicField|反魔法力场|8|防护|A|自身(10尺)|1时|c|CW||区域内的魔法全部失效。
antipathySympathy|反感/共感术|8|惑控|1h|60尺|10天||DW||令特定生物厌恶或被吸引。
clone|克隆术|8|死灵|1h|触及|I||W||培育一个备用的身体。
controlWeather|操控天气|8|变化|10m|自身(5里)|8时|c|CDW||改变一大片区域的天气。
demiplane|半位面|8|咒法|A|60尺|1时||KW||开启一扇通往空房间半位面的门。
dominateMonster|支配怪物|8|惑控|A|60尺|1时|c|BSKW||控制任意生物（感知豁免）。
earthquake|地震术|8|塑能|A|500尺|1分|c|CDS||引发剧烈的地震。
feeblemind|弱智术|8|惑控|A|150尺|I||BDKW|s:INT:4d6:心灵|失败者的智力和魅力降为 1。
glibness|舌粲莲花|8|变化|A|自身|1时||BK||魅力检定至少按 15 计，谎言不会被魔法识破。
holyAura|圣洁灵光|8|防护|A|自身|1分|c|C||盟友的豁免具有优势，攻击它们具有劣势。
incendiaryCloud|燃烧云|8|咒法|A|150尺|1分|c|SW|s:DEX:10d8:火焰:h|一团会移动的燃烧烟云。
maze|迷宫术|8|咒法|A|60尺|10分|c|W||把目标放逐到迷宫半位面。
mindBlank|心灵屏障|8|防护|A|触及|24时||BW||免疫心灵伤害与读心、预言。
powerWordStun|律令：震慑|8|惑控|A|60尺|I||BSKW||震慑生命不超过 150 的生物。
sunburst|阳爆术|8|塑能|A|150尺|I||DSW|s:CON:12d6:光耀:h|耀眼的阳光爆发，失败者目盲。
astralProjection|星界投射|9|死灵|1h|10尺|特殊||CKW||让灵体进入星界。
foresight|预警术|9|预言|1m|触及|8时||BDKW||目标的检定具有优势，攻击它的检定具有劣势。
gate|异界之门|9|咒法|A|60尺|1分|c|CSW||开启通往其他位面的传送门。
imprisonment|禁锢术|9|防护|1m|30尺|直到解除||KW||用多种方式永久禁锢一个生物。
massHeal|群体医疗术|9|咒法|A|60尺|I||C|h:700|把 700 点治疗分给附近的生物。
meteorSwarm|流星爆|9|塑能|A|1里|I||SW|s:DEX:20d6+20d6:火焰与钝击:h|召唤四颗流星爆炸。
powerWordKill|律令：死亡|9|惑控|A|60尺|I||BSKW||杀死生命不超过 100 的生物。
prismaticWall|虹光墙|9|防护|A|60尺|10分||W||召唤一道七层光幕之墙。
shapechange|形态变换|9|变化|A|自身|1时|c|DW||变成其他生物的形态。
stormOfVengeance|复仇风暴|9|咒法|A|视线|1分|c|D||召唤毁灭性的风暴云。
timeStop|时间停止|9|变化|A|自身|I||SW||获得 1d4+1 个额外回合。
truePolymorph|完全变形术|9|变化|A|30尺|1时|c|BKW||把生物或物品变成其他东西。
trueResurrection|完全复活术|9|死灵|1h|触及|I||CD||复活两百年内死亡的生物。
weird|怪诞术|9|幻术|A|120尺|1分|c|W|s:WIS:4d10:心灵|对一群目标施加致命的恐惧幻象。
wish|祈愿术|9|咒法|A|自身|I||SW||最强大的法术，可复制 8 环以下的任何法术。
brandingSmite|烙印斩|2|塑能|B|自身|1分|c|P|d:2d6:光耀;u:1d6|下一次武器命中时追加光耀伤害，隐形的目标会现出身形。
arcaneHand|魔法巨掌|5|塑能|A|120尺|1分|c|W|a:4d8:力场;u:2d8|召唤一只力场巨手，可以握拳攻击、推撞、抓住或挡住生物。
reincarnate|转生术|5|变化|1h|触及|I||D||让死去不超过十天的类人生物以随机的新身体复活。
`;
    // 2024 版（SRD 5.2）与上面不同的法术：整行覆盖；新增法术也写在这里
    const RAW_2024 = `
acidSplash|酸液飞溅|0|塑能|A|60尺|I||SW|s:DEX:1d6:强酸|向一或两个相邻生物泼洒酸液。
chillTouch|颤栗之触|0|死灵|A|触及|I||SKW|a:1d10:黯蚀|近战法术攻击，目标到你下回合结束前无法回复生命。
dancingLights|舞光术|0|幻术|A|120尺|1分|c|BSW||制造至多四团可移动的光点。
message|传讯术|0|变化|A|120尺|1轮||BDSW||与远处的生物低声传话。
poisonSpray|毒气喷射|0|死灵|A|30尺|I||DSKW|s:CON:1d12:毒素|向目标喷出毒雾。
produceFlame|燃火术|0|咒法|B|自身|10分||D|a:1d8:火焰|手中生出火焰照明，也可投掷出去攻击。
shillelagh|橡棍术|0|变化|B|自身|1分||D||木棍或长棍改用施法属性攻击，伤害骰为 d8（5、11、17 级提升），可改为力场伤害。
spareTheDying|维生术|0|死灵|A|15尺|I||CD||稳定一名生命为 0 的生物。
trueStrike|克敌机先|0|预言|A|自身|I||BSKW||用施法属性代替力量或敏捷进行一次武器攻击，可改为光耀伤害；5 级起额外光耀伤害。
viciousMockery|恶言相加|0|惑控|A|60尺|I||B|s:WIS:1d6:心灵|恶毒的话语伤人，失败者下一次攻击检定具有劣势。
bane|灾祸术|1|惑控|A|30尺|1分|c|BCK||至多三个生物的攻击和豁免减 1d4（魅力豁免）。
colorSpray|七彩喷射|1|幻术|A|自身(15尺锥)|I||BSW||锥形范围内的生物体质豁免，失败者目盲到你下回合结束。
command|命令术|1|惑控|A|60尺|I||BCP||下达一个词的命令（感知豁免）。
cureWounds|治疗伤口|1|防护|A|触及|I||BCDPR|h:2d8+m;u:2d8|触碰一个生物为其回复生命。
detectMagic|侦测魔法|1|预言|A|自身|10分|cr|BCDPRSKW||感知 30 尺内的魔法。
divineFavor|神恩|1|变化|B|自身|1分||P||武器命中额外造成 1d4 光耀伤害。
entangle|纠缠术|1|咒法|A|90尺|1分|c|DR||藤蔓缠住区域内的生物（力量豁免）。
falseLife|虚假生命|1|死灵|A|自身|I||SW|t:2d4+4;u:5|获得临时生命。
goodberry|神莓术|1|咒法|A|自身|24时||DR||制造十颗浆果，每颗回复 1 点生命。
grease|油腻术|1|咒法|A|60尺|1分||SW||地面变滑，区域内生物可能倒地（敏捷豁免）。
healingWord|治愈真言|1|防护|B|60尺|I||BCD|h:2d4+m;u:2d4|附赠动作为视线内一个生物回复生命。
hideousLaughter|塔莎狂笑术|1|惑控|A|30尺|1分|c|BKW||目标狂笑倒地并失能（感知豁免）。
inflictWounds|致伤术|1|死灵|A|触及|I||C|s:CON:2d10:黯蚀:h;u:1d10|触碰一个生物，体质豁免失败受黯蚀伤害，成功减半。
jump|跳跃术|1|变化|B|触及|1分||DRSW||目标的跳跃距离变为三倍。
protectionFromEvilAndGood|防护善恶|1|防护|A|触及|10分|c|CDPKW||异怪、天界、邪魔等攻击目标时具有劣势。
sleep|睡眠术|1|惑控|A|60尺|1分|c|BSW||范围内生物感知豁免，失败者失能，回合结束再失败则陷入昏睡；需专注。
speakWithAnimals|动物交谈|1|预言|A|自身|10分|r|BDRK||能与野兽交谈。
aid|援助术|2|防护|A|30尺|8时||BCDPR||至多三个生物的生命上限和当前生命各 +5。
augury|卜筮术|2|预言|1m|自身|I|r|CDW||预知半小时内某项行动的吉凶。
barkskin|树肤术|2|变化|B|触及|1时||DR||目标的 AC 不会低于 17，不需专注。
blindnessDeafness|目盲/耳聋术|2|变化|A|120尺|1分||BCSW||令目标目盲或耳聋（体质豁免）。
continualFlame|不灭明焰|2|塑能|A|触及|永久||CDW||制造永不熄灭、不发热的火焰。
darkness|黑暗术|2|塑能|A|60尺|10分|c|SKW||制造一片魔法黑暗。
enhanceAbility|强化属性|2|变化|A|触及|1时|c|BCDRSW||目标某项属性的检定具有优势等增益。
enlargeReduce|变巨术/缩小术|2|变化|A|30尺|1分|c|BDSW||令目标体型变大或变小。
enthrall|迷惑术|2|惑控|A|60尺|1分|c|BK||令附近生物的注意力被你吸引。
findSteed|寻获坐骑|2|咒法|A|30尺|I||P||召唤一匹聪慧忠诚的坐骑。
flameBlade|焰刃术|2|塑能|B|自身|10分|c|DS|a:3d6:火焰;u2:1d6|手中生成火焰之刃，进行近战法术攻击。
flamingSphere|炽焰法球|2|咒法|A|60尺|1分|c|DSW|s:DEX:2d6:火焰:h;u:1d6|可移动的火球撞击附近生物。
gentleRepose|遗体防腐|2|死灵|A|触及|10天|r|CPW||防止尸体腐坏或成为不死生物。
gustOfWind|造风术|2|塑能|A|自身(60尺线)|1分|c|DRSW||强风推开直线上的生物（力量豁免）。
lesserRestoration|次级复原术|2|防护|B|触及|I||BCDPR||解除一种疾病，或目盲、耳聋、麻痹、中毒。
magicWeapon|魔化武器|2|变化|B|触及|1时||PRSW||武器成为 +1 魔法武器。
mirrorImage|镜影术|2|幻术|A|自身|1分||BSKW||制造三个分身替你吸引攻击。
prayerOfHealing|治疗祷言|2|防护|10m|30尺|I||CP|h:2d8+m;u:1d8|为至多六个生物回复生命。
shatter|粉碎音波|2|塑能|A|60尺|I||BSW|s:CON:3d8:雷鸣:h;u:1d8|一声巨响震伤区域内的一切。
spiritualWeapon|灵体武器|2|塑能|B|60尺|1分|c|C|a:1d8+m:力场;u:1d8|召唤漂浮的灵体武器，用附赠动作移动并攻击；需专注。
wardingBond|守护联结|2|防护|A|触及|1时||CP||目标 AC 和豁免 +1，你分担它受到的伤害。
conjureAnimals|召唤动物|3|咒法|A|60尺|10分|c|DR||召唤野兽协助战斗。
dispelMagic|解除魔法|3|防护|A|120尺|I||BCDPRSKW||解除目标身上的法术效果。
massHealingWord|群体治愈真言|3|防护|B|60尺|I||BC|h:2d4+m;u:1d4|为至多六个生物回复生命。
meldIntoStone|融身入石|3|变化|A|触及|8时|r|CDR||融入石头中藏身。
revivify|回生术|3|死灵|A|触及|I||CDPR||令一分钟内死亡的生物复活，恢复 1 点生命。
sending|短讯术|3|预言|A|无限|I||BCW||向熟悉的生物发送一条短讯，对方可回复。
slow|缓慢术|3|变化|A|120尺|1分|c|BSW||至多六个生物 AC -2、速度减半、行动受限（感知豁免）。
speakWithDead|死者交谈|3|死灵|A|10尺|10分||BCW||向一具尸体提出五个问题。
vampiricTouch|吸血鬼之触|3|死灵|A|自身|1分|c|SKW|a:3d6:黯蚀;u:1d6|近战法术攻击，回复造成伤害一半的生命。
windWall|风墙术|3|塑能|A|120尺|1分|c|DR|s:STR:4d8:钝击:h|竖起一道狂风之墙，阻挡箭矢和小型飞行物。
banishment|放逐术|4|防护|A|30尺|1分|c|CPSKW||把目标放逐到异界（魅力豁免）。
conjureMinorElementals|召唤次级元素|4|咒法|A|自身|10分|c|DW||召唤元素生物协助你。
conjureWoodlandBeings|召唤林地生物|4|咒法|A|自身|10分|c|DR||召唤妖精生物协助你。
divination|预言术|4|预言|A|自身|I|r|CDW||向神祇询问一个关于近期事件的问题。
dominateBeast|支配野兽|4|惑控|A|60尺|1分|c|DRS||控制一只野兽（感知豁免）。
fireShield|火焰护盾|4|塑能|A|自身|10分||DSW||获得冷冻或火焰抗性，近战攻击你的生物受 2d8 伤害。
giantInsect|巨虫术|4|咒法|A|60尺|10分|c|D||把昆虫变成巨型生物为你作战。
iceStorm|冰风暴|4|塑能|A|300尺|I||DSW|s:DEX:2d10+4d6:钝击与冷冻:h;u:1d10|冰雹砸落，地面变为困难地形。
phantasmalKiller|幻影杀手|4|幻术|A|120尺|1分|c|BW|s:WIS:4d10:心灵;u:1d10|把目标最深的恐惧具象化。
resilientSphere|欧提路克弹力法球|4|防护|A|30尺|1分|c|W||把生物困在力场球中（敏捷豁免）。
secretChest|李奥蒙秘藏箱|4|咒法|A|触及|直到解除||W||把一个箱子藏到以太位面，随时召回。
stoneskin|石肤术|4|变化|A|触及|1时|c|DRSW||目标抵抗钝击、穿刺、挥砍伤害。
coneOfCold|寒冰锥|5|塑能|A|自身(60尺锥)|I||DSW|s:CON:8d8:冷冻:h;u:1d8|喷出锥形的刺骨寒气。
conjureElemental|召唤元素|5|咒法|A|60尺|10分|c|DW||召唤一个元素生物。
flameStrike|焰击术|5|塑能|A|60尺|I||C|s:DEX:5d6+5d6:火焰与光耀:h;u:2d6|一道神圣火柱从天而降。
greaterRestoration|高等复原术|5|防护|A|触及|I||BCDPR||解除魅惑、石化、诅咒、属性减值等。
hallow|圣居|5|防护|24h|触及|永久||C||圣化一片区域，阻止特定生物进入。
massCureWounds|群体治疗伤口|5|防护|A|60尺|I||BCD|h:5d8+m;u:1d8|为至多六个生物回复生命。
mislead|误导术|5|幻术|A|自身|1时|c|BKW||自己隐形，同时制造一个分身。
planarBinding|异界誓缚|5|防护|1h|60尺|24时||BCDKW||束缚一个异界生物为你效力。
telepathicBond|心灵联结|5|预言|A|30尺|1时|r|BW||至多八个生物之间心灵相通。
teleportationCircle|传送法阵|5|咒法|1m|10尺|1轮||BSKW||传送到一个已知的永久法阵。
circleOfDeath|死亡法阵|6|死灵|A|150尺|I||SKW|s:CON:8d8:黯蚀:h;u:2d8|负能量球体向外扩散。
conjureFey|召唤妖精|6|咒法|A|60尺|10分|c|D||召唤一个妖精生物。
contingency|触发术|6|防护|10m|自身|10天||W||预设条件，满足时自动施展一个法术。
fleshToStone|石化术|6|变化|A|60尺|1分|c|DSW||把生物逐渐变成石头（体质豁免）。
freezingSphere|欧提路克冰封法球|6|塑能|A|300尺|I||SW|s:CON:10d6:冷冻:h;u:1d6|冰冷的法球爆裂，可冻结水面。
guardsAndWards|守卫与结界|6|防护|1h|触及|24时||BW||用多种魔法守护一座建筑。
heal|医疗术|6|防护|A|60尺|I||CD|h:70;u:10|回复 70 点生命，并解除目盲、耳聋和疾病。
heroesFeast|英雄宴|6|咒法|10m|自身|I||BCD||盛宴令参与者免疫毒素与恐慌，并增加生命上限。
massSuggestion|群体暗示术|6|惑控|A|60尺|24时||BSW||向至多十二个生物下达暗示。
sunbeam|阳炎射线|6|塑能|A|自身(60尺线)|1分|c|CDSW|s:CON:6d8:光耀:h|灼热的阳光射线，失败者目盲。
transportViaPlants|植物传送|6|咒法|A|10尺|1分||D||经由植物传送到远方。
arcaneSword|魔邓肯魔剑|7|塑能|A|90尺|1分|c|BW|a:4d12:力场|召唤一柄力场之剑，用附赠动作攻击。
conjureCelestial|召唤天界生物|7|咒法|A|90尺|10分|c|C||召唤一个天界生物。
etherealness|虚体术|7|咒法|A|自身|8时||BCSKW||进入以太位面。
forcecage|力场监牢|7|塑能|A|100尺|1时|c|BKW||把生物困在力场笼中。
prismaticSpray|虹光喷射|7|塑能|A|自身(60尺锥)|I||BSW|s:DEX:12d6:多种:h|七色光束射出，每道光效果不同。
symbol|徽记术|7|防护|1m|触及|直到解除||BCDW||刻下触发时产生强大效果的徽记。
animalShapes|动物形态|8|变化|A|30尺|24时||D||把多个生物变成野兽。
antipathySympathy|反感/共感术|8|惑控|1h|60尺|10天||BDW||令特定生物厌恶或被吸引。
demiplane|半位面|8|咒法|A|60尺|1时||SKW||开启一扇通往空房间半位面的门。
earthquake|地震术|8|变化|A|500尺|1分|c|CDS||引发剧烈的地震。
glibness|舌粲莲花|8|惑控|A|自身|1时||BK||魅力检定至少按 15 计，谎言不会被魔法识破。
incendiaryCloud|燃烧云|8|咒法|A|150尺|1分|c|DSW|s:DEX:10d8:火焰:h|一团会移动的燃烧烟云。
sunburst|阳爆术|8|塑能|A|150尺|I||CDSW|s:CON:12d6:光耀:h|耀眼的阳光爆发，失败者目盲。
astralProjection|星界投射|9|死灵|1h|10尺|直到解除||CKW||让灵体进入星界。
gate|异界之门|9|咒法|A|60尺|1分|c|CSKW||开启通往其他位面的传送门。
massHeal|群体医疗术|9|防护|A|60尺|I||C|h:700|把 700 点治疗分给附近的生物。
prismaticWall|虹光墙|9|防护|A|60尺|10分||BW||召唤一道七层光幕之墙。
stormOfVengeance|复仇风暴|9|咒法|A|1里|1分|c|D||召唤毁灭性的风暴云。
weird|怪诞术|9|幻术|A|120尺|1分|c|KW|s:WIS:10d10:心灵:h|令一群生物看见最恐惧的幻象，失败者恐慌并持续受伤。
arcaneHand|魔法巨掌|5|塑能|A|120尺|1分|c|SW|a:5d8:力场;u:2d8|召唤一只力场巨手，可以握拳攻击、推撞、抓住或挡住生物。
reincarnate|转生术|5|死灵|1h|触及|I||D||让死去不超过十天的类人生物以随机的新身体复活。
auraOfLife|生命光环|4|防护|A|自身|10分|c|CP||30 尺光环内盟友抵抗黯蚀，生命上限不会降低，0 生命的盟友回合开始回复 1 点。
befuddlement|心智迷乱|8|惑控|A|150尺|I||BDKW|s:INT:10d12:心灵:h|失败者不能施法，也不能执行魔法动作。
charmMonster|魅惑怪物|4|惑控|A|30尺|1时||BDSKW||令一个生物感知豁免，失败者被你魅惑。
chromaticOrb|繁彩法球|1|塑能|A|90尺|I||SW|a:3d8:自选元素;u:1d8|掷出一颗元素法球，伤害骰相同时可弹射到另一目标。
dissonantWhispers|不谐低语|1|惑控|A|60尺|I||B|s:WIS:3d6:心灵:h;u:1d6|失败者必须用反应远离你。
dragonsBreath|龙息术|2|变化|B|触及|1分|c|SW|s:DEX:3d6:自选元素:h;u:1d6|让一个生物能用动作喷出 15 尺锥形元素吐息。
elementalism|元素操控|0|变化|A|30尺|I||DSW||做出微小的元素效果，如吹风、点火、造水、塑土。
ensnaringStrike|诱捕打击|1|咒法|B|自身|1分|c|R|s:STR:1d6:穿刺;u:1d6|武器命中后荆棘缠住目标，失败者被束缚并每回合受穿刺伤害。
hex|脆弱诅咒|1|惑控|B|90尺|1时|c|K|d:1d6:黯蚀|诅咒目标，你命中它时额外造成黯蚀伤害，它的一项属性检定具有劣势。
iceKnife|冰刃术|1|咒法|A|60尺|I||DSW|a:1d10:穿刺;s:DEX:2d6:冷冻|冰刃命中或落空后爆开，周围生物敏捷豁免受冷冻伤害（升环每环 +1d6）。
mindSpike|心灵尖刺|2|预言|A|120尺|1时|c|SKW|s:WIS:3d8:心灵:h;u:1d8|刺入一个生物的心灵，失败者无法对你隐形。
phantasmalForce|幻象之力|2|幻术|A|60尺|1分|c|BSW|s:INT:2d8:心灵|在一个生物脑中制造一个只有它能看见的逼真幻象。
powerWordHeal|律令：医疗|9|惑控|A|60尺|I||BC||一个生物回满生命，并解除魅惑、恐慌、麻痹、中毒、震慑。
rayOfSickness|致病射线|1|死灵|A|60尺|I||SW|a:2d8:毒素;u:1d8|命中后目标中毒到你下回合结束。
searingSmite|灼热斩|1|塑能|B|自身|1分||P|d:1d6:火焰;u:1d6|武器命中后目标着火，每回合开始受火焰伤害，体质豁免成功可扑灭。
shiningSmite|辉耀斩|2|变化|B|自身|1分|c|P|d:2d6:光耀;u:1d6|武器命中后目标发光，无法隐形，对它的攻击具有优势。
sorcerousBurst|术法爆发|0|塑能|A|120尺|I||S|a:1d8:自选元素|掷出一团魔力，伤害骰掷出 8 可再加一颗。
starryWisp|星辉微光|0|塑能|A|60尺|I||BD|a:1d8:光耀|射出一点星光，命中的目标发光且无法隐形。
summonDragon|召唤龙灵|5|咒法|A|60尺|1时|c|W||召唤一个龙灵听你指挥，可以喷吐、撕咬。
tsunami|海啸术|8|咒法|1m|1里|6轮|c|D|s:STR:6d10:钝击:h|召唤一道巨大的水墙向前推进。
vitriolicSphere|强酸法球|4|塑能|A|150尺|I||SW|s:DEX:10d4:强酸:h;u:2d4|强酸法球炸开，失败者下回合结束时再受酸蚀伤害。
blackTentacles|艾伐黑触手|4|咒法|A|90尺|1分|c|W|s:STR:3d6:钝击|触手束缚并伤害区域内的生物（力量豁免）。
`;
    const REMOVED_2024 = ['feeblemind', 'brandingSmite'];
    const CLASS_BY_LETTER = { B: 'bard', C: 'cleric', D: 'druid', P: 'paladin', R: 'ranger', S: 'sorcerer', K: 'warlock', W: 'wizard' };
    const TIME = { A: '动作', B: '附赠动作', R: '反应' };

    // 机制字段解析为 { attack, save, heal, temp, damage, upcast, upcastEvery }
    const parseMech = (text) => {
        const mech = {};
        for (const part of (text || '').split(';').filter(Boolean)) {
            const [kind, ...args] = part.split(':');
            if (kind === 'a') mech.attack = { dice: args[0], type: args[1], rays: args[2] === 'rc' ? 'cantrip' : args[2] ? parseInt(args[2].slice(1)) : 1 };
            if (kind === 's') mech.save = { ability: args[0], dice: args[1], type: args[2], half: args[3] === 'h' };
            if (kind === 'h') mech.heal = args[0];
            if (kind === 't') mech.temp = args[0];
            if (kind === 'd') mech.damage = { dice: args[0], type: args[1] };
            if (kind === 'u' || kind === 'u2') { mech.upcast = args[0]; mech.upcastEvery = kind === 'u2' ? 2 : 1; }
        }
        return mech;
    };

    const parse = (raw) => Object.fromEntries(raw.trim().split('\n').map(line => {
        const [id, name, level, school, time, range, duration, tags, classes, mech, desc] = line.split('|');
        return [id, {
            id, name, level: parseInt(level), school, time: TIME[time] || time.replace('m', ' 分钟').replace('h', ' 小时'), range,
            duration: duration === 'I' ? '立即' : duration, concentration: tags.includes('c'), ritual: tags.includes('r'),
            classes: [...classes].map(l => CLASS_BY_LETTER[l]), ...parseMech(mech), desc,
        }];
    }));
    // SPELLS 为 2014 版法术表；spellBook(版本) 取对应版本的法术表
    const SPELLS = parse(RAW);
    const SPELLS_2024 = { ...SPELLS, ...parse(RAW_2024) };
    REMOVED_2024.forEach(id => delete SPELLS_2024[id]);
    root.DND.SPELLS = SPELLS;
    root.DND.spellBook = (edition) => (edition === '2024' ? SPELLS_2024 : SPELLS);
})(typeof window !== 'undefined' ? window : globalThis);
