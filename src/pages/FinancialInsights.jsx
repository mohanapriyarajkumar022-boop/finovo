import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// --- ANIMATIONS ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- STYLED COMPONENTS ---
const InsightsWrapper = styled.div`
  /* Changed background to white for a light theme */
  background: #ffffff; 
  border-radius: 20px;
  padding: 28px;
  /* Adjusted border for a light theme */
  border: 1px solid #e0e0e0; 
  animation: ${fadeIn} 0.5s ease-out;
  display: flex;
  flex-direction: column;
  max-height: 500px; /* Or any height you prefer */
  overflow-y: auto; /* Adds a scrollbar only when needed */
`;

const Header = styled.h3`
  margin: 0 0 20px 0;
  font-size: 1.5rem;
  font-weight: 600;
  /* Changed text color to black */
  color: #000000; 
  display: flex;
  align-items: center;
  gap: 12px;

  &::before {
    content: '💡';
    font-size: 1.5rem;
  }
`;

const InsightList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InsightItem = styled.li`
  /* Adjusted background for contrast on a white page */
  background: #f7f9fc;
  padding: 16px 20px;
  border-radius: 12px;
  /* Changed text color to a dark grey for readability */
  color: #333333; 
  font-size: 1rem;
  line-height: 1.6;
  white-space: pre-wrap; /* Ensures the response formatting is respected */
  border-left: 3px solid #667eea;
  transition: all 0.3s ease;

  &:hover {
    /* Adjusted hover background */
    background: #f0f4f9; 
    transform: translateX(4px);
  }
`;

const FallbackMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
  /* Changed text color to a visible grey */
  color: #555555; 
  font-style: italic;
`;

const ErrorMessage = styled(FallbackMessage)`
  /* Changed error text color to a dark red for visibility */
  color: #d32f2f; 
  font-style: normal;
`;


const FinancialInsights = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const DEEPSEEK_API_KEY = 'sk-645ae8a4fdde4705afb9e0688ddbfb5a'; // Your API Key

    // This is where you would fetch real data from your backend.
    // For this example, we'll use static data that matches your schemas.
    const todaysData = {
      incomes: [
        { source: 'Freelance Project', amount: 10000, gst: 1800 },
        { source: 'Consulting Fee', amount: 7000, gst: 1260 },
      ],
      expenses: [
        { title: 'Team Lunch', amount: 2000, gst: 360 },
        { title: 'Software Subscription', amount: 500, gst: 90 },
      ],
    };

    const fetchInsights = async () => {
      setLoading(true);
      setError(null);

      // Constructing the prompt for the AI based on your requirements
      const prompt = `
        Analyze today’s income and expenditure data. For each transaction, identify whether it is an income or an expense and describe it naturally in a single paragraph. Clearly mention what the user spent or earned, including both the base amount and GST separately. For example: “Today you spent ₹1,200 for a chain (₹1,000 + ₹200 GST) and received ₹5,000 from an office payment.” 
        
        After analyzing all transactions, calculate and summarize the total income, total expenditure, total GST for both income and expenses, and the overall net balance. 
        
        Based on this analysis, generate a personalized AI suggestion — such as recognizing savings, warning about overspending, or appreciating financial balance. The tone should be friendly, insightful, and sound like a smart finance assistant offering advice and encouragement.

        Here is the data:
        Incomes: ${JSON.stringify(todaysData.incomes)}
        Expenses: ${JSON.stringify(todaysData.expenses)}
      `;

      try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: 'You are a smart finance assistant.' },
              { role: 'user', content: prompt },
            ],
            max_tokens: 500,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const insightText = data.choices[0]?.message?.content.trim();

        if (insightText) {
          // The API returns a single block of text. We wrap it in an array to map over it.
          setInsights([insightText]);
        } else {
          setInsights([]);
        }

      } catch (err) {
        console.error("Failed to fetch financial insights:", err);
        setError("Sorry, I couldn't generate insights right now. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  const renderContent = () => {
    if (loading) {
      return <FallbackMessage>Generating your smart insights...</FallbackMessage>;
    }
    if (error) {
      return <ErrorMessage>{error}</ErrorMessage>;
    }
    if (insights.length > 0) {
      return (
        <InsightList>
          {insights.map((insight, index) => (
            <InsightItem key={index}>{insight}</InsightItem>
          ))}
        </InsightList>
      );
    }
    return <FallbackMessage>No new insights available right now. Check back later!</FallbackMessage>;
  };

  return (
    <InsightsWrapper>
      <Header>Financial Insights</Header>
      {renderContent()}
    </InsightsWrapper>
  );
};

export default FinancialInsights;