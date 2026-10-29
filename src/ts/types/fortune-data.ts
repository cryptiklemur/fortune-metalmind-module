export interface FortuneData {
    current: number;
    max: number;
    tapsRemaining: number;
    tapsMax: number;
    tapAvailable: boolean;
    conversionsRemaining: number;
    conversionsMax: number;
    refocusRemaining: number;
    refocusMax: number;
    refocusAvailable: boolean;
}

export const DEFAULT_FORTUNE_DATA: FortuneData = {
    current: 1,
    max: 5,
    tapsRemaining: 1,
    tapsMax: 1,
    tapAvailable: true,
    conversionsRemaining: 3,
    conversionsMax: 3,
    refocusRemaining: 1,
    refocusMax: 1,
    refocusAvailable: true,
};

/** Fortune points a tap option costs. Any positive amount a GM configures. */
export type FortuneTapCost = number;
