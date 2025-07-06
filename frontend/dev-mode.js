#!/usr/bin/env node

// Development Mode Toggle Script
// This script helps developers quickly switch between mock and real API modes

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine which env file to use based on NODE_ENV
const NODE_ENV = process.env.NODE_ENV || 'development';
const ENV_FILE_PATH = NODE_ENV === 'development' 
  ? path.join(__dirname, '.env.development')
  : path.join(__dirname, '.env');

function readEnvFile() {
  if (!fs.existsSync(ENV_FILE_PATH)) {
    console.error(`❌ Environment file not found: ${ENV_FILE_PATH}`);
    console.error('Please create one from .env.example');
    process.exit(1);
  }
  
  return fs.readFileSync(ENV_FILE_PATH, 'utf8');
}

function writeEnvFile(content) {
  fs.writeFileSync(ENV_FILE_PATH, content, 'utf8');
}

function updateEnvVariable(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${value}`);
  } else {
    return content + `\n${key}=${value}`;
  }
}

function getCurrentMode(content) {
  const match = content.match(/^VITE_USE_MOCKS=(.*)$/m);
  return match ? match[1].trim().toLowerCase() === 'true' : false;
}

function toggleMode() {
  const content = readEnvFile();
  const currentMode = getCurrentMode(content);
  const newMode = !currentMode;
  
  const updatedContent = updateEnvVariable(content, 'VITE_USE_MOCKS', newMode.toString());
  writeEnvFile(updatedContent);
  console.log(`🔄 Mode switched: ${currentMode ? 'Mock Endpoints' : 'Real Endpoints'} ➡️  ${newMode ? 'Mock Endpoints' : 'Real Endpoints'}`);
  console.log(`${newMode ? '🎭 Mock endpoints enabled (/api/v1/mock/*)' : '🔌 Real endpoints enabled (/api/v1/generation/*)'}`);
  console.log('');
  console.log('📝 Please restart your development server for changes to take effect:');
  console.log('   npm run dev');
}

function showStatus() {
  const content = readEnvFile();
  const currentMode = getCurrentMode(content);
  
  console.log('📊 Current Development Mode Status:');
  console.log(`   Environment File: ${path.basename(ENV_FILE_PATH)}`);
  console.log(`   Mode: ${currentMode ? '🎭 Mock' : '🔌 Real API'}`);
  
  const apiUrlMatch = content.match(/^VITE_API_BASE_URL=(.*)$/m);
  if (apiUrlMatch) {
    console.log(`   API URL: ${apiUrlMatch[1].trim()}`);
  }
  
  const delayMatch = content.match(/^VITE_MOCK_API_DELAY=(.*)$/m);
  if (delayMatch && currentMode) {
    console.log(`   Mock Delay: ${delayMatch[1].trim()}ms`);
  }
}

function enableMocks() {
  const content = readEnvFile();
  const updatedContent = updateEnvVariable(content, 'VITE_USE_MOCKS', 'true');
  writeEnvFile(updatedContent);
  console.log('🎭 Mock mode enabled');
}

function disableMocks() {
  const content = readEnvFile();
  const updatedContent = updateEnvVariable(content, 'VITE_USE_MOCKS', 'false');
  writeEnvFile(updatedContent);
  console.log('🔌 Real API mode enabled');
}

function showHelp() {
  console.log('🛠️  Frontend Development Mode Manager');
  console.log('');
  console.log('Usage:');
  console.log('  node dev-mode.js [command]');
  console.log('');
  console.log('Commands:');
  console.log('  toggle    Toggle between mock and real API modes');
  console.log('  status    Show current mode status');
  console.log('  mock      Enable mock mode');
  console.log('  real      Enable real API mode');
  console.log('  help      Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node dev-mode.js toggle    # Switch modes');
  console.log('  node dev-mode.js status    # Check current mode');
  console.log('  node dev-mode.js mock      # Enable mocks');
  console.log('  node dev-mode.js real      # Enable real API');
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'toggle':
    toggleMode();
    break;
  case 'status':
    showStatus();
    break;
  case 'mock':
    enableMocks();
    break;
  case 'real':
    disableMocks();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    if (command) {
      console.log(`❌ Unknown command: ${command}`);
      console.log('');
    }
    showHelp();
    break;
}
