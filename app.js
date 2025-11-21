require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const fs = require('fs');
const express = require('express');

// Check if running in Docker/non-interactive environment
const isDocker = process.env.DOCKER_ENV || !process.stdout.isTTY;

class SecureDataVault {
    constructor() {
        this.records = [];
        this.lastModified = new Date().toISOString();
    }

    async connectDB() {
        try {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vaultdb');
            console.log('✅ Connected to MongoDB successfully\n');
            await this.loadRecords();
        } catch (error) {
            console.error('❌ Database connection error:', error.message);
            process.exit(1);
        }
    }

    async loadRecords() {
        try {
            // Define Record schema
            const recordSchema = new mongoose.Schema({
                id: Number,
                name: String,
                created: String
            });
            const Record = mongoose.model('Record', recordSchema);
            
            this.RecordModel = Record;
            this.records = await Record.find({});
            console.log(`📁 Loaded ${this.records.length} records from database`);
        } catch (error) {
            console.log('No existing records found, starting fresh.');
            // Create model for new records
            const recordSchema = new mongoose.Schema({
                id: Number,
                name: String,
                created: String
            });
            this.RecordModel = mongoose.model('Record', recordSchema);
        }
    }

    async createBackup() {
        try {
            if (!fs.existsSync('backups')) {
                fs.mkdirSync('backups');
            }
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `backups/backup_${timestamp}.json`;
            
            const allRecords = await this.RecordModel.find({});
            fs.writeFileSync(filename, JSON.stringify(allRecords, null, 2));
            console.log(`💾 Backup created: ${filename}`);
            
            return filename;
        } catch (error) {
            console.log('⚠️ Backup creation failed:', error.message);
            return null;
        }
    }

    // Interactive menu functions
    showMenu() {
        console.log('\n=== Enhanced Menu ===');
        console.log('1. View Records');
        console.log('2. Add Record');
        console.log('3. Update Record');
        console.log('4. Delete Record');
        console.log('5. Search Records');
        console.log('6. Sort Records');
        console.log('7. Export Data');
        console.log('8. View Vault Statistics');
        console.log('9. Exit');
        
        this.rl.question('\nChoose an option (1-9): ', (choice) => {
            this.handleMenuChoice(choice.trim());
        });
    }

    handleMenuChoice(choice) {
        switch (choice) {
            case '1':
                this.viewRecords();
                break;
            case '2':
                this.addRecord();
                break;
            case '3':
                this.updateRecord();
                break;
            case '4':
                this.deleteRecord();
                break;
            case '5':
                this.searchRecords();
                break;
            case '6':
                this.sortRecords();
                break;
            case '7':
                this.exportData();
                break;
            case '8':
                this.viewStatistics();
                break;
            case '9':
                this.exitApp();
                break;
            default:
                console.log('❌ Invalid option. Please choose 1-9.');
                this.showMenu();
        }
    }

    async viewRecords() {
        console.log('\n=== View Records ===');
        try {
            this.records = await this.RecordModel.find({});
            if (this.records.length === 0) {
                console.log('No records found.');
            } else {
                this.records.forEach((record, index) => {
                    console.log(`${index + 1}. ID: ${record.id} | Name: ${record.name} | Created: ${record.created}`);
                });
            }
        } catch (error) {
            console.log('❌ Error loading records:', error.message);
        }
        this.showMenu();
    }

    async addRecord() {
        console.log('\n=== Add New Record ===');
        this.rl.question('Enter ID: ', async (id) => {
            this.rl.question('Enter Name: ', async (name) => {
                try {
                    const newRecord = new this.RecordModel({
                        id: parseInt(id) || Date.now(),
                        name: name,
                        created: new Date().toISOString().split('T')[0]
                    });
                    
                    await newRecord.save();
                    this.records.push(newRecord);
                    this.lastModified = new Date().toISOString();
                    
                    console.log('✅ Record added successfully!');
                    await this.createBackup();
                } catch (error) {
                    console.log('❌ Error adding record:', error.message);
                }
                this.showMenu();
            });
        });
    }

    async searchRecords() {
        console.log('\n=== Search Records ===');
        this.rl.question('Enter search keyword: ', async (keyword) => {
            try {
                const matches = await this.RecordModel.find({
                    $or: [
                        { name: { $regex: keyword, $options: 'i' } },
                        { id: isNaN(keyword) ? null : parseInt(keyword) }
                    ].filter(condition => condition !== null)
                });
                
                if (matches.length === 0) {
                    console.log('No records found.');
                } else {
                    console.log(`Found ${matches.length} matching records:`);
                    matches.forEach((record, index) => {
                        console.log(`${index + 1}. ID: ${record.id} | Name: ${record.name} | Created: ${record.created}`);
                    });
                }
            } catch (error) {
                console.log('❌ Error searching records:', error.message);
            }
            this.showMenu();
        });
    }

    async sortRecords() {
        console.log('\n=== Sort Records ===');
        this.rl.question('Sort by (name/date): ', (field) => {
            this.rl.question('Order (asc/desc): ', async (order) => {
                try {
                    let sorted;
                    if (field.toLowerCase() === 'name') {
                        sorted = await this.RecordModel.find({}).sort({ name: order.toLowerCase() === 'desc' ? -1 : 1 });
                    } else if (field.toLowerCase() === 'date') {
                        sorted = await this.RecordModel.find({}).sort({ created: order.toLowerCase() === 'desc' ? -1 : 1 });
                    } else {
                        console.log('❌ Invalid field. Use "name" or "date".');
                        this.showMenu();
                        return;
                    }
                    
                    console.log('Sorted Records:');
                    sorted.forEach((record, index) => {
                        console.log(`${index + 1}. ID: ${record.id} | Name: ${record.name}`);
                    });
                } catch (error) {
                    console.log('❌ Error sorting records:', error.message);
                }
                this.showMenu();
            });
        });
    }

    async exportData() {
        console.log('\n=== Export Data ===');
        try {
            const allRecords = await this.RecordModel.find({});
            const timestamp = new Date().toISOString();
            let content = `SECURE DATA VAULT EXPORT\n`;
            content += `Export Date: ${timestamp}\n`;
            content += `Total Records: ${allRecords.length}\n`;
            content += `File: export.txt\n\n`;
            
            allRecords.forEach((record, index) => {
                content += `${index + 1}. ID: ${record.id} | Name: ${record.name} | Created: ${record.created}\n`;
            });
            
            fs.writeFileSync('export.txt', content);
            console.log('✅ Data exported successfully to export.txt');
        } catch (error) {
            console.log('❌ Error exporting data:', error.message);
        }
        this.showMenu();
    }

    async viewStatistics() {
        console.log('\n=== Vault Statistics ===');
        try {
            const allRecords = await this.RecordModel.find({});
            
            console.log(`Total Records: ${allRecords.length}`);
            console.log(`Last Modified: ${this.lastModified}`);
            
            if (allRecords.length > 0) {
                const longestName = allRecords.reduce((longest, current) =>
                    current.name.length > longest.name.length ? current : longest
                , allRecords[0]);
                
                const dates = allRecords.map(record => new Date(record.created));
                const earliest = new Date(Math.min(...dates));
                const latest = new Date(Math.max(...dates));
                
                console.log(`Longest Name: ${longestName.name} (${longestName.name.length} characters)`);
                console.log(`Earliest Record: ${earliest.toISOString().split('T')[0]}`);
                console.log(`Latest Record: ${latest.toISOString().split('T')[0]}`);
            }
        } catch (error) {
            console.log('❌ Error loading statistics:', error.message);
        }
        this.showMenu();
    }

    async updateRecord() {
        console.log('\n=== Update Record ===');
        console.log('Feature implementation required');
        this.showMenu();
    }

    async deleteRecord() {
        console.log('\n=== Delete Record ===');
        console.log('Feature implementation required');
        this.showMenu();
    }

    exitApp() {
        console.log('\n👋 Thank you for using Secure Data Vault!');
        this.rl.close();
        process.exit(0);
    }

    // API Server functions
    startServer() {
        const app = express();
        const PORT = process.env.PORT || 3000;
        
        app.use(express.json());
        
        // API Routes
        app.get('/', (req, res) => {
            res.json({
                message: "SCD Project API is running",
                status: "OK",
                timestamp: new Date().toISOString(),
                features: ["CRUD", "Search", "Sort", "Export", "Backup", "Statistics"]
            });
        });
        
        app.get('/records', async (req, res) => {
            try {
                const records = await this.RecordModel.find({});
                res.json({
                    success: true,
                    count: records.length,
                    data: records
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        app.post('/records', async (req, res) => {
            try {
                const { name, id } = req.body;
                const newRecord = new this.RecordModel({
                    id: id || Date.now(),
                    name: name,
                    created: new Date().toISOString().split('T')[0]
                });
                
                await newRecord.save();
                await this.createBackup();
                this.lastModified = new Date().toISOString();
                
                res.json({
                    success: true,
                    message: "Record added successfully",
                    data: newRecord
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        app.get('/search', async (req, res) => {
            try {
                const { keyword } = req.query;
                if (!keyword) {
                    return res.status(400).json({
                        success: false,
                        error: "Search keyword is required"
                    });
                }
                
                const matches = await this.RecordModel.find({
                    $or: [
                        { name: { $regex: keyword, $options: 'i' } },
                        { id: isNaN(keyword) ? null : parseInt(keyword) }
                    ].filter(condition => condition !== null)
                });
                
                res.json({
                    success: true,
                    count: matches.length,
                    data: matches
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        app.get('/stats', async (req, res) => {
            try {
                const allRecords = await this.RecordModel.find({});
                
                let stats = {
                    totalRecords: allRecords.length,
                    lastModified: this.lastModified
                };
                
                if (allRecords.length > 0) {
                    const longestName = allRecords.reduce((longest, current) =>
                        current.name.length > longest.name.length ? current : longest
                    , allRecords[0]);
                    
                    const dates = allRecords.map(record => new Date(record.created));
                    const earliest = new Date(Math.min(...dates));
                    const latest = new Date(Math.max(...dates));
                    
                    stats.longestName = `${longestName.name} (${longestName.name.length} characters)`;
                    stats.earliestRecord = earliest.toISOString().split('T')[0];
                    stats.latestRecord = latest.toISOString().split('T')[0];
                }
                
                res.json({
                    success: true,
                    data: stats
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        app.get('/export', async (req, res) => {
            try {
                const allRecords = await this.RecordModel.find({});
                const timestamp = new Date().toISOString();
                let content = `SECURE DATA VAULT EXPORT\n`;
                content += `Export Date: ${timestamp}\n`;
                content += `Total Records: ${allRecords.length}\n`;
                content += `File: export.txt\n\n`;
                
                allRecords.forEach((record, index) => {
                    content += `${index + 1}. ID: ${record.id} | Name: ${record.name} | Created: ${record.created}\n`;
                });
                
                fs.writeFileSync('export.txt', content);
                
                res.json({
                    success: true,
                    message: "Data exported successfully to export.txt",
                    file: 'export.txt'
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Start server
        app.listen(PORT, () => {
            console.log("🚀 Server running in Docker mode");
            console.log(`📡 API available at: http://localhost:${PORT}`);
            console.log("📚 Available endpoints:");
            console.log("   GET  /              - API status");
            console.log("   GET  /records       - View all records");
            console.log("   POST /records       - Add new record");
            console.log("   GET  /search?keyword=term - Search records");
            console.log("   GET  /stats         - View statistics");
            console.log("   GET  /export        - Export data to file");
        });
    }

    // Main application starter
    async startApplication() {
        await this.connectDB();
        
        if (isDocker) {
            console.log("🐳 Docker environment detected - starting API server");
            this.startServer();
        } else {
            console.log("💻 Interactive mode detected - starting CLI application");
            // Create readline interface for interactive mode
            this.rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            this.showMenu();
        }
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    process.exit(0);
});

// Start the application
console.log('=== Secure Data Vault ===');
console.log('🔄 Starting application...');
const vault = new SecureDataVault();
vault.startApplication();
