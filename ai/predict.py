import sys
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression

def predict_price_trend(history_data):
    try:
        # Load and parse data
        df = pd.DataFrame(history_data)
        if len(df) < 2:
            return {
                "status": "error",
                "message": "Insufficient history data. Need at least 2 points."
            }

        # Convert date to datetime objects and sort
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')

        # Convert price to float
        df['price'] = df['price'].astype(float)

        # Get Unix timestamps as features
        df['timestamp'] = df['date'].view(np.int64) // 10**9

        # Fit Linear Regression
        X = df['timestamp'].values.reshape(-1, 1)
        y = df['price'].values

        # Normalize X to avoid large numbers issues
        x_min = X.min()
        X_norm = X - x_min

        model = LinearRegression()
        model.fit(X_norm, y)

        # Current state
        current_price = y[-1]
        historical_min = y.min()
        historical_max = y.max()

        # Slope of the regression line (price change per second)
        slope = model.coef_[0]

        # Predict future 7 days (convert days to seconds)
        future_days = 7
        last_timestamp = X[-1]
        
        predictions = []
        now_date = df['date'].iloc[-1]
        
        for day in range(1, future_days + 1):
            future_date = now_date + timedelta(days=day)
            future_ts = (last_timestamp + (day * 86400)) - x_min
            pred_price = model.predict(np.array([[future_ts]]))[0]
            # Ensure price doesn't drop below 0
            pred_price = max(1, round(pred_price))
            
            predictions.append({
                "date": future_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "price": pred_price
            })

        # Calculate expected price drop or increase
        final_predicted_price = predictions[-1]["price"]
        expected_change = final_predicted_price - current_price
        
        # Decide recommendation
        # If trend is downward, recommend waiting. If trend is upward or price is very close to historical low, buy.
        price_range = historical_max - historical_min if historical_max > historical_min else 1
        proximity_to_low = (current_price - historical_min) / price_range # 0 = lowest, 1 = highest

        if expected_change < -0.01 * current_price: # Price is predicted to fall more than 1%
            recommendation = "Wait"
            confidence = min(90, max(50, round(abs(expected_change) / current_price * 1000)))
            days_to_wait = 7
            advice = f"Price is projected to drop by ₹{abs(round(expected_change))} in the next 7 days. Better to wait!"
        elif proximity_to_low <= 0.15: # Price is already close to historical low (within bottom 15%)
            recommendation = "Buy Now"
            confidence = 95
            days_to_wait = 0
            advice = f"Product is currently near its historical lowest price (₹{historical_min}). Grab it now!"
        elif expected_change > 0.01 * current_price: # Price is predicted to rise more than 1%
            recommendation = "Buy Now"
            confidence = min(90, max(60, round(expected_change / current_price * 1000)))
            days_to_wait = 0
            advice = f"Price is projected to rise by ₹{round(expected_change)} soon. Buy now before it increases!"
        else: # Stable price
            recommendation = "Buy Now"
            confidence = 75
            days_to_wait = 0
            advice = f"Price is stable. Current price is reasonable based on market trends."

        return {
            "status": "success",
            "currentPrice": current_price,
            "historicalLow": historical_min,
            "historicalHigh": historical_max,
            "predictedChange": round(expected_change, 2),
            "recommendation": recommendation,
            "confidence": confidence,
            "daysToWait": days_to_wait,
            "advice": advice,
            "predictions": predictions
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    # Read price history from stdin
    try:
        input_data = sys.stdin.read()
        if not input_data.strip():
            print(json.dumps({"status": "error", "message": "No input provided"}))
            sys.exit(1)
            
        history = json.loads(input_data)
        result = predict_price_trend(history)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"status": "error", "message": f"Startup failed: {str(e)}"}))
        sys.exit(1)
