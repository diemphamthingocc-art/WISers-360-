
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeGoalEvidence = async (goalTitle: string, goalTarget: string, base64Image: string) => {
  const prompt = `
    Bạn là một trợ lý AI giáo dục chuyên nghiệp tại Wellspring Hanoi International Bilingual School. 
    Hãy phân tích hình ảnh minh chứng được cung cấp (bảng điểm, sổ liên lạc, chứng chỉ).

    Yêu cầu:
    1. Trích xuất tên môn học và điểm số (hoặc xếp loại Đạt/Chưa đạt) tương ứng (OCR).
    2. Định dạng dữ liệu trích xuất dưới dạng một đối tượng JSON đơn giản { "Tên môn": "Điểm" }.
    3. Đánh giá tổng quan sự tiến bộ so với mục tiêu: "${goalTarget}".
    4. Đưa ra lời khuyên ngắn gọn để cải thiện kết quả.

    Môn học cần chú ý (nếu có trong bảng): ESL Grammar, Math, Science, Computer Science, STEM, Toán, Ngữ văn, Khoa học Tự nhiên, Sử - Địa, Well-being.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/jpeg' } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isAchieved: { type: Type.BOOLEAN },
            extractedData: { type: Type.STRING, description: "Chuỗi JSON của các môn học và điểm số ví dụ: {\"Math\":\"9.0\",\"Science\":\"8.5\"}" },
            gapAnalysis: { type: Type.STRING },
            recommendations: { type: Type.STRING },
            statusText: { type: Type.STRING }
          },
          required: ["isAchieved", "extractedData", "gapAnalysis", "recommendations", "statusText"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
};