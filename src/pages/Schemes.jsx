import React, { useState, useEffect } from "react";
import styled from "styled-components";

// ---------- STYLED COMPONENTS ----------
const SchemesWrapper = styled.div`
  padding: 2rem;
  text-align: center;
  background: #1a1a2e;
  border-radius: 15px;
  min-height: 300px;
`;
const Title = styled.h2`
  font-size: 2.5rem;
  color: #fff;
  margin-bottom: 2rem;
`;
const SchemeList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
`;
const SchemeCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  text-align: left;
  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
`;
const SchemeTitle = styled.h3`
  font-size: 1.5rem;
  color: #fff;
  margin-bottom: 1rem;
`;
const SchemeDescription = styled.p`
  color: #ccc;
  line-height: 1.5;
`;
const StatusMessage = styled.p`
  color: #ff6b6b;
  font-size: 1.2rem;
  margin-top: 2rem;
`;

// ---------- MAIN COMPONENT ----------
const Schemes = () => {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🌍 Your backend DeepSeek integration endpoint
  const API_URL = "https://finovo.techvaseeegrah.comapi/schemes"; // Your existing route
  const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"; // DeepSeek public endpoint

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        setLoading(true);
        setError(null);

        // --- Fetch schemes from your database API ---
        const localSchemesResponse = await fetch(API_URL);
        const localSchemes = await localSchemesResponse.json();

        // --- Fetch real-time Indian government scheme updates from DeepSeek AI ---
        const deepseekResponse = await fetch(DEEPSEEK_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.REACT_APP_DEEPSEEK_API_KEY}`, // ⚠️ store your DeepSeek key in .env file
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              {
                role: "system",
                content:
                  "You are an AI that analyzes Indian Government updates and returns the latest schemes in JSON format.",
              },
              {
                role: "user",
                content:
                  "Give me the 5 most recently announced Indian government schemes with title and short description.",
              },
            ],
          }),
        });

        const deepseekData = await deepseekResponse.json();
        const aiText = deepseekData?.choices?.[0]?.message?.content;

        // Try to parse DeepSeek AI text to JSON safely
        let aiSchemes = [];
        try {
          aiSchemes = JSON.parse(aiText);
        } catch {
          // Fallback if DeepSeek returns plain text, convert it into structured format
          aiSchemes = aiText
            ?.split("\n")
            ?.filter((line) => line.trim() !== "")
            ?.map((line, i) => ({
              _id: `ai-${i}`,
              title: line.split(":")[0] || `Scheme ${i + 1}`,
              description: line.split(":")[1] || line,
            }));
        }

        // Combine local + AI schemes and remove duplicates
        const mergedSchemes = [
          ...(localSchemes.data || []),
          ...(aiSchemes || []),
        ].filter(
          (scheme, index, self) =>
            index === self.findIndex((s) => s.title === scheme.title)
        );

        setSchemes(mergedSchemes);
      } catch (err) {
        console.error("Error fetching schemes:", err);
        setError("Unable to fetch scheme updates. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSchemes();

    // 🔁 Auto-refresh every 5 minutes for new AI updates
    const interval = setInterval(fetchSchemes, 300000);
    return () => clearInterval(interval);
  }, []);

  // --- RENDERING LOGIC ---
  const renderContent = () => {
    if (loading)
      return <StatusMessage style={{ color: "#ccc" }}>Loading...</StatusMessage>;
    if (error) return <StatusMessage>Error: {error}</StatusMessage>;
    if (schemes.length === 0)
      return (
        <StatusMessage style={{ color: "#ccc" }}>
          No schemes available.
        </StatusMessage>
      );

    return (
      <SchemeList>
        {schemes.map((scheme) => (
          <SchemeCard key={scheme._id}>
            <SchemeTitle>{scheme.title}</SchemeTitle>
            <SchemeDescription>{scheme.description}</SchemeDescription>
          </SchemeCard>
        ))}
      </SchemeList>
    );
  };

  return (
    <SchemesWrapper>
      <Title> Government Scheme Updates</Title>
      {renderContent()}
    </SchemesWrapper>
  );
};

export default Schemes;
