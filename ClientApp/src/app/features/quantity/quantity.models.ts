export enum MeasurementType {
  Length = 1,
  Weight = 2,
  Volume = 3,
  Temperature = 4
}

export type ActionKey = 'comparison' | 'conversion' | 'arithmetic';
export type ArithmeticOp = 'add' | 'subtract' | 'divide';

export interface QuantityDtoResponse {
  operationId?: string;
  timestampUtc?: string;

  measurementType?: number;
  operationType?: number;

  firstValue?: number;
  firstUnitText?: string;
  secondValue?: number | null;
  secondUnitText?: string | null;

  targetUnitText?: string | null;

  equalityResult?: boolean | null;
  scalarResult?: number | null;

  resultValue?: number | null;
  resultUnitText?: string | null;

  hasError?: boolean;
  errorMessage?: string | null;
}

export interface HistoryEntity {
  id?: number;
  operationId?: string;
  timestampUtc?: string;

  measurementType?: number;
  operationType?: number;

  firstValue?: number;
  firstUnitText?: string;

  secondValue?: number | null;
  secondUnitText?: string | null;

  targetUnitText?: string | null;

  equalityResult?: boolean | null;
  scalarResult?: number | null;

  resultValue?: number | null;
  resultUnitText?: string | null;

  hasError?: boolean;
  errorMessage?: string | null;
}
