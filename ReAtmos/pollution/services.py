import datetime
import pandas as pd
import random


class ForecastService:
    @staticmethod
    def predict(historical_data, days=7):
        if not historical_data:
            return []

        df = pd.DataFrame(historical_data)
        df["date"] = pd.to_datetime(df["date"])
        df = df.set_index("date").sort_index()

        if len(df) < 5:
            last_val = df.iloc[-1]["value"]
            trend = 0
        else:
            recent = df.iloc[-5:]
            last_val = recent["value"].mean()
            trend = (recent.iloc[-1]["value"] - recent.iloc[0]["value"]) / 5

        predictions = []
        last_date = df.index[-1]

        curr_val = float(last_val)
        for i in range(1, days + 1):
            next_date = last_date + datetime.timedelta(days=i)
            curr_val += trend * 0.5
            curr_val = max(0, curr_val)

            predictions.append(
                {
                    "date": next_date.strftime("%Y-%m-%d"),
                    "value": round(curr_val, 2),
                    "is_forecast": True,
                }
            )

        return predictions


class DummyPollutionService:
    """
    Creates dummy historical pollution values.
    """

    @staticmethod
    def generate_history(days=30, start_value=100):
        end_date = datetime.date.today()
        start_date = end_date - datetime.timedelta(days=days)

        history = []
        base = start_value + random.uniform(-10, 10)

        for i in range(days):
            d = start_date + datetime.timedelta(days=i)
            base += random.uniform(-3, 3)
            history.append({"date": d.strftime("%Y-%m-%d"), "value": round(max(0, base), 2)})

        return history
