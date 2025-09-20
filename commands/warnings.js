const fs = require('fs');
const path = require('path');
const { getWarningCount } = require('../lib/index');

async function warningsCommand(sock, chatId, mentionedJidList) {
    if (!mentionedJidList || mentionedJidList.length === 0) {
        await sock.sendMessage(chatId, { text: 'Please mention a user to check warnings.' });
        return;
    }

    const userToCheck = mentionedJidList[0];

    const warningCount = await getWarningCount(chatId, userToCheck);

    // mention the user in the reply
    await sock.sendMessage(chatId, { 
        text: `@${userToCheck.split('@')[0]} has ${warningCount} warning(s).`,
        mentions: [userToCheck]
    });
}

module.exports = warningsCommand;
