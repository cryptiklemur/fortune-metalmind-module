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

/** Fortune points a tap option costs. Any positive amount a GM configures. */
export type FortuneTapCost = number;
