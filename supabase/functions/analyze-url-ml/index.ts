import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUSPICIOUS_KEYWORDS = [
  "login", "verify", "update", "secure", "account", "bank", "free", "gift",
  "password", "confirm", "urgent", "click", "winner", "prize", "paypal", "amazon"
];

const SUSPICIOUS_TLDS = [".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".work", ".buzz", ".click"];

// Feature extraction for Decision Tree
function extractUrlFeatures(url: string): number[] {
  const normalizedUrl = url.toLowerCase().trim();
  return [
    normalizedUrl.includes('@') ? 1 : 0,  // @ symbol
    /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(normalizedUrl) ? 1 : 0,  // IP address
    SUSPICIOUS_KEYWORDS.some(kw => normalizedUrl.includes(kw)) ? 1 : 0,  // Suspicious keywords
    normalizedUrl.length > 80 ? 1 : 0,  // Long URL
    SUSPICIOUS_TLDS.some(tld => normalizedUrl.includes(tld)) ? 1 : 0,  // Suspicious TLD
  ];
}

// Simple Decision Tree prediction for URLs
function predictUrlWithDecisionTree(features: number[]): { verdict: 'safe' | 'suspicious'; riskScore: number; reasons: string[] } {
  let riskScore = 0;
  const reasons: string[] = [];

  if (features[0] === 1) { riskScore += 25; reasons.push('Contains @ symbol'); }
  if (features[1] === 1) { riskScore += 30; reasons.push('Uses IP address'); }
  if (features[2] === 1) { riskScore += 20; reasons.push('Contains suspicious keywords'); }
  if (features[3] === 1) { riskScore += 15; reasons.push('Unusually long URL'); }
  if (features[4] === 1) { riskScore += 15; reasons.push('Uses suspicious TLD'); }

  const verdict = riskScore >= 40 ? 'suspicious' : 'safe';
  if (reasons.length === 0) reasons.push('No suspicious patterns detected');

  return { verdict, riskScore: Math.min(riskScore, 100), reasons };
}

// Rule-based analysis (fallback)
function ruleBasedAnalysis(url: string) {
  const reasons: string[] = [];
  let riskScore = 0;
  const normalizedUrl = url.toLowerCase().trim();

  // Check for @ symbol
  if (normalizedUrl.includes("@")) {
    reasons.push("Contains @ symbol (potential credential injection)");
    riskScore += 25;
  }

  // Check for many subdomains
  try {
    const urlObj = new URL(normalizedUrl.startsWith("http") ? normalizedUrl : `http://${normalizedUrl}`);
    const hostParts = urlObj.hostname.split(".");
    if (hostParts.length > 4) {
      reasons.push(`Too many subdomains (${hostParts.length - 1} levels detected)`);
      riskScore += 20;
    }
  } catch {
    reasons.push("Malformed URL structure");
    riskScore += 15;
  }

  // Check for IP address
  const ipPattern = /(\d{1,3}\.){3}\d{1,3}/;
  if (ipPattern.test(normalizedUrl)) {
    reasons.push("Uses IP address instead of domain name");
    riskScore += 30;
  }

  // Check for suspicious keywords
  const foundKeywords = SUSPICIOUS_KEYWORDS.filter(kw => normalizedUrl.includes(kw));
  if (foundKeywords.length > 0) {
    reasons.push(`Contains suspicious keywords: ${foundKeywords.join(", ")}`);
    riskScore += Math.min(foundKeywords.length * 10, 25);
  }

  // Check for encoded characters
  const encodedCount = (normalizedUrl.match(/%[0-9A-Fa-f]{2}/g) || []).length;
  if (encodedCount > 3) {
    reasons.push(`Excessive URL encoding (${encodedCount} encoded characters)`);
    riskScore += 15;
  }

  // Check URL length
  if (normalizedUrl.length > 80) {
    reasons.push(`URL is unusually long (${normalizedUrl.length} characters)`);
    riskScore += 15;
  }

  // Check for suspicious TLDs
  if (SUSPICIOUS_TLDS.some(tld => normalizedUrl.includes(tld))) {
    reasons.push("Uses suspicious top-level domain");
    riskScore += 15;
  }

  // Check for homograph characters
  const homographPattern = /[а-яА-Я]/;
  if (homographPattern.test(url)) {
    reasons.push("Contains homograph characters (potential IDN attack)");
    riskScore += 30;
  }

  riskScore = Math.min(riskScore, 100);

  return {
    verdict: riskScore >= 30 ? 'suspicious' : 'safe',
    riskScore,
    reasons: reasons.length > 0 ? reasons : ['No suspicious patterns detected'],
    method: 'rule-based'
  };
}

// Hybrid analysis for URLs
async function hybridUrlAnalysis(url: string) {
  const features = extractUrlFeatures(url);
  const treeResult = predictUrlWithDecisionTree(features);

  if (treeResult.verdict === 'suspicious') {
    const geminiResult = await mlAnalysis(url);
    if (geminiResult) {
      return {
        ...geminiResult,
        method: 'hybrid-tree+gemini',
        primaryMethod: 'decision-tree',
        secondaryMethod: 'gemini'
      };
    }
  }

  return {
    ...treeResult,
    method: 'hybrid-tree'
  };
}

// ML-enhanced analysis using AI
async function mlAnalysis(url: string) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.log('No LOVABLE_API_KEY, falling back to rule-based analysis');
    return null;
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a URL security analyzer AI trained to detect malicious and phishing URLs.

Analyze the given URL and classify it as either SAFE or SUSPICIOUS.

Consider these phishing/malicious URL indicators:
- Use of IP addresses instead of domain names
- Suspicious or misspelled domain names (typosquatting)
- Excessive subdomains
- URL contains @ symbol (credential injection)
- Suspicious TLDs (.tk, .ml, .ga, .xyz, etc.)
- URL encoding tricks (%00, %2e, etc.)
- Homograph/IDN attacks (look-alike characters)
- Suspicious path keywords (login, verify, secure, bank, etc.)
- Unusually long URLs
- Shortened URLs (bit.ly, tinyurl, etc.)
- Brand impersonation in subdomain
- Data URLs or javascript: schemes
- Port numbers in URLs
- Double extensions (file.pdf.exe)

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
            content: `Analyze this URL for security threats:\n\n${url}`
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
      verdict: result.verdict.toLowerCase(),
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

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, mlMethod = 'gemini' } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'url is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing URL (${url.length} chars), mlMethod: ${mlMethod}`);

    let result;

    if (mlMethod === 'decision-tree') {
      result = predictUrlWithDecisionTree(extractUrlFeatures(url));
    } else if (mlMethod === 'gemini') {
      result = await mlAnalysis(url);
      if (!result) {
        console.log('Gemini analysis failed, using rule-based fallback');
        result = ruleBasedAnalysis(url);
      }
    } else if (mlMethod === 'hybrid') {
      result = await hybridUrlAnalysis(url);
      if (!result) {
        console.log('Hybrid analysis failed, using rule-based fallback');
        result = ruleBasedAnalysis(url);
      }
    } else {
      result = ruleBasedAnalysis(url);
    }

    console.log('Analysis result:', result);

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        modeUsed: mlMethod,
        analyzedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-url-ml:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
