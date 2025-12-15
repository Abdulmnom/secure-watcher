export interface EmailAnalysisResult {
  verdict: 'safe' | 'suspicious';
  riskScore: number;
  reasons: string[];
}

export function analyzeEmail(emailContent: string): EmailAnalysisResult {
  const reasons: string[] = [];
  let riskScore = 0;

  const lowerContent = emailContent.toLowerCase();

  // Check for urgent language
  const urgentPatterns = ['urgent', 'immediately', 'verify now', 'act now', 'action required', 'expire', 'suspended'];
  urgentPatterns.forEach(pattern => {
    if (lowerContent.includes(pattern)) {
      reasons.push(`Contains urgent language: "${pattern}"`);
      riskScore += 15;
    }
  });

  // Check for sensitive info requests
  const sensitivePatterns = ['password', 'otp', 'card number', 'cvv', 'pin', 'social security', 'bank account', 'credit card'];
  sensitivePatterns.forEach(pattern => {
    if (lowerContent.includes(pattern)) {
      reasons.push(`Asks for sensitive information: "${pattern}"`);
      riskScore += 20;
    }
  });

  // Check for shortened links
  const shortenedLinkPatterns = ['bit.ly', 'tinyurl', 'goo.gl', 't.co', 'ow.ly', 'is.gd', 'buff.ly'];
  shortenedLinkPatterns.forEach(pattern => {
    if (lowerContent.includes(pattern)) {
      reasons.push(`Contains shortened link: "${pattern}"`);
      riskScore += 15;
    }
  });

  // Check for excessive exclamation marks
  const exclamationCount = (emailContent.match(/!/g) || []).length;
  if (exclamationCount > 3) {
    reasons.push(`Excessive exclamation marks (${exclamationCount})`);
    riskScore += 10;
  }

  // Check for common scam phrases
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

  // Check for suspicious sender patterns in content
  if (lowerContent.includes('dear customer') || lowerContent.includes('dear user') || lowerContent.includes('dear valued')) {
    reasons.push('Generic greeting (Dear Customer/User)');
    riskScore += 10;
  }

  // Check for threats
  const threatPatterns = ['account will be closed', 'legal action', 'arrest warrant', 'police', 'lawsuit'];
  threatPatterns.forEach(pattern => {
    if (lowerContent.includes(pattern)) {
      reasons.push(`Contains threat: "${pattern}"`);
      riskScore += 15;
    }
  });

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);

  return {
    verdict: riskScore >= 30 ? 'suspicious' : 'safe',
    riskScore,
    reasons: reasons.length > 0 ? reasons : ['No suspicious patterns detected']
  };
}

// Analyze email address format for registration
export function analyzeEmailAddress(email: string): EmailAnalysisResult {
  const reasons: string[] = [];
  let riskScore = 0;

  const lowerEmail = email.toLowerCase();

  // Check for disposable email domains
  const disposableDomains = ['tempmail', 'throwaway', 'guerrillamail', 'mailinator', '10minutemail', 'fakeinbox'];
  disposableDomains.forEach(domain => {
    if (lowerEmail.includes(domain)) {
      reasons.push(`Disposable email domain detected: "${domain}"`);
      riskScore += 40;
    }
  });

  // Check for suspicious patterns in email
  if (/\d{5,}/.test(lowerEmail)) {
    reasons.push('Email contains many consecutive numbers');
    riskScore += 15;
  }

  // Check for very long local part
  const localPart = lowerEmail.split('@')[0];
  if (localPart && localPart.length > 30) {
    reasons.push('Unusually long email local part');
    riskScore += 10;
  }

  // Check for suspicious keywords
  const suspiciousKeywords = ['admin', 'support', 'help', 'service', 'security', 'verify'];
  suspiciousKeywords.forEach(keyword => {
    if (localPart?.includes(keyword)) {
      reasons.push(`Suspicious keyword in email: "${keyword}"`);
      riskScore += 10;
    }
  });

  riskScore = Math.min(riskScore, 100);

  return {
    verdict: riskScore >= 30 ? 'suspicious' : 'safe',
    riskScore,
    reasons: reasons.length > 0 ? reasons : ['Email address appears legitimate']
  };
}
