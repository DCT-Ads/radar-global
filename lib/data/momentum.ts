export const MOMENTUM_STAGES = [
  "FRIO",
  "EMERGENTE",
  "ACELERANDO",
  "HOT",
  "SATURANDO",
  "SATURADO",
] as const;

export type MomentumStage = (typeof MOMENTUM_STAGES)[number];

export type MomentumMeta = {
  stage: MomentumStage;
  emoji: string;
  className: string;
};

export const MOMENTUM_META: Record<MomentumStage, MomentumMeta> = {
  FRIO: {
    stage: "FRIO",
    emoji: "🧊",
    className: "border-[#8BA3B8]/40 bg-[#12263F] text-[#8BA3B8]",
  },
  EMERGENTE: {
    stage: "EMERGENTE",
    emoji: "🌱",
    className: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300",
  },
  ACELERANDO: {
    stage: "ACELERANDO",
    emoji: "📈",
    className:
      "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] shadow-[0_0_18px_rgba(212,175,55,0.45)]",
  },
  HOT: {
    stage: "HOT",
    emoji: "🔥",
    className: "border-orange-400/50 bg-orange-500/15 text-orange-300",
  },
  SATURANDO: {
    stage: "SATURANDO",
    emoji: "⚠️",
    className: "border-amber-400/40 bg-amber-500/10 text-amber-200",
  },
  SATURADO: {
    stage: "SATURADO",
    emoji: "🧱",
    className: "border-red-400/40 bg-red-500/10 text-red-300",
  },
};

export const IDEAL_MOMENTUM_STAGE: MomentumStage = "ACELERANDO";
