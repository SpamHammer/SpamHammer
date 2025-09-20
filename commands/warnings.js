const fs = require('fs');
const path = require('path');

const warningsFilePath = path.join(__dirname, '../data/warnings.json');

function loadWarnings() {
    if (!fs.existsSync(warningsFilePath)) {
        fs.writeFileSync(warningsFilePath, JSON.stringify({}), 'utf8');
    }
    const data = fs.readFileSync(warningsFilePath, 'utf8');
    return JSON.parse(data);
}

async function warningsCommand(sock, chatId, mentionedJidList) {
    const warnings = loadWarnings();

    if (!mentionedJidList || mentionedJidList.length === 0) {
        await sock.sendMessage(chatId, { text: 'Please mention a user to check warnings.' });
        return;
    }

    const userToCheck = mentionedJidList[0];

    // FIX: look up the per-chat structure
    const warningCount = (warnings[chatId] && warnings[chatId][userToCheck]) || 0;

    // mention the user in the reply
    await sock.sendMessage(chatId, { 
        text: `@${userToCheck.split('@')[0]} has ${warningCount} warning(s).`,
    });
}

module.exports = warningsCommand;
