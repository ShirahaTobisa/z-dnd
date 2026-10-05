// D&D 5e 2024 版数据（SRD 5.2）。属性加值改由背景提供，背景还送一个起源专长；新增武器专精。
(function (root) {
    root.DND.editions['2024'] = {
        id: '2024',
        name: '5e 2024 版',
        raceLabel: '物种',
        abilityBonusFrom: 'background',
        halfCasterStart: 1,
        subclassLevel: {},
        defaultSubclassLevel: 3,
        classOverrides: {
            fighter: { skills: ['acrobatics', 'animalHandling', 'athletics', 'history', 'insight', 'intimidation', 'persuasion', 'perception', 'survival'] },
            wizard: { skills: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'nature', 'religion'] },
        },
        // sizes 有多个时由玩家选择
        races: {
            aasimar: { name: '阿斯莫', sizes: ['中型', '小型'], speed: 30, darkvision: 60, traits: ['天界抗性', '治愈之手', '持光者', '天界启示'] },
            dragonborn: { name: '龙裔', sizes: ['中型'], speed: 30, darkvision: 60, traits: ['龙族血统', '吐息武器', '伤害抗性', '龙翼飞行'] },
            dwarf: { name: '矮人', sizes: ['中型'], speed: 30, darkvision: 120, traits: ['矮人韧性', '矮人坚韧', '石工知识'] },
            elf: { name: '精灵', sizes: ['中型'], speed: 30, darkvision: 60, skillChoice: 1, skillOptions: ['insight', 'perception', 'survival'], traits: ['精灵血系', '精类血统', '敏锐感官', '出神'] },
            gnome: { name: '侏儒', sizes: ['小型'], speed: 30, darkvision: 60, traits: ['侏儒狡黠', '侏儒血系'] },
            goliath: { name: '歌利亚', sizes: ['中型'], speed: 35, traits: ['巨人血统', '巨化', '强健体格'] },
            halfling: { name: '半身人', sizes: ['小型'], speed: 30, traits: ['勇敢', '半身人灵巧', '幸运', '天生隐匿'] },
            human: { name: '人类', sizes: ['中型', '小型'], speed: 30, skillChoice: 1, traits: ['足智多谋', '多才多艺（额外起源专长）'] },
            orc: { name: '兽人', sizes: ['中型'], speed: 30, darkvision: 120, traits: ['肾上腺素爆发', '坚韧不屈'] },
            tiefling: { name: '提夫林', sizes: ['中型', '小型'], speed: 30, darkvision: 60, traits: ['邪魔传承', '异界存在'] },
        },
        // abilities：可分配的三项属性，+2/+1 或 +1/+1/+1；custom 的三项由玩家自选
        backgrounds: {
            acolyte: { name: '侍僧', abilities: ['INT', 'WIS', 'CHA'], skills: ['insight', 'religion'], feat: '魔法入门（牧师）' },
            criminal: { name: '罪犯', abilities: ['DEX', 'CON', 'INT'], skills: ['sleightOfHand', 'stealth'], feat: '警觉' },
            sage: { name: '贤者', abilities: ['CON', 'INT', 'WIS'], skills: ['arcana', 'history'], feat: '魔法入门（法师）' },
            soldier: { name: '士兵', abilities: ['STR', 'DEX', 'CON'], skills: ['athletics', 'intimidation'], feat: '凶蛮打击者' },
            custom: { name: '自定义背景', abilityChoice: 3, skillChoice: 2 },
        },
        weaponMastery: {
            club: '缓速', dagger: '迅击', handaxe: '烦扰', javelin: '缓速', mace: '削弱', quarterstaff: '掀翻', spear: '削弱',
            lightCrossbow: '缓速', shortbow: '烦扰', sling: '缓速', battleaxe: '掀翻', greataxe: '劈砍', greatsword: '擦伤',
            longsword: '削弱', rapier: '烦扰', scimitar: '迅击', shortsword: '烦扰', warhammer: '推离', longbow: '缓速',
        },
        exhaustion: '每级力竭：d20 检定减去 2×力竭等级，速度减少 5×力竭等级 尺；达到 6 级死亡；长休后降低 1 级',
        attribution: 'This work includes material from the System Reference Document 5.2 ("SRD 5.2") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.',
    };
})(typeof window !== 'undefined' ? window : globalThis);
