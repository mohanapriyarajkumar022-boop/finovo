import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../config/api';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import styled, { keyframes } from 'styled-components';
import { useLanguage } from '../context/LanguageContext';

// --- IMPORT YOUR INSIGHTS AND SCHEMES COMPONENTS ---
import FinancialInsights from '../pages/FinancialInsights';
import Schemes from '../pages/Schemes'; 

import Chatbot from './chatbot.jsx';
import AISuggestions from '../pages/AISuggestions';
import MarketNews from './MarketNews.jsx';

// Import AuthService
import authService from '../services/authService';

ChartJS.register(ArcElement, Tooltip, Legend);

// --- ANIMATIONS ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
`;

// --- STYLED COMPONENTS (Existing) ---
const PageWrapper = styled.div`
  background: #ffffff; /* Changed background to white */
  color: #1a1f3a; /* Changed text color for readability */
  padding: 32px;
  min-height: 100vh;
  font-family: 'Inter', 'Segoe UI', 'Roboto', sans-serif;
  position: relative;
  overflow-x: hidden;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
  animation: ${fadeIn} 0.6s ease-out;
`;

const Header = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -1px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 60px;
    height: 4px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    border-radius: 2px;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 16px;
`;

const StyledButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 14px 28px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
  position: relative;
  z-index: 1;
`;

const AISuggestionsWidget = styled.div`
  grid-column: span 12;
  margin-bottom: 24px;
  animation: ${fadeIn} 0.8s ease-out;
`;

const ChatbotToggleButton = styled.button`
  position: fixed;
  bottom: 32px;
  right: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 70px;
  height: 70px;
  font-size: 28px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  animation: ${float} 3s ease-in-out infinite;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

// --- STYLED COMPONENTS FOR POPUP ---
const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: ${fadeIn} 0.3s ease-out;
`;

const PopupWrapper = styled.div`
  width: 90%;
  max-width: 600px;
  background: #ffffff; /* Changed popup background to white */
  color: #1a1f3a; /* Added text color for content inside popup */
  border-radius: 20px;
  border: 1px solid #e0e0e0; /* Changed border color to be visible */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); /* Adjusted shadow for light background */
  padding: 24px;
  animation: ${fadeIn} 0.4s ease-out;
`;

const PopupHeader = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
`;

const CloseButton = styled.button`
  background: #f0f0f0; /* Changed background for visibility */
  color: #333333; /* Changed icon color for visibility */
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #e0e0e0; /* Adjusted hover background */
    transform: rotate(90deg);
  }
`;

// --- DASHBOARD COMPONENT ---
const Dashboardpage = () => {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState([]);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [balance, setBalance] = useState(0);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isMarketNewsOpen, setMarketNewsOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  
  // --- STATE FOR THE SCHEMES POPUP ---
  const [isSchemesOpen, setIsSchemesOpen] = useState(false);
  
  const fetchData = async () => {
    try {
      // Validate authentication first
      if (!authService.isAuthenticated()) {
        console.warn('🔒 Dashboard: User not authenticated, skipping data fetch');
        return;
      }
      
      const tenantId = authService.getTenantId();
      console.log('📊 Dashboard: Fetching transactions for tenantId:', tenantId, 'from', `${API_BASE}/api/transactions`);
      
      if (!tenantId) {
        console.error('❌ Dashboard: No tenant ID available');
        return;
      }
      
      // Use AuthService to get proper auth headers
      const config = { 
        headers: authService.getAuthHeaders(),
        withCredentials: true 
      };

      const response = await axios.get(`${API_BASE}/api/transactions`, config);
      
      console.log('✅ Dashboard: API Response received:', response.status);
      console.log('📋 Dashboard: Full response:', response.data);
      
      // Backend returns { success: true, data: [...] } or { data: [...] }
      const fetchedTransactions = Array.isArray(response.data.data) ? response.data.data : (response.data.transactions || response.data.data || []);
      
      console.log('✅ Dashboard: Fetched', fetchedTransactions.length, 'transactions from MongoDB');
      
      setTransactions(fetchedTransactions);

      const incomeTotal = fetchedTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expenseTotal = fetchedTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

      setIncome(incomeTotal);
      setExpense(expenseTotal);
      setBalance(incomeTotal - expenseTotal);
    } catch (error) {
      // Log full axios error details for debugging
      console.error("Failed to fetch dashboard data:", error);
      if (error.response) {
        console.error('Axios response status:', error.response.status);
        console.error('Axios response data:', error.response.data);
        console.error('Axios response headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received, request made was:', error.request);
      } else {
        console.error('Axios config error:', error.message);
      }
      
      // Handle token expiration
      if (error.response?.status === 401) {
        console.warn('🔒 Token expired or invalid, logging out');
        authService.logout();
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deleteTransaction = async (id) => {
    try {
      // Validate authentication first
      if (!authService.isAuthenticated()) {
        console.warn('🔒 Dashboard: User not authenticated, cannot delete transaction');
        return;
      }
      
      const config = { 
        headers: authService.getAuthHeaders(),
        withCredentials: true 
      };
      await axios.delete(`${API_BASE}/api/transactions/${id}`, config);
      fetchData();
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      
      // Handle token expiration
      if (error.response?.status === 401) {
        console.warn('🔒 Token expired or invalid, logging out');
        authService.logout();
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
  };

  const toggleChatbot = () => setIsChatbotOpen(!isChatbotOpen);
  const toggleMarketNews = () => setMarketNewsOpen(!isMarketNewsOpen);
  const toggleInsights = () => setIsInsightsOpen(!isInsightsOpen);

  // --- HANDLER TO TOGGLE THE SCHEMES POPUP ---
  const toggleSchemes = () => setIsSchemesOpen(!isSchemesOpen);

  return (
    <PageWrapper>
      {isMarketNewsOpen && <MarketNews onClose={toggleMarketNews} />}
      
      {isInsightsOpen && (
        <PopupOverlay onClick={toggleInsights}>
          <PopupWrapper onClick={(e) => e.stopPropagation()}>
            <PopupHeader>
              <CloseButton onClick={toggleInsights}>×</CloseButton>
            </PopupHeader>
            <FinancialInsights />
          </PopupWrapper>
        </PopupOverlay>
      )}

      {/* --- CONDITIONAL RENDERING FOR THE SCHEMES POPUP --- */}
      {isSchemesOpen && (
        <PopupOverlay onClick={toggleSchemes}>
          <PopupWrapper onClick={(e) => e.stopPropagation()}>
            <PopupHeader>
              <CloseButton onClick={toggleSchemes}>×</CloseButton>
            </PopupHeader>
            <Schemes />
          </PopupWrapper>
        </PopupOverlay>
      )}

      <HeaderContainer>
        <Header>Dashboard</Header>
        <ButtonContainer>
          <StyledButton onClick={toggleMarketNews}>
            📈 Market News
          </StyledButton>
          <StyledButton onClick={toggleInsights}>
            💡 Financial Insights
          </StyledButton>
          {/* --- BUTTON TO OPEN THE SCHEMES POPUP --- */}
          <StyledButton onClick={toggleSchemes}>
            📜 Schemes
          </StyledButton>
        </ButtonContainer>
      </HeaderContainer>

      <AISuggestionsWidget>
        <AISuggestions />
      </AISuggestionsWidget>

      {!isChatbotOpen && (
        <ChatbotToggleButton onClick={toggleChatbot}>
          💬
        </ChatbotToggleButton>
      )}
      {isChatbotOpen && <Chatbot closeChatbot={toggleChatbot} />}
    </PageWrapper>
  );
};

export default Dashboardpage;