const { isJidGroup } = require('@whiskeysockets/baileys');
const { getAntilink, incrementWarningCount, resetWarningCount, isSudo } = require('../lib/index');
const config = require('../config');
const isAdmin = require('../lib/isAdmin');

let ALLOWED_LINKS;
let BLOCKED_LINKS;
const WARN_COUNT = config.WARN_COUNT || 3;

/**
 * Checks if a string contains a URL.
*
* @param {string} str - The string to check.
* @returns {boolean} - True if the string contains a URL, otherwise false.
*/
async function containsURL(str) {
	if (!str || typeof str !== 'string') return false;

	const s = str.toLowerCase();

	// Rough URL matcher that finds urls with or without protocol
	const urlRegex = /((https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?)/ig;

	const matches = s.match(urlRegex);
	if (!matches) return false; // no URLs found

	if (antilinkConfig?.mode === 'whitelist') {

		// If any matched URL is NOT in the allowed list, flag it.
		for (const url of matches) {
			const isAllowed = ALLOWED_LINKS.some(allowed =>
				url.includes(allowed.toLowerCase())
			);
			if (!isAllowed) return true; // found a disallowed URL -> flag it
		}

		// All found URLs were allowed
		return false;
	}
	else {
		// In blacklist mode, if any matched URL is in the blocked list, flag it.
		for (const url of matches) {
			const isBlocked = BLOCKED_LINKS.some(blocked =>
				url.includes(blocked.toLowerCase())
			);
			if (isBlocked) return true; // found a blocked URL -> flag it
		}

		// None of the found URLs were blocked
		return false;
	}
}


/**
 * Handles the Antilink functionality for group chats.
 *
 * @param {object} msg - The message object to process.
 * @param {object} sock - The socket object to use for sending messages.
 */
async function Antilink(msg, sock) {
	const jid = msg.key.remoteJid;
	const antilinkConfig = await getAntilink(jid, 'on');
	ALLOWED_LINKS = antilinkConfig?.allowedLinks || [];
	BLOCKED_LINKS = antilinkConfig?.blockedLinks || [];

	if (!isJidGroup(jid)) return;

	const SenderMessage = msg.message?.conversation || 
						 msg.message?.extendedTextMessage?.text ||
						 msg.message?.imageMessage?.caption ||
						 msg.message?.videoMessage?.caption ||
						 msg.message?.documentMessage?.caption ||
						 '';
	if (!SenderMessage || typeof SenderMessage !== 'string') return;

	const sender = msg.key.participant;
	if (!sender) return;
	
	// Skip if sender is admin or bot itself
	let isSenderAdmin = false;
	let isBotAdmin = false;
	try {
		const adminStatus = await isAdmin(sock, jid, sender);
		isSenderAdmin = adminStatus.isSenderAdmin;
		isBotAdmin = adminStatus.isBotAdmin;
	} catch (error) {
		console.error('Error checking admin status:', error);
	}
	if (isSenderAdmin || msg.key.fromMe) return;

	// Ensure bot is admin before taking actions
	if (!isBotAdmin) {
		return;
	}

	if (!await containsURL(SenderMessage.trim())) return;

	if (!antilinkConfig) return;

	const action = antilinkConfig.action;
	
	try {
		// Delete message first
		await sock.sendMessage(jid, { delete: msg.key });

		switch (action) {
			case 'delete':
				await sock.sendMessage(jid, { 
					text: `\`\`\`@${sender.split('@')[0]} link are not allowed here\`\`\``,
					mentions: [sender] 
				});
				break;

			case 'kick':
				await sock.groupParticipantsUpdate(jid, [sender], 'remove');
				await sock.sendMessage(jid, {
					text: `\`\`\`@${sender.split('@')[0]} has been kicked for sending links\`\`\``,
					mentions: [sender]
				});
				break;

			case 'warn':
				const warningCount = await incrementWarningCount(jid, sender);
				if (warningCount >= WARN_COUNT) {
					await sock.groupParticipantsUpdate(jid, [sender], 'remove');
					await resetWarningCount(jid, sender);
					await sock.sendMessage(jid, {
						text: `\`\`\`@${sender.split('@')[0]} has been kicked after ${WARN_COUNT} warnings\`\`\``,
						mentions: [sender]
					});
				} else {
					await sock.sendMessage(jid, {
						text: `\`\`\`@${sender.split('@')[0]} warning ${warningCount}/${WARN_COUNT} for sending links\`\`\``,
						mentions: [sender]
					});
				}
				break;
		}
	} catch (error) {
		console.error('Error in Antilink:', error);
	}
}

module.exports = { Antilink };