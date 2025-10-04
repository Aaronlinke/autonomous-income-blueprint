
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics import mean_squared_error, accuracy_score
import json
import sys

class MLPredictor:
    def __init__(self):
        # Simulierte historische Daten für Opportunities
        self.data = pd.DataFrame({
            'id': range(1, 101),
            'category': np.random.choice(['Digital Product', 'Affiliate Marketing', 'Content Creation'], 100),
            'market_demand': np.random.choice(['Hoch', 'Mittel', 'Niedrig'], 100),
            'competition_level': np.random.choice(['Hoch', 'Mittel', 'Niedrig'], 100),
            'estimated_cost': np.random.randint(50, 500, 100),
            'estimated_revenue': np.random.randint(1000, 10000, 100),
            'actual_revenue': np.random.randint(800, 12000, 100),
            'actual_cost': np.random.randint(40, 600, 100),
            'roi': np.random.uniform(1.0, 10.0, 100),
            'risk_level': np.random.choice(['Niedrig', 'Mittel', 'Hoch'], 100),
            'success': np.random.choice([0, 1], 100, p=[0.3, 0.7]) # 0=Fail, 1=Success
        })
        # Berechne ROI aus tatsächlichen Werten
        self.data['actual_roi'] = (self.data['actual_revenue'] - self.data['actual_cost']) / self.data['actual_cost']
        self.data['actual_roi'] = self.data['actual_roi'].replace([np.inf, -np.inf], np.nan).fillna(0)

        self.model_roi = None
        self.model_risk = None
        self.model_success = None
        self.train_models()

    def preprocess_data(self, df):
        df_encoded = pd.get_dummies(df, columns=['category', 'market_demand', 'competition_level'], drop_first=True)
        return df_encoded

    def train_models(self):
        # Daten vorbereiten
        X = self.preprocess_data(self.data.drop(columns=['id', 'estimated_revenue', 'actual_revenue', 'actual_cost', 'roi', 'actual_roi', 'risk_level', 'success']))
        y_roi = self.data['actual_roi']
        y_risk = self.data['risk_level'].map({'Niedrig': 0, 'Mittel': 1, 'Hoch': 2})
        y_success = self.data['success']

        # Sicherstellen, dass alle Spalten für X existieren
        # Dies ist wichtig, wenn neue Daten für die Vorhersage kommen
        self.feature_names = X.columns.tolist()

        # ROI-Vorhersagemodell
        self.model_roi = RandomForestRegressor(n_estimators=100, random_state=42)
        self.model_roi.fit(X, y_roi)

        # Risiko-Klassifikationsmodell
        self.model_risk = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model_risk.fit(X, y_risk)

        # Erfolgs-Klassifikationsmodell
        self.model_success = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model_success.fit(X, y_success)

    def predict_opportunity(self, opportunity_data):
        # Konvertiere Eingabedaten in DataFrame
        input_df = pd.DataFrame([opportunity_data])
        
        # Preprocessing
        input_encoded = self.preprocess_data(input_df)
        
        # Sicherstellen, dass alle Features des Trainingsdatensatzes vorhanden sind
        for col in self.feature_names:
            if col not in input_encoded.columns:
                input_encoded[col] = 0
        input_encoded = input_encoded[self.feature_names] # Reihenfolge der Spalten anpassen

        # Vorhersagen
        predicted_roi = self.model_roi.predict(input_encoded)[0]
        predicted_risk_label = self.model_risk.predict(input_encoded)[0]
        predicted_success_proba = self.model_success.predict_proba(input_encoded)[0][1] # Wahrscheinlichkeit für Erfolg (Klasse 1)

        risk_map = {0: 'Niedrig', 1: 'Mittel', 2: 'Hoch'}
        predicted_risk = risk_map[predicted_risk_label]

        return {
            'predicted_roi': round(float(predicted_roi), 2),
            'predicted_risk': predicted_risk,
            'predicted_success_probability': round(float(predicted_success_proba), 2)
        }

if __name__ == '__main__':
    predictor = MLPredictor()
    
    # Beispielaufruf über Kommandozeile
    if len(sys.argv) > 1:
        input_json = sys.argv[1]
        opportunity_data = json.loads(input_json)
        predictions = predictor.predict_opportunity(opportunity_data)
        print(json.dumps(predictions))
    else:
        # Beispiel für direkte Vorhersage
        sample_opportunity = {
            'category': 'Digital Product',
            'market_demand': 'Hoch',
            'competition_level': 'Mittel',
            'estimated_cost': 200
        }
        predictions = predictor.predict_opportunity(sample_opportunity)
        print(json.dumps(predictions))


