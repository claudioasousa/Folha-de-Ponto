
export type ShiftType = 'Manhã' | 'Tarde' | 'Noite' | 'Integral';

export interface Employee {
  id?: number;
  name: string;
  registration: string;
  role: string;
  shift: ShiftType;
}

export interface Config {
  key: string;
  value: string;
}

export type ActiveModule = 'funcionarios' | 'folha';
