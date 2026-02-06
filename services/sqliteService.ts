
import { Employee } from '../types';

declare const initSqlJs: any;

let db: any = null;

export const sqliteService = {
  async init() {
    if (db) return db;

    if (typeof initSqlJs === 'undefined') {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (typeof initSqlJs === 'undefined') {
        throw new Error("A biblioteca SQL.js não foi carregada.");
      }
    }

    const config = {
      locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    };

    try {
      const SQL = await initSqlJs(config);
      const savedDb = localStorage.getItem('sqlite_db_backup');
      if (savedDb) {
        const u8 = new Uint8Array(JSON.parse(savedDb));
        db = new SQL.Database(u8);
      } else {
        db = new SQL.Database();
        // Tabela de funcionários
        db.run(`
          CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            registration TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL,
            shift TEXT NOT NULL
          )
        `);
        // Tabela de configurações (ex: cabeçalho da folha)
        db.run(`
          CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
          )
        `);
      }
      return db;
    } catch (error) {
      console.error("Erro ao inicializar SQLite:", error);
      throw error;
    }
  },

  async getAllEmployees(): Promise<Employee[]> {
    const database = await this.init();
    try {
      const res = database.exec("SELECT * FROM employees ORDER BY name ASC");
      if (res.length === 0) return [];
      const columns = res[0].columns;
      const values = res[0].values;
      return values.map((row: any[]) => {
        const obj: any = {};
        columns.forEach((col: string, index: number) => {
          obj[col] = row[index];
        });
        return obj as Employee;
      });
    } catch (e) {
      return [];
    }
  },

  async addEmployee(employee: Employee) {
    const database = await this.init();
    database.run(
      "INSERT INTO employees (name, registration, role, shift) VALUES (?, ?, ?, ?)",
      [employee.name, employee.registration, employee.role, employee.shift]
    );
    this.saveToLocalStorage();
  },

  async updateEmployee(employee: Employee) {
    if (!employee.id) return;
    const database = await this.init();
    database.run(
      "UPDATE employees SET name = ?, registration = ?, role = ?, shift = ? WHERE id = ?",
      [employee.name, employee.registration, employee.role, employee.shift, employee.id]
    );
    this.saveToLocalStorage();
  },

  async deleteEmployee(id: number) {
    const database = await this.init();
    database.run("DELETE FROM employees WHERE id = ?", [id]);
    this.saveToLocalStorage();
  },

  async getConfig(key: string): Promise<string | null> {
    const database = await this.init();
    try {
      const res = database.exec("SELECT value FROM config WHERE key = ?", [key]);
      if (res.length > 0 && res[0].values.length > 0) {
        return res[0].values[0][0] as string;
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  async setConfig(key: string, value: string) {
    const database = await this.init();
    database.run(
      "INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)",
      [key, value]
    );
    this.saveToLocalStorage();
  },

  saveToLocalStorage() {
    if (!db) return;
    try {
      const data = db.export();
      localStorage.setItem('sqlite_db_backup', JSON.stringify(Array.from(data)));
    } catch (e) {
      console.error("Falha ao salvar no localStorage:", e);
    }
  },

  async exportDatabase() {
    const database = await this.init();
    const data = database.export();
    const blob = new Blob([data], { type: "application/x-sqlite3" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "secretaria_digital.sqlite";
    a.click();
    URL.revokeObjectURL(url);
  }
};
