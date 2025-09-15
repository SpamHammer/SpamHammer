const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const dataFiles = {
    'antidelete.json': JSON.stringify({ enabled: false }, null, 2),
    'autoread.json': JSON.stringify({ enabled: false }, null, 2),
    'autoStatus.json': JSON.stringify({ enabled: false }, null, 2),
    'autotyping.json': JSON.stringify({ enabled: false }, null, 2),
    'banned.json': JSON.stringify([], null, 2),
    'messageCount.json': JSON.stringify({ isPublic: true, messageCount: {} }, null, 2),
    'owner.json': JSON.stringify(['910000000000@s.whatsapp.net', '917023951514@s.whatsapp.net'], null, 2),
    'premium.json': JSON.stringify(['910000000000@s.whatsapp.net', '917023951514@s.whatsapp.net'], null, 2),
    'userGroupData.json': JSON.stringify({
        users: [],
        groups: [],
        antilink: {},
        antibadword: {},
        warnings: {},
        sudo: [],
        welcome: {},
        goodbye: {},
        chatbot: {},
        autoReaction: false
    }, null, 2),
    'warnings.json': JSON.stringify({}, null, 2)
};

function initializeDataFiles() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    for (const [fileName, defaultContent] of Object.entries(dataFiles)) {
        const filePath = path.join(dataDir, fileName);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, defaultContent);
        }
    }
}

module.exports = { initializeDataFiles };