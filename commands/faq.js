const { getFAQsForGroup, addFAQ, deleteFAQ, getFAQById, searchFAQs } = require('../lib/faqHelper');
const isAdmin = require('../lib/isAdmin');

async function faqCommand(sock, chatId, message, args, senderId) {
    try {
        const isGroup = chatId.endsWith('@g.us');
        const groupId = isGroup ? chatId : 'direct';
        
        // If no arguments, show all FAQs
        if (!args || args.length === 0) {
            await showAllFAQs(sock, chatId, groupId, message);
            return;
        }
        
        const subCommand = args[0].toLowerCase();
        
        // Handle different sub-commands
        switch (subCommand) {
            case 'add':
                await handleAddFAQ(sock, chatId, groupId, args.slice(1), senderId, message);
                break;
                
            case 'del':
                await handleDeleteFAQ(sock, chatId, groupId, args.slice(1), senderId, message);
                break;
                
            case 'search':
                await handleSearchFAQ(sock, chatId, groupId, args.slice(1), message);
                break;
                
            default:
                // Check if it's a number (FAQ ID)
                const faqId = parseInt(subCommand);
                if (!isNaN(faqId)) {
                    await showSpecificFAQ(sock, chatId, groupId, faqId, message);
                } else {
                    await showFAQHelp(sock, chatId, message);
                }
                break;
        }
        
    } catch (error) {
        console.error('Error in FAQ command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ An error occurred while processing the FAQ command.' 
        });
    }
}

async function showAllFAQs(sock, chatId, groupId, message) {
    const faqs = getFAQsForGroup(groupId);
    
    if (faqs.length === 0) {
        await sock.sendMessage(chatId, {
            text: `📋 *No FAQs Available*\n\n` +
                  `No FAQs have been added yet.\n` +
                  `Admins can add FAQs using: .faq add <question> | <answer>`
        }, { quoted: message });
        return;
    }

    let faqText = `   📋 *FREQUENTLY ASKED QUESTIONS*\n`;

    // Show first 5 FAQs with preview
    const displayFAQs = faqs.slice(0, 5);
    
    displayFAQs.forEach(faq => {
        const questionPreview = faq.question.length > 50 
            ? faq.question.substring(0, 50) + '...' 
            : faq.question;
        const answerPreview = faq.answer.length > 80 
            ? faq.answer.substring(0, 80) + '...' 
            : faq.answer;
            
        faqText += `🔹 *FAQ #${faq.id}*\n`;
        faqText += `❓ ${questionPreview}\n`;
        faqText += `💡 ${answerPreview}\n\n`;
    });
    
    if (faqs.length > 5) {
        faqText += `... and ${faqs.length - 5} more FAQs\n\n`;
    }
    
    faqText += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    faqText += `📖 Use .faq <number> for full details\n`;
    faqText += `🔍 Use .faq search <keyword> to find\n`;
    faqText += `➕ Admins: .faq add <question> | <answer>`;
    
    await sock.sendMessage(chatId, { text: faqText }, { quoted: message });
}

async function showSpecificFAQ(sock, chatId, groupId, faqId, message) {
    const faq = getFAQById(groupId, faqId);
    
    if (!faq) {
        await sock.sendMessage(chatId, {
            text: `❌ FAQ #${faqId} not found.\n\nUse .faq to see all available FAQs.`
        }, { quoted: message });
        return;
    }
    
    const faqText =
                   `   📋 *FAQ #${faq.id}*\n` +
                   `❓ *Question:*\n${faq.question}\n\n` +
                   `💡 *Answer:*\n${faq.answer}\n\n` +
                   `━━━━━━━━━━━━━━━━━━━━━━\n` +
                   `📅 Added: ${new Date(faq.createdAt).toLocaleDateString()}`;
    
    await sock.sendMessage(chatId, { text: faqText }, { quoted: message });
}

async function handleAddFAQ(sock, chatId, groupId, args, senderId, message) {
    const isGroup = chatId.endsWith('@g.us');
    
    // Check if user is admin (for groups) or if it's a direct message
    if (isGroup && !(await isAdmin(chatId, senderId, sock))) {
        await sock.sendMessage(chatId, {
            text: '❌ Only group admins can add FAQs.'
        }, { quoted: message });
        return;
    }
    
    const fullText = args.join(' ');
    const parts = fullText.split('|');
    
    if (parts.length !== 2) {
        await sock.sendMessage(chatId, {
            text: `❌ Invalid format.\n\n` +
                  `Use: .faq add <question> | <answer>\n\n` +
                  `Example: .faq add How to use bot? | Type .help to see all commands`
        }, { quoted: message });
        return;
    }
    
    const question = parts[0].trim();
    const answer = parts[1].trim();
    
    if (question.length < 5 || answer.length < 5) {
        await sock.sendMessage(chatId, {
            text: '❌ Question and answer must be at least 5 characters long.'
        }, { quoted: message });
        return;
    }
    
    const newFAQ = addFAQ(groupId, question, answer, senderId, false);
    
    if (newFAQ) {
        await sock.sendMessage(chatId, {
            text: `✅ FAQ #${newFAQ.id} added successfully!\n\n` +
                  `❓ ${question}\n` +
                  `💡 ${answer}`
        }, { quoted: message });
    } else {
        await sock.sendMessage(chatId, {
            text: '❌ Failed to add FAQ. Please try again.'
        }, { quoted: message });
    }
}

async function handleDeleteFAQ(sock, chatId, groupId, args, senderId, message) {
    const isGroup = chatId.endsWith('@g.us');
    
    // Check if user is admin
    if (isGroup && !(await isAdmin(chatId, senderId, sock))) {
        await sock.sendMessage(chatId, {
            text: '❌ Only group admins can delete FAQs.'
        }, { quoted: message });
        return;
    }
    
    const faqId = parseInt(args[0]);
    if (isNaN(faqId)) {
        await sock.sendMessage(chatId, {
            text: '❌ Please provide a valid FAQ ID.\n\nExample: .faq delete 1'
        }, { quoted: message });
        return;
    }
    
    const deletedFAQ = deleteFAQ(groupId, faqId);
    
    if (deletedFAQ) {
        await sock.sendMessage(chatId, {
            text: `✅ FAQ #${faqId} deleted successfully!\n\n` +
                  `Deleted: "${deletedFAQ.question}"`
        }, { quoted: message });
    } else {
        await sock.sendMessage(chatId, {
            text: `❌ FAQ #${faqId} not found.`
        }, { quoted: message });
    }
}

async function handleSearchFAQ(sock, chatId, groupId, args, message) {
    const keyword = args.join(' ').trim();
    
    if (keyword.length < 2) {
        await sock.sendMessage(chatId, {
            text: '❌ Search keyword must be at least 2 characters long.'
        }, { quoted: message });
        return;
    }
    
    const results = searchFAQs(groupId, keyword);
    
    if (results.length === 0) {
        await sock.sendMessage(chatId, {
            text: `🔍 No FAQs found for "${keyword}"\n\nTry different keywords or use .faq to see all FAQs.`
        }, { quoted: message });
        return;
    }
    
    let searchText = `🔍 *Search Results for "${keyword}"*\n\n`;
    
    results.slice(0, 3).forEach(faq => {
        const questionPreview = faq.question.length > 60 
            ? faq.question.substring(0, 60) + '...' 
            : faq.question;
        const answerPreview = faq.answer.length > 100 
            ? faq.answer.substring(0, 100) + '...' 
            : faq.answer;
            
        searchText += `🔹 *FAQ #${faq.id}*\n`;
        searchText += `❓ ${questionPreview}\n`;
        searchText += `💡 ${answerPreview}\n\n`;
    });
    
    if (results.length > 3) {
        searchText += `... and ${results.length - 3} more results\n\n`;
    }
    
    searchText += `Use .faq <number> for full details`;
    
    await sock.sendMessage(chatId, { text: searchText }, { quoted: message });
}

async function showFAQHelp(sock, chatId, message) {
    const helpText =
                    `   📋 *FAQ COMMANDS*\n` +
                    `📖 *.faq* - Show all FAQs\n` +
                    `🔍 *.faq search <keyword>* - Search FAQs\n` +
                    `📄 *.faq <number>* - View specific FAQ\n\n` +
                    `*Admin Commands:*\n` +
                    `➕ *.faq add <question> | <answer>*\n` +
                    `❌ *.faq delete <number>*\n\n` +
                    `Example: .faq add How to join? | Send a request to admins`;
    
    await sock.sendMessage(chatId, { text: helpText }, { quoted: message });
}

module.exports = faqCommand;
