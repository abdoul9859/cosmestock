import { GoogleGenAI } from "@google/genai";
import { Product } from "../types";

const apiKey = process.env.API_KEY || '';
// Initialize securely - in a real app, ensure this handles missing keys gracefully
const ai = new GoogleGenAI({ apiKey });

export const getInventoryInsights = async (products: Product[]): Promise<string> => {
  if (!apiKey) return "Clé API manquante. Veuillez configurer l'API Key.";

  // Summarize data to send to Gemini to save tokens
  const summary = products.map(p => 
    `- ${p.name} (${p.categoryName}): Qté ${p.quantity}, Prix ${p.price}€${p.expirationDate ? `, Expire le ${p.expirationDate}` : ''}`
  ).join('\n');

  const prompt = `
    Agis comme un expert en gestion de boutique de cosmétiques et mode.
    Voici mon inventaire actuel :
    ${summary}

    Analyse ces données et donne-moi 3 conseils courts et précis (maximum 2 phrases par conseil) pour améliorer ma gestion.
    Concentre-toi sur :
    1. Les produits à mettre en promotion (proche expiration ou sur-stock).
    2. Les réapprovisionnements urgents.
    3. Une suggestion marketing basée sur mes produits.

    Réponds en français, avec un ton encourageant et professionnel. Formate la réponse en Markdown simple (listes à puces).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Aucun conseil disponible pour le moment.";
  } catch (error) {
    console.error("Erreur Gemini:", error);
    return "Désolé, je ne peux pas analyser votre stock pour le moment (Erreur de connexion).";
  }
};

export const generateMarketingDescription = async (productName: string, category: string): Promise<string> => {
  if (!apiKey) return "";

  const prompt = `Rédige une description courte, attirante et vendeuse (1 phrase) pour ce produit : "${productName}" (Catégorie: ${category}). En français.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    return "";
  }
}