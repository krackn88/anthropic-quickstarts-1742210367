// Access the Electron API exposed by preload.js
const electronAPI = window.electronAPI;

// DOM Elements
const modelSelect = document.getElementById('model-select');
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-btn');
const clearButton = document.getElementById('clear-btn');
const exportButton = document.getElementById('export-btn');
const copyButton = document.getElementById('copy-btn');
const settingsButton = document.getElementById('settings-btn');
const newChatButton = document.getElementById('new-chat-btn');
const attachButton = document.getElementById('attach-btn');
const updateButton = document.getElementById('update-btn');
const conversations = document.getElementById('conversations');
const settingsModal = document.getElementById('settings-modal');
const closeButtons = document.querySelectorAll('.close-btn');
const saveSettingsButton = document.getElementById('save-settings');
const anthropicKeyInput = document.getElementById('anthropic-key');
const openaiKeyInput = document.getElementById('openai-key');
const temperatureSlider = document.getElementById('temperature');
const temperatureValue = document.getElementById('temperature-value');
const maxTokensInput = document.getElementById('max-tokens');
const darkModeCheckbox = document.getElementById('dark-mode');
const autoSaveCheckbox = document.getElementById('auto-save');
const autoCompleteCheckbox = document.getElementById('auto-complete');
const intellisenseCheckbox = document.getElementById('intellisense');

// App state
const state = {
    conversations: [],
    currentConversationId: null,
    settings: {
        temperature: 0.7,
        maxTokens: 1000,
        darkMode: true,
        autoSave: true,
        autoComplete: true,
        intelliSense: true
    },
    isProcessing: false,
    credentials: {
        anthropicApiKey: '',
        openaiApiKey: ''
    }
};

// Initialize the application
async function init() {
    try {
        // Load credentials
        const credentials = await electronAPI.getCredentials();
        if (credentials) {
            state.credentials = credentials;
            if (credentials.anthropicApiKey) {
                anthropicKeyInput.value = '••••••••••••••••••••••••••'; // Masked for security
            }
            if (credentials.openaiApiKey) {
                openaiKeyInput.value = '••••••••••••••••••••••••••'; // Masked for security
            }
        }

        // Load settings
        const savedSettings = await electronAPI.getItem('settings');
        if (savedSettings) {
            Object.assign(state.settings, JSON.parse(savedSettings));
            updateSettingsUI();
        }

        // Load conversations
        const savedConversations = await electronAPI.getItem('conversations');
        if (savedConversations) {
            state.conversations = JSON.parse(savedConversations);
            updateConversationsList();
        } else {
            createNewConversation();
        }

        // Set up auto-updater event listeners
        setupAutoUpdater();

        // Show welcome message
        if (chatContainer.children.length === 0) {
            showWelcomeMessage();
        }
    } catch (error) {
        showError(`Error initializing app: ${error.message}`);
    }
}

// Update settings UI based on state
function updateSettingsUI() {
    temperatureSlider.value = state.settings.temperature;
    temperatureValue.textContent = state.settings.temperature;
    maxTokensInput.value = state.settings.maxTokens;
    darkModeCheckbox.checked = state.settings.darkMode;
    autoSaveCheckbox.checked = state.settings.autoSave;
    autoCompleteCheckbox.checked = state.settings.autoComplete;
    intellisenseCheckbox.checked = state.settings.intelliSense;
    
    // Apply dark mode
    if (state.settings.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// Show welcome message in chat
function showWelcomeMessage() {
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'message ai-message';
    welcomeMessage.innerHTML = `
        <p>Welcome to Cline Professional! I'm ready to assist you with:</p>
        <ul style="margin-left: 20px; margin-top: 10px;">
            <li>💻 Code Completion and Explanations</li>
            <li>🔍 Problem Solving and Debugging</li>
            <li>📝 Technical Documentation</li>
            <li>🧪 Test Case Generation</li>
        </ul>
        <p style="margin-top: 10px;">How can I help you today?</p>
        <div class="message-time">Today, ${formatTime(new Date())}</div>
    `;
    chatContainer.appendChild(welcomeMessage);
}

// Format time for messages
function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Create a new conversation
function createNewConversation() {
    const newConversation = {
        id: Date.now().toString(),
        title: 'New Chat',
        messages: [],
        model: modelSelect.value,
        createdAt: new Date().toISOString()
    };
    
    state.conversations.push(newConversation);
    state.currentConversationId = newConversation.id;
    
    updateConversationsList();
    saveConversations();
    clearChat();
}

// Update the conversations list in the sidebar
function updateConversationsList() {
    conversations.innerHTML = '';
    
    state.conversations.forEach(conversation => {
        const li = document.createElement('li');
        li.textContent = conversation.title;
        li.dataset.id = conversation.id;
        
        if (conversation.id === state.currentConversationId) {
            li.classList.add('selected');
        }
        
        li.addEventListener('click', () => {
            switchConversation(conversation.id);
        });
        
        conversations.appendChild(li);
    });
}

// Switch to a different conversation
function switchConversation(conversationId) {
    state.currentConversationId = conversationId;
    updateConversationsList();
    
    const conversation = state.conversations.find(c => c.id === conversationId);
    if (conversation) {
        displayConversation(conversation);
        modelSelect.value = conversation.model || 'claude-3-opus';
    }
}

// Display a conversation in the chat container
function displayConversation(conversation) {
    clearChat();
    
    conversation.messages.forEach(message => {
        const messageElement = createMessageElement(message);
        chatContainer.appendChild(messageElement);
    });
    
    // Scroll to the bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Create a message element
function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.role === 'user' ? 'user-message' : 'ai-message'}`;
    
    // Process message content to handle code blocks
    const formattedContent = formatMessageContent(message.content);
    messageDiv.innerHTML = formattedContent;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = formatTime(new Date(message.timestamp));
    messageDiv.appendChild(timeDiv);
    
    return messageDiv;
}

// Format message content to handle markdown-like syntax
function formatMessageContent(content) {
    if (!content) return '';
    
    // Handle code blocks with language specification
    let formattedContent = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
        const lang = language || 'plaintext';
        return `<div class="code-header">${lang}</div><div class="code-block"><button class="copy-code">Copy</button><code>${escapeHtml(code)}</code></div>`;
    });
    
    // Handle inline code
    formattedContent = formattedContent.replace(/`([^`]+)`/g, '<code style="background-color: #2d2d2d; padding: 2px 4px; border-radius: 3px;">$1</code>');
    
    // Handle line breaks
    formattedContent = formattedContent.replace(/\n/g, '<br>');
    
    return formattedContent;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Clear the chat container
function clearChat() {
    chatContainer.innerHTML = '';
    // Add a welcome message to the empty chat
    showWelcomeMessage();
}

// Send a message
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message || state.isProcessing) return;
    
    // Find current conversation
    const conversation = state.conversations.find(c => c.id === state.currentConversationId);
    if (!conversation) return;
    
    // Add user message to UI
    const userMessageElement = document.createElement('div');
    userMessageElement.className = 'message user-message';
    userMessageElement.innerHTML = formatMessageContent(message);
    
    const userTimeDiv = document.createElement('div');
    userTimeDiv.className = 'message-time';
    userTimeDiv.textContent = formatTime(new Date());
    userMessageElement.appendChild(userTimeDiv);
    
    chatContainer.appendChild(userMessageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Clear input
    userInput.value = '';
    
    // Add user message to conversation
    const userMessageObj = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
    };
    conversation.messages.push(userMessageObj);
    
    // Update conversation title if it's the first message
    if (conversation.messages.filter(m => m.role === 'user').length === 1) {
        conversation.title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
        updateConversationsList();
    }
    
    // Save conversations
    saveConversations();
    
    // Show loading indicator
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading';
    loadingElement.innerHTML = `
        <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    chatContainer.appendChild(loadingElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    state.isProcessing = true;
    
    try {
        // Get the selected model
        const model = modelSelect.value;
        
        // Get API key based on model
        let apiKey = '';
        let apiType = '';
        
        if (model.startsWith('claude')) {
            apiKey = state.credentials.anthropicApiKey;
            apiType = 'anthropic';
        } else if (model.startsWith('gpt')) {
            apiKey = state.credentials.openaiApiKey;
            apiType = 'openai';
        } else {
            apiKey = state.credentials.anthropicApiKey; // Default to Anthropic
            apiType = 'anthropic';
        }
        
        if (!apiKey) {
            // Remove loading indicator
            chatContainer.removeChild(loadingElement);
            state.isProcessing = false;
            
            // Show error and prompt for API key
            showError(`Please set your ${apiType.toUpperCase()} API key in Settings`);
            settingsModal.classList.add('active');
            return;
        }
        
        // Make API request
        const response = await generateCompletion(message, model, apiKey, apiType);
        
        // Remove loading indicator
        chatContainer.removeChild(loadingElement);
        
        // Add AI response to UI
        const aiMessageElement = document.createElement('div');
        aiMessageElement.className = 'message ai-message';
        aiMessageElement.innerHTML = formatMessageContent(response);
        
        const aiTimeDiv = document.createElement('div');
        aiTimeDiv.className = 'message-time';
        aiTimeDiv.textContent = formatTime(new Date());
        aiMessageElement.appendChild(aiTimeDiv);
        
        chatContainer.appendChild(aiMessageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Add AI message to conversation
        const aiMessageObj = {
            role: 'assistant',
            content: response,
            timestamp: new Date().toISOString(),
            model: model
        };
        conversation.messages.push(aiMessageObj);
        
        // Save conversations
        saveConversations();
    } catch (error) {
        // Remove loading indicator
        chatContainer.removeChild(loadingElement);
        showError(`Error generating response: ${error.message}`);
    }
    
    state.isProcessing = false;
}

// Generate completion using API
async function generateCompletion(prompt, model, apiKey, apiType) {
    // In a real implementation, this would make an API call to the selected model
    // For now, let's simulate a response
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulated response
            if (prompt.toLowerCase().includes('hello') || prompt.toLowerCase().includes('hi')) {
                resolve("Hello! I'm Cline Professional, your AI assistant. How can I help you today?");
            } else if (prompt.toLowerCase().includes('help')) {
                resolve("I can assist you with various tasks, including:\n\n1. Writing and explaining code\n2. Debugging issues\n3. Answering programming questions\n4. Generating documentation\n5. Optimizing algorithms\n\nJust let me know what you need help with!");
            } else if (prompt.toLowerCase().includes('code') || prompt.toLowerCase().includes('function')) {
                resolve("Here's an example function that demonstrates what you asked for:\n\n```python\ndef calculate_statistics(numbers):\n    \"\"\"Calculate basic statistics for a list of numbers.\"\"\"\n    if not numbers:\n        return None\n        \n    n = len(numbers)\n    mean = sum(numbers) / n\n    variance = sum((x - mean) ** 2 for x in numbers) / n\n    std_dev = variance ** 0.5\n    min_val = min(numbers)\n    max_val = max(numbers)\n    \n    return {\n        'mean': mean,\n        'std_dev': std_dev,\n        'min': min_val,\n        'max': max_val,\n        'count': n\n    }\n```\n\nThis function takes a list of numbers and returns a dictionary with basic statistical measures. You can use it like this:\n\n```python\nresult = calculate_statistics([1, 2, 3, 4, 5])\nprint(result['mean'])  # Output: 3.0\n```");
            } else {
                resolve("I understand you're asking about " + prompt.substring(0, 20) + "...\n\nTo provide a comprehensive answer, I'd need to know a bit more about your specific needs. Could you provide additional details or clarify what aspect you're most interested in?");
            }
        }, 1500); // Simulated delay
    });
}

// Show error notification
function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'notification-banner';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('active');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

// Save conversations to storage
function saveConversations() {
    if (state.settings.autoSave) {
        electronAPI.setItem('conversations', JSON.stringify(state.conversations));
    }
}

// Setup auto-updater
function setupAutoUpdater() {
    electronAPI.onUpdateAvailable(() => {
        updateButton.textContent = 'Update Available';
        updateButton.classList.remove('hidden');
    });
    
    electronAPI.onUpdateDownloaded(() => {
        updateButton.textContent = 'Install Update';
    });
    
    updateButton.addEventListener('click', () => {
        electronAPI.installUpdate();
    });
}

// Event Listeners
sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

clearButton.addEventListener('click', () => {
    const conversation = state.conversations.find(c => c.id === state.currentConversationId);
    if (conversation) {
        // Clear messages but keep the first AI welcome message
        conversation.messages = [];
        saveConversations();
        clearChat();
    }
});

modelSelect.addEventListener('change', () => {
    const model = modelSelect.value;
    const conversation = state.conversations.find(c => c.id === state.currentConversationId);
    if (conversation) {
        conversation.model = model;
        saveConversations();
    }
});

newChatButton.addEventListener('click', createNewConversation);

settingsButton.addEventListener('click', () => {
    settingsModal.classList.add('active');
});

closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });
});

saveSettingsButton.addEventListener('click', async () => {
    // Save settings
    state.settings.temperature = parseFloat(temperatureSlider.value);
    state.settings.maxTokens = parseInt(maxTokensInput.value);
    state.settings.darkMode = darkModeCheckbox.checked;
    state.settings.autoSave = autoSaveCheckbox.checked;
    state.settings.autoComplete = autoCompleteCheckbox.checked;
    state.settings.intelliSense = intellisenseCheckbox.checked;
    
    // Save credentials if changed (not masked)
    if (anthropicKeyInput.value && !anthropicKeyInput.value.includes('•')) {
        await electronAPI.updateCredential('anthropicApiKey', anthropicKeyInput.value);
        state.credentials.anthropicApiKey = anthropicKeyInput.value;
        anthropicKeyInput.value = '••••••••••••••••••••••••••';
    }
    
    if (openaiKeyInput.value && !openaiKeyInput.value.includes('•')) {
        await electronAPI.updateCredential('openaiApiKey', openaiKeyInput.value);
        state.credentials.openaiApiKey = openaiKeyInput.value;
        openaiKeyInput.value = '••••••••••••••••••••••••••';
    }
    
    // Save settings to storage
    await electronAPI.setItem('settings', JSON.stringify(state.settings));
    
    // Update UI based on settings
    updateSettingsUI();
    
    // Close modal
    settingsModal.classList.remove('active');
});

temperatureSlider.addEventListener('input', () => {
    temperatureValue.textContent = temperatureSlider.value;
});

exportButton.addEventListener('click', () => {
    const conversation = state.conversations.find(c => c.id === state.currentConversationId);
    if (conversation) {
        const exportData = {
            title: conversation.title,
            model: conversation.model,
            messages: conversation.messages,
            exported_at: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        electronAPI.saveFile(dataStr, conversation.title, 'json');
    }
});

copyButton.addEventListener('click', () => {
    const conversation = state.conversations.find(c => c.id === state.currentConversationId);
    if (conversation && conversation.messages.length) {
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        if (lastMessage.role === 'assistant') {
            navigator.clipboard.writeText(lastMessage.content);
            showNotification('Response copied to clipboard');
        }
    }
});

attachButton.addEventListener('click', () => {
    electronAPI.openFile().then(filePath => {
        if (filePath) {
            electronAPI.readFile(filePath).then(content => {
                const fileName = filePath.split('/').pop();
                userInput.value += `\n\nAttached file ${fileName}:\n\`\`\`\n${content}\n\`\`\`\n`;
            });
        }
    });
});

// Document event listener for copy code buttons
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('copy-code')) {
        const codeBlock = e.target.nextElementSibling;
        if (codeBlock) {
            navigator.clipboard.writeText(codeBlock.textContent);
            showNotification('Code copied to clipboard');
        }
    }
});

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification-banner';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('active');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Initialize the app
init();
