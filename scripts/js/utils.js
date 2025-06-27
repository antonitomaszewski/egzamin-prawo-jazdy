import fs from 'fs';

const sleep = (baseMs) => {
    const randomness = Math.random() * 1000; // 0-1000ms losowości
    const totalMs = parseInt(baseMs) + randomness;
    log(`Sleeping for ${Math.round(totalMs)}ms`);
    return new Promise(resolve => setTimeout(resolve, totalMs));
};


// Funkcja logowania do pliku i konsoli
const log = (message, level = 'INFO') => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    
    // Wypisz do konsoli
    console.log(logMessage);
    
    // Zapisz do pliku
    try {
        fs.appendFileSync('app.log', logMessage + '\n');
    } catch (error) {
        console.error('Failed to write to log file:', error.message);
    }
};

// Specjalne funkcje dla różnych poziomów
const logError = (message) => log(message, 'ERROR');
const logWarn = (message) => log(message, 'WARN');
const logInfo = (message) => log(message, 'INFO');
const logDebug = (message) => log(message, 'DEBUG');

export { sleep, log, logError, logWarn, logInfo, logDebug };