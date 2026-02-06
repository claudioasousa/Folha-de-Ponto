
import React, { useState } from 'react';
import { Employee } from '../types';

declare const jspdf: any;

interface TimesheetModuleProps {
  employees: Employee[];
}

export const TimesheetModule: React.FC<TimesheetModuleProps> = ({ employees }) => {
  const [selectedId, setSelectedId] = useState<string>('');
  const [month, setMonth] = useState<number>(new Date().getMonth());
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrint = () => {
    const employee = employees.find(e => e.id?.toString() === selectedId);
    if (!employee) return alert("Selecione um servidor primeiro.");

    const doc = new jspdf.jsPDF();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Header do Documento
    doc.setFontSize(16);
    doc.text("FOLHA DE FREQUÊNCIA INDIVIDUAL", 105, 15, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.rect(10, 20, 190, 25); // Border for header info
    
    doc.setFontSize(10);
    doc.text(`SERVIDOR: ${employee.name.toUpperCase()}`, 12, 27);
    doc.text(`MATRÍCULA: ${employee.registration}`, 12, 33);
    doc.text(`CARGO/FUNÇÃO: ${employee.role}`, 12, 39);
    
    doc.text(`TURNO: ${employee.shift}`, 120, 27);
    doc.text(`MÊS DE REFERÊNCIA: ${months[month].toUpperCase()}`, 120, 33);
    doc.text(`ANO: ${year}`, 120, 39);

    // Tabela de Frequência
    const tableData = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      tableData.push([
        `${d.toString().padStart(2, '0')} (${dayName})`,
        isWeekend ? '---' : '',
        isWeekend ? '---' : '',
        isWeekend ? '---' : '',
        isWeekend ? '---' : '',
        isWeekend ? 'DOM/SAB' : ''
      ]);
    }

    doc.autoTable({
      startY: 50,
      head: [['DIA', 'ENTRADA', 'SAÍDA (ALM)', 'RETORNO', 'SAÍDA', 'ASSINATURA']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1 },
      styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.1, lineColor: [0, 0, 0] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 'auto' }
      }
    });

    // Footer signatures
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.line(20, finalY, 90, finalY);
    doc.text("Assinatura do Servidor", 55, finalY + 5, { align: 'center' });
    
    doc.line(120, finalY, 190, finalY);
    doc.text("Assinatura Chefia Imediata", 155, finalY + 5, { align: 'center' });

    doc.save(`folha_ponto_${employee.registration}_${months[month]}.pdf`);
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Gerar Folha de Frequência
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-600 uppercase">Selecionar Servidor</label>
          <select 
            className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">Selecione um colaborador...</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name} ({emp.registration})</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-600 uppercase">Mês de Referência</label>
          <select 
            className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
          >
            {months.map((m, idx) => (
              <option key={m} value={idx}>{m}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-600 uppercase">Ano</label>
          <input 
            type="number" 
            className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 p-6 rounded-lg text-center">
        <p className="text-slate-600 mb-4">A folha será gerada com os dias do mês selecionado e campos em branco para preenchimento manual de entrada e saída.</p>
        <button
          onClick={handlePrint}
          disabled={!selectedId}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-md flex items-center gap-2 mx-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Gerar PDF da Folha de Ponto
        </button>
      </div>
    </div>
  );
};
