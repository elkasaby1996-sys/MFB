import { base44 } from '@/api/base44Client';

const BACKUP_VERSION = '1.0';

// List of all entity types to backup
const ENTITY_TYPES = [
  'UserProfile',
  'Transaction',
  'Budget',
  'SavingsGoal',
  'Investment',
  'BrokerageAccount',
  'Debt',
  'Subscription',
  'Mission',
  'UserMission',
  'Watchlist',
  'NetWorthHistory',
  'SideHustleClient',
  'SideHustleProject',
  'SideHustleInvoice',
  'SideHustleTransaction',
  'FXRate',
  'Donation',
  'GivingGoal',
  'ZakatProfile',
  'ManualAsset',
  'Remittance',
  'RemittanceGoal',
  'CountryProfile',
  'Receipt',
];

export const BackupService = {
  /**
   * Export all app data to JSON
   * @returns {Promise<object>} Backup data object
   */
  async exportData() {
    try {
      const backup = {
        schema_version: BACKUP_VERSION,
        exported_at: new Date().toISOString(),
        data: {},
      };

      // Fetch all data from each entity
      for (const entityType of ENTITY_TYPES) {
        try {
          const records = await base44.entities[entityType].list('', 10000);
          backup.data[entityType] = records || [];
        } catch (error) {
          console.warn(`Could not export ${entityType}:`, error);
          backup.data[entityType] = [];
        }
      }

      return backup;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  },

  /**
   * Download backup as JSON file
   * @param {object} backupData - The backup data object
   */
  downloadBackup(backupData) {
    try {
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `myfinancebro_backup_${timestamp}.json`;
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading backup:', error);
      throw new Error('Failed to download backup');
    }
  },

  /**
   * Validate backup file structure
   * @param {object} backupData
   * @returns {object} { valid: boolean, error?: string, summary?: object }
   */
  validateBackup(backupData) {
    try {
      if (!backupData || typeof backupData !== 'object') {
        return { valid: false, error: 'Invalid backup file format' };
      }

      if (!backupData.schema_version) {
        return { valid: false, error: 'Missing schema version' };
      }

      if (!backupData.data || typeof backupData.data !== 'object') {
        return { valid: false, error: 'Missing data section' };
      }

      // Generate summary
      const summary = {};
      let totalRecords = 0;
      
      for (const entityType of ENTITY_TYPES) {
        const records = backupData.data[entityType] || [];
        if (Array.isArray(records) && records.length > 0) {
          summary[entityType] = records.length;
          totalRecords += records.length;
        }
      }

      return {
        valid: true,
        summary,
        totalRecords,
        exportedAt: backupData.exported_at,
        schemaVersion: backupData.schema_version,
      };
    } catch (error) {
      return { valid: false, error: 'Failed to validate backup file' };
    }
  },

  /**
   * Import backup data (replace all)
   * @param {object} backupData
   * @returns {Promise<void>}
   */
  async importData(backupData) {
    try {
      // Validate first
      const validation = this.validateBackup(backupData);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Delete all existing data first
      for (const entityType of ENTITY_TYPES) {
        try {
          const existingRecords = await base44.entities[entityType].list('', 10000);
          if (existingRecords && existingRecords.length > 0) {
            for (const record of existingRecords) {
              await base44.entities[entityType].delete(record.id);
            }
          }
        } catch (error) {
          console.warn(`Could not delete ${entityType}:`, error);
        }
      }

      // Import new data
      for (const entityType of ENTITY_TYPES) {
        const records = backupData.data[entityType] || [];
        if (Array.isArray(records) && records.length > 0) {
          try {
            for (const record of records) {
              // Remove system fields that shouldn't be imported
              const { id, created_date, updated_date, created_by, ...cleanRecord } = record;
              await base44.entities[entityType].create(cleanRecord);
            }
          } catch (error) {
            console.warn(`Error importing ${entityType}:`, error);
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Failed to import data: ' + error.message);
    }
  },

  /**
   * Read backup file from input
   * @param {File} file
   * @returns {Promise<object>}
   */
  async readBackupFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          resolve(json);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  },
};