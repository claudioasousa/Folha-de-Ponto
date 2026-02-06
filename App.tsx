
import React, { useState, useEffect, useRef } from 'react';
import { Employee } from './types';
import { sqliteService } from './services/sqliteService';
import { EmployeeForm } from './components/EmployeeForm';
import { EmployeeList } from './components/EmployeeList';

const App: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      const data = await sqliteService.getAllEmployees();
      setEmployees(data);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar dados do SQLite.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEmployee = async (emp: Employee) => {
    try {
      await sqliteService.addEmployee(emp);
      await loadEmployees();
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('UNIQUE')) {
        alert("Erro: Esta matrícula já está cadastrada.");
      } else {
        alert("Erro ao cadastrar colaborador.");
      }
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm("Deseja realmente excluir este colaborador?")) return;
    try {
      await sqliteService.deleteEmployee(id);
      await loadEmployees();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir colaborador.");
    }
  };

  const handleExport = async () => {
    try {
      await sqliteService.exportDatabase();
    } catch (err) {
      alert("Erro ao exportar banco de dados.");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      await sqliteService.importDatabase(file);
      await loadEmployees();
      alert("Banco de dados importado com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao importar arquivo SQLite. Certifique-se de que é um arquivo .sqlite válido.");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-blue-200 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">Gestão de Colaboradores</h1>
              <p className="text-sm text-slate-500 font-medium">SQLite Database Interface</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".sqlite,.db"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Importar .sqlite
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Salvar / Baixar .sqlite
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-500 animate-pulse font-medium">Sincronizando Banco SQLite...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar Form */}
            <div className="lg:col-span-4">
              <div className="sticky top-24">
                <EmployeeForm onAdd={handleAddEmployee} />
                
                <div className="mt-6 bg-blue-50 border border-blue-100 p-4 rounded-xl">
                  <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Dica Técnica
                  </h3>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Esta aplicação utiliza <strong>sql.js (SQLite WASM)</strong> para persistência local no navegador. 
                    Seus dados são salvos no cache local, mas recomendamos baixar o arquivo <code>.sqlite</code> regularmente 
                    para backup permanente.
                  </p>
                </div>
              </div>
            </div>

            {/* Main List */}
            <div className="lg:col-span-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Listagem de Colaboradores</h2>
                <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
                  Total: {employees.length}
                </div>
              </div>
              <EmployeeList employees={employees} onDelete={handleDeleteEmployee} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
