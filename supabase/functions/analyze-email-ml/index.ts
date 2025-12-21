import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rule-based analysis (fallback when ML is not available)
function ruleBasedAnalysis(emailContent: string) {
  const reasons: string[] = [];
  let riskScore = 0;
  const lowerContent = emailContent.toLowerCase();

  // Urgent language patterns
  const urgentPatterns = ['urgent', 'immediately', 'verify now', 'act now', 'action required', 'expire', 'suspended'];
  urgentPatterns.forEach(pattern => {
    if (lowerContent.includes(pattern)) {
      reasons.push(`Contains urgent language: "${pattern}"`);
      riskScore += 15;
    }
  });

  // Sensitive info requests
  const sensitivePatterns = ['password', 'otp', 'card number', 'cvv', 'pin', 'social security', 'bank account', 'credit card'];
  sensitivePatterns.forEach(pattern => {
    if (lowerContent.includes(pattern)) {
      reasons.push(`Asks for sensitive information: "${pattern}"`);
      riskScore += 20;
    }
  });

  // Shortened links
  const shortenedLinkPatterns = ['bit.ly', 'tinyurl', 'goo.gl', 't.co', 'ow.ly', 'is.gd', 'buff.ly'];
  shortenedLinkPatterns.forEach(pattern => {
    if (lowerContent.includes(pattern)) {
      reasons.push(`Contains shortened link: "${pattern}"`);
      riskScore += 15;
    }
  });

  // Excessive exclamation marks
  const exclamationCount = (emailContent.match(/!/g) || []).length;
  if (exclamationCount > 3) {
    reasons.push(`Excessive exclamation marks (${exclamationCount})`);
    riskScore += 10;
  }

  // Scam phrases
  const scamPhrases = [
    'won a prize', 'winner', 'lottery', 'free money', 'limited time',
    'confirm your account', 'verify your identity', 'click here now',
    'act fast', 'one time offer', 'congratulations', 'you have been selected',
    'claim your reward', 'inheritance', 'million dollars'
  ];
  scamPhrases.forEach(phrase => {
    if (lowerContent.includes(phrase)) {
      reasons.push(`Common scam phrase: "${phrase}"`);
      riskScore += 20;
    }
  });

  // Generic greetings
  if (lowerContent.includes('dear customer') || lowerContent.includes('dear user') || lowerContent.includes('dear valued')) {
    reasons.push('Generic greeting (Dear Customer/User)');
    riskScore += 10;
  }

  // Threat patterns
  const threatPatterns = ['account will be closed', 'legal action', 'arrest warrant', 'police', 'lawsuit'];
  threatPatterns.forEach(pattern => {
    if (lowerContent.includes(pattern)) {
      reasons.push(`Contains threat: "${pattern}"`);
      riskScore += 15;
    }
  });

  riskScore = Math.min(riskScore, 100);

  return {
    verdict: riskScore >= 30 ? 'suspicious' : 'safe',
    riskScore,
    reasons: reasons.length > 0 ? reasons : ['No suspicious patterns detected'],
    method: 'rule-based'
  };
}

// ML-enhanced analysis using AI
async function mlAnalysis(emailContent: string) {
  const ML_API_KEY = Deno.env.get('ML_API_KEY');
  
  if (!ML_API_KEY) {
    console.log('No ML_API_KEY, falling back to rule-based analysis');
    return null;
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a phishing email detection AI trained on datasets like the Kaggle Phishing Email Dataset and Enron Email Dataset.
            
Analyze the given email content and classify it as either SAFE or SUSPICIOUS.

Consider these phishing indicators:
- Urgent language or pressure tactics
- Requests for sensitive information (passwords, credit cards, SSN)
- Suspicious links or shortened URLs
- Generic greetings
- Grammar/spelling errors
- Threats or fear tactics
- Too-good-to-be-true offers
- Impersonation of legitimate companies
- Mismatched sender domains

Respond ONLY with valid JSON in this exact format:
{
  "verdict": "safe" or "suspicious",
  "riskScore": 0-100,
  "reasons": ["reason1", "reason2"],
  "confidence": 0.0-1.0
}`
          },
          {
            role: 'user',
            content: `Analyze this email for phishing:\n\n${emailContent}`
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI gateway error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response');
      return null;
    }

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not parse JSON from AI response');
      return null;
    }

    const result = JSON.parse(jsonMatch[0]);
    return {
      verdict: result.verdict,
      riskScore: result.riskScore,
      reasons: result.reasons,
      confidence: result.confidence,
      method: 'ml-ai'
    };
  } catch (error) {
    console.error('ML analysis error:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emailContent, useML = true } = await req.json();

    if (!emailContent || typeof emailContent !== 'string') {
      return new Response(
        JSON.stringify({ error: 'emailContent is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing email (${emailContent.length} chars), useML: ${useML}`);

    let result;
    
    if (useML) {
      // Try ML analysis first
      result = await mlAnalysis(emailContent);
      
      // Fallback to rule-based if ML fails
      if (!result) {
        console.log('ML analysis failed, using rule-based fallback');
        result = ruleBasedAnalysis(emailContent);
      }
    } else {
      // Use rule-based only
      result = ruleBasedAnalysis(emailContent);
    }

    console.log('Analysis result:', result);

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        analyzedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-email-ml:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
