
import { Employee } from '../types';

declare const initSqlJs: any;

let db: any = null;

export const sqliteService = {
  async init() {
    if (db) return db;

    // Aguarda um pequeno delay se o script global ainda não estiver pronto
    if (typeof initSqlJs === 'undefined') {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (typeof initSqlJs === 'undefined') {
        throw new Error("A biblioteca SQL.js não foi carregada. Verifique sua conexão ou o link no index.html.");
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
        db.run(`
          CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            registration TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL,
            workHours INTEGER NOT NULL
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
      const res = database.exec("SELECT * FROM employees ORDER BY id DESC");
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
      console.warn("Tabela não encontrada ou vazia", e);
      return [];
    }
  },

  async addEmployee(employee: Employee) {
    const database = await this.init();
    database.run(
      "INSERT INTO employees (name, registration, role, workHours) VALUES (?, ?, ?, ?)",
      [employee.name, employee.registration, employee.role, employee.workHours]
    );
    this.saveToLocalStorage();
  },

  async deleteEmployee(id: number) {
    const database = await this.init();
    database.run("DELETE FROM employees WHERE id = ?", [id]);
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
    a.download = "colaboradores.sqlite";
    a.click();
    URL.revokeObjectURL(url);
  },

  async importDatabase(file: File): Promise<void> {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const SQL = await initSqlJs({
            locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
          });
          const u8 = new Uint8Array(reader.result as ArrayBuffer);
          db = new SQL.Database(u8);
          this.saveToLocalStorage();
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
};
