class Character {
    constructor(type, name, hp, skills) {
        this.type = type;
        this.name = name;
        this.maxHp = hp;
        this.hp = hp;
        this.skills = skills;
        this.image = `images/${type.replace('-', '_')}_1.jpg`;
        this.cooldowns = {
            attack: 0,
            skill1: 0,
            skill2: 0
        };
    }

    attack() {
        return Math.floor(Math.random() * 20) + 10;
    }

    useSkill(skillIndex) {
        const skill = this.skills[skillIndex];
        if (!skill) return null;
        
        return skill;
    }

    isOnCooldown(action) {
        return this.cooldowns[action] > Date.now();
    }

    setCooldown(action, duration) {
        this.cooldowns[action] = Date.now() + duration;
    }

    takeDamage(damage) {
        this.hp = Math.max(0, this.hp - damage);
        return this.hp <= 0;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }


    isAlive() {
        return this.hp > 0;
    }
}

class Enemy {
    constructor(type, name, hp, damage, image, isElite = false) {
        this.type = type;
        this.name = name;
        this.maxHp = hp;
        this.hp = hp;
        this.damage = damage;
        this.image = image;
        this.isElite = isElite;
        this.attackInterval = null;
    }

    attack() {
        return Math.floor(Math.random() * this.damage) + Math.floor(this.damage / 2);
    }

    takeDamage(damage) {
        this.hp = Math.max(0, this.hp - damage);
        return this.hp <= 0;
    }

    isAlive() {
        return this.hp > 0;
    }
}

class Game {
    constructor() {
        this.player = null;
        this.currentEnemy = null;
        this.currentEncounter = 0;
        this.sounds = {};
        this.encounters = [
            {
                title: "Encounter 1: The Dark Forest",
                description: "You venture into the corrupted forest where goblins lurk in the shadows...",
                enemy: new Enemy('goblin', 'Goblin Scout', 50, 15, 'images/goblin_1.jpg')
            },
            {
                title: "Encounter 2: The Abandoned Cemetery",
                description: "Ancient bones stir as you approach the old graveyard...",
                enemy: new Enemy('skeleton', 'Skeleton Warrior', 70, 18, 'images/skeleton_1.jpg')
            },
            {
                title: "Encounter 3: The Portal Guardian",
                description: "A massive goblin chieftain guards the path to the dark portal...",
                enemy: new Enemy('goblin', 'Goblin Chieftain', 100, 25, 'images/goblin_1.jpg', true)
            },
            {
                title: "Final Encounter: The Dark Portal",
                description: "You reach the dark portal. A powerful skeletal lord emerges to stop you...",
                enemy: new Enemy('skeleton', 'Skeletal Lord', 150, 30, 'images/skeleton_1.jpg', true)
            }
        ];
        
        this.characterClasses = {
            'fire-mage': {
                name: 'Fire Mage',
                hp: 60,
                skills: [
                    { name: 'Fireball', damage: 35, cooldown: 4000, type: 'damage', sound: 'magic' },
                    { name: 'Wind Shield', shield: 30, cooldown: 6000, type: 'shield', duration: 4, sound: 'wind' }
                ]
            },
            'elven-ranger': {
                name: 'Elven Ranger',
                hp: 80,
                skills: [
                    { name: 'Arrow Shot', damage: 30, cooldown: 3000, type: 'damage', sound: 'melee' },
                    { name: 'Dodge', shield: 20, cooldown: 5000, type: 'shield', duration: 3, sound: 'magic' }
                ]
            },
            'human-knight': {
                name: 'Human Knight',
                hp: 120,
                skills: [
                    { name: 'Sword Strike', damage: 40, cooldown: 3500, type: 'damage', sound: 'melee' },
                    { name: 'Shield Block', shield: 25, cooldown: 4500, type: 'shield', duration: 2, sound: 'melee' }
                ]
            },
            'elven-warrior': {
                name: 'Elven Warrior',
                hp: 100,
                skills: [
                    { name: 'Dual Strike', damage: 25, hits: 2, cooldown: 4000, type: 'damage', sound: 'melee' },
                    { name: 'Heal', healing: 35, cooldown: 6000, type: 'heal', sound: 'healing' }
                ]
            }
        };

        this.shield = 0;
        this.init();
    }

    playSound(soundName) {
        try {
            const sound = this.sounds[soundName];
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(e => console.log('Sound play failed:', e));
            }
        } catch (e) {
            console.log('Sound error:', e);
        }
    }

    animateCard(selector, animationClass, duration = 600) {
        const card = document.querySelector(selector);
        if (card) {
            card.classList.add(animationClass);
            setTimeout(() => {
                card.classList.remove(animationClass);
            }, duration);
        }
    }

    startCooldownAnimation(buttonId, duration) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        button.classList.add('on-cooldown');
        button.disabled = true;
        
        const afterElement = window.getComputedStyle(button, '::after');
        button.style.setProperty('--cooldown-duration', `${duration}ms`);
        
        setTimeout(() => {
            button.classList.remove('on-cooldown');
            button.disabled = false;
        }, duration);
    }

    init() {
        this.initSounds();
        this.bindEvents();
        this.showScreen('welcome-screen');
    }

    initSounds() {
        this.sounds = {
            melee: document.getElementById('melee-attack-sound'),
            magic: document.getElementById('magic-attack-sound'),
            healing: document.getElementById('healing-sound'),
            wind: document.getElementById('wind-magic-sound'),
            victory: document.getElementById('victory-sound'),
            ambient: document.getElementById('ambient-music')
        };
        
        // Start ambient music
        this.startAmbientMusic();
    }

    startAmbientMusic() {
        if (this.sounds.ambient) {
            this.sounds.ambient.volume = 0.3;
            this.sounds.ambient.play().catch(e => {
                // Auto-play might be blocked, will start on first user interaction
                document.addEventListener('click', () => {
                    this.sounds.ambient.play().catch(() => {});
                }, { once: true });
            });
        }
    }

    bindEvents() {
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.showScreen('character-select');
        });

        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const characterClass = e.currentTarget.dataset.class;
                this.selectCharacter(characterClass);
            });
        });

        document.getElementById('attack-btn').addEventListener('click', () => {
            this.playerAttack();
        });

        document.getElementById('skill1-btn').addEventListener('click', () => {
            this.playerUseSkill(0);
        });

        document.getElementById('skill2-btn').addEventListener('click', () => {
            this.playerUseSkill(1);
        });

        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.resetGame();
        });
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    selectCharacter(characterClass) {
        const charData = this.characterClasses[characterClass];
        this.player = new Character(
            characterClass,
            charData.name,
            charData.hp,
            charData.skills
        );
        
        this.currentEncounter = 0;
        this.shield = 0;
        this.startEncounter();
    }

    startEncounter() {
        if (this.currentEncounter >= this.encounters.length) {
            this.victory();
            return;
        }

        const encounter = this.encounters[this.currentEncounter];
        this.currentEnemy = new Enemy(
            encounter.enemy.type,
            encounter.enemy.name,
            encounter.enemy.maxHp,
            encounter.enemy.damage,
            encounter.enemy.image
        );

        document.getElementById('encounter-title').textContent = encounter.title;
        document.getElementById('encounter-description').textContent = encounter.description;

        this.updateUI();
        this.showScreen('game-screen');
        this.startCombat();
    }

    startCombat() {
        this.log(`${this.currentEnemy.name} appears!`, 'system');
        
        this.currentEnemy.attackInterval = setInterval(() => {
            if (this.currentEnemy.isAlive() && this.player.isAlive()) {
                this.enemyAttack();
            }
        }, 4000);
    }

    playerAttack() {
        if (!this.player.isAlive() || !this.currentEnemy.isAlive() || this.player.isOnCooldown('attack')) return;

        this.player.setCooldown('attack', 2500);
        this.playSound('melee');
        this.animateCard('.character-battle-card', 'attacking');
        this.startCooldownAnimation('attack-btn', 2500);
        
        setTimeout(() => {
            const damage = this.player.attack();
            const isDead = this.currentEnemy.takeDamage(damage);
            
            this.animateCard('.enemy-battle-card', 'taking-damage', 500);
            this.showDamageNumber(damage, 'enemy');
            this.log(`You attack for ${damage} damage!`, 'player');
            
            this.updateUI();
            
            if (isDead) {
                this.enemyDefeated();
            }
        }, 500);
    }

    playerUseSkill(skillIndex) {
        if (!this.player.isAlive() || !this.currentEnemy.isAlive()) return;
        
        const actionName = `skill${skillIndex + 1}`;
        if (this.player.isOnCooldown(actionName)) return;

        const skill = this.player.useSkill(skillIndex);
        if (!skill) return;

        this.player.setCooldown(actionName, skill.cooldown);
        this.playSound(skill.sound);
        this.animateCard('.character-battle-card', 'skill-cast', 800);
        this.startCooldownAnimation(`skill${skillIndex + 1}-btn`, skill.cooldown);

        document.getElementById(`skill${skillIndex + 1}-btn`).textContent = skill.name;

        if (skill.type === 'damage') {
            let totalDamage = 0;
            const hits = skill.hits || 1;
            
            setTimeout(() => {
                for (let i = 0; i < hits; i++) {
                    const damage = skill.damage + Math.floor(Math.random() * 10);
                    totalDamage += damage;
                    
                    setTimeout(() => {
                        const isDead = this.currentEnemy.takeDamage(damage);
                        this.animateCard('.enemy-battle-card', 'taking-damage', 500);
                        this.showDamageNumber(damage, 'enemy');
                        
                        if (isDead && this.currentEnemy.isAlive() === false) {
                            this.enemyDefeated();
                        }
                    }, i * 300);
                }
            }, 600);
            
            this.log(`You use ${skill.name} for ${totalDamage} damage!`, 'player');
            
            if (skill.selfDamage) {
                this.player.takeDamage(skill.selfDamage);
                this.showDamageNumber(skill.selfDamage, 'player');
                this.log(`You take ${skill.selfDamage} damage from the rage!`, 'system');
            }
        } 
        else if (skill.type === 'heal') {
            this.player.heal(skill.healing);
            this.showDamageNumber(skill.healing, 'heal');
            this.log(`You heal for ${skill.healing} HP!`, 'player');
        }
        else if (skill.type === 'shield') {
            this.shield = skill.shield;
            this.log(`You gain ${skill.shield} shield points!`, 'player');
            
            setTimeout(() => {
                this.shield = 0;
                this.log('Shield effect wears off.', 'system');
            }, skill.duration * 1000);
        }

        this.updateUI();
    }

    enemyAttack() {
        if (!this.currentEnemy.isAlive() || !this.player.isAlive()) return;

        this.playSound('melee');
        this.animateCard('.enemy-battle-card', 'attacking');

        setTimeout(() => {
            let damage = this.currentEnemy.attack();
            
            if (this.shield > 0) {
                const blockedDamage = Math.min(damage, this.shield);
                damage -= blockedDamage;
                this.shield -= blockedDamage;
                this.log(`Shield blocks ${blockedDamage} damage!`, 'system');
            }

            if (damage > 0) {
                const isDead = this.player.takeDamage(damage);
                this.animateCard('.character-battle-card', 'taking-damage', 500);
                this.showDamageNumber(damage, 'player');
                this.log(`${this.currentEnemy.name} attacks for ${damage} damage!`, 'enemy');
                
                if (isDead) {
                    this.gameOver();
                    return;
                }
            }

            this.updateUI();
        }, 600);
    }

    enemyDefeated() {
        clearInterval(this.currentEnemy.attackInterval);
        
        this.player.heal(20);
        
        this.log(`${this.currentEnemy.name} defeated!`, 'system');
        this.log('You recover some health.', 'system');
        
        this.currentEncounter++;
        
        setTimeout(() => {
            this.startEncounter();
        }, 2000);
    }

    gameOver() {
        clearInterval(this.currentEnemy.attackInterval);
        this.log('You have been defeated!', 'system');
        
        setTimeout(() => {
            alert('Game Over! You have been defeated.');
            this.resetGame();
        }, 1000);
    }

    victory() {
        this.log('The dark portal has been sealed! Victory!', 'system');
        this.playSound('victory');
        setTimeout(() => {
            this.showScreen('victory-screen');
        }, 2000);
    }

    resetGame() {
        if (this.currentEnemy && this.currentEnemy.attackInterval) {
            clearInterval(this.currentEnemy.attackInterval);
        }
        
        this.player = null;
        this.currentEnemy = null;
        this.currentEncounter = 0;
        this.shield = 0;
        
        document.getElementById('log-content').innerHTML = '';
        this.showScreen('welcome-screen');
    }

    updateUI() {
        document.getElementById('player-image').src = this.player.image;
        document.getElementById('player-hp-text').textContent = `${this.player.hp}/${this.player.maxHp}`;
        
        const playerHpPercent = (this.player.hp / this.player.maxHp) * 100;
        const playerHpBar = document.getElementById('player-hp-bar');
        if (playerHpBar) playerHpBar.style.setProperty('--width', `${playerHpPercent}%`);

        document.getElementById('enemy-image').src = this.currentEnemy.image;
        document.getElementById('enemy-name').textContent = this.currentEnemy.name;
        document.getElementById('enemy-hp-text').textContent = `${this.currentEnemy.hp}/${this.currentEnemy.maxHp}`;
        
        const enemyHpPercent = (this.currentEnemy.hp / this.currentEnemy.maxHp) * 100;
        const enemyHpBar = document.getElementById('enemy-hp-bar');
        if (enemyHpBar) enemyHpBar.style.setProperty('--width', `${enemyHpPercent}%`);

        // Apply elite styling
        const enemyCard = document.querySelector('.enemy-battle-card');
        const enemyNameEl = document.getElementById('enemy-name');
        if (this.currentEnemy.isElite) {
            enemyCard.classList.add('elite-enemy');
            enemyNameEl.classList.add('elite-name');
        } else {
            enemyCard.classList.remove('elite-enemy');
            enemyNameEl.classList.remove('elite-name');
        }

        document.getElementById('skill1-btn').textContent = this.player.skills[0].name;
        document.getElementById('skill2-btn').textContent = this.player.skills[1].name;
    }

    showDamageNumber(damage, type) {
        const battleArea = document.querySelector('.battle-area');
        const damageEl = document.createElement('div');
        
        damageEl.className = `damage-number damage-${type}`;
        damageEl.textContent = type === 'heal' ? `+${damage}` : `-${damage}`;
        
        const rect = battleArea.getBoundingClientRect();
        damageEl.style.position = 'fixed';
        damageEl.style.left = `${rect.left + (type === 'enemy' ? rect.width * 0.75 : rect.width * 0.25)}px`;
        damageEl.style.top = `${rect.top + rect.height * 0.3}px`;
        
        document.body.appendChild(damageEl);
        
        setTimeout(() => {
            damageEl.remove();
        }, 1000);
    }

    log(message, type = 'system') {
        const logContent = document.getElementById('log-content');
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.textContent = message;
        
        logContent.insertBefore(entry, logContent.firstChild);
        logContent.scrollTop = 0;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game();
});