Secure Data Vault - Dockerized Node.js Application

https://img.shields.io/badge/Docker-Containerized-blue
https://img.shields.io/badge/Node.js-20-green
https://img.shields.io/badge/MongoDB-Database-green
https://img.shields.io/badge/Express.js-API-red

A comprehensive Node.js application demonstrating modern software deployment practices with Docker containerization, MongoDB integration, and full-stack development principles.
📋 Table of Contents

    Features

    Project Structure

    Quick Start

    Prerequisites

    Installation & Deployment

    API Documentation

    Features Overview

    Docker Configuration

    Development

    Screenshots

    Troubleshooting

    Contributing

✨ Features
Core Functionality

    🔐 Secure Data Vault - Robust data management system

    📊 CRUD Operations - Create, Read, Update, Delete records

    🔍 Advanced Search - Search by name or ID (case-insensitive)

    📈 Sorting Capabilities - Sort by name or creation date (ascending/descending)

    📤 Data Export - Export all records to formatted text files

    💾 Automatic Backups - Real-time backup system on data modifications

    📊 Statistics Dashboard - Comprehensive data analytics and insights

Technical Features

    🐳 Docker Containerization - Full container support

    📡 Dual Mode Operation - Interactive CLI + REST API

    🗄️ MongoDB Integration - Persistent database storage

    🌐 RESTful API - Complete API endpoints

    🔧 Environment Configuration - Secure environment variable management

    📦 Docker Compose - Multi-container orchestration

🏗️ Project Structure
text

SCDProject25/
├── 📁 backups/                 # Automatic backup files
├── 📄 app.js                  # Main application file
├── 📄 Dockerfile              # Docker image configuration
├── 📄 docker-compose.yml      # Multi-container orchestration
├── 📄 package.json            # Node.js dependencies
├── 📄 .env.example            # Environment variables template
├── 📄 export.txt              # Data export files
├── 📄 README.md               # This file
└── 📄 DEPLOYMENT.md           # Detailed deployment guide

🚀 Quick Start
Prerequisites

    Docker & Docker Compose

    Git (for cloning repository)

    Web Browser (for testing)

One-Command Deployment
bash

# Clone the repository
git clone https://github.com/yourusername/SCDProject25
cd SCDProject25

# Deploy with Docker Compose
docker-compose up --build

# Access the application
# Open browser: http://localhost:3000

📥 Installation & Deployment
Method 1: Docker Compose (Recommended)
bash

# 1. Clone the repository
git clone https://github.com/yourusername/SCDProject25
cd SCDProject25

# 2. Deploy the application
docker-compose up --build

# 3. Access the application
# Web Interface: http://localhost:3000
# API Base URL: http://localhost:3000/api

Method 2: Manual Docker Setup
bash

# Create Docker network
docker network create vault-network

# Start MongoDB
docker run -d --name mongodb --network vault-network \
  -v mongodb_data:/data/db \
  mongo:latest

# Build and run application
docker build -t secure-vault .
docker run -d --name vault-app --network vault-network \
  -p 3000:3000 \
  -e MONGO_URI=mongodb://mongodb:27017/vaultdb \
  secure-vault

Method 3: Local Development
bash

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB connection string

# Start application
npm start

📚 API Documentation
Base URL
text

http://localhost:3000

Endpoints
🏠 API Status
http

GET /

Response:
json

{
  "message": "SCD Project API is running",
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "features": ["CRUD", "Search", "Sort", "Export", "Backup", "Statistics"]
}

📋 Records Management
http

GET /records

Response:
json

{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 1001,
      "name": "John Doe",
      "created": "2024-01-15"
    }
  ]
}

http

POST /records
Content-Type: application/json

{
  "name": "Jane Smith",
  "id": 1002
}

🔍 Search Records
http

GET /search?keyword=john

Response:
json

{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 1001,
      "name": "John Doe",
      "created": "2024-01-15"
    }
  ]
}

📊 Statistics
http

GET /stats

Response:
json

{
  "success": true,
  "data": {
    "totalRecords": 15,
    "lastModified": "2024-01-15T10:30:00.000Z",
    "longestName": "Christopher Johnson (18 characters)",
    "earliestRecord": "2024-01-10",
    "latestRecord": "2024-01-15"
  }
}

📤 Export Data
http

GET /export

Response:
json

{
  "success": true,
  "message": "Data exported successfully to export.txt",
  "file": "export.txt"
}

🔧 Features Overview
Interactive CLI Mode

When running outside Docker, the application provides an interactive menu:
text

=== Enhanced Menu ===
1. View Records
2. Add Record
3. Update Record
4. Delete Record
5. Search Records
6. Sort Records
7. Export Data
8. View Vault Statistics
9. Exit

Automatic Backup System

    Creates backups on every data modification

    Stores in backups/ directory with timestamped filenames

    JSON format for easy data recovery

Data Export

    Generates formatted export.txt files

    Includes headers with export metadata

    Human-readable format for easy analysis

Advanced Search

    Case-insensitive search by name or ID

    Partial matching supported

    Returns all matching records with details

🐳 Docker Configuration
Services
Backend Service

    Image: Custom-built from Dockerfile

    Port: 3000

    Environment: MongoDB connection string

    Volumes: Backups directory

    Depends on: MongoDB service

MongoDB Service

    Image: mongo:latest

    Port: 27017 (internal)

    Volumes: Persistent data storage

    Network: Private Docker network

Docker Compose Features

    Private Network: Isolated container communication

    Volume Persistence: Data survives container restarts

    Environment Variables: Secure configuration management

    Health Checks: Automatic service monitoring

🛠️ Development
Environment Variables

Create a .env file based on .env.example:
env

MONGO_URI=mongodb://mongodb:27017/vaultdb
NODE_ENV=production
DOCKER_ENV=true
PORT=3000

Building Custom Images
bash

# Build the application image
docker build -t secure-vault .

# Run with custom configuration
docker run -p 3000:3000 -e MONGO_URI="your-connection-string" secure-vault

Testing
bash

# Test API endpoints
curl http://localhost:3000/
curl http://localhost:3000/records
curl http://localhost:3000/stats

# Test with sample data
curl -X POST http://localhost:3000/records \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User", "id": 999}'

🐛 Troubleshooting
Common Issues

MongoDB Connection Failed
bash

# Check if MongoDB container is running
docker-compose ps

# View MongoDB logs
docker-compose logs mongodb

Port Already in Use
bash

# Find process using port 3000
lsof -i :3000

# Kill the process or use different port
docker-compose down
docker-compose up -p 3001:3000

Docker Build Fails
bash

# Clean build cache
docker-compose build --no-cache

# Check Dockerfile syntax
docker build -t test .

Data Persistence Issues
bash

# Check volume mounting
docker volume ls

# Inspect volume contents
docker run -it --rm -v mongodb_data:/data busybox ls /data

Logs and Debugging
bash

# View all service logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs mongodb

# Real-time log viewing
docker-compose logs -f

🤝 Contributing
Development Setup

    Fork the repository

    Create a feature branch: git checkout -b feature/new-feature

    Make your changes and test with Docker Compose

    Commit your changes: git commit -m 'Add new feature'

    Push to the branch: git push origin feature/new-feature

    Submit a pull request

Code Standards

    Use consistent JavaScript/Node.js patterns

    Include error handling for all operations

    Maintain Docker compatibility

    Update documentation for new features

📄 License

This project is part of an academic assignment for educational purposes.
🙏 Acknowledgments

    Docker Community for containerization tools

    MongoDB for database solutions

    Node.js for runtime environment

    Express.js for web framework

📞 Support

For issues and questions:

    Check the Troubleshooting section

    Review Docker and MongoDB logs

    Verify environment configuration

    Ensure all prerequisites are met

🚀 Happy Coding! Experience modern application deployment with Docker containerization and professional development practices.
