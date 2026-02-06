
export interface Employee {
  id?: number;
  name: string;
  registration: string;
  role: string;
  workHours: number;
}

export interface AppState {
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
}
