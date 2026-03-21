import type { EquipmentItem } from './types';

export type DumbbellBuildResult = {
  totalWeightKg: number;
  deltaKg: number;
  sideThicknessMm: number;
  platesPerSide: Array<{
    equipmentId: string;
    name: string;
    countPerSide: number;
    weightKg: number;
    thicknessMm: number;
  }>;
  lock: null | {
    equipmentId: string;
    name: string;
    weightKg: number;
    thicknessMm: number;
  };
};

type BuildOptions = {
  handle: EquipmentItem;
  plates: EquipmentItem[];
  lock?: EquipmentItem | null;
  targetWeightKg: number;
  maxResults?: number;
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function isCompatible(handle: EquipmentItem, plate: EquipmentItem) {
  if (!handle.mountSizeMm || !plate.mountSizeMm) {
    return true;
  }

  return handle.mountSizeMm === plate.mountSizeMm;
}

export function buildDumbbellConfigurations(options: BuildOptions) {
  const { handle, plates, lock, targetWeightKg, maxResults = 8 } = options;
  const handleWeight = handle.weightKg ?? 0;
  const sleeveLength = handle.sleeveLengthMm ?? Number.POSITIVE_INFINITY;
  const lockWeight = lock?.weightKg ?? 0;
  const lockThickness = lock?.thicknessMm ?? 0;

  const eligiblePlates = plates
    .filter(
      (plate) =>
        plate.kind === 'plate' &&
        (plate.weightKg ?? 0) > 0 &&
        (plate.thicknessMm ?? 0) > 0 &&
        plate.quantity >= 2 &&
        isCompatible(handle, plate),
    )
    .sort((left, right) => (right.weightKg ?? 0) - (left.weightKg ?? 0));

  const results: DumbbellBuildResult[] = [];

  function dfs(
    index: number,
    sideWeight: number,
    sideThickness: number,
    selected: DumbbellBuildResult['platesPerSide'],
  ) {
    const totalWeightKg = round2(handleWeight + (sideWeight + lockWeight) * 2);
    results.push({
      totalWeightKg,
      deltaKg: round2(totalWeightKg - targetWeightKg),
      sideThicknessMm: round2(sideThickness + lockThickness),
      platesPerSide: selected.filter((item) => item.countPerSide > 0),
      lock: lock
        ? {
            equipmentId: lock.id,
            name: lock.name,
            weightKg: lockWeight,
            thicknessMm: lockThickness,
          }
        : null,
    });

    if (index >= eligiblePlates.length) {
      return;
    }

    for (
      let nextIndex = index;
      nextIndex < eligiblePlates.length;
      nextIndex += 1
    ) {
      const plate = eligiblePlates[nextIndex];
      const maxPairs = Math.floor(plate.quantity / 2);
      const weightKg = plate.weightKg ?? 0;
      const thicknessMm = plate.thicknessMm ?? 0;

      for (let countPerSide = 1; countPerSide <= maxPairs; countPerSide += 1) {
        const nextThickness = sideThickness + thicknessMm * countPerSide;
        if (nextThickness + lockThickness > sleeveLength) {
          break;
        }

        const nextWeight = sideWeight + weightKg * countPerSide;
        dfs(nextIndex + 1, nextWeight, nextThickness, [
          ...selected,
          {
            equipmentId: plate.id,
            name: plate.name,
            countPerSide,
            weightKg,
            thicknessMm,
          },
        ]);
      }
    }
  }

  dfs(0, 0, 0, []);

  return results
    .filter((result) => result.totalWeightKg >= handleWeight)
    .sort((left, right) => {
      const deltaDiff = Math.abs(left.deltaKg) - Math.abs(right.deltaKg);
      if (deltaDiff !== 0) {
        return deltaDiff;
      }

      const thicknessDiff = left.sideThicknessMm - right.sideThicknessMm;
      if (thicknessDiff !== 0) {
        return thicknessDiff;
      }

      return left.totalWeightKg - right.totalWeightKg;
    })
    .filter(
      (result, index, array) =>
        array.findIndex(
          (candidate) =>
            candidate.totalWeightKg === result.totalWeightKg &&
            candidate.sideThicknessMm === result.sideThicknessMm &&
            JSON.stringify(candidate.platesPerSide) ===
              JSON.stringify(result.platesPerSide),
        ) === index,
    )
    .slice(0, maxResults);
}
