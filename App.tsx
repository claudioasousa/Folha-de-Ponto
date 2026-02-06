
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Employee } from './types';
import { sqliteService } from './services/sqliteService';
import { EmployeeForm } from './components/EmployeeForm';
import { EmployeeList } from './components/EmployeeList';

// jsPDF types are handled globally via script tags
declare const jspdf: any;

const App: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
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

  const handleUpdateEmployee = async (emp: Employee) => {
    try {
      await sqliteService.updateEmployee(emp);
      setEditingEmployee(null);
      await loadEmployees();
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar colaborador.");
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm("Deseja realmente excluir este colaborador?")) return;
    try {
      await sqliteService.deleteEmployee(id);
      if (editingEmployee?.id === id) setEditingEmployee(null);
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
      alert("Erro ao importar arquivo SQLite.");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGeneratePDF = () => {
    const doc = new jspdf.jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("Relatório de Colaboradores", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
    doc.text(`Total de registros: ${filteredEmployees.length}`, 14, 36);

    // Table
    const tableData = filteredEmployees.map(emp => [
      emp.name,
      emp.registration,
      emp.role,
      `${emp.workHours}h`
    ]);

    doc.autoTable({
      startY: 45,
      head: [['Nome', 'Matrícula', 'Função', 'Carga Horária']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }, // blue-600
      styles: { fontSize: 10, cellPadding: 4 }
    });

    doc.save(`relatorio_colaboradores_${new Date().getTime()}.pdf`);
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

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

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".sqlite,.db"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
            >
              Importar DB
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors shadow-sm"
            >
              Exportar DB
            </button>
            <button
              onClick={handleGeneratePDF}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-md ml-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Gerar Relatório PDF
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
              <div className="sticky top-24 space-y-6">
                <EmployeeForm 
                  onAdd={handleAddEmployee} 
                  onUpdate={handleUpdateEmployee}
                  editingEmployee={editingEmployee}
                  onCancelEdit={() => setEditingEmployee(null)}
                />
                
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Busca Rápida</h3>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Nome, matrícula ou função..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 absolute left-3 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                  <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Dica
                  </h3>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Clique no ícone de <strong>lápis</strong> para editar os dados de um colaborador já cadastrado.
                  </p>
                </div>
              </div>
            </div>

            {/* Main List */}
            <div className="lg:col-span-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Listagem de Colaboradores</h2>
                  {searchTerm && (
                    <p className="text-sm text-slate-500">Filtrando por: "{searchTerm}"</p>
                  )}
                </div>
                <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
                  {filteredEmployees.length} registros
                </div>
              </div>
              <EmployeeList 
                employees={filteredEmployees} 
                onDelete={handleDeleteEmployee} 
                onEdit={setEditingEmployee}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
