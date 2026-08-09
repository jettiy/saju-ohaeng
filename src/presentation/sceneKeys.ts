// src/presentation/sceneKeys.ts
// Phaser 씬 키 중앙 관리. 하드코딩 문자열 오타 방지.

export const Scenes = {
  Boot: 'Boot',
  Title: 'Title',
  SajuInput: 'SajuInput',
  SajuResult: 'SajuResult',
} as const;

/** 레지스트리에 공유되는 GameSession 키. */
export const SESSION_KEY = 'session';

/** 디자인 해상도 (원본 Love2D conf.lua 의 960x540 유지). */
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
