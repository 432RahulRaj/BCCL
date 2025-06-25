import { supabase } from './supabase';
import toast from 'react-hot-toast';

interface DatabaseStatus {
  table_name: string;
  exists: boolean;
  row_count: number;
}

interface DatabaseCheckResult {
  isHealthy: boolean;
  missingTables: string[];
  tableStatuses: DatabaseStatus[];
  message: string;
}

export class DatabaseChecker {
  private static instance: DatabaseChecker;
  private lastCheck: Date | null = null;
  private checkInterval = 5 * 60 * 1000; // 5 minutes

  static getInstance(): DatabaseChecker {
    if (!DatabaseChecker.instance) {
      DatabaseChecker.instance = new DatabaseChecker();
    }
    return DatabaseChecker.instance;
  }

  /**
   * Check if all required tables exist and have data
   */
  async checkDatabaseHealth(): Promise<DatabaseCheckResult> {
    try {
      console.log('🔍 Checking database health...');

      // Check if we can connect to the database
      const { data: connectionTest, error: connectionError } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (connectionError) {
        console.error('❌ Database connection failed:', connectionError);
        return {
          isHealthy: false,
          missingTables: [],
          tableStatuses: [],
          message: `Database connection failed: ${connectionError.message}`
        };
      }

      // Get database status from our view
      const { data: statusData, error: statusError } = await supabase
        .from('database_status')
        .select('*');

      if (statusError) {
        console.error('❌ Failed to check database status:', statusError);
        
        // If the view doesn't exist, try to create the database
        if (statusError.code === 'PGRST116' || statusError.message.includes('does not exist')) {
          console.log('🔧 Database tables missing, attempting to create...');
          return await this.setupDatabase();
        }

        return {
          isHealthy: false,
          missingTables: [],
          tableStatuses: [],
          message: `Failed to check database status: ${statusError.message}`
        };
      }

      const tableStatuses = statusData as DatabaseStatus[];
      const missingTables = tableStatuses
        .filter(status => !status.exists)
        .map(status => status.table_name);

      const isHealthy = missingTables.length === 0;

      console.log('📊 Database status:', {
        healthy: isHealthy,
        missingTables,
        tableCount: tableStatuses.length
      });

      this.lastCheck = new Date();

      return {
        isHealthy,
        missingTables,
        tableStatuses,
        message: isHealthy 
          ? 'Database is healthy and all tables are present'
          : `Missing tables: ${missingTables.join(', ')}`
      };

    } catch (error: any) {
      console.error('❌ Database health check failed:', error);
      return {
        isHealthy: false,
        missingTables: [],
        tableStatuses: [],
        message: `Health check failed: ${error.message}`
      };
    }
  }

  /**
   * Setup the complete database by running our setup function
   */
  async setupDatabase(): Promise<DatabaseCheckResult> {
    try {
      console.log('🚀 Setting up database...');
      toast.loading('Setting up database tables...', { id: 'db-setup' });

      // Call our setup function
      const { data, error } = await supabase.rpc('setup_complete_database');

      if (error) {
        console.error('❌ Database setup failed:', error);
        toast.error(`Database setup failed: ${error.message}`, { id: 'db-setup' });
        
        return {
          isHealthy: false,
          missingTables: [],
          tableStatuses: [],
          message: `Database setup failed: ${error.message}`
        };
      }

      console.log('✅ Database setup completed:', data);
      toast.success('Database setup completed successfully!', { id: 'db-setup' });

      // Re-check the database health after setup
      return await this.checkDatabaseHealth();

    } catch (error: any) {
      console.error('❌ Database setup error:', error);
      toast.error(`Database setup error: ${error.message}`, { id: 'db-setup' });
      
      return {
        isHealthy: false,
        missingTables: [],
        tableStatuses: [],
        message: `Database setup error: ${error.message}`
      };
    }
  }

  /**
   * Auto-check database health periodically
   */
  async autoCheckDatabase(): Promise<void> {
    const now = new Date();
    
    // Skip if we've checked recently
    if (this.lastCheck && (now.getTime() - this.lastCheck.getTime()) < this.checkInterval) {
      return;
    }

    const result = await this.checkDatabaseHealth();
    
    if (!result.isHealthy && result.missingTables.length > 0) {
      console.warn('⚠️ Database issues detected:', result.message);
      
      // Attempt auto-repair for missing tables
      if (result.missingTables.length > 0) {
        console.log('🔧 Attempting to auto-repair database...');
        await this.setupDatabase();
      }
    }
  }

  /**
   * Get a summary of the database status
   */
  async getDatabaseSummary(): Promise<string> {
    const result = await this.checkDatabaseHealth();
    
    if (!result.isHealthy) {
      return `❌ Database Issues: ${result.message}`;
    }

    const totalRows = result.tableStatuses.reduce((sum, status) => sum + status.row_count, 0);
    return `✅ Database Healthy: ${result.tableStatuses.length} tables, ${totalRows} total records`;
  }

  /**
   * Force a fresh database check (ignoring cache)
   */
  async forceCheck(): Promise<DatabaseCheckResult> {
    this.lastCheck = null;
    return await this.checkDatabaseHealth();
  }

  /**
   * Check if specific tables exist
   */
  async checkTablesExist(tableNames: string[]): Promise<{ [tableName: string]: boolean }> {
    const result: { [tableName: string]: boolean } = {};
    
    for (const tableName of tableNames) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        result[tableName] = !error;
      } catch {
        result[tableName] = false;
      }
    }
    
    return result;
  }

  /**
   * Get table row counts
   */
  async getTableCounts(): Promise<{ [tableName: string]: number }> {
    const tables = ['users', 'departments', 'employees', 'complaints', 'complaint_comments', 'complaint_status_history'];
    const counts: { [tableName: string]: number } = {};
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        counts[table] = error ? 0 : (count || 0);
      } catch {
        counts[table] = 0;
      }
    }
    
    return counts;
  }
}

// Export singleton instance
export const databaseChecker = DatabaseChecker.getInstance();

// Auto-check function for use in components
export const autoCheckDatabase = () => databaseChecker.autoCheckDatabase();

// Manual check function for use in components
export const checkDatabaseHealth = () => databaseChecker.checkDatabaseHealth();

// Setup function for use in components
export const setupDatabase = () => databaseChecker.setupDatabase();

// Get summary for display
export const getDatabaseSummary = () => databaseChecker.getDatabaseSummary();