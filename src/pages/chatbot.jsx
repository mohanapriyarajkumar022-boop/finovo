//src/pages/chatbot.jsx
import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, ThemeProvider } from 'styled-components';

// --- Your theme and styled components (no changes needed) ---
const theme = {
  colors: { primary: '#007bff', secondary: '#f1f1f1', background: '#ffffff', text: '#333', userMessage: '#007bff', assistantMessage: '#e9e9eb' },
  fonts: { main: 'Arial, sans-serif' },
  spacing: { small: '8px', medium: '16px' },
  borderRadius: '20px',
};
const ChatbotContainer = styled.div` position: fixed; bottom: 20px; right: 20px; width: 400px; height: 550px; border-radius: 15px; background-color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; flex-direction: column; z-index: 1000; font-family: ${({ theme }) }) => theme.fonts.main};`;
const Header = styled.div` padding: ${({ theme }) => theme.spacing.medium}; background-color: ${({ theme }) => theme.colors.secondary}; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center; border-top-left-radius: 15px; border-top-right-radius: 15px;`;
const CloseButton = styled.button` cursor: pointer; background: transparent; border: none; font-size: 24px; color: #888; `;
const MessagesContainer = styled.div` flex-grow: 1; padding: ${({ theme }) => theme.spacing.medium}; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; `;
const Message = styled.div` padding: 10px 15px; border-radius: ${({ theme }) => theme.borderRadius}; max-width: 80%; line-height: 1.4; word-break: break-word;`;
const UserMessage = styled(Message)` background-color: ${({ theme }) => theme.colors.userMessage}; color: white; align-self: flex-end; `;
const AssistantMessage = styled(Message)` background-color: ${({ theme }) => theme.colors.assistantMessage}; color: black; align-self: flex-start; `;
const typing = keyframes`0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; }`;
const LoadingDots = styled.div` display: flex; align-items: center; gap: 5px; span { height: 8px; width: 8px; background-color: #aaa; border-radius: 50%; animation: ${typing} 1s infinite; } span:nth-child(2) { animation-delay: 0.2s; } span:nth-child(3) { animation-delay: 0.4s; }`;
const InputContainer = styled.form` display: flex; padding: ${({ theme }) => theme.spacing.medium}; border-top: 1px solid #ddd; `;
const Input = styled.input` flex-grow: 1; border: 1px solid #ccc; border-radius: ${({ theme }) => theme.borderRadius}; padding: 12px; margin-right: 10px; font-size: 16px; `;
const SendButton = styled.button` border: none; background-color: ${({ theme }) => theme.colors.primary}; color: white; border-radius: 50%; width: 48px; height: 48px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 24px; transition: background-color 0.2s; &:disabled { background-color: #a0a0a0; } `;


const Chatbot = ({ closeChatbot }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! How can I help you with your business data today?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const newUserMessage = { role: 'user', content: userInput };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      console.log('🔍 Sending request with credentials:', document.cookie);

      // --- MODIFIED CODE ---
      // The URL is now a relative path to use the proxy.
      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // This is still necessary
        body: JSON.stringify({ messages: newMessages }),
      });
      // --- END MODIFIED CODE ---

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error('Network response was not ok.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

        for (const line of lines) {
          const data = line.replace(/^data: /, '');
          if (data === '[DONE]') break;
          const parsed = JSON.parse(data);
          assistantResponse += parsed.choices[0]?.delta?.content || '';

          setMessages(prev => {
            const updatedMessages = [...prev];
            updatedMessages[updatedMessages.length - 1].content = assistantResponse;
            return updatedMessages;
          });
        }
      }

    } catch (error) {
      console.error('Error fetching from backend chatbot endpoint:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <ChatbotContainer>
        <Header>
          <h4>Chatbot Assistant</h4>
          <CloseButton onClick={closeChatbot}>&times;</CloseButton>
        </Header>
        <MessagesContainer>
          {messages.map((msg, index) =>
            msg.role === 'user' ? (
              <UserMessage key={index}>{msg.content}</UserMessage>
            ) : (
              <AssistantMessage key={index}>{msg.content}</AssistantMessage>
            )
          )}
          {isLoading && !messages[messages.length - 1].content && (
             <AssistantMessage><LoadingDots><span/><span/><span/></LoadingDots></AssistantMessage>
          )}
          <div ref={messagesEndRef} />
        </MessagesContainer>
        <InputContainer onSubmit={handleSendMessage}>
          <Input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type a message..."
            disabled={isLoading}
          />
          <SendButton type="submit" disabled={isLoading || !userInput.trim()}>
            &#10148;
          </SendButton>
        </InputContainer>
      </ChatbotContainer>
    </ThemeProvider>
  );
};

export default Chatbot;