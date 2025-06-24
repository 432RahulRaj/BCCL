import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, AlertTriangle, RefreshCw, Settings } from 'lucide-react';
import { databaseChecker } from '../../lib/databaseChecker';
import toast from 'react-hot-toast';

interface DatabaseStatusProps {
  showDetails?: boolean;
  autoCheck?: boolean;
}

const DatabaseStatus: React.FC<DatabaseStatusProps> = ({ 
  showDetails = false, 
  autoCheck = true 
}) => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSetupRunning, setIsSetupRunning] = useState(false);
  const [summary, setSummary] = useState<string>('Checking database...');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [tableStatuses, setTableStatuses] = useState<any[]>([]);

  useEffect(() => {
    if (autoCheck) {
      checkDatabase();
      
      // Set up periodic checks every 5 minutes
      const interval = setInterval(checkDatabase, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [autoCheck]);

  const checkDatabase = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const result = await databaseChecker.checkDatabaseHealth();
      setIsHealthy(result.isHealthy);
      setTableStatuses(result.tableStatuses);
      
      const summary = await databaseChecker.getDatabaseSummary();
      setSummary(summary);
      setLastCheck(new Date());
      
      if (!result.isHealthy && result.missingTables.length > 0) {
        console.warn('Database issues detected:', result.message);
      }
    } catch (error: any) {
      console.error('Database check failed:', error);
      setIsHealthy(false);
      setSummary(`❌ Check failed: ${error.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  const setupDatabase = async () => {
    if (isSetupRunning) return;
    
    setIsSetupRunning(true);
    try {
      toast.loading('Setting up database...', { id: 'db-setup' });
      
      const result = await databaseChecker.setupDatabase();
      
      if (result.isHealthy) {
        toast.success('Database setup completed!', { id: 'db-setup' });
        await checkDatabase(); // Refresh status
      } else {
        toast.error(`Setup failed: ${result.message}`, { id: 'db-setup' });
      }
    } catch (error: any) {
      console.error('Database setup failed:', error);
      toast.error(`Setup failed: ${error.message}`, { id: 'db-setup' });
    } finally {
      setIsSetupRunning(false);
    }
  };

  const getStatusIcon = () => {
    if (isChecking || isSetupRunning) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    
    if (isHealthy === null) {
      return <Database className="h-4 w-4" />;
    }
    
    return isHealthy 
      ? <CheckCircle className="h-4 w-4 text-green-600" />
      : <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getStatusColor = () => {
    if (isHealthy === null || isChecking || isSetupRunning) {
      return 'bg-gray-100 text-gray-800';
    }
    
    return isHealthy 
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getStatusText = () => {
    if (isSetupRunning) return 'Setting up...';
    if (isChecking) return 'Checking...';
    if (isHealthy === null) return 'Unknown';
    return isHealthy ? 'Healthy' : 'Issues';
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <div 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${getStatusColor()}`}
          onClick={() => setShowModal(true)}
          title={summary}
        >
          {getStatusIcon()}
          <span className="ml-1">DB: {getStatusText()}</span>
        </div>
        
        {showDetails && (
          <div className="flex items-center space-x-1">
            <button
              onClick={checkDatabase}
              disabled={isChecking}
              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              title="Check database health"
            >
              <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
            </button>
            
            {!isHealthy && (
              <button
                onClick={setupDatabase}
                disabled={isSetupRunning}
                className="p-1 text-blue-500 hover:text-blue-700 disabled:opacity-50"
                title="Setup database"
              >
                <Settings className={`h-4 w-4 ${isSetupRunning ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Database Status Modal */}
      {showModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowModal(false)}></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                  <Database className="h-6 w-6 text-blue-600" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Database Status
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {summary}
                    </p>
                    {lastCheck && (
                      <p className="text-xs text-gray-400 mt-1">
                        Last checked: {lastCheck.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {tableStatuses.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Table Status</h4>
                  <div className="bg-gray-50 rounded-md p-3">
                    <div className="space-y-2">
                      {tableStatuses.map((table) => (
                        <div key={table.table_name} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{table.table_name}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">{table.row_count} rows</span>
                            {table.exists ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                {!isHealthy && (
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                    onClick={setupDatabase}
                    disabled={isSetupRunning}
                  >
                    {isSetupRunning ? (
                      <>
                        <RefreshCw className="animate-spin -ml-1 mr-3 h-4 w-4" />
                        Setting up...
                      </>
                    ) : (
                      'Setup Database'
                    )}
                  </button>
                )}
                
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm disabled:opacity-50"
                  onClick={checkDatabase}
                  disabled={isChecking}
                >
                  {isChecking ? (
                    <>
                      <RefreshCw className="animate-spin -ml-1 mr-3 h-4 w-4" />
                      Checking...
                    </>
                  ) : (
                    'Refresh Status'
                  )}
                </button>
              </div>
              
              <div className="mt-3">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DatabaseStatus;