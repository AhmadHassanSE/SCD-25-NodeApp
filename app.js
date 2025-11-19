require('dotenv').config();
const readline = require('readline-sync');
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

// MongoDB variables
let db, vaultCollection;

// Database connection function
async function connectDB() {
    try {
        const client = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017/vaultdb');
        await client.connect();
        db = client.db(process.env.DB_NAME || 'vaultdb');
        vaultCollection = db.collection(process.env.COLLECTION_NAME || 'records');
        console.log("✅ Connected to MongoDB successfully");
    } catch (error) {
        console.log("❌ MongoDB connection error:", error.message);
        process.exit(1);
    }
}

// Main application function (now async)
async function main() {
    console.log("=== Secure Data Vault ===");
    console.log("🔄 Connecting to database...");
    await connectDB();
    
    while (true) {
        showMenu();
        const choice = readline.question("Choose an option (1-9): ");
        
        switch(choice) {
            case '1':
                await viewRecords();
                break;
            case '2':
                await addRecord();
                break;
            case '3':
                console.log("Update Record functionality - To be implemented");
                break;
            case '4':
                await deleteRecord();
                break;
            case '5':
                await searchRecords();
                break;
            case '6':
                await sortRecords();
                break;
            case '7':
                await exportData();
                break;
            case '8':
                await showStatistics();
                break;
            case '9':
                console.log("Goodbye!");
                process.exit(0);
            default:
                console.log("Invalid option. Please try again.");
        }
    }
}

// Enhanced Menu
function showMenu() {
    console.log("\n=== Enhanced Menu ===");
    console.log("1. View Records");
    console.log("2. Add Record");
    console.log("3. Update Record");
    console.log("4. Delete Record");
    console.log("5. Search Records");
    console.log("6. Sort Records");
    console.log("7. Export Data");
    console.log("8. View Vault Statistics");
    console.log("9. Exit");
}

// Add Record with MongoDB
async function addRecord() {
    console.log("\n=== Add New Record ===");
    const name = readline.question("Enter name: ").trim();
    
    // Validate input
    if (!name) {
        console.log("❌ Name cannot be empty!");
        return;
    }
    
    const newRecord = {
        name: name,
        created: new Date().toISOString().split('T')[0]
    };
    
    try {
        const result = await vaultCollection.insertOne(newRecord);
        console.log(`✅ Record added successfully!`);
        console.log(`📝 MongoDB ID: ${result.insertedId} | Name: ${name} | Created: ${newRecord.created}`);
        
        // Create backup after addition
        await createBackup();
    } catch (error) {
        console.log("❌ Error adding record:", error.message);
    }
}

// Delete Record with MongoDB
async function deleteRecord() {
    try {
        const records = await vaultCollection.find({}).toArray();
        
        if (records.length === 0) {
            console.log("❌ No records available to delete.");
            return;
        }
        
        console.log("\n=== Delete Record ===");
        
        // Show all records for reference
        console.log("Current Records:");
        records.forEach((record, index) => {
            console.log(`${index + 1}. ID: ${record._id} | Name: ${record.name} | Created: ${record.created}`);
        });
        
        const input = readline.question("\nEnter MongoDB ID or Name of record to delete: ").trim();
        
        let query = {};
        
        // Search by MongoDB ID or Name
        if (ObjectId.isValid(input)) {
            query = { _id: new ObjectId(input) };
        } else {
            // Search by Name (case-insensitive)
            query = { name: { $regex: input, $options: 'i' } };
        }
        
        const recordToDelete = await vaultCollection.findOne(query);
        
        if (!recordToDelete) {
            console.log("❌ Record not found!");
            return;
        }
        
        // Confirmation
        console.log(`\nRecord to delete:`);
        console.log(`MongoDB ID: ${recordToDelete._id} | Name: ${recordToDelete.name} | Created: ${recordToDelete.created}`);
        
        const confirm = readline.question("Are you sure you want to delete this record? (y/N): ").toLowerCase();
        
        if (confirm === 'y' || confirm === 'yes') {
            const result = await vaultCollection.deleteOne({ _id: recordToDelete._id });
            if (result.deletedCount === 1) {
                console.log("✅ Record deleted successfully!");
                await createBackup();
            } else {
                console.log("❌ Failed to delete record.");
            }
        } else {
            console.log("❌ Deletion cancelled.");
        }
    } catch (error) {
        console.log("❌ Error deleting record:", error.message);
    }
}

// View Records with MongoDB
async function viewRecords() {
    try {
        const records = await vaultCollection.find({}).toArray();
        
        if (records.length === 0) {
            console.log("📭 No records found in the vault.");
            return;
        }
        
        console.log(`\n=== All Records (${records.length} total) ===`);
        records.forEach((record, index) => {
            console.log(`${index + 1}. ID: ${record._id} | Name: ${record.name} | Created: ${record.created}`);
        });
    } catch (error) {
        console.log("❌ Error fetching records:", error.message);
    }
}

// Search Records with MongoDB
async function searchRecords() {
    const keyword = readline.question("Enter search keyword: ").toLowerCase();
    
    try {
        const matches = await vaultCollection.find({
            $or: [
                { name: { $regex: keyword, $options: 'i' } }
            ]
        }).toArray();
        
        if (matches.length === 0) {
            console.log("No records found.");
        } else {
            console.log(`\nFound ${matches.length} matching records:`);
            matches.forEach((record, index) => {
                console.log(`${index + 1}. ID: ${record._id} | Name: ${record.name} | Created: ${record.created}`);
            });
        }
    } catch (error) {
        console.log("❌ Error searching records:", error.message);
    }
}

// Sort Records with MongoDB
async function sortRecords() {
    const field = readline.question("Choose field to sort by (Name/Date): ").toLowerCase();
    const order = readline.question("Choose order (Ascending/Descending): ").toLowerCase();
    
    try {
        let sortOption = {};
        
        if (field === 'name') {
            sortOption = { name: order === 'descending' ? -1 : 1 };
        } else if (field === 'date') {
            sortOption = { created: order === 'descending' ? -1 : 1 };
        } else {
            console.log("Invalid field. Sorting by name.");
            sortOption = { name: 1 };
        }
        
        const sorted = await vaultCollection.find({}).sort(sortOption).toArray();
        
        console.log("\nSorted Records:");
        sorted.forEach((record, index) => {
            console.log(`${index + 1}. ID: ${record._id} | Name: ${record.name} | Created: ${record.created}`);
        });
    } catch (error) {
        console.log("❌ Error sorting records:", error.message);
    }
}

// Export Data with MongoDB
async function exportData() {
    try {
        const records = await vaultCollection.find({}).toArray();
        const timestamp = new Date().toLocaleString();
        
        let content = `VAULT DATA EXPORT\n`;
        content += `================\n`;
        content += `Export Date: ${timestamp}\n`;
        content += `Total Records: ${records.length}\n`;
        content += `Database: MongoDB\n\n`;
        content += `RECORDS:\n`;
        content += `--------\n`;
        
        records.forEach((record, index) => {
            content += `${index + 1}. ID: ${record._id} | Name: ${record.name} | Created: ${record.created}\n`;
        });
        
        fs.writeFileSync('export.txt', content, 'utf8');
        console.log("✅ Data exported successfully to export.txt");
        console.log(`📊 Total records exported: ${records.length}`);
        
    } catch (error) {
        console.log("❌ Error exporting data:", error.message);
    }
}

// Create Backup with MongoDB
async function createBackup() {
    try {
        const records = await vaultCollection.find({}).toArray();
        
        // Create backups directory if it doesn't exist
        if (!fs.existsSync('backups')) {
            fs.mkdirSync('backups');
        }
        
        const timestamp = new Date().toISOString()
            .replace(/:/g, '-')
            .replace(/\..+/, '');
        const filename = `backups/backup_${timestamp}.json`;
        
        const backupData = {
            timestamp: new Date().toISOString(),
            totalRecords: records.length,
            records: records
        };
        
        fs.writeFileSync(filename, JSON.stringify(backupData, null, 2));
        console.log(`💾 Backup created: ${filename}`);
        
    } catch (error) {
        console.log("❌ Error creating backup:", error.message);
    }
}

// Show Statistics with MongoDB
async function showStatistics() {
    try {
        const records = await vaultCollection.find({}).toArray();
        
        if (records.length === 0) {
            console.log("No records available for statistics.");
            return;
        }
        
        const totalRecords = records.length;
        
        // Find longest name
        const longestNameRecord = records.reduce((longest, current) => 
            current.name.length > longest.name.length ? current : longest, records[0]);
        
        // Get creation dates
        const dates = records.map(record => new Date(record.created));
        const earliestDate = new Date(Math.min(...dates));
        const latestDate = new Date(Math.max(...dates));
        
        // Calculate average name length
        const avgNameLength = (records.reduce((sum, record) => sum + record.name.length, 0) / totalRecords).toFixed(2);
        
        console.log("\n📊 Vault Statistics:");
        console.log("===================");
        console.log(`Total Records: ${totalRecords}`);
        console.log(`Database: MongoDB`);
        console.log(`Last Modified: ${new Date().toLocaleString()}`);
        console.log(`Longest Name: ${longestNameRecord.name} (${longestNameRecord.name.length} characters)`);
        console.log(`Average Name Length: ${avgNameLength} characters`);
        console.log(`Earliest Record: ${earliestDate.toISOString().split('T')[0]}`);
        console.log(`Latest Record: ${latestDate.toISOString().split('T')[0]}`);
        console.log(`Date Range: ${Math.ceil((latestDate - earliestDate) / (1000 * 60 * 60 * 24))} days`);
        
    } catch (error) {
        console.log("❌ Error fetching statistics:", error.message);
    }
}

// Start the application
main().catch(console.error);
