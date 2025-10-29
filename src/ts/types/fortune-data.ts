export interface FortuneData {
    current: number;
    max: number;
    tapAvailable: boolean;
    conversionsRemaining: number;
    conversionsMax: number;
    refocusAvailable: boolean;
}

export const DEFAULT_FORTUNE_DATA: FortuneData = {
    current: 1,
    max: 5,
    tapAvailable: true,
    conversionsRemaining: 3,
    conversionsMax: 3,
    refocusAvailable: true,
};

export enum FortuneTapCost {
    ADVANTAGE = 1,
    AUTO_SUCCESS = 2,
    GUARANTEED_NAT20 = 5,
}

export interface FortuneTapOption {
    cost: FortuneTapCost;
    label: string;
    description: string;
}

export const FORTUNE_TAP_OPTIONS: FortuneTapOption[] = [
    {
        cost: FortuneTapCost.ADVANTAGE,
        label: "FortuneMetalmind.Tap.Advantage.Label",
        description: "FortuneMetalmind.Tap.Advantage.Description",
    },
    {
        cost: FortuneTapCost.AUTO_SUCCESS,
        label: "FortuneMetalmind.Tap.AutoSuccess.Label",
        description: "FortuneMetalmind.Tap.AutoSuccess.Description",
    },
    {
        cost: FortuneTapCost.GUARANTEED_NAT20,
        label: "FortuneMetalmind.Tap.GuaranteedNat20.Label",
        description: "FortuneMetalmind.Tap.GuaranteedNat20.Description",
    },
];
