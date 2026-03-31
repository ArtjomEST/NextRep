export type CardioParamKey = 'speed' | 'incline' | 'resistance' | 'rpm' | 'splitMin' | 'splitSec';

export interface CardioParamConfig {
  key: CardioParamKey;
  label: string;
  unit: string;
  step: number;
  min: number;
  max: number;
  default: number;
}

const PARAM_CONFIGS: Record<CardioParamKey, CardioParamConfig> = {
  speed:      { key: 'speed',      label: 'Скорость',      unit: 'км/ч',    step: 0.5, min: 1,  max: 25,  default: 6 },
  incline:    { key: 'incline',    label: 'Наклон',        unit: '%',       step: 0.5, min: 0,  max: 15,  default: 0 },
  resistance: { key: 'resistance', label: 'Сопротивление', unit: 'ур.',     step: 1,   min: 1,  max: 20,  default: 5 },
  rpm:        { key: 'rpm',        label: 'RPM',           unit: 'об/мин',  step: 5,   min: 20, max: 160, default: 70 },
  splitMin:   { key: 'splitMin',   label: 'Сплит мин',     unit: 'мин',     step: 1,   min: 1,  max: 9,   default: 2 },
  splitSec:   { key: 'splitSec',   label: 'Сплит сек',     unit: 'сек',     step: 1,   min: 0,  max: 59,  default: 0 },
};

export function getCardioParams(exerciseName: string): CardioParamConfig[] {
  const name = exerciseName.toLowerCase();
  if (name.includes('treadmill') || name.includes('run') || name.includes('walk') || name.includes('бег') || name.includes('ходьба')) {
    return [PARAM_CONFIGS.speed, PARAM_CONFIGS.incline];
  }
  if (name.includes('rowing') || name.includes('row') || name.includes('гребн')) {
    return [PARAM_CONFIGS.splitMin, PARAM_CONFIGS.splitSec, PARAM_CONFIGS.resistance];
  }
  if (name.includes('bike') || name.includes('cycle') || name.includes('велос') || name.includes('spin')) {
    return [PARAM_CONFIGS.rpm, PARAM_CONFIGS.resistance];
  }
  if (name.includes('elliptical') || name.includes('эллипс')) {
    return [PARAM_CONFIGS.speed, PARAM_CONFIGS.resistance];
  }
  return [PARAM_CONFIGS.speed];
}

export function formatCardioParams(cardioData: Record<string, number>, exerciseName: string): string {
  const configs = getCardioParams(exerciseName);
  return configs
    .map((cfg) => {
      const val = cardioData[cfg.key];
      if (val === undefined || val === null) return null;
      const display = cfg.step < 1 ? val.toFixed(1) : String(val);
      return `${display} ${cfg.unit}`;
    })
    .filter(Boolean)
    .join(' · ');
}
