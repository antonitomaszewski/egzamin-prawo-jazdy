import { getValidToken } from './tokenManager.js';
import { takeAnyReservation } from './takeReservation.js';
import { getAllPracticeExams, saveExamsToFile } from './examUtils.js';
import { createAgent, fetchSchedule, handleResponse } from './apiService.js';

const processSchedule = async (schedule, bearerToken) => {
    console.log("Schedule data received");
    const exams = getAllPracticeExams(schedule.schedule.scheduledDays);

    saveExamsToFile(exams);
    // process.exit(0)
    // await takeAnyReservation(exams, bearerToken);
};

// Ulepszona funkcja sleep z losowością
const sleep = (baseMs) => {
    const randomness = Math.random() * 1000; // 0-1000ms losowości
    const totalMs = parseInt(baseMs) + randomness;
    console.log(`Sleeping for ${Math.round(totalMs)}ms`);
    return new Promise(resolve => setTimeout(resolve, totalMs));
};

export const startSearching = async () => {
    let bearerToken = await getValidToken();
    const agent = createAgent();

    while (true) {

        try {
            console.log("Fetching available exam slots...");
            const response = await fetchSchedule(bearerToken, agent);

            if (response.status === 401) {
                console.log("Token invalid (401), forcing refresh...");
                const responseText = await response.text();
                
                // Sprawdź czy to WAF czy expired token
                if (responseText.includes("Request Rejected") || 
                    responseText.includes("Access Denied") ||
                    responseText.includes("blocked")) {
                    
                    console.log("⚠️ WAF blocking detected - waiting 30 seconds...");
                    await sleep(30000); // 30 sekund
                    // NIE generuj nowego tokenu!
                    
                } else {
                    console.log("Token expired - getting new one...");
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
                        console.log(`Rate limit header ${header}: ${response.headers.get(header)}`);
                    }
                }
                continue;
            }

            if (response.status === 429) {
                console.log("429 Too Many Requests - definite rate limiting");
                const retryAfter = response.headers.get('Retry-After');
                console.log(`Retry after: ${retryAfter} seconds`);
                await sleep(parseInt(retryAfter) * 1000 || 60000);
            }

            const schedule = await handleResponse(response);
            if (!schedule) {
                bearerToken = await getValidToken();
                continue;
            }

            await processSchedule(schedule, bearerToken);

            console.log("No available slots found - checking again in 5 seconds");
            await sleep(process.env.SLEEP);
            
        } catch (error) {
            console.log(`Error: ${error.message}`);
            await sleep(process.env.SLEEP);
        }
    }
};
