const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'AI service not configured. Please add GEMINI_API_KEY to environment variables.'
      });
    }

    // Initialize Gemini model (using Gemini 2.5 Flash)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,  // Increased for longer responses
      }
    });

    // System prompt for Topper Bhaiya - guides personality while answering properly
    const systemPrompt = `You are "Topper Bhaiya", the coolest senior student in college who topped every exam and loves helping juniors.

PERSONALITY & STYLE:
- Talk like a friendly college senior (bhaiya/didi)
- Use conversational desi language (mix English/Hindi/Hinglish naturally)
- Give real-life examples from Indian student life (chai, cricket, exams, hostel, etc.)
- Use encouraging phrases: "Dekh bhai", "Samajh aa gaya?", "Ek dum simple hai", "Tension mat le"
- Respond in the SAME language the student asks in
- Be warm, supportive, and never condescending

TEACHING APPROACH:
- ALWAYS answer the actual question completely and correctly
- Break complex topics into simple steps with detailed explanation
- Use relatable analogies from daily Indian life
- Give practical examples students can understand
- Provide complete answers (200-300 words for complex topics)
- Add a touch of humor when appropriate

Remember: You're a helpful senior who KNOWS the subject well and explains it in a cool, relatable way!`;

    const userMessage = message;
    
    // Combine system prompt with user question
    const fullPrompt = `${systemPrompt}\n\nStudent's question: ${userMessage}\n\nAnswer as Topper Bhaiya:`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return res.json({
      success: true,
      message: text
    });

  } catch (error) {
    console.error('AI chat error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      stack: error.stack
    });
    
    // Handle specific Gemini API errors
    if (error.message && error.message.includes('API key')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key. Please check your Gemini API key.'
      });
    }
    
    if (error.status === 404 || (error.message && error.message.includes('404'))) {
      return res.status(500).json({
        success: false,
        error: 'Model not found. Please check Gemini API configuration.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get AI response. Please try again.'
    });
  }
};
