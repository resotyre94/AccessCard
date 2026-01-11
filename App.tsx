
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { FileUploader } from './components/FileUploader';
import { QRScanner } from './components/QRScanner';
import { EmployeeCard } from './components/EmployeeCard';
import { ManualSearch } from './components/ManualSearch';
import { DataStatus } from './components/DataStatus';
import { Employee, AppStatus } from './types';
import { STORAGE_KEY, SYNC_URL } from './constants';

const App: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Initial data fetch from Cloud and LocalStorage
  useEffect(() => {
    const initData = async () => {
      setIsSyncing(true);
      
      // 1. Try to load from LocalStorage first for instant UI
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setEmployees(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse stored data', e);
        }
      }

      // 2. Fetch latest from Cloud to sync across devices
      try {
        const response = await fetch(SYNC_URL);
        if (response.ok) {
          const cloudData = await response.json();
          if (Array.isArray(cloudData) && cloudData.length > 0) {
            setEmployees(cloudData);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
          }
        }
      } catch (err) {
        console.warn('Cloud sync failed, using local data:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    initData();
  }, []);

  const handleDataLoaded = async (data: Employee[]) => {
    setIsSyncing(true);
    // Update local state and storage
    setEmployees(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setStatus(AppStatus.IDLE);
    setErrorMsg('');
    setCurrentEmployee(null);

    // Push to Cloud
    try {
      const response = await fetch(SYNC_URL, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to sync to cloud');
      console.log('Successfully synced to cloud');
    } catch (err) {
      console.error('Cloud upload error:', err);
      alert('Local update successful, but cloud sync failed. Data may not be available on other devices.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear the global database? This affects all devices.')) {
      setIsSyncing(true);
      setEmployees([]);
      localStorage.removeItem(STORAGE_KEY);
      setCurrentEmployee(null);
      setStatus(AppStatus.IDLE);

      // Clear from Cloud
      try {
        await fetch(SYNC_URL, {
          method: 'POST',
          body: JSON.stringify([]),
        });
      } catch (err) {
        console.error('Cloud clear error:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const lookupEmployee = useCallback((query: string) => {
    if (employees.length === 0) {
      setErrorMsg('No employee data found. Admin must upload a file first.');
      setStatus(AppStatus.ERROR);
      return;
    }

    const trimmedQuery = query.trim();
    const found = employees.find(emp => 
      emp.cardNumber.toString().trim() === trimmedQuery || 
      emp.employeeId.toString().trim() === trimmedQuery
    );
    
    if (found) {
      setCurrentEmployee(found);
      setStatus(AppStatus.RESULT);
      setErrorMsg('');
    } else {
      setErrorMsg(`"${trimmedQuery}" not found in database.`);
      setStatus(AppStatus.ERROR);
      setCurrentEmployee(null);
    }
  }, [employees]);

  const toggleScanner = () => {
    if (status === AppStatus.SCANNING) {
      setStatus(AppStatus.IDLE);
    } else {
      setStatus(AppStatus.SCANNING);
      setCurrentEmployee(null);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-24">
        
        <div className="space-y-4">
          <div className="relative">
            <DataStatus 
              count={employees.length} 
              onClear={handleClearData} 
            />
            {isSyncing && (
              <div className="absolute -top-3 -right-3 flex items-center gap-2 bg-cyan-500 text-black text-[9px] font-black px-3 py-1 rounded-full animate-bounce shadow-lg shadow-cyan-500/40">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                SYNCING CLOUD
              </div>
            )}
          </div>
          
          {employees.length === 0 && !isSyncing && (
            <div className="glass-card rounded-3xl p-10 border-dashed border-2 border-cyan-500/30 text-center">
              <p className="text-zinc-400 mb-6 font-light">The database is currently empty.<br/>Admin authentication required to initialize.</p>
              <FileUploader onDataLoaded={handleDataLoaded} label="Initialize Master Database" />
            </div>
          )}
        </div>

        {employees.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <button
                onClick={toggleScanner}
                className={`flex-1 py-4 px-6 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 ${
                  status === AppStatus.SCANNING 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black hover:opacity-90 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                }`}
              >
                {status === AppStatus.SCANNING ? (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    Close Scanner
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                    Scan QR
                  </>
                )}
              </button>
              
              <div className="flex-[1.5]">
                <ManualSearch onSearch={lookupEmployee} />
              </div>
            </div>

            {status === AppStatus.ERROR && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-center font-medium animate-in fade-in slide-in-from-top-2">
                {errorMsg}
              </div>
            )}

            {status === AppStatus.SCANNING && (
              <div className="glass-card rounded-3xl p-4 overflow-hidden border-2 border-cyan-500/20">
                <QRScanner 
                  onScanSuccess={(id) => {
                    lookupEmployee(id);
                  }}
                  onScanError={(err) => {
                    // Ignored
                  }}
                />
              </div>
            )}

            {status === AppStatus.RESULT && currentEmployee && (
              <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
                <EmployeeCard employee={currentEmployee} />
              </div>
            )}
            
            <div className="pt-10 border-t border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="text-xs font-black text-zinc-600 uppercase tracking-[0.3em]">Master Database Control</h3>
              <FileUploader onDataLoaded={handleDataLoaded} label="Update Global Database" />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
