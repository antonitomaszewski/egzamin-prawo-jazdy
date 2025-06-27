import { exec } from 'child_process';
import { logInfo, logError } from './utils.js';

const getToken = async () => {
    return new Promise(resolve => {
        const pythonCommand = `python ./scripts/py/getToken.py`;
        exec(pythonCommand, (error, stdout, stderr) => {
            if (error) {
                logError(`Error executing Python script: ${error.message}`);
                return;
            }
            if (stderr) {
                logError(`Python script stderr: ${stderr}`);
                return;
            }
        
            const outputValue = stdout.trim();

            resolve(outputValue);
        });
    });
}


export const getBearerToken = async () => {
    logInfo("Getting authorization token...");
    let bearerToken = "";
    do {
        bearerToken = await getToken();
        if (bearerToken === "") {
            logInfo("Failed to get token, retrying in 3 seconds...");
            await new Promise(resolve => setTimeout(resolve, process.env.SLEEP));
        }
    } while(bearerToken === "");
    
    logInfo("Your token is: " + bearerToken);
    return bearerToken;
};