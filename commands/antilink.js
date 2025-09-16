const { bots } = require('../lib/antilink');
const { setAntilink, getAntilink, removeAntilink, allowLinks, blockLinks } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');

async function handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '```For Group Admins Only!```' }, { quoted: message });
            return;
        }

        const prefix = '.';
        const args = userMessage.slice(9).toLowerCase().trim().split(' ');
        const action = args[0];

        if (!action) {
            const usage = `\`\`\`ANTILINK SETUP\n\n${prefix}antilink on\n${prefix}antilink set delete | kick | warn\n${prefix}antilink off\n\`\`\``;
            await sock.sendMessage(chatId, { text: usage }, { quoted: message });
            return;
        }

        const existingConfig = await getAntilink(chatId, 'on');
        switch (action) {
            case 'on':
                if (existingConfig?.enabled) {
                    await sock.sendMessage(chatId, { text: '*_Antilink is already on_*' }, { quoted: message });
                    return;
                }
                const result = await setAntilink(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, { 
                    text: result ? '*_Antilink has been turned ON_*' : '*_Failed to turn on Antilink_*' 
                },{ quoted: message });
                break;

            case 'off':
                await removeAntilink(chatId, 'on');
                await sock.sendMessage(chatId, { text: '*_Antilink has been turned OFF_*' }, { quoted: message });
                break;

            case 'set':
                if (args.length < 2) {
                    await sock.sendMessage(chatId, { 
                        text: `*_Please specify an action: ${prefix}antilink set delete | kick | warn_*` 
                    }, { quoted: message });
                    return;
                }
                const setAction = args[1];
                if (!['delete', 'kick', 'warn'].includes(setAction)) {
                    await sock.sendMessage(chatId, { 
                        text: '*_Invalid action. Choose delete, kick, or warn._*' 
                    }, { quoted: message });
                    return;
                }
                const setActionResult = await setAntilink(chatId, 'on', setAction);
                await sock.sendMessage(chatId, { 
                    text: setActionResult ? `*_Antilink action set to ${setAction}_*` : '*_Failed to set Antilink action_*' 
                }, { quoted: message });
                break;

            case 'get':
                await sock.sendMessage(chatId, { 
                    text: `*_Antilink Configuration:_*\nStatus: ${existingConfig?.enabled ? 'ON' : 'OFF'}\nAction: ${existingConfig ? existingConfig.action : 'Not set'}\nMode: ${existingConfig?.mode ? existingConfig.mode : 'Not set'}`
                }, { quoted: message });
                break;

            case 'allow':
                if (args.length < 2) {
                    await sock.sendMessage(chatId, { 
                        text: `*_Please specify at list one link e.g.: ${prefix}antilink allow example.com_*` 
                    }, { quoted: message });
                    return;
                }
                // Store from args[1] to args[args.length - 1] in linksToAllow array
                const linksToAllow = args.slice(1);
                const allowLinksResult = await allowLinks(chatId, linksToAllow);
                await sock.sendMessage(chatId, { 
                    text: allowLinksResult ? `*_Antilink allowed links updated_*` : '*_Failed to update Antilink allowed links_*' 
                }, { quoted: message });
                break;

            case 'block':
                if (args.length < 2) {
                    await sock.sendMessage(chatId, { 
                        text: `*_Please specify at list one link e.g.: ${prefix}antilink block example.com_*` 
                    }, { quoted: message });
                    return;
                }
                // Store from args[1] to args[args.length - 1] in linksToBlock array
                const linksToBlock = args.slice(1);
                const blockLinksResult = await blockLinks(chatId, linksToBlock);
                await sock.sendMessage(chatId, { 
                    text: blockLinksResult ? `*_Antilink blocked links updated_*` : '*_Failed to update Antilink blocked links_*' 
                }, { quoted: message });
                break;

            case 'list':
                const allowedLinks = existingConfig?.allowedLinks || [];
                const blockedLinks = existingConfig?.blockedLinks || [];
                let listMessage = '*Allowed Links:*\n';
                listMessage += allowedLinks.length > 0 ? allowedLinks.map(link => `- ${link}`).join('\n') : 'No allowed links.';
                listMessage += '\n\n*Blocked Links:*\n';
                listMessage += blockedLinks.length > 0 ? blockedLinks.map(link => `- ${link}`).join('\n') : 'No blocked links.';
                await sock.sendMessage(chatId, { text: listMessage }, { quoted: message });
                break;

            case 'mode':
                if (args.length < 2) {
                    await sock.sendMessage(chatId, { 
                        text: `*_Please specify a mode: ${prefix}antilink mode blacklist | whitelist_*` 
                    }, { quoted: message });
                    return;
                }
                const setMode = args[1];
                if (!['blacklist', 'whitelist'].includes(setMode)) {
                    await sock.sendMessage(chatId, { 
                        text: '*_Invalid mode. Choose blacklist or whitelist._*' 
                    }, { quoted: message });
                    return;
                }
                const setModeResult = await setAntilink(chatId, 'on', existingConfig ? existingConfig.action : 'delete', setMode);
                await sock.sendMessage(chatId, { 
                    text: setModeResult ? `*_Antilink mode set to ${setMode}_*` : '*_Failed to set Antilink mode_*' 
                }, { quoted: message });
                break;

            default:
                await sock.sendMessage(chatId, { text: `*_Use ${prefix}antilink for usage._*` });
        }
    } catch (error) {
        console.error('Error in antilink command:', error);
        await sock.sendMessage(chatId, { text: '*_Error processing antilink command_*' });
    }
}

async function handleLinkDetection(sock, chatId, message, userMessage, senderId) {
    const antilinkSetting = getAntilinkSetting(chatId);
    if (antilinkSetting === 'off') return;

    console.log(`Antilink Setting for ${chatId}: ${antilinkSetting}`);
    console.log(`Checking message for links: ${userMessage}`);
    
    // Log the full message object to diagnose message structure
    console.log("Full message object: ", JSON.stringify(message, null, 2));

    let shouldDelete = false;

    const linkPatterns = {
        whatsappGroup: /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/,
        whatsappChannel: /wa\.me\/channel\/[A-Za-z0-9]{20,}/,
        telegram: /t\.me\/[A-Za-z0-9_]+/,
        allLinks: /https?:\/\/[^\s]+/,
    };

    // Detect WhatsApp Group links
    if (antilinkSetting === 'whatsappGroup') {
        console.log('WhatsApp group link protection is enabled.');
        if (linkPatterns.whatsappGroup.test(userMessage)) {
            console.log('Detected a WhatsApp group link!');
            shouldDelete = true;
        }
    } else if (antilinkSetting === 'whatsappChannel' && linkPatterns.whatsappChannel.test(userMessage)) {
        shouldDelete = true;
    } else if (antilinkSetting === 'telegram' && linkPatterns.telegram.test(userMessage)) {
        shouldDelete = true;
    } else if (antilinkSetting === 'allLinks' && linkPatterns.allLinks.test(userMessage)) {
        shouldDelete = true;
    }

    if (shouldDelete) {
        const quotedMessageId = message.key.id; // Get the message ID to delete
        const quotedParticipant = message.key.participant || senderId; // Get the participant ID

        console.log(`Attempting to delete message with id: ${quotedMessageId} from participant: ${quotedParticipant}`);

        try {
            await sock.sendMessage(chatId, {
                delete: { remoteJid: chatId, fromMe: false, id: quotedMessageId, participant: quotedParticipant },
            });
            console.log(`Message with ID ${quotedMessageId} deleted successfully.`);
        } catch (error) {
            console.error('Failed to delete message:', error);
        }

        const mentionedJidList = [senderId];
        await sock.sendMessage(chatId, { text: `Warning! @${senderId.split('@')[0]}, posting links is not allowed.`, mentions: mentionedJidList });
    } else {
        console.log('No link detected or protection not enabled for this type of link.');
    }
}

module.exports = {
    handleAntilinkCommand,
    handleLinkDetection,
};
