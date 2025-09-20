const fs = require('fs');
const path = require('path');

const FAQ_PATH = path.join(__dirname, '../data/faq.json');

// Load FAQ data from file
function loadFAQData() {
    try {
        if (!fs.existsSync(FAQ_PATH)) {
            // Create default structure if file doesn't exist
            const defaultData = {
                globalFAQs: [],
                groupFAQs: {},
                nextId: 1
            };
            fs.writeFileSync(FAQ_PATH, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        const data = fs.readFileSync(FAQ_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading FAQ data:', error);
        return {
            globalFAQs: [],
            groupFAQs: {},
            nextId: 1
        };
    }
}

// Save FAQ data to file
function saveFAQData(data) {
    try {
        fs.writeFileSync(FAQ_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving FAQ data:', error);
        return false;
    }
}

// Get all FAQs for a specific group (combines global + group-specific)
function getFAQsForGroup(groupId) {
    const data = loadFAQData();
    const globalFAQs = data.globalFAQs || [];
    const groupFAQs = data.groupFAQs[groupId] || [];
    
    return [...globalFAQs, ...groupFAQs];
}

// Add new FAQ
function addFAQ(groupId, question, answer, addedBy, isGlobal = false) {
    const data = loadFAQData();
    
    const newFAQ = {
        id: data.nextId,
        question: question.trim(),
        answer: answer.trim(),
        addedBy: addedBy,
        createdAt: new Date().toISOString(),
        isGlobal: isGlobal
    };
    
    if (isGlobal) {
        data.globalFAQs.push(newFAQ);
    } else {
        if (!data.groupFAQs[groupId]) {
            data.groupFAQs[groupId] = [];
        }
        data.groupFAQs[groupId].push(newFAQ);
    }
    
    data.nextId += 1;
    
    if (saveFAQData(data)) {
        return newFAQ;
    }
    return null;
}

// Delete FAQ by ID
function deleteFAQ(groupId, faqId) {
    const data = loadFAQData();
    
    // Try to find and delete from global FAQs
    const globalIndex = data.globalFAQs.findIndex(faq => faq.id === faqId);
    if (globalIndex !== -1) {
        const deletedFAQ = data.globalFAQs.splice(globalIndex, 1)[0];
        saveFAQData(data);
        return deletedFAQ;
    }
    
    // Try to find and delete from group FAQs
    if (data.groupFAQs[groupId]) {
        const groupIndex = data.groupFAQs[groupId].findIndex(faq => faq.id === faqId);
        if (groupIndex !== -1) {
            const deletedFAQ = data.groupFAQs[groupId].splice(groupIndex, 1)[0];
            saveFAQData(data);
            return deletedFAQ;
        }
    }
    
    return null;
}

// Get specific FAQ by ID
function getFAQById(groupId, faqId) {
    const faqs = getFAQsForGroup(groupId);
    return faqs.find(faq => faq.id === faqId) || null;
}

// Search FAQs by keyword
function searchFAQs(groupId, keyword) {
    const faqs = getFAQsForGroup(groupId);
    const searchTerm = keyword.toLowerCase();
    
    return faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchTerm) || 
        faq.answer.toLowerCase().includes(searchTerm)
    );
}

module.exports = {
    loadFAQData,
    saveFAQData,
    getFAQsForGroup,
    addFAQ,
    deleteFAQ,
    getFAQById,
    searchFAQs
};