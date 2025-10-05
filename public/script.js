document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const submitButton = chatForm.querySelector('button[type="submit"]');

    // This array will hold the conversation history for the API
    const conversationHistory = [];

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent the default form submission

        const userMessage = userInput.value.trim();
        if (!userMessage) {
            return; // Don't send empty messages
        }

        // Disable form while processing
        userInput.disabled = true;
        submitButton.disabled = true;

        // 1. Add the user's message to the chat box
        addMessageToChatBox('user', userMessage);
        conversationHistory.push({ role: 'user', content: userMessage });
        userInput.value = ''; // Clear the input field

        // 2. Show a temporary "Thinking..." bot message
        const thinkingMessageElement = addMessageToChatBox('bot', 'Thinking...', 'thinking');

        try {
            // 3. Send the user's message to the backend API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // Send the whole conversation history
                    messages: conversationHistory
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                // 4b. Handle server-side errors
                const errorMessage = errorData?.error || 'Failed to get response from server.';
                updateBotMessage(thinkingMessageElement, errorMessage, true);
                // Remove the last user message from history if the API call failed
                conversationHistory.pop();
                return;
            }

            const data = await response.json();

            // 4a. Replace "Thinking..." with the AI's reply
            if (data && data.result) {
                updateBotMessage(thinkingMessageElement, data.result);
                // Add the successful AI response to the history
                conversationHistory.push({ role: 'model', content: data.result });
            } else {
                // Handle cases where the response is ok, but no result is found
                updateBotMessage(thinkingMessageElement, 'Sorry, no response was received.', true);
                // Remove the last user message from history as there was no valid response
                conversationHistory.pop();
            }

        } catch (error) {
            console.error('Error:', error);
            // 4b. Handle network or other client-side errors
            updateBotMessage(thinkingMessageElement, 'Sorry, an error occurred while connecting to the server.', true);
            // Remove the last user message from history if the API call failed
            conversationHistory.pop();
        } finally {
            // Re-enable form after processing
            userInput.disabled = false;
            submitButton.disabled = false;
            userInput.focus();
        }
    });

    /**
     * Adds a message to the chat box.
     * @param {'user' | 'bot'} role - The role of the message sender.
     * @param {string} text - The message content.
     * @returns {HTMLElement} The created message element.
     */
    function addMessageToChatBox(role, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${role}-message`); // e.g., 'user-message' or 'bot-message'
        messageElement.textContent = text;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the bottom
        return messageElement;
    }

    function updateBotMessage(element, newText, isError = false) {
        element.textContent = newText;
        if (isError) {
            element.classList.add('error-message');
        }
    }
});

