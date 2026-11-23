import type { Team, TournamentDef } from '../engine/types';

/**
 * PGL Major Singapore 2026 (CS2).
 * Fontes: HLTV, Liquipedia/Wikipedia, Strafe, Insider Gaming (nov/2026).
 * Seeds por VRS conforme divulgado. `rating` é uma ESTIMATA editável na aba Times.
 */
const T = (
  id: string,
  name: string,
  tag: string,
  region: Team['region'],
  country: string,
  rating: number,
  c1: string,
  c2: string,
): Team => ({ id, name, tag, region, country, rating, colors: [c1, c2] });

export const teams: Team[] = [
  // ---- Stage 3 (convidados) ----
  T('furia', 'FURIA', 'FUR', 'Américas', '🇧🇷', 1790, '#1a1a1a', '#f5f5f5'),
  T('mouz', 'MOUZ', 'MOUZ', 'Europa', '🇩🇪', 1790, '#e3173e', '#2b2b2b'),
  T('spirit', 'Team Spirit', 'SPR', 'CIS', '🇷🇺', 1780, '#2c2f3a', '#e6e6e6'),
  T('vitality', 'Team Vitality', 'VIT', 'Europa', '🇫🇷', 1840, '#f7e600', '#151515'),
  T('falcons', 'Team Falcons', 'FLC', 'Europa', '🇸🇦', 1790, '#00a65a', '#0d2a1d'),
  T('aurora', 'Aurora', 'AUR', 'Europa', '🇹🇷', 1720, '#7c4dff', '#1d1340'),
  T('betboom', 'BetBoom Team', 'BB', 'CIS', '🇷🇺', 1690, '#ffd400', '#111111'),
  T('legacy', 'Legacy', 'LGC', 'Américas', '🇧🇷', 1680, '#00b4d8', '#03263b'),
  // ---- Stage 2 (convidados) ----
  T('navi', 'Natus Vincere', 'NAVI', 'CIS', '🇺🇦', 1760, '#ffe500', '#111111'),
  T('fut', 'FUT Esports', 'FUT', 'Europa', '🇹🇷', 1680, '#ff3d00', '#1c0b05'),
  T('mongolz', 'The MongolZ', 'MGLZ', 'Ásia', '🇲🇳', 1740, '#e10600', '#ffcc00'),
  T('nemiga', 'Nemiga', 'NMG', 'CIS', '🇧🇾', 1640, '#2b6cff', '#0a1a3f'),
  T('g2', 'G2 Esports', 'G2', 'Europa', '🇪🇺', 1710, '#ff2e2e', '#1a1a1a'),
  T('1win', '1win', '1WIN', 'CIS', '🇷🇺', 1630, '#1e88ff', '#0b1d38'),
  T('mibr', 'MIBR', 'MIBR', 'Américas', '🇧🇷', 1650, '#1f4fff', '#f4f4f4'),
  T('astralis', 'Astralis', 'AST', 'Europa', '🇩🇰', 1690, '#ff1e3c', '#0f0f1a'),
  // ---- Stage 1 (seeds 1–16) ----
  T('nip', 'Ninjas in Pyjamas', 'NIP', 'Europa', '🇸🇪', 1650, '#d4ff00', '#141414'),
  T('parivision', 'PARIVISION', 'PARI', 'CIS', '🇷🇺', 1680, '#ff6a00', '#1a0d03'),
  T('heroic', 'HEROIC', 'HER', 'Europa', '🇩🇰', 1660, '#ff9f1c', '#1b1b2f'),
  T('faze', 'FaZe Clan', 'FAZE', 'Europa', '🇪🇺', 1670, '#e4002b', '#0e0e0e'),
  T('liquid', 'Team Liquid', 'TL', 'Américas', '🇺🇸', 1630, '#0a2f6b', '#4fc3f7'),
  T('eternalfire', 'Eternal Fire', 'EF', 'Europa', '🇹🇷', 1620, '#ff4500', '#2a0800'),
  T('100t', '100 Thieves', '100T', 'Américas', '🇺🇸', 1580, '#e1251b', '#181818'),
  T('9z', '9z Team', '9Z', 'Américas', '🇦🇷', 1560, '#6a1bff', '#140633'),
  T('m80', 'M80', 'M80', 'Américas', '🇺🇸', 1580, '#00d68f', '#05261a'),
  T('dendele', 'DENDELE', 'DND', 'Europa', '🇪🇺', 1540, '#ff2d95', '#2a0619'),
  T('imperial', 'Imperial Esports', 'IMP', 'Américas', '🇧🇷', 1560, '#c9a227', '#14110a'),
  T('wildcard', 'Wildcard', 'WC', 'Américas', '🇺🇸', 1540, '#00e5ff', '#032a30'),
  T('gosh', 'GOSH', 'GOSH', 'Américas', '🇺🇸', 1550, '#b4ff39', '#18220a'),
  T('flyquest', 'FlyQuest', 'FLY', 'Oceania', '🇦🇺', 1540, '#1ed760', '#06240f'),
  T('chinggis', 'Chinggis Warriors', 'CW', 'Ásia', '🇲🇳', 1510, '#c62828', '#2a0606'),
  T('lynnvision', 'Lynn Vision Gaming', 'LVG', 'Ásia', '🇨🇳', 1520, '#ff7043', '#2b0f07'),
];

export const csMajorSingapore2026: TournamentDef = {
  id: 'cs2-major-singapore-2026',
  name: 'PGL Major Singapore 2026',
  game: 'Counter-Strike 2',
  organizer: 'PGL',
  location: 'Singapura',
  dates: '24 nov – 13 dez 2026',
  startDate: '2026-11-24T10:00:00+08:00', // horário aproximado do 1º jogo,
  prizePool: 'US$ 1.250.000',
  accent: ['#ffb547', '#ff5d73'],
  teams,
  stages: [
    {
      id: 's1',
      type: 'swiss',
      name: 'Stage 1',
      short: 'S1',
      dates: '24 – 27 nov',
      invited: [
        'nip', 'parivision', 'heroic', 'faze', 'liquid', 'eternalfire', '100t', '9z',
        'm80', 'dendele', 'imperial', 'wildcard', 'gosh', 'flyquest', 'chinggis', 'lynnvision',
      ],
      winsToAdvance: 3,
      lossesToEliminate: 3,
      bestOf: { normal: 1, decisive: 3 },
      firstRound: 'half',
    },
    {
      id: 's2',
      type: 'swiss',
      name: 'Stage 2',
      short: 'S2',
      dates: '28 nov – 1 dez',
      invited: ['navi', 'fut', 'mongolz', 'nemiga', 'g2', '1win', 'mibr', 'astralis'],
      from: { stageId: 's1' },
      winsToAdvance: 3,
      lossesToEliminate: 3,
      bestOf: { normal: 1, decisive: 3 },
      firstRound: 'half',
    },
    {
      id: 's3',
      type: 'swiss',
      name: 'Stage 3',
      short: 'S3',
      dates: '2 – 6 dez',
      invited: ['furia', 'mouz', 'spirit', 'vitality', 'falcons', 'aurora', 'betboom', 'legacy'],
      from: { stageId: 's2' },
      winsToAdvance: 3,
      lossesToEliminate: 3,
      bestOf: { normal: 3, decisive: 3 },
      firstRound: 'half',
    },
    {
      id: 'po',
      type: 'single-elim',
      name: 'Playoffs',
      short: 'PO',
      dates: '10 – 13 dez',
      invited: [],
      from: { stageId: 's3' },
      size: 8,
      bestOf: [3, 3, 3],
      roundNames: ['Quartas de final', 'Semifinal', 'Grande Final'],
    },
  ],
};
