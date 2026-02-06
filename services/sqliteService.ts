
import { Employee } from '../types';

declare const initSqlJs: any;

let db: any = null;
let initPromise: Promise<any> | null = null;

export const sqliteService = {
  async init() {
    // Retorna a instância se já existir
    if (db) return db;
    
    // Se já houver uma inicialização em curso, aguarda por ela (singleton pattern)
    if (initPromise) return initPromise;

    initPromise = (async () => {
      if (typeof initSqlJs === 'undefined') {
        // Pequena espera caso o script ainda não tenha sido processado pelo navegador
        await new Promise(resolve => setTimeout(resolve, 300));
        if (typeof initSqlJs === 'undefined') {
          throw new Error("Biblioteca SQL.js (WASm) não encontrada no escopo global.");
        }
      }

      const config = {
        locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
      };

      try {
        const SQL = await initSqlJs(config);
        const savedDb = localStorage.getItem('sqlite_db_backup');
        
        if (savedDb) {
          try {
            const u8 = new Uint8Array(JSON.parse(savedDb));
            db = new SQL.Database(u8);
          } catch (e) {
            console.error("Backup do banco corrompido, iniciando novo banco.", e);
            db = new SQL.Database();
          }
        } else {
          db = new SQL.Database();
        }

        // Garante que as tabelas existam
        db.run(`
          CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            registration TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL,
            shift TEXT NOT NULL
          );
          CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
          );
        `);
        
        return db;
      } catch (error) {
        initPromise = null; // Permite tentar novamente se falhar
        console.error("Erro crítico ao inicializar SQLite:", error);
        throw error;
      }
    })();

    return initPromise;
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
      console.error("Erro ao buscar funcionários:", e);
      return [];
    }
  },

  async addEmployee(employee: Employee) {
    const database = await this.init();
    try {
      database.run(
        "INSERT INTO employees (name, registration, role, shift) VALUES (?, ?, ?, ?)",
        [employee.name, employee.registration, employee.role, employee.shift]
      );
      this.saveToLocalStorage();
    } catch (e: any) {
      if (e.message.includes("UNIQUE constraint failed")) {
        throw new Error("Esta matrícula já está cadastrada para outro servidor.");
      }
      throw e;
    }
  },

  async updateEmployee(employee: Employee) {
    if (!employee.id) throw new Error("ID do servidor não fornecido para atualização.");
    const database = await this.init();
    try {
      database.run(
        "UPDATE employees SET name = ?, registration = ?, role = ?, shift = ? WHERE id = ?",
        [employee.name, employee.registration, employee.role, employee.shift, employee.id]
      );
      this.saveToLocalStorage();
    } catch (e: any) {
      if (e.message.includes("UNIQUE constraint failed")) {
        throw new Error("A nova matrícula já está em uso por outro servidor.");
      }
      throw e;
    }
  },

  async deleteEmployee(id: number) {
    const database = await this.init();
    try {
      database.run("DELETE FROM employees WHERE id = ?", [id]);
      this.saveToLocalStorage();
    } catch (e) {
      console.error("Erro ao excluir do banco:", e);
      throw e;
    }
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
    try {
      database.run(
        "INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)",
        [key, value]
      );
      this.saveToLocalStorage();
    } catch (e) {
      console.error("Erro ao salvar configuração:", e);
      throw e;
    }
  },

  saveToLocalStorage() {
    if (!db) return;
    try {
      const data = db.export();
      // Verificação básica de tamanho para o localStorage (limite comum de 5MB)
      const u8Array = Array.from(data);
      const jsonStr = JSON.stringify(u8Array);
      if (jsonStr.length > 4.5 * 1024 * 1024) {
        console.warn("Aviso: O banco de dados está atingindo o limite de armazenamento local do navegador.");
      }
      localStorage.setItem('sqlite_db_backup', jsonStr);
    } catch (e) {
      console.error("Falha persistente ao salvar no localStorage (provavelmente limite de cota excedido):", e);
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
  },

  async importDatabase(file: File) {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const SQL = await initSqlJs({
            locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
          });
          const u8 = new Uint8Array(reader.result as ArrayBuffer);
          db = new SQL.Database(u8);
          this.saveToLocalStorage();
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
};
