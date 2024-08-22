let conversationHistory = [];

// Load existing conversation from localStorage
window.onload = function () {
    const savedConversation = localStorage.getItem('chatbotConversation'); // Changed to localStorage
    if (savedConversation) {
        conversationHistory = JSON.parse(savedConversation);
        conversationHistory.forEach(entry => displayMessage(entry.sender, entry.message));
    }
    document.getElementById('aa-chatbot-window').style.display = 'none'; // Ensure the window is hidden by default
};

document.getElementById('aa-user-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevents the default newline behavior
        sendMessage();
    }
});

async function sendMessage() {
    const userInput = document.getElementById('aa-user-input').value.trim();
    if (!userInput) return;

    displayMessage('You', userInput);
    document.getElementById('aa-user-input').value = '';

    // Store user message in conversation history
    conversationHistory.push({ sender: 'You', message: userInput });

    // Save updated conversation to localStorage
    localStorage.setItem('chatbotConversation', JSON.stringify(conversationHistory)); // Changed to localStorage

    const response = await getResponse(userInput);
    displayMessage('Bot', response);

    // Store bot response in conversation history
    conversationHistory.push({ sender: 'Bot', message: response });

    // Save updated conversation to localStorage
    localStorage.setItem('chatbotConversation', JSON.stringify(conversationHistory)); // Changed to localStorage
}

function displayMessage(sender, message) {
    const chatbox = document.getElementById('aa-chatbox');
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;
}

async function getResponse(prompt) {
    try {
        const response = await fetch('/.netlify/functions/fetch-openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: formatPromptWithHistory(prompt) })
        });

        const data = await response.json();

        if (data.message) {
            return data.message;
        } else {
            console.error("Unexpected response:", data);
            return "Sorry, I couldn't generate a response. Please try again.";
        }
    } catch (error) {
        console.error("Error fetching response:", error);
        return "There was an error processing your request. Please check the console for more details.";
    }
}

function formatPromptWithHistory(userInput) {
    // Create a prompt that includes the conversation history
    const formattedHistory = conversationHistory.map(entry => `${entry.sender}: ${entry.message}`).join('\n');
    return `${formattedHistory}\nYou: ${userInput}`;
}
