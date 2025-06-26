const sleep = (baseMs) => {
    const randomness = Math.random() * 1000; // 0-1000ms losowości
    const totalMs = parseInt(baseMs) + randomness;
    console.log(`Sleeping for ${Math.round(totalMs)}ms`);
    return new Promise(resolve => setTimeout(resolve, totalMs));
};


export { sleep };