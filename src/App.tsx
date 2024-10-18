import React, { useState, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Download, Loader } from 'lucide-react';

interface FileData {
  name: string;
  data: any[][];
  columns: string[];
}

function App() {
  const [file1, setFile1] = useState<FileData | null>(null);
  const [file2, setFile2] = useState<FileData | null>(null);
  const [selectedColumn1, setSelectedColumn1] = useState<string>('');
  const [selectedColumn2, setSelectedColumn2] = useState<string>('');
  const [mergedData, setMergedData] = useState<any[][]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<FileData | null>>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const columns = jsonData[0] as string[];
        setFile({
          name: file.name,
          data: jsonData.slice(1) as any[][],
          columns,
        });
      };
      reader.readAsArrayBuffer(file);
    }
  }, []);

  const processData = useCallback(() => {
    if (file1 && file2 && selectedColumn1 && selectedColumn2) {
      setIsProcessing(true);
      setTimeout(() => {
        const col1Index = file1.columns.indexOf(selectedColumn1);
        const col2Index = file2.columns.indexOf(selectedColumn2);

        const mergedColumn = [...new Set([...file1.data.map(row => row[col1Index]), ...file2.data.map(row => row[col2Index])])];
        
        const result = mergedColumn.map((value, index) => {
          const row1Index = file1.data.findIndex(row => row[col1Index] === value);
          const row2Index = file2.data.findIndex(row => row[col2Index] === value);
          return [value, row1Index !== -1 ? row1Index + 2 : '', row2Index !== -1 ? row2Index + 2 : ''];
        });

        setMergedData(result);
        setIsProcessing(false);
      }, 100); // Simulate processing time
    }
  }, [file1, file2, selectedColumn1, selectedColumn2]);

  const downloadExcel = useCallback(() => {
    if (mergedData.length > 0) {
      const ws = XLSX.utils.aoa_to_sheet([['Merged Column', 'Table 1 Row', 'Table 2 Row'], ...mergedData]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Merged Data');
      XLSX.writeFile(wb, 'merged_data.xlsx');
    }
  }, [mergedData]);

  const previewData = useMemo(() => {
    if (file1 && file2 && selectedColumn1 && selectedColumn2) {
      const col1Index = file1.columns.indexOf(selectedColumn1);
      const col2Index = file2.columns.indexOf(selectedColumn2);
      
      const preview1 = file1.data.slice(0, 10).map(row => row[col1Index]);
      const preview2 = file2.data.slice(0, 10).map(row => row[col2Index]);
      
      return { preview1, preview2 };
    }
    return null;
  }, [file1, file2, selectedColumn1, selectedColumn2]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8">Excel File Processor</h1>
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Table 1 (XLSX or XLS)</label>
            <div className="flex items-center space-x-2">
              <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md inline-flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                <span>Choose File</span>
                <input type="file" className="hidden" accept=".xlsx,.xls" onChange={(e) => handleFileUpload(e, setFile1)} disabled={isProcessing} />
              </label>
              {file1 && <span className="text-sm text-gray-600">{file1.name}</span>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Table 2 (XLSX or XLS)</label>
            <div className="flex items-center space-x-2">
              <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md inline-flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                <span>Choose File</span>
                <input type="file" className="hidden" accept=".xlsx,.xls" onChange={(e) => handleFileUpload(e, setFile2)} disabled={isProcessing} />
              </label>
              {file2 && <span className="text-sm text-gray-600">{file2.name}</span>}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Column from Table 1</label>
            <select
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={selectedColumn1}
              onChange={(e) => setSelectedColumn1(e.target.value)}
              disabled={isProcessing}
            >
              <option value="">Select a column</option>
              {file1?.columns.map((column, index) => (
                <option key={index} value={column}>{column}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Column from Table 2</label>
            <select
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={selectedColumn2}
              onChange={(e) => setSelectedColumn2(e.target.value)}
              disabled={isProcessing}
            >
              <option value="">Select a column</option>
              {file2?.columns.map((column, index) => (
                <option key={index} value={column}>{column}</option>
              ))}
            </select>
          </div>
        </div>
        {previewData && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Data Preview (First 10 Rows)</h2>
            <div className="flex space-x-4">
              <div className="flex-1">
                <h3 className="text-md font-medium mb-2">Table 1 - {selectedColumn1}</h3>
                <ul className="list-disc list-inside">
                  {previewData.preview1.map((item, index) => (
                    <li key={index} className="text-sm">{item}</li>
                  ))}
                </ul>
              </div>
              <div className="flex-1">
                <h3 className="text-md font-medium mb-2">Table 2 - {selectedColumn2}</h3>
                <ul className="list-disc list-inside">
                  {previewData.preview2.map((item, index) => (
                    <li key={index} className="text-sm">{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-center space-x-4">
          <button
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={processData}
            disabled={!file1 || !file2 || !selectedColumn1 || !selectedColumn2 || isProcessing}
          >
            {isProcessing ? (
              <Loader className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-5 h-5 mr-2" />
            )}
            {isProcessing ? 'Processing...' : 'Process Data'}
          </button>
          <button
            className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={downloadExcel}
            disabled={mergedData.length === 0 || isProcessing}
          >
            <Download className="w-5 h-5 mr-2" />
            Download Result
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;