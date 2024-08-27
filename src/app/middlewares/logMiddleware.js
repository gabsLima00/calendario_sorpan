import fs from 'fs';
import path from 'path';

function logMiddleware(req, res, next) {
    const logFile = path.join(__dirname, '../logs', 'access.log');
    const logEntry = `${new Date().toISOString()} - ${req.method} ${req.originalUrl} - User: ${req.user.email}\n`;

    fs.appendFile(logFile, logEntry, (err) => {
        if (err) {
            console.error('Erro ao escrever no arquivo de log', err);
        }
    });

    next();
}

export default logMiddleware;