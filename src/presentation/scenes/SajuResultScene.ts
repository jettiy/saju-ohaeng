// src/presentation/scenes/SajuResultScene.ts
// 사주 결과: 사주팔자 + 오행 가중치(컬러 막대) + 1차 스탯 + 강점/약점.
// 도메인 OhaengBalance/Stats 를 Phaser 로 시각화.

import Phaser from 'phaser';
import { Scenes, SESSION_KEY, GAME_WIDTH, GAME_HEIGHT } from '../sceneKeys';
import type { GameSession } from '@/application/GameSession';
import * as Ohaeng from '@/domain/saju/Ohaeng';
import type { Element } from '@/domain/saju/Ohaeng';

const FONT = "'Noto Sans KR', 'Malgun Gothic', sans-serif";

const PRIMARY_STAT_LABELS: Array<{ key: 'farming' | 'smithing' | 'fishing' | 'cooking' | 'mining'; label: string }> = [
  { key: 'farming', label: '농사(목)' },
  { key: 'smithing', label: '대장일(화)' },
  { key: 'fishing', label: '낚시(수)' },
  { key: 'cooking', label: '요리(금)' },
  { key: 'mining', label: '채굴(토)' },
];

export class SajuResultScene extends Phaser.Scene {
  constructor() {
    super(Scenes.SajuResult);
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const session = this.game.registry.get(SESSION_KEY) as GameSession;
    const state = session.state;
    this.cameras.main.setBackgroundColor('#1a1a1f');

    this.add.text(cx, 50, '자네 사주를 풀어보겠네', { fontFamily: FONT, fontSize: '30px', color: '#f0e6d2' }).setOrigin(0.5);

    if (state.fourPillars) {
      this.add.text(cx, 92, state.fourPillars.toString(), { fontFamily: FONT, fontSize: '18px', color: '#c9b98f' }).setOrigin(0.5);
    }

    this.add.text(cx, 130, '오행 가중치 (총합 8.0)', { fontFamily: FONT, fontSize: '18px', color: '#9a8f7a' }).setOrigin(0.5);

    const balance = state.ohaengBalance;
    if (balance) {
      const barX = 300;
      const barMaxW = 260;
      const scale = 4.0; // 개별 오행 최대 약 4
      let y = 170;
      for (const o of Ohaeng.ALL) {
        const v = balance.get(o as Element);
        const [r, g, b] = Ohaeng.COLOR[o as Element];
        const colorHex = this.rgbToHex(r, g, b);
        this.add.text(barX - 90, y, Ohaeng.NAME[o as Element], { fontFamily: FONT, fontSize: '20px', color: colorHex }).setOrigin(0, 0.5);
        this.add.rectangle(barX, y, barMaxW, 20, 0x333338).setOrigin(0, 0.5);
        this.add.rectangle(barX, y, Math.max(2, (v / scale) * barMaxW), 20, Phaser.Display.Color.HexStringToColor(colorHex).color).setOrigin(0, 0.5);
        this.add.text(barX + barMaxW + 14, y, v.toFixed(2), { fontFamily: FONT, fontSize: '18px', color: '#f0e6d2' }).setOrigin(0, 0.5);
        y += 36;
      }
      y += 6;
      this.add.text(cx, y, `강점 ${Ohaeng.NAME[balance.dominant()]}   /   약점 ${Ohaeng.NAME[balance.weakest()]}`, {
        fontFamily: FONT, fontSize: '18px', color: '#c9b98f',
      }).setOrigin(0.5);
    }

    // 1차 스탯
    if (state.stats) {
      const statsY = 420;
      this.add.text(cx, statsY, '생업 스탯', { fontFamily: FONT, fontSize: '18px', color: '#9a8f7a' }).setOrigin(0.5);
      const parts = PRIMARY_STAT_LABELS.map((s) => `${s.label} ${state.stats!.get(s.key)}`);
      this.add.text(cx, statsY + 30, parts.join('   '), { fontFamily: FONT, fontSize: '16px', color: '#f0e6d2' }).setOrigin(0.5);
    }

    const prompt = this.add.text(cx, GAME_HEIGHT - 28, 'ENTER: 마을로 (구현 예정) → 타이틀로', {
      fontFamily: FONT, fontSize: '14px', color: '#6a5f4a',
    }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.4, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.inOut' });

    this.input.keyboard?.once('keydown-ENTER', () => {
      session.save();
      this.scene.start(Scenes.Title);
    });
  }

  private rgbToHex(r: number, g: number, b: number): string {
    const h = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
    return `#${h(r)}${h(g)}${h(b)}`;
  }
}
