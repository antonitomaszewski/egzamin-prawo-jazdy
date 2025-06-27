import { getValidToken } from './tokenManager.js';
import { takeAnyReservation } from './takeReservation.js';
import { getAllPracticeExams, saveExamsToFile } from './examUtils.js';
import { createAgent, fetchSchedule, handleResponse } from './apiService.js';
import { sleep, logInfo, logError, logWarn } from './utils.js';

const processSchedule = async (schedule, bearerToken) => {
    logInfo("Schedule data received");
    const exams = getAllPracticeExams(schedule.schedule.scheduledDays);

    saveExamsToFile(exams);
    // process.exit(0)
    await takeAnyReservation(exams, bearerToken);
};

export const startSearching = async () => {
    let bearerToken = await getValidToken();
    const agent = createAgent();

    while (true) {

        try {
            logInfo("Fetching available exam slots...");
            const response = await fetchSchedule(bearerToken, agent);

            if (response.status === 401) {
                logWarn("Token invalid (401), forcing refresh...");
                const responseText = await response.text();
                
                // Sprawdź czy to WAF czy expired token
                if (responseText.includes("Request Rejected") || 
                    responseText.includes("Access Denied") ||
                    responseText.includes("blocked")) {
                    
                    logWarn("⚠️ WAF blocking detected - waiting 30 seconds...");
                    await sleep(30000); // 30 sekund
                    // NIE generuj nowego tokenu!
                    
                } else {
                    logInfo("Token expired - getting new one...");
                    bearerToken = await getValidToken(true);
                }
                    // Sprawdź czy to rate limiting czy expired token
                const rateLimitHeaders = [
                    'X-RateLimit-Remaining',
                    'X-RateLimit-Reset', 
                    'Retry-After'
                ];
                
                for (const header of rateLimitHeaders) {
                    if (response.headers.get(header)) {
                        logInfo(`Rate limit header ${header}: ${response.headers.get(header)}`);
                    }
                }
                continue;
            }

            if (response.status === 429) {
                logWarn("429 Too Many Requests - definite rate limiting");
                const retryAfter = response.headers.get('Retry-After');
                logInfo(`Retry after: ${retryAfter} seconds`);
                await sleep(parseInt(retryAfter) * 1000 || 60000);
                continue
            }

            const schedule = await handleResponse(response);
            if (!schedule) {
                bearerToken = await getValidToken();
                continue;
            }

            await processSchedule(schedule, bearerToken);

            logInfo("No available slots found");
            await sleep(process.env.SLEEP);
            
        } catch (error) {
            logError(`Error: ${error.message}`);
            await sleep(process.env.SLEEP);
        }
    }
};
