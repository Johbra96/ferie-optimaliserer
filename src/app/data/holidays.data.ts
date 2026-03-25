import { Holiday, PeriodDefinition } from '../models/types';

// Note: period windows may overlap — e.g. "17. mai 2027" (2027-05-14 to 2027-05-21) and
// "Pinse 2027" (2027-05-13 to 2027-05-20) share 7 of 8 days. This is intentional — each
// window is computed independently by the service.

export const HOLIDAYS: Holiday[] = [
  // 2026
  { date: '2026-01-01', names: ['Nyttårsdag'] },
  { date: '2026-04-02', names: ['Skjærtorsdag'] },
  { date: '2026-04-03', names: ['Langfredag'] },
  { date: '2026-04-05', names: ['1. påskedag'] },
  { date: '2026-04-06', names: ['2. påskedag'] },
  { date: '2026-05-01', names: ['Arbeidernes dag'] },
  { date: '2026-05-14', names: ['Kristi Himmelfartsdag'] },
  { date: '2026-05-17', names: ['Grunnlovsdagen'] },
  { date: '2026-05-24', names: ['1. pinsedag'] },
  { date: '2026-05-25', names: ['2. pinsedag'] },
  { date: '2026-12-25', names: ['1. juledag'] },
  { date: '2026-12-26', names: ['2. juledag'] },
  // 2027
  { date: '2027-01-01', names: ['Nyttårsdag'] },
  { date: '2027-03-25', names: ['Skjærtorsdag'] },
  { date: '2027-03-26', names: ['Langfredag'] },
  { date: '2027-03-28', names: ['1. påskedag'] },
  { date: '2027-03-29', names: ['2. påskedag'] },
  { date: '2027-05-01', names: ['Arbeidernes dag'] },
  { date: '2027-05-06', names: ['Kristi Himmelfartsdag'] },
  { date: '2027-05-16', names: ['1. pinsedag'] },
  { date: '2027-05-17', names: ['Grunnlovsdagen', '2. pinsedag'] },
  { date: '2027-12-25', names: ['1. juledag'] },
  { date: '2027-12-26', names: ['2. juledag'] },
  // 2028 (needed for Nyttår 2027 window)
  { date: '2028-01-01', names: ['Nyttårsdag'] },
];

export const PERIOD_DEFINITIONS: PeriodDefinition[] = [
  {
    id: 'påske',
    label: '🐣 Påske',
    windows: {
      2026: { start: '2026-03-28', end: '2026-04-12' },
      2027: { start: '2027-03-22', end: '2027-04-04' },
    },
  },
  {
    id: '1-mai',
    label: '🌹 1. mai',
    windows: {
      2026: { start: '2026-04-27', end: '2026-05-04' },
      2027: { start: '2027-04-27', end: '2027-05-04' },
    },
  },
  {
    id: 'kristi-himmelfartsdag',
    label: '☁️ Kristi H.',
    windows: {
      2026: { start: '2026-05-11', end: '2026-05-17' },
      2027: { start: '2027-05-03', end: '2027-05-09' },
    },
  },
  {
    id: '17-mai',
    label: '🇳🇴 17. mai',
    windows: {
      2026: { start: '2026-05-14', end: '2026-05-21' },
      2027: { start: '2027-05-14', end: '2027-05-21' },
    },
  },
  {
    id: 'pinse',
    label: '🕊️ Pinse',
    windows: {
      2026: { start: '2026-05-21', end: '2026-05-28' },
      2027: { start: '2027-05-13', end: '2027-05-20' },
    },
  },
  {
    id: 'jul',
    label: '🎄 Jul',
    windows: {
      2026: { start: '2026-12-23', end: '2026-12-28' },
      2027: { start: '2027-12-23', end: '2027-12-28' },
    },
  },
  {
    id: 'nyttår',
    label: '🎆 Nyttår',
    windows: {
      2026: { start: '2026-12-29', end: '2027-01-02' },
      2027: { start: '2027-12-29', end: '2028-01-02' },
    },
  },
];

export const AVAILABLE_YEARS = [2026, 2027];
