
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Employee, ActiveModule } from './types';
import { sqliteService } from './services/sqliteService';
import { EmployeeForm } from './components/EmployeeForm';
import { EmployeeList } from './components/EmployeeList';
import { TimesheetModule } from './components/TimesheetModule';

// jsPDF types are handled globally via script tags
declare const jspdf: any;

const App: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<ActiveModule>('funcionarios');
  const [isAdminOpen, setIsAdminOpen] = useState(true);
  const [isSecretariaOpen, setIsSecretariaOpen] = useState(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEmployee = async (emp: Employee) => {
    try {
      await sqliteService.addEmployee(emp);
      await loadEmployees();
    } catch (err: any) {
      alert("Erro ao cadastrar: " + (err.message || "Matrícula duplicada"));
    }
  };

  const handleUpdateEmployee = async (emp: Employee) => {
    try {
      await sqliteService.updateEmployee(emp);
      setEditingEmployee(null);
      await loadEmployees();
    } catch (err) {
      alert("Erro ao atualizar.");
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm("Excluir servidor permanentemente?")) return;
    try {
      await sqliteService.deleteEmployee(id);
      await loadEmployees();
    } catch (err) {
      alert("Erro ao excluir.");
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.registration.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const handleExportEmployeePDF = async () => {
    if (employees.length === 0) {
      alert("Não há funcionários para exportar.");
      return;
    }

    const doc = new jspdf.jsPDF();
    const savedHeader = await sqliteService.getConfig('timesheet_header');
    
    // Header do Relatório
    let currentY = 20;
    if (savedHeader) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = savedHeader;
      const headerLines = tempDiv.innerText.split('\n').filter(l => l.trim() !== '');
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      headerLines.forEach(line => {
        doc.text(line.toUpperCase(), 105, currentY, { align: 'center' });
        currentY += 5;
      });
      currentY += 5;
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO GERAL DE SERVIDORES", 105, currentY, { align: 'center' });
    currentY += 10;

    const tableData = employees.map(emp => [
      emp.name.toUpperCase(),
      emp.registration,
      emp.role.toUpperCase(),
      emp.shift.toUpperCase()
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['NOME DO SERVIDOR', 'MATRÍCULA', 'CARGO/FUNÇÃO', 'TURNO']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount} - Gerado em ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });
    }

    doc.save(`relatorio_servidores_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col sticky top-0 h-screen shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" />
              </svg>
            </div>
            <span className="font-bold tracking-tight">SECRETARIA DIGITAL</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Admin Menu */}
          <div>
            <button 
              onClick={() => setIsAdminOpen(!isAdminOpen)}
              className="w-full flex items-center justify-between p-2 hover:bg-slate-800 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 group-hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span className="text-sm font-bold uppercase tracking-wider text-slate-400">Admin</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isAdminOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isAdminOpen && (
              <div className="ml-4 mt-2 space-y-1">
                {/* Secretaria Submenu */}
                <div>
                  <button 
                    onClick={() => setIsSecretariaOpen(!isSecretariaOpen)}
                    className="w-full flex items-center justify-between p-2 hover:bg-slate-800 rounded-lg text-sm text-slate-300"
                  >
                    <span>Módulo Secretaria</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${isSecretariaOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isSecretariaOpen && (
                    <div className="ml-4 mt-1 border-l border-slate-700 pl-2 space-y-1">
                      <button 
                        onClick={() => setActiveModule('funcionarios')}
                        className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${activeModule === 'funcionarios' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
                      >
                        Funcionários
                      </button>
                      <button 
                        onClick={() => setActiveModule('folha')}
                        className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${activeModule === 'folha' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
                      >
                        Folha de Frequência
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => sqliteService.exportDatabase()}
            className="w-full flex items-center justify-center gap-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            BACKUP SQLITE
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              {activeModule === 'funcionarios' ? 'Gestão de Funcionários' : 'Emissão de Frequência'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">V 2.5 - SQLite</span>
          </div>
        </header>

        <div className="p-8">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeModule === 'funcionarios' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-4">
                    <EmployeeForm 
                      onAdd={handleAddEmployee} 
                      onUpdate={handleUpdateEmployee}
                      editingEmployee={editingEmployee}
                      onCancelEdit={() => setEditingEmployee(null)}
                    />
                  </div>
                  <div className="lg:col-span-8 space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 flex gap-4 items-center">
                      <div className="relative flex-1">
                        <input 
                          type="text"
                          placeholder="Pesquisar por nome ou matrícula..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 absolute left-3 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <button
                        onClick={handleExportEmployeePDF}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-bold transition-all whitespace-nowrap"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Exportar PDF
                      </button>
                      <div className="text-sm font-bold text-slate-400">
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

              {activeModule === 'folha' && (
                <div className="max-w-4xl mx-auto">
                  <TimesheetModule employees={employees} />
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
