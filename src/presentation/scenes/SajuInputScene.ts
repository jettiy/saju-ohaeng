// src/presentation/scenes/SajuInputScene.ts
// 사주 입력 (핵심 훅): 방향키로 생년월일시 + 양력/음력 선택 -> Enter 로 오행 산출.
// 원본 SajuInputScene.lua 의 조작을 Phaser 로 이식. 검증된 도메인 SajuCalculator 사용.

import Phaser from 'phaser';
import { Scenes, SESSION_KEY, GAME_WIDTH, GAME_HEIGHT } from '../sceneKeys';
import { BirthDate } from '@/domain/saju/BirthDate';
import type { GameSession } from '@/application/GameSession';

const FONT = "'Noto Sans KR', 'Malgun Gothic', sans-serif";

interface Field {
  label: string;
  get: () => number;
  set: (v: number) => void;
  min: number;
  max: number;
}

export class SajuInputScene extends Phaser.Scene {
  private selectedIndex = 0;
  private fields: Field[] = [];
  private valueTexts: Phaser.GameObjects.Text[] = [];
  private calendarSolar = true;
  private calendarText!: Phaser.GameObjects.Text;
  private errorText!: Phaser.GameObjects.Text;
  private year = 1995;
  private month = 1;
  private day = 1;
  private hour = 12;

  constructor() {
    super(Scenes.SajuInput);
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    this.cameras.main.setBackgroundColor('#1a1a1f');

    this.add.text(cx, 60, '생년월일시를 말해 보게', {
      fontFamily: FONT, fontSize: '30px', color: '#f0e6d2',
    }).setOrigin(0.5);

    this.add.text(cx, 95, '← →: 항목 이동   ↑ ↓: 값 변경   C: 양력/음력   ENTER: 확인', {
      fontFamily: FONT, fontSize: '14px', color: '#6a8f5a',
    }).setOrigin(0.5);

    this.fields = [
      { label: '연도', get: () => this.year, set: (v) => { this.year = v; }, min: 1900, max: 2100 },
      { label: '월', get: () => this.month, set: (v) => { this.month = v; }, min: 1, max: 12 },
      { label: '일', get: () => this.day, set: (v) => { this.day = v; }, min: 1, max: 31 },
      { label: '시', get: () => this.hour, set: (v) => { this.hour = v; }, min: 0, max: 23 },
    ];

    const startY = 180;
    const gap = 56;
    this.fields.forEach((f, i) => {
      const y = startY + i * gap;
      this.add.text(cx - 120, y, f.label, { fontFamily: FONT, fontSize: '22px', color: '#9a8f7a' }).setOrigin(0, 0.5);
      const vt = this.add.text(cx + 40, y, String(f.get()), { fontFamily: FONT, fontSize: '26px', color: '#f0e6d2' }).setOrigin(0.5);
      this.valueTexts.push(vt);
    });

    const calY = startY + this.fields.length * gap + 10;
    this.add.text(cx - 120, calY, '력법', { fontFamily: FONT, fontSize: '22px', color: '#9a8f7a' }).setOrigin(0, 0.5);
    this.calendarText = this.add.text(cx + 40, calY, '양력', { fontFamily: FONT, fontSize: '26px', color: '#f0e6d2' }).setOrigin(0.5);

    this.errorText = this.add.text(cx, GAME_HEIGHT - 60, '', { fontFamily: FONT, fontSize: '16px', color: '#d9776b' }).setOrigin(0.5);
    this.add.text(cx, GAME_HEIGHT - 30, 'ENTER: 확인', { fontFamily: FONT, fontSize: '14px', color: '#6a5f4a' }).setOrigin(0.5);

    this.refreshHighlight();
    this.bindInput();
  }

  private bindInput(): void {
    const kb = this.input.keyboard!;
    kb.on('keydown-LEFT', () => this.moveSelection(-1));
    kb.on('keydown-RIGHT', () => this.moveSelection(1));
    kb.on('keydown-UP', () => this.changeValue(1));
    kb.on('keydown-DOWN', () => this.changeValue(-1));
    kb.on('keydown-C', () => {
      this.calendarSolar = !this.calendarSolar;
      this.calendarText.setText(this.calendarSolar ? '양력' : '음력');
    });
    kb.once('keydown-ENTER', () => this.confirm());
  }

  private moveSelection(dir: number): void {
    this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + dir, 0, this.fields.length);
    this.refreshHighlight();
  }

  private changeValue(dir: number): void {
    const f = this.fields[this.selectedIndex];
    f.set(Phaser.Math.Wrap(f.get() + dir, f.min, f.max + 1));
    this.valueTexts[this.selectedIndex].setText(String(f.get()));
    this.errorText.setText('');
  }

  private refreshHighlight(): void {
    this.valueTexts.forEach((t, i) => {
      t.setColor(i === this.selectedIndex ? '#ffd97a' : '#f0e6d2');
    });
  }

  private confirm(): void {
    const calendar = this.calendarSolar ? 'solar' : 'lunar';
    let birthDate: BirthDate;
    try {
      birthDate = new BirthDate(this.year, this.month, this.day, this.hour, calendar);
    } catch (e) {
      this.errorText.setText(`유효하지 않은 날짜: ${(e as Error).message}`);
      this.input.keyboard!.once('keydown-ENTER', () => this.confirm());
      return;
    }

    const session = this.game.registry.get(SESSION_KEY) as GameSession;
    session.applySaju(birthDate);
    this.scene.start(Scenes.SajuResult);
  }
}
