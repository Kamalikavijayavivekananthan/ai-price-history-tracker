const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Native JavaScript fallback for Linear Regression price prediction.
 * Ensures the app works perfectly even if Python is not configured on the target system.
 * @param {Array} history - Array of { price: number, date: Date|string }
 */
const runJsFallback = (history) => {
  try {
    if (history.length < 2) {
      return {
        status: 'error',
        message: 'Insufficient history data. Need at least 2 points.',
      };
    }

    // Sort history by date ascending
    const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Prepare arrays
    const prices = sorted.map((h) => Number(h.price));
    const dates = sorted.map((h) => new Date(h.date));
    const timestamps = dates.map((d) => Math.floor(d.getTime() / 1000));

    // Normalize X to prevent overflow issues
    const xMin = Math.min(...timestamps);
    const X = timestamps.map((t) => t - xMin);
    const y = prices;
    const n = X.length;

    // Linear Regression Formula: y = mx + c
    // m = (n*sum(xy) - sum(x)*sum(y)) / (n*sum(x^2) - sum(x)^2)
    // c = (sum(y) - m*sum(x)) / n
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += X[i];
      sumY += y[i];
      sumXY += X[i] * y[i];
      sumXX += X[i] * X[i];
    }

    const denominator = n * sumXX - sumX * sumX;
    const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
    const intercept = (sumY - slope * sumX) / n;

    // Current metrics
    const currentPrice = y[n - 1];
    const historicalLow = Math.min(...y);
    const historicalHigh = Math.max(...y);

    // Predict next 7 days
    const predictions = [];
    const lastTimestamp = timestamps[n - 1];
    const nowLocalDate = dates[n - 1];

    for (let day = 1; day <= 7; day++) {
      const futureDate = new Date(nowLocalDate);
      futureDate.setDate(nowLocalDate.getDate() + day);
      
      const futureTs = (lastTimestamp + day * 86400) - xMin;
      let predPrice = slope * futureTs + intercept;
      predPrice = Math.max(1, Math.round(predPrice));

      predictions.push({
        date: futureDate.toISOString(),
        price: predPrice,
      });
    }

    const finalPredictedPrice = predictions[predictions.length - 1].price;
    const expectedChange = finalPredictedPrice - currentPrice;

    // Recommendation logic
    const priceRange = historicalHigh - historicalLow > 0 ? historicalHigh - historicalLow : 1;
    const proximityToLow = (currentPrice - historicalLow) / priceRange;

    let recommendation = 'Buy Now';
    let confidence = 75;
    let daysToWait = 0;
    let advice = 'Price is stable. Current price is reasonable based on market trends.';

    if (expectedChange < -0.01 * currentPrice) {
      // Price drops more than 1%
      recommendation = 'Wait';
      confidence = Math.min(90, Math.max(50, Math.round((Math.abs(expectedChange) / currentPrice) * 1000)));
      daysToWait = 7;
      advice = `Price is projected to drop by ₹${Math.abs(Math.round(expectedChange))} in the next 7 days. Better to wait!`;
    } else if (proximityToLow <= 0.15) {
      // Close to historic low
      recommendation = 'Buy Now';
      confidence = 95;
      daysToWait = 0;
      advice = `Product is currently near its historical lowest price (₹${historicalLow}). Grab it now!`;
    } else if (expectedChange > 0.01 * currentPrice) {
      // Price rises more than 1%
      recommendation = 'Buy Now';
      confidence = Math.min(90, Math.max(60, Math.round((expectedChange / currentPrice) * 1000)));
      daysToWait = 0;
      advice = `Price is projected to rise by ₹${Math.round(expectedChange)} soon. Buy now before it increases!`;
    }

    return {
      status: 'success',
      currentPrice,
      historicalLow,
      historicalHigh,
      predictedChange: parseFloat(expectedChange.toFixed(2)),
      recommendation,
      confidence,
      daysToWait,
      advice,
      predictions,
      engine: 'javascript_fallback'
    };
  } catch (error) {
    return {
      status: 'error',
      message: `JS Fallback prediction failure: ${error.message}`,
    };
  }
};

const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy' });

/**
 * Runs prediction by calling Groq LLM, falling back to JS math for missing keys.
 * @param {Array} history - Array of price history records
 */
const predictPrice = async (history) => {
  // Always get the JS mathematical baseline for predictions array & graph line
  const baseResult = runJsFallback(history);
  
  if (baseResult.status === 'error') {
    return baseResult;
  }

  // If no Groq API Key is configured, just return the math baseline
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'dummy') {
    console.warn('No GROQ_API_KEY found, using JS mathematical fallback for advice.');
    return baseResult;
  }

  try {
    const historyContext = history.slice(-10).map(h => `Date: ${new Date(h.date).toLocaleDateString()}, Lowest Price: ₹${h.price}`).join('\\n');
    const prompt = `
      You are an expert AI shopping assistant and price analyst. 
      Analyze the following recent price history of an ecommerce product in India:
      ${historyContext}
      
      The current price is ₹${baseResult.currentPrice}. The historical lowest price recorded is ₹${baseResult.historicalLow}.
      Based on e-commerce trends, predict if the user should "Buy Now" or "Wait" for a price drop.
      
      Respond ONLY with a valid JSON object in the exact format:
      {
        "recommendation": "Buy Now" or "Wait",
        "confidence": <number between 50 and 99>,
        "advice": "<1-2 sentence explanation of why they should buy or wait>",
        "daysToWait": <0 if Buy Now, or estimated days to wait if Wait>
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const llmResponse = JSON.parse(chatCompletion.choices[0]?.message?.content);

    // Override the mathematical advice with the LLM's intelligent advice
    return {
      ...baseResult,
      recommendation: llmResponse.recommendation || baseResult.recommendation,
      confidence: llmResponse.confidence || baseResult.confidence,
      advice: llmResponse.advice || baseResult.advice,
      daysToWait: llmResponse.daysToWait !== undefined ? llmResponse.daysToWait : baseResult.daysToWait,
      engine: 'groq_llm'
    };

  } catch (error) {
    console.warn('Groq LLM prediction failed:', error.message, 'Falling back to JS math.');
    return baseResult;
  }
};

module.exports = {
  predictPrice,
};
