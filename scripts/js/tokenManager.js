import fs from 'fs';
import { getBearerToken } from './getToken.js';
import { sleep, logInfo, logError, logWarn } from './utils.js';

const TOKEN_FILE = 'cached_token.txt';

const saveToken = (token) => {
    try {
        fs.writeFileSync(TOKEN_FILE, token);
    } catch (error) {
        logError('Failed to save token to file');
    }
};

const loadToken = () => {
    try {
        if (fs.existsSync(TOKEN_FILE)) {
            return fs.readFileSync(TOKEN_FILE, 'utf8').trim();
        }
    } catch (error) {
        logError('Failed to load token from file');
    }
    return null;
};

const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        const exp = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();

        // logInfo('Token expires at:', new Date(exp).toISOString());
        // logInfo('Current time:', new Date(now).toISOString());
        // logInfo('Time left:', Math.round((exp - now) / 1000), 'seconds');
        
        
        return exp > now;
    } catch (error) {
        return false;
    }
};

const getValidToken = async (force = false) => {
    let token = loadToken();
    
    if (!force && isTokenValid(token)) {
        logInfo('Using cached token');
        return token;
    }
    
    logInfo('Getting new token');
    token = await getBearerToken();
    saveToken(token);
    return token;
};

export { getValidToken, saveToken };