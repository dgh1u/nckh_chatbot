const express = require("express");
const cors = require("cors");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mysql = require("mysql2");
const promptTemplate = require("./prompt"); // Import prompt

const app = express();

// Enable CORS so your Vue frontend (localhost:5173) can call this API
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());

app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Kết nối MySQL sử dụng mysql2 với promise
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Duonghieutkhd123",
  database: "motelroom_management",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Kết nối MySQL thất bại: ", err);
  } else {
    console.log("✅ Đã kết nối đến MySQL");
  }
});

// Cấu hình Gemini AI
const apiKey = "AIzaSyBcm7yx30JoPd0yFT0vj5SpQk-CrBHtYFM";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 1024,
};

// Route hiển thị giao diện
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// API để chatbot xử lý câu hỏi SQL và tạo câu trả lời dạng text
app.post("/query", async (req, res) => {
  const userQuestion = req.body.question;
  if (!userQuestion)
    return res.status(400).json({ error: "Thiếu câu hỏi đầu vào" });

  try {
    const prompt = promptTemplate(userQuestion);
    const chatSession = model.startChat({ generationConfig });
    const result = await chatSession.sendMessage(prompt);
    let sqlQuery = result.response
      .text()
      .trim()
      .replace(/```/g, "")
      .replace(/^sql\s*/i, "");
    console.log("🔍 SQL đã xử lý:", sqlQuery);

    const [queryResult] = await db.promise().query(sqlQuery);
    console.log("🔍 Kết quả truy vấn:", queryResult);

    const answerPrompt = `
Dữ liệu truy vấn từ cơ sở dữ liệu:

1. ${JSON.stringify(queryResult, null, 2)} (Kết quả truy vấn thành công)
2. ${JSON.stringify(sqlQuery)} (Cách truy vấn vào db của tôi)

Câu hỏi: ${userQuestion}
Câu trả lời: tạo ra câu trả lời có chủ ngữ, vị ngữ bằng tiếng Việt phù hợp với data nhận được từ queryResult. (lưu ý câu trả lời không đề cập đến thông tin lấy từ database mà chỉ thêm câu từ cho đủ chủ ngữ,vị ngữ) + (Format câu trả lời: Sử dụng các cách ngăn cách hợp lí cho từng dữ liệu, không dùng *) 
    `;
    const answerSession = model.startChat({ generationConfig });
    const answerResult = await answerSession.sendMessage(answerPrompt);
    const textAnswer = answerResult.response.text().trim();
    console.log("🔍 Câu trả lời sinh ra:", textAnswer);

    res.json({ query: sqlQuery, answer: textAnswer, data: queryResult });
  } catch (error) {
    console.error("❌ Lỗi xử lý:", error);
    res.status(500).json({ error: "Lỗi xử lý AI hoặc SQL" });
  }
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy trên cổng ${PORT}`);
});
